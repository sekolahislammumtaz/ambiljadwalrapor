-- ====================================================================
-- SKRIP SQL SUPABASE: JADWAL PENGAMBILAN RAPOR - SEKOLAH ISLAM MUMTAZ
-- Jalankan skrip ini langsung di menu SQL Editor pada Dashboard Supabase
-- ====================================================================

-- 1. PEMBUATAN TABEL
CREATE TABLE IF NOT EXISTS "users" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "username" TEXT UNIQUE NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'SUPERVISOR',
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "classes" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "name" TEXT UNIQUE NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "students" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "name" TEXT NOT NULL,
  "classId" TEXT NOT NULL REFERENCES "classes"("id") ON DELETE CASCADE,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "students_name_classId_key" UNIQUE ("name", "classId")
);

CREATE TABLE IF NOT EXISTS "events" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "name" TEXT NOT NULL,
  "date" TEXT NOT NULL,
  "startTime" TEXT NOT NULL DEFAULT '08:00',
  "breakStart" TEXT NOT NULL DEFAULT '11:45',
  "breakEnd" TEXT NOT NULL DEFAULT '13:00',
  "durationMinutes" INTEGER NOT NULL DEFAULT 15,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "time_slots" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "eventId" TEXT NOT NULL REFERENCES "events"("id") ON DELETE CASCADE,
  "classId" TEXT NOT NULL REFERENCES "classes"("id") ON DELETE CASCADE,
  "startTime" TEXT NOT NULL,
  "endTime" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "time_slots_eventId_classId_startTime_endTime_key" UNIQUE ("eventId", "classId", "startTime", "endTime")
);

CREATE TABLE IF NOT EXISTS "bookings" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "eventId" TEXT NOT NULL REFERENCES "events"("id") ON DELETE CASCADE,
  "studentId" TEXT NOT NULL REFERENCES "students"("id") ON DELETE CASCADE,
  "classId" TEXT NOT NULL REFERENCES "classes"("id") ON DELETE CASCADE,
  "slotId" TEXT UNIQUE NOT NULL REFERENCES "time_slots"("id") ON DELETE CASCADE,
  "bookingDate" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'BELUM_DATANG',
  "parentArrived" BOOLEAN NOT NULL DEFAULT false,
  "arrivedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "bookings_eventId_slotId_key" UNIQUE ("eventId", "slotId"),
  CONSTRAINT "bookings_eventId_studentId_key" UNIQUE ("eventId", "studentId")
);

CREATE TABLE IF NOT EXISTS "supervisor_classes" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "supervisorId" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "classId" TEXT NOT NULL REFERENCES "classes"("id") ON DELETE CASCADE,
  "eventId" TEXT NOT NULL REFERENCES "events"("id") ON DELETE CASCADE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "supervisor_classes_supervisorId_classId_eventId_key" UNIQUE ("supervisorId", "classId", "eventId")
);

CREATE TABLE IF NOT EXISTS "app_settings" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "title" TEXT NOT NULL DEFAULT 'Jadwal Pengambilan Rapor',
  "subtitle" TEXT NOT NULL DEFAULT 'Silakan pilih jadwal pengambilan rapor Ananda',
  "logo" TEXT NOT NULL DEFAULT '/mumtaz.png',
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ====================================================================
-- 2. PENGISIAN DATA AWAL (SEEDING)
-- ====================================================================

-- A. App Setting
INSERT INTO "app_settings" ("id", "title", "subtitle", "logo", "updatedAt")
VALUES (
  'app-setting-1',
  'Jadwal Pengambilan Rapor',
  'Silakan pilih jadwal pengambilan rapor Ananda',
  '/mumtaz.png',
  CURRENT_TIMESTAMP
) ON CONFLICT DO NOTHING;

-- B. Akun Admin (Password: SiMumtaz123)
INSERT INTO "users" ("id", "username", "passwordHash", "name", "role", "active")
VALUES (
  'user-admin-1',
  'admin',
  '$2a$10$n.bHEgJ4q0j4cwCiQyPBReYbTkw1bSDr./zvraHlC4q7nDFyY2MW2',
  'Administrator Mumtaz',
  'ADMIN',
  true
) ON CONFLICT ("username") DO UPDATE SET "passwordHash" = EXCLUDED."passwordHash";

