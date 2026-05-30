import { streamText, tool } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { z } from 'zod';

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const N8N_BASE = process.env.N8N_WEBHOOK_BASE ?? 'https://n8n.atline.online/webhook';

const SYSTEM_PROMPT = `Tu es MailPost, un assistant IA qui gère la boîte mail Gmail de l'utilisateur.
Tu peux envoyer des emails, consulter la boîte de réception, scanner les newsletters et vider la corbeille.
Réponds toujours en français, de façon concise et professionnelle.
Quand tu effectues une action, confirme-la avec les détails essentiels.
Ne répète jamais le contenu brut des outils — synthétise et présente de façon lisible.`;

async function callN8N(path: string, body: Record<string, unknown> = {}) {
  const res = await fetch(`${N8N_BASE}/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`n8n error ${res.status} on ${path}`);
  return res.json();
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { messages } = await req.json();

  const result = streamText({
    model: anthropic('claude-sonnet-4-5'),
    system: SYSTEM_PROMPT,
    messages,
    maxSteps: 10,
    tools: {
      send_email: tool({
        description: "Envoie un email via Gmail au nom de l'utilisateur.",
        parameters: z.object({
          to: z.string().describe('Adresse email du destinataire'),
          subject: z.string().describe("Sujet de l'email"),
          body: z.string().describe('Corps du mail (texte brut)'),
          from_name: z.string().optional().describe('Nom affiché expéditeur (défaut: MailPost)'),
        }),
        execute: async ({ to, subject, body, from_name }) =>
          callN8N('mailpost/send-email', { to, subject, body, from_name }),
      }),

      get_inbox: tool({
        description: 'Récupère les emails non lus de la boîte de réception (50 max).',
        parameters: z.object({}),
        execute: async () => callN8N('mailpost/get-inbox'),
      }),

      scan_newsletters: tool({
        description: 'Scanne la boîte mail pour identifier les newsletters des 30 derniers jours.',
        parameters: z.object({}),
        execute: async () => callN8N('mailpost/scan-newsletters'),
      }),

      empty_trash: tool({
        description: "Vide la corbeille Gmail de l'utilisateur.",
        parameters: z.object({}),
        execute: async () => callN8N('mailpost/empty-trash'),
      }),
    },
  });

  return result.toDataStreamResponse();
}
