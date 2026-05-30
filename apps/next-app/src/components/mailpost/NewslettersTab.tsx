'use client';

import { useState } from 'react';
import { Loader2, Newspaper, Trash2, RefreshCw } from 'lucide-react';

interface Newsletter {
  id: string;
  from: string;
  subject: string;
  date: string;
}

interface ScanResult {
  count: number;
  newsletters: Newsletter[];
}

export default function NewslettersTab() {
  const [data, setData] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(false);

  const scan = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/mailpost/newsletters', { method: 'POST' });
      const json = await res.json() as ScanResult;
      setData(json);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Newspaper size={20} className="text-[#1e3c5c]" />
          <h2 className="font-semibold text-[#1e2f3e]">Newsletters & abonnements</h2>
          {data && (
            <span className="text-xs bg-[#1e3c5c]/10 text-[#1e3c5c] px-2 py-0.5 rounded-full font-medium">
              {data.count} détectés
            </span>
          )}
        </div>
        <button
          onClick={scan}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-[#1e3c5c] text-white text-sm font-medium rounded-xl hover:bg-[#2a5278] disabled:opacity-50 transition-colors"
        >
          {loading ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
          Scanner
        </button>
      </div>

      {!data && !loading && (
        <div className="text-center py-12 text-gray-400">
          <Newspaper size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Cliquez sur Scanner pour détecter vos newsletters</p>
        </div>
      )}

      {loading && (
        <div className="text-center py-12 text-gray-400">
          <Loader2 size={32} className="animate-spin mx-auto mb-3" />
          <p className="text-sm">Analyse de votre boîte mail…</p>
        </div>
      )}

      {data && !loading && (
        <div className="space-y-2">
          {data.newsletters.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">Aucune newsletter détectée.</p>
          ) : (
            data.newsletters.map((nl) => (
              <div
                key={nl.id}
                className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-800 truncate">{nl.from}</p>
                  <p className="text-xs text-gray-500 truncate">{nl.subject}</p>
                </div>
                <div className="flex items-center gap-2 ml-3">
                  <span className="text-xs text-gray-400">{new Date(nl.date).toLocaleDateString('fr-FR')}</span>
                  <button
                    className="p-1.5 rounded-lg hover:bg-red-50 hover:text-red-500 text-gray-400 transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