-- C. 6 Akun Pengawas (Password: abungawas1 s.d. abungawas6)
INSERT INTO "users" ("id", "username", "passwordHash", "name", "role", "active")
VALUES
  ('user-sup-1', 'pengawas1', '$2a$10$TWTxz6ZymykydMdmzaZxTOKsJaD30aiLQzyf7V/nI.E7c8gmyA386', 'Pengawas 1', 'SUPERVISOR', true),
  ('user-sup-2', 'pengawas2', '$2a$10$dVH.IVrdo/Wwxx7PQ297FO3w/TZww90FfTk3PF2iz/aiduYpplHE6', 'Pengawas 2', 'SUPERVISOR', true),
  ('user-sup-3', 'pengawas3', '$2a$10$ICc7adOtcbrAEVrgBKU5AuzNQtunvZ0Av1C3oDIvVOpFQ6ecLW31m', 'Pengawas 3', 'SUPERVISOR', true),
  ('user-sup-4', 'pengawas4', '$2a$10$VxrjZq75K7bR8Bj0Cq09SO2hzm2TvKixEeC2ornXJ2tk3.qa/TJQm', 'Pengawas 4', 'SUPERVISOR', true),
  ('user-sup-5', 'pengawas5', '$2a$10$g3DKIqW8BK7o68Vy3XmEeOMlm1WeLJP.b5gJCT.GBah7Y3eXMcheS', 'Pengawas 5', 'SUPERVISOR', true),
  ('user-sup-6', 'pengawas6', '$2a$10$q4YfUM9GhATdiSGk3jwv1eKpkQ8NlQHJW0N8c.tz4yGmtAniSLVnu', 'Pengawas 6', 'SUPERVISOR', true)
ON CONFLICT ("username") DO NOTHING;

-- D. Data Kelas
INSERT INTO "classes" ("id", "name", "active")
VALUES
  ('class-7a', 'VII A', true),
  ('class-7b', 'VII B', true),
  ('class-8a', 'VIII A', true),
  ('class-8b', 'VIII B', true)
ON CONFLICT ("name") DO NOTHING;

-- E. Data Siswa Dummy Kelas VII A
INSERT INTO "students" ("name", "classId", "active")
VALUES
  ('Ahmad Fauzan', 'class-7a', true),
  ('Budi Santoso', 'class-7a', true),
  ('Candra Pratama', 'class-7a', true),
  ('Deni Kurniawan', 'class-7a', true),
  ('Eko Prasetyo', 'class-7a', true),
  ('Fajar Maulana', 'class-7a', true),
  ('Gilang Ramadhan', 'class-7a', true),
  ('Hafizh Al-Farisi', 'class-7a', true)
ON CONFLICT DO NOTHING;

-- Data Siswa Dummy Kelas VII B
INSERT INTO "students" ("name", "classId", "active")
VALUES
  ('Ibrahim Malik', 'class-7b', true),
  ('Joko Susilo', 'class-7b', true),
  ('Kaisar Alif', 'class-7b', true),
  ('Lukman Hakim', 'class-7b', true),
  ('Muhammad Rizky', 'class-7b', true),
  ('Naufal Azmi', 'class-7b', true),
  ('Omar Syarif', 'class-7b', true),
  ('Panji Gumilang', 'class-7b', true)
ON CONFLICT DO NOTHING;

-- Data Siswa Dummy Kelas VIII A
INSERT INTO "students" ("name", "classId", "active")
VALUES
  ('Qaisar Abdullah', 'class-8a', true),
  ('Raihan Pratama', 'class-8a', true),
  ('Salman Al-Farisi', 'class-8a', true),
  ('Taufiq Hidayat', 'class-8a', true),
  ('Usamah bin Zaid', 'class-8a', true),
  ('Vino Bastian', 'class-8a', true)
ON CONFLICT DO NOTHING;

-- Data Siswa Dummy Kelas VIII B
INSERT INTO "students" ("name", "classId", "active")
VALUES
  ('Wahyu Nugroho', 'class-8b', true),
  ('Xavier Arkan', 'class-8b', true),
  ('Yusuf Mansur', 'class-8b', true),
  ('Zaidan Akbar', 'class-8b', true),
  ('Arya Wijaya', 'class-8b', true),
  ('Bagus Setiawan', 'class-8b', true)
ON CONFLICT DO NOTHING;

-- F. Default Event
INSERT INTO "events" ("id", "name", "date", "startTime", "breakStart", "breakEnd", "durationMinutes", "active")
VALUES (
  'event-ganjil-2026',
  'Pengambilan Rapor Semester Ganjil TP 2026/2027',
  '2026-10-03',
  '08:00',
  '11:45',
  '13:00',
  15,
  true
) ON CONFLICT DO NOTHING;

