import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

/**
 * Otomatis memastikan seluruh tabel database (PostgreSQL/Supabase/SQLite)
 * dibuat dan diisi dengan data awal (Admin, 6 Pengawas, Kelas, Siswa, Event).
 */
export async function autoInitializeDatabase(): Promise<{ success: boolean; message: string }> {
  const adminPassword = process.env.ADMIN_PASSWORD || 'SiMumtaz123';
  const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);

  // 1. Jalankan DDL pembuatan tabel jika belum ada (Raw SQL untuk PostgreSQL / Supabase)
  const isPostgres = process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith('file:');

  if (isPostgres) {
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "users" (
          "id" TEXT PRIMARY KEY,
          "username" TEXT UNIQUE NOT NULL,
          "passwordHash" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "role" TEXT NOT NULL DEFAULT 'SUPERVISOR',
          "active" BOOLEAN NOT NULL DEFAULT true,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS "classes" (
          "id" TEXT PRIMARY KEY,
          "name" TEXT UNIQUE NOT NULL,
          "active" BOOLEAN NOT NULL DEFAULT true,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS "students" (
          "id" TEXT PRIMARY KEY,
          "name" TEXT NOT NULL,
          "classId" TEXT NOT NULL REFERENCES "classes"("id") ON DELETE CASCADE,
          "active" BOOLEAN NOT NULL DEFAULT true,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "students_name_classId_key" UNIQUE ("name", "classId")
        );

        CREATE TABLE IF NOT EXISTS "events" (
          "id" TEXT PRIMARY KEY,
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
          "id" TEXT PRIMARY KEY,
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
          "id" TEXT PRIMARY KEY,
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
          "id" TEXT PRIMARY KEY,
          "supervisorId" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
          "classId" TEXT NOT NULL REFERENCES "classes"("id") ON DELETE CASCADE,
          "eventId" TEXT NOT NULL REFERENCES "events"("id") ON DELETE CASCADE,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "supervisor_classes_supervisorId_classId_eventId_key" UNIQUE ("supervisorId", "classId", "eventId")
        );

        CREATE TABLE IF NOT EXISTS "app_settings" (
          "id" TEXT PRIMARY KEY,
          "title" TEXT NOT NULL DEFAULT 'Jadwal Pengambilan Rapor',
          "subtitle" TEXT NOT NULL DEFAULT 'Silakan pilih jadwal pengambilan rapor Ananda',
          "logo" TEXT NOT NULL DEFAULT '/mumtaz.png',
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('[autoInitializeDatabase] DDL tables created / verified successfully in PostgreSQL');
    } catch (ddlError: any) {
      console.warn('[autoInitializeDatabase] DDL notice (tables may already exist):', ddlError.message);
    }
  }

  // 2. Pastikan AppSetting
  let setting = await prisma.appSetting.findFirst();
  if (!setting) {
    setting = await prisma.appSetting.create({
      data: {
        title: 'Jadwal Pengambilan Rapor',
        subtitle: 'Silakan pilih jadwal pengambilan rapor Ananda',
        logo: '/mumtaz.png',
      },
    });
  }

  // 3. Pastikan Admin User
  let admin = await prisma.user.findFirst({ where: { username: 'admin' } });
  if (!admin) {
    admin = await prisma.user.create({
      data: {
        username: 'admin',
        name: 'Administrator Mumtaz',
        passwordHash: hashedAdminPassword,
        role: 'ADMIN',
        active: true,
      },
    });
  } else {
    // Pastikan password hash terupdate jika env diset
    await prisma.user.update({
      where: { id: admin.id },
      data: { passwordHash: hashedAdminPassword, active: true },
    });
  }

  // 4. Pastikan 6 Akun Pengawas
  const supervisorsData = [
    { username: 'pengawas1', name: 'Pengawas 1', pass: 'abungawas1' },
    { username: 'pengawas2', name: 'Pengawas 2', pass: 'abungawas2' },
    { username: 'pengawas3', name: 'Pengawas 3', pass: 'abungawas3' },
    { username: 'pengawas4', name: 'Pengawas 4', pass: 'abungawas4' },
    { username: 'pengawas5', name: 'Pengawas 5', pass: 'abungawas5' },
    { username: 'pengawas6', name: 'Pengawas 6', pass: 'abungawas6' },
  ];

  const supervisorRecords = [];
  for (const s of supervisorsData) {
    let sup = await prisma.user.findUnique({ where: { username: s.username } });
    if (!sup) {
      const hashedPass = await bcrypt.hash(s.pass, 10);
      sup = await prisma.user.create({
        data: {
          username: s.username,
          name: s.name,
          passwordHash: hashedPass,
          role: 'SUPERVISOR',
          active: true,
        },
      });
    }
    supervisorRecords.push(sup);
  }

  // 5. Pastikan Kelas
  const classNames = ['VII A', 'VII B', 'VIII A', 'VIII B'];
  const classesMap: Record<string, any> = {};
  for (const cName of classNames) {
    let cls = await prisma.class.findUnique({ where: { name: cName } });
    if (!cls) {
      cls = await prisma.class.create({ data: { name: cName, active: true } });
    }
    classesMap[cName] = cls;
  }

  // 6. Pastikan Siswa Dummy
  const dummyStudents: Record<string, string[]> = {
    'VII A': [
      'Ahmad Fauzan',
      'Budi Santoso',
      'Candra Pratama',
      'Deni Kurniawan',
      'Eko Prasetyo',
      'Fajar Maulana',
      'Gilang Ramadhan',
      'Hafizh Al-Farisi',
    ],
    'VII B': [
      'Ibrahim Malik',
      'Joko Susilo',
      'Kaisar Alif',
      'Lukman Hakim',
      'Muhammad Rizky',
      'Naufal Azmi',
      'Omar Syarif',
      'Panji Gumilang',
    ],
    'VIII A': [
      'Qaisar Abdullah',
      'Raihan Pratama',
      'Salman Al-Farisi',
      'Taufiq Hidayat',
      'Usamah bin Zaid',
      'Vino Bastian',
    ],
    'VIII B': [
      'Wahyu Nugroho',
      'Xavier Arkan',
      'Yusuf Mansur',
      'Zaidan Akbar',
      'Arya Wijaya',
      'Bagus Setiawan',
    ],
  };

  for (const [cName, sList] of Object.entries(dummyStudents)) {
    const classId = classesMap[cName].id;
    for (const sName of sList) {
      const exists = await prisma.student.findFirst({ where: { name: sName, classId } });
      if (!exists) {
        await prisma.student.create({ data: { name: sName, classId, active: true } });
      }
    }
  }

  // 7. Pastikan Default Event
  let defaultEvent = await prisma.event.findFirst({ where: { active: true } });
  if (!defaultEvent) {
    defaultEvent = await prisma.event.create({
      data: {
        name: 'Pengambilan Rapor Semester Ganjil TP 2026/2027',
        date: '2026-10-03',
        startTime: '08:00',
        breakStart: '11:45',
        breakEnd: '13:00',
        durationMinutes: 15,
        active: true,
      },
    });
  }

  // 8. Pastikan Slot Jadwal untuk VII A dan VII B
  const existingSlots = await prisma.timeSlot.count({
    where: { eventId: defaultEvent.id, classId: classesMap['VII A'].id },
  });

  if (existingSlots === 0) {
    const times = [
      ['08:00', '08:15'], ['08:15', '08:30'], ['08:30', '08:45'], ['08:45', '09:00'],
      ['09:00', '09:15'], ['09:15', '09:30'], ['09:30', '09:45'], ['09:45', '10:00'],
      ['10:00', '10:15'], ['10:15', '10:30'], ['10:30', '10:45'], ['10:45', '11:00'],
      ['11:00', '11:15'], ['11:15', '11:30'], ['11:30', '11:45'],
      // 11:45 - 13:00 Istirahat dilewati otomatis
      ['13:00', '13:15'], ['13:15', '13:30'], ['13:30', '13:45'], ['13:45', '14:00'],
    ];

    for (const [sStart, sEnd] of times) {
      await prisma.timeSlot.create({
        data: {
          eventId: defaultEvent.id,
          classId: classesMap['VII A'].id,
          startTime: sStart,
          endTime: sEnd,
          status: 'AVAILABLE',
        },
      });
      await prisma.timeSlot.create({
        data: {
          eventId: defaultEvent.id,
          classId: classesMap['VII B'].id,
          startTime: sStart,
          endTime: sEnd,
          status: 'AVAILABLE',
        },
      });
    }
  }

  // 9. Assign Pengawas 1 ke VII A dan VII B
  if (supervisorRecords.length > 0) {
    const p1 = supervisorRecords[0];
    const supExists = await prisma.supervisorClass.findFirst({
      where: { supervisorId: p1.id, classId: classesMap['VII A'].id, eventId: defaultEvent.id },
    });
    if (!supExists) {
      await prisma.supervisorClass.create({
        data: { supervisorId: p1.id, classId: classesMap['VII A'].id, eventId: defaultEvent.id },
      });
      await prisma.supervisorClass.create({
        data: { supervisorId: p1.id, classId: classesMap['VII B'].id, eventId: defaultEvent.id },
      });
    }
  }

  return { success: true, message: 'Database berhasil diinisialisasi secara otomatis!' };
}
