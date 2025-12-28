import { NextResponse } from 'next/server';
import { getUserDb } from '@/lib/db';
import { requireUser } from '@/lib/session';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const prisma = await getUserDb(user.id, user.shardId);
    const { id: idStr } = await params;
    const id = parseInt(idStr, 10);

    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
          account: true, // Need account to check ownership
      }
    });

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    if (transaction.account.userId !== user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json(transaction);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch transaction' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const prisma = await getUserDb(user.id, user.shardId);
    const { id: idStr } = await params;
    const id = parseInt(idStr, 10);

    const transaction = await prisma.transaction.findUnique({
        where: { id },
        include: { account: true }
    });

    if (!transaction || transaction.account.userId !== user.id) {
        return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 403 });
    }

    await prisma.transaction.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 });
  }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await requireUser();
        const prisma = await getUserDb(user.id, user.shardId);
        const { id: idStr } = await params;
        const id = parseInt(idStr, 10);
        const body = await request.json();
        const { description, amount, date, type, accountId, toAccountId, categoryId } = body;

        // Verify existing
        const existingTransaction = await prisma.transaction.findUnique({
            where: { id },
            include: { account: true }
        });

        if (!existingTransaction || existingTransaction.account.userId !== user.id) {
            return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 403 });
        }

        // Verify new account ownership if changed
        if (accountId) {
             const newAccount = await prisma.account.findUnique({ where: { id: parseInt(accountId, 10) } });
             if (!newAccount || newAccount.userId !== user.id) {
                 return NextResponse.json({ error: 'Invalid account' }, { status: 400 });
             }
        }
        
        // Verify new toAccount ownership if changed
        if (toAccountId) {
             const toAccount = await prisma.account.findUnique({ where: { id: parseInt(toAccountId, 10) } });
             if (!toAccount || toAccount.userId !== user.id) {
                 return NextResponse.json({ error: 'Invalid destination account' }, { status: 400 });
             }
        }

        const updatedTransaction = await prisma.transaction.update({
            where: { id },
            data: {
                description,
                amount: amount ? parseInt(amount, 10) : undefined,
                date: date ? new Date(date) : undefined,
                type,
                accountId: accountId ? parseInt(accountId, 10) : undefined,
                toAccountId: toAccountId ? parseInt(toAccountId, 10) : undefined,
                categoryId: categoryId ? parseInt(categoryId, 10) : undefined
            }
        });

        return NextResponse.json(updatedTransaction);
    } catch (error) {
        console.error('Error updating transaction:', error);
        return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 });
    }
}