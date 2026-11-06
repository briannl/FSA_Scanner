import React, { useEffect, useRef, useState, useCallback } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { X, Camera, RefreshCw, Upload, AlertCircle, HelpCircle } from "lucide-react";
import { normalizeBarcode } from "../utils/barcodeUtils";

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBarcodeDetected: (barcode: string) => void;
  onManualEntry: () => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onBarcodeDetected,
  onManualEntry
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDecodingFile, setIsDecodingFile] = useState(false);

  // Play audio feedback tone on successful scan
  const playScanBeep = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.14);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.14);
    } catch {
      // Audio autoplay policy or not supported
    }
  };

  const stopCamera = useCallback(() => {
    if (readerRef.current) {
      try {
        // Reset controls
        readerRef.current = null;
      } catch {
        // Ignore
      }
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    stopCamera();
    setErrorMessage(null);
    setHasPermission(null);
    setIsProcessing(false);

    try {
      const constraints: MediaStreamConstraints = {
        audio: false,
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      setHasPermission(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        await videoRef.current.play();

        const reader = new BrowserMultiFormatReader();
        readerRef.current = reader;

        // Start continuous decoding
        reader.decodeFromVideoElement(videoRef.current, (result) => {
          if (result && !isProcessing) {
            const rawText = result.getText();
            const normalized = normalizeBarcode(rawText);
            if (normalized && normalized.length >= 6) {
              setIsProcessing(true);
              playScanBeep();
              stopCamera();
              onBarcodeDetected(normalized);
            }
          }
        });
      }
    } catch (err) {
      console.warn("Camera start error:", err);
      setHasPermission(false);
      const error = err as Error;
      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        setErrorMessage("Camera access was denied. Please allow camera permissions in your browser settings to scan in-store.");
      } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
        setErrorMessage("No video camera was detected on this device. You can enter the barcode manually or upload a photo.");
      } else {
        setErrorMessage("Could not connect to camera. Please try again, upload a barcode photo, or enter digits manually.");
      }
    }
  }, [stopCamera, isProcessing, onBarcodeDetected]);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, startCamera, stopCamera]);

  // Handle barcode image file upload fallback
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsDecodingFile(true);
    setErrorMessage(null);

    try {
      const reader = new BrowserMultiFormatReader();
      const imageUrl = URL.createObjectURL(file);
      const img = new Image();
      img.src = imageUrl;

      img.onload = async () => {
        try {
          const result = await reader.decodeFromImageElement(img);
          URL.revokeObjectURL(imageUrl);
          setIsDecodingFile(false);

          if (result) {
            const normalized = normalizeBarcode(result.getText());
            if (normalized) {
              playScanBeep();
              stopCamera();
              onBarcodeDetected(normalized);
              return;
            }
          }
          setErrorMessage("No barcode could be detected in this photo. Please make sure the barcode is in focus, or enter digits manually.");
        } catch {
          URL.revokeObjectURL(imageUrl);
          setIsDecodingFile(false);
          setErrorMessage("Could not recognize a barcode from this image. Try taking a closer, well-lit photo or enter manually.");
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(imageUrl);
        setIsDecodingFile(false);
        setErrorMessage("Failed to read image file. Please try again.");
      };
    } catch {
      setIsDecodingFile(false);
      setErrorMessage("Error reading image. Please enter barcode manually.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="scanner-modal-backdrop" role="dialog" aria-modal="true" aria-label="Barcode Scanner">
      <div className="scanner-modal-content">
        {/* Top bar */}
        <div className="scanner-modal-header">
          <div className="scanner-header-title">
            <Camera size={18} className="text-lavender" />
            <span>In-Store Barcode Scanner</span>
          </div>
          <button
            type="button"
            className="scanner-close-btn"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            aria-label="Close scanner"
          >
            <X size={20} />
          </button>
        </div>

        {/* Video Viewfinder */}
        <div className="scanner-viewfinder-wrapper">
          {hasPermission === false ? (
            /* Permission Denied Recovery Instructions */
            <div className="scanner-permission-denied">
              <AlertCircle size={44} className="text-warning mb-3" />
              <h3>Camera Permission Needed</h3>
              <p className="scanner-error-text">{errorMessage}</p>

              <div className="scanner-instructions-card">
                <div className="instruction-step">
                  <strong>iOS Safari:</strong> Tap the <em>aA</em> icon in the URL bar &gt; <em>Website Settings</em> &gt; <em>Camera</em> &gt; <em>Allow</em>.
                </div>
                <div className="instruction-step">
                  <strong>Android Chrome:</strong> Tap the lock icon in the URL bar &gt; <em>Permissions</em> &gt; <em>Camera</em> &gt; <em>Allow</em>.
                </div>
              </div>

              <div className="scanner-recovery-actions">
                <button
                  type="button"
                  className="editorial-primary-btn"
                  onClick={startCamera}
                >
                  <RefreshCw size={16} /> Try Camera Again
                </button>
                <button
                  type="button"
                  className="editorial-secondary-btn"
                  onClick={() => {
                    stopCamera();
                    onManualEntry();
                  }}
                >
                  Enter Barcode Manually
                </button>
                <button
                  type="button"
                  className="editorial-secondary-btn"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={16} /> Upload Barcode Photo
                </button>
              </div>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                className="scanner-video-feed"
                muted
                autoPlay
                playsInline
              />

              {/* Viewfinder Reticle & Laser */}
              <div className="scanner-reticle-overlay">
                <div className="scanner-target-frame">
                  {/* 4 Corner Brackets */}
                  <span className="reticle-corner top-left" />
                  <span className="reticle-corner top-right" />
                  <span className="reticle-corner bottom-left" />
                  <span className="reticle-corner bottom-right" />

                  {/* Animated Sweeping Laser Line */}
                  <div className="scanner-laser-line" />
                </div>
                <p className="scanner-target-tip">
                  {isProcessing ? "Recognizing barcode..." : "Align barcode within the frame"}
                </p>
              </div>
            </>
          )}

          {isDecodingFile && (
            <div className="scanner-file-decoding-overlay">
              <RefreshCw size={24} className="spinning text-lavender mb-2" />
              <span>Analyzing photo for barcode...</span>
            </div>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="scanner-modal-footer">
          <button
            type="button"
            className="scanner-footer-action-btn"
            onClick={() => {
              stopCamera();
              onManualEntry();
            }}
          >
            <HelpCircle size={16} />
            <span>Enter manually</span>
          </button>

          <button
            type="button"
            className="scanner-footer-action-btn"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={16} />
            <span>Upload photo</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleFileUpload}
          />
        </div>
      </div>
    </div>
  );
};
