import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppSidebar } from "@/components/AppSidebar";
import { getUserDb, prismaAuth } from "@/lib/db";
import { auth } from "@/auth";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vibe Ledger",
  description: "Modern Cloud Accounting",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  
  let accounts: any[] = [];
  let categories: any[] = [];
  let user = null;

  if (session?.user) {
      user = session.user;

      // Stale session handling: Ensure we have ID and ShardID
      if ((!user.id || typeof user.shardId !== 'number') && user.email) {
          const dbUser = await prismaAuth.user.findUnique({
              where: { email: user.email }
          });
          if (dbUser) {
              user.id = dbUser.id;
              user.shardId = dbUser.shardId;
          }
      }

      if (user.id) {
          const prismaApp = await getUserDb(user.id, user.shardId);

          accounts = await prismaApp.account.findMany({
            where: { userId: user.id },
            orderBy: { name: 'asc' }
          });
          
          categories = await prismaApp.category.findMany({
            where: { userId: user.id },
            orderBy: { name: 'asc' }
          });
      }
  }

  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100`}
      >
        <div className="flex min-h-screen">
          <AppSidebar accounts={accounts} categories={categories} user={user} />
          <main className="flex-1 md:ml-64 pt-16 md:pt-0 min-h-screen">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}