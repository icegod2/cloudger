'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Loader2, ArrowRightLeft, TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from '@/components/ui/select';
import { useRouter, useSearchParams } from 'next/navigation';

interface Account {
  id: number;
  name: string;
  type: string;
  parentId: number | null;
  depth?: number;
}

interface Category {
  id: number;
  name: string;
  type: string;
  parentId: number | null;
  depth?: number;
}

interface TransactionFormProps {
  initialData?: {
    id: number;
    description: string;
    amount: string;
    date: string;
    type: string;
    accountId: number;
    categoryId: number | null;
    toAccountId?: number | null;
  };
  onSuccess?: () => void;
}

function buildFlatList(items: any[], parentId: number | null = null, depth = 0): any[] {
    const children = items.filter(i => i.parentId === parentId);
    let result: any[] = [];
    for (const child of children) {
      result.push({ ...child, depth });
      result = [...result, ...buildFlatList(items, child.id, depth + 1)];
    }
    return result;
}

export function TransactionForm({ initialData, onSuccess }: TransactionFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const defaultAccountId = searchParams.get('accountId');
  const defaultCategoryId = searchParams.get('categoryId');

  const [description, setDescription] = React.useState(initialData?.description || '');
  const [amount, setAmount] = React.useState(initialData?.amount || '');
  const [date, setDate] = React.useState<Date | undefined>(
    initialData ? new Date(initialData.date) : new Date()
  );
  
  // Selection state
  const [accountId, setAccountId] = React.useState<string>(
    initialData?.accountId.toString() || defaultAccountId || ''
  );
  
  const [destinationValue, setDestinationValue] = React.useState<string>(
    initialData?.type === 'transfer' 
        ? `acc-${initialData.toAccountId}` 
        : initialData?.categoryId 
            ? `cat-${initialData.categoryId}` 
            : defaultCategoryId ? `cat-${defaultCategoryId}` : ''
  );

  const [accounts, setAccounts] = React.useState<Account[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchData() {
        try {
            const [accRes, catRes] = await Promise.all([
                fetch('/api/accounts'),
                fetch('/api/categories')
            ]);
            
            if (accRes.ok && catRes.ok) {
                const accData = await accRes.json();
                const catData = await catRes.json();
                setAccounts(accData);
                setCategories(catData);
            }
        } catch (error) {
            console.error("Failed to fetch data", error);
        } finally {
            setIsLoading(false);
        }
    }
    fetchData();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || !date || !accountId || !destinationValue) return;

    // Parse destination
    let type = 'expense';
    let categoryId: number | null = null;
    let toAccountId: number | null = null;

    if (destinationValue.startsWith('cat-')) {
        const id = parseInt(destinationValue.replace('cat-', ''), 10);
        const cat = categories.find(c => c.id === id);
        type = cat?.type || 'expense';
        categoryId = id;
    } else if (destinationValue.startsWith('acc-')) {
        type = 'transfer';
        toAccountId = parseInt(destinationValue.replace('acc-', ''), 10);
    }

    setIsSubmitting(true);
    setIsSuccess(false);
    try {
      const url = initialData ? `/api/transactions/${initialData.id}` : '/api/transactions';
      const method = initialData ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: description || (type === 'transfer' ? 'Transfer' : 'Transaction'),
          amount: Math.round(parseFloat(amount)), // Ensure integer
          date: date.toISOString(),
          type,
          accountId: parseInt(accountId, 10),
          toAccountId,
          categoryId,
        }),
      });

      if (!response.ok) throw new Error('Failed to save transaction');

      // Success feedback
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 2000);

      if (!initialData) {
        // Clear only specific fields to allow quick repeated entry
        setDescription('');
        setAmount('');
        // We KEEP date, accountId, and destinationValue as per user request
      }
      
      router.refresh();
      if (onSuccess && initialData) onSuccess(); // Only auto-close on EDIT
    } catch (error) {
      console.error(error);
      alert('Failed to save transaction.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function renderOptions(items: any[], prefix: string) {
    return buildFlatList(items).map((item) => {
      const value = prefix ? `${prefix}-${item.id}` : item.id.toString();
      return (
        <SelectItem key={value} value={value}>
            <span className="flex items-center">
                {Array(item.depth).fill(0).map((_, i) => (
                    <span key={i} className="w-4 h-px bg-zinc-200 dark:bg-zinc-800 mr-2 inline-block" />
                ))}
                {item.name}
            </span>
        </SelectItem>
      );
    });
  }
  
  if (isLoading) {
      return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-zinc-400" /></div>;
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 p-1">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <div className="relative">
                <span className="absolute left-3 top-2.5 text-zinc-500">$</span>
                <Input
                    id="amount"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="pl-7 rounded-xl text-lg font-bold"
                    required
                    autoFocus={!initialData}
                />
            </div>
        </div>

        <div className="space-y-2">
            <Label>Date</Label>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        variant={"outline"}
                        className={cn(
                        "w-full justify-start text-left font-normal rounded-xl",
                        !date && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP") : <span>Pick a date</span>}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        defaultMonth={date}
                        initialFocus
                    />
                </PopoverContent>
            </Popover>
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Lunch, Salary, Rent"
          className="rounded-xl"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="account">From Account</Label>
        <Select value={accountId} onValueChange={setAccountId} required>
            <SelectTrigger id="account" className="rounded-xl">
                <SelectValue placeholder="Select account" />
            </SelectTrigger>
            <SelectContent>
                <SelectGroup>
                    <SelectLabel>Assets</SelectLabel>
                    {renderOptions(accounts.filter(a => a.type === 'asset' || !a.type).map(a => ({...a, id: a.id})), '')}
                </SelectGroup>
                <SelectGroup>
                    <SelectLabel>Liabilities</SelectLabel>
                    {renderOptions(accounts.filter(a => a.type === 'liability').map(a => ({...a, id: a.id})), '')}
                </SelectGroup>
            </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="destination">Destination (Category or Account)</Label>
        <Select value={destinationValue} onValueChange={setDestinationValue} required>
            <SelectTrigger id="destination" className="rounded-xl">
                <SelectValue placeholder="Select category or transfer account" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
                <SelectGroup>
                    <SelectLabel className="flex items-center gap-2"><TrendingDown className="w-3 h-3 text-rose-500"/> Expenses</SelectLabel>
                    {renderOptions(categories.filter(c => c.type === 'expense'), 'cat')}
                </SelectGroup>
                <SelectGroup>
                    <SelectLabel className="flex items-center gap-2"><TrendingUp className="w-3 h-3 text-emerald-500"/> Income</SelectLabel>
                    {renderOptions(categories.filter(c => c.type === 'income'), 'cat')}
                </SelectGroup>
                <SelectGroup>
                    <SelectLabel className="flex items-center gap-2"><ArrowRightLeft className="w-3 h-3 text-zinc-500"/> Transfers</SelectLabel>
                    {renderOptions(accounts.filter(a => a.id.toString() !== accountId), 'acc')}
                </SelectGroup>
            </SelectContent>
        </Select>
      </div>

      <Button 
        type="submit" 
        className={cn(
            "w-full rounded-full h-11 font-medium mt-2 transition-all",
            isSuccess && "bg-emerald-500 hover:bg-emerald-600 text-white"
        )} 
        disabled={isSubmitting || isLoading || !destinationValue}
      >
        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : isSuccess ? 'Transaction Saved!' : (initialData ? 'Update Transaction' : 'Add Transaction')}
      </Button>
    </form>
  );
}
