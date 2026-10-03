import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

function checkAdmin(req: NextRequest) {
  const user = getUserFromRequest(req);
  return user && user.role === 'ADMIN';
}

export async function GET(req: NextRequest) {
  if (!checkAdmin(req)) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const eventIdParam = searchParams.get('eventId');
    const classId = searchParams.get('classId');
    const search = searchParams.get('search');
    const statusFilter = searchParams.get('status'); // 'ALL', 'BOOKED', 'AVAILABLE'

    let eventId = eventIdParam;
    if (!eventId) {
      const activeEvent = await prisma.event.findFirst({
        where: { active: true },
        orderBy: { createdAt: 'desc' },
      });
      eventId = activeEvent?.id || null;
    }

    if (!eventId) {
      return NextResponse.json({ success: true, data: [] });
    }

    // Ambil seluruh slot di event ini
    const slotWhere: any = { eventId };
    if (classId) slotWhere.classId = classId;
    if (statusFilter && statusFilter !== 'ALL') {
      slotWhere.status = statusFilter;
    }

    const slots = await prisma.timeSlot.findMany({
      where: slotWhere,
      include: {
        class: true,
        event: true,
        booking: {
          include: {
            student: true,
          },
        },
      },
      orderBy: [
        { class: { name: 'asc' } },
        { startTime: 'asc' },
      ],
    });

    let filtered = slots;
    if (search) {
      const q = search.toLowerCase();
      filtered = slots.filter((s) => s.booking?.student.name.toLowerCase().includes(q));
    }

    const result = filtered.map((s, idx) => ({
      no: idx + 1,
      id: s.id,
      bookingId: s.booking?.id || null,
      date: s.event.date,
      className: s.class.name,
      studentName: s.booking?.student.name || '— (Belum Ada)',
      timeSlot: `${s.startTime}–${s.endTime}`,
      startTime: s.startTime,
      endTime: s.endTime,
      slotStatus: s.status,
      bookingStatus: s.booking ? s.booking.status : 'BELUM_DIPESAN',
      parentArrived: s.booking ? s.booking.parentArrived : false,
      arrivedAt: s.booking?.arrivedAt || null,
      servedAt: s.booking?.servedAt || null,
      completedAt: s.booking?.completedAt || null,
    }));

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
