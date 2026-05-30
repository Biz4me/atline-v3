'use client';

import { useState } from 'react';
import { Copy, Check, Share2 } from 'lucide-react';

interface Props {
  inviteToken: string;
  appUrl: string;
}

export default function ReferralLinkCard({ inviteToken, appUrl }: Props) {
  const link = `${appUrl}/invite/${inviteToken}`;
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function shareLink() {
    if (navigator.share) {
      await navigator.share({
        title: 'Rejoins Atline',
        text: 'Je t\'invite à rejoindre Atline, la plateforme de coaching MLM.',
        url: link,
      });
    } else {
      copyLink();
    }
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 bg-[#f4b342]/10 rounded-xl flex items-center justify-center">
          <Share2 className="text-[#f4b342]" size={18} />
        </div>
        <div>
          <h3 className="font-semibold text-[#1e3c5c] text-sm">Mon lien d&apos;invitation</h3>
          <p className="text-xs text-gray-400">Partagez ce lien pour inviter de nouveaux filleuls</p>
        </div>
      </div>

      {/* URL */}
      <div className="bg-gray-50 rounded-xl px-4 py-3 flex items-center justify-between gap-3 border border-gray-100 mb-4">
        <span className="text-xs text-gray-600 truncate flex-1 font-mono">{link}</span>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={copyLink}
          className="flex-1 flex items-center justify-center gap-2 bg-[#1e3c5c] text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-[#2b5580] transition-colors"
        >
          {copied ? (
            <><Check size={15} /> Copié !</>
          ) : (
            <><Copy size={15} /> Copier le lien</>
          )}
        </button>
        <button
          onClick={shareLink}
          className="flex items-center justify-center gap-2 border border-gray-200 text-gray-600 rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors"
          title="Partager"
        >
          <Share2 size={15} />
        </button>
      </div>
    </div>
  );
}
