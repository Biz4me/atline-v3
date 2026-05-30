import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { addQuota } from '@/lib/quota';

// Lazy init — ne plante pas au build si les vars Stripe ne sont pas définies
function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

export async function POST(req: NextRequest) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  // Mapping price_id → action Payload (résolu à runtime)
  const PRICE_ACTIONS: Record<string, { field: string; value: unknown }> = {
    [process.env.STRIPE_PRICE_LICENCE_YEARLY ?? '']: { field: 'hasLicence', value: true },
    [process.env.STRIPE_PRICE_COACH_MONTHLY ?? '']: { field: 'hasCoach', value: true },
  };
  const EXTRA_HOUR_PRICE = process.env.STRIPE_PRICE_EXTRA_HOUR ?? '';

  const body = await req.text();
  const sig = req.headers.get('stripe-signature')!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed':
    case 'invoice.payment_succeeded': {
      const session = event.data.object as Stripe.Checkout.Session | Stripe.Invoice;
      const userId = session.metadata?.userId;
      const priceId = getPriceId(event);

      if (!userId || !priceId) break;

      if (EXTRA_HOUR_PRICE && priceId === EXTRA_HOUR_PRICE) {
        // Achat heure supplémentaire → +3600s dans Redis
        await addQuota(userId, 3600);
      } else if (PRICE_ACTIONS[priceId]) {
        // Activer licence ou coach dans Payload
        const { field, value } = PRICE_ACTIONS[priceId];
        await updateUserInPayload(userId, { [field]: value });
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      const userId = sub.metadata?.userId;
      const priceId = sub.items.data[0]?.price.id;

      if (!userId) break;

      if (priceId === process.env.STRIPE_PRICE_COACH_MONTHLY) {
        await updateUserInPayload(userId, { hasCoach: false });
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}

function getPriceId(event: Stripe.Event): string | null {
  const obj = event.data.object as unknown as Record<string, unknown>;
  if ('line_items' in obj) return null;
  if ('lines' in obj) {
    const invoice = event.data.object as unknown as Stripe.Invoice;
    return invoice.lines?.data[0]?.price?.id ?? null;
  }
  return null;
}

async function updateUserInPayload(userId: string, fields: Record<string, unknown>) {
  await fetch(`${process.env.PAYLOAD_API_URL}/users/${userId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.PAYLOAD_API_KEY}`,
    },
    body: JSON.stringify(fields),
  });
}
