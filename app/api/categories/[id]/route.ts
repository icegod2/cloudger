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

    const category = await prisma.category.findUnique({ where: { id } });

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    if (category.userId !== user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check usage
    const transactionsCount = await prisma.transaction.count({
        where: { categoryId: id }
    });

    const childrenCount = await prisma.category.count({
        where: { parentId: id }
    });

    return NextResponse.json({
        ...category,
        canDelete: transactionsCount === 0 && childrenCount === 0
    });

  } catch (error) {
      console.error(error);
      return NextResponse.json({ error: 'Failed to fetch category' }, { status: 500 });
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

    const category = await prisma.category.findUnique({ where: { id } });
    if (!category || category.userId !== user.id) {
        return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 403 });
    }

    await prisma.category.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
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

        const category = await prisma.category.findUnique({ where: { id } });
        if (!category || category.userId !== user.id) {
            return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 403 });
        }

        const updated = await prisma.category.update({
            where: { id },
            data: { name }
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error('Error updating category:', error);
        return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
    }
}