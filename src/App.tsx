import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { Navigation, NavTab } from './components/Navigation';
import { QuickStatsBar } from './components/QuickStatsBar';
import { DailyLogSpreadsheetView } from './components/DailyLogSpreadsheetView';
import { DailyQuotaEntry } from './components/DailyQuotaEntry';
import { BattalionReports } from './components/BattalionReports';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { MemberManagement } from './components/MemberManagement';
import { DiscordSummaryModal } from './components/DiscordSummaryModal';
import { BackupModal } from './components/BackupModal';
import { SettingsModal } from './components/SettingsModal';
import { CloudSyncModal } from './components/CloudSyncModal';
import { CommandPalette } from './components/CommandPalette';

import { AppState, Member, DailyMemberLog, BattalionDailyReportData, BattalionId, ActivityLevel, AppSettings, Language } from './types';
import { loadAppState, saveAppState, clearAllPersonnelData, clearAllLogsPreserveRoster, clearLogsForDate } from './utils/storage';
import { getTodayString } from './utils/date';
import { 
  subscribeToFirebaseState, 
  saveStateToFirebase, 
  saveStateToFirebaseImmediate,
  fetchRemoteState,
  mergeStates,
  isFirebaseConfigured 
} from './utils/firebase';
import { 
  resolveActivityLevel, 
  activityLevelToDropdown, 
  dropdownToActivityLevel,
  getDefaultNoteForLevel 
} from './utils/activity';
import { playTap, playSuccess } from './utils/audio';

