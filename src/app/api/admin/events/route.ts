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
    const events = await prisma.event.findMany({
      include: {
        _count: {
          select: {
            slots: true,
            bookings: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: events });
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
    const {
      name,
      date,
      startTime = '08:00',
      breakStart = '11:45',
      breakEnd = '13:00',
      durationMinutes = 15,
      active = false,
    } = body;

    if (!name || !date) {
      return NextResponse.json({
        success: false,
        message: 'Nama event dan tanggal pengambilan rapor wajib diisi',
      }, { status: 400 });
    }

    if (active) {
      // Nonaktifkan event lain jika event ini diaktifkan
      await prisma.event.updateMany({
        where: { active: true },
        data: { active: false },
      });
    }

    const event = await prisma.event.create({
      data: {
        name: name.trim(),
        date,
        startTime,
        breakStart,
        breakEnd,
        durationMinutes: Number(durationMinutes) || 15,
        active: Boolean(active),
      },
    });

    return NextResponse.json({ success: true, data: event });
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
    const { id, name, date, startTime, breakStart, breakEnd, durationMinutes, active } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: 'ID event wajib diisi' }, { status: 400 });
    }

    if (active) {
      // Nonaktifkan event lain jika event ini diset aktif
      await prisma.event.updateMany({
        where: { id: { not: id }, active: true },
        data: { active: false },
      });
    }

    const data: any = {};
    if (name !== undefined) data.name = name.trim();
    if (date !== undefined) data.date = date;
    if (startTime !== undefined) data.startTime = startTime;
    if (breakStart !== undefined) data.breakStart = breakStart;
    if (breakEnd !== undefined) data.breakEnd = breakEnd;
    if (durationMinutes !== undefined) data.durationMinutes = Number(durationMinutes);
    if (active !== undefined) data.active = Boolean(active);

    const updated = await prisma.event.update({
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
      return NextResponse.json({ success: false, message: 'ID event wajib diisi' }, { status: 400 });
    }

    await prisma.event.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Event berhasil dihapus' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
