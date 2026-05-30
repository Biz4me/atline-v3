import { Metadata } from 'next';
import RegisterForm from '@/components/auth/RegisterForm';

export const metadata: Metadata = { title: 'Créer un compte — Atline' };

export default function RegisterPage() {
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
          <p className="text-white/60 mt-2 text-sm">Créer votre compte</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          <h1 className="text-xl font-bold text-[#1e3c5c] mb-6">
            Créer mon compte
          </h1>
          <RegisterForm />
        </div>
      </div>
    </main>
  );
}
