import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const N8N_BASE = process.env.N8N_WEBHOOK_BASE ?? 'https://n8n.atline.online/webhook';

const SYSTEM_PROMPT = `Tu es MailPost, un assistant IA qui gère la boîte mail Gmail de l'utilisateur.
Tu peux envoyer des emails, consulter la boîte de réception, scanner les newsletters et vider la corbeille.
Réponds toujours en français, de façon concise et professionnelle.
Quand tu effectues une action, confirme-la avec les détails essentiels.
Ne répète jamais le contenu brut des outils — synthétise et présente de façon lisible.`;

const TOOLS: Anthropic.Tool[] = [
  {
    name: 'send_email',
    description: 'Envoie un email via Gmail au nom de l\'utilisateur.',
    input_schema: {
      type: 'object' as const,
      properties: {
        to: { type: 'string', description: 'Adresse email du destinataire' },
        subject: { type: 'string', description: 'Sujet de l\'email' },
        body: { type: 'string', description: 'Corps de l\'email (texte brut)' },
        from_name: { type: 'string', description: 'Nom affiché de l\'expéditeur (optionnel, défaut: MailPost)' },
      },
      required: ['to', 'subject', 'body'],
    },
  },
  {
    name: 'get_inbox',
    description: 'Récupère les emails non lus de la boîte de réception (50 max).',
    input_schema: {
      type: 'object' as const,
      properties: {},
    },
  },
  {
    name: 'scan_newsletters',
    description: 'Scanne la boîte mail pour identifier les newsletters et abonnements des 30 derniers jours.',
    input_schema: {
      type: 'object' as const,
      properties: {},
    },
  },
  {
    name: 'empty_trash',
    description: 'Vide la corbeille Gmail de l\'utilisateur.',
    input_schema: {
      type: 'object' as const,
      properties: {},
    },
  },
];

async function callN8N(path: string, body: Record<string, unknown> = {}) {
  const res = await fetch(`${N8N_BASE}/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`n8n error ${res.status} on ${path}`);
  return res.json();
}

async function executeTool(name: string, input: Record<string, unknown>) {
  switch (name) {
    case 'send_email':
      return callN8N('mailpost/send-email', input);
    case 'get_inbox':
      return callN8N('mailpost/get-inbox');
    case 'scan_newsletters':
      return callN8N('mailpost/scan-newsletters');
    case 'empty_trash':
      return callN8N('mailpost/empty-trash');
    default:
      return { error: `Tool "${name}" not found` };
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { message, history = [] } = await req.json() as {
    message: string;
    history?: Anthropic.MessageParam[];
  };

  const messages: Anthropic.MessageParam[] = [
    ...history,
    { role: 'user', content: message },
  ];

  let response = await anthropic.messages.create({
    model: 'claude-3-7-sonnet-20250219',
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    tools: TOOLS,
    messages,
  });

  // Boucle agentique — gestion tool_use
  while (response.stop_reason === 'tool_use') {
    const toolUseBlocks = response.content.filter(
      (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use'
    );

    const toolResults: Anthropic.ToolResultBlockParam[] = await Promise.all(
      toolUseBlocks.map(async (block) => {
        let result: unknown;
        try {
          result = await executeTool(block.name, block.input as Record<string, unknown>);
        } catch (err) {
          result = { error: String(err) };
        }
        return {
          type: 'tool_result' as const,
          tool_use_id: block.id,
          content: JSON.stringify(result),
        };
      })
    );

    messages.push({ role: 'assistant', content: response.content });
    messages.push({ role: 'user', content: toolResults });

    response = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      tools: TOOLS,
      messages,
    });
  }

  const textBlock = response.content.find((b): b is Anthropic.TextBlock => b.type === 'text');
  const text = textBlock?.text ?? '';

  return NextResponse.json({
    response: text,
    history: [...messages, { role: 'assistant', content: response.content }],
  });
}
