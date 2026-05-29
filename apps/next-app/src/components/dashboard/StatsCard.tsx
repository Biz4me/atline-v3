import { clsx } from 'clsx';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatsCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: string;
  trend?: 'up' | 'down' | 'stable';
}

export default function StatsCard({ label, value, sub, icon, trend }: StatsCardProps) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-2xl">{icon}</span>
        {trend && (
          <span className={clsx(
            'flex items-center gap-0.5 text-xs font-semibold',
            trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-red-500' : 'text-gray-400'
          )}>
            {trend === 'up' ? <TrendingUp size={12} /> : trend === 'down' ? <TrendingDown size={12} /> : <Minus size={12} />}
          </span>
        )}
      </div>
      <p className="text-xl font-bold text-[#1e3c5c]">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      <p className="text-xs text-gray-500 mt-2">{label}</p>
    </div>
  );
}
