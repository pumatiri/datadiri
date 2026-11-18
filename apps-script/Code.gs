/**
 * ============================================================
 *  JATI DIRI — Primbon Digital  |  (C) Ragam Bahasa 2026
 *  by Rudi Bahruddin
 * ------------------------------------------------------------
 *  File  : Code.gs  (kode server / backend)
 *  Isi   : pengaturan, perhitungan (Hijriah, weton, neptu,
 *          usia, zodiak, shio, life path), baca database
 *          Google Sheet, buat PDF, dan kirim email.
 * ============================================================
 */

// ======================= PENGATURAN =========================
const CONFIG = {
  APP_TITLE: 'Jati Diri — Primbon Digital | Ragam Bahasa',
  BRAND: 'Ragam Bahasa',
  TIMEZONE: 'Asia/Jakarta',

  // Kosongkan jika script dibuat dari menu Ekstensi > Apps Script
  // di dalam Google Sheet database (cara yang disarankan).
  // Jika script dibuat terpisah, isi dengan ID spreadsheet database.
  SPREADSHEET_ID: '',

  CACHE_MENIT: 10,          // lama data deskripsi disimpan di cache
  MAKS_EMAIL_PER_30MNT: 3,  // batas kirim PDF ke email yang sama
  CATAT_RIWAYAT: true       // catat pengiriman PDF di sheet "Riwayat"
};

// ======================= HALAMAN WEB ========================
function doGet() {
  const t = HtmlService.createTemplateFromFile('Index');
  t.logo = 'data:image/png;base64,' + LOGO_BASE64;
  return t.evaluate()
    .setTitle(CONFIG.APP_TITLE)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/** Menyisipkan file HTML lain (Styles, Script) ke Index. */
function include(namaFile) {
  return HtmlService.createHtmlOutputFromFile(namaFile).getContent();
}

// ================= FUNGSI YANG DIPANGGIL WEB ================

/**
 * Dipanggil dari halaman web saat tombol "Baca Jati Diri" ditekan.
 * @param {string} nama  Nama lengkap
 * @param {string} tgl   Tanggal lahir format yyyy-mm-dd
 */
function hitungJatiDiri(nama, tgl) {
  const hasil = hitungInti_(nama, tgl, hariIniJakarta_());
  lengkapiDeskripsi_(hasil);
  return hasil;
}

/**
 * Membuat PDF hasil lengkap lalu mengirimkannya ke email.
 */
function kirimPdf(nama, tgl, email) {
  email = String(email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    throw new Error('Alamat email tidak valid. Periksa kembali penulisannya.');
  }

  // Batasi pengiriman berulang ke email yang sama
  const cache = CacheService.getScriptCache();
  const kunci = 'mail_' + Utilities.base64EncodeWebSafe(email).slice(0, 200);
  const jumlah = Number(cache.get(kunci) || 0);
  if (jumlah >= CONFIG.MAKS_EMAIL_PER_30MNT) {
    throw new Error('Email ini sudah menerima beberapa PDF. Silakan coba lagi sekitar 30 menit lagi.');
  }
  if (MailApp.getRemainingDailyQuota() < 1) {
    throw new Error('Kuota pengiriman email hari ini sudah habis. Silakan coba lagi besok.');
  }

  // Hitung ulang di server (data dari browser tidak dipakai langsung)
  const h = hitungJatiDiri(nama, tgl);

  const tpl = HtmlService.createTemplateFromFile('PdfTemplate');
  tpl.h = h;
  tpl.logo = 'data:image/png;base64,' + LOGO_BASE64;
  tpl.dibuat = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'dd/MM/yyyy HH:mm') + ' WIB';
  const html = tpl.evaluate().getContent();

  const namaFile = 'Jati Diri - ' + h.nama.replace(/[^\w\s.-]/g, '') + '.pdf';
  const pdf = Utilities.newBlob(html, 'text/html', 'laporan.html')
    .getAs('application/pdf').setName(namaFile);

  const badan =
    '<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;border:1px solid #eadfcf;border-radius:14px;overflow:hidden">' +
      '<div style="background:#B3121B;color:#fff;padding:22px 26px">' +
        '<div style="font-size:12px;letter-spacing:3px;opacity:.85">PRIMBON DIGITAL</div>' +
        '<div style="font-size:24px;font-weight:bold;margin-top:4px">Jati Diri</div>' +
      '</div>' +
      '<div style="padding:24px 26px;color:#2b1b17;line-height:1.6">' +
        '<p>Halo <b>' + escapeHtml_(h.nama) + '</b>,</p>' +
        '<p>Terima kasih telah menggunakan <b>Jati Diri</b>. Laporan lengkap Anda terlampir dalam format PDF.</p>' +
        '<table style="border-collapse:collapse;width:100%;font-size:14px;margin:12px 0">' +
          baris_('Tanggal lahir', h.lahir.teks) +
          baris_('Hijriah', h.hijriah.teks) +
          baris_('Weton', h.weton.teks + ' (neptu ' + h.weton.neptu + ')') +
          baris_('Zodiak', h.zodiak.nama) +
          baris_('Shio', h.shio.nama + ' ' + h.shio.elemen) +
          baris_('Life Path', h.lifePath.angka + ' — ' + h.lifePath.julukan) +
        '</table>' +
        '<p style="font-size:12px;color:#8a7a70">Hasil ini bersifat hiburan dan bahan refleksi diri, bukan ramalan pasti.</p>' +
      '</div>' +
      '<div style="background:#f7efe4;padding:12px 26px;font-size:12px;color:#8a7a70;text-align:center">(C) Ragam Bahasa 2026 | by Rudi Bahruddin</div>' +
    '</div>';

  MailApp.sendEmail({
    to: email,
    subject: 'Laporan Jati Diri — ' + h.nama,
    htmlBody: badan,
    name: CONFIG.BRAND,
    attachments: [pdf]
  });

  cache.put(kunci, String(jumlah + 1), 30 * 60);
  catatRiwayat_([new Date(), h.nama, h.lahir.iso, h.weton.teks, email, 'PDF terkirim']);
  return { ok: true, email: email };
}

