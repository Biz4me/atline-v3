'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

// Les données arrivent en props depuis le Server Component parent
interface CommissionsChartProps {
  userId: string; // utilisé pour le fetch côté client (SWR/React Query)
}

// Données mock — à remplacer par SWR hook sur /api/commissions/history
const mockData = [
  { month: 'Jan', amount: 120 },
  { month: 'Fév', amount: 180 },
  { month: 'Mar', amount: 95 },
  { month: 'Avr', amount: 240 },
  { month: 'Mai', amount: 310 },
  { month: 'Juin', amount: 275 },
];

export default function CommissionsChart({ userId: _ }: CommissionsChartProps) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm h-full">
      <h3 className="font-bold text-[#1e3c5c] mb-4">Commissions (6 derniers mois)</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={mockData} barSize={28}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} unit="€" />
          <Tooltip
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            formatter={(v: number) => [`${v.toFixed(2)} €`, 'Commissions']}
          />
          <Bar dataKey="amount" fill="#f4b342" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
