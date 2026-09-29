import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { sortClassesNaturally } from '@/lib/class-sorter';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user || (user.role !== 'SUPERVISOR' && user.role !== 'ADMIN')) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const activeEvent = await prisma.event.findFirst({
      where: { active: true },
      orderBy: { createdAt: 'desc' },
    });

    const rawClasses = await prisma.class.findMany({
      where: { active: true },
    });
    const classes = sortClassesNaturally(rawClasses);

    let selectedClassIds: string[] = [];

    if (activeEvent) {
      const supervisions = await prisma.supervisorClass.findMany({
        where: {
          supervisorId: user.userId,
          eventId: activeEvent.id,
        },
      });
      selectedClassIds = supervisions.map((s) => s.classId);
    }

    return NextResponse.json({
      success: true,
      activeEvent,
      classes,
      selectedClassIds,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user || (user.role !== 'SUPERVISOR' && user.role !== 'ADMIN')) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { classIds, eventId } = body;

    if (!Array.isArray(classIds)) {
      return NextResponse.json({ success: false, message: 'classIds wajib berupa array' }, { status: 400 });
    }

    let targetEventId = eventId;
    if (!targetEventId) {
      const activeEvent = await prisma.event.findFirst({
        where: { active: true },
        orderBy: { createdAt: 'desc' },
      });
      targetEventId = activeEvent?.id;
    }

    if (!targetEventId) {
      return NextResponse.json({ success: false, message: 'Event aktif tidak ditemukan' }, { status: 400 });
    }

    // Hapus pilihan sebelumnya untuk event ini
    await prisma.supervisorClass.deleteMany({
      where: {
        supervisorId: user.userId,
        eventId: targetEventId,
      },
    });

    // Tambahkan pilihan baru secara batch jika ada kelas yang dipilih
    if (classIds.length > 0) {
      await prisma.supervisorClass.createMany({
        data: classIds.map((cId: string) => ({
          id: randomUUID(),
          supervisorId: user.userId,
          classId: cId,
          eventId: targetEventId,
        })),
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Pilihan kelas yang diawasi berhasil disimpan',
      selectedClassIds: classIds,
    });
  } catch (error: any) {
    console.error('Error saving supervisor classes:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
