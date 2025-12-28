'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { DeleteTransactionButton } from "./DeleteTransactionButton";
import { Pencil, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { TransactionForm } from "./TransactionForm";
import * as React from "react";
import { useRouter } from "next/navigation";

interface Transaction {
  id: number;
  description: string;
  amount: string;
  date: string;
  type: string;
  accountId: number;
  categoryId: number | null;
  toAccountId: number | null;
  category?: {
    name: string;
  } | null;
  account?: {
    name: string;
  } | null;
  toAccount?: {
    name: string;
  } | null;
  runningBalance?: number;
}

interface TransactionListProps {
  transactions: Transaction[];
}

export function TransactionList({ transactions }: TransactionListProps) {
  const router = useRouter();
  const [editingId, setEditingId] = React.useState<number | null>(null);
  const [selectedIds, setSelectedIds] = React.useState<Set<number>>(new Set());
  const [isDeletingBulk, setIsDeletingBulk] = React.useState(false);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = React.useState(false);

  const toggleSelect = (id: number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
        newSelected.delete(id);
    } else {
        newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === transactions.length) {
        setSelectedIds(new Set());
    } else {
        setSelectedIds(new Set(transactions.map(t => t.id)));
    }
  };

  const handleBulkDelete = async () => {
    setIsDeletingBulk(true);
    try {
        const response = await fetch('/api/transactions', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: Array.from(selectedIds) })
        });
        
        if (!response.ok) throw new Error('Failed to delete transactions');
        
        setSelectedIds(new Set());
        setShowBulkDeleteConfirm(false);
        router.refresh();
    } catch (error) {
        console.error(error);
        alert('Failed to delete transactions');
    } finally {
        setIsDeletingBulk(false);
    }
  };

  if (transactions.length === 0) {
    return (
      <div className="min-h-[400px] flex items-center justify-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl">
        <p className="text-zinc-400 text-sm">No transactions found.</p>
      </div>
    );
  }

  const showBalance = transactions.length > 0 && transactions[0].runningBalance !== undefined;

  return (
    <div className="relative">
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-zinc-50/50 dark:bg-zinc-800/50">
              <TableHead className="w-[50px]">
                <Checkbox 
                  checked={selectedIds.size === transactions.length && transactions.length > 0} 
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead className="w-[150px]">Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Category / Flow</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              {showBalance && <TableHead className="text-right">Balance</TableHead>}
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => (
              <TableRow key={transaction.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 transition-colors group">
                <TableCell>
                  <Checkbox 
                    checked={selectedIds.has(transaction.id)} 
                    onCheckedChange={() => toggleSelect(transaction.id)}
                  />
                </TableCell>
                <TableCell className="text-zinc-500 dark:text-zinc-400 font-medium">
                  {format(new Date(transaction.date), "MMM dd, yyyy")}
                </TableCell>
                <TableCell className="font-medium">{transaction.description}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 text-xs font-medium text-zinc-500">
                    {transaction.type === 'transfer' ? (
                        <>
                            <span className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">{transaction.account?.name}</span>
                            <ArrowRightLeftIcon className="w-3 h-3 text-zinc-400" />
                            <span className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">{transaction.toAccount?.name}</span>
                        </>
                    ) : transaction.type === 'expense' ? (
                        <>
                            <span className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">{transaction.account?.name}</span>
                            <span className="text-zinc-400">→</span>
                            {transaction.category ? (
                                <span className="px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 border border-rose-100 dark:border-rose-900/50">
                                    {transaction.category.name}
                                </span>
                            ) : <span>Uncategorized</span>}
                        </>
                    ) : (
                        <>
                             {transaction.category ? (
                                <span className="px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50">
                                    {transaction.category.name}
                                </span>
                            ) : <span>Uncategorized</span>}
                            <span className="text-zinc-400">→</span>
                            <span className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">{transaction.account?.name}</span>
                        </>
                    )}
                  </div>
                </TableCell>
                <TableCell className={cn(
                  "text-right font-semibold",
                  transaction.type === 'income' ? "text-emerald-600" : transaction.type === 'expense' ? "text-rose-600" : "text-blue-600"
                )}>
                  {transaction.type === 'income' ? '+' : transaction.type === 'expense' ? '-' : ''}${Number(transaction.amount).toLocaleString()}
                </TableCell>
                {showBalance && (
                    <TableCell className="text-right font-mono text-sm text-zinc-600 dark:text-zinc-400">
                        ${(transaction.runningBalance as number).toLocaleString()}
                    </TableCell>
                )}
                <TableCell>
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Dialog open={editingId === transaction.id} onOpenChange={(open) => setEditingId(open ? transaction.id : null)}>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[550px] rounded-3xl">
                        <DialogHeader>
                          <DialogTitle>Edit Transaction</DialogTitle>
                        </DialogHeader>
                        <TransactionForm 
                          initialData={transaction} 
                          onSuccess={() => setEditingId(null)} 
                        />
                      </DialogContent>
                    </Dialog>
                    <DeleteTransactionButton id={transaction.id} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Floating Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
            <div className="bg-zinc-900 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-900 rounded-full shadow-xl px-6 py-3 flex items-center gap-6 animate-in slide-in-from-bottom-4">
                <div className="font-medium text-sm whitespace-nowrap">
                    {selectedIds.size} selected
                </div>
                <div className="h-4 w-px bg-zinc-700 dark:bg-zinc-300" />
                <Dialog open={showBulkDeleteConfirm} onOpenChange={setShowBulkDeleteConfirm}>
                    <DialogTrigger asChild>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-400 hover:text-red-300 hover:bg-zinc-800 dark:hover:bg-zinc-200 rounded-full h-8"
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Delete {selectedIds.size} Transactions?</DialogTitle>
                            <DialogDescription>
                                This action cannot be undone. These transactions will be permanently removed.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="outline" disabled={isDeletingBulk}>Cancel</Button>
                            </DialogClose>
                            <Button 
                                variant="destructive" 
                                onClick={handleBulkDelete} 
                                disabled={isDeletingBulk}
                            >
                                {isDeletingBulk && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Delete
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
      )}
    </div>
  );
}

function ArrowRightLeftIcon(props: any) {
    return (
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m2 9 3-3 3 3" />
        <path d="M13 18H5a2 2 0 0 1-2-2V6" />
        <path d="m22 15-3 3-3-3" />
        <path d="M11 6h8a2 2 0 0 1 2 2v10" />
      </svg>
    )
}