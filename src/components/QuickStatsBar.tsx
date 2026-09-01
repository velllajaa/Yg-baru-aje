import React from 'react';
import { Member, DailyMemberLog, BattalionId } from '../types';
import { BATTALIONS } from '../constants';
import { playTap } from '../utils/audio';
import { resolveActivityLevel } from '../utils/activity';

interface QuickStatsBarProps {
  currentDate: string;
  members: Member[];
  memberLogs: Record<string, DailyMemberLog>;
  selectedBattalionFilter: BattalionId | 'all';
  onFilterChange: (filter: BattalionId | 'all') => void;
}

export const QuickStatsBar: React.FC<QuickStatsBarProps> = ({
  currentDate,
  members,
  memberLogs,
  selectedBattalionFilter,
  onFilterChange,
}) => {
  const activeMembers = members.filter((m) => m.status !== 'inactive');
  const filteredMembers =
    selectedBattalionFilter === 'all'
      ? activeMembers
      : activeMembers.filter((m) => m.battalion === selectedBattalionFilter);

  let above3hCount = 0;
  let under3hCount = 0;
  let under2hCount = 0;
  let under1hCount = 0;
  let exemptedCount = 0;

  for (const m of filteredMembers) {
    const log = memberLogs[`${m.id}_${currentDate}`];
    const lvl = resolveActivityLevel(log);
    if (lvl === 'above_3h') above3hCount++;
    else if (lvl === 'under_3h') under3hCount++;
    else if (lvl === 'under_2h') under2hCount++;
    else if (lvl === 'under_1h') under1hCount++;
    else if (lvl === 'exempted') exemptedCount++;
  }

  const total = filteredMembers.length;
  const activeHoursPercent = total > 0 ? Math.round(((above3hCount + under3hCount + under2hCount) / total) * 100) : 0;

  return (
    <div className="bg-zinc-900/40 border border-white/[0.08] rounded-2xl p-4 mb-6 shadow-[0_4px_24px_rgba(0,0,0,0.3)] backdrop-blur-2xl">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        
        {/* Battalion Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 bg-zinc-950/70 p-1 rounded-xl border border-white/[0.06] backdrop-blur-md">
          <button
            id="filter-all-btn"
            onClick={() => {
              playTap();
              onFilterChange('all');
            }}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              selectedBattalionFilter === 'all'
                ? 'bg-zinc-800 text-white shadow-sm border border-white/[0.1]'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            All Units ({activeMembers.length})
          </button>

          {(Object.keys(BATTALIONS) as BattalionId[]).map((batId) => {
            const bat = BATTALIONS[batId];
            const batMembersCount = activeMembers.filter((m) => m.battalion === batId).length;
            const isSelected = selectedBattalionFilter === batId;

            return (
              <button
                key={batId}
                id={`filter-${batId}-btn`}
                onClick={() => {
                  playTap();
                  onFilterChange(batId);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  isSelected
                    ? `${bat.badgeBg} shadow-sm border border-white/[0.15]`
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <span>{bat.shortName}</span>
                <span className="text-[10px] opacity-75 font-mono">({batMembersCount})</span>
              </button>
            );
          })}
        </div>

        {/* Real-time In-Game Activity Breakdown */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Blue: >3h */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/10 border border-blue-500/25 rounded-xl">
            <span className="text-xs">🔵</span>
            <div>
              <div className="text-xs font-bold text-blue-400 leading-none">{above3hCount}</div>
              <div className="text-[9px] text-blue-400/80 font-medium">&gt; 3 Hours</div>
            </div>
          </div>

          {/* Green: 2-3h */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/25 rounded-xl">
            <span className="text-xs">🟢</span>
            <div>
              <div className="text-xs font-bold text-emerald-400 leading-none">{under3hCount}</div>
              <div className="text-[9px] text-emerald-400/80 font-medium">2 - 3 Hours</div>
            </div>
          </div>

          {/* Yellow: 1-2h */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 border border-amber-500/25 rounded-xl">
            <span className="text-xs">🟡</span>
            <div>
              <div className="text-xs font-bold text-amber-400 leading-none">{under2hCount}</div>
              <div className="text-[9px] text-amber-400/80 font-medium">1 - 2 Hours</div>
            </div>
          </div>

          {/* Red: <1h */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-500/10 border border-rose-500/25 rounded-xl">
            <span className="text-xs">🔴</span>
            <div>
              <div className="text-xs font-bold text-rose-400 leading-none">{under1hCount}</div>
              <div className="text-[9px] text-rose-400/80 font-medium">&lt; 1 Hour</div>
            </div>
          </div>

          {/* White: Exempted */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-800/40 border border-white/[0.08] rounded-xl">
            <span className="text-xs">⚪</span>
            <div>
              <div className="text-xs font-bold text-zinc-300 leading-none">{exemptedCount}</div>
              <div className="text-[9px] text-zinc-400 font-medium">Exempted</div>
            </div>
          </div>

          {/* Active Participation Meter */}
          <div className="pl-3 border-l border-white/[0.08] flex items-center gap-2.5">
            <div className="text-right">
              <div className="text-xs font-bold text-zinc-200 leading-none font-mono">
                {activeHoursPercent}%
              </div>
              <div className="text-[9px] text-zinc-400">Active Rate</div>
            </div>
            <div className="w-10 h-2 bg-zinc-800 rounded-full overflow-hidden border border-white/[0.05]">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  activeHoursPercent >= 80
                    ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]'
                    : activeHoursPercent >= 50
                    ? 'bg-amber-400'
                    : 'bg-rose-500'
                }`}
                style={{ width: `${activeHoursPercent}%` }}
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
