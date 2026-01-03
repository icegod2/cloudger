'use client';

import * as React from 'react';
import { LayoutDashboard, Wallet, CreditCard, PieChart, Menu, ChevronRight, ChevronDown, TrendingUp, TrendingDown, Landmark, ArrowRightLeft, LogOut, Settings } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { DateRangePicker } from '@/components/DateRangePicker';
import { signOutAction } from '@/lib/actions';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
  { icon: Wallet, label: 'Accounts', href: '/accounts' },
  { icon: CreditCard, label: 'Transactions', href: '/transactions' },
  { icon: PieChart, label: 'Reports', href: '/reports' },
  { icon: Settings, label: 'Settings', href: '/settings' },
];

interface SidebarProps {
  accounts?: any[];
  categories?: any[];
  user?: {
      name?: string | null;
      email?: string | null;
  } | null;
}

export function AppSidebar({ accounts: initialAccounts = [], categories: initialCategories = [], user }: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = React.useState(false);
  
  // Date State
  const getCurrentMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  };
  const [selectedMonth, setSelectedMonth] = React.useState(getCurrentMonth());
  
  // Data State
  const [data, setData] = React.useState<{ accounts: any[], categories: any[] }>({
    accounts: initialAccounts,
    categories: initialCategories
  });

  // Fetch Data on Month Change
  React.useEffect(() => {
    if (!user) return; // Don't fetch if no user
    async function fetchData() {
        try {
            const res = await fetch(`/api/sidebar-data?date=${selectedMonth}`);
            if (res.ok) {
                const json = await res.json();
                setData(json);
            }
        } catch (err) {
            console.error('Failed to fetch sidebar data', err);
        }
    }
    fetchData();

    // Listen for global data updates
    const handleDataChange = () => fetchData();
    window.addEventListener('vibe-data-change', handleDataChange);
    return () => window.removeEventListener('vibe-data-change', handleDataChange);
  }, [selectedMonth, user]);

  // Section Open States
  const [openSections, setOpenSections] = React.useState<Record<string, boolean>>({
      assets: true,
      liabilities: true,
      income: false,
      expenses: false
  });

  const toggleSection = (section: string) => {
      setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Helper to build tree and aggregate balances
  const buildTree = (items: any[]) => {
    const map: any = {};
    const roots: any[] = [];
    
    // 1. Initialize map
    items.forEach(item => {
        map[item.id] = { ...item, children: [], totalBalance: item.balance || 0 };
    });
    
    // 2. Build Hierarchy
    items.forEach(item => {
        if (item.parentId && map[item.parentId]) {
            map[item.parentId].children.push(map[item.id]);
        } else {
            roots.push(map[item.id]);
        }
    });

    // 3. Aggregate Balances (Recursive)
    const aggregate = (node: any) => {
        let sum = node.balance || 0;
        if (node.children) {
            node.children.forEach((child: any) => {
                sum += aggregate(child);
            });
        }
        node.totalBalance = sum;
        return sum;
    };
    
    roots.forEach(aggregate);
    return roots;
  };

  const accountTree = React.useMemo(() => buildTree(data.accounts), [data.accounts]);
  const categoryTree = React.useMemo(() => buildTree(data.categories), [data.categories]);

  const assets = accountTree.filter((a: any) => a.type === 'asset');
  const liabilities = accountTree.filter((a: any) => a.type === 'liability');
  const income = categoryTree.filter((c: any) => c.type === 'income');
  const expenses = categoryTree.filter((c: any) => c.type === 'expense');

  const renderTreeItem = (item: any, type: 'account' | 'category', depth = 0) => {
    const isActive = pathname === '/transactions' && 
       (type === 'account' 
        ? searchParams.get('accountId') === String(item.id) 
        : searchParams.get('categoryId') === String(item.id));
    
    const href = `/transactions?${type === 'account' ? 'accountId' : 'categoryId'}=${item.id}`;

    return (
        <div key={item.id} className="flex flex-col">
            <Link 
                href={href}
                onClick={() => setOpen(false)}
                className={cn(
                    "flex items-center justify-between gap-2 px-2 py-1.5 text-sm rounded-md transition-colors group",
                    isActive 
                        ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 font-medium" 
                        : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-50 dark:hover:bg-zinc-800/50",
                    depth > 0 && "ml-4 border-l border-zinc-200 dark:border-zinc-800"
                )}
            >
                <span className="truncate">{item.name}</span>
                <span className={cn(
                    "text-[10px] font-bold tabular-nums ml-auto px-1.5 py-0.5 rounded-md",
                    item.totalBalance < 0 
                        ? "text-rose-600 bg-rose-50 dark:bg-rose-900/20" 
                        : "text-zinc-500 bg-zinc-100 dark:bg-zinc-800",
                    isActive && (item.totalBalance < 0 ? "bg-rose-100 dark:bg-rose-900/40" : "bg-white dark:bg-zinc-700")
                )}>
                    {item.totalBalance !== 0 ? Math.abs(item.totalBalance).toLocaleString() : '0'}
                </span>
            </Link>
            {item.children && item.children.length > 0 && (
                <div className="flex flex-col">
                    {item.children.map((child: any) => renderTreeItem(child, type, depth + 1))}
                </div>
            )}
        </div>
    );
  };

  const renderSidebarSection = ({ title, icon: Icon, items, isOpen, onToggle, type, colorClass }: any) => (
    <div key={title} className="space-y-1">
        <button 
            onClick={onToggle}
            className="flex items-center justify-between w-full px-3 py-1 text-xs font-semibold text-zinc-500 uppercase tracking-wider hover:text-zinc-900 dark:hover:text-zinc-100 group"
        >
            <div className="flex items-center gap-2">
                <Icon className={cn("w-3 h-3", colorClass)} />
                <span>{title}</span>
            </div>
            {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </button>
        {isOpen && (
            <div className="space-y-0.5 mt-1">
                    {items.map((item: any) => renderTreeItem(item, type))}
                    {items.length === 0 && <p className="px-3 text-xs text-zinc-400 pl-8">No items</p>}
            </div>
        )}
    </div>
  );

  const sidebarContent = (
    <div className="flex flex-col h-full py-4 space-y-4 overflow-y-auto">
        <div className="px-6 py-2 mb-2">
            <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-zinc-900 dark:bg-zinc-50 rounded-lg flex items-center justify-center">
                    <div className="w-4 h-4 bg-white dark:bg-zinc-900 rounded-sm" />
                </div>
                <span className="font-bold tracking-tight text-lg">Vibe Ledger</span>
            </div>
        </div>

        <nav className="px-4 space-y-1">
            {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                    <Link 
                        key={item.href} 
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                            "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                            isActive 
                                ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50" 
                                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                        )}
                    >
                        <item.icon className="w-4 h-4" />
                        {item.label}
                    </Link>
                );
            })}
        </nav>

        <div className="px-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-4">
             {/* Date Selector moved here */}
             <div className="mb-4">
                <p className="px-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Period</p>
                <DateRangePicker 
                    value={selectedMonth} 
                    onChange={setSelectedMonth} 
                />
            </div>

            {renderSidebarSection({
                title: "Assets", 
                icon: Landmark, 
                items: assets, 
                isOpen: openSections.assets, 
                onToggle: () => toggleSection('assets'), 
                type: "account",
                colorClass: "text-emerald-500"
            })}
            
            {renderSidebarSection({
                title: "Liabilities", 
                icon: CreditCard, 
                items: liabilities, 
                isOpen: openSections.liabilities, 
                onToggle: () => toggleSection('liabilities'), 
                type: "account",
                colorClass: "text-rose-500"
            })}

            {renderSidebarSection({
                title: "Income", 
                icon: TrendingUp, 
                items: income, 
                isOpen: openSections.income, 
                onToggle: () => toggleSection('income'), 
                type: "category",
                colorClass: "text-emerald-500"
            })}

            {renderSidebarSection({
                title: "Expenses", 
                icon: TrendingDown, 
                items: expenses, 
                isOpen: openSections.expenses, 
                onToggle: () => toggleSection('expenses'), 
                type: "category",
                colorClass: "text-rose-500"
            })}
        </div>

        <div className="px-4 mt-auto pb-4">
            {user ? (
                <div className="flex items-center justify-between px-3 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 flex-shrink-0 flex items-center justify-center text-xs font-bold">
                            {user.name?.[0] || 'U'}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{user.name}</p>
                            <p className="text-xs text-zinc-500 truncate">{user.email}</p>
                        </div>
                    </div>
                    <form action={signOutAction}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
                            <LogOut className="w-4 h-4" />
                        </Button>
                    </form>
                </div>
            ) : (
                <Link href="/login" className="block w-full">
                    <Button variant="outline" className="w-full">Sign In</Button>
                </Link>
            )}
        </div>
    </div>
  );

  return (
    <>
      {/* Mobile Trigger */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-zinc-900 dark:bg-zinc-50 rounded-md flex items-center justify-center">
                <div className="w-3 h-3 bg-white dark:bg-zinc-900 rounded-sm" />
            </div>
            <span className="font-bold tracking-tight">Vibe Ledger</span>
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Menu className="w-5 h-5" />
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72">
                 <div className="h-full bg-white dark:bg-zinc-950">
                    {sidebarContent}
                 </div>
            </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 fixed inset-y-0 z-50 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        {sidebarContent}
      </aside>
    </>
  );
}