function baris_(k, v) {
  return '<tr><td style="padding:6px 0;color:#8a7a70;width:120px">' + k +
         '</td><td style="padding:6px 0;font-weight:bold">' + escapeHtml_(v) + '</td></tr>';
}

// ===================== PERHITUNGAN INTI =====================
// (fungsi-fungsi di bawah ini murni JavaScript, tidak bergantung GAS)

const NAMA_HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const NEPTU_HARI = { Minggu: 5, Senin: 4, Selasa: 3, Rabu: 7, Kamis: 8, Jumat: 6, Sabtu: 9 };
const NAMA_PASARAN = ['Legi', 'Pahing', 'Pon', 'Wage', 'Kliwon'];
const NEPTU_PASARAN = { Legi: 5, Pahing: 9, Pon: 7, Wage: 4, Kliwon: 8 };
const NAMA_BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli',
  'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const BULAN_HIJRIAH = ['Muharram', 'Safar', 'Rabiul Awal', 'Rabiul Akhir', 'Jumadil Awal',
  'Jumadil Akhir', 'Rajab', "Sya'ban", 'Ramadhan', 'Syawal', "Dzulqa'dah", 'Dzulhijjah'];

const ZODIAK_TABEL = [ // [bulan, tanggal mulai, nama, simbol]
  [1, 20, 'Aquarius', '♒'], [2, 19, 'Pisces', '♓'], [3, 21, 'Aries', '♈'],
  [4, 20, 'Taurus', '♉'], [5, 21, 'Gemini', '♊'], [6, 21, 'Cancer', '♋'],
  [7, 23, 'Leo', '♌'], [8, 23, 'Virgo', '♍'], [9, 23, 'Libra', '♎'],
  [10, 23, 'Scorpio', '♏'], [11, 22, 'Sagitarius', '♐'], [12, 22, 'Capricorn', '♑']
];
const SHIO_NAMA = ['Tikus', 'Kerbau', 'Macan', 'Kelinci', 'Naga', 'Ular',
  'Kuda', 'Kambing', 'Monyet', 'Ayam', 'Anjing', 'Babi'];
