import { NextResponse } from 'next/server';
import { getUserDb } from '@/lib/db';
import { requireUser } from '@/lib/session';

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const { description, amount, date, type, accountId, categoryId, toAccountId } = body;

    if (!description || !amount || !date || !type || !accountId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const prisma = await getUserDb(user.id, user.shardId);

    // Verify Account Ownership
    const account = await prisma.account.findUnique({
        where: { id: parseInt(accountId, 10) }
    });

    if (!account || account.userId !== user.id) {
        return NextResponse.json({ error: 'Invalid account' }, { status: 403 });
    }

    if (toAccountId) {
        const toAccount = await prisma.account.findUnique({
            where: { id: parseInt(toAccountId, 10) }
        });
        if (!toAccount || toAccount.userId !== user.id) {
            return NextResponse.json({ error: 'Invalid destination account' }, { status: 403 });
        }
    }

    const intAmount = Math.round(Number(amount));

    const newTransaction = await prisma.transaction.create({
      data: {
        description,
        amount: intAmount,
        date: new Date(date),
        type,
        accountId: parseInt(accountId, 10),
        toAccountId: toAccountId ? parseInt(toAccountId, 10) : null,
        categoryId: categoryId ? parseInt(categoryId, 10) : null,
      },
    });

    return NextResponse.json(newTransaction, { status: 201 });
  } catch (error) {
    console.error('Error creating transaction:', error);
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const user = await requireUser();
    const prisma = await getUserDb(user.id, user.shardId);
    const transactions = await prisma.transaction.findMany({
      where: {
        account: { userId: user.id }
      },
      orderBy: {
        date: 'desc',
      },
      include: {
        category: true,
      },
    });
    return NextResponse.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids)) {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const prisma = await getUserDb(user.id, user.shardId);

    // Verify ownership of all transactions to be deleted
    // We can do this by adding a where clause to deleteMany
    const deleteResult = await prisma.transaction.deleteMany({
      where: {
        id: { in: ids.map((id: any) => parseInt(id, 10)) },
        account: { userId: user.id } // Ensure we only delete user's transactions
      }
    });

    return NextResponse.json({ message: 'Transactions deleted', count: deleteResult.count });
  } catch (error) {
    console.error('Error deleting transactions:', error);
    return NextResponse.json({ error: 'Failed to delete transactions' }, { status: 500 });
  }
}
