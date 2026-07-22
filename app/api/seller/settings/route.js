import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'seller' && session.user.role !== 'admin')) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const seller = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        storeName: true,
        storeDescription: true,
        email: true,
        phone: true,
        address: true,
        bankAccount: true,
        notifications: true,
      },
    });

    return Response.json({ settings: seller });
  } catch (error) {
    console.error('Seller settings error:', error);
    return Response.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'seller' && session.user.role !== 'admin')) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        storeName: data.storeName,
        storeDescription: data.storeDescription,
        phone: data.phone,
        address: data.address,
        bankAccount: data.bankAccount,
        notifications: data.notifications,
      },
    });

    return Response.json({ settings: updated });
  } catch (error) {
    console.error('Update seller settings error:', error);
    return Response.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
