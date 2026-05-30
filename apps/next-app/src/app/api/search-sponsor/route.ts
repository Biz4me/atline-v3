import { NextResponse } from 'next/server';

// Normalise : minuscules + sans accents + tirets → espaces
function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/-/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get('name')?.trim();

  if (!name || name.length < 3) {
    return NextResponse.json({ found: false });
  }

  const payloadUrl = process.env.PAYLOAD_API_URL;
  const payloadKey = process.env.PAYLOAD_API_KEY;
  if (!payloadUrl || !payloadKey) {
    return NextResponse.json({ found: false });
  }

  try {
    // Recherche insensible à la casse via ILIKE (like Payload)
    const res = await fetch(
      `${payloadUrl}/users?where[role][equals]=distributor&where[name][like]=${encodeURIComponent(name)}&limit=20`,
      {
        headers: { Authorization: `users API-Key ${payloadKey}` },
        next: { revalidate: 0 },
      }
    );
    if (!res.ok) return NextResponse.json({ found: false });

    const data = await res.json();
    const docs: { name: string; referralCode?: string }[] = data?.docs ?? [];

    // Correspondance exacte après normalisation (accents, casse, tirets)
    const normalizedInput = normalize(name);
    const match = docs.find((u) => normalize(u.name) === normalizedInput);

    if (!match || !match.referralCode) {
      return NextResponse.json({ found: false });
    }

    return NextResponse.json({
      found: true,
      name: match.name,
      referralCode: match.referralCode,
    });
  } catch {
    return NextResponse.json({ found: false });
  }
}
