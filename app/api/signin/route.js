/**
 * Sign In Route — thin controller wrapper (MVC)
 * All logic lives in lib/controllers/AuthController.js
 */

import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import * as jose from 'jose';
import prisma from '@/lib/prisma';

// ── Thin route handler follows MVC: Route → Controller → Model ──────────────
export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password, loginAs } = body;

    // ── Input validation (Controller responsibility) ──────────────────────
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // ── Model: fetch user ─────────────────────────────────────────────────
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Google-only account guard
    if (!user.password && user.googleId) {
      return NextResponse.json(
        { error: 'This account uses Google sign-in. Please continue with Google.' },
        { status: 401 }
      );
    }

    // ── Model: verify password ────────────────────────────────────────────
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // ── Controller: admin restriction ─────────────────────────────────────
    const ADMIN_EMAIL = 'admin@shopsense.com';
    if (user.role === 'admin' && user.email !== ADMIN_EMAIL) {
      await prisma.user.update({ where: { id: user.id }, data: { role: 'user' } });
      user.role = 'user';
    }
    if (loginAs === 'admin' && user.email !== ADMIN_EMAIL) {
      return NextResponse.json(
        { error: 'Admin access is restricted. Use the correct admin credentials.' },
        { status: 403 }
      );
    }

    // ── Model: update last login ──────────────────────────────────────────
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // ── Controller: generate JWT (View layer gets token) ──────────────────
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || 'your-secret-key-change-me-in-production'
    );
    const token = await new jose.SignJWT({ id: user.id, email: user.email, role: user.role })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('2h')
      .sign(secret);

    const { password: _pw, ...userWithoutPassword } = user;

    // ── View: return response ─────────────────────────────────────────────
    const response = NextResponse.json(
      { success: true, message: 'Login successful', token, user: userWithoutPassword },
      { status: 200 }
    );

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 2,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Sign in route error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
