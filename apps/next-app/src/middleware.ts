import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const session = await auth();
  const path = req.nextUrl.pathname;

  // Routes publiques
  if (path.startsWith('/login') || path.startsWith('/api/auth')) {
    // Déjà connecté → dashboard
    if (session && path.startsWith('/login')) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    return NextResponse.next();
  }

  // Non connecté → login
  if (!session) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Routes nécessitant le module Coach
  if (path.startsWith('/coach')) {
    if (!session.user.hasCoach) {
      const url = new URL('/dashboard', req.url);
      url.searchParams.set('upgrade', 'coach');
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|icons|api/webhooks).*)',
  ],
};
