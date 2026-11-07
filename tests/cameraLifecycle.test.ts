// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { CameraLifecycleManager } from "../src/services/CameraLifecycleManager";
import { BrowserMultiFormatReader } from "@zxing/browser";

// Mock MediaStreamTrack with explicit state tracking
class MockMediaStreamTrack implements MediaStreamTrack {
  enabled = true;
  id = `track-${Math.random().toString(36).substring(2, 8)}`;
  kind = "video";
  label = "Mock iPhone Camera";
  muted = false;
  readyState: MediaStreamTrackState = "live";
  contentHint = "";

  stop = vi.fn(() => {
    this.readyState = "ended";
  });

  addEventListener = vi.fn();
  removeEventListener = vi.fn();
  dispatchEvent = vi.fn(() => true);
  clone = vi.fn(() => this);
  getCapabilities = vi.fn(() => ({} as MediaTrackCapabilities));
  getConstraints = vi.fn(() => ({}));
  getSettings = vi.fn(() => ({} as MediaTrackSettings));
  applyConstraints = vi.fn(async () => {});
  oncapturehandlechange = null;
  onended = null;
  onmute = null;
  onunmute = null;
}

// Mock MediaStream holding tracks
class MockMediaStream implements MediaStream {
  id = `stream-${Math.random().toString(36).substring(2, 8)}`;
  active = true;
  private tracks: MediaStreamTrack[] = [];

  constructor(tracks?: MediaStreamTrack[]) {
    this.tracks = tracks || [new MockMediaStreamTrack()];
  }

  getTracks = vi.fn(() => this.tracks);
  getVideoTracks = vi.fn(() => this.tracks.filter((t) => t.kind === "video"));
  getAudioTracks = vi.fn(() => this.tracks.filter((t) => t.kind === "audio"));
  getTrackById = vi.fn((id: string) => this.tracks.find((t) => t.id === id) || null);
  addTrack = vi.fn((t: MediaStreamTrack) => this.tracks.push(t));
  removeTrack = vi.fn((t: MediaStreamTrack) => {
    this.tracks = this.tracks.filter((trk) => trk.id !== t.id);
  });
  clone = vi.fn(() => new MockMediaStream(this.tracks));
  addEventListener = vi.fn();
  removeEventListener = vi.fn();
  dispatchEvent = vi.fn(() => true);
  onaddtrack = null;
  onremovetrack = null;
}

