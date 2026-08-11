import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    const { imagePath } = await params;
    const decodedPath = decodeURIComponent(imagePath.join('/'));

    // Only allow serving from relevant_images/
    const allowedDir = path.join(process.cwd(), 'relevant_images');
    const fullPath = path.join(allowedDir, decodedPath.replace(/^relevant_images[\\/]/, ''));

    // Security: must stay inside relevant_images/
    if (!fullPath.startsWith(allowedDir)) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 403 });
    }

    if (!fs.existsSync(fullPath)) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    const imageBuffer = fs.readFileSync(fullPath);
    const ext = path.extname(fullPath).toLowerCase();
    const contentType = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' }[ext] || 'image/jpeg';

    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Image serve error:', error);
    return NextResponse.json({ error: 'Failed to load image' }, { status: 500 });
  }
}