const SHIO_IKON = ['🐀', '🐂', '🐅', '🐇', '🐉', '🐍', '🐎', '🐐', '🐒', '🐓', '🐕', '🐖'];
const SHIO_ELEMEN = ['Logam', 'Logam', 'Air', 'Air', 'Kayu', 'Kayu', 'Api', 'Api', 'Tanah', 'Tanah'];

// Tanggal Tahun Baru Imlek 1900–2100 (format: bulan + tanggal 2 digit)
const IMLEK = '131,219,208,129,216,204,125,213,202,122,210,130,218,206,126,214,203,123,211,201,220,208,128,216,205,124,213,202,123,210,130,217,206,126,214,204,124,211,131,219,208,127,215,205,125,213,202,122,210,129,217,206,127,214,204,124,212,131,218,208,128,215,205,125,213,202,121,209,130,217,206,127,215,203,123,211,131,218,207,128,216,205,125,213,202,220,209,129,217,206,127,215,204,123,210,131,219,207,128,216,205,124,212,201,122,209,129,218,207,126,214,203,123,210,131,219,208,128,216,205,125,212,201,122,210,129,217,207,126,213,202,123,211,131,219,208,128,215,204,124,212,201,122,210,130,217,206,126,214,202,123,211,201,219,208,128,215,204,124,212,202,121,209,129,217,205,126,214,203,123,211,131,219,207,127,215,205,124,212,202,122,209,129,217,206,126,214,203,124,210,130,218,207,127,215,205,125,212,201,121,209'.split(',');

