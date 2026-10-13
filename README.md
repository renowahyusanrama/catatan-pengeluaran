# Catatan Pengeluaran

Website pencatatan pengeluaran pribadi yang minimalis, ringan, dan berfungsi penuh. Tanpa login, bisa dipakai di HP maupun desktop, dengan laporan harian/mingguan/bulanan.

## Fitur Utama

- **Ringkasan** — total pengeluaran hari ini, minggu ini, bulan ini, jumlah transaksi, kategori terbesar, dan sisa anggaran.
- **Tambah/Edit/Hapus pengeluaran** — nominal dalam Rupiah, kategori, tanggal, dan catatan opsional.
- **Tanggal otomatis** — memakai zona waktu `Asia/Jakarta`. Saat hari berganti, ringkasan diperbarui otomatis tanpa menghapus riwayat.
- **Laporan mingguan** — grafik per hari, rata-rata, kategori terbesar, navigasi antar minggu (Senin–Minggu).
- **Laporan bulanan** — grafik per tanggal, perbandingan bulan sebelumnya, pengeluaran per kategori.
- **Riwayat** — pencarian, filter kategori/tanggal, preset hari/minggu/bulan, pemuatan bertahap.
- **Anggaran bulanan** — progress bar dan peringatan saat mendekati/melewati batas.
- **Ekspor CSV** — sesuai periode & filter yang dipilih, bisa dibuka di Excel/Google Sheets.

## Tumpukan Teknologi

| Bagian | Teknologi |
| --- | --- |
| Frontend | React + TypeScript + Vite |
| Styling | Tailwind CSS |
| Grafik | Recharts |
| Ikon | Lucide Icons |
| Backend | Node.js + Express (TypeScript) |
| Database | Supabase PostgreSQL |

## Struktur Proyek

```
.
├── client/                  # Aplikasi React (frontend)
│   ├── src/
│   │   ├── components/      # Komponen UI
│   │   ├── context/         # State & aksi data (AppContext)
│   │   ├── lib/             # Tanggal, format, kategori, CSV, analytics
│   │   ├── store/           # localStorage + API backend
│   │   ├── pages/           # Dashboard, Transaksi, Laporan, Pengaturan
│   │   └── hooks/           # useToday (rollover tengah malam)
│   └── .env.example
├── server/                  # API Express (menyimpan service-role key)
│   ├── src/
│   └── .env.example
├── sql/schema.sql           # Skema tabel + keamanan RLS
└── package.json             # Workspace root
```

---

## 1. Menjalankan Secara Lokal (Mode Lokal, Tanpa Database)

Mode ini memakai `localStorage` dan langsung berfungsi untuk satu perangkat.

```bash
# dari root proyek
npm install
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3001

### Perintah Berguna (workspace npm)

```bash
npm run dev              # menjalankan client + server sekaligus
npm run dev:client       # hanya frontend
npm run dev:server       # hanya backend
npm run build            # build produksi frontend
npm run typecheck        # cek tipe frontend
```

---

## 2. Mengaktifkan Sinkronisasi Antar Perangkat (Supabase)

Agar data yang sama bisa diakses dari HP, laptop, dan komputer lain, hubungkan ke Supabase.

### a. Buat Project Supabase

1. Buka [supabase.com](https://supabase.com) dan buat project baru.
2. Buka **SQL Editor**, tempel seluruh isi `sql/schema.sql`, lalu **Run**.
   - Ini membuat tabel `transactions`, `budgets`, indeks, serta RLS yang memblokir seluruh akses publik/anon.
3. Catat dua nilai berikut dari **Settings → API**:
   - **Project URL** — contoh `https://abcdefgh.supabase.co`
   - **Service role key** (`service_role`) — **bukan** anon key.

### b. Konfigurasi Backend

Salin contoh env lalu isi:

```bash
cp server/.env.example server/.env
```

Isi `server/.env`:

