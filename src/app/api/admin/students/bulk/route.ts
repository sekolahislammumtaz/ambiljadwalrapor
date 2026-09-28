import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { classId, namesText } = body;

    if (!classId || !namesText) {
      return NextResponse.json({
        success: false,
        message: 'Kelas dan teks daftar nama siswa wajib diisi',
      }, { status: 400 });
    }

    // Split per line
    const lines = namesText
      .split('\n')
      .map((l: string) => l.trim())
      .filter((l: string) => l.length > 0);

    if (lines.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Tidak ada nama siswa yang valid ditemukan',
      }, { status: 400 });
    }

    // Ambil siswa yang sudah ada di kelas tersebut
    const existing = await prisma.student.findMany({
      where: { classId },
      select: { name: true },
    });
    const existingNames = new Set(existing.map((s) => s.name.toLowerCase()));

    let addedCount = 0;
    let skippedCount = 0;

    for (const name of lines) {
      if (existingNames.has(name.toLowerCase())) {
        skippedCount++;
        continue;
      }

      await prisma.student.create({
        data: {
          name,
          classId,
          active: true,
        },
      });
      existingNames.add(name.toLowerCase());
      addedCount++;
    }

    return NextResponse.json({
      success: true,
      message: `Berhasil menambahkan ${addedCount} siswa (${skippedCount} dilewati karena sudah ada).`,
      addedCount,
      skippedCount,
    });
  } catch (error: any) {
    console.error('Bulk import error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
