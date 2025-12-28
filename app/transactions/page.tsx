import { TransactionList } from "@/components/TransactionList";
import { AddTransactionDialog } from "@/components/AddTransactionDialog";
import { TransactionDateFilter } from "@/components/TransactionDateFilter";
import { getUserDb } from "@/lib/db";
import { Prisma } from "@prisma/client-app";
import { startOfMonth, endOfMonth, startOfYear, endOfYear, parseISO, isValid } from 'date-fns';
import { requireUser } from "@/lib/session";

export const dynamic = 'force-dynamic';

interface TransactionsPageProps {
  searchParams: Promise<{
    accountId?: string;
    categoryId?: string;
    date?: string;
  }>;
}

export default async function TransactionsPage(props: TransactionsPageProps) {
  const user = await requireUser();
  const searchParams = await props.searchParams;
  const prisma = await getUserDb(user.id, user.shardId);
  
  let accountId = searchParams.accountId ? parseInt(searchParams.accountId) : undefined;
  let categoryId = searchParams.categoryId ? parseInt(searchParams.categoryId) : undefined;
  const dateParam = searchParams.date;

  // Validate Account Ownership
  if (accountId) {
    const account = await prisma.account.findUnique({
      where: { id: accountId } // Assuming Shard DB only has current user's data or we trust the connection? 
      // No, we should still filter by userId if possible or just rely on the connection being scoped?
      // Actually, 'account' model has userId.
    });
    // Double check ownership
    if (!account || account.userId !== user.id) {
      accountId = undefined;
    }
  }

  // Validate Category Ownership
  if (categoryId) {
    const category = await prisma.category.findUnique({
      where: { id: categoryId }
    });
    if (!category || category.userId !== user.id) {
      categoryId = undefined;
    }
  }

  const where: Prisma.TransactionWhereInput = {
    account: { userId: user.id }
  };

  if (accountId) {
    where.OR = [
      { accountId: accountId },
      { toAccountId: accountId }
    ];
  }

  if (categoryId) {
    where.categoryId = categoryId;
  }

  // Date Filter
  if (dateParam && dateParam !== 'all') {
      if (/^\d{4}$/.test(dateParam)) {
          const yearDate = new Date(`${dateParam}-01-01`);
          where.date = {
              gte: startOfYear(yearDate),
              lte: endOfYear(yearDate)
          };
      } else if (/^\d{4}-\d{2}$/.test(dateParam)) {
          const parsedDate = parseISO(`${dateParam}-01`);
          if (isValid(parsedDate)) {
              where.date = {
                  gte: startOfMonth(parsedDate),
                  lte: endOfMonth(parsedDate)
              };
          }
      }
  }

  // Fetch transactions with filters
  const transactions = await prisma.transaction.findMany({
    where,
    orderBy: {
      date: 'desc',
    },
    include: {
      category: true,
      account: { select: { name: true } },
      toAccount: { select: { name: true } },
    },
  });

  // Calculate Running Balance if accountId is present
  let transactionsWithBalance: any[] = transactions;

  if (accountId) {
      let startingBalance = 0;
      let dateLimit: Date | undefined;
      if (where.date && (where.date as any).gte) {
          dateLimit = (where.date as any).gte as Date;
      }

      if (dateLimit) {
          const [inc, exp, trIn, trOut] = await Promise.all([
            prisma.transaction.aggregate({ _sum: { amount: true }, where: { accountId, type: 'income', date: { lt: dateLimit } } }),
            prisma.transaction.aggregate({ _sum: { amount: true }, where: { accountId, type: 'expense', date: { lt: dateLimit } } }),
            prisma.transaction.aggregate({ _sum: { amount: true }, where: { toAccountId: accountId, type: 'transfer', date: { lt: dateLimit } } }),
            prisma.transaction.aggregate({ _sum: { amount: true }, where: { accountId, type: 'transfer', date: { lt: dateLimit } } })
          ]);
          startingBalance = (inc._sum.amount || 0) + (trIn._sum.amount || 0) - (exp._sum.amount || 0) - (trOut._sum.amount || 0);
      }

      const sorted = [...transactions].sort((a, b) => a.date.getTime() - b.date.getTime());
      let current = startingBalance;
      
      const sortedWithBalance = sorted.map(t => {
          const amt = t.amount;
          if (t.type === 'income') current += amt;
          else if (t.type === 'expense') current -= amt;
          else if (t.type === 'transfer') {
              if (t.accountId === accountId) current -= amt;
              else if (t.toAccountId === accountId) current += amt;
          }
          return { ...t, runningBalance: current };
      });
      
      transactionsWithBalance = sortedWithBalance.sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  const serializedTransactions = transactionsWithBalance.map(t => ({
    ...t,
    amount: t.amount.toString(),
    date: t.date.toISOString(),
    accountId: t.accountId,
    categoryId: t.categoryId,
    toAccountId: t.toAccountId,
    runningBalance: t.runningBalance,
  }));

  let title = "Transactions";
  if (accountId) {
      const account = await prisma.account.findUnique({ where: { id: accountId }});
      if (account) title = `${account.name} Transactions`;
  } else if (categoryId) {
      const category = await prisma.category.findUnique({ where: { id: categoryId }});
      if (category) title = `${category.name} Transactions`;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex flex-col gap-8">
        <section className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">{title}</h1>
            <p className="text-zinc-500 dark:text-zinc-400">View and manage your financial records.</p>
          </div>
          <div className="flex items-center gap-4">
            <TransactionDateFilter />
            <AddTransactionDialog />
          </div>
        </section>

        <TransactionList transactions={serializedTransactions} />
      </div>
    </div>
  );
}
