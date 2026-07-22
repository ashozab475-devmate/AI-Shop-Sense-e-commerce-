import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request, { params }) {
    try {
        const { imagePath } = await params;
        
        // Decode the image path
        const decodedPath = decodeURIComponent(imagePath.join('/'));
        
        // Construct full path to image
        const fullPath = path.join(process.cwd(), decodedPath);
        
        // Security check: ensure path is within abo-images-small directory
        const aboImagesDir = path.join(process.cwd(), 'abo-images-small');
        if (!fullPath.startsWith(aboImagesDir)) {
            return NextResponse.json({ error: 'Invalid path' }, { status: 403 });
        }
        
        // Check if file exists
        if (!fs.existsSync(fullPath)) {
            return NextResponse.json({ error: 'Image not found' }, { status: 404 });
        }
        
        // Read and return image
        const imageBuffer = fs.readFileSync(fullPath);
        const ext = path.extname(fullPath).toLowerCase();
        
        const contentType = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.webp': 'image/webp'
        }[ext] || 'image/jpeg';
        
        return new NextResponse(imageBuffer, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=31536000, immutable'
            }
        });
        
    } catch (error) {
        console.error('Error serving image:', error);
        return NextResponse.json({ error: 'Failed to load image' }, { status: 500 });
    }
}
