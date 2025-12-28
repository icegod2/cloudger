import { ReportsDashboard } from "@/components/ReportsDashboard";
import { requireUser } from "@/lib/session";

export const dynamic = 'force-dynamic';

export default async function ReportsPage() {
  await requireUser();

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex flex-col gap-8">
        <section>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Reports</h1>
          <p className="text-zinc-500 dark:text-zinc-400">Visualize your financial data.</p>
        </section>

        <ReportsDashboard />
      </div>
    </div>
  );
}
