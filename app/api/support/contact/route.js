import { prisma } from '@/lib/prisma';

export async function POST(request) {
  try {
    const { name, email, subject, message } = await request.json();

    if (!name || !email || !subject || !message) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        name,
        email,
        subject,
        message,
        status: 'open',
      },
    });

    return Response.json({ ticket }, { status: 201 });
  } catch (error) {
    console.error('Support contact error:', error);
    return Response.json({ error: 'Failed to submit contact form' }, { status: 500 });
  }
}
