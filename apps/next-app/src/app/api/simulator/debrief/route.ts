import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import type { SimulatorDebrief, TranscriptEntry } from '@atline/types';

// POST /api/simulator/debrief
// Appelé par le serveur WS à la fin de la session
// → Dify analyse → OpenClaw agit
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as {
    sessionId: string;
    transcript: TranscriptEntry[];
    durationSeconds: number;
    persona: string;
  };

  // 1. Envoyer à Dify pour analyse
  const difyRes = await fetch(`${process.env.DIFY_API_URL}/workflows/run`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.DIFY_DEBRIEF_KEY}`,
    },
    body: JSON.stringify({
      inputs: {
        transcript: body.transcript,
        persona: body.persona,
        userId: session.user.id,
        sessionId: body.sessionId,
      },
      response_mode: 'blocking',
      user: session.user.id,
    }),
  });

  const difyData = await difyRes.json();
  const debrief: SimulatorDebrief = difyData.data.outputs.debrief;

  // 2. Sauvegarder la session dans Payload
  await fetch(`${process.env.PAYLOAD_API_URL}/simulator-sessions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.PAYLOAD_API_KEY}`,
    },
    body: JSON.stringify({
      userId: session.user.id,
      sessionId: body.sessionId,
      persona: body.persona,
      durationSeconds: body.durationSeconds,
      transcript: body.transcript,
      debrief,
    }),
  });

  // 3. Déclencher OpenClaw pour exécuter le plan d'action
  // (fire & forget — pas besoin d'attendre la réponse)
  fetch(`${process.env.OPENCLAW_API_URL}/tasks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENCLAW_API_KEY}`,
    },
    body: JSON.stringify({
      type: 'simulator_debrief',
      userId: session.user.id,
      sessionId: body.sessionId,
      debrief,
    }),
  }).catch(console.error); // Non bloquant

  return NextResponse.json({ success: true, debrief });
}
