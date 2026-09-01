import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Search, 
  Printer,
  Sparkles,
  ChevronDown,
  RotateCcw,
  Trash2
} from 'lucide-react';
import { 
  Member, 
  DailyMemberLog, 
  BattalionId, 
  ActivityLevel,
  MemberTasksProgress,
  AppSettings
} from '../types';
import { BATTALIONS } from '../constants';
import { formatShortDate } from '../utils/date';
import { TRANSLATIONS } from '../utils/i18n';
import { getActiveBattalionTasks, evaluateTaskProgress } from '../utils/tasks';
import { 
  resolveActivityLevel, 
  activityLevelToDropdown, 
  dropdownToActivityLevel,
  getDefaultNoteForLevel 
} from '../utils/activity';

interface DailyLogSpreadsheetViewProps {
  currentDate: string;
  members: Member[];
  memberLogs: Record<string, DailyMemberLog>;
  onUpdateLog: (memberId: string, updates: Partial<DailyMemberLog>) => void;
  onBulkUpdateStatus?: (battalionId: BattalionId | 'all', newLevel: ActivityLevel) => void;
  onClearDateLogs?: (date: string, battalionId?: BattalionId | 'all') => void;
  selectedBattalionFilter?: BattalionId | 'all';
  onFilterChange?: (filter: BattalionId | 'all') => void;
  onOpenAddMember?: () => void;
  settings?: AppSettings;
}

