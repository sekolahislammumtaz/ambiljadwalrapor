import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

function checkAdmin(req: NextRequest) {
  const user = getUserFromRequest(req);
  return user && user.role === 'ADMIN';
}

export async function POST(req: NextRequest) {
  if (!checkAdmin(req)) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { studentIds, hold } = body;

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Daftar siswa yang dipilih tidak boleh kosong',
      }, { status: 400 });
    }

    // Jika hold = true -> active = false (ditahan)
    // Jika hold = false -> active = true (dilepas / unhold)
    const newActiveState = hold !== true;

    const result = await prisma.student.updateMany({
      where: {
        id: {
          in: studentIds,
        },
      },
      data: {
        active: newActiveState,
      },
    });

    const actionText = hold ? 'di-Hold' : 'di-Unhold';
    return NextResponse.json({
      success: true,
      message: `Berhasil mengubah ${result.count} siswa menjadi ${actionText}.`,
      count: result.count,
      active: newActiveState,
    });
  } catch (error: any) {
    console.error('Error updating student hold status:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
