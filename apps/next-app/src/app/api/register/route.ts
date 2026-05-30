import { NextResponse } from 'next/server';

const COOKIE_NAME = 'atline_ref';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, referralCode, pendingPlacement } = body;

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

    // Payload CMS reçoit les données brutes
    // enforceClientRole (hook) force toujours role=client pour les appels non authentifiés
    // resolveEffectiveDistributor (hook) résout le parrain si referralCode_input est fourni
    const userPayload: Record<string, unknown> = { name, email, password };

    if (referralCode) {
      // Champ virtuel lu par le hook resolveEffectiveDistributor
      userPayload.referralCode_input = referralCode;
    }

    if (pendingPlacement) {
      // Distributeur sans parrain → en attente d'assignation par Atline
      userPayload.pendingPlacement = true;
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

    // Succès → effacer le cookie d'attribution (parrain résolu)
    const response = NextResponse.json({ success: true }, { status: 201 });
    response.cookies.set(COOKIE_NAME, '', { maxAge: 0, path: '/' });
    return response;
  } catch (err) {
    console.error('[register]', err);
    return NextResponse.json({ error: 'Erreur interne du serveur.' }, { status: 500 });
  }
}
