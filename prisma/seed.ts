import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial database...');

  // 1. App Settings
  await prisma.appSetting.deleteMany();
  const setting = await prisma.appSetting.create({
    data: {
      title: 'Jadwal Pengambilan Rapor',
      subtitle: 'Silakan pilih jadwal pengambilan rapor Ananda',
      logo: '/mumtaz.png',
    },
  });
  console.log('AppSetting seeded:', setting.title);

  // 2. Users (Admin + 6 Supervisors)
  await prisma.user.deleteMany();

  const adminPassword = process.env.ADMIN_PASSWORD || 'SiMumtaz123';
  const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);

  const adminUser = await prisma.user.create({
    data: {
      username: 'admin',
      name: 'Administrator Mumtaz',
      passwordHash: hashedAdminPassword,
      role: 'ADMIN',
      active: true,
    },
  });
  console.log('Admin seeded:', adminUser.username);

  const supervisorsData = [
    { username: 'pengawas1', name: 'Pengawas 1', pass: 'abungawas1' },
    { username: 'pengawas2', name: 'Pengawas 2', pass: 'abungawas2' },
    { username: 'pengawas3', name: 'Pengawas 3', pass: 'abungawas3' },
    { username: 'pengawas4', name: 'Pengawas 4', pass: 'abungawas4' },
    { username: 'pengawas5', name: 'Pengawas 5', pass: 'abungawas5' },
    { username: 'pengawas6', name: 'Pengawas 6', pass: 'abungawas6' },
  ];

  const supervisors = [];
  for (const s of supervisorsData) {
    const hashedPass = await bcrypt.hash(s.pass, 10);
    const user = await prisma.user.create({
      data: {
        username: s.username,
        name: s.name,
        passwordHash: hashedPass,
        role: 'SUPERVISOR',
        active: true,
      },
    });
    supervisors.push(user);
    console.log(`Supervisor seeded: ${s.name} (${s.username})`);
  }

  // 3. Classes
  await prisma.class.deleteMany();
  const classNames = ['VII A', 'VII B', 'VIII A', 'VIII B'];
  const classesMap: Record<string, any> = {};

  for (const cName of classNames) {
    const cls = await prisma.class.create({
      data: {
        name: cName,
        active: true,
      },
    });
    classesMap[cName] = cls;
  }
  console.log('Classes seeded:', classNames.join(', '));

  // 4. Students
  await prisma.student.deleteMany();
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

  for (const [cName, students] of Object.entries(dummyStudents)) {
    const classId = classesMap[cName].id;
    for (const sName of students) {
      await prisma.student.create({
        data: {
          name: sName,
          classId: classId,
          active: true,
        },
      });
    }
  }
  console.log('Dummy students seeded across classes.');

  // 5. Default Event
  await prisma.event.deleteMany();
  const defaultEvent = await prisma.event.create({
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
  console.log('Event seeded:', defaultEvent.name);

  // 6. Generate slots for VII A and VII B using generator logic
  // Generator logic:
  // Starts at 08:00, increments by duration.
  // If slot overlaps 11:45 - 13:00, jump start to 13:00!
  function generateSlots(startTime: string, breakStart: string, breakEnd: string, durationMinutes: number, count: number) {
    const slots: { startTime: string; endTime: string }[] = [];
    const [startH, startM] = startTime.split(':').map(Number);
    let currentMin = startH * 60 + startM;

    const [bStartH, bStartM] = breakStart.split(':').map(Number);
    const breakStartMin = bStartH * 60 + bStartM;

    const [bEndH, bEndM] = breakEnd.split(':').map(Number);
    const breakEndMin = bEndH * 60 + bEndM;

    while (slots.length < count) {
      const slotStartMin = currentMin;
      const slotEndMin = currentMin + durationMinutes;

      // Check if this slot collides or overlaps with break time (11:45 - 13:00)
      // Any slot that starts before 11:45 and ends after 11:45, or starts during break
      if (slotStartMin < breakEndMin && slotEndMin > breakStartMin) {
        // Skip ahead directly to breakEndMin (13:00)
        currentMin = breakEndMin;
        continue;
      }

      const sH = String(Math.floor(slotStartMin / 60)).padStart(2, '0');
      const sM = String(slotStartMin % 60).padStart(2, '0');
      const eH = String(Math.floor(slotEndMin / 60)).padStart(2, '0');
      const eM = String(slotEndMin % 60).padStart(2, '0');

      slots.push({
        startTime: `${sH}:${sM}`,
        endTime: `${eH}:${eM}`,
      });

      currentMin = slotEndMin;
    }
    return slots;
  }

  // Pre-generate 12 slots for VII A and VII B
  const viiASlots = generateSlots('08:00', '11:45', '13:00', 15, 12);
  for (const s of viiASlots) {
    await prisma.timeSlot.create({
      data: {
        eventId: defaultEvent.id,
        classId: classesMap['VII A'].id,
        startTime: s.startTime,
        endTime: s.endTime,
        status: 'AVAILABLE',
      },
    });
  }

  const viiBSlots = generateSlots('08:00', '11:45', '13:00', 15, 12);
  for (const s of viiBSlots) {
    await prisma.timeSlot.create({
      data: {
        eventId: defaultEvent.id,
        classId: classesMap['VII B'].id,
        startTime: s.startTime,
        endTime: s.endTime,
        status: 'AVAILABLE',
      },
    });
  }
  console.log('Pre-generated slots for VII A and VII B.');

  // Pre-assign Pengawas 1 to VII A and VII B
  await prisma.supervisorClass.create({
    data: {
      supervisorId: supervisors[0].id,
      classId: classesMap['VII A'].id,
      eventId: defaultEvent.id,
    },
  });
  await prisma.supervisorClass.create({
    data: {
      supervisorId: supervisors[0].id,
      classId: classesMap['VII B'].id,
      eventId: defaultEvent.id,
    },
  });
  console.log('Assigned Pengawas 1 to VII A and VII B.');

  console.log('Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
