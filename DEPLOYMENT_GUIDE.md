# Panduan Lengkap Deployment ke Vercel & Supabase
## Sekolah Islam Mumtaz – Aplikasi Jadwal Pengambilan Rapor

Dokumen ini memandu langkah demi langkah untuk men-deploy aplikasi ini ke **Vercel** menggunakan database cloud **Supabase** (Managed PostgreSQL).

---

## 🗄️ Bagian 1: Setup Supabase Database

1. **Daftar / Masuk ke Supabase:**
   * Kunjungi [https://supabase.com/](https://supabase.com/) dan login menggunakan akun GitHub Anda.

2. **Buat Project Baru di Supabase:**
   * Klik **New Project**.
   * Masukkan **Name**, misal: `mumtaz-rapor`.
   * Masukkan **Database Password** yang kuat dan **simpan password ini**.
   * Pilih **Region** terdekat (misal: `Singapore (ap-southeast-1)`).
   * Klik **Create new project** dan tunggu beberapa detik sampai database siap.

3. **Dapatkan Connection String Supabase:**
   * Masuk ke menu **Project Settings** (ikon gear di sidebar bawah kiri).
   * Pilih submenu **Database**.
   * Gulir ke bawah ke bagian **Connection string** $\to$ pilih tab **URI**.
   * Di sini Anda akan melihat dua jenis koneksi:

     #### Opsi A: Direct Connection (Port 5432 - Paling Mudah & Direkomendasikan)
     ```
     postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
     ```
     *Ganti `[YOUR-PASSWORD]` dengan password database yang Anda buat di langkah 2.*

     #### Opsi B: Transaction Pooler PgBouncer (Port 6543 - Untuk Skala Besar Vercel)
     * Mode: Transaction (Port 6543)
       `DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"`
     * Direct URL (Port 5432):
       `DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"`

---

## 🚀 Bagian 2: Deploy ke Vercel

1. **Push Proyek ke GitHub:**
   * Pastikan seluruh file proyek di-push ke repositori GitHub Anda. File `.env` lokal otomatis tidak ter-upload berkat `.gitignore`.

2. **Import ke Vercel:**
   * Masuk ke [https://vercel.com/](https://vercel.com/).
   * Klik **Add New...** $\to$ **Project**.
   * Pilih repositori GitHub Anda.
   * Framework Preset: **Next.js** (terdeteksi otomatis).

3. **Konfigurasi Environment Variables di Vercel:**
   Sebelum menekan tombol Deploy, buka bagian **Environment Variables** dan masukkan:

   | Key | Value Contoh | Keterangan |
   |---|---|---|
   | `DATABASE_URL` | `postgresql://postgres:PASSWORD@db.xxxx.supabase.co:5432/postgres` | Connection String URI dari Supabase |
   | `DIRECT_URL` | *(Opsional)* `postgresql://postgres:PASSWORD@db.xxxx.supabase.co:5432/postgres` | Diperlukan hanya jika `DATABASE_URL` menggunakan PgBouncer (port 6543) |
   | `ADMIN_PASSWORD` | `SiMumtaz123` | Password untuk login ke `/admin` |
   | `JWT_SECRET` | `mumtaz_rapor_jwt_secret_token_secure_2026_xyz` | String pengaman token session (32+ karakter) |

4. **Deploy:**
   * Klik **Deploy**.
   * Vercel akan otomatis menjalankan proses build (`npm run build`). Skrip otomatis menyinkronkan Prisma dengan Supabase PostgreSQL.
   * Dalam 1–2 menit, website resmi sudah online.

---

## ⚡ Bagian 3: Inisialisasi Database Supabase (Tabel & Data Awal)

Setelah website aktif di Vercel, lakukan inisialisasi tabel dan data awal (Admin, 6 Pengawas, Kelas, Siswa, dan Slot Awal):

### CARA A: Melalui Web Dashboard Admin (Paling Praktis)
1. Buka halaman admin di domain Vercel Anda: `https://<domain-anda>.vercel.app/admin/login`
2. Login dengan akun Admin:
   * Username: `admin`
   * Password: `SiMumtaz123`
3. Masuk ke tab **Pengaturan Aplikasi** di sidebar kiri.
4. Pada bagian bawah, klik tombol:
   **"Inisialisasi / Seed Supabase Sekarang"**
5. Masukkan password admin (`SiMumtaz123`).
6. Sistem langsung membuat seluruh tabel di Supabase dan mengisinya dengan data awal sekolah!

*ATAU*

### CARA B: Melalui Terminal Laptop Anda
1. Buka file `.env` di laptop Anda, masukkan `DATABASE_URL` Supabase:
   ```env
   DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
   ```
2. Jalankan perintah migrasi & seed:
   ```bash
   # Push struktur tabel ke Supabase
   npm run db:push

   # Isi data awal ke Supabase
   npm run db:seed
   ```
3. Selesai! Database Supabase Anda sudah terisi penuh dan siap melayani orang tua santri.

---

## 🔐 Kredensial Awal Aplikasi

* **Admin:** Username `admin` | Password `SiMumtaz123`
* **Pengawas 1:** Username `pengawas1` | Password `abungawas1`
* **Pengawas 2:** Username `pengawas2` | Password `abungawas2`
* **Pengawas 3:** Username `pengawas3` | Password `abungawas3`
* **Pengawas 4:** Username `pengawas4` | Password `abungawas4`
* **Pengawas 5:** Username `pengawas5` | Password `abungawas5`
* **Pengawas 6:** Username `pengawas6` | Password `abungawas6`
