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

    const newCategory = await prisma.category.create({
      data: {
        name,
        type,
        userId: user.id,
        parentId: parentId ? parseInt(parentId, 10) : null,
      },
    });

    return NextResponse.json(newCategory, { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const user = await requireUser();
    const prisma = await getUserDb(user.id, user.shardId);
    const categories = await prisma.category.findMany({
        where: { userId: user.id },
        orderBy: { order: 'asc' }
    });
    return NextResponse.json(categories);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}