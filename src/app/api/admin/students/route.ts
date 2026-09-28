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
    const { searchParams } = new URL(req.url);
    const classId = searchParams.get('classId');
    const search = searchParams.get('search');

    const where: any = {};
    if (classId) {
      where.classId = classId;
    }
    if (search) {
      where.name = {
        contains: search,
      };
    }

    const students = await prisma.student.findMany({
      where,
      include: {
        class: true,
        bookings: {
          select: {
            id: true,
            eventId: true,
            status: true,
            slot: true,
          },
        },
      },
      orderBy: [{ classId: 'asc' }, { name: 'asc' }],
    });

    return NextResponse.json({ success: true, data: students });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!checkAdmin(req)) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, classId } = body;

    if (!name || !classId) {
      return NextResponse.json({ success: false, message: 'Nama siswa dan kelas wajib diisi' }, { status: 400 });
    }

    const cleanName = name.trim();
    const existing = await prisma.student.findFirst({
      where: {
        name: cleanName,
        classId: classId,
      },
    });

    if (existing) {
      return NextResponse.json({ success: false, message: 'Siswa dengan nama tersebut sudah terdaftar di kelas ini' }, { status: 400 });
    }

    const student = await prisma.student.create({
      data: {
        name: cleanName,
        classId,
        active: true,
      },
      include: {
        class: true,
      },
    });

    return NextResponse.json({ success: true, data: student });
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
    const { id, name, classId, active } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: 'ID siswa wajib diisi' }, { status: 400 });
    }

    const data: any = {};
    if (name !== undefined) data.name = name.trim();
    if (classId !== undefined) data.classId = classId;
    if (active !== undefined) data.active = Boolean(active);

    const updated = await prisma.student.update({
      where: { id },
      data,
      include: {
        class: true,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!checkAdmin(req)) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'ID siswa wajib diisi' }, { status: 400 });
    }

    await prisma.student.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Siswa berhasil dihapus' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