-- G. Slot Jadwal VII A & VII B (Melewati Istirahat 11:45 - 13:00)
INSERT INTO "time_slots" ("eventId", "classId", "startTime", "endTime", "status")
VALUES
  -- Pagi Kelas VII A
  ('event-ganjil-2026', 'class-7a', '08:00', '08:15', 'AVAILABLE'),
  ('event-ganjil-2026', 'class-7a', '08:15', '08:30', 'AVAILABLE'),
  ('event-ganjil-2026', 'class-7a', '08:30', '08:45', 'AVAILABLE'),
  ('event-ganjil-2026', 'class-7a', '08:45', '09:00', 'AVAILABLE'),
  ('event-ganjil-2026', 'class-7a', '09:00', '09:15', 'AVAILABLE'),
  ('event-ganjil-2026', 'class-7a', '09:15', '09:30', 'AVAILABLE'),
  ('event-ganjil-2026', 'class-7a', '09:30', '09:45', 'AVAILABLE'),
  ('event-ganjil-2026', 'class-7a', '09:45', '10:00', 'AVAILABLE'),
  ('event-ganjil-2026', 'class-7a', '10:00', '10:15', 'AVAILABLE'),
  ('event-ganjil-2026', 'class-7a', '10:15', '10:30', 'AVAILABLE'),
  ('event-ganjil-2026', 'class-7a', '10:30', '10:45', 'AVAILABLE'),
  ('event-ganjil-2026', 'class-7a', '10:45', '11:00', 'AVAILABLE'),
  ('event-ganjil-2026', 'class-7a', '11:00', '11:15', 'AVAILABLE'),
  ('event-ganjil-2026', 'class-7a', '11:15', '11:30', 'AVAILABLE'),
  ('event-ganjil-2026', 'class-7a', '11:30', '11:45', 'AVAILABLE'),
  -- Siang Kelas VII A (11.45 - 13.00 istirahat dilewati)
  ('event-ganjil-2026', 'class-7a', '13:00', '13:15', 'AVAILABLE'),
  ('event-ganjil-2026', 'class-7a', '13:15', '13:30', 'AVAILABLE'),
  ('event-ganjil-2026', 'class-7a', '13:30', '13:45', 'AVAILABLE'),
  ('event-ganjil-2026', 'class-7a', '13:45', '14:00', 'AVAILABLE'),

  -- Pagi Kelas VII B
  ('event-ganjil-2026', 'class-7b', '08:00', '08:15', 'AVAILABLE'),
  ('event-ganjil-2026', 'class-7b', '08:15', '08:30', 'AVAILABLE'),
  ('event-ganjil-2026', 'class-7b', '08:30', '08:45', 'AVAILABLE'),
  ('event-ganjil-2026', 'class-7b', '08:45', '09:00', 'AVAILABLE'),
  ('event-ganjil-2026', 'class-7b', '09:00', '09:15', 'AVAILABLE'),
  ('event-ganjil-2026', 'class-7b', '09:15', '09:30', 'AVAILABLE'),
  ('event-ganjil-2026', 'class-7b', '09:30', '09:45', 'AVAILABLE'),
  ('event-ganjil-2026', 'class-7b', '09:45', '10:00', 'AVAILABLE'),
  ('event-ganjil-2026', 'class-7b', '10:00', '10:15', 'AVAILABLE'),
  ('event-ganjil-2026', 'class-7b', '10:15', '10:30', 'AVAILABLE'),
  ('event-ganjil-2026', 'class-7b', '10:30', '10:45', 'AVAILABLE'),
  ('event-ganjil-2026', 'class-7b', '10:45', '11:00', 'AVAILABLE'),
  ('event-ganjil-2026', 'class-7b', '11:00', '11:15', 'AVAILABLE'),
  ('event-ganjil-2026', 'class-7b', '11:15', '11:30', 'AVAILABLE'),
  ('event-ganjil-2026', 'class-7b', '11:30', '11:45', 'AVAILABLE'),
  -- Siang Kelas VII B
  ('event-ganjil-2026', 'class-7b', '13:00', '13:15', 'AVAILABLE'),
  ('event-ganjil-2026', 'class-7b', '13:15', '13:30', 'AVAILABLE'),
  ('event-ganjil-2026', 'class-7b', '13:30', '13:45', 'AVAILABLE'),
  ('event-ganjil-2026', 'class-7b', '13:45', '14:00', 'AVAILABLE')
ON CONFLICT DO NOTHING;

-- H. Penugasan Pengawas 1 ke VII A dan VII B
INSERT INTO "supervisor_classes" ("supervisorId", "classId", "eventId")
VALUES
  ('user-sup-1', 'class-7a', 'event-ganjil-2026'),
  ('user-sup-1', 'class-7b', 'event-ganjil-2026')
ON CONFLICT DO NOTHING;
