import { Metadata } from 'next';
import * as Tabs from '@radix-ui/react-tabs';
import { Mail, Newspaper, Trash2, Settings } from 'lucide-react';
import MailPostChat from '@/components/mailpost/MailPostChat';
import NewslettersTab from '@/components/mailpost/NewslettersTab';
import TrashTab from '@/components/mailpost/TrashTab';
import MailPostSettings from '@/components/mailpost/MailPostSettings';

export const metadata: Metadata = {
  title: 'MailPost – Atline',
};

export default function MailPostPage() {
  return (
    <div className="h-full flex flex-col gap-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1e2f3e]">MailPost</h1>
        <p className="text-sm text-gray-500 mt-0.5">Votre agent IA de gestion des emails</p>
      </div>

      <Tabs.Root defaultValue="chat" className="flex-1 flex flex-col min-h-0">
        <Tabs.List className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit mb-4">
          {[
            { value: 'chat', label: 'Chat', icon: <Mail size={15} /> },
            { value: 'newsletters', label: 'Newsletters', icon: <Newspaper size={15} /> },
            { value: 'trash', label: 'Corbeille', icon: <Trash2 size={15} /> },
            { value: 'settings', label: 'Paramètres', icon: <Settings size={15} /> },
          ].map((tab) => (
            <Tabs.Trigger
              key={tab.value}
              value={tab.value}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium text-gray-600
                data-[state=active]:bg-white data-[state=active]:text-[#1e3c5c] data-[state=active]:shadow-sm
                hover:text-gray-900 transition-all"
            >
              {tab.icon}
              {tab.label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        <Tabs.Content value="chat" className="flex-1 min-h-0">
          <div className="h-[calc(100vh-220px)]">
            <MailPostChat />
          </div>
        </Tabs.Content>

        <Tabs.Content value="newsletters" className="flex-1">
          <NewslettersTab />
        </Tabs.Content>

        <Tabs.Content value="trash" className="flex-1">
          <TrashTab />
        </Tabs.Content>

        <Tabs.Content value="settings" className="flex-1">
          <MailPostSettings />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}
