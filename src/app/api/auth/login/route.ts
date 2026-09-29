import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { comparePassword, signToken } from '@/lib/auth';
import { autoInitializeDatabase } from '@/lib/init-db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json({ success: false, message: 'Username dan password wajib diisi' }, { status: 400 });
    }

    const cleanUsername = username.trim().toLowerCase();
    const envAdminPassword = process.env.ADMIN_PASSWORD || 'SiMumtaz123';

    let user: any = null;

    // 1. Coba cari user di database
    try {
      user = await prisma.user.findFirst({
        where: {
          username: {
            equals: cleanUsername,
          },
        },
      });
    } catch (dbError: any) {
      console.warn('[login] Gagal query user (kemungkinan tabel belum ada di database):', dbError.message);

      // Jika yang login adalah admin dan password cocok dengan ADMIN_PASSWORD
      if (cleanUsername === 'admin' && password === envAdminPassword) {
        console.log('[login] Menjalankan autoInitializeDatabase untuk membuat tabel & seed admin...');
        await autoInitializeDatabase();
        user = await prisma.user.findFirst({ where: { username: 'admin' } });
      } else {
        return NextResponse.json({
          success: false,
          message: `Gagal mengakses database. Pastikan koneksi DATABASE_URL di Vercel sudah benar. (${dbError.message})`,
        }, { status: 500 });
      }
    }

    // 2. Jika user admin belum ada di database tetapi password cocok dengan ADMIN_PASSWORD
    if (!user && cleanUsername === 'admin' && password === envAdminPassword) {
      console.log('[login] Admin belum terdaftar di database, melakukan inisialisasi awal...');
      await autoInitializeDatabase();
      user = await prisma.user.findFirst({ where: { username: 'admin' } });
    }

    if (!user) {
      return NextResponse.json({ success: false, message: 'Akun tidak ditemukan' }, { status: 401 });
    }

    if (!user.active) {
      return NextResponse.json({ success: false, message: 'Akun Anda dinonaktifkan oleh Admin' }, { status: 403 });
    }

    // 3. Verifikasi password
    const isMatch = await comparePassword(password, user.passwordHash);
    const isAdminPasswordMatch = user.role === 'ADMIN' && password === envAdminPassword;

    if (!isMatch && !isAdminPasswordMatch) {
      return NextResponse.json({ success: false, message: 'Password salah' }, { status: 401 });
    }

    // 4. Jika password admin di env berubah, sinkronkan ke database
    if (isAdminPasswordMatch && !isMatch) {
      try {
        const bcrypt = (await import('bcryptjs')).default;
        const newHash = await bcrypt.hash(password, 10);
        await prisma.user.update({
          where: { id: user.id },
          data: { passwordHash: newHash },
        });
      } catch (syncErr) {
        console.warn('Gagal sinkron hash password admin:', syncErr);
      }
    }

    // 5. Buat JWT Token
    const token = signToken({
      userId: user.id,
      username: user.username,
      name: user.name,
      role: user.role as 'ADMIN' | 'SUPERVISOR',
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
      },
      token,
    });

    // Set secure cookie
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({
      success: false,
      message: error.message ? `Terjadi kesalahan pada server: ${error.message}` : 'Terjadi kesalahan pada server',
    }, { status: 500 });
  }
}
