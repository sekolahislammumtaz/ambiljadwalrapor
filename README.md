# Jadwal Pengambilan Rapor – Sekolah Islam Mumtaz

Aplikasi web full-stack modern untuk penjadwalan pengambilan rapor santri/siswa **Sekolah Islam Mumtaz Bandar Lampung** secara online. Dilengkapi dengan **Halaman Publik Orang Tua / Wali**, **Dashboard Administrator**, dan **Dashboard Pengawas Lapangan** dengan sistem monitoring kehadiran real-time dan notifikasi alarm audio bel sekolah.

---

## 🌟 Fitur Utama

### 1. Orang Tua / Wali Santri (`/`)
* **Pemilihan Bertahap (4 Langkah):**
  1. Pilih Kelas
  2. Pilih Nama Siswa (Searchable dropdown, hanya siswa kelas terpilih yang belum memilih jadwal)
  3. Pilih Slot Waktu Jadwal
  4. Konfirmasi & Cetak Bukti Jadwal
* **Anti-Double-Booking:** Validasi Database Transaction dan Unique Constraints di backend untuk mencegah dua orang tua memilih slot yang sama atau satu siswa memesan jadwal ganda.
* **Tabel Rekapan Dinamis (Real-time):** Menampilkan daftar siswa yang telah memilih jadwal untuk kelas yang sedang dibuka, **diurutkan secara mutlak dari jam paling pagi ke paling siang (bukan berdasarkan nama)**.

### 2. Dashboard Pengawas (`/pengawas/dashboard`)
* Tersedia **6 Akun Pengawas Lapangan** (`pengawas1` s.d. `pengawas6`).
* **Multi-Class Supervision:** Pengawas dapat memilih satu, dua, atau beberapa kelas yang diawasi (misal: VII A & VII B).
* **Checkbox Kehadiran Orang Tua:**
  * Centang "Orang Tua Datang" otomatis mengubah status menjadi `Menunggu` dan mencatat waktu kehadiran (`arrivedAt`).
* **Alarm Otomatis (`bell.mp3`):**
  * Ketika waktu slot siswa yang **sudah dicentang kehadirannya** tiba, alarm `bell.mp3` otomatis berbunyi disertai notifikasi pop-up visual `🔔 WAKTU PENGAMBILAN RAPOR`.
  * Siswa yang belum dicentang kehadirannya tidak akan memicu alarm.
  * Tombol **"Aktifkan Suara"** untuk kompatibilitas browser autoplay policy & tombol **"Hentikan Alarm"**.
  * Dilengkapi fallback sintetis Web Audio API jika browser memblokir audio file.
* **Penyelesaian Layanan:** Tombol tandai `Selesai` mencatat waktu selesai (`completedAt`).
* **Live Monitoring:** Auto-polling setiap 4 detik tanpa perlu refresh halaman manual.

### 3. Dashboard Administrator (`/admin`)
* **Statistik Komprehensif:** Total event, kelas, siswa, slot, persentase keterisian.
* **Pengaturan Periode / Event:** Multi-event (Semester Ganjil, Genap, dll) tanpa menghapus arsip lama.
* **Manajemen Kelas:** CRUD kelas dan status aktif/nonaktif.
* **Manajemen Siswa:** Tambah, edit, hapus, pindah kelas, dan **Bulk Import Siswa (1 nama per baris)**.
* **Generator Jadwal Otomatis:**
  * Mendukung durasi **10, 15, dan 20 menit**.
  * **Aturan Khusus Waktu Istirahat:** Mulai 08.00 WIB, secara otomatis melompati rentang **11.45 – 13.00 WIB** dan langsung melanjutkan pada 13.00 WIB tanpa tabrakan slot.
* **Rekap Pengambilan Rapor:** Filter kelas, status, tanggal, dan pencarian nama.
* **Hapus Satu Jadwal:** Mengembalikan slot menjadi `AVAILABLE` secara instan.
* **HAPUS SEMUA JADWAL (Aksi Berisiko):** Wajib memasukkan Password Admin untuk konfirmasi server-side.
* **Export CSV:** Unduh rekapan lengkap untuk arsip sekolah.
* **Pengaturan Pengawas & Aplikasi:** Atur subtitle aplikasi yang tampil di halaman depan.

---

## 🎨 Tema & Desain

* **Warna Dominan:** Biru Navy (`#0f233f`, `#091728`)
* **Aksen Mewah:** Kuning Gold (`#eab308`, `#facc15`, `#ca8a04`)
* **Latar Belakang:** Bersih (Off-white / Slate-50)
* **Responsif:** Mobile friendly, Tablet, Laptop, Desktop.
* **Aset:**
  * Logo Sekolah: `/public/mumtaz.png`
  * Suara Alarm: `/public/bell.mp3`

---

## 🔐 Kredensial Awal

### Administrator
* **URL:** `/admin`
* **Username:** `admin`
* **Password:** `SiMumtaz123` (Dapat diubah via environment variable `ADMIN_PASSWORD`)

### Pengawas (6 Akun)
* **URL:** `/pengawas`
| Akun | Username | Password Awal |
|---|---|---|
| Pengawas 1 | `pengawas1` | `abungawas1` |
| Pengawas 2 | `pengawas2` | `abungawas2` |
| Pengawas 3 | `pengawas3` | `abungawas3` |
| Pengawas 4 | `pengawas4` | `abungawas4` |
| Pengawas 5 | `pengawas5` | `abungawas5` |
| Pengawas 6 | `pengawas6` | `abungawas6` |

