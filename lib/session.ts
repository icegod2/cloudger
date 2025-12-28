import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prismaAuth } from '@/lib/db';

export async function getCurrentUser() {
  const session = await auth();
  
  if (session?.user) {
      // Handle stale sessions where id/shardId might be missing
      if (!session.user.id || typeof session.user.shardId !== 'number') {
          if (session.user.email) {
              const dbUser = await prismaAuth.user.findUnique({
                  where: { email: session.user.email }
              });
              
              if (dbUser) {
                  session.user.id = dbUser.id;
                  session.user.shardId = dbUser.shardId;
              }
          }
      }
      
      // If we still don't have an ID (e.g. user deleted from Auth DB but has session), return null?
      // Or let it fail downstream? Better to return null to force re-login/redirect.
      if (!session.user.id) {
          return null;
      }

      return session.user;
  }

  return null;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }
  return user;
}