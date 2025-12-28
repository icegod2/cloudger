import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowUpCircle, ArrowDownCircle, Wallet, Landmark, Scale } from "lucide-react";

interface FinancialSummaryProps {
  totalAssets: number;
  totalLiabilities: number;
  totalIncome: number;
  totalExpenses: number;
  showIncomeExpense?: boolean;
}

export function FinancialSummary({
  totalAssets,
  totalLiabilities,
  totalIncome,
  totalExpenses,
  showIncomeExpense = true,
}: FinancialSummaryProps) {
  // Net Worth = Assets - Liabilities
  const netWorth = totalAssets - totalLiabilities;
  
  // Net Income = Income - Expenses
  const netIncome = totalIncome - totalExpenses;
  
  // Verification logic
  const isBalanced = Math.abs(netWorth - netIncome) < 0.01;

  return (
    <div className="flex flex-col gap-4">
      <div className={cn(
        "grid grid-cols-1 gap-4",
        showIncomeExpense ? "lg:grid-cols-4" : "lg:grid-cols-3"
      )}>
        {/* Assets */}
        <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Total Assets</CardTitle>
            <Landmark className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              ${totalAssets.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        {/* Liabilities */}
        <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Total Liabilities</CardTitle>
            <CreditCardIcon className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600">
              ${totalLiabilities.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        {!showIncomeExpense && (
          <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900/50 border-b-2 border-b-emerald-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Net Worth</CardTitle>
              <Wallet className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className={cn("text-2xl font-bold", netWorth >= 0 ? "text-emerald-600" : "text-rose-600")}>
                ${netWorth.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        )}

        {showIncomeExpense && (
          <>
            {/* Income */}
            <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Total Income</CardTitle>
                <ArrowUpCircle className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">
                  +${totalIncome.toLocaleString()}
                </div>
              </CardContent>
            </Card>

            {/* Expenses */}
            <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Total Expenses</CardTitle>
                <ArrowDownCircle className="h-4 w-4 text-rose-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-rose-600">
                  -${totalExpenses.toLocaleString()}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Balance Verification Footer - Only show if showing everything */}
      {showIncomeExpense && (
        <div className="flex items-center justify-between px-6 py-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-zinc-500 uppercase">Net Worth:</span>
              <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">${netWorth.toLocaleString()}</span>
            </div>
            <div className="h-4 w-[1px] bg-zinc-300 dark:bg-zinc-600" />
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-zinc-500 uppercase">Net Income:</span>
              <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">${netIncome.toLocaleString()}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Scale className={cn("h-4 w-4", isBalanced ? "text-emerald-500" : "text-amber-500")} />
            <span className={cn("text-xs font-bold uppercase tracking-widest", isBalanced ? "text-emerald-600" : "text-amber-600")}>
              {isBalanced ? "Status: Balanced" : "Status: Discrepancy Detected"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function CreditCardIcon(props: any) {
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
      <rect width="20" height="14" x="2" y="5" rx="2" />
      <line x1="2" x2="22" y1="10" y2="10" />
    </svg>
  );
}
