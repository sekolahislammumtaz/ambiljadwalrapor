import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { bookingId } = body;

    if (!bookingId) {
      return NextResponse.json({ success: false, message: 'ID booking wajib diisi' }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { student: true, slot: true },
    });

    if (!booking) {
      return NextResponse.json({ success: false, message: 'Booking tidak ditemukan' }, { status: 404 });
    }

    // Jalankan dalam transaksi: hapus booking dan kembalikan slot ke AVAILABLE
    await prisma.$transaction(async (tx) => {
      await tx.booking.delete({
        where: { id: bookingId },
      });

      if (booking.slotId) {
        await tx.timeSlot.update({
          where: { id: booking.slotId },
          data: { status: 'AVAILABLE' },
        });
      }
    });

    return NextResponse.json({
      success: true,
      message: `Jadwal pengambilan rapor untuk ${booking.student.name} pada pukul ${booking.slot.startTime}–${booking.slot.endTime} berhasil dihapus. Slot kembali tersedia.`,
    });
  } catch (error: any) {
    console.error('Error deleting single booking:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
