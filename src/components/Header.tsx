import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Send, 
  Database, 
  Settings,
  Clock,
  Globe,
  Search,
  Volume2,
  VolumeX,
  Cloud
} from 'lucide-react';
import { getTodayString, addDays, formatShortDate } from '../utils/date';
import { AppSettings, Language } from '../types';
import { TRANSLATIONS } from '../utils/i18n';
import { playTap, isAudioMuted, setAudioMuted, playSuccess } from '../utils/audio';
import { isFirebaseConfigured } from '../utils/firebase';

interface HeaderProps {
  currentDate: string;
  onDateChange: (date: string) => void;
  onOpenSummary: () => void;
  onOpenBackup: () => void;
  onOpenSettings: () => void;
  onOpenCloudSync: () => void;
  onOpenSpotlight: () => void;
  onToggleLanguage: () => void;
  settings: AppSettings;
  activeTab: string;
  totalMembersCount: number;
  syncStatus?: 'idle' | 'syncing' | 'synced' | 'error';
  lastSyncAt?: string | null;
}

export const Header: React.FC<HeaderProps> = ({
  currentDate,
  onDateChange,
  onOpenSummary,
  onOpenBackup,
  onOpenSettings,
  onOpenCloudSync,
  onOpenSpotlight,
  onToggleLanguage,
  settings,
  syncStatus = 'synced',
  lastSyncAt,
}) => {
  const isToday = currentDate === getTodayString();
  const lang = settings.language || 'en';
  const t = TRANSLATIONS[lang];
  const [muted, setMuted] = useState(isAudioMuted());

  const toggleSound = () => {
    const nextState = !muted;
    setMuted(nextState);
    setAudioMuted(nextState);
    if (!nextState) playSuccess();
  };

  const handleDateChange = (newDate: string) => {
    playTap();
    onDateChange(newDate);
  };

  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.08] bg-zinc-950/80 backdrop-blur-2xl px-4 lg:px-8 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        
        {/* Brand / Logo */}
        <div className="flex items-center gap-3.5">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500/20 via-zinc-800 to-zinc-900 border border-emerald-500/30 shadow-lg shadow-emerald-950/30 transition-transform active:scale-95">
            <Shield className="w-5 h-5 text-emerald-400" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold tracking-wide text-white font-display uppercase text-lg">
                {settings.appName || 'BRIGCOMM'}
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                {settings.timezoneLabel || 'AEST COMMAND'}
              </span>

              {/* Cloud Sync Status Indicator Pill */}
              <button
                id="header-cloud-status-btn"
                onClick={() => { playTap(); onOpenCloudSync(); }}
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono border transition-all hover:scale-105 ${
                  !isFirebaseConfigured()
                    ? 'bg-zinc-900 text-zinc-400 border-white/[0.08] hover:text-zinc-200'
                    : syncStatus === 'syncing'
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    : syncStatus === 'error'
                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                    : 'bg-sky-500/10 text-sky-400 border-sky-500/30 hover:bg-sky-500/20'
                }`}
                title={lastSyncAt ? `Terakhir disimpan ke Firebase: ${lastSyncAt}` : 'Firebase Firestore Persistence'}
              >
                <Cloud className="w-3 h-3 text-sky-400" />
                <span className={`w-1.5 h-1.5 rounded-full ${
                  !isFirebaseConfigured()
                    ? 'bg-zinc-500'
                    : syncStatus === 'syncing'
                    ? 'bg-amber-400 animate-ping'
                    : syncStatus === 'error'
                    ? 'bg-rose-400'
                    : 'bg-emerald-400 animate-pulse'
                }`}></span>
                <span className="hidden sm:inline">
                  {!isFirebaseConfigured()
                    ? 'Local Storage'
                    : syncStatus === 'syncing'
                    ? 'Menyimpan...'
                    : syncStatus === 'error'
                    ? 'Sync Error'
                    : 'Firebase Synced'}
                </span>
                {lastSyncAt && isFirebaseConfigured() && syncStatus !== 'syncing' && (
                  <span className="text-[9px] opacity-70 hidden md:inline font-sans">
                    ({lastSyncAt})
                  </span>
                )}
              </button>
            </div>
            <p className="text-xs text-zinc-400 flex items-center gap-1.5">
              <span>{settings.appSubtitle || t.appSubtitle}</span>
              <span className="text-zinc-600">•</span>
              <span className="text-zinc-400 font-mono flex items-center gap-1">
                <Clock className="w-3 h-3 text-zinc-500" />
                {t.shift}: {settings.shiftTime || '20:30'}
              </span>
            </p>
          </div>
        </div>

        {/* Date Selector and Shift Controller */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Spotlight Search Shortcut Button */}
          <button
            id="spotlight-open-btn"
            onClick={() => { playTap(); onOpenSpotlight(); }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-white/[0.08] text-xs transition-all shadow-sm group"
            title="Search Personnel or Commands (Ctrl/Cmd + K)"
          >
            <Search className="w-3.5 h-3.5 text-zinc-500 group-hover:text-white" />
            <span className="hidden sm:inline text-[11px]">Search</span>
            <kbd className="px-1.5 py-0.5 rounded bg-zinc-950 text-[10px] font-mono text-zinc-500 border border-zinc-800">
              ⌘K
            </kbd>
          </button>

          {/* Date Navigator */}
          <div className="flex items-center bg-zinc-900/90 border border-white/[0.08] rounded-xl p-1 shadow-inner backdrop-blur-md">
            <button
              id="prev-date-btn"
              onClick={() => handleDateChange(addDays(currentDate, -1))}
              className="p-1.5 hover:bg-white/[0.06] text-zinc-400 hover:text-white rounded-lg transition-colors active:scale-95"
              title={t.previousDay}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 px-3 py-1 text-xs">
              <CalendarIcon className="w-3.5 h-3.5 text-emerald-400" />
              <input
                id="date-picker-input"
                type="date"
                value={currentDate}
                onChange={(e) => e.target.value && handleDateChange(e.target.value)}
                className="bg-transparent text-zinc-200 font-mono text-xs focus:outline-none cursor-pointer"
              />
              <span className="text-zinc-400 font-medium hidden sm:inline">
                ({formatShortDate(currentDate)})
              </span>
            </div>

            <button
              id="next-date-btn"
              onClick={() => handleDateChange(addDays(currentDate, 1))}
              className="p-1.5 hover:bg-white/[0.06] text-zinc-400 hover:text-white rounded-lg transition-colors active:scale-95"
              title={t.nextDay}
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {!isToday && (
              <button
                id="today-date-btn"
                onClick={() => handleDateChange(getTodayString())}
                className="ml-1 px-2.5 py-1 text-[11px] font-semibold bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded-lg border border-emerald-500/30 transition-colors"
              >
                {t.today}
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Tactile Audio Mute Toggle */}
            <button
              id="audio-toggle-btn"
              onClick={toggleSound}
              className={`p-2 rounded-xl border transition-all ${
                muted 
                  ? 'bg-zinc-900/60 text-zinc-500 border-white/[0.06] hover:text-zinc-300' 
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
              }`}
              title={muted ? 'Unmute Tactile Sound FX' : 'Mute Tactile Sound FX'}
            >
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Quick 1-Click Language Switcher (ID / EN) */}
            <button
              id="quick-language-toggle-btn"
              onClick={() => { playTap(); onToggleLanguage(); }}
              className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 text-xs font-bold rounded-xl border border-white/[0.08] transition-all hover:border-white/[0.15] shadow-sm active:scale-95"
              title={t.switchLanguage}
            >
              <Globe className="w-3.5 h-3.5 text-sky-400" />
              <span>{lang === 'id' ? '🇮🇩 ID' : '🇺🇸 EN'}</span>
            </button>

            {/* Shift Report Generator */}
            <button
              id="open-discord-summary-btn"
              onClick={() => { playTap(); onOpenSummary(); }}
              className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-emerald-950/40 border border-emerald-400/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Send className="w-3.5 h-3.5 text-emerald-100" />
              <span>{t.generateReport}</span>
              <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse"></span>
            </button>

            {/* Backup & Restore */}
            <button
              id="open-backup-btn"
              onClick={() => { playTap(); onOpenBackup(); }}
              className="p-2 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-xl border border-white/[0.08] transition-colors active:scale-95"
              title={t.backup}
            >
              <Database className="w-4 h-4" />
            </button>

            {/* Full Website Settings Button */}
            <button
              id="open-settings-btn"
              onClick={() => { playTap(); onOpenSettings(); }}
              className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900/80 hover:bg-zinc-800 text-amber-300 hover:text-amber-200 rounded-xl border border-amber-500/30 transition-all hover:border-amber-500/60 shadow-sm active:scale-95"
              title={t.settings}
            >
              <Settings className="w-4 h-4 text-amber-400 animate-spin-slow" />
              <span className="text-xs font-bold hidden sm:inline">{t.settings}</span>
            </button>
          </div>
        </div>

      </div>
    </header>
  );
};
