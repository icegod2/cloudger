import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import { NextResponse } from 'next/server';

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const url = req.nextUrl.clone();

  // 1. Force HTTPS in Production
  if (isProduction) {
    const proto = req.headers.get('x-forwarded-proto');
    if (proto && proto !== 'https') {
        url.protocol = 'https:';
        return NextResponse.redirect(url);
    }
  }

  // 2. NextAuth logic has already run by the time we are inside this callback if we use `auth((req) => ...)`
  // because `auth` wraps the handler and passes the `req` with `auth` session populated.
  // The return value of this callback determines the response.
  // If we return nothing, it proceeds (authorized).
  // If we return Response, it stops.
  
  // We want to add headers to the success response.
  const response = NextResponse.next();

  if (isProduction) {
      response.headers.set(
          'Strict-Transport-Security',
          'max-age=63072000; includeSubDomains; preload'
      );
  }

  return response;
});

export const config = {
  // https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};
