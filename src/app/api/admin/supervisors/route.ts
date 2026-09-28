import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

function checkAdmin(req: NextRequest) {
  const user = getUserFromRequest(req);
  return user && user.role === 'ADMIN';
}

export async function GET(req: NextRequest) {
  if (!checkAdmin(req)) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const activeEvent = await prisma.event.findFirst({
      where: { active: true },
      orderBy: { createdAt: 'desc' },
    });

    const supervisors = await prisma.user.findMany({
      where: { role: 'SUPERVISOR' },
      select: {
        id: true,
        username: true,
        name: true,
        active: true,
        createdAt: true,
        supervisions: {
          where: activeEvent ? { eventId: activeEvent.id } : undefined,
          include: {
            class: true,
          },
        },
      },
      orderBy: { username: 'asc' },
    });

    const mapped = supervisors.map((s) => ({
      id: s.id,
      username: s.username,
      name: s.name,
      active: s.active,
      assignedClasses: s.supervisions.map((sc) => sc.class.name),
      assignedClassIds: s.supervisions.map((sc) => sc.classId),
    }));

    return NextResponse.json({ success: true, data: mapped, activeEvent });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  if (!checkAdmin(req)) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { supervisorId, active, classIds, eventId } = body;

    if (!supervisorId) {
      return NextResponse.json({ success: false, message: 'ID pengawas wajib diisi' }, { status: 400 });
    }

    if (active !== undefined) {
      await prisma.user.update({
        where: { id: supervisorId },
        data: { active: Boolean(active) },
      });
    }

    // Update kelas yang diawasi jika classIds & eventId diberikan
    if (classIds !== undefined && eventId) {
      await prisma.$transaction(async (tx) => {
        // Hapus penugasan lama untuk event ini
        await tx.supervisorClass.deleteMany({
          where: {
            supervisorId,
            eventId,
          },
        });

        // Buat penugasan baru
        for (const cId of classIds) {
          await tx.supervisorClass.create({
            data: {
              supervisorId,
              classId: cId,
              eventId,
            },
          });
        }
      });
    }

    return NextResponse.json({ success: true, message: 'Data pengawas berhasil diperbarui' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