function hitungInti_(nama, tgl, hariIni) {
  nama = String(nama || '').replace(/\s+/g, ' ').trim();
  if (nama.length < 2) throw new Error('Nama lengkap wajib diisi (minimal 2 huruf).');
  if (nama.length > 80) throw new Error('Nama terlalu panjang (maksimal 80 karakter).');
  if (!/^[A-Za-zÀ-ÿ'.,\- ]+$/.test(nama)) {
    throw new Error('Nama hanya boleh berisi huruf, spasi, titik, koma, apostrof, atau tanda hubung.');
  }
  nama = nama.toLowerCase().replace(/(^|[\s'\-.])([a-zà-ÿ])/g, (m, a, b) => a + b.toUpperCase());

  const p = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(tgl || ''));
  if (!p) throw new Error('Tanggal lahir belum diisi dengan benar.');
  const y = +p[1], m = +p[2], d = +p[3];
  if (m < 1 || m > 12 || d < 1 || d > hariDalamBulan_(y, m)) throw new Error('Tanggal lahir tidak valid.');
  if (y < 1900) throw new Error('Tanggal lahir minimal tahun 1900.');
  const [ty, tm, td] = hariIni;
  if (y * 10000 + m * 100 + d > ty * 10000 + tm * 100 + td) {
    throw new Error('Tanggal lahir tidak boleh melebihi hari ini.');
  }

  const jd = jdn_(y, m, d);
  const jdHariIni = jdn_(ty, tm, td);
  const hari = NAMA_HARI[(jd + 1) % 7];
  const pasaran = NAMA_PASARAN[jd % 5]; // acuan: 17-08-1945 = Jumat Legi
  const nH = NEPTU_HARI[hari], nP = NEPTU_PASARAN[pasaran];

  // Weton berikutnya (berulang setiap 35 hari)
  const selisih = (jdHariIni - jd) % 35;
  const jdWetonBerikut = jdHariIni + (selisih === 0 ? 0 : 35 - selisih);

  return {
    nama: nama,
    inisial: nama.split(' ').filter(Boolean).slice(0, 2).map(s => s[0]).join('').toUpperCase(),
    lahir: { iso: tgl, y: y, m: m, d: d, teks: hari + ', ' + d + ' ' + NAMA_BULAN[m - 1] + ' ' + y },
    hijriah: hijriah_(y, m, d, jd),
    weton: {
      hari: hari, pasaran: pasaran, teks: hari + ' ' + pasaran,
      neptuHari: nH, neptuPasaran: nP, neptu: nH + nP,
      berikutnya: teksDariJd_(jdWetonBerikut),
      hariLagi: jdWetonBerikut - jdHariIni
    },
    usia: usia_(y, m, d, ty, tm, td, jd, jdHariIni),
    zodiak: zodiak_(m, d),
    shio: shio_(y, m, d),
    lifePath: lifePath_(y, m, d),
    hariIni: teksDariJd_(jdHariIni)
  };
}

function hariDalamBulan_(y, m) { return new Date(Date.UTC(y, m, 0)).getUTCDate(); }

/** Julian Day Number (hari ke-n) dari tanggal Masehi. */
function jdn_(y, m, d) {
  const a = Math.floor((14 - m) / 12), yy = y + 4800 - a, mm = m + 12 * a - 3;
  return d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4)
    - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
}

function teksDariJd_(jd) {
  const t = new Date(Date.UTC(1970, 0, 1) + (jd - 2440588) * 864e5);
  return NAMA_HARI[(jd + 1) % 7] + ' ' + NAMA_PASARAN[jd % 5] + ', ' +
    t.getUTCDate() + ' ' + NAMA_BULAN[t.getUTCMonth()] + ' ' + t.getUTCFullYear();
}

/** Kalender Hijriah: Umm al-Qura (jika tersedia), cadangan: hisab urfi. */
function hijriah_(y, m, d, jd) {
  let hy, hm, hd, metode = 'Umm al-Qura';
  try {
    const f = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn',
      { timeZone: 'UTC', year: 'numeric', month: 'numeric', day: 'numeric' });
    const parts = f.formatToParts(new Date(Date.UTC(y, m - 1, d, 12)));
    const ambil = t => parseInt((parts.find(x => x.type === t) || {}).value, 10);
    hy = ambil('year'); hm = ambil('month'); hd = ambil('day');
    if (!(hy > 1300 && hy < 1600 && hm >= 1 && hm <= 12 && hd >= 1 && hd <= 30)) throw 0;
    const cek = hijriUrfi_(jd); // validasi: selisih dengan hisab urfi maksimal 3 hari
    if (Math.abs((hy * 354 + hm * 29.5 + hd) - (cek[0] * 354 + cek[1] * 29.5 + cek[2])) > 3) throw 0;
  } catch (e) {
    const r = hijriUrfi_(jd); hy = r[0]; hm = r[1]; hd = r[2]; metode = 'Hisab urfi';
  }
  return { y: hy, m: hm, d: hd, bulan: BULAN_HIJRIAH[hm - 1], teks: hd + ' ' + BULAN_HIJRIAH[hm - 1] + ' ' + hy + ' H', metode: metode };
}

function hijriUrfi_(jdn) {
  const keJd = (yy, mm, dd) => dd + Math.ceil(29.5 * (mm - 1)) + (yy - 1) * 354 +
    Math.floor((3 + 11 * yy) / 30) + 1948439.5 - 1;
  const jd = jdn - 0.5;
  const yy = Math.floor((30 * (jd - 1948439.5) + 10646) / 10631);
  const mm = Math.min(12, Math.ceil((jd - (29 + keJd(yy, 1, 1))) / 29.5) + 1);
  const dd = Math.round(jd - keJd(yy, mm, 1)) + 1;
  return [yy, mm, dd];
}

function usia_(y, m, d, ty, tm, td, jd, jdHariIni) {
  let th = ty - y, bl = tm - m, hr = td - d;
  if (hr < 0) { bl--; hr += hariDalamBulan_(tm === 1 ? ty - 1 : ty, tm === 1 ? 12 : tm - 1); }
  if (bl < 0) { th--; bl += 12; }

  // Ulang tahun berikutnya (29 Feb dirayakan 28 Feb pada tahun biasa)
  const ultahPada = yr => (m === 2 && d === 29 && hariDalamBulan_(yr, 2) === 28) ? [yr, 2, 28] : [yr, m, d];
  let u = ultahPada(ty);
  if (u[1] * 100 + u[2] <= tm * 100 + td) u = ultahPada(ty + 1);
  if (u[0] === ty && u[1] === tm && u[2] === td) u = ultahPada(ty + 1);
  const jdUltah = jdn_(u[0], u[1], u[2]);
  const ultahHariIni = (bl === 0 && hr === 0);

  return {
    tahun: th, bulan: bl, hari: hr,
    teks: th + ' tahun, ' + bl + ' bulan, ' + hr + ' hari',
    totalHari: jdHariIni - jd,
    ultahHariIni: ultahHariIni,
    ultahBerikutnya: { teks: teksDariJd_(jdUltah), hariLagi: jdUltah - jdHariIni, ke: u[0] - y }
  };
}

function zodiak_(m, d) {
  let z = ZODIAK_TABEL[11]; // Capricorn (1–19 Jan)
  for (let i = 0; i < ZODIAK_TABEL.length; i++) {
    const t = ZODIAK_TABEL[i];
    if (m > t[0] || (m === t[0] && d >= t[1])) z = t;
  }
  return { nama: z[2], simbol: z[3] };
}

function shio_(y, m, d) {
  let tahun = y;
  const kode = IMLEK[y - 1900];
  let imlekTeks = '';
  if (kode) {
    const im = parseInt(kode.slice(0, -2), 10), id = parseInt(kode.slice(-2), 10);
    imlekTeks = id + ' ' + NAMA_BULAN[im - 1] + ' ' + y;
    if (m * 100 + d < im * 100 + id) tahun = y - 1;
  } else if (m < 2 || (m === 2 && d < 4)) {
    tahun = y - 1;
  }
  const idx = ((tahun - 4) % 12 + 12) % 12;
  const elemen = SHIO_ELEMEN[((tahun % 10) + 10) % 10];
  return {
    nama: SHIO_NAMA[idx], ikon: SHIO_IKON[idx], elemen: elemen,
    yinyang: tahun % 2 === 0 ? 'Yang' : 'Yin', tahunImlek: tahun,
    catatan: tahun !== y ? 'Lahir sebelum Imlek ' + imlekTeks + ', sehingga mengikuti shio tahun ' + tahun + '.' : ''
  };
}

function lifePath_(y, m, d) {
  const jumlah = n => String(n).split('').reduce((a, b) => a + Number(b), 0);
  const ringkas = n => { while (n > 9 && n !== 11 && n !== 22 && n !== 33) n = jumlah(n); return n; };
  const rd = ringkas(d), rm = ringkas(m), ry = ringkas(y);
  const total = rd + rm + ry;
  const angka = ringkas(total);
  return {
    angka: angka,
    master: angka > 9,
    rumus: 'Tanggal ' + d + ' → ' + rd + '  •  Bulan ' + m + ' → ' + rm + '  •  Tahun ' + y + ' → ' + ry +
      '  •  ' + rd + ' + ' + rm + ' + ' + ry + ' = ' + total + (total !== angka ? ' → ' + angka : '')
  };
}

// ===================== DATABASE (SHEET) =====================

function spreadsheet_() {
  return CONFIG.SPREADSHEET_ID
    ? SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID)
    : SpreadsheetApp.getActiveSpreadsheet();
}

