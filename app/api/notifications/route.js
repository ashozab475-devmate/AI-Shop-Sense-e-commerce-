import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const notifications = await prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return Response.json({ notifications });
  } catch (error) {
    console.error('Notifications error:', error);
    return Response.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, message, type } = await request.json();

    const notification = await prisma.notification.create({
      data: {
        userId: session.user.id,
        title,
        message,
        type: type || 'general',
        read: false,
      },
    });

    return Response.json({ notification }, { status: 201 });
  } catch (error) {
    console.error('Create notification error:', error);
    return Response.json({ error: 'Failed to create notification' }, { status: 500 });
  }
}
