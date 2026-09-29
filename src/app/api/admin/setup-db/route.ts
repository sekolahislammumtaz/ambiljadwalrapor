import { NextRequest, NextResponse } from 'next/server';
import { autoInitializeDatabase } from '@/lib/init-db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { password } = body;

    const validAdminPassword = process.env.ADMIN_PASSWORD || 'SiMumtaz123';
    if (!password || password !== validAdminPassword) {
      return NextResponse.json({
        success: false,
        message: 'Password Admin tidak valid untuk menjalankan inisialisasi database.',
      }, { status: 403 });
    }

    const result = await autoInitializeDatabase();

    return NextResponse.json({
      success: true,
      message: 'Database berhasil diinisialisasi dan seluruh tabel serta data awal telah siap di Supabase / Vercel!',
      detail: result,
    });
  } catch (error: any) {
    console.error('Setup DB error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
