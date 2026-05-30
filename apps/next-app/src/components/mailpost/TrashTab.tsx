'use client';

import { useState } from 'react';
import { Trash2, Loader2, CheckCircle2 } from 'lucide-react';

export default function TrashTab() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');

  const emptyTrash = async () => {
    if (!confirm('Vider définitivement la corbeille Gmail ?')) return;
    setStatus('loading');
    try {
      const res = await fetch('/api/mailpost/empty-trash', { method: 'POST' });
      if (res.ok) setStatus('done');
      else setStatus('error');
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-6">
        <Trash2 size={20} className="text-[#1e3c5c]" />
        <h2 className="font-semibold text-[#1e2f3e]">Corbeille Gmail</h2>
      </div>

      <div className="text-center py-12">
        {status === 'done' ? (
          <div className="flex flex-col items-center gap-3">
            <CheckCircle2 size={48} className="text-green-500" />
            <p className="text-sm font-medium text-gray-700">Corbeille vidée avec succès</p>
            <button
              onClick={() => setStatus('idle')}
              className="text-xs text-gray-400 hover:text-gray-600 underline"
            >
              Réinitialiser
            </button>
          </div>
        ) : (
          <>
            <Trash2 size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-sm text-gray-500 mb-6">
              Supprimer définitivement tous les emails dans la corbeille Gmail.
              <br />
              <span className="text-red-400 font-medium">Cette action est irréversible.</span>
            </p>
            <button
              onClick={emptyTrash}
              disabled={status === 'loading'}
              className="flex items-center gap-2 px-6 py-2.5 bg-red-500 text-white text-sm font-medium rounded-xl hover:bg-red-600 disabled:opacity-50 transition-colors mx-auto"
            >
              {status === 'loading' ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Trash2 size={15} />
              )}
              Vider la corbeille
            </button>
            {status === 'error' && (
              <p className="text-xs text-red-500 mt-3">Une erreur est survenue. Réessayez.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
