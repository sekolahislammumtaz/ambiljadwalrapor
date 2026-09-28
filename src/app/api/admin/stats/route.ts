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

    let activeEvent = null;
    if (eventIdParam) {
      activeEvent = await prisma.event.findUnique({ where: { id: eventIdParam } });
    }
    if (!activeEvent) {
      activeEvent = await prisma.event.findFirst({
        where: { active: true },
        orderBy: { createdAt: 'desc' },
      });
    }

    const totalEvents = await prisma.event.count();
    const totalClasses = await prisma.class.count({ where: { active: true } });
    const totalStudents = await prisma.student.count({ where: { active: true } });

    let totalSlots = 0;
    let slotsFilled = 0;
    let slotsAvailable = 0;
    let totalBookings = 0;

    if (activeEvent) {
      totalSlots = await prisma.timeSlot.count({
        where: { eventId: activeEvent.id },
      });
      slotsFilled = await prisma.timeSlot.count({
        where: { eventId: activeEvent.id, status: 'BOOKED' },
      });
      slotsAvailable = await prisma.timeSlot.count({
        where: { eventId: activeEvent.id, status: 'AVAILABLE' },
      });
      totalBookings = await prisma.booking.count({
        where: { eventId: activeEvent.id },
      });
    }

    const fillPercentage = totalSlots > 0 ? Math.round((slotsFilled / totalSlots) * 100) : 0;

    return NextResponse.json({
      success: true,
      stats: {
        totalEvents,
        totalClasses,
        totalStudents,
        totalSlots,
        slotsFilled,
        slotsAvailable,
        totalBookings,
        fillPercentage,
      },
      activeEvent,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
