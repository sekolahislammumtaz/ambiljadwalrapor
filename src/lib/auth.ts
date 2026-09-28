import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'mumtaz_rapor_jwt_secret_token_secure_2026_xyz';

export interface TokenPayload {
  userId: string;
  username: string;
  name: string;
  role: 'ADMIN' | 'SUPERVISOR';
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    return null;
  }
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function comparePassword(plain: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(plain, hashed);
}

export function getUserFromRequest(req: NextRequest): TokenPayload | null {
  // Check cookie 'auth_token'
  const cookie = req.cookies.get('auth_token')?.value;
  if (cookie) {
    const verified = verifyToken(cookie);
    if (verified) return verified;
  }

  // Check Authorization header
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    return verifyToken(token);
  }

  return null;
}
