import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { password } = body;

    const validAdminPassword = process.env.ADMIN_PASSWORD || 'SiMumtaz123';
    if (!password || password !== validAdminPassword) {
      return NextResponse.json({
        success: false,
        message: 'Password Admin tidak valid untuk menjalankan inisialisasi database.',
      }, { status: 403 });
    console.log('[setup-db] Menginisialisasi database Supabase PostgreSQL...');

    // 1. App Settings
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

    // 2. Admin User
    const hashedAdminPassword = await bcrypt.hash(validAdminPassword, 10);
    const existingAdmin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (!existingAdmin) {
      await prisma.user.create({
        data: {
          username: 'admin',
          name: 'Administrator Mumtaz',
          passwordHash: hashedAdminPassword,
          role: 'ADMIN',
          active: true,
        },
      });
    }

    // 3. 6 Akun Pengawas
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
      const existing = await prisma.user.findUnique({ where: { username: s.username } });
      if (!existing) {
        const hashedPass = await bcrypt.hash(s.pass, 10);
        const created = await prisma.user.create({
          data: {
            username: s.username,
            name: s.name,
            passwordHash: hashedPass,
            role: 'SUPERVISOR',
            active: true,
          },
        });
        supervisorRecords.push(created);
      } else {
        supervisorRecords.push(existing);
      }
    }

    // 4. Data Kelas
    const classNames = ['VII A', 'VII B', 'VIII A', 'VIII B'];
    const classesMap: Record<string, any> = {};
    for (const cName of classNames) {
      let cls = await prisma.class.findUnique({ where: { name: cName } });
      if (!cls) {
        cls = await prisma.class.create({
          data: { name: cName, active: true },
        });
      }
      classesMap[cName] = cls;
    }

    // 5. Data Siswa Dummy
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
        const exists = await prisma.student.findFirst({
          where: { name: sName, classId },
        });
        if (!exists) {
          await prisma.student.create({
            data: { name: sName, classId, active: true },
          });
        }
      }
    }

    // 6. Default Event
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

    // 7. Generate Time Slots untuk VII A dan VII B jika belum ada
    const existingSlotsVIIA = await prisma.timeSlot.count({
      where: { eventId: defaultEvent.id, classId: classesMap['VII A'].id },
    });

    if (existingSlotsVIIA === 0) {
      const times = [
        ['08:00', '08:15'], ['08:15', '08:30'], ['08:30', '08:45'], ['08:45', '09:00'],
        ['09:00', '09:15'], ['09:15', '09:30'], ['09:30', '09:45'], ['09:45', '10:00'],
        ['10:00', '10:15'], ['10:15', '10:30'], ['10:30', '10:45'], ['10:45', '11:00'],
        ['11:00', '11:15'], ['11:15', '11:30'], ['11:30', '11:45'],
        // Istirahat 11:45 - 13:00 dilewati secara otomatis
        ['13:00', '13:15'], ['13:15', '13:30'], ['13:30', '13:45'], ['13:45', '14:00']
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

    // 8. Hubungkan Pengawas 1 ke VII A dan VII B
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

    return NextResponse.json({
      success: true,
      message: 'Database berhasil diinisialisasi dan disiapkan untuk produksi Supabase PostgreSQL / Vercel!',
      activeEvent: defaultEvent.name,
      classes: classNames,
    });
  } catch (error: any) {
    console.error('Setup DB error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
