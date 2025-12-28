'use client';

import * as React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2, TrendingUp, TrendingDown, Landmark, CreditCard, LineChart as LineChartIcon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, min, max, addMonths, isSameMonth, isSameYear } from 'date-fns';

export function ReportsDashboard() {
  const [activeTab, setActiveTab] = React.useState('cash-flow');
  
  // Data States
  const [cashFlowData, setCashFlowData] = React.useState<any[]>([]);
  const [netWorthTrend, setNetWorthTrend] = React.useState<any[]>([]);
  const [expenseCategoryData, setExpenseCategoryData] = React.useState<any[]>([]);
  const [incomeCategoryData, setIncomeCategoryData] = React.useState<any[]>([]);
  
  // New Time-Series Data for Assets/Liabilities
  const [assetTrendData, setAssetTrendData] = React.useState<any[]>([]);
  const [liabilityTrendData, setLiabilityTrendData] = React.useState<any[]>([]);
  const [assetKeys, setAssetKeys] = React.useState<string[]>([]);
  const [liabilityKeys, setLiabilityKeys] = React.useState<string[]>([]);
  
  const [loading, setLoading] = React.useState(true);
  const [period, setPeriod] = React.useState('month'); // Affects cash flow view primarily
  const [selectedDateLabel, setSelectedDateLabel] = React.useState<string | null>(null);
  const [allTransactions, setAllTransactions] = React.useState<any[]>([]);

  const COLORS = {
    income: "#10b981", 
    expense: "#f43f5e", 
    asset: "#3b82f6", 
    liability: "#f59e0b", 
    trend: "#8b5cf6",
    others: [
      "#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", 
      "#ec4899", "#6366f1", "#14b8a6", "#f97316", "#84cc16"
    ]
  };

  React.useEffect(() => {
    async function fetchAllData() {
      setLoading(true);
      try {
        const [cashFlowRes, accountsRes, transactionsRes] = await Promise.all([
          fetch(`/api/reports?groupBy=type&period=${period}`),
          fetch('/api/accounts'),
          fetch('/api/transactions') // Fetch ALL transactions
        ]);

        if (cashFlowRes.ok) {
            const json = await cashFlowRes.json();
            setCashFlowData(json.data);
            
            // Calculate Net Worth Trend (Cumulative Net Flow)
            let cumulative = 0;
            const trend = json.data.map((item: any) => {
                const income = item.Income || 0;
                const expense = item.Expense || 0;
                const net = income - expense;
                cumulative += net;
                return {
                    name: item.name,
                    Value: cumulative,
                    Net: net
                };
            });
            setNetWorthTrend(trend);
        }

        if (accountsRes.ok && transactionsRes.ok) {
            const accounts = await accountsRes.json();
            const transactions = await transactionsRes.json();
            setAllTransactions(transactions);

            // --- TIME SERIES LOGIC ---
            // 1. Identify Accounts
            const assetAccounts = accounts.filter((a: any) => a.type === 'asset');
            const liabilityAccounts = accounts.filter((a: any) => a.type === 'liability');
            
            setAssetKeys(assetAccounts.map((a: any) => a.name));
            setLiabilityKeys(liabilityAccounts.map((a: any) => a.name));

            // 2. Determine Date Range
            if (transactions.length > 0) {
                const dates = transactions.map((t: any) => new Date(t.date));
                const minDate = min(dates);
                const maxDate = new Date(); // Up to now
                
                // Generate all months in range
                const months = eachMonthOfInterval({
                    start: startOfMonth(minDate),
                    end: endOfMonth(maxDate)
                });

                // 3. Build Time Series
                // We need to replay history.
                // Sort transactions by date asc
                const sortedTxs = transactions.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
                
                const assetTrend: any[] = [];
                const liabilityTrend: any[] = [];
                
                // Current balances state
                const balances: Record<number, number> = {};
                accounts.forEach((a: any) => balances[a.id] = 0);
                
                let txIndex = 0;

                months.forEach(monthEnd => {
                    const monthLabel = format(monthEnd, 'MMM yyyy');
                    const nextMonthStart = addMonths(startOfMonth(monthEnd), 1);
                    
                    // Process transactions up to the end of this month
                    while (txIndex < sortedTxs.length) {
                        const tx = sortedTxs[txIndex];
                        if (new Date(tx.date) >= nextMonthStart) break;
                        
                        // Apply tx to balances
                        const amt = Number(tx.amount);
                        if (tx.accountId) {
                             if (tx.type === 'income') balances[tx.accountId] += amt;
                             else balances[tx.accountId] -= amt; 
                        }
                        if (tx.toAccountId) {
                             balances[tx.toAccountId] += amt;
                        }
                        txIndex++;
                    }
                    
                    // Snapshot for this month
                    const assetSnapshot: any = { name: monthLabel };
                    assetAccounts.forEach((acc: any) => {
                        assetSnapshot[acc.name] = balances[acc.id] || 0;
                    });
                    
                    const liabilitySnapshot: any = { name: monthLabel };
                    liabilityAccounts.forEach((acc: any) => {
                        liabilitySnapshot[acc.name] = Math.abs(balances[acc.id] || 0); // Show liability as positive magnitude
                    });
                    
                    assetTrend.push(assetSnapshot);
                    liabilityTrend.push(liabilitySnapshot);
                });
                
                setAssetTrendData(assetTrend);
                setLiabilityTrendData(liabilityTrend);
            }
        }

      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchAllData();
  }, [period]);

  // Compute Pie Chart Data based on selection
  React.useMemo(() => {
      const expenseTotals: Record<string, number> = {};
      const incomeTotals: Record<string, number> = {};
      const now = new Date();
      
      allTransactions.forEach((t: any) => {
          const tDate = new Date(t.date);
          let include = false;
          
          if (selectedDateLabel) {
              // Filter by selected bar
              const fmt = period === 'month' ? 'MMM yyyy' : 'yyyy';
              include = format(tDate, fmt) === selectedDateLabel;
          } else {
              // Default: Current period
              if (period === 'month') {
                  include = isSameMonth(tDate, now);
              } else {
                  include = isSameYear(tDate, now);
              }
          }
          
          if (!include) return;

          const amt = Number(t.amount);
          const catName = t.category?.name || 'Uncategorized';
          
          if (t.type === 'expense') {
              expenseTotals[catName] = (expenseTotals[catName] || 0) + amt;
          } else if (t.type === 'income') {
              incomeTotals[catName] = (incomeTotals[catName] || 0) + amt;
          }
      });

      const toPieData = (map: Record<string, number>) => 
          Object.entries(map)
              .map(([name, value]) => ({ name, value }))
              .sort((a, b) => b.value - a.value);

      setExpenseCategoryData(toPieData(expenseTotals));
      setIncomeCategoryData(toPieData(incomeTotals));
  }, [allTransactions, period, selectedDateLabel]);

  // Handle Bar Click
  const handleBarClick = (data: any) => {
      if (data && data.activeLabel) {
          setSelectedDateLabel(data.activeLabel === selectedDateLabel ? null : data.activeLabel);
      }
  };

  // Custom Tooltip for Stacked Bars to show %
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const total = payload.reduce((sum: number, entry: any) => sum + (entry.value || 0), 0);
      return (
        <div className="bg-white dark:bg-zinc-900 p-3 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 text-sm">
          <p className="font-bold mb-2 text-zinc-700 dark:text-zinc-300">{label}</p>
          {payload.map((entry: any, index: number) => (
             <div key={index} className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-zinc-500 dark:text-zinc-400">{entry.name}:</span>
                <span className="font-mono font-medium">
                    ${entry.value.toLocaleString()} 
                    <span className="text-xs text-zinc-400 ml-1">
                        ({total > 0 ? ((entry.value / total) * 100).toFixed(1) : 0}%)
                    </span>
                </span>
             </div>
          ))}
          <div className="border-t border-zinc-100 dark:border-zinc-800 mt-2 pt-2 flex justify-between font-bold">
            <span>Total:</span>
            <span>${total.toLocaleString()}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-[400px]">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="cash-flow">Cash Flow (Income/Expense)</TabsTrigger>
                <TabsTrigger value="net-worth">Net Worth (Assets/Debt)</TabsTrigger>
            </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-500">Period:</span>
            <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-[120px]">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="month">Monthly</SelectItem>
                    <SelectItem value="year">Yearly</SelectItem>
                </SelectContent>
            </Select>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        
        {/* TAB 1: CASH FLOW */}
        <TabsContent value="cash-flow" className="space-y-6 animate-in fade-in-50">
            {/* Main Chart: Income vs Expense */}
            <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-zinc-500" />
                        Income vs Expenses
                    </CardTitle>
                    <CardDescription>
                        {selectedDateLabel 
                            ? `Showing breakdown for ${selectedDateLabel}. Click again to reset.` 
                            : 'Compare your inflow and outflow over time. Click a bar to filter details.'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart 
                                data={cashFlowData} 
                                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                onClick={handleBarClick}
                                className="cursor-pointer"
                            >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E4E7" opacity={0.5} />
                                <XAxis dataKey="name" stroke="#71717A" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#71717A" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                                <Tooltip 
                                    cursor={{ fill: '#F4F4F5', opacity: 0.5 }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                <Legend iconType="circle" />
                                <Bar 
                                    dataKey="Income" 
                                    fill={COLORS.income} 
                                    radius={[4, 4, 0, 0]} 
                                    fillOpacity={selectedDateLabel ? 0.3 : 1}
                                />
                                <Bar 
                                    dataKey="Expense" 
                                    fill={COLORS.expense} 
                                    radius={[4, 4, 0, 0]} 
                                    fillOpacity={selectedDateLabel ? 0.3 : 1}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Secondary: Spending Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <CardHeader>
                        <CardTitle>Spending by Category</CardTitle>
                        <CardDescription>
                            {selectedDateLabel 
                                ? `Breakdown for ${selectedDateLabel}` 
                                : `Where your money went (${period === 'month' ? 'This Month' : 'This Year'}).`}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                         <div className="h-[300px] w-full flex items-center justify-center">
                            {expenseCategoryData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={expenseCategoryData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {expenseCategoryData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS.others[index % COLORS.others.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend layout="vertical" verticalAlign="middle" align="right" />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="text-zinc-400 text-sm">No expense data found.</div>
                            )}
                         </div>
                    </CardContent>
                </Card>
                
                <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
                     <CardHeader>
                        <CardTitle>Income Sources</CardTitle>
                        <CardDescription>
                            {selectedDateLabel 
                                ? `Breakdown for ${selectedDateLabel}` 
                                : `Where your money came from (${period === 'month' ? 'This Month' : 'This Year'}).`}
                        </CardDescription>
                    </CardHeader>
                     <CardContent>
                        <div className="h-[300px] w-full flex items-center justify-center">
                            {incomeCategoryData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={incomeCategoryData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {incomeCategoryData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS.others[(index + 5) % COLORS.others.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend layout="vertical" verticalAlign="middle" align="right" />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="text-zinc-400 text-sm">No income data found.</div>
                            )}
                         </div>
                     </CardContent>
                </Card>
            </div>
        </TabsContent>

        {/* TAB 2: NET WORTH */}
        <TabsContent value="net-worth" className="space-y-6 animate-in fade-in-50">
             
             {/* Main Chart: Net Worth Trend */}
             <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <LineChartIcon className="w-5 h-5 text-violet-500" />
                        Net Worth Growth
                    </CardTitle>
                    <CardDescription>Cumulative change in your net worth over this period.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={netWorthTrend} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <defs>
                                    <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={COLORS.trend} stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor={COLORS.trend} stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E4E7" opacity={0.5} />
                                <XAxis dataKey="name" stroke="#71717A" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#71717A" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                <Area type="monotone" dataKey="Value" stroke={COLORS.trend} fillOpacity={1} fill="url(#colorNet)" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
             </Card>

             <div className="flex flex-col gap-6">
                {/* Assets Stacked Bar */}
                <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Landmark className="w-5 h-5 text-emerald-500" />
                            Asset Allocation History
                        </CardTitle>
                        <CardDescription>Evolution of your assets over time.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[350px] w-full">
                            {assetTrendData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={assetTrendData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E4E7" opacity={0.5} />
                                        <XAxis dataKey="name" stroke="#71717A" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#71717A" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                                        <Tooltip content={<CustomTooltip />} cursor={{fill: 'transparent'}} />
                                        <Legend iconType="circle" />
                                        {assetKeys.map((key, index) => (
                                            <Bar 
                                                key={key} 
                                                dataKey={key} 
                                                stackId="a" 
                                                fill={COLORS.others[index % COLORS.others.length]} 
                                                radius={[0, 0, 0, 0]} 
                                            />
                                        ))}
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-zinc-400">No data available.</div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Liabilities Stacked Bar */}
                 <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-rose-500" />
                            Liability Breakdown History
                        </CardTitle>
                        <CardDescription>Evolution of your debts over time.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[350px] w-full">
                             {liabilityTrendData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={liabilityTrendData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E4E7" opacity={0.5} />
                                        <XAxis dataKey="name" stroke="#71717A" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#71717A" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                                        <Tooltip content={<CustomTooltip />} cursor={{fill: 'transparent'}} />
                                        <Legend iconType="circle" />
                                        {liabilityKeys.map((key, index) => (
                                            <Bar 
                                                key={key} 
                                                dataKey={key} 
                                                stackId="a" 
                                                fill={COLORS.others[(index + 5) % COLORS.others.length]} 
                                                radius={[0, 0, 0, 0]} 
                                            />
                                        ))}
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-zinc-400">No data available.</div>
                            )}
                        </div>
                    </CardContent>
                </Card>
             </div>
        </TabsContent>

      </Tabs>
    </div>
  );
}