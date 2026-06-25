import './globals.css';
import { Analytics } from '@vercel/analytics/react';

export const metadata = {
  title: 'FotoKita Blur — Trend Foto ✌️ Blur',
  description: 'Buat foto trend blur dengan gesture ✌️! Arahkan kamera, tunjukkan dua jari, dan foto langsung blur otomatis. Gratis & bisa langsung dari HP.',
  keywords: ['foto blur', 'trend blur', 'peace sign blur', 'foto kita blur', 'camera blur effect'],
  openGraph: {
    title: 'FotoKita Blur — Trend Foto ✌️ Blur',
    description: 'Buat foto trend blur dengan gesture ✌️! Arahkan kamera, tunjukkan dua jari, dan foto langsung blur otomatis.',
    type: 'website',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
