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
    const classId = searchParams.get('classId');

    let eventId = eventIdParam;
    if (!eventId) {
      const activeEvent = await prisma.event.findFirst({
        where: { active: true },
        orderBy: { createdAt: 'desc' },
      });
      eventId = activeEvent?.id || null;
    }

    if (!eventId) {
      return new NextResponse('Tidak ada event yang ditemukan', { status: 400 });
    }

    const where: any = { eventId };
    if (classId) where.classId = classId;

    const slots = await prisma.timeSlot.findMany({
      where,
      include: {
        class: true,
        event: true,
        booking: {
          include: {
            student: true,
          },
        },
      },
      orderBy: [
        { class: { name: 'asc' } },
        { startTime: 'asc' },
      ],
    });

    // Buat format CSV dengan tanda kutip untuk keamanan teks
    const headers = [
      'No',
      'Tanggal',
      'Kelas',
      'Nama Siswa',
      'Jam Pengambilan',
      'Status Slot',
      'Status Kehadiran',
      'Orang Tua Datang',
      'Waktu Kedatangan',
      'Status Selesai',
    ];

    const escapeCsv = (str: string | null | undefined) => {
      if (str === null || str === undefined) return '""';
      const clean = String(str).replace(/"/g, '""');
      return `"${clean}"`;
    };

    const rows = slots.map((s, idx) => {
      const b = s.booking;
      const studentName = b ? b.student.name : '(Belum Diambil)';
      const statusKehadiran = b ? b.status : 'AVAILABLE';
      const orangTuaDatang = b && b.parentArrived ? 'Sudah Datang' : 'Belum Datang';
      const waktuKedatangan = b && b.arrivedAt ? new Date(b.arrivedAt).toLocaleTimeString('id-ID') : '-';
      const statusSelesai = b && b.completedAt ? 'Selesai (' + new Date(b.completedAt).toLocaleTimeString('id-ID') + ')' : (b && b.status === 'SELESAI' ? 'Selesai' : 'Belum Selesai');

      return [
        idx + 1,
        escapeCsv(s.event.date),
        escapeCsv(s.class.name),
        escapeCsv(studentName),
        escapeCsv(`${s.startTime} - ${s.endTime}`),
        escapeCsv(s.status),
        escapeCsv(statusKehadiran),
        escapeCsv(orangTuaDatang),
        escapeCsv(waktuKedatangan),
        escapeCsv(statusSelesai),
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="Rekap_Pengambilan_Rapor_${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error: any) {
    console.error('Export error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