/** Membaca sheet menjadi daftar objek {judulKolom: nilai}, disimpan di cache. */
function bacaTabel_(namaSheet) {
  const cache = CacheService.getScriptCache();
  const kunci = 'tbl_v1_' + namaSheet;
  const ada = cache.get(kunci);
  if (ada) return JSON.parse(ada);

  const ss = spreadsheet_();
  if (!ss) throw new Error('Database belum terhubung. Isi CONFIG.SPREADSHEET_ID di Code.gs.');
  const sh = ss.getSheetByName(namaSheet);
  if (!sh) throw new Error('Sheet "' + namaSheet + '" tidak ditemukan di database.');
  const nilai = sh.getDataRange().getDisplayValues();
  const judul = nilai.shift().map(s => String(s).trim());
  const data = nilai.filter(r => r.join('').trim()).map(r => {
    const o = {}; judul.forEach((j, i) => o[j] = String(r[i]).trim()); return o;
  });
  try { cache.put(kunci, JSON.stringify(data), CONFIG.CACHE_MENIT * 60); } catch (e) { /* data terlalu besar untuk cache */ }
  return data;
}

const normal_ = s => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const paragraf_ = s => String(s || '').split(/\n+/).map(x => x.trim()).filter(Boolean);

function lengkapiDeskripsi_(h) {
  const w = bacaTabel_('Weton').find(r => normal_(r.Hari) === normal_(h.weton.hari) && normal_(r.Pasaran) === normal_(h.weton.pasaran)) || {};
  h.weton.deskripsi = paragraf_(w.Deskripsi);

  const z = bacaTabel_('Zodiak').find(r => normal_(r.Zodiak) === normal_(h.zodiak.nama)) || {};
  Object.assign(h.zodiak, { rentang: z.Rentang || '', elemen: z.Elemen || '', planet: z.Planet || '',
    kekuatan: z.Kekuatan || '', tantangan: z.Tantangan || '', deskripsi: paragraf_(z.Deskripsi) });

  const s = bacaTabel_('Shio').find(r => normal_(r.Shio) === normal_(h.shio.nama)) || {};
  Object.assign(h.shio, { kekuatan: s.Kekuatan || '', tantangan: s.Tantangan || '', deskripsi: paragraf_(s.Deskripsi) });

  const l = bacaTabel_('LifePath').find(r => Number(r.Angka) === h.lifePath.angka) || {};
  Object.assign(h.lifePath, { julukan: l.Julukan || '', kekuatan: l.Kekuatan || '', tantangan: l.Tantangan || '',
    karier: l.Karier || '', deskripsi: paragraf_(l.Deskripsi) });
  return h;
}

