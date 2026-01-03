import { auth } from '@/auth';
import { getUserDb } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';

export async function GET(req: NextRequest) {
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    const userId = session.user.id;
    const searchParams = req.nextUrl.searchParams;
    const format = searchParams.get('format') || 'json';

    try {
        const db = await getUserDb(userId);

        // Fetch all relevant data
        const [accounts, categories, transactions] = await Promise.all([
            db.account.findMany({ where: { userId } }),
            db.category.findMany({ where: { userId } }),
            db.transaction.findMany({
                where: {
                    account: { userId } 
                },
                include: {
                    account: true,
                    toAccount: true,
                    category: true,
                },
                orderBy: { date: 'desc' }
            })
        ]);

        if (format === 'json') {
            const data = {
                timestamp: new Date().toISOString(),
                user: {
                    name: session.user.name,
                    email: session.user.email
                },
                accounts,
                categories,
                transactions
            };

            return new NextResponse(JSON.stringify(data, null, 2), {
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Disposition': `attachment; filename="cloudger-backup-${new Date().toISOString().split('T')[0]}.json"`
                }
            });
        }

        // Default to Excel (.xlsx) for any other format
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Cloudger';
        workbook.created = new Date();

        // Helper to build category path
        const categoryMap = new Map(categories.map(c => [c.id, c]));
        const getCategoryPath = (categoryId: number | null): string => {
            if (!categoryId) return '';
            let current = categoryMap.get(categoryId);
            const path: string[] = [];
            let depth = 0;
            while (current && depth < 10) {
                path.unshift(current.name);
                if (!current.parentId) break;
                current = categoryMap.get(current.parentId);
                depth++;
            }
            return path.join(' > ');
        };

        // --- Sheet 1: Transactions ---
        const txSheet = workbook.addWorksheet('Transactions');
        txSheet.columns = [
            { header: 'ID', key: 'id', width: 10 },
            { header: 'Date', key: 'date', width: 15 },
            { header: 'Description', key: 'description', width: 30 },
            { header: 'Amount', key: 'amount', width: 15 },
            { header: 'Type', key: 'type', width: 10 },
            { header: 'Account', key: 'account', width: 20 },
            { header: 'Category', key: 'category', width: 25 },
            { header: 'To Account', key: 'toAccount', width: 20 },
        ];

        transactions.forEach(t => {
            txSheet.addRow({
                id: t.id,
                date: new Date(t.date).toISOString().split('T')[0],
                description: t.description,
                amount: t.amount,
                type: t.type,
                account: t.account.name,
                category: getCategoryPath(t.categoryId),
                toAccount: t.toAccount?.name || ''
            });
        });

        // --- Sheet 2: Categories ---
        const catSheet = workbook.addWorksheet('Categories');
        catSheet.columns = [
            { header: 'ID', key: 'id', width: 10 },
            { header: 'Name', key: 'name', width: 20 },
            { header: 'Type', key: 'type', width: 10 },
            { header: 'Full Path', key: 'path', width: 30 },
            { header: 'Parent ID', key: 'parentId', width: 10 },
        ];

        categories.forEach(c => {
            catSheet.addRow({
                id: c.id,
                name: c.name,
                type: c.type,
                path: getCategoryPath(c.id),
                parentId: c.parentId || ''
            });
        });

        // --- Sheet 3: Accounts ---
        const accSheet = workbook.addWorksheet('Accounts');
        accSheet.columns = [
            { header: 'ID', key: 'id', width: 10 },
            { header: 'Name', key: 'name', width: 20 },
            { header: 'Type', key: 'type', width: 10 },
            { header: 'Order', key: 'order', width: 10 },
            { header: 'Parent ID', key: 'parentId', width: 10 },
        ];

        accounts.forEach(a => {
            accSheet.addRow({
                id: a.id,
                name: a.name,
                type: a.type,
                order: a.order,
                parentId: a.parentId || ''
            });
        });

        const buffer = await workbook.xlsx.writeBuffer();

        return new NextResponse(buffer, {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="cloudger-export-${new Date().toISOString().split('T')[0]}.xlsx"`
            }
        });

    } catch (error) {
        console.error('Export error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}