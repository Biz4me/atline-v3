// Server Component — affiche les dernières activités du réseau
interface RecentActivityProps {
  userId: string;
}

// TODO: fetch réel depuis Affiliate API
const mockActivity = [
  { id: '1', type: 'new_affiliate', name: 'Marie D.', time: 'Il y a 2h', icon: '👤' },
  { id: '2', type: 'commission',    name: '+12,50 € — SMM Pro (niveau 2)', time: 'Il y a 5h', icon: '💰' },
  { id: '3', type: 'new_affiliate', name: 'Pierre M.', time: 'Hier', icon: '👤' },
  { id: '4', type: 'commission',    name: '+8,00 € — Coach MLM (niveau 1)', time: 'Hier', icon: '💰' },
  { id: '5', type: 'inactive',      name: 'Jean L. — abonnement expiré', time: 'Il y a 3j', icon: '⚠️' },
];

export default function RecentActivity({ userId: _ }: RecentActivityProps) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
      <h3 className="font-bold text-[#1e3c5c] mb-4">Activité récente</h3>
      <div className="space-y-3">
        {mockActivity.map((item) => (
          <div key={item.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
            <span className="text-lg">{item.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-700 truncate">{item.name}</p>
              <p className="text-xs text-gray-400">{item.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
