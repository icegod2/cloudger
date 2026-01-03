import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, FileJson, FileSpreadsheet } from 'lucide-react';

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
      </div>
      
      <Tabs defaultValue="data" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general" disabled>General</TabsTrigger>
          <TabsTrigger value="data">Data Management</TabsTrigger>
          <TabsTrigger value="billing" disabled>Billing</TabsTrigger>
        </TabsList>
        
        <TabsContent value="data" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Export Data</CardTitle>
              <CardDescription>
                Download a copy of your data for backup or external analysis.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex flex-col gap-4 sm:flex-row">
                    <div className="flex-1 p-4 border rounded-lg border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-md text-blue-600 dark:text-blue-400">
                                <FileJson className="w-5 h-5" />
                            </div>
                            <h3 className="font-semibold">JSON Backup</h3>
                        </div>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
                            Complete backup of all your accounts, categories, and transactions in a structured format. Ideal for migration.
                        </p>
                        <form action="/api/export" method="get">
                            <input type="hidden" name="format" value="json" />
                            <Button variant="outline" className="w-full">
                                <Download className="w-4 h-4 mr-2" />
                                Download JSON
                            </Button>
                        </form>
                    </div>

                    <div className="flex-1 p-4 border rounded-lg border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-md text-green-600 dark:text-green-400">
                                <FileSpreadsheet className="w-5 h-5" />
                            </div>
                            <h3 className="font-semibold">Excel Export</h3>
                        </div>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
                            Comprehensive export including Transactions, Categories, and Accounts in separate sheets.
                        </p>
                        <a href="/api/export?format=excel" target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" className="w-full">
                                <Download className="w-4 h-4 mr-2" />
                                Download Excel (.xlsx)
                            </Button>
                        </a>
                    </div>
                </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
