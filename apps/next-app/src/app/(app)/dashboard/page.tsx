import { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { getCommissionsSummary, getNetworkStats } from '@/lib/affiliate';
import { getSimulatorQuota } from '@/lib/quota';
import StatsCard from '@/components/dashboard/StatsCard';
import CommissionsChart from '@/components/dashboard/CommissionsChart';
import MlmTierCard from '@/components/dashboard/MlmTierCard';
import RecentActivity from '@/components/dashboard/RecentActivity';

export const metadata: Metadata = { title: 'Dashboard' };

export default async function DashboardPage() {
  const session = await auth();
  const [stats, commissions, quota] = await Promise.all([
    getNetworkStats(session!.user.id),
    getCommissionsSummary(session!.user.id),
    session!.user.hasCoach ? getSimulatorQuota(session!.user.id) : null,
  ]);

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-bold text-[#1e3c5c]">
          Bonjour, {session!.user.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">Voici l'état de ton réseau ce mois-ci</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          label="Commissions du mois"
          value={`${commissions.thisMonth.toFixed(2)} €`}
          trend={commissions.trend}
          icon="💰"
        />
        <StatsCard
          label="Filleuls actifs"
          value={stats.activeCount}
          sub={`/${stats.totalCount} total`}
          icon="👥"
        />
        <StatsCard
          label="Niveau MLM"
          value={`Niveau ${session!.user.mlmLevel}`}
          sub={`${session!.user.directCount} directs actifs`}
          icon="📊"
        />
        {quota && (
          <StatsCard
            label="Quota simulateur"
            value={`${Math.floor(quota.remaining / 60)}min restantes`}
            sub={`/${Math.floor(quota.monthly / 60)}min par mois`}
            icon="🎙️"
          />
        )}
      </div>

      {/* Niveau MLM + Graphique */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <MlmTierCard
          currentLevel={session!.user.mlmLevel}
          directCount={session!.user.directCount}
        />
        <div className="lg:col-span-2">
          <CommissionsChart userId={session!.user.id} />
        </div>
      </div>

      {/* Activité récente */}
      <RecentActivity userId={session!.user.id} />
    </div>
  );
}
