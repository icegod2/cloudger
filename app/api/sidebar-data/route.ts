import { NextResponse } from 'next/server';
import { getUserDb } from '@/lib/db';
import { requireUser } from '@/lib/session';

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);
    const dateLimitStr = searchParams.get('date');

    const prisma = await getUserDb(user.id, user.shardId);

    // If dateLimit is provided (e.g., '2023-10-31'), we want balances AS OF that date.
    // This is tricky.
    // Current Balance = Sum of all transactions (Income + TransferIn - Expense - TransferOut)
    // Historical Balance = Sum of all transactions where date <= dateLimit.
    
    let dateFilter: any = {};
    if (dateLimitStr) {
        // Assume dateLimit is end of day or specific timestamp
        dateFilter = {
            lte: new Date(dateLimitStr) // Should probably be end of day if it's just YYYY-MM-DD
        };
    }

    const [accounts, categories, transactions] = await Promise.all([
      prisma.account.findMany({
        where: { userId: user.id },
        orderBy: { order: 'asc' },
      }),
      prisma.category.findMany({
        where: { userId: user.id },
        orderBy: { order: 'asc' },
      }),
      // Fetch all transactions (or filtered by date) to calculate balances
      // Optimization: GroupBy would be better but let's stick to raw aggregation or fetching for now.
      // Fetching all transactions might be heavy. 
      // Ideally we use aggregate.
      prisma.transaction.findMany({
        where: {
            account: { userId: user.id },
            ...(dateLimitStr ? { date: dateFilter } : {})
        },
        select: {
            amount: true,
            type: true,
            accountId: true,
            toAccountId: true
        }
      })
    ]);

    return NextResponse.json({ accounts, categories, transactions });
  } catch (error) {
    console.error('Error fetching sidebar data:', error);
    return NextResponse.json({ error: 'Failed to fetch sidebar data' }, { status: 500 });
  }
}