import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

function checkAdmin(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user || user.role !== 'ADMIN') {
    return false;
  }
  return true;
}

export async function GET(req: NextRequest) {
  if (!checkAdmin(req)) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const classes = await prisma.class.findMany({
      include: {
        _count: {
          select: {
            students: true,
            slots: true,
            bookings: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ success: true, data: classes });
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
    const { name } = body;
    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, message: 'Nama kelas wajib diisi' }, { status: 400 });
    }

    const cleanName = name.trim();
    const existing = await prisma.class.findUnique({
      where: { name: cleanName },
    });
    if (existing) {
      return NextResponse.json({ success: false, message: 'Kelas dengan nama tersebut sudah ada' }, { status: 400 });
    }

    const newClass = await prisma.class.create({
      data: {
        name: cleanName,
        active: true,
      },
    });

    return NextResponse.json({ success: true, data: newClass });
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
    const { id, name, active } = body;
    if (!id) {
      return NextResponse.json({ success: false, message: 'ID kelas wajib diberikan' }, { status: 400 });
    }

    const data: any = {};
    if (name !== undefined) data.name = name.trim();
    if (active !== undefined) data.active = Boolean(active);

    const updated = await prisma.class.update({
      where: { id },
      data,
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
      return NextResponse.json({ success: false, message: 'ID kelas wajib diberikan' }, { status: 400 });
    }

    await prisma.class.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Kelas berhasil dihapus' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
