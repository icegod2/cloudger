import { NextResponse } from 'next/server';
import { getUserDb } from '@/lib/db';
import { requireUser } from '@/lib/session';

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);
    const fromDate = searchParams.get('from');
    const toDate = searchParams.get('to');

    if (!fromDate || !toDate) {
        return NextResponse.json({ error: 'Date range required' }, { status: 400 });
    }

    const prisma = await getUserDb(user.id, user.shardId);

    const transactions = await prisma.transaction.findMany({
        where: {
            account: { userId: user.id },
            date: {
                gte: new Date(fromDate),
                lte: new Date(toDate)
            }
        },
        include: {
            account: true,
            category: true
        },
        orderBy: { date: 'asc' }
    });

    return NextResponse.json(transactions);
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
  }
}