export default function App() {
  const [appState, setAppState] = useState<AppState>(() => loadAppState());
  const [currentDate, setCurrentDate] = useState<string>(getTodayString());
  const [activeTab, setActiveTab] = useState<NavTab>('daily_sheet');
  const [selectedBattalionFilter, setSelectedBattalionFilter] = useState<BattalionId | 'all'>('all');

  // Cloud Persistence Sync State
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);

  // Modals
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isCloudSyncModalOpen, setIsCloudSyncModalOpen] = useState(false);
  const [isSpotlightOpen, setIsSpotlightOpen] = useState(false);

  const isRemoteUpdatingRef = useRef(false);
  const isCloudLoadedRef = useRef(false);

  // 1. Initial Cloud State Fetch & Merge on Boot (Prevents startup overwrites)
  useEffect(() => {
    let isMounted = true;

    async function initCloudState() {
      if (!isFirebaseConfigured()) {
        isCloudLoadedRef.current = true;
        setSyncStatus('idle');
        return;
      }

      setSyncStatus('syncing');
      try {
        const remoteData = await fetchRemoteState();
        if (!isMounted) return;

        if (remoteData) {
          isRemoteUpdatingRef.current = true;
          setAppState((currentLocal) => {
            const merged = mergeStates(currentLocal, remoteData);
            saveAppState(merged);
            return merged;
          });
          setSyncStatus('synced');
          setLastSyncAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
          setTimeout(() => {
            isRemoteUpdatingRef.current = false;
          }, 150);
        } else {
          // If remote is empty, check if we have local data to seed to cloud
          const local = loadAppState();
          if (local.members.length > 0 || Object.keys(local.memberLogs).length > 0) {
            await saveStateToFirebase(local);
            setSyncStatus('synced');
            setLastSyncAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
          } else {
            setSyncStatus('synced');
          }
        }
      } catch (err) {
        console.error('Failed to initialize state from Firebase:', err);
        setSyncStatus('error');
      } finally {
        isCloudLoadedRef.current = true;
      }
    }

    initCloudState();

    // 2. Real-time Firebase snapshot listener
    let unsubscribe: (() => void) | null = null;
    if (isFirebaseConfigured()) {
      unsubscribe = subscribeToFirebaseState(
        (remoteData) => {
          if (!isMounted || !isCloudLoadedRef.current) return;
          if (remoteData) {
            isRemoteUpdatingRef.current = true;
            setAppState((currentLocal) => {
              const merged = mergeStates(currentLocal, remoteData);
              saveAppState(merged);
              return merged;
            });
            setSyncStatus('synced');
            setLastSyncAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
            setTimeout(() => {
              isRemoteUpdatingRef.current = false;
            }, 150);
          }
        },
        (err) => {
          console.warn('Firestore real-time subscription warning:', err);
        }
      );
    }

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // 3. Auto-save state to LocalStorage and Firebase (only after cloud is loaded & change was local)
  useEffect(() => {
    // Always persist to local cache immediately
    saveAppState(appState);

    const handleFlush = () => {
      saveAppState(appState);
      if (isFirebaseConfigured() && isCloudLoadedRef.current) {
        saveStateToFirebaseImmediate(appState);
      }
    };

    window.addEventListener('beforeunload', handleFlush);
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        handleFlush();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    // Only write to Firebase if initial cloud load has completed and not an incoming remote update
    if (isFirebaseConfigured() && isCloudLoadedRef.current && !isRemoteUpdatingRef.current) {
      setSyncStatus('syncing');
      saveStateToFirebase(appState).then((success) => {
        setSyncStatus(success ? 'synced' : 'error');
        if (success) {
          setLastSyncAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        }
      });
    }

    return () => {
      window.removeEventListener('beforeunload', handleFlush);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [appState]);

  // Handler: Manual Pull from Cloud
  const handlePullFromCloud = async (): Promise<boolean> => {
    try {
      setSyncStatus('syncing');
      const remoteData = await fetchRemoteState();
      if (remoteData) {
        isRemoteUpdatingRef.current = true;
        setAppState((prev) => {
          const merged = mergeStates(prev, remoteData);
          saveAppState(merged);
          return merged;
        });
        setSyncStatus('synced');
        setLastSyncAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        setTimeout(() => {
          isRemoteUpdatingRef.current = false;
        }, 150);
        return true;
      }
      return false;
    } catch {
      setSyncStatus('error');
      return false;
    }
  };

  // Handler: Manual Push to Cloud
  const handlePushToCloud = async (): Promise<boolean> => {
    try {
      setSyncStatus('syncing');
      const success = await saveStateToFirebase(appState);
      setSyncStatus(success ? 'synced' : 'error');
      if (success) {
        setLastSyncAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      }
      return success;
    } catch {
      setSyncStatus('error');
      return false;
    }
  };

  // Handler: Update individual member daily log
  const handleUpdateMemberLog = (memberId: string, updates: Partial<DailyMemberLog>) => {
    const key = `${memberId}_${currentDate}`;
    setAppState((prev) => {
      const existing = prev.memberLogs[key] || {
        memberId,
        date: currentDate,
        status: 'no_logs',
        activityLevel: 'under_1h',
        gameHourDropdown: '-',
        quotaCount: 0,
        tasksProgress: {},
        note: '***No Logs*** (Demotion notice)',
        overseerNotes: '***No Logs*** (Demotion notice)',
        updatedAt: new Date().toISOString(),
      };

      const mergedTasks = updates.tasksProgress
        ? { ...(existing.tasksProgress || {}), ...updates.tasksProgress }
        : existing.tasksProgress || {};

      // Auto resolve activityLevel and gameHourDropdown in tandem
      let activityLevel = updates.activityLevel;
      let gameHourDropdown = updates.gameHourDropdown;

      if (gameHourDropdown && !activityLevel) {
        activityLevel = dropdownToActivityLevel(gameHourDropdown);
      } else if (activityLevel && !gameHourDropdown) {
        gameHourDropdown = activityLevelToDropdown(activityLevel);
      } else if (!activityLevel && !gameHourDropdown) {
        activityLevel = resolveActivityLevel(existing);
        gameHourDropdown = existing.gameHourDropdown || activityLevelToDropdown(activityLevel);
      }

      const note = updates.note !== undefined ? updates.note : (updates.overseerNotes !== undefined ? updates.overseerNotes : existing.note);
      const overseerNotes = updates.overseerNotes !== undefined ? updates.overseerNotes : (updates.note !== undefined ? updates.note : existing.overseerNotes || existing.note);

      const updatedLog: DailyMemberLog = {
        ...existing,
        ...updates,
        tasksProgress: mergedTasks,
        activityLevel: activityLevel || 'under_1h',
        gameHourDropdown: gameHourDropdown || '-',
        status: (activityLevel as any) || existing.status || 'under_1h',
        note: note || '',
        overseerNotes: overseerNotes || '',
        demotionNotice: updates.demotionNotice !== undefined ? updates.demotionNotice : activityLevel === 'under_1h',
        updatedAt: new Date().toISOString(),
      };

      return {
        ...prev,
        memberLogs: {
          ...prev.memberLogs,
          [key]: updatedLog,
        },
      };
    });
  };

  // Handler: Bulk update status for filtered or specific battalion
  const handleBulkUpdateStatus = (battalionId: BattalionId | 'all', newLevel: ActivityLevel) => {
    const targetMembers = appState.members.filter(
      (m) => m.status !== 'inactive' && (battalionId === 'all' || m.battalion === battalionId)
    );

    const newLogs = { ...appState.memberLogs };
    const defaultNote = getDefaultNoteForLevel(newLevel);
    const hourDropdown = activityLevelToDropdown(newLevel);

    for (const m of targetMembers) {
      const key = `${m.id}_${currentDate}`;
      const existing = appState.memberLogs[key];
      const noteToSet = defaultNote || existing?.note || '';
      newLogs[key] = {
        memberId: m.id,
        date: currentDate,
        activityLevel: newLevel,
        gameHourDropdown: hourDropdown,
        status: newLevel as any,
        tasksProgress: existing?.tasksProgress || {},
        quotaCount: existing?.quotaCount || 0,
        note: noteToSet,
        overseerNotes: noteToSet,
        demotionNotice: newLevel === 'under_1h',
        updatedAt: new Date().toISOString(),
      };
    }

    setAppState((prev) => ({
      ...prev,
      memberLogs: newLogs,
    }));
  };

  // Handler: Battalion report updates
  const handleUpdateBattalionReport = (report: BattalionDailyReportData) => {
    const key = `${report.battalionId}_${report.date}`;
    setAppState((prev) => ({
      ...prev,
      battalionReports: {
        ...prev.battalionReports,
        [key]: report,
      },
    }));
  };

  // Handler: Members CRUD
  const handleAddMember = (newMember: Omit<Member, 'id' | 'createdAt'>) => {
    playSuccess();
    const member: Member = {
      ...newMember,
      id: `m_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      createdAt: new Date().toISOString(),
    };
    setAppState((prev) => ({
      ...prev,
      members: [...prev.members, member],
    }));
  };

  const handleBatchAddMembers = (newMembers: Omit<Member, 'id' | 'createdAt'>[]) => {
    playSuccess();
    const formatted: Member[] = newMembers.map((m, idx) => ({
      ...m,
      id: `m_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 5)}`,
      createdAt: new Date().toISOString(),
    }));
    setAppState((prev) => ({
      ...prev,
      members: [...prev.members, ...formatted],
    }));
  };

  const handleUpdateMember = (id: string, updates: Partial<Member>) => {
    playTap();
    setAppState((prev) => ({
      ...prev,
      members: prev.members.map((m) => (m.id === id ? { ...m, ...updates } : m)),
    }));
  };

  const handleDeleteMember = (id: string) => {
    playTap();
    setAppState((prev) => ({
      ...prev,
      members: prev.members.filter((m) => m.id !== id),
    }));
  };

  // Handler: Settings Update
  const handleUpdateSettings = (newSettings: Partial<AppSettings>) => {
    setAppState((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        ...newSettings,
      },
    }));
  };

  // Handler: Clear all logs across all dates while PRESERVING members & settings
  const handleClearAllLogsPreserveRoster = () => {
    setAppState((prev) => {
      const updated = clearAllLogsPreserveRoster(prev);
      if (isFirebaseConfigured()) {
        saveStateToFirebaseImmediate(updated);
      }
      return updated;
    });
  };

  // Handler: Clear logs only for a specific date (or unit)
  const handleClearDateLogs = (dateToClear: string, battalionId?: BattalionId | 'all') => {
    setAppState((prev) => {
      const updated = clearLogsForDate(prev, dateToClear, battalionId);
      if (isFirebaseConfigured()) {
        saveStateToFirebaseImmediate(updated);
      }
      return updated;
    });
  };

  // Language toggle shortcut
  const handleToggleLanguage = () => {
    const currentLang = appState.settings.language || 'en';
    const nextLang: Language = currentLang === 'en' ? 'id' : 'en';
    handleUpdateSettings({ language: nextLang });
  };

  const unloggedCount = appState.members.filter((m) => {
    if (m.status === 'inactive') return false;
    const log = appState.memberLogs[`${m.id}_${currentDate}`];
    return !log || log.status === 'no_logs' || log.activityLevel === 'under_1h';
  }).length;

  return (
    <div className="min-h-screen bg-[#07090e] text-zinc-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      
      {/* Top Main App Header */}
      <Header
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        onOpenSummary={() => setIsSummaryModalOpen(true)}
        onOpenBackup={() => setIsBackupModalOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenCloudSync={() => setIsCloudSyncModalOpen(true)}
        onOpenSpotlight={() => setIsSpotlightOpen(true)}
        onToggleLanguage={handleToggleLanguage}
        settings={appState.settings}
        activeTab={activeTab}
        totalMembersCount={appState.members.length}
        syncStatus={syncStatus}
        lastSyncAt={lastSyncAt}
      />

      {/* Floating Navigation Pill */}
      <Navigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        unloggedCount={unloggedCount}
        language={appState.settings.language || 'en'}
      />

      {/* Main Workspace Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 space-y-6">
        
        {/* Quick Stats Summary Bar */}
        <QuickStatsBar
          members={appState.members}
          memberLogs={appState.memberLogs}
          currentDate={currentDate}
          selectedBattalionFilter={selectedBattalionFilter}
          shiftTime={appState.settings.shiftTime || '20:30'}
        />

        {/* Tab 1: Daily Log Spreadsheet View (Primary Default) */}
        {activeTab === 'daily_sheet' && (
          <DailyLogSpreadsheetView
            currentDate={currentDate}
            members={appState.members}
            memberLogs={appState.memberLogs}
            onUpdateLog={handleUpdateMemberLog}
            onBulkUpdateStatus={handleBulkUpdateStatus}
            onClearDateLogs={handleClearDateLogs}
            selectedBattalionFilter={selectedBattalionFilter}
            onFilterChange={setSelectedBattalionFilter}
            onOpenAddMember={() => setActiveTab('members')}
            settings={appState.settings}
          />
        )}

        {/* Tab 1.5: Detailed Quota Cards */}
        {activeTab === 'quota' && (
          <DailyQuotaEntry
            currentDate={currentDate}
            members={appState.members}
            memberLogs={appState.memberLogs}
            onUpdateLog={handleUpdateMemberLog}
            onBulkUpdateStatus={handleBulkUpdateStatus}
            selectedBattalionFilter={selectedBattalionFilter}
            onFilterChange={setSelectedBattalionFilter}
            onNavigateToMembers={() => setActiveTab('members')}
            settings={appState.settings}
          />
        )}

        {/* Tab 2: Battalion Reports */}
        {activeTab === 'reports' && (
          <BattalionReports
            currentDate={currentDate}
            reports={appState.battalionReports}
            battalionReports={appState.battalionReports}
            onSaveReport={handleUpdateBattalionReport}
            members={appState.members}
            memberLogs={appState.memberLogs}
            selectedBattalionFilter={selectedBattalionFilter}
            onFilterChange={setSelectedBattalionFilter}
          />
        )}

        {/* Tab 3: Analytics & Shift Graphs */}
        {activeTab === 'analytics' && (
          <AnalyticsDashboard
            currentDate={currentDate}
            members={appState.members}
            memberLogs={appState.memberLogs}
            battalionReports={appState.battalionReports}
          />
        )}

        {/* Tab 4: Roster & Staff Management */}
        {activeTab === 'members' && (
          <MemberManagement
            members={appState.members}
            onAddMember={handleAddMember}
            onUpdateMember={handleUpdateMember}
            onDeleteMember={handleDeleteMember}
            onBatchAddMembers={handleBatchAddMembers}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] bg-zinc-950/80 py-4 px-4 text-center text-xs text-zinc-500 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>{appState.settings.appName || 'BRIGCOMM'} DAILY QUOTA TRACKER // {appState.settings.timezoneLabel || 'AEST HQ COMMAND'}</span>
          <span className="font-mono text-[11px] text-zinc-600">
            Shift End: {appState.settings.shiftTime || '20:30'} AEST • Firebase Firestore & Local Storage Active
          </span>
        </div>
      </footer>

      {/* Spotlight Command Palette (Cmd + K) */}
      <CommandPalette
        isOpen={isSpotlightOpen}
        onClose={() => setIsSpotlightOpen(false)}
        members={appState.members}
        onSelectTab={setActiveTab}
        onSelectBattalionFilter={setSelectedBattalionFilter}
        onOpenDiscordSummary={() => setIsSummaryModalOpen(true)}
        onOpenBackup={() => setIsBackupModalOpen(true)}
        onOpenCloudSync={() => setIsCloudSyncModalOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
      />

      {/* Cloud Sync & Firebase Configuration Modal */}
      <CloudSyncModal
        isOpen={isCloudSyncModalOpen}
        onClose={() => setIsCloudSyncModalOpen(false)}
        appState={appState}
        onClearAllPersonnel={() => {
          clearAllPersonnelData();
          setAppState((prev) => {
            const cleared = {
              ...prev,
              members: [],
              memberLogs: {},
              battalionReports: {},
            };
            if (isFirebaseConfigured()) {
              saveStateToFirebaseImmediate(cleared);
            }
            return cleared;
          });
        }}
        onClearLogsPreserveRoster={handleClearAllLogsPreserveRoster}
        onManualSync={() => {
          saveStateToFirebase(appState);
        }}
        onPullFromCloud={handlePullFromCloud}
        onPushToCloud={handlePushToCloud}
        syncStatus={syncStatus}
        lastSyncAt={lastSyncAt}
      />

      {/* Discord Shift Summary Generator Modal */}
      <DiscordSummaryModal
        isOpen={isSummaryModalOpen}
        onClose={() => setIsSummaryModalOpen(false)}
        currentDate={currentDate}
        members={appState.members}
        memberLogs={appState.memberLogs}
        battalionReports={appState.battalionReports}
        settings={appState.settings}
        onUpdateSettings={handleUpdateSettings}
      />

      {/* Backup / Restore Modal */}
      <BackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        appState={appState}
        onRestoreState={(newState) => {
          setAppState(newState);
          if (isFirebaseConfigured()) {
            saveStateToFirebaseImmediate(newState);
          }
        }}
      />

      {/* Settings Modal (Full Control) */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={appState.settings}
        onSaveSettings={(s) => setAppState((prev) => ({ ...prev, settings: s }))}
      />

    </div>
  );
}