*Seluruh password di-hash secara aman menggunakan `bcryptjs`.*

---

## 🛠️ Instalasi & Menjalankan di Lokal

### 1. Prasyarat
* Node.js v18+ atau v20+ / v24+
* npm

### 2. Clone & Install Dependensi
```bash
npm install
```

### 3. Konfigurasi Environment Variable
Salin file `.env.example` menjadi `.env`:
```env
# Mode Pengujian Lokal Cepat (Zero-setup SQLite):
DATABASE_URL="file:./dev.db"

# Mode Cloud (CockroachDB / PostgreSQL):
# DATABASE_URL="postgresql://<user>:<password>@<host>:26257/defaultdb?sslmode=verify-full"

# Password Admin
ADMIN_PASSWORD="SiMumtaz123"

# JWT Secret
JWT_SECRET="mumtaz_rapor_jwt_secret_token_secure_2026_xyz"
```

### 4. Sinkronisasi Database & Seed Data
```bash
# Push schema ke database
npm run db:push

# Masukkan data awal (Admin, 6 Pengawas, Kelas VII A - VIII B, Siswa Dummy, Event, & Slot Awal)
npm run db:seed
```

### 5. Jalankan Pengujian Otomatis (12 Skenario Pengujian Wajib)
```bash
npm run test:all
```

### 6. Jalankan Server Development
```bash
npm run dev
```
Buka browser di `http://localhost:3000`.

---

## ☁️ Setup Database Supabase

Aplikasi ini menggunakan **Supabase** (Managed Cloud PostgreSQL).

1. Buat akun di [Supabase](https://supabase.com/).
2. Buat Project baru: masukkan nama project dan simpan database password.
3. Pilih Region terdekat (misal: `Singapore (ap-southeast-1)`).
4. Masuk ke **Project Settings** $\to$ **Database** $\to$ **Connection string** (tab **URI**).
5. Salin Connection String:
   * Direct URI (Port 5432):
     ```
     postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
     ```
6. Masukkan ke file `.env` atau Vercel Environment Variables:
   ```env
   DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
   ```
7. Jalankan migrasi dan seed:
   ```bash
   npm run db:push
   npm run db:seed
   ```

---

## 🚀 Deployment ke Vercel

Aplikasi ini sudah dioptimalkan dan siap dideploy langsung ke **Vercel**:

1. Push repository ke GitHub / GitLab.
2. Buka dashboard [Vercel](https://vercel.com/) dan pilih **Add New Project**.
3. Import repository project ini.
4. Pada bagian **Environment Variables**, tambahkan:
   * `DATABASE_URL`: Connection String Supabase Anda
   * `ADMIN_PASSWORD`: `SiMumtaz123` (atau password admin yang Anda tentukan)
   * `JWT_SECRET`: Random string yang aman (misal 32 karakter)
5. Build Command otomatis menjalankan:
   ```bash
   npm run build
   ```
   *(Skrip build otomatis menyinkronkan provider Prisma ke `postgresql` dan mengompilasi Next.js)*.
6. Klik **Deploy**. Selesai!

---

## 📋 Hasil Pengujian Otomatis (12 Skenario)

Skrip `npm run test:all` menguji dan memvalidasi ke-12 skenario berikut:
* **TEST 1:** Orang tua memilih VII A $\to$ memilih siswa $\to$ memilih slot $\to$ konfirmasi $\to$ booking tersimpan. `[PASS]`
* **TEST 2:** Orang tua kedua mencoba memilih slot yang sama $\to$ sistem menolak. `[PASS]`
* **TEST 3:** Siswa yang sama mencoba booking kedua kali $\to$ sistem menolak. `[PASS]`
* **TEST 4:** Waktu generator mencapai 11.45 $\to$ sistem melewati 11.45–13.00. `[PASS]`
* **TEST 5:** Admin menghapus satu booking $\to$ slot kembali tersedia. `[PASS]`
* **TEST 6:** Admin memilih Hapus Semua $\to$ minta password $\to$ password salah ditolak $\to$ password benar menghapus seluruh booking event. `[PASS]`
* **TEST 7:** Pengawas login $\to$ memilih dua kelas $\to$ kedua kelas muncul di dashboard. `[PASS]`
* **TEST 8:** Pengawas mencentang “Orang Tua Datang” $\to$ status berubah menjadi Menunggu. `[PASS]`
* **TEST 9:** Ketika waktu slot siswa yang dicentang tiba $\to$ `bell.mp3` berbunyi dan siswa ditandai aktif. `[PASS]`
* **TEST 10:** Siswa yang belum dicentang kedatangannya tidak memicu alarm. `[PASS]`
* **TEST 11:** Orang tua memilih kelas $\to$ rekapan booking kelas tersebut muncul di bagian bawah dan tersusun dari jam paling pagi ke paling siang. `[PASS]`
* **TEST 12:** Setelah booking baru dibuat $\to$ rekapan otomatis diperbarui. `[PASS]`

---

## 🏛️ Lisensi & Hak Cipta
Dibuat untuk **Sekolah Islam Mumtaz Bandar Lampung**.
Semua hak dilindungi undang-undang.