describe("Camera Lifecycle Management & iOS PWA Cleanup Suite", () => {
  let createdStreams: MockMediaStream[] = [];
  let stopControlsFn: ReturnType<typeof vi.fn>;
  let decodeCallbackHolder: { callback?: (result: { getText: () => string } | null) => void } = {};

  beforeEach(() => {
    createdStreams = [];
    stopControlsFn = vi.fn();
    decodeCallbackHolder = {};

    // Ensure navigator.mediaDevices is defined in test environment
    if (!navigator.mediaDevices) {
      Object.defineProperty(navigator, "mediaDevices", {
        value: {
          getUserMedia: async () => {}
        },
        writable: true,
        configurable: true
      });
    }

    // Mock navigator.mediaDevices.getUserMedia
    vi.spyOn(navigator.mediaDevices, "getUserMedia").mockImplementation(async () => {
      const stream = new MockMediaStream();
      createdStreams.push(stream);
      return stream as unknown as MediaStream;
    });

    // Mock HTMLVideoElement methods in jsdom
    vi.spyOn(HTMLVideoElement.prototype, "play").mockImplementation(async () => {});
    vi.spyOn(HTMLVideoElement.prototype, "pause").mockImplementation(() => {});
    vi.spyOn(HTMLVideoElement.prototype, "load").mockImplementation(() => {});

    // Mock @zxing/browser BrowserMultiFormatReader.prototype.decodeFromVideoElement
    vi.spyOn(BrowserMultiFormatReader.prototype, "decodeFromVideoElement").mockImplementation(
      async (_video, callback) => {
        decodeCallbackHolder.callback = callback as (result: { getText: () => string } | null) => void;
        return {
          stop: stopControlsFn
        };
      }
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // -------------------------------------------------------------
  // Scenario 1: Open scanner -> Close -> Open scanner
  // -------------------------------------------------------------
  it("Scenario 1: Open scanner -> Close -> Open scanner cleanly releases and reacquires camera", async () => {
    const manager = new CameraLifecycleManager();
    const video = document.createElement("video");

    // 1. Open first scanner session
    await manager.start(video);
    expect(manager.getState()).toBe("scanning");
    expect(manager.isStreamActive()).toBe(true);
    expect(createdStreams.length).toBe(1);

    const firstTrack = createdStreams[0].getTracks()[0];
    expect(firstTrack.readyState).toBe("live");

    // 2. Close scanner
    manager.stop();
    expect(manager.getState()).toBe("idle");
    expect(firstTrack.stop).toHaveBeenCalled();
    expect(firstTrack.readyState).toBe("ended");
    expect(stopControlsFn).toHaveBeenCalled();
    expect(video.srcObject).toBeNull();
    expect(manager.isStreamActive()).toBe(false);

    // 3. Re-open second scanner session
    await manager.start(video);
    expect(manager.getState()).toBe("scanning");
    expect(createdStreams.length).toBe(2);
    const secondTrack = createdStreams[1].getTracks()[0];
    expect(secondTrack.readyState).toBe("live");

    // Clean up
    manager.stop();
    expect(secondTrack.readyState).toBe("ended");
  });

  // -------------------------------------------------------------
  // Scenario 2: Open scanner -> Scan barcode -> Scan Another
  // -------------------------------------------------------------
  it("Scenario 2: Open scanner -> Scan barcode -> Scan Another releases camera before result and restarts cleanly", async () => {
    let detectedBarcode: string | null = null;
    const manager = new CameraLifecycleManager({
      onBarcodeDetected: (barcode) => {
        detectedBarcode = barcode;
      }
    });
    const video = document.createElement("video");

    // 1. Start scanner
    await manager.start(video);
    expect(manager.getState()).toBe("scanning");
    const stream1 = createdStreams[0];
    const track1 = stream1.getTracks()[0];

    // 2. Barcode detected callback fires
    decodeCallbackHolder.callback?.({
      getText: () => "3606000577138"
    });

    expect(detectedBarcode).toBe("3606000577138");
    // Camera MUST be stopped automatically upon barcode detection
    expect(manager.getState()).toBe("idle");
    expect(track1.readyState).toBe("ended");
    expect(video.srcObject).toBeNull();

    // 3. User taps "Scan Another"
    await manager.start(video);
    expect(manager.getState()).toBe("scanning");
    expect(createdStreams.length).toBe(2);
    const track2 = createdStreams[1].getTracks()[0];
    expect(track2.readyState).toBe("live");

    manager.stop();
    expect(track2.readyState).toBe("ended");
  });

  // -------------------------------------------------------------
  // Scenario 3: Open scanner -> Immediately Close during startup (Race Condition)
  // -------------------------------------------------------------
  it("Scenario 3: Immediately Close during startup disposes late-resolving stream with 0 orphaned tracks", async () => {
    let resolveGUM!: (stream: MediaStream) => void;
    vi.spyOn(navigator.mediaDevices, "getUserMedia").mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveGUM = resolve as (stream: MediaStream) => void;
        })
    );

    const manager = new CameraLifecycleManager();
    const video = document.createElement("video");

    // User taps Scan
    const startPromise = manager.start(video);
    expect(manager.getState()).toBe("starting");

    // User immediately taps Close BEFORE getUserMedia finishes!
    manager.stop();
    expect(manager.getState()).toBe("idle");

    // Now getUserMedia finally resolves 500ms later
    const lateStream = new MockMediaStream();
    const lateTrack = lateStream.getTracks()[0];
    resolveGUM(lateStream as unknown as MediaStream);
    await startPromise;

    // The late stream MUST be immediately stopped and discarded
    expect(lateTrack.stop).toHaveBeenCalled();
    expect(lateTrack.readyState).toBe("ended");
    expect(manager.getState()).toBe("idle");
    expect(video.srcObject).toBeNull();
    expect(manager.isStreamActive()).toBe(false);
  });

  // -------------------------------------------------------------
  // Scenario 4: Open scanner -> Switch to Saved -> Return to Scan
  // -------------------------------------------------------------
  it("Scenario 4: Switching away from Scan tab terminates camera immediately", async () => {
    const manager = new CameraLifecycleManager();
    const video = document.createElement("video");

    await manager.start(video);
    expect(manager.getState()).toBe("scanning");
    const track = createdStreams[0].getTracks()[0];

    // Simulate tab switch: consumer calls stop()
    manager.stop();
    expect(manager.getState()).toBe("idle");
    expect(track.readyState).toBe("ended");
    expect(manager.isStreamActive()).toBe(false);
  });

  // -------------------------------------------------------------
  // Scenario 5: Open scanner -> Background iPhone (pagehide / visibilitychange) -> Return
  // -------------------------------------------------------------
  it("Scenario 5: Backgrounding iPhone via pagehide/visibilitychange terminates hardware camera and does not auto-reopen", async () => {
    const manager = new CameraLifecycleManager();
    const video = document.createElement("video");

    await manager.start(video);
    expect(manager.getState()).toBe("scanning");
    const track = createdStreams[0].getTracks()[0];

    // Backgrounding event
    manager.stop();
    expect(track.readyState).toBe("ended");
    expect(manager.getState()).toBe("idle");

    // Returning from background must remain idle until user explicitly taps Scan
    expect(manager.getState()).toBe("idle");
    expect(createdStreams.length).toBe(1);
  });

  // -------------------------------------------------------------
  // Scenario 6: Open scanner -> Deny camera permission -> Retry
  // -------------------------------------------------------------
  it("Scenario 6: Denying camera permission transitions to error state and allows successful retry", async () => {
    let shouldDeny = true;
    vi.spyOn(navigator.mediaDevices, "getUserMedia").mockImplementation(async () => {
      if (shouldDeny) {
        const err = new Error("Permission denied");
        err.name = "NotAllowedError";
        throw err;
      }
      const stream = new MockMediaStream();
      createdStreams.push(stream);
      return stream as unknown as MediaStream;
    });

    let lastError: string | null = null;
    let deniedFlag = false;
    const manager = new CameraLifecycleManager({
      onError: (msg, isDenied) => {
        lastError = msg;
        deniedFlag = isDenied;
      }
    });
    const video = document.createElement("video");

    // 1. Initial attempt fails with permission denied
    await manager.start(video);
    expect(manager.getState()).toBe("error");
    expect(deniedFlag).toBe(true);
    expect(lastError).toContain("Camera access was denied");

    // 2. User grants permission and taps Retry
    shouldDeny = false;
    await manager.start(video);
    expect(manager.getState()).toBe("scanning");
    expect(createdStreams.length).toBe(1);

    manager.stop();
  });

  // -------------------------------------------------------------
  // Scenario 7: Scan 20 products consecutively without refreshing
  // -------------------------------------------------------------
  it("Scenario 7: Scans 20 products consecutively with zero orphaned MediaStream tracks", async () => {
    const manager = new CameraLifecycleManager();
    const video = document.createElement("video");

    for (let i = 0; i < 20; i++) {
      await manager.start(video);
      expect(manager.getState()).toBe("scanning");
      expect(manager.isStreamActive()).toBe(true);

      // Simulate detect & stop
      manager.stop();
      expect(manager.getState()).toBe("idle");
      expect(manager.isStreamActive()).toBe(false);
    }

    expect(createdStreams.length).toBe(20);
    // Every single track created must be stopped with readyState === "ended"
    const allTracks = createdStreams.flatMap((s) => s.getTracks());
    expect(allTracks.length).toBe(20);
    for (const trk of allTracks) {
      expect(trk.readyState).toBe("ended");
    }
  });

  // -------------------------------------------------------------
  // Scenario 8: Rapidly tap Scan and Close
  // -------------------------------------------------------------
  it("Scenario 8: Rapidly tapping Scan and Close stabilizes cleanly without leaking streams", async () => {
    const manager = new CameraLifecycleManager();
    const video = document.createElement("video");

    // Fire 10 rapid concurrent start/stop cycles
    const promises: Promise<void>[] = [];
    for (let i = 0; i < 10; i++) {
      promises.push(manager.start(video));
      manager.stop();
    }

    await Promise.all(promises);

    // Final state must be idle
    expect(manager.getState()).toBe("idle");
    expect(manager.isStreamActive()).toBe(false);

    // Every stream created during the rapid burst must be ended
    for (const stream of createdStreams) {
      for (const track of stream.getTracks()) {
        expect(track.readyState).toBe("ended");
      }
    }
  });

  // -------------------------------------------------------------
  // Scenario 9: Close during a slow product lookup
  // -------------------------------------------------------------
  it("Scenario 9: Camera is already stopped during slow async product lookup", async () => {
    const manager = new CameraLifecycleManager();
    const video = document.createElement("video");

    await manager.start(video);
    expect(manager.getState()).toBe("scanning");

    const track = createdStreams[0].getTracks()[0];

    // Barcode detected -> camera stops immediately
    manager.stop();
    expect(track.readyState).toBe("ended");

    // Simulate slow lookup (e.g. 500ms network request)
    await new Promise((res) => setTimeout(res, 50));

    // Calling stop again during lookup is completely safe and idempotent
    manager.stop();
    expect(manager.getState()).toBe("idle");
    expect(track.readyState).toBe("ended");
  });
});
