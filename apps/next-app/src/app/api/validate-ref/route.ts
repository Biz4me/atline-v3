import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code')?.trim();

  if (!code || code.length < 3) {
    return NextResponse.json({ valid: false }, { status: 200 });
  }

  const payloadUrl = process.env.PAYLOAD_API_URL;
  const payloadKey = process.env.PAYLOAD_API_KEY;
  if (!payloadUrl || !payloadKey) {
    return NextResponse.json({ valid: false }, { status: 200 });
  }

  try {
    const res = await fetch(
      `${payloadUrl}/users?where[referralCode][equals]=${encodeURIComponent(code)}&limit=1`,
      {
        headers: { Authorization: `users API-Key ${payloadKey}` },
        next: { revalidate: 0 },
      }
    );
    if (!res.ok) return NextResponse.json({ valid: false });
    const data = await res.json();
    const user = data?.docs?.[0];
    if (!user) return NextResponse.json({ valid: false });
    return NextResponse.json({ valid: true, name: user.name as string });
  } catch {
    return NextResponse.json({ valid: false });
  }
}
