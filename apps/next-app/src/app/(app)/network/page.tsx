import { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { getNetworkTree, getNetworkStats } from '@/lib/affiliate';
import NetworkTree from '@/components/network/NetworkTree';
import ReferralLinkCard from '@/components/network/ReferralLinkCard';

export const metadata: Metadata = { title: 'Mon Réseau' };

export default async function NetworkPage() {
  const session = await auth();
  const [tree, stats] = await Promise.all([
    getNetworkTree(session!.user.id, session!.user.mlmLevel),
    getNetworkStats(session!.user.id),
  ]);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.atline.online';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1e3c5c]">Mon Réseau</h1>
          <p className="text-gray-500 text-sm mt-1">
            {stats.totalCount} filleuls · {stats.activeCount} actifs · Niveau {session!.user.mlmLevel} débloqué
          </p>
        </div>
        {/* Légende */}
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-emerald-500 inline-block" /> Actif
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-gray-400 inline-block" /> Inactif
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-[#f4b342] inline-block" /> Nouveau &lt;30j
          </span>
        </div>
      </div>

      {/* Lien de parrainage (si le user a un code) */}
      {session!.user.referralCode && (
        <ReferralLinkCard
          referralCode={session!.user.referralCode}
          appUrl={appUrl}
        />
      )}

      <NetworkTree data={tree} />
    </div>
  );
}
