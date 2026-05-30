import { Metadata } from 'next';
import LoginForm from '@/components/auth/LoginForm';

export const metadata: Metadata = { title: 'Connexion — Atline' };

interface Props {
  searchParams: Promise<{ registered?: string }>;
}

export default async function LoginPage({ searchParams }: Props) {
  const { registered } = await searchParams;

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

        {/* Card de connexion */}
        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          {registered === '1' && (
            <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded-xl border border-green-200 mb-6">
              ✅ Compte créé avec succès ! Connectez-vous pour accéder à votre espace.
            </div>
          )}
          <h1 className="text-xl font-bold text-[#1e3c5c] mb-6">Connexion</h1>
          <LoginForm />

          {/* Liens bas de page */}
          <div className="mt-6 pt-5 border-t border-gray-100 space-y-2 text-center">
            <p className="text-sm text-gray-500">
              Pas encore de compte ?{' '}
              <a href="/register" className="text-[#f4b342] font-semibold hover:underline">
                S&apos;enregistrer
              </a>
            </p>
            <p className="text-xs text-gray-400">
              Vous souhaitez rejoindre notre réseau ?{' '}
              <a href="/devenir-distributeur" className="text-[#1e3c5c] font-medium hover:underline">
                Devenir distributeur →
              </a>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
