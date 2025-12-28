import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/login',
  },
  providers: [
    // Added later in auth.ts
  ],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnAuthPage = nextUrl.pathname.startsWith('/login') || 
                           nextUrl.pathname.startsWith('/register') ||
                           nextUrl.pathname.startsWith('/new-verification');

      if (isOnAuthPage) {
        if (isLoggedIn) {
            // Redirect logged-in users away from auth pages to dashboard
            // But allow new-verification to be viewed even if logged in? 
            // Usually fine, or just redirect. Let's redirect login/register only.
            if (!nextUrl.pathname.startsWith('/new-verification')) {
                 return Response.redirect(new URL('/', nextUrl));
            }
        }
        return true;
      }

      // Protect all other routes
      if (!isLoggedIn) {
        return false;
      }
      
      return true;
    },
  },
} satisfies NextAuthConfig;
