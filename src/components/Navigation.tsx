import React from 'react';
import { 
  ClipboardList, 
  FileSpreadsheet,
  Building2, 
  BarChart3, 
  Users, 
} from 'lucide-react';
import { motion } from 'motion/react';
import { Language } from '../types';
import { TRANSLATIONS } from '../utils/i18n';
import { playTap } from '../utils/audio';

export type NavTab = 'daily_sheet' | 'quota' | 'reports' | 'analytics' | 'members';

interface NavigationProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  unloggedCount: number;
  language?: Language;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  unloggedCount,
  language = 'en',
}) => {
  const t = TRANSLATIONS[language];

  const tabs = [
    {
      id: 'daily_sheet' as NavTab,
      label: t.tabDailySheet,
      icon: FileSpreadsheet,
      badge: t.sheetsModeBadge,
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    },
    {
      id: 'quota' as NavTab,
      label: t.tabInteractiveQuota,
      icon: ClipboardList,
      badge: unloggedCount > 0 ? `${unloggedCount} ${t.unloggedBadge}` : null,
      badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    },
    {
      id: 'reports' as NavTab,
      label: t.tabBattalionReports,
      icon: Building2,
      badge: null,
      badgeColor: '',
    },
    {
      id: 'analytics' as NavTab,
      label: t.tabAnalytics,
      icon: BarChart3,
      badge: null,
      badgeColor: '',
    },
    {
      id: 'members' as NavTab,
      label: t.tabStaffRoster,
      icon: Users,
      badge: null,
      badgeColor: '',
    },
  ];

  return (
    <nav className="border-b border-white/[0.06] bg-zinc-950/40 backdrop-blur-xl px-4 lg:px-8">
      <div className="max-w-7xl mx-auto flex items-center justify-between overflow-x-auto scrollbar-none py-2">
        
        {/* Apple Segmented Floating Pill Bar */}
        <div className="flex items-center gap-1.5 p-1 bg-zinc-900/60 border border-white/[0.06] rounded-2xl shadow-inner backdrop-blur-2xl">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`nav-tab-${tab.id}`}
                onClick={() => {
                  playTap();
                  onTabChange(tab.id);
                }}
                className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap z-10 ${
                  isActive
                    ? 'text-white'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTabPill"
                    className="absolute inset-0 bg-zinc-800/90 border border-white/[0.1] rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.5)] z-[-1]"
                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                  />
                )}
                <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-emerald-400' : 'text-zinc-500'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border transition-all ${tab.badgeColor}`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

      </div>
    </nav>
  );
};
