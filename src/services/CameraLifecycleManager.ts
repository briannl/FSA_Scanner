import { BrowserMultiFormatReader, IScannerControls, BrowserCodeReader } from "@zxing/browser";
import { normalizeBarcode } from "../utils/barcodeUtils";

export type ScannerLifecycleState =
  | "idle"
  | "starting"
  | "scanning"
  | "stopping"
  | "error";

export interface CameraLifecycleListener {
  onStateChange?: (state: ScannerLifecycleState) => void;
  onError?: (errorMessage: string, isPermissionDenied: boolean) => void;
  onBarcodeDetected?: (barcode: string) => void;
}

/**
 * Centralized, race-condition-safe Camera Lifecycle Manager for in-store scanning.
 * Solves iOS Safari / PWA camera retention, orphaned MediaStream tracks, and startup race conditions.
 */
export class CameraLifecycleManager {
  private state: ScannerLifecycleState = "idle";
  private stream: MediaStream | null = null;
  private controls: IScannerControls | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private sessionCounter = 0;
  private listeners: CameraLifecycleListener = {};

  constructor(listeners: CameraLifecycleListener = {}) {
    this.listeners = listeners;
  }

  public setListeners(listeners: CameraLifecycleListener): void {
    this.listeners = listeners;
  }

  public getState(): ScannerLifecycleState {
    return this.state;
  }

  public getSessionId(): number {
    return this.sessionCounter;
  }

  public isStreamActive(): boolean {
    if (!this.stream) return false;
    return this.stream.getTracks().some((t) => t.readyState === "live");
  }

  public getLiveTrackCount(): number {
    if (!this.stream) return 0;
    return this.stream.getTracks().filter((t) => t.readyState === "live").length;
  }

  private setState(newState: ScannerLifecycleState): void {
    this.state = newState;
    this.listeners.onStateChange?.(newState);
  }

  /**
   * Idempotently stops any active camera stream, controls loop, and video binding.
   * Completely releases iOS/Safari camera pipeline and MediaStreamTracks.
   */
  public stop(): void {
    // Invalidate any in-flight startup promises by bumping the session token
    this.sessionCounter++;

    if (this.state === "stopping" || this.state === "idle") {
      this.cleanupHardwareResources();
      return;
    }

    this.setState("stopping");
    this.cleanupHardwareResources();
    this.setState("idle");
  }

  /**
   * Shuts down all hardware streams, scanner controls, and detaches HTML5 video.
   */
  private cleanupHardwareResources(): void {
    // 1. Stop ZXing Scanner Controls
    if (this.controls) {
      try {
        this.controls.stop();
      } catch (e) {
        console.warn("[CameraLifecycleManager] Error stopping controls:", e);
      }
      this.controls = null;
    }

    // 2. Stop all MediaStreamTrack objects and disable them
    if (this.stream) {
      try {
        const tracks = this.stream.getTracks();
        for (const track of tracks) {
          try {
            track.enabled = false;
            track.stop();
          } catch {}
        }
      } catch (e) {
        console.warn("[CameraLifecycleManager] Error stopping stream tracks:", e);
      }
      this.stream = null;
    }

    // 3. Detach video element and reset native iOS WebKit media pipeline
    if (this.videoElement) {
      try {
        this.videoElement.pause();
        this.videoElement.srcObject = null;
        this.videoElement.removeAttribute("src");
        this.videoElement.load();
      } catch {}
      this.videoElement = null;
    }

    // 4. Release any global streams tracked by BrowserCodeReader
    try {
      BrowserCodeReader.releaseAllStreams();
    } catch {}
  }

  /**
   * Starts a camera session targeting the rear camera with strict race condition protection.
   */
  public async start(videoElement: HTMLVideoElement): Promise<void> {
    // Stop any existing session first
    this.stop();

    const thisSession = ++this.sessionCounter;
    this.videoElement = videoElement;
    this.setState("starting");

    try {
      const constraints: MediaStreamConstraints = {
        audio: false,
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      // Step 1: Request camera stream
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (initialErr) {
        // Fallback for devices rejecting specific resolution constraints
        const err = initialErr as Error;
        if (err.name === "OverconstrainedError" || err.name === "ConstraintNotSatisfiedError") {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: { facingMode: "environment" }
          });
        } else {
          throw initialErr;
        }
      }

      // RACE CONDITION CHECK 1: Was stop() called while getUserMedia was resolving?
      if (this.sessionCounter !== thisSession) {
        // Immediately destroy this newly acquired stream!
        stream.getTracks().forEach((t) => {
          try {
            t.enabled = false;
            t.stop();
          } catch {}
        });
        return;
      }

      this.stream = stream;

      // Step 2: Attach stream to video element
      if (!this.videoElement) {
        this.stop();
        return;
      }

      this.videoElement.srcObject = stream;
      this.videoElement.setAttribute("playsinline", "true");
      this.videoElement.setAttribute("webkit-playsinline", "true");
      this.videoElement.muted = true;

      try {
        await this.videoElement.play();
      } catch (playErr) {
        // If play failed because user cancelled or modal was dismissed
        if (this.sessionCounter !== thisSession) {
          this.stop();
          return;
        }
        throw playErr;
      }

      // RACE CONDITION CHECK 2: Was stop() called while video was starting?
      if (this.sessionCounter !== thisSession) {
        this.stop();
        return;
      }

      // Step 3: Initialize ZXing reader
      const reader = new BrowserMultiFormatReader();
      const controls = await reader.decodeFromVideoElement(this.videoElement, (result) => {
        // Ensure result is for this active session
        if (this.sessionCounter !== thisSession) {
          return;
        }

        if (result) {
          const raw = result.getText();
          const normalized = normalizeBarcode(raw);
          if (normalized && normalized.length >= 6) {
            // Cancel further scanning callbacks immediately
            this.sessionCounter++;
            this.stop();
            this.listeners.onBarcodeDetected?.(normalized);
          }
        }
      });

      // RACE CONDITION CHECK 3: Was stop() called while decodeFromVideoElement was setting up?
      if (this.sessionCounter !== thisSession) {
        controls.stop();
        this.stop();
        return;
      }

      this.controls = controls;
      this.setState("scanning");
    } catch (err) {
      if (this.sessionCounter !== thisSession) {
        // Stale session error, ignore
        return;
      }

      this.stop();
      this.setState("error");

      const error = err as Error;
      const isDenied = error.name === "NotAllowedError" || error.name === "PermissionDeniedError";
      let msg = "Could not connect to camera. Please try again or enter digits manually.";
      if (isDenied) {
        msg = "Camera access was denied. Please allow camera permissions in your browser settings to scan in-store.";
      } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
        msg = "No video camera was detected on this device. You can enter the barcode manually or upload a photo.";
      }

      this.listeners.onError?.(msg, isDenied);
    }
  }
}
