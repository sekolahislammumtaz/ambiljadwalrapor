import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user || (user.role !== 'SUPERVISOR' && user.role !== 'ADMIN')) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { bookingId, parentArrived, status } = body;

    if (!bookingId) {
      return NextResponse.json({ success: false, message: 'ID booking wajib diisi' }, { status: 400 });
    }

    const currentBooking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { student: true, slot: true, class: true },
    });

    if (!currentBooking) {
      return NextResponse.json({ success: false, message: 'Booking tidak ditemukan' }, { status: 404 });
    }

    const dataToUpdate: any = {};

    // Jika checkbox kedatangan diubah
    if (parentArrived !== undefined) {
      const arrived = Boolean(parentArrived);
      dataToUpdate.parentArrived = arrived;
      if (arrived) {
        dataToUpdate.status = 'MENUNGGU';
        dataToUpdate.arrivedAt = new Date();
      } else {
        dataToUpdate.status = 'BELUM_DATANG';
        dataToUpdate.arrivedAt = null;
      }
    }

    // Jika status eksplisit diubah (misal tombol Selesai / Sedang Dilayani)
    if (status !== undefined) {
      dataToUpdate.status = status;
      if (status === 'SELESAI') {
        dataToUpdate.completedAt = new Date();
      } else if (status === 'SEDANG_DILAYANI') {
        dataToUpdate.servedAt = new Date();
        dataToUpdate.parentArrived = true;
        if (!currentBooking.arrivedAt) {
          dataToUpdate.arrivedAt = new Date();
        }
      } else if (status === 'MENUNGGU') {
        dataToUpdate.completedAt = null;
      }
    }

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: dataToUpdate,
      include: {
        student: true,
        class: true,
        slot: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Status kehadiran berhasil diperbarui',
      data: {
        id: updated.id,
        slotId: updated.slotId,
        studentName: updated.student.name,
        className: updated.class.name,
        timeSlot: `${updated.slot.startTime}–${updated.slot.endTime}`,
        parentArrived: updated.parentArrived,
        status: updated.status,
        arrivedAt: updated.arrivedAt,
        servedAt: updated.servedAt,
        completedAt: updated.completedAt,
      },
    });
  } catch (error: any) {
    console.error('Error updating booking status:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
