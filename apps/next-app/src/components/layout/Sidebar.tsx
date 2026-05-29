'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import {
  LayoutDashboard, Network, BadgeEuro, ShoppingBag,
  BookOpen, Mic, MessageSquare, Users, Calendar, Settings,
  Lock,
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  requiresCoach?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard',        label: 'Dashboard',    icon: <LayoutDashboard size={18} /> },
  { href: '/network',          label: 'Mon Réseau',   icon: <Network size={18} /> },
  { href: '/commissions',      label: 'Commissions',  icon: <BadgeEuro size={18} /> },
  { href: '/catalogue',        label: 'Catalogue',    icon: <ShoppingBag size={18} /> },
  { href: '/coach/formations', label: 'Formations',   icon: <BookOpen size={18} />,       requiresCoach: true },
  { href: '/coach/simulator',  label: 'Simulateur',   icon: <Mic size={18} />,             requiresCoach: true },
  { href: '/coach/chat',       label: 'Chat Coach',   icon: <MessageSquare size={18} />,   requiresCoach: true },
  { href: '/coach/crm',        label: 'CRM',          icon: <Users size={18} />,           requiresCoach: true },
  { href: '/coach/agenda',     label: 'Agenda',       icon: <Calendar size={18} />,        requiresCoach: true },
  { href: '/settings',         label: 'Paramètres',   icon: <Settings size={18} /> },
];

interface SidebarProps {
  user: { hasCoach: boolean; name?: string | null };
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-60 bg-[#1e3c5c] min-h-screen">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
        <div className="w-8 h-8 bg-[#f4b342] rounded-lg flex items-center justify-center">
          <span className="text-[#1e2f3e] font-bold text-sm">A</span>
        </div>
        <span className="text-white font-bold text-lg">Atline</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isLocked = item.requiresCoach && !user.hasCoach;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

          return (
            <Link
              key={item.href}
              href={isLocked ? '/dashboard?upgrade=coach' : item.href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                isActive
                  ? 'bg-[#f4b342] text-[#1e2f3e]'
                  : isLocked
                  ? 'text-white/30 cursor-not-allowed'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              )}
            >
              {item.icon}
              <span className="flex-1">{item.label}</span>
              {isLocked && <Lock size={12} className="opacity-50" />}
            </Link>
          );
        })}
      </nav>

      {/* Badge Coach */}
      {!user.hasCoach && (
        <div className="mx-3 mb-4 p-3 bg-[#f4b342]/10 border border-[#f4b342]/30 rounded-xl">
          <p className="text-[#f4b342] text-xs font-semibold mb-1">Atline Coach MLM</p>
          <p className="text-white/50 text-xs">Débloquez le simulateur vocal et les formations</p>
          <Link
            href="/settings?upgrade=coach"
            className="mt-2 block text-center text-xs bg-[#f4b342] text-[#1e2f3e] font-bold py-1.5 rounded-lg hover:bg-[#d4941e] transition-colors"
          >
            Activer – 39€/mois
          </Link>
        </div>
      )}
    </aside>
  );
}