export const DailyLogSpreadsheetView: React.FC<DailyLogSpreadsheetViewProps> = ({
  currentDate,
  members,
  memberLogs,
  onUpdateLog,
  onClearDateLogs,
  settings,
}) => {
  const [activeBattalionTab, setActiveBattalionTab] = useState<BattalionId>('1st_bat');
  const [searchQuery, setSearchQuery] = useState('');

  const lang = settings?.language || 'en';
  const t = TRANSLATIONS[lang];

  const battalionsList: BattalionId[] = ['1st_bat', '2nd_bat', 'commandants_guards'];
  const currentBat = BATTALIONS[activeBattalionTab];
  const activeTasks = getActiveBattalionTasks(activeBattalionTab, settings);

  const activeMembers = members.filter(
    (m) => m.status !== 'inactive' && m.battalion === activeBattalionTab
  );
  
  const filteredMembers = activeMembers.filter((m) => {
    return (
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.position && m.position.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (m.discordId && m.discordId.includes(searchQuery))
    );
  });

  const handleUpdateTaskField = (member: Member, taskId: string, value: string) => {
    const logKey = `${member.id}_${currentDate}`;
    const currentLog = memberLogs[logKey];
    const existingTasks = currentLog?.tasksProgress || {};
    
    onUpdateLog(member.id, {
      tasksProgress: {
        ...existingTasks,
        [taskId]: value,
      },
    });
  };

  const handleUpdateHour = (member: Member, hourValue: string) => {
    const logKey = `${member.id}_${currentDate}`;
    const currentLog = memberLogs[logKey];
    const activityLevel = dropdownToActivityLevel(hourValue);
    const note = getDefaultNoteForLevel(activityLevel, currentLog?.note);

    onUpdateLog(member.id, {
      gameHourDropdown: hourValue,
      activityLevel,
      status: activityLevel as any,
      note,
      overseerNotes: note || currentLog?.overseerNotes || '',
      demotionNotice: activityLevel === 'under_1h',
    });
  };

  const handleUpdateNote = (member: Member, note: string) => {
    onUpdateLog(member.id, {
      overseerNotes: note,
      note: note,
    });
  };

  const renderStatusBadge = (status: 'Met' | 'Not Met' | '-') => {
    if (status === 'Met') {
      return (
        <span className="inline-block px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-[#14532D] text-[#86EFAC] border border-[#22C55E]/40 shadow-sm">
          Met
        </span>
      );
    }
    if (status === 'Not Met') {
      return (
        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#7F1D1D] text-[#FCA5A5] border border-[#EF4444]/40 shadow-sm">
          Not Met
        </span>
      );
    }
    return <span className="text-zinc-600 font-mono">-</span>;
  };

  // Compute theme colors for the battalion table header
  const getHeaderBgColor = () => {
    if (activeBattalionTab === '1st_bat') return 'bg-[#8B0000] border-red-950/60 divide-red-950/40';
    if (activeBattalionTab === '2nd_bat') return 'bg-[#1E3A8A] border-blue-950/60 divide-blue-950/40';
    return 'bg-[#374151] border-zinc-800 divide-zinc-700/50';
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      
      {/* Battalion Sub-Tab Selector & Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-950/80 p-3.5 border border-white/[0.08] rounded-2xl backdrop-blur-xl shadow-lg">
        
        {/* Battalion Sub-Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
          {battalionsList.map((batId) => {
            const bat = BATTALIONS[batId];
            const count = members.filter((m) => m.battalion === batId && m.status !== 'inactive').length;
            const isActive = activeBattalionTab === batId;

            return (
              <button
                key={batId}
                id={`tab-${batId}`}
                onClick={() => setActiveBattalionTab(batId)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold font-display tracking-wide uppercase transition-all whitespace-nowrap ${
                  isActive
                    ? 'text-white shadow-md'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 bg-zinc-950/60 border border-zinc-800/80'
                }`}
                style={{
                  backgroundColor: isActive ? bat.color : undefined,
                }}
              >
                <span className="w-2 h-2 rounded-full bg-white shadow-sm"></span>
                <span>{bat.name}</span>
                <span className={`px-1.5 py-0.2 text-[10px] font-mono rounded-full ${
                  isActive ? 'bg-black/30 text-white' : 'bg-zinc-800 text-zinc-400'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              id="spreadsheet-search-input"
              type="text"
              placeholder={t.searchPersonnel}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900/90 border border-white/[0.08] rounded-xl pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50 backdrop-blur-md"
            />
          </div>

          {onClearDateLogs && (
            <button
              id="clear-unit-logs-btn"
              onClick={() => {
                const promptMsg = lang === 'id'
                  ? `Kosongkan semua log kuota & jam aktivitas untuk ${currentBat.name} pada tanggal ${currentDate}? (Nama dan personil tetap aman)`
                  : `Clear all quota logs for ${currentBat.name} on ${currentDate}? (Personnel roster remains intact)`;
                if (window.confirm(promptMsg)) {
                  onClearDateLogs(currentDate, activeBattalionTab);
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-semibold transition-colors backdrop-blur-md whitespace-nowrap"
              title={lang === 'id' ? 'Kosongkan log kuota unit ini' : 'Clear logs for this unit'}
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">{lang === 'id' ? 'Reset Log Unit' : 'Reset Unit Logs'}</span>
            </button>
          )}

          <button
            id="print-sheet-btn"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-semibold border border-white/[0.08] transition-colors backdrop-blur-md"
            title={t.printPdf}
          >
            <Printer className="w-3.5 h-3.5 text-zinc-400" />
            <span className="hidden sm:inline">{t.printPdf}</span>
          </button>
        </div>
      </div>

      {/* Main Authentic Google Sheets Spreadsheet Table */}
      <div className="bg-zinc-950/70 border border-white/[0.08] rounded-2xl overflow-hidden shadow-[0_16px_48px_rgba(0,0,0,0.5)] backdrop-blur-2xl">
        
        {/* Table Title Banner */}
        <div 
          className="px-6 py-3.5 text-white flex items-center justify-between font-display tracking-wide uppercase font-bold text-sm sm:text-base border-b border-black/30"
          style={{ backgroundColor: currentBat.color }}
        >
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="w-5 h-5" />
            <span>{currentBat.shortName} {t.dailyLogSheetTitle}</span>
          </div>
          <span className="font-mono text-xs font-semibold px-3 py-1 bg-black/40 rounded-lg text-zinc-200">
            {t.dateCol}: {currentDate} ({formatShortDate(currentDate)})
          </span>
        </div>

        <div className="overflow-x-auto">
          
          <table className="w-full border-collapse text-left text-xs font-sans">
            <thead>
              <tr className={`${getHeaderBgColor()} text-white font-bold text-xs uppercase tracking-wide border-b divide-x`}>
                <th className="py-3 px-3 text-center w-28">{t.dateCol}</th>
                <th className="py-3 px-4 min-w-[140px]">{t.usernameCol}</th>
                <th className="py-3 px-3 text-center w-24">{t.positionCol}</th>
                
                {/* Dynamically Render All Configured Tasks For This Battalion */}
                {activeTasks.map((task) => (
                  <React.Fragment key={task.id}>
                    <th className="py-3 px-3 text-center min-w-[80px]">
                      {task.shortLabel || task.name}
                    </th>
                    <th className="py-3 px-3 text-center min-w-[90px]">
                      {task.shortLabel || task.name} Stats
                    </th>
                  </React.Fragment>
                ))}

                <th className="py-3 px-3 text-center w-36">{t.inGameHourCol}</th>
                <th className="py-3 px-4 min-w-[200px]">{t.overseerNotesCol}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80 bg-zinc-950/90 text-zinc-200">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={5 + (activeTasks.length * 2)} className="py-8 text-center text-zinc-500">
                    {t.noPersonnel}
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => {
                  const logKey = `${member.id}_${currentDate}`;
                  const log = memberLogs[logKey];
                  const tasks: MemberTasksProgress = log?.tasksProgress || {};
                  const currentLevel = resolveActivityLevel(log);
                  const inGameHour = log?.gameHourDropdown || activityLevelToDropdown(currentLevel);
                  const overseerNote = log?.overseerNotes ?? log?.note ?? '';

                  return (
                    <tr key={member.id} className="hover:bg-zinc-900/60 divide-x divide-zinc-800/40 transition-colors">
                      {/* Date */}
                      <td className="py-2.5 px-3 text-center font-mono text-[11px] text-zinc-400">
                        {currentDate}
                      </td>
                      
                      {/* Username */}
                      <td className="py-2.5 px-4 font-semibold text-white">
                        <div className="flex items-center gap-2">
                          <span>{member.name}</span>
                          {member.discordId && (
                            <span className="text-[10px] font-mono text-zinc-500">
                              ({member.discordId})
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Position */}
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-zinc-300">
                        {member.position || 'BXO'}
                      </td>

                      {/* Dynamic Task Inputs & Evaluated Stats Badges */}
                      {activeTasks.map((task) => {
                        const rawVal = tasks[task.id] ?? '';
                        const evalResult = evaluateTaskProgress(task, member, rawVal, settings);

                        return (
                          <React.Fragment key={task.id}>
                            {/* Input Column */}
                            <td className="py-2 px-2 text-center">
                              <input
                                type="text"
                                value={rawVal}
                                onChange={(e) => handleUpdateTaskField(member, task.id, e.target.value)}
                                placeholder="0"
                                className="w-16 bg-zinc-900 text-center font-mono font-bold text-white border border-zinc-700 rounded py-1 px-1 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                              />
                            </td>

                            {/* Evaluated Stats Badge Column */}
                            <td className="py-2 px-3 text-center font-semibold">
                              {renderStatusBadge(evalResult.status)}
                            </td>
                          </React.Fragment>
                        );
                      })}

                      {/* In-game activity hour Dropdown */}
                      <td className="py-2 px-3 text-center">
                        <select
                          value={inGameHour}
                          onChange={(e) => handleUpdateHour(member, e.target.value)}
                          className="bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs font-semibold rounded py-1 px-2.5 focus:outline-none focus:border-emerald-500 cursor-pointer"
                        >
                          <option value="-">-</option>
                          <option value="1 hour">1 hour</option>
                          <option value="2 hour">2 hour</option>
                          <option value="3 hour">3 hour</option>
                          <option value="4 hour+">4 hour+</option>
                          <option value="Exempted">Exempted</option>
                        </select>
                      </td>

                      {/* Overseer Notes */}
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={overseerNote}
                          onChange={(e) => handleUpdateNote(member, e.target.value)}
                          placeholder="Notes..."
                          className="w-full bg-zinc-900 text-xs text-zinc-300 border border-zinc-800 rounded py-1 px-2.5 focus:outline-none focus:border-zinc-600"
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

        </div>

        {/* Solid Google Sheets Matching Footer Bar */}
        <div 
          className="p-3 text-white text-xs font-mono font-bold flex items-center justify-between"
          style={{ backgroundColor: currentBat.color }}
        >
          <span>{currentBat.shortName} {t.footerTitle}</span>
          <span>{currentDate}</span>
        </div>

      </div>

    </div>
  );
};
