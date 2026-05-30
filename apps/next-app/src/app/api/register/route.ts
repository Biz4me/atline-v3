import { NextResponse } from 'next/server';

const COOKIE_NAME = 'atline_ref';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, referralCode, pending_placement, role } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Tous les champs sont obligatoires.' },
        { status: 400 }
      );
    }

    const payloadUrl = process.env.PAYLOAD_API_URL;
    if (!payloadUrl) {
      return NextResponse.json({ error: 'Service indisponible.' }, { status: 503 });
    }

    // Construire le payload pour Payload CMS
    // Le hook resolveEffectiveDistributor sur le serveur gérera le referralCode
    const userPayload: Record<string, unknown> = {
      name,
      email,
      password,
      role: role ?? 'client',
    };

    if (referralCode) {
      userPayload.referralCode_input = referralCode;
    } else if (pending_placement) {
      userPayload.pending_placement = true;
    }

    const res = await fetch(`${payloadUrl}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userPayload),
    });

    const data = await res.json();

    if (!res.ok) {
      const message =
        data?.errors?.[0]?.message ||
        data?.message ||
        'Erreur lors de la création du compte.';
      return NextResponse.json({ error: message }, { status: res.status });
    }

    // Succès → effacer le cookie d'attribution
    const response = NextResponse.json({ success: true }, { status: 201 });
    response.cookies.set(COOKIE_NAME, '', { maxAge: 0, path: '/' });
    return response;
  } catch (err) {
    console.error('[register]', err);
    return NextResponse.json({ error: 'Erreur interne du serveur.' }, { status: 500 });
  }
}
