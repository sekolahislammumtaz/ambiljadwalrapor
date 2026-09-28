import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const classId = searchParams.get('classId');

    // 1. Settings
    const setting = await prisma.appSetting.findFirst() || {
      title: 'Jadwal Pengambilan Rapor',
      subtitle: 'Silakan pilih jadwal pengambilan rapor Ananda',
      logo: '/mumtaz.png',
    };

    // 2. Active Event
    const activeEvent = await prisma.event.findFirst({
      where: { active: true },
      orderBy: { createdAt: 'desc' },
    });

    // 3. Active Classes
    const classes = await prisma.class.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
    });

    let students: any[] = [];
    let slots: any[] = [];
    let bookedRecap: any[] = [];

    if (activeEvent && classId) {
      // Siswa kelas ini yang belum booking pada event aktif ini
      const existingBookings = await prisma.booking.findMany({
        where: {
          eventId: activeEvent.id,
          classId: classId,
        },
        select: {
          studentId: true,
        },
      });
      const bookedStudentIds = new Set(existingBookings.map((b) => b.studentId));

      students = await prisma.student.findMany({
        where: {
          classId: classId,
          active: true,
          id: {
            notIn: Array.from(bookedStudentIds),
          },
        },
        orderBy: { name: 'asc' },
      });

      // Semua slot waktu kelas ini pada event ini (urut startTime ASC)
      slots = await prisma.timeSlot.findMany({
        where: {
          eventId: activeEvent.id,
          classId: classId,
        },
        orderBy: { startTime: 'asc' },
      });

      // Rekapan booking untuk kelas ini (HANYA YANG SUDAH BOOKED, URUT START TIME ASC DARI PAGI KE SIANG)
      const rawBookings = await prisma.booking.findMany({
        where: {
          eventId: activeEvent.id,
          classId: classId,
        },
        include: {
          student: true,
          class: true,
          slot: true,
        },
      });

      // Urutkan berdasarkan slot.startTime dari paling pagi ke paling siang
      rawBookings.sort((a, b) => (a.slot?.startTime || '').localeCompare(b.slot?.startTime || ''));

      bookedRecap = rawBookings.map((b, idx) => ({
        no: idx + 1,
        id: b.id,
        studentName: b.student.name,
        className: b.class.name,
        timeSlot: `${b.slot.startTime}–${b.slot.endTime}`,
        startTime: b.slot.startTime,
        endTime: b.slot.endTime,
        status: b.status,
      }));
    }

    return NextResponse.json({
      success: true,
      data: {
        setting,
        event: activeEvent,
        classes,
        students,
        slots,
        bookedRecap,
      },
    });
  } catch (error: any) {
    console.error('Error fetching public data:', error);
    return NextResponse.json({ success: false, message: 'Gagal memuat data' }, { status: 500 });
  }
}
