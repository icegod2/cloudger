import { NextResponse } from 'next/server';
import { getUserDb } from '@/lib/db';
import { requireUser } from '@/lib/session';

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const { items } = body; // Array of { id: number, order: number }

    if (!Array.isArray(items)) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    const prisma = await getUserDb(user.id, user.shardId);
    
    await prisma.$transaction(
        items.map((item: any) => 
            prisma.category.updateMany({
                where: { id: item.id, userId: user.id },
                data: { order: item.order }
            })
        )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reordering categories:', error);
    return NextResponse.json({ error: 'Failed to reorder categories' }, { status: 500 });
  }
}