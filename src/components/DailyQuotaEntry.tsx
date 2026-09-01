import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Check, 
  AlertTriangle, 
  Sparkles, 
  UserPlus, 
  ArrowRight,
  Shield,
  Clock,
  CheckCircle2,
  Copy,
  Info,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Zap
} from 'lucide-react';
import { 
  Member, 
  DailyMemberLog, 
  BattalionId, 
  ActivityLevel, 
  MemberTasksProgress,
  TaskQuotaSpec,
  AppSettings
} from '../types';
import { 
  BATTALIONS, 
  ACTIVITY_META, 
  BATTALION_QUOTA_REFERENCES 
} from '../constants';
import { TaskCounter } from './TaskCounter';
import { getActiveBattalionTasks, getTaskTargetForMember } from '../utils/tasks';
import { 
  resolveActivityLevel, 
  activityLevelToDropdown, 
  getDefaultNoteForLevel 
} from '../utils/activity';

interface DailyQuotaEntryProps {
  currentDate: string;
  members: Member[];
  memberLogs: Record<string, DailyMemberLog>;
  onUpdateLog: (memberId: string, updates: Partial<DailyMemberLog>) => void;
  onBulkUpdateStatus: (battalionId: BattalionId | 'all', status: any) => void;
  onNavigateToMembers: () => void;
  selectedBattalionFilter: BattalionId | 'all';
  onFilterChange?: (filter: BattalionId | 'all') => void;
  settings?: AppSettings;
}