```env
PORT=3001
SUPABASE_URL=https://abcdefgh.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...   # service_role key
ACCESS_KEY=<kunci-acak-yang-panjang>
```

Buat `ACCESS_KEY` dengan perintah:

```bash
node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"
```

### c. Konfigurasi Frontend

```bash
cp client/.env.example client/.env
```

Isi `client/.env`:

```env
VITE_API_URL=http://localhost:3001   # saat deploy, isi URL backend produksi
```

Jalankan ulang `npm run dev`. Buka **Pengaturan**, masukkan `ACCESS_KEY` yang sama dengan yang ada di `server/.env`, lalu tekan **Simpan & Sambungkan**.

Status koneksi terlihat di halaman Pengaturan. Jika muncul *"Kunci akses diperlukan"*, berarti kunci belum/salah dimasukkan.

---

## 3. Cara Kerja Keamanan (Penting — Tanpa Login)

Karena aplikasi **tidak memakai login**, arsitektur sengaja dirancang agar data tidak bisa dibaca sembarang orang:

1. **Frontend tidak pernah memegang service-role key.** Kunci itu hanya ada di `server/.env`.
2. Semua akses data lewat **backend (Express)**, bukan langsung dari browser.
3. Setiap request memerlukan header `Authorization: Bearer <ACCESS_KEY>`.
4. Di database, **RLS diaktifkan dan seluruh akses anon/authenticated diblokir** (`using (false)`). Hanya backend (yang memakai service-role key) yang bisa mengakses.

**Konsekuensi & batasan:**

- `ACCESS_KEY` bersifat **rahasia bersama**. Siapa pun yang memegangnya dapat membaca/mengubah seluruh data. Bagikan hanya ke perangkat milikmu.
- Data **bukan privat mutlak** — praktik keamanan terbaik tetap harus memakai sistem autentikasi (mis. Supabase Auth) bila data sangat sensitif.
- Simpan `ACCESS_KEY` di `localStorage` perangkat, lalu backend memvalidasinya. Jangan menaruh `ACCESS_KEY`/`service-role key` di repo atau frontend.

---

## 4. Deployment

### Frontend (statis)

Build lalu deploy `client/dist` ke Vercel/Netlify.

```bash
npm run build
```

Set environment variable pada platform:

```
VITE_API_URL=https://api-mu.com
```

### Backend

Deploy `server/` ke Node.js host (Railway, Render, Fly.io, dsb), atau VM sendiri:

```bash
npm run build:server
npm run start:server
```

Set environment variables backend: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ACCESS_KEY`, `PORT`.

> Pastikan backend mengizinkan CORS dari domain frontend. Untuk keamanan lebih ketat, batasi origin pada konfigurasi CORS.

---

## 5. Pengujian Utama

Skenario wajib yang sudah didukung:

1. Menambah transaksi hari ini / kemarin.
2. Mengedit dan menghapus (dengan konfirmasi).
3. Total harian, mingguan, bulanan dihitung ulang dari data terbaru.
4. Data tetap ada setelah refresh (localStorage / Supabase).
5. Data yang sama muncul di perangkat berbeda setelah Supabase + access key dikonfigurasi.
6. Pergantian hari memperbarui ringkasan tanpa menghapus riwayat.
7. Laporan tidak rusak saat ganti bulan/tahun (perhitungan memakai tanggal transaksi).
8. Nominal nol/negatif ditolak form.
9. Ekspor CSV mengikuti filter/periode.
10. Gagal koneksi tidak menghilangkan data secara diam-diam (notifikasi error & status koneksi ditampilkan).

---

## Catatan

- Zona waktu default **Asia/Jakarta**; periode dihitung dari tanggal transaksi, bukan tanggal input.
- Nominal disimpan sebagai bilangan bulat Rupiah.
- Backend belum dikonfigurasi → aplikasi tetap jalan dalam **mode lokal** dan menampilkan peringatan status koneksi, bukan klaim sinkronisasi yang belum aktif.