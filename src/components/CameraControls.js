'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * CameraControls — capture button, switch camera, and countdown timer.
 *
 * @param {Object} props
 * @param {function} props.onCapture - Called when capture should trigger
 * @param {function} props.onSwitchCamera - Called to toggle front/back camera
 * @param {boolean} props.canSwitchCamera - Whether camera switching is available
 */
export default function CameraControls({ onCapture, onSwitchCamera, canSwitchCamera }) {
  const [countdown, setCountdown] = useState(null);
  const [isCountingDown, setIsCountingDown] = useState(false);

  const startCountdown = useCallback(() => {
    if (isCountingDown) return;
    setIsCountingDown(true);
    setCountdown(3);
  }, [isCountingDown]);

  const captureNow = useCallback(() => {
    if (onCapture) onCapture();
  }, [onCapture]);

  // Countdown logic
  useEffect(() => {
    if (countdown === null || countdown < 0) return;

    if (countdown === 0) {
      // Fire capture
      captureNow();
      setIsCountingDown(false);
      setCountdown(null);
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, captureNow]);

  return (
    <>
      {/* Countdown overlay */}
      {isCountingDown && countdown > 0 && (
        <div className="countdown-overlay">
          <span key={countdown} className="countdown-overlay__number">
            {countdown}
          </span>
        </div>
      )}

      <div className="camera-controls">
        {/* Timer button */}
        <button
          className="camera-controls__btn camera-controls__btn--secondary"
          onClick={startCountdown}
          disabled={isCountingDown}
          title="Timer 3 detik"
          id="timer-btn"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="13" r="8" />
            <path d="M12 9v4l2 2" />
            <path d="M9 2h6" />
            <path d="M12 2v3" />
          </svg>
        </button>

        {/* Capture button */}
        <button
          className="camera-controls__btn camera-controls__btn--capture"
          onClick={captureNow}
          disabled={isCountingDown}
          title="Ambil foto"
          id="capture-btn"
        />

        {/* Switch camera */}
        {canSwitchCamera && (
          <button
            className="camera-controls__btn camera-controls__btn--secondary"
            onClick={onSwitchCamera}
            title="Ganti kamera"
            id="switch-camera-btn"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 19H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5" />
              <path d="M13 5h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-5" />
              <circle cx="12" cy="12" r="3" />
              <path d="m18 22-3-3 3-3" />
              <path d="m6 2 3 3-3 3" />
            </svg>
          </button>
        )}

        {/* Placeholder for alignment when no switch camera */}
        {!canSwitchCamera && (
          <div style={{ width: 48, height: 48 }} />
        )}
      </div>
    </>
  );
}
