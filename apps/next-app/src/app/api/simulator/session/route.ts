import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getSimulatorQuota } from '@/lib/quota';

// GET /api/simulator/session — vérifie le quota avant d'ouvrir le WS
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!session.user.hasCoach) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const quota = await getSimulatorQuota(session.user.id);

  if (quota.remaining <= 0) {
    return NextResponse.json({
      allowed: false,
      quota,
      message: 'Quota mensuel épuisé. Achetez une heure supplémentaire pour continuer.',
    }, { status: 402 });
  }

  return NextResponse.json({
    allowed: true,
    quota,
    wsUrl: `${process.env.NEXT_PUBLIC_WS_URL}/simulator`,
    userId: session.user.id,
  });
}
