import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getPlacementData } from '@/lib/placement';

const PAYLOAD_URL = process.env.PAYLOAD_API_URL;
const PAYLOAD_KEY = process.env.PAYLOAD_API_KEY;

function payloadHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `users API-Key ${PAYLOAD_KEY}`,
  };
}

// ── GET /api/place ────────────────────────────────────────────────────────────
// Retourne { placeables, targets } pour l'utilisateur connecté
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const data = await getPlacementData(session.user.id);
  return NextResponse.json(data);
}

// ── POST /api/place ───────────────────────────────────────────────────────────
// Body : { userId: string, targetId: string }
// Valide les règles et transfère l'effectiveDistributor
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  if (!PAYLOAD_URL || !PAYLOAD_KEY) {
    return NextResponse.json({ error: 'Service indisponible.' }, { status: 503 });
  }

  const body = await req.json();
  const { userId, targetId } = body as { userId?: string; targetId?: string };

  if (!userId || !targetId) {
    return NextResponse.json({ error: 'userId et targetId sont requis.' }, { status: 400 });
  }
  if (userId === targetId) {
    return NextResponse.json(
      { error: 'Un utilisateur ne peut pas être placé sous lui-même.' },
      { status: 400 }
    );
  }

  const hdrs = payloadHeaders();
  const callerId = session.user.id;

  // ── 1. Charger l'utilisateur à placer ──────────────────────────────────────
  const userRes = await fetch(`${PAYLOAD_URL}/users/${userId}?depth=1`, { headers: hdrs });
  if (!userRes.ok) {
    return NextResponse.json({ error: 'Utilisateur introuvable.' }, { status: 404 });
  }
  const user = await userRes.json();

  // Vérifier que le caller est le parrain direct
  const referredById =
    typeof user.referredBy === 'object' ? user.referredBy?.id : user.referredBy;
  if (String(referredById) !== String(callerId)) {
    return NextResponse.json(
      { error: "Vous n'êtes pas le parrain direct de cet utilisateur." },
      { status: 403 }
    );
  }

  // Vérifier la fenêtre de placement
  if (!user.placementDeadline || new Date(user.placementDeadline) <= new Date()) {
    return NextResponse.json(
      { error: 'La fenêtre de placement est expirée pour cet utilisateur.' },
      { status: 403 }
    );
  }

  // ── 2. Charger la cible ────────────────────────────────────────────────────
  const targetRes = await fetch(`${PAYLOAD_URL}/users/${targetId}?depth=1`, { headers: hdrs });
  if (!targetRes.ok) {
    return NextResponse.json({ error: 'Distributeur cible introuvable.' }, { status: 404 });
  }
  const target = await targetRes.json();

  // Vérifier que la cible est bien un filleul direct du caller
  const targetReferredById =
    typeof target.referredBy === 'object' ? target.referredBy?.id : target.referredBy;
  if (String(targetReferredById) !== String(callerId)) {
    return NextResponse.json(
      { error: "La cible n'est pas un filleul direct de vous." },
      { status: 403 }
    );
  }

  // Vérifier que la cible est distributeur
  if (target.role !== 'distributor') {
    return NextResponse.json(
      { error: 'La cible doit être un distributeur actif.' },
      { status: 400 }
    );
  }

  // Récupérer l'ancien effectiveDistributor pour recalculer son count
  const oldEffDistId = user.effectiveDistributor
    ? typeof user.effectiveDistributor === 'object'
      ? user.effectiveDistributor.id
      : user.effectiveDistributor
    : null;

  // ── 3. Mettre à jour l'effectiveDistributor ────────────────────────────────
  const updateRes = await fetch(`${PAYLOAD_URL}/users/${userId}`, {
    method: 'PATCH',
    headers: hdrs,
    body: JSON.stringify({ effectiveDistributor: targetId }),
  });
  if (!updateRes.ok) {
    const err = await updateRes.json().catch(() => ({}));
    console.error('[place] PATCH error', err);
    return NextResponse.json({ error: 'Erreur lors du placement.' }, { status: 500 });
  }

  // ── 4. Recalculer les directCounts ─────────────────────────────────────────
  const recalcCount = async (distId: string) => {
    const countRes = await fetch(
      `${PAYLOAD_URL}/users?where[effectiveDistributor][equals]=${distId}&limit=0`,
      { headers: hdrs }
    );
    if (!countRes.ok) return;
    const countData = await countRes.json();
    await fetch(`${PAYLOAD_URL}/users/${distId}`, {
      method: 'PATCH',
      headers: hdrs,
      body: JSON.stringify({ directCount: countData.totalDocs ?? 0 }),
    });
  };

  const recalcPromises: Promise<void>[] = [recalcCount(targetId)];
  if (oldEffDistId && String(oldEffDistId) !== String(targetId)) {
    recalcPromises.push(recalcCount(String(oldEffDistId)));
  }
  await Promise.all(recalcPromises);

  return NextResponse.json({ success: true });
}
