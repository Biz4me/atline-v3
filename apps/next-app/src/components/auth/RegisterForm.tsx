'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react';

interface Props {
  referralCode: string;
  sponsorName?: string;
}

export default function RegisterForm({ referralCode, sponsorName }: Props) {
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    // 1. Créer le compte
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, referralCode }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? 'Une erreur est survenue.');
      setLoading(false);
      return;
    }

    setSuccess(true);

    // 2. Connecter automatiquement
    const signInRes = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (signInRes?.ok) {
      router.push('/dashboard');
    } else {
      // Compte créé mais connexion auto échouée → renvoyer vers login
      router.push('/login?registered=1');
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center gap-4 py-6">
        <CheckCircle2 className="text-green-500" size={48} />
        <p className="text-[#1e3c5c] font-semibold text-lg">Compte créé !</p>
        <p className="text-gray-500 text-sm text-center">
          Connexion en cours…
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Badge parrain */}
      <div className="bg-[#f4b342]/10 border border-[#f4b342]/30 rounded-xl px-4 py-3 text-sm text-[#1e3c5c]">
        <span className="font-medium">Code parrain&nbsp;:</span>{' '}
        <span className="font-mono font-bold text-[#f4b342]">{referralCode}</span>
        {sponsorName && (
          <span className="text-gray-500 ml-1">— invité par {sponsorName}</span>
        )}
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-200">
          {error}
        </div>
      )}

      {/* Nom */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Nom complet
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoComplete="name"
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#f4b342] focus:border-transparent transition-all"
          placeholder="Jean Dupont"
        />
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#f4b342] focus:border-transparent transition-all"
          placeholder="vous@exemple.com"
        />
      </div>

      {/* Mot de passe */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Mot de passe
        </label>
        <div className="relative">
          <input
            type={showPwd ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-[#f4b342] focus:border-transparent transition-all"
            placeholder="8 caractères minimum"
          />
          <button
            type="button"
            onClick={() => setShowPwd(!showPwd)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#1e3c5c] text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-[#2b5580] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 size={16} className="animate-spin" /> Création du compte…
          </>
        ) : (
          'Créer mon compte'
        )}
      </button>

      <p className="text-center text-xs text-gray-400">
        Déjà un compte ?{' '}
        <a href="/login" className="text-[#1e3c5c] hover:underline font-medium">
          Se connecter
        </a>
      </p>
    </form>
  );
}
