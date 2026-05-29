import { NextResponse } from 'next/server';

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
    // Le hook resolveEffectiveDistributor s'occupe de résoudre parrain + effectiveDistributor
    const res = await fetch(`${payloadUrl}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Pas d'API key → création publique ; le hook rejette si pas de code parrain
      },
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
      // Payload retourne { errors: [{ message }] } ou { message }
      const message =
        data?.errors?.[0]?.message ||
        data?.message ||
        'Erreur lors de la création du compte.';
      return NextResponse.json({ error: message }, { status: res.status });
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error('[register]', err);
    return NextResponse.json({ error: 'Erreur interne du serveur.' }, { status: 500 });
  }
}
