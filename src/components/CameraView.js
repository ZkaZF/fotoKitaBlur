'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { createHandDetector, detectPeaceSign } from '@/lib/HandDetector';

/**
 * CameraView component — handles camera feed, hand detection, and blur rendering.
 *
 * Performance strategy:
 * - Draw video to canvas WITHOUT ctx.filter (CPU blur is extremely slow)
 * - Apply CSS filter on the canvas ELEMENT (GPU-accelerated, instant)
 * - Use CSS transition for smooth blur animation (browser handles interpolation)
 * - Run MediaPipe detection every N frames to reduce CPU load
 *
 * @param {Object} props
 * @param {string} props.facingMode - 'user' (front) or 'environment' (back)
 * @param {function} props.onStatusChange - Callback for status updates
 * @param {function} props.onCapture - Callback when a photo is captured (receives dataURL)
 * @param {boolean} props.shouldCapture - Trigger capture when set to true
 * @param {function} props.onCaptureComplete - Called after capture is done
 */
export default function CameraView({
  facingMode = 'user',
  onStatusChange,
  onCapture,
  shouldCapture,
  onCaptureComplete,
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const captureCanvasRef = useRef(null); // off-screen canvas for capturing with blur baked in
  const handLandmarkerRef = useRef(null);
  const animFrameRef = useRef(null);
  const streamRef = useRef(null);
  const lastTimestampRef = useRef(-1);
  const frameCountRef = useRef(0);
  const peaceRef = useRef(false);
  const isInitialMount = useRef(true);

  const [isLoading, setIsLoading] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [showFlash, setShowFlash] = useState(false);
  const [isPeace, setIsPeace] = useState(false);

  const DETECT_EVERY_N_FRAMES = 2; // Run MediaPipe every 2nd frame — balance antara kecepatan dan CPU
  const BLUR_AMOUNT = 25; // px

  /**
   * Start the camera stream.
   */
  const startCamera = useCallback(async () => {
    try {
      // Stop any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }

      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (playError) {
          if (playError.name !== 'AbortError') {
            console.error('Video play error:', playError);
          }
        }
      }

      setPermissionDenied(false);
    } catch (err) {
      console.error('Camera access error:', err);
      setPermissionDenied(true);
      setIsLoading(false);
    }
  }, [facingMode]);

  /**
   * Initialize MediaPipe HandLandmarker.
   */
  const initHandDetector = useCallback(async () => {
    try {
      const detector = await createHandDetector();
      handLandmarkerRef.current = detector;
    } catch (err) {
      console.error('HandLandmarker init error:', err);
    }
  }, []);

  /**
   * Main render loop — optimized for performance.
   *
   * Key insight: We draw the video UNBLURRED to canvas every frame (fast).
   * The blur is applied via CSS `style.filter` on the canvas element itself,
   * which is composited by the GPU — zero CPU cost for the blur.
   * Detection runs only every Nth frame to keep things smooth.
   */
  const renderLoop = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || video.readyState < 2) {
      animFrameRef.current = requestAnimationFrame(renderLoop);
      return;
    }

    // Set canvas size to match video (once)
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      setIsLoading(false);
    }

    const ctx = canvas.getContext('2d');

    // Draw video frame (no filter — this is fast)
    ctx.save();
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    // Run detection only every Nth frame
    frameCountRef.current++;
    if (handLandmarkerRef.current && frameCountRef.current % DETECT_EVERY_N_FRAMES === 0) {
      const now = performance.now();
      const timestamp = now > lastTimestampRef.current ? now : lastTimestampRef.current + 1;
      lastTimestampRef.current = timestamp;

      const result = detectPeaceSign(handLandmarkerRef.current, video, timestamp, peaceRef.current);
      const detected = result.peaceDetected;

      // Only update state when it actually changes
      if (detected !== peaceRef.current) {
        peaceRef.current = detected;
        setIsPeace(detected);

        // Apply CSS blur on the canvas element (GPU-accelerated!)
        if (canvas) {
          canvas.style.filter = detected ? `blur(${BLUR_AMOUNT}px)` : 'none';
        }

        // Update parent status
        if (onStatusChange) {
          onStatusChange(detected ? 'blur' : 'detecting');
        }
      }
    }

    animFrameRef.current = requestAnimationFrame(renderLoop);
  }, [facingMode, onStatusChange]);

  /**
   * Capture the current canvas frame as a photo.
   * Uses an off-screen canvas to bake the blur into the image.
   */
  useEffect(() => {
    if (shouldCapture && canvasRef.current) {
      const srcCanvas = canvasRef.current;

      // If blur is active, bake it into the captured image using an offscreen canvas
      if (peaceRef.current) {
        if (!captureCanvasRef.current) {
          captureCanvasRef.current = document.createElement('canvas');
        }
        const offscreen = captureCanvasRef.current;
        offscreen.width = srcCanvas.width;
        offscreen.height = srcCanvas.height;
        const offCtx = offscreen.getContext('2d');
        offCtx.filter = `blur(${BLUR_AMOUNT}px)`;
        offCtx.drawImage(srcCanvas, 0, 0);
        const dataURL = offscreen.toDataURL('image/png');
        if (onCapture) onCapture(dataURL);
      } else {
        const dataURL = srcCanvas.toDataURL('image/png');
        if (onCapture) onCapture(dataURL);
      }

      setShowFlash(true);
      setTimeout(() => setShowFlash(false), 400);

      if (onCaptureComplete) onCaptureComplete();
    }
  }, [shouldCapture, onCapture, onCaptureComplete]);

  /**
   * Initialize on mount.
   */
  useEffect(() => {
    let mounted = true;

    async function init() {
      await Promise.all([startCamera(), initHandDetector()]);
      if (mounted) {
        animFrameRef.current = requestAnimationFrame(renderLoop);
      }
    }

    init();

    return () => {
      mounted = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (handLandmarkerRef.current) {
        handLandmarkerRef.current.close();
      }
    };
  }, [startCamera, initHandDetector, renderLoop]);

  /**
   * Restart camera when facingMode changes (skip initial mount).
   */
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    startCamera();
  }, [facingMode, startCamera]);

  if (permissionDenied) {
    return (
      <div className="permission-prompt">
        <span className="permission-prompt__icon">📷</span>
        <h2 className="permission-prompt__title">Izinkan Akses Kamera</h2>
        <p className="permission-prompt__text">
          FotoKita Blur membutuhkan akses kamera untuk mendeteksi gesture ✌️ dan mengaplikasikan efek blur. 
          Tap tombol di bawah untuk mengizinkan.
        </p>
        <button
          className="permission-prompt__btn"
          onClick={() => {
            setPermissionDenied(false);
            setIsLoading(true);
            startCamera();
          }}
        >
          Izinkan Kamera
        </button>
      </div>
    );
  }

  return (
    <div className="camera-view">
      <video
        ref={videoRef}
        className="camera-view__video"
        playsInline
        muted
        autoPlay
      />

      <canvas ref={canvasRef} className="camera-view__canvas" />

      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner" />
          <p className="loading-text">Memuat kamera & AI...</p>
        </div>
      )}

      {isPeace && !isLoading && (
        <div className="blur-popup" key="blur-popup">
          <span className="blur-popup__text">FOTO KITA BLUR</span>
          <span className="blur-popup__tilde"> ~</span>
        </div>
      )}

      {showFlash && <div className="flash-overlay" />}
    </div>
  );
}
