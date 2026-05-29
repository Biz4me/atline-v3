// Paliers Option B : nombre de directs actifs requis → niveau débloqué
const TIERS = [
  { level: 1, required: 1,   label: 'Niveau 1', rate: '10%' },
  { level: 2, required: 2,   label: 'Niveau 2', rate: '7%' },
  { level: 3, required: 5,   label: 'Niveau 3', rate: '5%' },
  { level: 4, required: 10,  label: 'Niveau 4', rate: '4%' },
  { level: 5, required: 20,  label: 'Niveau 5', rate: '3%' },
  { level: 6, required: 50,  label: 'Niveau 6', rate: '2%' },
  { level: 7, required: 100, label: 'Niveau 7', rate: '1%' },
];

interface MlmTierCardProps {
  currentLevel: number;
  directCount: number;
}

export default function MlmTierCard({ currentLevel, directCount }: MlmTierCardProps) {
  const nextTier = TIERS.find((t) => t.level === currentLevel + 1);
  const progress = nextTier
    ? Math.min((directCount / nextTier.required) * 100, 100)
    : 100;

  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
      <h3 className="font-bold text-[#1e3c5c] mb-4">Progression MLM</h3>

      <div className="space-y-2">
        {TIERS.map((tier) => (
          <div key={tier.level} className="flex items-center gap-3">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
              tier.level <= currentLevel
                ? 'bg-[#f4b342] text-[#1e2f3e]'
                : 'bg-gray-100 text-gray-400'
            }`}>
              {tier.level}
            </div>
            <div className="flex-1">
              <div className="flex justify-between text-xs">
                <span className={tier.level <= currentLevel ? 'text-gray-700 font-medium' : 'text-gray-400'}>
                  {tier.required} directs actifs
                </span>
                <span className={tier.level <= currentLevel ? 'text-[#f4b342] font-bold' : 'text-gray-300'}>
                  {tier.rate}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {nextTier && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex justify-between text-xs text-gray-500 mb-1.5">
            <span>Vers Niveau {nextTier.level}</span>
            <span>{directCount} / {nextTier.required} directs</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#f4b342] rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
