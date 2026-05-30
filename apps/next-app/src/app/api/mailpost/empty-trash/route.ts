import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

const N8N_BASE = process.env.N8N_WEBHOOK_BASE ?? 'https://n8n.atline.online/webhook';

export async function POST() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const res = await fetch(`${N8N_BASE}/mailpost/empty-trash`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  });

  const data = await res.json();
  return NextResponse.json(data);
}
