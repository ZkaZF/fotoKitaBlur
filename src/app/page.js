import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="landing">
      <p className="landing__brand">Sal Priadi</p>

      <div className="landing__hero">
        <h1 className="landing__title">
          FOTO
          <span>KITA</span>
          BLUR
        </h1>

        <p className="landing__subtitle">
          Tunjukkan ✌️ ke kamera buat ikut trend, tapi backsoundnya tempel ndiri
        </p>

        <div className="landing__instructions">
          <div className="instruction-card">
            <span className="instruction-card__icon">📷</span>
            <p className="instruction-card__step">Step 1</p>
            <p className="instruction-card__text">Buka kamera</p>
          </div>
          <div className="instruction-card">
            <span className="instruction-card__icon">✌️</span>
            <p className="instruction-card__step">Step 2</p>
            <p className="instruction-card__text">Tunjukkan 2 jari</p>
          </div>
          <div className="instruction-card">
            <span className="instruction-card__icon">🌫️</span>
            <p className="instruction-card__step">Step 3</p>
            <p className="instruction-card__text">Auto blur!</p>
          </div>
          <div className="instruction-card">
            <span className="instruction-card__icon">📸</span>
            <p className="instruction-card__step">Step 4</p>
            <p className="instruction-card__text">Capture & save</p>
          </div>
        </div>

        <Link href="/camera" className="btn-primary" id="start-camera-btn">
          Mulai Kamera →
        </Link>
      </div>

      <p className="landing__footer">
        Built with MediaPipe · Works on HP & Laptop
      </p>
    </main>
  );
}
