import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

function checkAdmin(req: NextRequest) {
  const user = getUserFromRequest(req);
  return user && user.role === 'ADMIN';
}

export async function GET() {
  try {
    let setting = await prisma.appSetting.findFirst();
    if (!setting) {
      setting = await prisma.appSetting.create({
        data: {
          title: 'Jadwal Pengambilan Rapor',
          subtitle: 'Silakan pilih jadwal pengambilan rapor Ananda',
          logo: '/mumtaz.png',
        },
      });
    }
    return NextResponse.json({ success: true, data: setting });
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
    const { title, subtitle, logo } = body;

    let setting = await prisma.appSetting.findFirst();
    if (!setting) {
      setting = await prisma.appSetting.create({
        data: {
          title: title || 'Jadwal Pengambilan Rapor',
          subtitle: subtitle || 'Silakan pilih jadwal pengambilan rapor Ananda',
          logo: logo || '/mumtaz.png',
        },
      });
    } else {
      setting = await prisma.appSetting.update({
        where: { id: setting.id },
        data: {
          ...(title !== undefined && { title }),
          ...(subtitle !== undefined && { subtitle }),
          ...(logo !== undefined && { logo }),
        },
      });
    }

    return NextResponse.json({ success: true, data: setting });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