function catatRiwayat_(baris) {
  if (!CONFIG.CATAT_RIWAYAT) return;
  try {
    const ss = spreadsheet_();
    const sh = ss.getSheetByName('Riwayat') || ss.insertSheet('Riwayat');
    if (sh.getLastRow() === 0) sh.appendRow(['Waktu', 'Nama', 'Tanggal Lahir', 'Weton', 'Email', 'Status']);
    sh.appendRow(baris);
  } catch (e) { console.warn('Gagal mencatat riwayat: ' + e); }
}

// ========================= UTILITAS =========================

function hariIniJakarta_() {
  const s = (typeof Utilities !== 'undefined')
    ? Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'yyyy-MM-dd')
    : new Intl.DateTimeFormat('en-CA', { timeZone: CONFIG.TIMEZONE }).format(new Date());
  return s.split('-').map(Number);
}

function escapeHtml_(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/** Jalankan sekali dari editor setelah mengedit database agar cache segera diperbarui. */
function bersihkanCache() {
  CacheService.getScriptCache().removeAll(['tbl_v1_Weton', 'tbl_v1_Zodiak', 'tbl_v1_Shio', 'tbl_v1_LifePath']);
  console.log('Cache dibersihkan. Data terbaru akan langsung dipakai.');
}

/** Jalankan sekali dari editor untuk memberi izin akses (Sheet + Gmail) dan uji perhitungan. */
function ujiCoba() {
  const h = hitungJatiDiri('Rudi Bahruddin', '1990-05-12');
  console.log(JSON.stringify(h, null, 2));
  console.log('Sisa kuota email hari ini: ' + MailApp.getRemainingDailyQuota());
}
