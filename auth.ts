import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { authConfig } from './auth.config';
import { z } from 'zod';
import { prismaAuth } from '@/lib/db';
import bcrypt from 'bcryptjs';
import type { User } from '@prisma/client';

async function getUser(email: string): Promise<User | null> {
  try {
    const user = await prismaAuth.user.findUnique({ where: { email } });
    return user;
  } catch (error) {
    console.error('Failed to fetch user:', error);
    throw new Error('Failed to fetch user.');
  }
}

export const { auth, signIn, signOut, handlers } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);

        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data;
          const user = await getUser(email);
          if (!user) return null;
          
          const passwordsMatch = await bcrypt.compare(password, user.password);
          if (passwordsMatch) {
              // Check if email is verified
              if (!user.emailVerified) {
                  return null;
              }
              // Cast user.id (number) to any or string if NextAuth complains, 
              // but we extended the type so it should be fine as number?
              // NextAuth default expects ID to be string. We might need to cast.
              return user as any; 
          }
        }
        
        console.log('Invalid credentials');
        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.shardId = (user as any).shardId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = Number(token.id);
        session.user.shardId = Number(token.shardId);
      }
      return session;
    },
  },
});
