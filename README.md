# FotoKita Blur ✌️

Web app tren **"Foto Kita Blur"** yang terinspirasi dari lagu milik **Sal Priadi**. Aplikasi ini mendeteksi pose ✌️ (dua jari/peace sign) dari kamera dan secara otomatis menambahkan efek blur seperti tren yang sedang viral. Dibangun menggunakan Next.js dan MediaPipe Hands, aplikasi ini berjalan sepenuhnya di sisi klien (browser) tanpa menyimpan gambar ke server.

## Fitur ✨

*   **Deteksi Otomatis:** Otomatis mendeteksi pose ✌️ (dua jari: telunjuk dan tengah) menggunakan AI (MediaPipe).
*   **Efek Blur Real-time:** Menambahkan efek blur secara instan saat pose terdeteksi.
*   **Capture Foto:** Ambil foto dengan timer 3 detik (opsional).
*   **Galeri Lokal:** Lihat hasil foto yang baru saja diambil.
*   **Download & Share:** Unduh foto ke perangkat atau bagikan langsung via fitur share bawaan (jika didukung perangkat).
*   **Switch Kamera:** Mendukung penggunaan kamera depan dan belakang (cocok untuk HP).
*   **Aman:** Pemrosesan gambar dilakukan sepenuhnya di browser (client-side).

## Cara Menjalankan Project di Lokal 💻

### Persyaratan Sistem

*   [Node.js](https://nodejs.org/) (versi 18.x atau terbaru disarankan)
*   npm (biasanya sudah termasuk dalam Node.js)

### Langkah-langkah Instalasi

1.  **Buka Terminal/Command Prompt** di dalam folder project `fotoKitaBlur`.
2.  **Install Dependencies**
    Jalankan perintah berikut untuk mengunduh semua package yang dibutuhkan:
    ```bash
    npm install
    ```
3.  **Jalankan Development Server**
    Setelah instalasi selesai, jalankan perintah ini:
    ```bash
    npm run dev
    ```
4.  **Buka di Browser**
    Buka web browser pilihanmu (Chrome, Safari, Edge, dll) dan akses URL berikut:
    ```
    http://localhost:3000
    ```

**Catatan Penting saat Menjalankan di Lokal (Localhost):**
Untuk mendeteksi kamera, browser biasanya mewajibkan koneksi aman (HTTPS). Namun, `localhost` (atau `http://127.0.0.1`) umumnya dikecualikan dan kamera tetap bisa diakses. Jika kamu mengakses dari device lain di jaringan yang sama (misal via IP lokal `http://192.168.x.x:3000`), fitur kamera mungkin akan diblokir oleh browser karena bukan HTTPS.

## Cara Deploy (Hosting Gratis via Vercel) 🚀

Karena aplikasi ini dibuat dengan Next.js, cara termudah dan paling optimal untuk membagikannya ke teman-teman adalah dengan deploy ke [Vercel](https://vercel.com). Deploy di Vercel otomatis memberikan URL aman (HTTPS) sehingga kamera bisa diakses dari HP mana pun.

### Opsi 1: Deploy via GitHub (Disarankan)

1.  Buat repository baru di akun GitHub kamu.
2.  Push folder `fotoKitaBlur` ini ke repository tersebut.
3.  Daftar/Login ke [Vercel](https://vercel.com) menggunakan akun GitHub kamu.
4.  Klik tombol **"Add New"** > **"Project"**.
5.  Import repository `fotoKitaBlur` yang baru saja kamu buat.
6.  Biarkan semua pengaturan default, lalu klik **"Deploy"**.
7.  Tunggu beberapa saat. Vercel akan memberikan link publik (contoh: `https://fotokitablur.vercel.app`) yang bisa kamu bagikan ke teman-teman.

### Opsi 2: Deploy via Vercel CLI

Jika kamu sudah familiar dengan terminal dan memiliki akun Vercel:

1.  Install Vercel CLI (sekali saja):
    ```bash
    npm i -g vercel
    ```
2.  Jalankan perintah deploy di dalam folder project:
    ```bash
    vercel
    ```
3.  Ikuti instruksi di terminal (login, setup project, dsb). Untuk deploy ke versi *production*, jalankan `vercel --prod`.

## Pendekatan Deteksi Pose Dua Jari (Dual-Strategy) 🧠

Untuk memastikan deteksi pose dua jari (peace sign) berjalan stabil di berbagai kondisi, aplikasi ini menggunakan dua strategi berbeda tergantung pada orientasi tangan yang menghadap kamera:

1.  **Back-of-hand (Punggung tangan menghadap kamera):**
    Menggunakan **3D Euclidean Distance Ratio**. Ini sangat akurat karena memanfaatkan nilai kedalaman (z-axis) dari MediaPipe untuk membedakan jari yang dilipat (menekuk ke arah telapak) dan jari yang terbuka.
2.  **Palm-facing (Telapak tangan menghadap kamera):**
    Karena nilai kedalaman (z-axis) dari MediaPipe sering kali *noisy* saat telapak tangan menghadap kamera, sistem akan otomatis beralih menggunakan **2D Wrist-Distance Method**. Jari yang terbuka (telunjuk, tengah) akan memiliki jarak 2D yang jauh dari pergelangan tangan, sedangkan jari yang dilipat (manis, kelingking) akan berada lebih dekat dengan pergelangan tangan. Pendekatan ini mengabaikan sumbu z sepenuhnya untuk menghindari *noise*.

Sistem secara otomatis mendeteksi apakah telapak atau punggung tangan yang menghadap kamera dan memilih strategi yang tepat, membuat deteksi *rotation-invariant* (berfungsi walau tangan miring atau horizontal).

## Tech Stack 🛠️

*   **Framework:** [Next.js](https://nextjs.org/) (App Router)
*   **AI/Machine Learning:** [MediaPipe Tasks Vision](https://developers.google.com/mediapipe) (Hand Landmarker)
*   **Styling:** Custom CSS (Terinspirasi dari desain "Flying Papers")

## Struktur Folder Utama

*   `src/app/` - Berisi halaman utama (landing page) dan konfigurasi layout.
*   `src/app/camera/` - Berisi halaman aplikasi kamera.
*   `src/components/` - Berisi komponen React terpisah (CameraView, CameraControls, PhotoGallery).
*   `src/lib/` - Berisi logika deteksi AI (HandDetector.js).
*   `src/app/globals.css` - File CSS utama untuk styling (desain sistem).
