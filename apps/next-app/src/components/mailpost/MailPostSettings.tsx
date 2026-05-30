'use client';

import { useState } from 'react';
import { Settings, Clock, Bell, Save } from 'lucide-react';

export default function MailPostSettings() {
  const [summaryTime, setSummaryTime] = useState('08:00');
  const [summaryEnabled, setSummaryEnabled] = useState(true);
  const [saved, setSaved] = useState(false);

  const save = () => {
    // TODO: persist to Payload CMS / user prefs
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <Settings size={20} className="text-[#1e3c5c]" />
        <h2 className="font-semibold text-[#1e2f3e]">Paramètres MailPost</h2>
      </div>

      {/* Résumé quotidien */}
      <div className="border border-gray-100 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Bell size={16} className="text-[#1e3c5c]" />
            <span className="text-sm font-medium text-gray-800">Résumé quotidien</span>
          </div>
          <button
            onClick={() => setSummaryEnabled(!summaryEnabled)}
            className={`w-11 h-6 rounded-full transition-colors relative ${
              summaryEnabled ? 'bg-[#1e3c5c]' : 'bg-gray-200'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                summaryEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
        <p className="text-xs text-gray-500 mb-3">
          Reçois chaque matin un résumé IA de tes emails classés par thématiques.
        </p>
        {summaryEnabled && (
          <div className="flex items-center gap-3">
            <Clock size={15} className="text-gray-400" />
            <label className="text-xs text-gray-600">Heure d&apos;envoi :</label>
            <input
              type="time"
              value={summaryTime}
              onChange={(e) => setSummaryTime(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[#1e3c5c]/30"
            />
          </div>
        )}
      </div>

      {/* Compte email connecté */}
      <div className="border border-gray-100 rounded-xl p-4">
        <p className="text-sm font-medium text-gray-800 mb-1">Compte Gmail connecté</p>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400" />
          <span className="text-sm text-gray-600">atline.ai@gmail.com</span>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Scopes : gmail.modify · contacts.readonly · drive.file
        </p>
      </div>

      <button
        onClick={save}
        className="flex items-center gap-2 px-5 py-2.5 bg-[#1e3c5c] text-white text-sm font-medium rounded-xl hover:bg-[#2a5278] transition-colors"
      >
        <Save size={15} />
        {saved ? 'Enregistré ✓' : 'Enregistrer'}
      </button>
    </div>
  );
}
