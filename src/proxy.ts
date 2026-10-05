import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, isPublicPath } from '@/lib/auth/config';
import { readToken } from '@/lib/auth/token';
import { safeNext } from '@/lib/auth/validation';

/*
 * Optimistic gate before rendering. Page loads outside sign-in, sign-up, password
 * recovery and invitations need a validly signed, unexpired session cookie; everyone else
 * goes to /sign-in and comes back afterwards. The session itself is checked against the
 * store by the data access layer on every page and Server Action — Server Actions
 * (POST) pass through here and answer for themselves.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const params = new URLSearchParams(search);
  params.delete('_rsc');
  const path = pathname + (params.size ? '?' + params.toString() : '');

  const isPageLoad = request.method === 'GET' || request.method === 'HEAD';
  if (isPageLoad && !isPublicPath(pathname)) {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (!readToken(token)) {
      const url = new URL('/sign-in', request.url);
      const next = safeNext(path);
      if (next) url.searchParams.set('next', next);
      if (token) url.searchParams.set('reason', 'expired');
      const response = NextResponse.redirect(url);
      if (token) response.cookies.delete(SESSION_COOKIE);
      return response;
    }
  }

  // Lets the data access layer send the user back to this page after signing in or unlocking.
  const headers = new Headers(request.headers);
  headers.set('x-mahu-path', path);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|fonts/|icon.svg|favicon.ico).*)'],
};
