import { NextResponse } from 'next/server';
import { getUserDb } from '@/lib/db';
import { requireUser } from '@/lib/session';

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const { name, type, parentId } = body;

    if (!name || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const prisma = await getUserDb(user.id, user.shardId);
    const newAccount = await prisma.account.create({
      data: {
        name,
        type,
        userId: user.id,
        parentId: parentId ? parseInt(parentId, 10) : null,
      },
    });

    return NextResponse.json(newAccount, { status: 201 });
  } catch (error) {
    console.error('Error creating account:', error);
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const user = await requireUser();
    const prisma = await getUserDb(user.id, user.shardId);
    const accounts = await prisma.account.findMany({
        where: { userId: user.id },
        orderBy: { order: 'asc' }
    });
    return NextResponse.json(accounts);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 });
  }
}