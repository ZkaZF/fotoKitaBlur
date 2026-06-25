'use client';

/**
 * PhotoGallery — displays captured photos with download and delete actions.
 *
 * @param {Object} props
 * @param {Array<string>} props.photos - Array of data URLs
 * @param {function} props.onClose - Close the gallery panel
 * @param {function} props.onDelete - Delete a photo by index
 */
export default function PhotoGallery({ photos, onClose, onDelete }) {
  const handleDownload = (dataURL, index) => {
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = `fotokita-blur-${Date.now()}-${index + 1}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = async (dataURL) => {
    if (!navigator.share) return;

    try {
      // Convert data URL to blob for sharing
      const response = await fetch(dataURL);
      const blob = await response.blob();
      const file = new File([blob], 'fotokita-blur.png', { type: 'image/png' });

      await navigator.share({
        title: 'FotoKita Blur ✌️',
        text: 'Cek foto blur aku!',
        files: [file],
      });
    } catch (err) {
      // User cancelled or share not supported
      console.log('Share cancelled:', err.message);
    }
  };

  return (
    <div className="gallery-panel">
      <div className="gallery-panel__header">
        <h2 className="gallery-panel__title">Hasil Foto ({photos.length})</h2>
        <button className="gallery-panel__close" onClick={onClose} id="gallery-close-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      </div>

      <div className="gallery-panel__grid">
        {photos.length === 0 ? (
          <div className="gallery-empty">
            <span className="gallery-empty__icon">📷</span>
            <p className="gallery-empty__text">
              Belum ada foto. Tekan tombol capture untuk mulai!
            </p>
          </div>
        ) : (
          photos.map((photo, index) => (
            <div key={index} className="gallery-item">
              <img
                src={photo}
                alt={`Foto ${index + 1}`}
                className="gallery-item__img"
              />
              <div className="gallery-item__actions">
                <button
                  className="gallery-item__btn gallery-item__btn--download"
                  onClick={() => handleDownload(photo, index)}
                  title="Download"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                </button>
                {typeof navigator !== 'undefined' && navigator.share && (
                  <button
                    className="gallery-item__btn gallery-item__btn--download"
                    onClick={() => handleShare(photo)}
                    title="Share"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="18" cy="5" r="3" />
                      <circle cx="6" cy="12" r="3" />
                      <circle cx="18" cy="19" r="3" />
                      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                    </svg>
                  </button>
                )}
                <button
                  className="gallery-item__btn gallery-item__btn--delete"
                  onClick={() => onDelete(index)}
                  title="Hapus"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
