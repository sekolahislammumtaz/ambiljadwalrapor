import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest, comparePassword } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { eventId, password } = body;

    if (!eventId || !password) {
      return NextResponse.json({
        success: false,
        message: 'Event dan Password Admin wajib diisi',
      }, { status: 400 });
    }

    // Ambil data admin dari database untuk validasi password
    const adminUser = await prisma.user.findUnique({
      where: { id: user.userId },
    });

    if (!adminUser) {
      return NextResponse.json({ success: false, message: 'Data pengguna tidak ditemukan' }, { status: 401 });
    }

    const isMatch = await comparePassword(password, adminUser.passwordHash);
    const envMatch = process.env.ADMIN_PASSWORD && password === process.env.ADMIN_PASSWORD;

    if (!isMatch && !envMatch) {
      return NextResponse.json({
        success: false,
        message: 'Password Admin salah! Penghapusan semua jadwal dibatalkan.',
      }, { status: 403 });
    }

    // 1. Hitung booking yang akan dihapus
    const totalBookings = await prisma.booking.count({
      where: { eventId },
    });

    // 2. Hapus seluruh booking di event ini
    await prisma.booking.deleteMany({
      where: { eventId },
    });

    // 3. Reset seluruh slot di event ini menjadi AVAILABLE
    const updatedSlots = await prisma.timeSlot.updateMany({
      where: { eventId },
      data: { status: 'AVAILABLE' },
    });

    const result = { totalBookings, updatedSlots: updatedSlots.count };

    return NextResponse.json({
      success: true,
      message: `Seluruh (${result.totalBookings}) jadwal pengambilan rapor pada periode ini berhasil dihapus. Semua slot telah dikembalikan menjadi tersedia.`,
      result,
    });
  } catch (error: any) {
    console.error('Error deleting all bookings:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
