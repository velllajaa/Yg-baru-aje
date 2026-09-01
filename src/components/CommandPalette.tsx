import React, { useState, useEffect } from 'react';
import { 
  Search, 
  User, 
  Building2, 
  FileSpreadsheet, 
  BarChart3, 
  Users, 
  Settings, 
  Download, 
  MessageSquare, 
  Cloud,
  ArrowRight,
  Sparkles,
  X
} from 'lucide-react';
import { Member, BattalionId } from '../types';
import { NavTab } from './Navigation';
import { playTap, playSuccess } from '../utils/audio';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  onSelectMember?: (member: Member) => void;
  onSelectTab: (tab: NavTab) => void;
  onSelectBattalionFilter: (bat: BattalionId | 'all') => void;
  onOpenDiscordSummary: () => void;
  onOpenBackup: () => void;
  onOpenCloudSync: () => void;
  onOpenSettings: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  members,
  onSelectMember,
  onSelectTab,
  onSelectBattalionFilter,
  onOpenDiscordSummary,
  onOpenBackup,
  onOpenCloudSync,
  onOpenSettings,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        playTap();
        if (isOpen) onClose();
        else {
          // Open
          setQuery('');
          setSelectedIndex(0);
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredMembers = members.filter((m) =>
    m.name.toLowerCase().includes(query.toLowerCase()) ||
    m.discordId.includes(query) ||
    m.position.toLowerCase().includes(query.toLowerCase()) ||
    m.battalion.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 5);

  const actions = [
    {
      id: 'tab_sheet',
      label: 'Go to Daily Log Spreadsheet',
      icon: FileSpreadsheet,
      category: 'Navigation',
      action: () => { onSelectTab('daily_sheet'); onClose(); },
    },
    {
      id: 'tab_tracker',
      label: 'Go to Daily Quota Tracker',
      icon: Users,
      category: 'Navigation',
      action: () => { onSelectTab('quota'); onClose(); },
    },
    {
      id: 'tab_reports',
      label: 'Go to Battalion Reports',
      icon: Building2,
      category: 'Navigation',
      action: () => { onSelectTab('reports'); onClose(); },
    },
    {
      id: 'tab_analytics',
      label: 'Go to Analytics Dashboard',
      icon: BarChart3,
      category: 'Navigation',
      action: () => { onSelectTab('analytics'); onClose(); },
    },
    {
      id: 'tab_members',
      label: 'Go to Staff Roster Management',
      icon: Users,
      category: 'Navigation',
      action: () => { onSelectTab('members'); onClose(); },
    },
    {
      id: 'act_discord',
      label: 'Generate Discord Shift Summary',
      icon: MessageSquare,
      category: 'Actions',
      action: () => { onOpenDiscordSummary(); onClose(); },
    },
    {
      id: 'act_cloud',
      label: 'Cloud Sync & Persistence Manager',
      icon: Cloud,
      category: 'Actions',
      action: () => { onOpenCloudSync(); onClose(); },
    },
    {
      id: 'act_backup',
      label: 'Export / Backup Data',
      icon: Download,
      category: 'Actions',
      action: () => { onOpenBackup(); onClose(); },
    },
    {
      id: 'act_settings',
      label: 'Open Settings & Quota Config',
      icon: Settings,
      category: 'Actions',
      action: () => { onOpenSettings(); onClose(); },
    },
  ].filter((a) =>
    query === '' || a.label.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div
      id="command-palette-backdrop"
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/75 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-zinc-900/95 border border-white/[0.1] rounded-2xl max-w-xl w-full shadow-[0_32px_96px_rgba(0,0,0,0.8)] overflow-hidden backdrop-blur-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.08]">
          <Search className="w-5 h-5 text-zinc-400" />
          <input
            id="spotlight-search-input"
            autoFocus
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search personnel, jump to tabs, or run actions... (ESC to close)"
            className="flex-1 bg-transparent text-sm text-white placeholder-zinc-500 focus:outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-[10px] font-mono text-zinc-400">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {/* Members results */}
          {filteredMembers.length > 0 && (
            <div className="pb-2">
              <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-semibold">
                Personnel ({filteredMembers.length})
              </div>
              {filteredMembers.map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    playTap();
                    if (onSelectMember) onSelectMember(m);
                    onSelectTab('daily_sheet');
                    onClose();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-white/[0.06] text-zinc-200 transition-colors group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-white/[0.08] flex items-center justify-center text-zinc-300 group-hover:border-sky-500/40">
                      <User className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-white">{m.name}</span>
                      <span className="text-[11px] text-zinc-400 ml-2 font-mono">{m.position}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500">
                    &lt;@{m.discordId}&gt;
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Actions results */}
          {actions.length > 0 && (
            <div>
              <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-semibold">
                Navigation & Tools
              </div>
              {actions.map((act) => {
                const Icon = act.icon;
                return (
                  <button
                    key={act.id}
                    onClick={() => {
                      playTap();
                      act.action();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-white/[0.06] text-zinc-200 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-zinc-800/80 border border-white/[0.06] flex items-center justify-center text-zinc-400 group-hover:text-white group-hover:border-sky-500/40">
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-medium text-zinc-200 group-hover:text-white">
                        {act.label}
                      </span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-sky-400 opacity-0 group-hover:opacity-100 transition-all" />
                  </button>
                );
              })}
            </div>
          )}

          {filteredMembers.length === 0 && actions.length === 0 && (
            <div className="p-8 text-center text-xs text-zinc-500">
              No matching personnel or commands found for "{query}".
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
