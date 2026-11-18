# Panduan Pemasangan — Web App "Jati Diri" (Primbon Digital)

(C) Ragam Bahasa 2026 | by Rudi Bahruddin

## Isi paket

| File | Fungsi |
|---|---|
| `Database_JatiDiri.xlsx` | Database deskripsi (Weton 35 kombinasi, Zodiak 12, Shio 12, Life Path 12) + sheet Riwayat |
| `Code.gs` | Kode server: perhitungan, baca database, buat PDF, kirim email |
| `Logo.gs` | Logo Ragam Bahasa (sudah dalam bentuk teks base64) |
| `Index.html` | Kerangka halaman |
| `Styles.html` | Tampilan (warna, pola batik kawung, mode gelap, animasi) |
| `Script.html` | Logika di browser (form, dialog kustom, tab deskripsi, proteksi teks, footer terkunci) |
| `PdfTemplate.html` | Desain laporan PDF yang dikirim ke email |

---

## LANGKAH 1 — Siapkan database (Google Sheet)

1. Buka **drive.google.com** → klik **+ Baru → Upload file** → pilih `Database_JatiDiri.xlsx`.
2. Klik kanan file tersebut → **Buka dengan → Google Spreadsheet**.
3. Di menu atas klik **File → Simpan sebagai Google Spreadsheet**. Sekarang Anda punya versi Google Sheet (ikon hijau). Bekerjalah di file ini.

> Jangan ganti nama sheet (Weton, Zodiak, Shio, LifePath, Riwayat) dan jangan ubah judul kolom di baris 1.

## LANGKAH 2 — Buat project Apps Script

1. Di Google Sheet tadi, klik **Ekstensi → Apps Script**.
2. Akan muncul file `Kode.gs` / `Code.gs`. **Hapus semua isinya**, lalu tempel seluruh isi file `Code.gs` dari paket ini.
3. Tambah file script kedua: klik ikon **+** di samping "File" → **Skrip** → beri nama `Logo` → hapus isinya → tempel isi `Logo.gs`.
4. Tambah file HTML: klik **+** → **HTML** → beri nama persis seperti di bawah (tanpa `.html`, editor menambahkannya sendiri), lalu tempel isinya:
   - `Index`
   - `Styles`
   - `Script`
   - `PdfTemplate`
5. Klik ikon **💾 Simpan** (atau Ctrl+S).

## LANGKAH 3 — Beri izin (sekali saja)

1. Di bagian atas editor, pilih fungsi **`ujiCoba`** pada dropdown, lalu klik **▶ Jalankan**.
2. Muncul "Otorisasi diperlukan" → **Tinjau izin** → pilih akun Google Anda.
3. Jika muncul "Google belum memverifikasi aplikasi ini" → klik **Lanjutan** → **Buka (nama project) (tidak aman)** → **Izinkan**.
   (Ini normal untuk script buatan sendiri.)
4. Lihat **Log eksekusi** — jika muncul data hasil perhitungan dan "Sisa kuota email", berarti semua berjalan.

## LANGKAH 4 — Deploy sebagai Web App

1. Klik **Terapkan (Deploy) → Deployment baru**.
2. Klik ikon ⚙️ di samping "Pilih jenis" → **Aplikasi web**.
3. Isi:
   - **Deskripsi**: Jati Diri v1
   - **Jalankan sebagai**: **Saya** (email Anda)
   - **Yang memiliki akses**: **Siapa saja**
4. Klik **Terapkan** → salin **URL aplikasi web** (berakhiran `/exec`). Itulah link yang dibagikan ke pengguna.

## Memperbarui aplikasi setelah mengubah kode

**Terapkan → Kelola deployment → ✏️ (edit) → Versi: Versi baru → Terapkan.** URL tetap sama.

## Mengubah teks deskripsi

- Edit langsung di Google Sheet (sheet Weton/Zodiak/Shio/LifePath). Pindah paragraf di dalam sel: **Ctrl+Enter**.
- Perubahan tampil otomatis maksimal 10 menit. Ingin langsung? Di editor Apps Script jalankan fungsi **`bersihkanCache`**.
- Tidak perlu deploy ulang untuk perubahan teks.

## Pengaturan (bagian atas `Code.gs`)

| Pengaturan | Arti |
|---|---|
| `SPREADSHEET_ID` | Kosongkan bila script dibuat dari Ekstensi → Apps Script (cara di atas). |
| `MAKS_EMAIL_PER_30MNT` | Batas kirim PDF ke email yang sama (anti-spam). Default 3. |
| `CATAT_RIWAYAT` | `true` = setiap PDF terkirim dicatat di sheet Riwayat. |

---

## Catatan penting

- **Tombol layar penuh** (ikon ⛶ di kanan atas) memakai fitur fullscreen browser. Jika web app disematkan lewat iframe, pastikan iframe memiliki atribut `allow="fullscreen" allowfullscreen` (lihat contoh di bawah). Bila browser menolak, pengguna mendapat petunjuk untuk menekan F11.
- **Jam digital & info hari ini** mengikuti jam perangkat pengguna (zona WIB/WITA/WIT terdeteksi otomatis). Tanggal Hijriah dan weton dihitung per tanggal Masehi (pergantian hari tradisional saat maghrib tidak diperhitungkan).
- **Tampilan bawaan: mode terang.** Jika pengguna memilih mode gelap, pilihannya diingat di browser tersebut.

- **Kuota email**: akun Gmail biasa ±100 email/hari, Google Workspace ±1.500/hari. Jika habis, pengguna mendapat pesan yang rapi.
- **Banner abu-abu "Aplikasi ini dibuat oleh pengguna Google Apps Script"** di atas halaman berasal dari Google dan tidak bisa dihapus dari dalam kode. Cara menyembunyikannya: sematkan web app di website Anda (mis. BluPrince.id atau Google Sites) memakai iframe — izin iframe sudah diaktifkan di kode:
  ```html
  <iframe src="URL_WEB_APP_ANDA" style="width:100%;height:100vh;border:0" allow="fullscreen" allowfullscreen></iframe>
  ```
- **Proteksi teks**: kotak deskripsi tidak bisa diseleksi, disalin, klik kanan, atau dicetak, dan diberi watermark nama. Namun tidak ada proteksi web yang 100% (tangkapan layar tetap bisa).
- **Kalender Hijriah** memakai metode Umm al-Qura; bisa berbeda ±1 hari dengan kalender rukyat/Kemenag (sudah diberi keterangan di aplikasi).
- **Shio** mengikuti tanggal Imlek (bukan 1 Januari). Contoh: lahir 20 Januari 1990 → shio tahun 1989 (Ular).
- **Life Path** dihitung: angka tanggal, bulan, tahun masing-masing diringkas, lalu dijumlahkan; angka master 11, 22, 33 dipertahankan.
- **Neptu**: Minggu 5, Senin 4, Selasa 3, Rabu 7, Kamis 8, Jumat 6, Sabtu 9 · Legi 5, Pahing 9, Pon 7, Wage 4, Kliwon 8.

## Jika ada masalah

| Gejala | Solusi |
|---|---|
| "Sheet "Weton" tidak ditemukan" | Pastikan nama sheet persis `Weton`, `Zodiak`, `Shio`, `LifePath`. |
| Perubahan kode tidak muncul | Deploy ulang dengan **Versi baru** (lihat atas). |
| Email tidak masuk | Cek folder Spam/Promosi; cek sheet Riwayat; cek kuota dengan `ujiCoba`. |
| Error izin | Jalankan `ujiCoba` lagi dan setujui semua izin. |
