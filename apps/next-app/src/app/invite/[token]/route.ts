import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const COOKIE_NAME = 'atline_ref';
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 jours en secondes

export async function GET(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const baseUrl = new URL(req.url).origin;

  const payloadUrl = process.env.PAYLOAD_API_URL;
  const payloadKey = process.env.PAYLOAD_API_KEY;

  if (!payloadUrl || !payloadKey) {
    return NextResponse.redirect(new URL('/login', baseUrl));
  }

  // Chercher l'utilisateur par inviteToken
  let referralCode: string | null = null;
  try {
    const res = await fetch(
      `${payloadUrl}/users?where[inviteToken][equals]=${encodeURIComponent(token)}&limit=1`,
      {
        headers: { Authorization: `users API-Key ${payloadKey}` },
        next: { revalidate: 0 },
      }
    );
    const data = await res.json();
    referralCode = data?.docs?.[0]?.referralCode ?? null;
  } catch {
    return NextResponse.redirect(new URL('/login', baseUrl));
  }

  if (!referralCode) {
    // Token invalide → page d'erreur propre
    return NextResponse.redirect(
      new URL('/register', baseUrl) // /register sans ref affiche l'erreur "invitation requise"
    );
  }

  const response = NextResponse.redirect(new URL('/register', baseUrl));

  // First-click : on ne pose le cookie que s'il n'existe pas déjà
  const cookieStore = await cookies();
  const existing = cookieStore.get(COOKIE_NAME);

  if (!existing) {
    response.cookies.set(COOKIE_NAME, referralCode, {
      maxAge: COOKIE_MAX_AGE,
      path: '/',
      httpOnly: true,   // non accessible en JS côté client (sécurité)
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
  }

  return response;
}
