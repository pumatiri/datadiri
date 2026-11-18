# Jati Diri — Primbon Digital

Web app untuk mengenali jati diri dari tanggal lahir: kalender Hijriah, hari & pasaran (weton), neptu, usia, zodiak, shio, dan life path lengkap dengan deskripsi.

(C) Ragam Bahasa 2026 | by Rudi Bahruddin

---

## Cara kerja

```
Pengunjung ──► GitHub Pages (index.html) ──iframe──► Web App Google Apps Script
               logo, ikon, layar pembuka,            perhitungan, database,
               layar penuh, pasang ke HP             tampilan, kirim PDF ke email
```

- **GitHub Pages** hanya "bingkai": alamat web yang rapi, layar pembuka, ikon, dan izin layar penuh.
- **Seluruh aplikasi tetap berjalan di Google Apps Script.** Mengubah file di folder `apps-script/` di GitHub **tidak** mengubah aplikasi. Perubahan harus ditempel ke editor Apps Script lalu di-deploy (lihat bawah).

## Isi repo

| File / folder | Fungsi |
|---|---|
| `index.html` | Halaman utama GitHub Pages (menyematkan web app) |
| `manifest.webmanifest` | Agar bisa dipasang ke layar utama HP dan terbuka layar penuh |
| `logo.png`, `favicon.png`, `icon-192.png`, `icon-512.png`, `apple-touch-icon.png` | Logo dan ikon |
| `404.html` | Mengarahkan alamat yang salah ke halaman utama |
| `.nojekyll` | Agar GitHub Pages menyajikan file apa adanya |
| `apps-script/` | Arsip kode Google Apps Script + database (untuk cadangan, **tidak dijalankan GitHub**) |

---

## A. Deploy ke GitHub Pages

1. Masuk ke **github.com** → klik **+** (kanan atas) → **New repository**.
   - Repository name: misalnya `jatidiri`
   - Pilih **Public** → klik **Create repository**.
2. Di halaman repo, klik **uploading an existing file** (atau **Add file → Upload files**).
3. Buka folder hasil ekstrak zip ini, **pilih semua isinya** (termasuk folder `apps-script`) lalu seret ke halaman upload.
   - Pastikan `index.html` berada di **paling luar** repo, bukan di dalam sub-folder.
   - File `.nojekyll` tersembunyi di sebagian komputer. Jika tidak ikut terunggah, buat manual: **Add file → Create new file** → nama `.nojekyll` → kosongkan → **Commit**.
4. Klik **Commit changes**.
5. Buka **Settings → Pages**:
   - Source: **Deploy from a branch**
   - Branch: **main** · folder **/ (root)** → **Save**.
6. Tunggu 1–2 menit. Alamat web muncul di bagian atas halaman Pages:
   `https://NAMA-AKUN-ANDA.github.io/jatidiri/`

> Pratinjau link di WhatsApp/Facebook: untuk hasil terbaik, ubah baris `og:image` di `index.html` menjadi alamat lengkap,
> misalnya `https://NAMA-AKUN-ANDA.github.io/jatidiri/logo.png`.

## B. Perbarui web app di Google Apps Script (wajib, sekali)

Tombol layar penuh baru bekerja di GitHub Pages setelah `Script.html` versi terbaru terpasang di Apps Script.

1. Buka project di **script.google.com**.
2. Ganti isi file **Script** dengan `apps-script/Script.html` dari repo ini. Jika belum, ganti juga **Index**, **Styles**, **Logo**, dan **PdfTemplate**.
3. Simpan (Ctrl+S).
4. **Terapkan → Kelola deployment → ✏️ Edit → Versi: Versi baru → Terapkan.**
   Jangan pilih "Deployment baru" — itu membuat URL baru.
5. Buka alamat GitHub Pages Anda, tekan **Ctrl+F5**.

## Jika URL web app berubah

Buka `index.html`, ubah baris berikut lalu commit:

```js
const URL_WEBAPP = 'https://script.google.com/macros/s/.../exec';
```

(Juga ubah link di bagian `<noscript>`.)

## Pemecahan masalah

| Gejala | Solusi |
|---|---|
| Halaman GitHub 404 | Pastikan `index.html` di root repo dan Settings → Pages sudah aktif; tunggu 1–2 menit. |
| Tampilan web app masih lama | Perubahan belum di-deploy di Apps Script (langkah B.4), lalu Ctrl+F5. |
| Kotak kosong / "Akses ditolak" | Di Apps Script, deployment harus: Jalankan sebagai **Saya**, akses **Siapa saja**. |
| Masih muncul mode gelap | Pilihan mode tersimpan di browser; klik tombol mode sekali, atau buka jendela penyamaran. |
| Layar penuh tidak jalan di iPhone | Safari iPhone membatasi layar penuh. Gunakan **Bagikan → Tambahkan ke Layar Utama**; aplikasi akan terbuka tanpa bilah browser. |
