import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { eventId, classId, studentId, slotId } = body;

    if (!eventId || !classId || !studentId || !slotId) {
      return NextResponse.json({
        success: false,
        message: 'Data pemesanan tidak lengkap (Event, Kelas, Siswa, dan Slot wajib diisi)',
      }, { status: 400 });
    }

    // Eksekusi pemesanan dalam Database Transaction untuk menjamin anti-double-booking
    const result = await prisma.$transaction(async (tx) => {
      // 1. Validasi Event
      const event = await tx.event.findUnique({
        where: { id: eventId },
      });
      if (!event || !event.active) {
        throw new Error('Periode pengambilan rapor tidak aktif atau tidak ditemukan');
      }

      // 2. Validasi Siswa
      const student = await tx.student.findUnique({
        where: { id: studentId },
      });
      if (!student || student.classId !== classId) {
        throw new Error('Data siswa tidak valid untuk kelas yang dipilih');
      }

      // 3. Cek apakah siswa sudah memiliki jadwal pada event ini
      const existingStudentBooking = await tx.booking.findFirst({
        where: {
          eventId,
          studentId,
        },
      });
      if (existingStudentBooking) {
        throw new Error(`Siswa "${student.name}" sudah memiliki jadwal pengambilan rapor pada periode ini`);
      }

      // 4. Validasi Slot Waktu
      const slot = await tx.timeSlot.findUnique({
        where: { id: slotId },
      });
      if (!slot || slot.eventId !== eventId || slot.classId !== classId) {
        throw new Error('Slot jadwal tidak valid untuk kelas dan periode ini');
      }
      if (slot.status !== 'AVAILABLE') {
        throw new Error('Slot jadwal ini baru saja dipilih oleh orang tua lain. Silakan pilih slot waktu lain');
      }

      // Cek apakah slot sudah ada di tabel booking
      const existingSlotBooking = await tx.booking.findUnique({
        where: { slotId },
      });
      if (existingSlotBooking) {
        throw new Error('Slot jadwal ini sudah digunakan. Silakan pilih waktu yang lain');
      }

      // 5. Update Status Slot menjadi BOOKED
      await tx.timeSlot.update({
        where: { id: slotId },
        data: { status: 'BOOKED' },
      });

      // 6. Simpan Booking Baru
      const booking = await tx.booking.create({
        data: {
          eventId,
          classId,
          studentId,
          slotId,
          bookingDate: event.date,
          status: 'BELUM_DATANG',
          parentArrived: false,
        },
        include: {
          student: true,
          class: true,
          slot: true,
          event: true,
        },
      });

      return booking;
    }, {
      maxWait: 10000,
      timeout: 20000,
    });

    return NextResponse.json({
      success: true,
      message: 'Jadwal pengambilan rapor berhasil disimpan!',
      booking: {
        id: result.id,
        studentName: result.student.name,
        className: result.class.name,
        eventName: result.event.name,
        date: result.event.date,
        timeSlot: `${result.slot.startTime}–${result.slot.endTime} WIB`,
      },
    });
  } catch (error: any) {
    console.error('Booking transaction error:', error.message);
    return NextResponse.json({
      success: false,
      message: error.message || 'Gagal menyimpan jadwal',
    }, { status: 400 });
  }
}
