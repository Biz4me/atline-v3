import { Metadata } from 'next';
import { cookies } from 'next/headers';
import DistributorForm from '@/components/auth/DistributorForm';

export const metadata: Metadata = { title: 'Devenir distributeur — Atline' };

const COOKIE_NAME = 'atline_ref';

async function getSponsorName(referralCode: string): Promise<string | null> {
  const payloadUrl = process.env.PAYLOAD_API_URL;
  const payloadKey = process.env.PAYLOAD_API_KEY;
  if (!payloadUrl || !payloadKey) return null;

  try {
    const res = await fetch(
      `${payloadUrl}/users?where[referralCode][equals]=${encodeURIComponent(referralCode)}&limit=1`,
      {
        headers: { Authorization: `users API-Key ${payloadKey}` },
        next: { revalidate: 0 },
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const user = data?.docs?.[0];
    return user?.name ?? null;
  } catch {
    return null;
  }
}

export default async function DevenirDistributeurPage() {
  const cookieStore = await cookies();
  const lockedRef = cookieStore.get(COOKIE_NAME)?.value ?? null;

  let sponsorName: string | null = null;
  if (lockedRef) {
    sponsorName = await getSponsorName(lockedRef);
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1e3c5c] to-[#0f2c44] p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3">
            <div className="w-10 h-10 bg-[#f4b342] rounded-xl flex items-center justify-center">
              <span className="text-[#1e2f3e] font-bold text-lg">A</span>
            </div>
            <span className="text-white text-2xl font-bold">Atline</span>
          </div>
          <p className="text-white/60 mt-2 text-sm">Espace distributeur</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          <h1 className="text-xl font-bold text-[#1e3c5c] mb-2">
            Devenir distributeur
          </h1>
          <p className="text-sm text-gray-400 mb-6">
            Rejoignez le réseau Atline et développez votre activité.
          </p>
          <DistributorForm lockedRef={lockedRef} sponsorName={sponsorName} />
        </div>
      </div>
    </main>
  );
}
