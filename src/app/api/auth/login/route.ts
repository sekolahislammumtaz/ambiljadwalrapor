import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { comparePassword, signToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json({ success: false, message: 'Username dan password wajib diisi' }, { status: 400 });
    }

    const cleanUsername = username.trim().toLowerCase();

    // Cari user di database
    const user = await prisma.user.findFirst({
      where: {
        username: {
          equals: cleanUsername,
        },
      },
    });

    if (!user) {
      return NextResponse.json({ success: false, message: 'Akun tidak ditemukan' }, { status: 401 });
    }

    if (!user.active) {
      return NextResponse.json({ success: false, message: 'Akun Anda dinonaktifkan oleh Admin' }, { status: 403 });
    }

    // Verifikasi password
    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      // Khusus admin, jika env ADMIN_PASSWORD diset dan cocok
      if (user.role === 'ADMIN' && process.env.ADMIN_PASSWORD && password === process.env.ADMIN_PASSWORD) {
        // Izinkan dan update hash
        // proceed
      } else {
        return NextResponse.json({ success: false, message: 'Password salah' }, { status: 401 });
      }
    }

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
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan pada server' }, { status: 500 });
  }
}
