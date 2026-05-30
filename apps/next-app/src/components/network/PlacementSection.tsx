'use client';

import { useState, useEffect } from 'react';
import { Users, Clock, ChevronRight, Check, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { PlaceableUser, PlacementTarget } from '@/lib/placement';

interface Props {
  placeables: PlaceableUser[];
  targets: PlacementTarget[];
}

// ── Countdown live ────────────────────────────────────────────────────────────
function Countdown({ deadline }: { deadline: string }) {
  const [label, setLabel] = useState('');

  useEffect(() => {
    function compute() {
      const diff = new Date(deadline).getTime() - Date.now();
      if (diff <= 0) { setLabel('Expiré'); return; }
      const d = Math.floor(diff / 86_400_000);
      const h = Math.floor((diff % 86_400_000) / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1_000);
      setLabel(d > 0 ? `${d}j ${h}h restants` : `${h}h ${m}m ${s}s restants`);
    }
    compute();
    const id = setInterval(compute, 1_000);
    return () => clearInterval(id);
  }, [deadline]);

  return <span>{label}</span>;
}

// ── Role badge ────────────────────────────────────────────────────────────────
function RoleBadge({ role }: { role: PlaceableUser['role'] }) {
  return (
    <span
      className={`inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
        role === 'distributor'
          ? 'bg-[#1e3c5c]/10 text-[#1e3c5c]'
          : 'bg-gray-200 text-gray-600'
      }`}
    >
      {role === 'distributor' ? 'Distributeur' : 'Client'}
    </span>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function PlacementSection({ placeables, targets }: Props) {
  const router = useRouter();

  // Pré-sélectionner l'effectiveDistributor actuel si c'est l'une des cibles
  const [selections, setSelections] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      placeables
        .filter(
          (u) =>
            u.effectiveDistributorId &&
            targets.some((t) => t.id === u.effectiveDistributorId)
        )
        .map((u) => [u.id, u.effectiveDistributorId as string])
    )
  );
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [placed, setPlaced] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Pas de filleuls dans la fenêtre OU pas de cibles → rien à afficher
  if (placeables.length === 0 || targets.length === 0) return null;

  async function handlePlace(userId: string) {
    const targetId = selections[userId];
    if (!targetId) return;

    setLoading((p) => ({ ...p, [userId]: true }));
    setErrors((p) => ({ ...p, [userId]: '' }));

    try {
      const res = await fetch('/api/place', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, targetId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrors((p) => ({ ...p, [userId]: data.error ?? 'Erreur inconnue' }));
      } else {
        setPlaced((p) => ({ ...p, [userId]: true }));
        // Rafraîchit les Server Components après 1,5 s
        setTimeout(() => router.refresh(), 1_500);
      }
    } catch {
      setErrors((p) => ({ ...p, [userId]: 'Erreur réseau — réessayez.' }));
    } finally {
      setLoading((p) => ({ ...p, [userId]: false }));
    }
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-amber-100">
      {/* En-tête */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center">
          <Users className="text-[#f4b342]" size={18} />
        </div>
        <div>
          <h3 className="font-semibold text-[#1e3c5c] text-sm">
            Fenêtre de placement
          </h3>
          <p className="text-xs text-gray-400">
            Placez vos nouveaux filleuls sous un distributeur de votre réseau — irréversible après 30 j
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {placeables.map((user) => (
          <div
            key={user.id}
            className="border border-gray-100 rounded-xl p-4 bg-gray-50/60"
          >
            {/* Infos utilisateur */}
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-medium text-sm text-[#1e3c5c]">{user.name}</p>
                <p className="text-xs text-gray-400">{user.email}</p>
                <RoleBadge role={user.role} />
              </div>
              <div className="text-right shrink-0 ml-3">
                <div className="flex items-center gap-1 text-[10px] text-amber-600 font-medium justify-end">
                  <Clock size={11} />
                  <Countdown deadline={user.placementDeadline} />
                </div>
                {user.effectiveDistributorName && (
                  <p className="text-[10px] text-gray-400 mt-1">
                    Actuellement chez{' '}
                    <span className="font-medium">{user.effectiveDistributorName}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Sélecteur + bouton */}
            {placed[user.id] ? (
              <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium">
                <Check size={15} /> Placement effectué !
              </div>
            ) : (
              <div className="flex gap-2">
                <select
                  value={selections[user.id] ?? ''}
                  onChange={(e) =>
                    setSelections((p) => ({ ...p, [user.id]: e.target.value }))
                  }
                  className="flex-1 text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1e3c5c]/20"
                >
                  <option value="">— Choisir un distributeur —</option>
                  {targets
                    .filter((t) => t.id !== user.id)
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} · {t.directCount} filleul
                        {t.directCount !== 1 ? 's' : ''}
                      </option>
                    ))}
                </select>
                <button
                  onClick={() => handlePlace(user.id)}
                  disabled={!selections[user.id] || loading[user.id]}
                  className="flex items-center gap-1.5 bg-[#1e3c5c] text-white rounded-lg px-4 py-2 text-xs font-semibold hover:bg-[#2b5580] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {loading[user.id] ? (
                    <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <ChevronRight size={13} />
                  )}
                  Placer
                </button>
              </div>
            )}

            {errors[user.id] && (
              <div className="flex items-center gap-1.5 mt-2 text-red-500 text-xs">
                <AlertCircle size={12} /> {errors[user.id]}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
