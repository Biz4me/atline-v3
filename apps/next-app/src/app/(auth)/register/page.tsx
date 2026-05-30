import { Metadata } from 'next';
import { cookies } from 'next/headers';
import RegisterForm from '@/components/auth/RegisterForm';

export const metadata: Metadata = { title: 'Créer un compte' };

const COOKIE_NAME = 'atline_ref';

interface Props {
  searchParams: Promise<{ ref?: string }>;
}

// Vérifie que le code parrain existe et récupère le nom du parrain
async function getSponsor(
  referralCode: string
): Promise<{ name: string; valid: boolean } | null> {
  const payloadUrl = process.env.PAYLOAD_API_URL;
  if (!payloadUrl) return null;

  try {
    const res = await fetch(
      `${payloadUrl}/users?where[referralCode][equals]=${encodeURIComponent(referralCode)}&limit=1`,
      {
        headers: { Authorization: `users API-Key ${process.env.PAYLOAD_API_KEY}` },
        next: { revalidate: 0 },
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const sponsor = data?.docs?.[0];
    if (!sponsor) return null;
    return { name: sponsor.name as string, valid: true };
  } catch {
    return null;
  }
}

export default async function RegisterPage({ searchParams }: Props) {
  const { ref: refParam } = await searchParams;

  // Priorité : ?ref= dans l'URL, sinon cookie first-click
  const cookieStore = await cookies();
  const refFromCookie = cookieStore.get(COOKIE_NAME)?.value;
  const ref = refParam ?? refFromCookie;

  // Aucun code parrain (ni URL ni cookie) → page d'erreur
  if (!ref) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1e3c5c] to-[#0f2c44] p-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-white rounded-2xl p-8 shadow-2xl">
            <div className="text-4xl mb-4">🔒</div>
            <h1 className="text-xl font-bold text-[#1e3c5c] mb-3">
              Lien d&apos;invitation requis
            </h1>
            <p className="text-gray-500 text-sm leading-relaxed">
              L&apos;accès à Atline est sur invitation uniquement. Demandez un
              lien de parrainage à votre distributeur.
            </p>
          </div>
        </div>
      </main>
    );
  }

  // Valider le code côté serveur
  const sponsor = await getSponsor(ref);

  if (!sponsor?.valid) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1e3c5c] to-[#0f2c44] p-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-white rounded-2xl p-8 shadow-2xl">
            <div className="text-4xl mb-4">❌</div>
            <h1 className="text-xl font-bold text-[#1e3c5c] mb-3">
              Lien d&apos;invitation invalide
            </h1>
            <p className="text-gray-500 text-sm leading-relaxed">
              Ce lien d&apos;invitation est introuvable ou a expiré. Contactez
              votre parrain pour obtenir un nouveau lien.
            </p>
          </div>
        </div>
      </main>
    );
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
          <p className="text-white/60 mt-2 text-sm">Rejoignez la plateforme</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          <h1 className="text-xl font-bold text-[#1e3c5c] mb-6">
            Créer mon compte
          </h1>
          <RegisterForm referralCode={ref} sponsorName={sponsor.name} />
        </div>
      </div>
    </main>
  );
}
