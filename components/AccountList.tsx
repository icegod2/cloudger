import { getUserDb } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, Building2, CreditCard, Landmark, ArrowRightLeft, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import * as React from 'react';
import { AccountTree } from './AccountTree';
import { AddAccountDialog } from './AddAccountDialog';
import { AddCategoryDialog } from './AddCategoryDialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { requireUser } from '@/lib/session';

interface Account {
  id: number;
  name: string;
  type: string;
  parentId: number | null;
  balance: number;
  totalBalance?: number;
  children: Account[];
}

interface Category {
  id: number;
  name: string;
  type: string;
  parentId: number | null;
  balance: number; // Represents total flow
  totalBalance?: number;
  children: Category[];
}

export async function AccountList({ 
    showBalances = true,
    showCategories = true,
    showAddButtons = true
}: { 
    showBalances?: boolean,
    showCategories?: boolean,
    showAddButtons?: boolean
}) {
  const user = await requireUser();
  const prisma = await getUserDb(user.id, user.shardId);

  const [accounts, categories, allTransactions] = await Promise.all([
    prisma.account.findMany({ 
        where: { userId: user.id },
        orderBy: { order: 'asc' } 
    }),
    showCategories ? prisma.category.findMany({ 
        where: { userId: user.id },
        orderBy: { order: 'asc' } 
    }) : Promise.resolve([]),
    showBalances ? prisma.transaction.findMany({
        where: { account: { userId: user.id } }
    }) : Promise.resolve([])
  ]);

  // --- ACCOUNT LOGIC ---
  const calculateAccountBalance = (acc: any) => {
    if (!showBalances) return 0;
    let balance = 0;
    allTransactions.forEach(t => {
        const amt = Number(t.amount);
        if (t.accountId === acc.id) {
            if (t.type === 'income') balance += amt;
            else balance -= amt; // expense or transfer out
        }
        if (t.toAccountId === acc.id) {
            balance += amt; // transfer in
        }
    });
    return balance;
  };

  const buildTree = (list: any[], balanceCalculator: (item: any) => number) => {
    const map: Record<number, any> = {};
    list.forEach(item => {
      map[item.id] = { ...item, balance: balanceCalculator(item), children: [] };
    });
    
    const tree: any[] = [];
    list.forEach(item => {
      if (item.parentId && map[item.parentId]) {
        map[item.parentId].children.push(map[item.id]);
      } else {
        tree.push(map[item.id]);
      }
    });

    const aggregateBalances = (node: any): number => {
      const childrenSum = node.children.reduce((sum: number, child: any) => sum + aggregateBalances(child), 0);
      node.totalBalance = node.balance + childrenSum;
      return node.totalBalance;
    };

    tree.forEach(aggregateBalances);
    return tree;
  };

  const accountTree = buildTree(accounts, calculateAccountBalance);
  const assets = accountTree.filter(a => a.type === 'asset');
  const liabilities = accountTree.filter(a => a.type === 'liability');

  // --- CATEGORY LOGIC ---
  const calculateCategoryBalance = (cat: any) => {
      // Sum of all transactions linked to this category
      return allTransactions
        .filter(t => t.categoryId === cat.id)
        .reduce((sum, t) => sum + Number(t.amount), 0);
  };

  const categoryTree = buildTree(categories, calculateCategoryBalance);
  const incomeCategories = categoryTree.filter(c => c.type === 'income');
  const expenseCategories = categoryTree.filter(c => c.type === 'expense');

  return (
    <div className="space-y-6">
        <Tabs defaultValue="assets" className="w-full">
            <div className="flex items-center justify-between mb-8">
                <TabsList className={cn(
                    "grid w-full grid-cols-2",
                    showCategories ? "max-w-[600px] grid-cols-4" : "max-w-[300px]"
                )}>
                    <TabsTrigger value="assets">Assets</TabsTrigger>
                    <TabsTrigger value="liabilities">Liabilities</TabsTrigger>
                    {showCategories && (
                        <>
                            <TabsTrigger value="income">Income</TabsTrigger>
                            <TabsTrigger value="expenses">Expenses</TabsTrigger>
                        </>
                    )}
                </TabsList>
            </div>

            {/* Assets Tab */}
            <TabsContent value="assets" className="space-y-6 animate-in fade-in-50">
                <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                        <Landmark className="w-5 h-5 text-emerald-500" />
                        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Asset Accounts</h2>
                    </div>
                    {showAddButtons && <AddAccountDialog type="asset" />}
                </div>
                <div className="bg-white dark:bg-zinc-900/50 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-2">
                    <div className="space-y-2 p-2">
                        <AccountTree nodes={assets} itemType="account" showBalances={showBalances} />
                        {assets.length === 0 && <p className="text-zinc-400 text-center py-8">No asset accounts found.</p>}
                    </div>
                </div>
            </TabsContent>

            {/* Liabilities Tab */}
            <TabsContent value="liabilities" className="space-y-6 animate-in fade-in-50">
                <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                        <ArrowRightLeft className="w-5 h-5 text-rose-500" />
                        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Liability Accounts</h2>
                    </div>
                    {showAddButtons && <AddAccountDialog type="liability" />}
                </div>
                <div className="bg-white dark:bg-zinc-900/50 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-2">
                    <div className="space-y-2 p-2">
                        <AccountTree nodes={liabilities} itemType="account" showBalances={showBalances} />
                        {liabilities.length === 0 && <p className="text-zinc-400 text-center py-8">No liability accounts found.</p>}
                    </div>
                </div>
            </TabsContent>

            {showCategories && (
                <>
                    {/* Income Tab */}
                    <TabsContent value="income" className="space-y-6 animate-in fade-in-50">
                                        <div className="flex items-center justify-between px-1">
                                            <div className="flex items-center gap-2">
                                                <TrendingUp className="w-5 h-5 text-emerald-500" />
                                                <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Income Categories</h2>
                                            </div>
                                            {showAddButtons && <AddCategoryDialog type="income" />}
                                        </div>
                        
                        <div className="bg-white dark:bg-zinc-900/50 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-2">
                            <div className="space-y-2 p-2">
                                <AccountTree nodes={incomeCategories} itemType="category" showBalances={showBalances} />
                                {incomeCategories.length === 0 && <p className="text-zinc-400 text-center py-8">No income categories found.</p>}
                            </div>
                        </div>
                    </TabsContent>

                    {/* Expenses Tab */}
                    <TabsContent value="expenses" className="space-y-6 animate-in fade-in-50">
                                        <div className="flex items-center justify-between px-1">
                                            <div className="flex items-center gap-2">
                                                <TrendingDown className="w-5 h-5 text-rose-500" />
                                                <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Expense Categories</h2>
                                            </div>
                                            {showAddButtons && <AddCategoryDialog type="expense" />}
                                        </div>
                        
                        <div className="bg-white dark:bg-zinc-900/50 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-2">
                            <div className="space-y-2 p-2">
                                <AccountTree nodes={expenseCategories} itemType="category" showBalances={showBalances} />
                                {expenseCategories.length === 0 && <p className="text-zinc-400 text-center py-8">No expense categories found.</p>}
                            </div>
                        </div>
                    </TabsContent>
                </>
            )}
        </Tabs>
    </div>
  );
}