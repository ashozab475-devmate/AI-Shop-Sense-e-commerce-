import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = {
      siteName: process.env.SITE_NAME || 'ShopSense',
      siteEmail: process.env.SITE_EMAIL || 'support@shopsense.com',
      sitePhone: process.env.SITE_PHONE || '+1 (555) 123-4567',
      maintenanceMode: process.env.MAINTENANCE_MODE === 'true',
      emailNotifications: true,
      maxUploadSize: 10,
      currency: 'USD',
    };

    return Response.json({ settings });
  } catch (error) {
    console.error('Admin settings error:', error);
    return Response.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();

    return Response.json({ settings: data });
  } catch (error) {
    console.error('Update admin settings error:', error);
    return Response.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
