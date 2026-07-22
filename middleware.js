import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

export async function middleware(request) {
    const token = request.cookies.get('auth-token')?.value;

    // Paths that require authentication
    const protectedPaths = ['/profile', '/api/orders'];
    const isProtectedPath = protectedPaths.some((path) =>
        request.nextUrl.pathname.startsWith(path)
    );

    if (isProtectedPath) {
        if (!token) {
            return NextResponse.redirect(new URL('/signin', request.url));
        }

        try {
            const secret = new TextEncoder().encode(
                process.env.JWT_SECRET || 'your-secret-key-change-me-in-production'
            );
            await jwtVerify(token, secret);
            return NextResponse.next();
        } catch (error) {
            console.error('JWT verification failed:', error);
            return NextResponse.redirect(new URL('/signin', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/profile/:path*', '/api/orders/:path*'],
};