export const DailyQuotaEntry: React.FC<DailyQuotaEntryProps> = ({
  currentDate,
  members,
  memberLogs,
  onUpdateLog,
  onBulkUpdateStatus,
  onNavigateToMembers,
  selectedBattalionFilter,
  onFilterChange,
  settings,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showReferenceGuide, setShowReferenceGuide] = useState(true);

  const activeMembers = members.filter((m) => m.status !== 'inactive');

  const filteredMembers = activeMembers.filter((m) => {
    const matchesBat = selectedBattalionFilter === 'all' || m.battalion === selectedBattalionFilter;
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.discordId && m.discordId.includes(searchQuery)) ||
      (m.position && m.position.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesBat && matchesSearch;
  });

  const handleCopyDiscordTag = (discordId: string) => {
    navigator.clipboard.writeText(`<@${discordId}>`);
    setCopiedId(discordId);
    setTimeout(() => setCopiedId(null), 1500);
  };

  // Helper to determine target for a member's position & battalion
  const getMemberQuotaTarget = (member: Member): TaskQuotaSpec => {
    const batRef = BATTALION_QUOTA_REFERENCES[member.battalion];
    const pos = member.position?.trim().toUpperCase() || '';
    if (pos.includes('BXO')) return batRef?.['BXO'] || {};
    if (pos.includes('BSM')) return batRef?.['BSM'] || {};
    return batRef?.['Officer'] || batRef?.['BXO'] || {};
  };

  const handleActivityLevelChange = (member: Member, newLevel: ActivityLevel) => {
    const currentLog = memberLogs[`${member.id}_${currentDate}`];
    const note = getDefaultNoteForLevel(newLevel, currentLog?.note);
    const hourDropdown = activityLevelToDropdown(newLevel);

    onUpdateLog(member.id, {
      activityLevel: newLevel,
      gameHourDropdown: hourDropdown,
      status: newLevel as any,
      note,
      overseerNotes: note || currentLog?.overseerNotes || '',
      demotionNotice: newLevel === 'under_1h',
    });
  };

  const handleFillAllQuota = (member: Member) => {
    const batTasks = getActiveBattalionTasks(member.battalion, settings);
    const filledTasks: Record<string, number> = {};
    for (const task of batTasks) {
      filledTasks[task.id] = getTaskTargetForMember(task, member, settings);
    }

    onUpdateLog(member.id, {
      tasksProgress: filledTasks,
      activityLevel: 'above_3h',
      gameHourDropdown: '3 hour',
      status: 'above_3h' as any,
      demotionNotice: false,
      note: '',
      overseerNotes: '',
    });
  };

  const handleResetMember = (member: Member) => {
    onUpdateLog(member.id, {
      tasksProgress: {},
      activityLevel: 'under_1h',
      gameHourDropdown: '-',
      status: 'under_1h' as any,
      note: '***No Logs*** (Demotion notice)',
      overseerNotes: '***No Logs*** (Demotion notice)',
      demotionNotice: true,
    });
  };

  if (members.length === 0) {
    return (
      <div className="border border-dashed border-zinc-800 bg-zinc-900/30 rounded-3xl p-10 text-center max-w-xl mx-auto my-12 backdrop-blur-sm">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4">
          <UserPlus className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-white mb-2 font-['Rajdhani',sans-serif]">
          BRIGADE ROSTER IS EMPTY
        </h3>
        <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
          Add brigade personnel (BXO, BSM, Officer) to start tracking daily quotas and in-game activity hours for each shift.
        </p>
        <button
          id="empty-state-add-member-btn"
          onClick={onNavigateToMembers}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-emerald-950/60 border border-emerald-400/30 transition-all hover:scale-105"
        >
          <Plus className="w-4 h-4" />
          <span>Add Brigade Personnel</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  const battalionsToRender: BattalionId[] =
    selectedBattalionFilter === 'all'
      ? ['1st_bat', '2nd_bat', 'commandants_guards']
      : [selectedBattalionFilter];

  return (
    <div className="space-y-6">
      
      {/* Quota Reference Reference Guide Bar (Matches user's screenshots) */}
      <div className="bg-zinc-900/60 border border-white/[0.08] rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.37)] backdrop-blur-2xl">
        <div 
          onClick={() => setShowReferenceGuide(!showReferenceGuide)}
          className="px-5 py-3.5 bg-zinc-950/70 border-b border-white/[0.06] flex items-center justify-between cursor-pointer hover:bg-white/[0.03] transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <Info className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-white tracking-wide uppercase font-['Rajdhani',sans-serif]">
              Battalion Daily Quota & In-Game Activity Reference
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-zinc-400 font-mono hidden sm:inline">
              {showReferenceGuide ? 'Click to collapse' : 'Click to expand'}
            </span>
            {showReferenceGuide ? (
              <ChevronUp className="w-4 h-4 text-zinc-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-zinc-400" />
            )}
          </div>
        </div>

        {showReferenceGuide && (
          <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* 1st Bat Quota Card */}
            <div className="border border-emerald-950 bg-emerald-950/20 rounded-xl p-3">
              <div className="bg-emerald-900/60 text-emerald-200 px-2 py-1 rounded text-[11px] font-bold text-center mb-2">
                1st Battalion Daily Quota Reference
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[11px] text-center border-collapse">
                  <thead>
                    <tr className="border-b border-emerald-800/40 text-emerald-300 font-semibold">
                      <th className="py-1 px-2 text-left">Position</th>
                      <th className="py-1 px-2">Tryouts Daily</th>
                      <th className="py-1 px-2">DMs Daily</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-900/30 font-mono">
                    <tr>
                      <td className="py-1 px-2 text-left font-bold text-white">BXO</td>
                      <td className="py-1 px-2 text-emerald-300 font-bold">8</td>
                      <td className="py-1 px-2 text-emerald-300 font-bold">5</td>
                    </tr>
                    <tr>
                      <td className="py-1 px-2 text-left font-bold text-white">BSM</td>
                      <td className="py-1 px-2 text-emerald-300 font-bold">6</td>
                      <td className="py-1 px-2 text-emerald-300 font-bold">5</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 2nd Bat Quota Card */}
            <div className="border border-sky-950 bg-sky-950/20 rounded-xl p-3">
              <div className="bg-sky-900/60 text-sky-200 px-2 py-1 rounded text-[11px] font-bold text-center mb-2">
                2nd Battalion Daily Quota Reference
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[11px] text-center border-collapse">
                  <thead>
                    <tr className="border-b border-sky-800/40 text-sky-300 font-semibold">
                      <th className="py-1 px-2 text-left">Position</th>
                      <th className="py-1 px-2">Tryouts</th>
                      <th className="py-1 px-2">BMTs</th>
                      <th className="py-1 px-2">SVs</th>
                      <th className="py-1 px-2">DMs</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sky-900/30 font-mono">
                    <tr>
                      <td className="py-1 px-2 text-left font-bold text-white">BXO</td>
                      <td className="py-1 px-2 text-sky-300 font-bold">2</td>
                      <td className="py-1 px-2 text-sky-300 font-bold">2</td>
                      <td className="py-1 px-2 text-sky-300 font-bold">1</td>
                      <td className="py-1 px-2 text-sky-300 font-bold">5</td>
                    </tr>
                    <tr>
                      <td className="py-1 px-2 text-left font-bold text-white">BSM</td>
                      <td className="py-1 px-2 text-sky-300 font-bold">2</td>
                      <td className="py-1 px-2 text-sky-300 font-bold">2</td>
                      <td className="py-1 px-2 text-sky-300 font-bold">1</td>
                      <td className="py-1 px-2 text-sky-300 font-bold">5</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Commandants Guards Quota Card */}
            <div className="border border-purple-950 bg-purple-950/20 rounded-xl p-3">
              <div className="bg-purple-900/60 text-purple-200 px-2 py-1 rounded text-[11px] font-bold text-center mb-2">
                Commandants Guards Daily Quota Reference
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[11px] text-center border-collapse">
                  <thead>
                    <tr className="border-b border-purple-800/40 text-purple-300 font-semibold">
                      <th className="py-1 px-2 text-left">Position</th>
                      <th className="py-1 px-2">Selections</th>
                      <th className="py-1 px-2">DDT Phases</th>
                      <th className="py-1 px-2">CG WI</th>
                      <th className="py-1 px-2">DMs</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-900/30 font-mono">
                    <tr>
                      <td className="py-1 px-2 text-left font-bold text-white">BXO</td>
                      <td className="py-1 px-2 text-purple-300 font-bold">3</td>
                      <td className="py-1 px-2 text-purple-300 font-bold">2</td>
                      <td className="py-1 px-2 text-purple-300 font-bold">2</td>
                      <td className="py-1 px-2 text-purple-300 font-bold">5</td>
                    </tr>
                    <tr>
                      <td className="py-1 px-2 text-left font-bold text-white">BSM</td>
                      <td className="py-1 px-2 text-purple-300 font-bold">3</td>
                      <td className="py-1 px-2 text-purple-300 font-bold">2</td>
                      <td className="py-1 px-2 text-purple-300 font-bold">2</td>
                      <td className="py-1 px-2 text-purple-300 font-bold">5</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Color Legend Bar */}
        {showReferenceGuide && (
          <div className="px-5 py-2.5 bg-zinc-950/90 border-t border-zinc-800/60 flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-400">
            <div className="flex items-center gap-2">
              <span className="font-bold text-zinc-300 font-mono uppercase">In-Game Activity Colors:</span>
              <div className="flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-1">
                  <span>🔴</span> <strong className="text-rose-400">Red</strong> = Under 1 Hour (&lt; 1h)
                </span>
                <span className="flex items-center gap-1">
                  <span>🟡</span> <strong className="text-amber-400">Yellow</strong> = Under 2 Hours (1-2h)
                </span>
                <span className="flex items-center gap-1">
                  <span>🟢</span> <strong className="text-emerald-400">Green</strong> = Under 3 Hours (2-3h)
                </span>
                <span className="flex items-center gap-1">
                  <span>🔵</span> <strong className="text-blue-400">Blue</strong> = Above 3 Hours (&gt; 3h)
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Top Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-zinc-900/50 p-3.5 rounded-2xl border border-white/[0.08] backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
        
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            id="search-members-input"
            type="text"
            placeholder="Search member name, Discord ID, position..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-950/70 border border-white/[0.08] rounded-xl pl-9 pr-4 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50 backdrop-blur-md"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-xs"
            >
              Clear
            </button>
          )}
        </div>

        {/* Quick Batch Actions */}
        <div className="flex items-center gap-2 overflow-x-auto">
          <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider hidden md:inline">
            Batch Activity:
          </span>
          <button
            id="batch-mark-above3h-btn"
            onClick={() => onBulkUpdateStatus(selectedBattalionFilter, 'above_3h')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-xl text-xs font-semibold transition-colors backdrop-blur-md"
            title="Mark all as > 3 Hours in-game"
          >
            <span>🔵 All &gt; 3h</span>
          </button>

          <button
            id="batch-mark-under1h-btn"
            onClick={() => onBulkUpdateStatus(selectedBattalionFilter, 'under_1h')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-semibold transition-colors backdrop-blur-md"
            title="Mark all as < 1 Hour in-game"
          >
            <span>🔴 All &lt; 1h</span>
          </button>

          <button
            id="quick-add-member-btn"
            onClick={onNavigateToMembers}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 border border-white/[0.08] rounded-xl text-xs font-semibold transition-colors ml-auto backdrop-blur-md"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span>Manage Roster</span>
          </button>
        </div>

      </div>

      {/* Battalion Member Lists with Interactive Task Quota Inputs */}
      {battalionsToRender.map((batId) => {
        const batInfo = BATTALIONS[batId];
        const batMembers = filteredMembers.filter((m) => m.battalion === batId);

        if (batMembers.length === 0 && searchQuery) return null;

        return (
          <div
            key={batId}
            className="border border-white/[0.08] bg-zinc-900/40 rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.37)] backdrop-blur-2xl"
          >
            {/* Battalion Header Bar */}
            <div className="px-5 py-3.5 bg-zinc-900/80 border-b border-white/[0.06] flex items-center justify-between backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: batInfo.color }}
                />
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>{batInfo.name}</span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
                      {batMembers.length} personnel
                    </span>
                  </h3>
                  <p className="text-[11px] text-zinc-400">{batInfo.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <button
                  onClick={() => onBulkUpdateStatus(batId, 'above_3h')}
                  className="text-xs text-blue-400 hover:underline hidden sm:inline"
                >
                  Set {batInfo.shortName} to 🔵 &gt; 3h
                </button>
              </div>
            </div>

            {/* Member List Cards */}
            {batMembers.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-500">
                No active personnel found in {batInfo.name}.
              </div>
            ) : (
              <div className="divide-y divide-zinc-800/60">
                {batMembers.map((member) => {
                  const logKey = `${member.id}_${currentDate}`;
                  const log = memberLogs[logKey];
                  const currentLevel: ActivityLevel = resolveActivityLevel(log);
                  const currentTasks: MemberTasksProgress = log?.tasksProgress || {};
                  const targets = getMemberQuotaTarget(member);
                  const noteText = log?.note ?? log?.overseerNotes ?? '';

                  return (
                    <div
                      key={member.id}
                      id={`member-row-${member.id}`}
                      className="p-4 hover:bg-zinc-800/20 transition-colors flex flex-col gap-4"
                    >
                      {/* Top Row: Personnel Info + In-Game Activity Hours Selector + Quick Actions */}
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                        {/* Member Identity */}
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-sm text-zinc-200 flex-shrink-0">
                            {member.name.charAt(0).toUpperCase()}
                          </div>

                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-sm text-white">
                                {member.name}
                              </span>
                              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-zinc-800 text-emerald-400 border border-zinc-700 font-mono font-semibold">
                                {member.position || 'BXO'}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 mt-0.5">
                              {member.discordId ? (
                                <button
                                  onClick={() => handleCopyDiscordTag(member.discordId)}
                                  className="group flex items-center gap-1 text-[11px] font-mono text-zinc-400 hover:text-emerald-400 transition-colors"
                                  title="Click to copy <@ID>"
                                >
                                  <span>&lt;@{member.discordId}&gt;</span>
                                  {copiedId === member.discordId ? (
                                    <Check className="w-3 h-3 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                  )}
                                </button>
                              ) : (
                                <span className="text-[11px] font-mono text-zinc-600">
                                  No Discord ID
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* In-Game Activity Hours Level Selector */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[11px] text-zinc-500 mr-1 font-mono uppercase hidden xl:inline">
                            In-Game Hours:
                          </span>
                          {(['under_1h', 'under_2h', 'under_3h', 'above_3h', 'exempted'] as ActivityLevel[]).map(
                            (lvl) => {
                              const meta = ACTIVITY_META[lvl];
                              const isSelected = currentLevel === lvl;

                              return (
                                <button
                                  key={lvl}
                                  id={`activity-btn-${member.id}-${lvl}`}
                                  onClick={() => handleActivityLevelChange(member, lvl)}
                                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                                    isSelected
                                      ? `${meta.bgClass} ${meta.colorClass} border ${meta.borderClass} shadow-sm ring-1 ring-white/10`
                                      : 'bg-zinc-950/70 hover:bg-zinc-800 text-zinc-400 border border-zinc-800/80 hover:text-zinc-200'
                                  }`}
                                  title={meta.hoursDesc}
                                >
                                  <span>{meta.emoji}</span>
                                  <span>{meta.shortLabel}</span>
                                </button>
                              );
                            }
                          )}
                        </div>

                        {/* 1-Click Quick Preset Actions */}
                        <div className="flex items-center gap-1.5 self-end lg:self-auto">
                          <button
                            id={`fill-all-btn-${member.id}`}
                            onClick={() => handleFillAllQuota(member)}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-semibold transition-colors"
                            title="Auto-fill 100% target for all quota items"
                          >
                            <Zap className="w-3.5 h-3.5" />
                            <span>100% Target</span>
                          </button>

                          <button
                            id={`reset-btn-${member.id}`}
                            onClick={() => handleResetMember(member)}
                            className="p-1.5 hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 rounded-xl border border-zinc-800 transition-colors"
                            title="Reset to 0"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Middle Row: Itemized Task Input Boxes based on Battalion Reference & Dynamic Tasks */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 bg-zinc-950/80 border border-zinc-800/70 rounded-xl">
                        {getActiveBattalionTasks(member.battalion, settings).map((task) => {
                          const targetVal = getTaskTargetForMember(task, member, settings);
                          const currentVal = Number(currentTasks[task.id]) || 0;

                          return (
                            <TaskCounter
                              key={task.id}
                              label={task.name || task.shortLabel}
                              target={targetVal}
                              value={currentVal}
                              onChange={(newVal) => {
                                onUpdateLog(member.id, {
                                  tasksProgress: {
                                    ...(log?.tasksProgress || {}),
                                    [task.id]: newVal,
                                  },
                                });
                              }}
                            />
                          );
                        })}
                      </div>

                      {/* Bottom Row: Note Input & Status Tag */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <div className="text-[11px] font-mono text-zinc-500 whitespace-nowrap">
                          Note / Remark:
                        </div>
                        <input
                          id={`note-input-${member.id}`}
                          type="text"
                          placeholder={
                            currentLevel === 'under_1h'
                              ? '***No Logs*** (Demotion notice)'
                              : currentLevel === 'exempted'
                              ? '***Exempted***'
                              : 'Optional remark (leave blank if normal)...'
                          }
                          value={noteText}
                          onChange={(e) =>
                            onUpdateLog(member.id, {
                              note: e.target.value,
                              overseerNotes: e.target.value,
                            })
                          }
                          className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50"
                        />

                        {/* Quick preset buttons for Note */}
                        <div className="flex items-center gap-1 overflow-x-auto">
                          <button
                            onClick={() =>
                              onUpdateLog(member.id, {
                                note: '***No Logs*** (Demotion notice)',
                                overseerNotes: '***No Logs*** (Demotion notice)',
                                activityLevel: 'under_1h',
                                gameHourDropdown: '-',
                                status: 'under_1h' as any,
                                demotionNotice: true,
                              })
                            }
                            className="px-2 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-lg text-[10px] whitespace-nowrap font-medium"
                          >
                            No Logs
                          </button>

                          <button
                            onClick={() =>
                              onUpdateLog(member.id, {
                                note: '***Exempted***',
                                overseerNotes: '***Exempted***',
                                activityLevel: 'exempted',
                                gameHourDropdown: 'Exempted',
                                status: 'exempted' as any,
                                demotionNotice: false,
                              })
                            }
                            className="px-2 py-1 bg-zinc-700/20 hover:bg-zinc-700/30 text-zinc-300 border border-zinc-600/30 rounded-lg text-[10px] whitespace-nowrap font-medium"
                          >
                            Exempted
                          </button>
                        </div>
                      </div>

                      {/* Demotion Warning Banner if Under 1h / No Logs */}
                      {currentLevel === 'under_1h' && (
                        <div className="flex items-center justify-between gap-2 px-3 py-2 bg-rose-950/40 border border-rose-900/50 rounded-xl text-xs text-rose-300">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                            <span>
                              Demotion notice active (Under 1 hour activity). Highlighted with 🔴 in Discord shift summary.
                            </span>
                          </div>

                          <button
                            onClick={() => handleFillAllQuota(member)}
                            className="text-[11px] font-bold text-rose-300 hover:text-white underline whitespace-nowrap"
                          >
                            Dismiss (Fill Target)
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
