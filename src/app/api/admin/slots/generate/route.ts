import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { generateTimeSlots } from '@/lib/slot-generator';

export async function POST(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      eventId,
      classId,
      durationMinutes = 15,
      studentCount,
      save = false,
      overwrite = false,
    } = body;

    if (!eventId || !classId) {
      return NextResponse.json({
        success: false,
        message: 'Event dan Kelas wajib dipilih',
      }, { status: 400 });
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });
    if (!event) {
      return NextResponse.json({ success: false, message: 'Event tidak ditemukan' }, { status: 404 });
    }

    const targetClass = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        _count: {
          select: { students: true },
        },
      },
    });
    if (!targetClass) {
      return NextResponse.json({ success: false, message: 'Kelas tidak ditemukan' }, { status: 404 });
    }

    // Hitung jumlah slot yang akan digenerate
    const count = Number(studentCount) > 0 ? Number(studentCount) : targetClass._count.students;
    if (count <= 0) {
      return NextResponse.json({
        success: false,
        message: 'Jumlah siswa di kelas ini 0. Tambahkan siswa terlebih dahulu atau tentukan jumlah slot secara manual.',
      }, { status: 400 });
    }

    const generated = generateTimeSlots({
      startTime: event.startTime || '08:00',
      breakStart: event.breakStart || '11:45',
      breakEnd: event.breakEnd || '13:00',
      durationMinutes: Number(durationMinutes),
      studentCount: count,
    });

    // Jika hanya preview
    if (!save) {
      return NextResponse.json({
        success: true,
        preview: true,
        totalSlots: generated.length,
        slots: generated,
        studentCountInClass: targetClass._count.students,
        discrepancyWarning: count !== targetClass._count.students
          ? `Perhatian: Jumlah slot (${count}) berbeda dengan jumlah siswa yang terdaftar (${targetClass._count.students}).`
          : null,
      });
    }

    // Jika simpan ke database
    // Cek apakah ada booking aktif di kelas ini
    const existingBookings = await prisma.booking.count({
      where: { eventId, classId },
    });

    if (existingBookings > 0 && !overwrite) {
      return NextResponse.json({
        success: false,
        message: `Terdapat ${existingBookings} jadwal yang sudah dibooking pada kelas ini. Menghasilkan ulang slot akan memengaruhi jadwal yang ada. Harap konfirmasi opsi overwrite atau hapus booking terlebih dahulu.`,
        hasBookings: true,
      }, { status: 409 });
    }

    // Jika overwrite, hapus slot yang belum dibooking (atau hapus semua jika diizinkan)
    await prisma.$transaction(async (tx) => {
      // Hapus slot yang tidak terhubung dengan booking
      await tx.timeSlot.deleteMany({
        where: {
          eventId,
          classId,
          status: 'AVAILABLE',
        },
      });

      // Tambahkan slot baru yang belum ada
      for (const s of generated) {
        // Cek apakah slot di jam ini sudah ada (misal booked)
        const exists = await tx.timeSlot.findUnique({
          where: {
            eventId_classId_startTime_endTime: {
              eventId,
              classId,
              startTime: s.startTime,
              endTime: s.endTime,
            },
          },
        });

        if (!exists) {
          await tx.timeSlot.create({
            data: {
              eventId,
              classId,
              startTime: s.startTime,
              endTime: s.endTime,
              status: 'AVAILABLE',
            },
          });
        }
      }
    });

    const currentSlots = await prisma.timeSlot.findMany({
      where: { eventId, classId },
      orderBy: { startTime: 'asc' },
    });

    return NextResponse.json({
      success: true,
      message: `Berhasil membuat ${generated.length} slot jadwal untuk kelas ${targetClass.name}.`,
      slots: currentSlots,
    });
  } catch (error: any) {
    console.error('Error generating slots:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
