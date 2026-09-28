import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user || (user.role !== 'SUPERVISOR' && user.role !== 'ADMIN')) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const classIdsParam = searchParams.get('classIds');

    const activeEvent = await prisma.event.findFirst({
      where: { active: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!activeEvent) {
      return NextResponse.json({
        success: true,
        data: {
          activeEvent: null,
          classes: [],
          stats: { total: 0, arrived: 0, waiting: 0, serving: 0, completed: 0, notArrived: 0 },
        },
      });
    }

    let targetClassIds: string[] = [];
    if (classIdsParam) {
      targetClassIds = classIdsParam.split(',').map((s) => s.trim()).filter(Boolean);
    } else {
      // Ambil kelas yang diawasi oleh pengawas ini
      const supervisions = await prisma.supervisorClass.findMany({
        where: {
          supervisorId: user.userId,
          eventId: activeEvent.id,
        },
      });
      targetClassIds = supervisions.map((s) => s.classId);
    }

    if (targetClassIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          activeEvent,
          classes: [],
          stats: { total: 0, arrived: 0, waiting: 0, serving: 0, completed: 0, notArrived: 0 },
        },
      });
    }

    // Ambil data kelas-kelas tersebut
    const classes = await prisma.class.findMany({
      where: {
        id: { in: targetClassIds },
      },
      orderBy: { name: 'asc' },
    });

    // Ambil seluruh bookings untuk kelas-kelas ini di event aktif
    const rawBookings = await prisma.booking.findMany({
      where: {
        eventId: activeEvent.id,
        classId: { in: targetClassIds },
      },
      include: {
        student: true,
        class: true,
        slot: true,
      },
    });

    // Urutkan bookings berdasarkan slot.startTime ASC (paling pagi ke paling siang)
    rawBookings.sort((a, b) => (a.slot?.startTime || '').localeCompare(b.slot?.startTime || ''));

    // Hitung statistik
    let total = rawBookings.length;
    let arrived = 0;
    let waiting = 0;
    let serving = 0;
    let completed = 0;
    let notArrived = 0;

    for (const b of rawBookings) {
      if (b.parentArrived) arrived++;
      if (b.status === 'BELUM_DATANG') notArrived++;
      else if (b.status === 'MENUNGGU') waiting++;
      else if (b.status === 'SEDANG_DILAYANI') serving++;
      else if (b.status === 'SELESAI') completed++;
    }

    // Kelompokkan per kelas
    const classMap: Record<string, any[]> = {};
    for (const cls of classes) {
      classMap[cls.id] = [];
    }

    for (const b of rawBookings) {
      if (classMap[b.classId]) {
        classMap[b.classId].push({
          id: b.id,
          slotId: b.slotId,
          studentName: b.student.name,
          className: b.class.name,
          classId: b.classId,
          startTime: b.slot.startTime,
          endTime: b.slot.endTime,
          timeSlot: `${b.slot.startTime}–${b.slot.endTime}`,
          parentArrived: b.parentArrived,
          status: b.status,
          arrivedAt: b.arrivedAt,
          completedAt: b.completedAt,
        });
      }
    }

    const groupedClasses = classes.map((cls) => ({
      classId: cls.id,
      className: cls.name,
      bookings: classMap[cls.id] || [],
    }));

    return NextResponse.json({
      success: true,
      data: {
        activeEvent,
        classes: groupedClasses,
        stats: {
          total,
          arrived,
          waiting,
          serving,
          completed,
          notArrived,
        },
      },
    });
  } catch (error: any) {
    console.error('Error fetching monitor data:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
