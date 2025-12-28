import { TransactionList } from "@/components/TransactionList";
import { AddTransactionDialog } from "@/components/AddTransactionDialog";
import { AccountList } from "@/components/AccountList";
import { FinancialSummary } from "@/components/FinancialSummary";
import { getUserDb } from "@/lib/db";
import { requireUser } from "@/lib/session";

export const dynamic = 'force-dynamic';

export default async function Home() {
  const user = await requireUser();
  const prisma = await getUserDb(user.id, user.shardId);

  // Fetch all accounts with their transactions and transfers to calculate assets and liabilities
  const accounts = await prisma.account.findMany({
    where: { userId: user.id },
    include: {
      transactions: { select: { amount: true, type: true } },
      transfersIn: { select: { amount: true } },
    },
  });

  // Calculate Asset and Liability totals using the correct transfer logic
  let totalAssets = 0;
  let totalLiabilities = 0;

  accounts.forEach(account => {
    // Outflows: All transactions where this is accountId (Expense or Transfer Out)
    // Inflows: Income transactions + Transfers where this is toAccountId
    const outflows = account.transactions
        .filter(t => t.type !== 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const inflows = account.transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0) + 
        account.transfersIn.reduce((sum, t) => sum + Number(t.amount), 0);

    const balance = inflows - outflows;

    if (account.type === 'asset') {
      if (balance > 0) totalAssets += balance;
      else totalLiabilities += Math.abs(balance);
    } else {
      // Liabilities: A negative balance means you owe money (standard liability)
      // Wait, let's keep it consistent: Net Worth = Assets - Liabilities
      // If a Credit Card has -500 (meaning spent 500), Liabilities should increase by 500.
      if (balance < 0) totalLiabilities += Math.abs(balance);
      else totalAssets += balance;
    }
  });

  // Fetch recent transactions
  const recentTransactions = await prisma.transaction.findMany({
    where: {
      account: { userId: user.id }
    },
    orderBy: {
      date: 'desc',
    },
    take: 10,
    include: {
      category: true,
      account: { select: { name: true } },
      toAccount: { select: { name: true } },
    },
  });

  const serializedTransactions = recentTransactions.map(t => ({
    ...t,
    amount: t.amount.toString(),
    date: t.date.toISOString(),
    accountId: t.accountId,
    categoryId: t.categoryId,
    toAccountId: t.toAccountId,
  }));

  // Fetch all transactions for Income/Expense totals (EXCLUDING transfers)
  const allTransactions = await prisma.transaction.findMany({
    where: {
        type: { in: ['income', 'expense'] },
        account: { userId: user.id }
    },
    select: {
      amount: true,
      type: true,
    }
  });

  const totalIncome = allTransactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => acc + Number(t.amount), 0);

  const totalExpenses = allTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => acc + Number(t.amount), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex flex-col gap-12">
        <section>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Financial Overview</h1>
          <p className="text-zinc-500 dark:text-zinc-400">Your real-time accounting balance and net worth.</p>
        </section>
        
        <FinancialSummary 
          totalAssets={totalAssets}
          totalLiabilities={totalLiabilities}
          totalIncome={totalIncome}
          totalExpenses={totalExpenses}
          showIncomeExpense={false}
        />

        <section className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold tracking-tight">Your Accounts</h2>
          </div>
          <AccountList showCategories={false} showAddButtons={false} />
        </section>

        <section className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold tracking-tight">Recent Transactions</h2>
            <AddTransactionDialog />
          </div>
          <TransactionList transactions={serializedTransactions} />
        </section>
      </div>
    </div>
  );
}