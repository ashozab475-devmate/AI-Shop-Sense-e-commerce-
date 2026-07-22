import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import * as jose from 'jose';
import prisma from '@/lib/prisma';

export async function POST(request) {
    try {
        const body = await request.json();
        const { email, password } = body;

        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email and password are required' },
                { status: 400 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return NextResponse.json(
                { error: 'Invalid email or password' },
                { status: 401 }
            );
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return NextResponse.json(
                { error: 'Invalid email or password' },
                { status: 401 }
            );
        }

        // ── Admin access restriction ──────────────────────────────────────
        // Only the fixed admin account can have admin role
        const ADMIN_EMAIL = 'admin@shopsense.com';
        if (user.role === 'admin' && user.email !== ADMIN_EMAIL) {
            // Demote any rogue admin back to user
            await prisma.user.update({ where: { id: user.id }, data: { role: 'user' } });
            user.role = 'user';
        }
        // Block non-admin accounts from accessing admin features
        if (body.loginAs === 'admin' && user.email !== ADMIN_EMAIL) {
            return NextResponse.json(
                { error: 'Admin access is restricted. Use the correct admin credentials.' },
                { status: 403 }
            );
        }

        // Create JWT
        const secret = new TextEncoder().encode(
            process.env.JWT_SECRET || 'your-secret-key-change-me-in-production'
        );

        const token = await new jose.SignJWT({
            id: user.id,
            email: user.email
        })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('2h')
            .sign(secret);

        const { password: _, ...userWithoutPassword } = user;

        const response = NextResponse.json(
            { 
                success: true,
                message: 'Login successful', 
                token,
                user: userWithoutPassword 
            },
            { status: 200 }
        );

        // Set cookie
        response.cookies.set('auth-token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 2, // 2 hours
            path: '/',
        });

        return response;
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
