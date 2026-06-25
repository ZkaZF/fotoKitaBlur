'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import CameraView from '@/components/CameraView';
import CameraControls from '@/components/CameraControls';
import PhotoGallery from '@/components/PhotoGallery';

export default function CameraPage() {
  const [facingMode, setFacingMode] = useState('user');
  const [status, setStatus] = useState('idle'); // 'idle' | 'detecting' | 'blur'
  const [photos, setPhotos] = useState([]);
  const [showGallery, setShowGallery] = useState(false);
  const [shouldCapture, setShouldCapture] = useState(false);
  const [canSwitchCamera, setCanSwitchCamera] = useState(false);

  // Check if device has multiple cameras (mobile)
  useEffect(() => {
    async function checkCameras() {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter((d) => d.kind === 'videoinput');
        setCanSwitchCamera(videoDevices.length > 1);
      } catch {
        setCanSwitchCamera(false);
      }
    }
    checkCameras();
  }, []);

  const handleStatusChange = useCallback((newStatus) => {
    setStatus(newStatus);
  }, []);

  const handleCapture = useCallback(() => {
    setShouldCapture(true);
  }, []);

  const handleCaptureComplete = useCallback(() => {
    setShouldCapture(false);
  }, []);

  const handlePhotoReceived = useCallback((dataURL) => {
    setPhotos((prev) => [dataURL, ...prev]);
  }, []);

  const handleSwitchCamera = useCallback(() => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  }, []);

  const handleDeletePhoto = useCallback((index) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const statusLabels = {
    idle: 'Menunggu...',
    detecting: 'Mendeteksi ✋',
    blur: '✌️ BLUR AKTIF',
  };

  return (
    <div className="camera-page">
      {/* Header */}
      <div className="camera-header">
        <Link href="/" className="camera-header__back" id="back-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
          Kembali
        </Link>

        <div
          className={`camera-header__status camera-header__status--${status}`}
          id="status-indicator"
        >
          <span className="status-dot" />
          {statusLabels[status]}
        </div>
      </div>

      {/* Camera Feed */}
      <CameraView
        facingMode={facingMode}
        onStatusChange={handleStatusChange}
        onCapture={handlePhotoReceived}
        shouldCapture={shouldCapture}
        onCaptureComplete={handleCaptureComplete}
      />

      {/* Gallery Toggle (thumbnail of last photo) */}
      {photos.length > 0 && !showGallery && (
        <button
          className="gallery-toggle"
          onClick={() => setShowGallery(true)}
          id="gallery-toggle-btn"
        >
          <img
            src={photos[0]}
            alt="Last capture"
            className="gallery-toggle__preview"
          />
          <span className="gallery-toggle__count">{photos.length}</span>
        </button>
      )}

      {/* Controls */}
      <CameraControls
        onCapture={handleCapture}
        onSwitchCamera={handleSwitchCamera}
        canSwitchCamera={canSwitchCamera}
      />

      {/* Gallery Panel */}
      {showGallery && (
        <PhotoGallery
          photos={photos}
          onClose={() => setShowGallery(false)}
          onDelete={handleDeletePhoto}
        />
      )}
    </div>
  );
}
