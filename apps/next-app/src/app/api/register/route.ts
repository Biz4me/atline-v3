import { NextResponse } from 'next/server';

const COOKIE_NAME = 'atline_ref';

export async function POST(req: Request) {
  try {
    const { name, email, password, referralCode } = await req.json();

    if (!name || !email || !password || !referralCode) {
      return NextResponse.json(
        { error: 'Tous les champs sont obligatoires, y compris le code parrain.' },
        { status: 400 }
      );
    }

    const payloadUrl = process.env.PAYLOAD_API_URL;
    if (!payloadUrl) {
      return NextResponse.json({ error: 'Service indisponible.' }, { status: 503 });
    }

    // Crée l'utilisateur dans Payload CMS
    // Le hook resolveEffectiveDistributor résout parrain + effectiveDistributor
    const res = await fetch(`${payloadUrl}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        email,
        password,
        role: 'client',
        referralCode_input: referralCode,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      const message =
        data?.errors?.[0]?.message ||
        data?.message ||
        'Erreur lors de la création du compte.';
      return NextResponse.json({ error: message }, { status: res.status });
    }

    // Succès → effacer le cookie d'attribution (mission accomplie)
    const response = NextResponse.json({ success: true }, { status: 201 });
    response.cookies.set(COOKIE_NAME, '', {
      maxAge: 0,
      path: '/',
    });
    return response;
  } catch (err) {
    console.error('[register]', err);
    return NextResponse.json({ error: 'Erreur interne du serveur.' }, { status: 500 });
  }
}
