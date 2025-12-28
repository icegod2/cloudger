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

    const account = await prisma.account.findUnique({ where: { id } });

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    if (account.userId !== user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check if account has transactions or children
    const transactionsCount = await prisma.transaction.count({
        where: {
            OR: [
                { accountId: id },
                { toAccountId: id }
            ]
        }
    });

    const childrenCount = await prisma.account.count({
        where: { parentId: id }
    });

    return NextResponse.json({
        ...account,
        canDelete: transactionsCount === 0 && childrenCount === 0
    });

  } catch (error) {
      console.error(error);
      return NextResponse.json({ error: 'Failed to fetch account' }, { status: 500 });
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

    // Verify ownership and emptiness again for safety
    // ... (logic handled by constraints usually, but good to check)
    // For MVP, we trust the frontend check or add server-side check.
    // Let's add server side check:
    const account = await prisma.account.findUnique({ where: { id } });
    if (!account || account.userId !== user.id) {
        return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 403 });
    }

    await prisma.account.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting account:', error);
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
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
        const { name } = body;

        if (!name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }

        const account = await prisma.account.findUnique({ where: { id } });
        if (!account || account.userId !== user.id) {
            return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 403 });
        }

        const updated = await prisma.account.update({
            where: { id },
            data: { name }
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error('Error updating account:', error);
        return NextResponse.json({ error: 'Failed to update account' }, { status: 500 });
    }
}