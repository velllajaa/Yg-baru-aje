import React, { useState } from 'react';
import { 
  BarChart3, 
  User, 
  Building2, 
  PieChart as PieIcon, 
  TrendingUp, 
  Award, 
  Flame, 
  Calendar,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock,
  Search,
  Filter
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid 
} from 'recharts';
import { Member, DailyMemberLog, BattalionDailyReportData, BattalionId, ActivityLevel } from '../types';
import { BATTALIONS, ACTIVITY_META } from '../constants';
import { getLastNDays, formatShortDate } from '../utils/date';
import { resolveActivityLevel } from '../utils/activity';

interface AnalyticsDashboardProps {
  currentDate: string;
  members: Member[];
  memberLogs: Record<string, DailyMemberLog>;
  battalionReports: Record<string, BattalionDailyReportData>;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  currentDate,
  members,
  memberLogs,
  battalionReports,
}) => {
  const [activeTab, setActiveTab] = useState<'overall' | 'battalions' | 'individual'>('overall');
  const [selectedMemberId, setSelectedMemberId] = useState<string>(members[0]?.id || '');
  const [timeRange, setTimeRange] = useState<number>(14);

  const activeMembers = members.filter((m) => m.status !== 'inactive');
  const dateList = getLastNDays(timeRange, currentDate);

  // -------------------------------------------------------------
  // 1. Overall Brigade Metrics
  // -------------------------------------------------------------
  const overallTimelineData = dateList.map((d) => {
    let completed = 0;
    let partial = 0;
    let noLogs = 0;
    let exempted = 0;

    for (const m of activeMembers) {
      const log = memberLogs[`${m.id}_${d}`];
      const st = log?.status || 'no_logs';
      if (st === 'completed') completed++;
      else if (st === 'partial') partial++;
      else if (st === 'no_logs') noLogs++;
      else if (st === 'exempted' || (st as string) === 'loa') exempted++;
    }

    const r1 = battalionReports[`1st_bat_${d}`]?.firstBat;
    const r2 = battalionReports[`2nd_bat_${d}`]?.secondBat;
    const rc = battalionReports[`commandants_guards_${d}`]?.commandantsGuards;

    const total1stOps = (r1?.tryouts || 0) + (r1?.recruited || 0) + (r1?.events || 0);
    const total2ndOps = (r2?.supervisions || 0) + (r2?.bmt || 0) + (r2?.events || 0);
    const totalCgOps = (rc?.recruited || 0) + (rc?.selections || 0) + (rc?.events || 0) + (rc?.ddtPhases || 0);

    return {
      date: d,
      shortDate: formatShortDate(d),
      completed,
      partial,
      noLogs,
      exempted,
      totalBrigadeOps: total1stOps + total2ndOps + totalCgOps,
      '1st_Bat_Ops': total1stOps,
      '2nd_Bat_Ops': total2ndOps,
      CG_Ops: totalCgOps,
    };
  });

  // Current Day Status Breakdown for Pie Chart
  let currentDayStats: Record<ActivityLevel, number> = {
    above_3h: 0,
    under_3h: 0,
    under_2h: 0,
    under_1h: 0,
    exempted: 0,
  };

  for (const m of activeMembers) {
    const log = memberLogs[`${m.id}_${currentDate}`];
    const lvl = resolveActivityLevel(log);
    currentDayStats[lvl] = (currentDayStats[lvl] || 0) + 1;
  }

  const pieData = [
    { name: '> 3h 🔵', value: currentDayStats.above_3h, color: '#3b82f6' },
    { name: '2 - 3h 🟢', value: currentDayStats.under_3h, color: '#10b981' },
    { name: '1 - 2h 🟡', value: currentDayStats.under_2h, color: '#f59e0b' },
    { name: '< 1h 🔴', value: currentDayStats.under_1h, color: '#f43f5e' },
    { name: 'Exempted ⚪', value: currentDayStats.exempted, color: '#a1a1aa' },
  ].filter((item) => item.value > 0);

  // -------------------------------------------------------------
  // 2. Battalion Comparison Data
  // -------------------------------------------------------------
  const battalionComparisonData = (Object.keys(BATTALIONS) as BattalionId[]).map((batId) => {
    const batInfo = BATTALIONS[batId];
    const batMembers = activeMembers.filter((m) => m.battalion === batId);

    let completed = 0;
    let totalLogs = 0;

    for (const d of dateList) {
      for (const m of batMembers) {
        totalLogs++;
        const log = memberLogs[`${m.id}_${d}`];
        if (log?.status === 'completed' || log?.status === 'exempted') {
          completed++;
        }
      }
    }

    const complianceRate = totalLogs > 0 ? Math.round((completed / totalLogs) * 100) : 0;

    // Total activities across range
    let totalOps = 0;
    for (const d of dateList) {
      if (batId === '1st_bat') {
        const r = battalionReports[`1st_bat_${d}`]?.firstBat;
        totalOps += (r?.tryouts || 0) + (r?.recruited || 0) + (r?.events || 0);
      } else if (batId === '2nd_bat') {
        const r = battalionReports[`2nd_bat_${d}`]?.secondBat;
        totalOps += (r?.supervisions || 0) + (r?.bmt || 0) + (r?.events || 0);
      } else if (batId === 'commandants_guards') {
        const r = battalionReports[`commandants_guards_${d}`]?.commandantsGuards;
        totalOps += (r?.recruited || 0) + (r?.selections || 0) + (r?.events || 0) + (r?.ddtPhases || 0);
      }
    }

    return {
      name: batInfo.shortName,
      fullName: batInfo.name,
      membersCount: batMembers.length,
      complianceRate,
      totalOps,
      fillColor: batInfo.color,
    };
  });

  // -------------------------------------------------------------
  // 3. Individual Member Analytics
  // -------------------------------------------------------------
  const selectedMember = activeMembers.find((m) => m.id === selectedMemberId) || activeMembers[0];

  const individualTimelineData = dateList.map((d) => {
    if (!selectedMember) return { date: d, shortDate: formatShortDate(d), quota: 0, statusScore: 0 };
    const log = memberLogs[`${selectedMember.id}_${d}`];
    const status = log?.status || 'no_logs';

    // Status score for graph: Completed=100, Exempted=100, Partial=50, No Logs=0
    let statusScore = 0;
    if (status === 'completed') statusScore = 100;
    else if (status === 'exempted' || (status as string) === 'loa') statusScore = 100;
    else if (status === 'partial') statusScore = 50;

    return {
      date: d,
      shortDate: formatShortDate(d),
      quotaCount: log?.quotaCount || 0,
      targetQuota: selectedMember.dailyQuotaTarget,
      statusScore,
      status,
      note: log?.note || '',
    };
  });

  // Calculate Streak for individual
  let currentStreak = 0;
  if (selectedMember) {
    for (let i = dateList.length - 1; i >= 0; i--) {
      const d = dateList[i];
      const log = memberLogs[`${selectedMember.id}_${d}`];
      if (log?.status === 'completed') {
        currentStreak++;
      } else if (log?.status === 'exempted' || (log?.status as string) === 'loa') {
        // Exempted preserves streak
        continue;
      } else {
        break;
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Analytics Tabs and Time Range Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 bg-zinc-900/60 border border-white/[0.08] rounded-2xl backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.37)]">
        <div className="flex items-center gap-2 bg-zinc-950/70 p-1 rounded-xl border border-white/[0.08] backdrop-blur-md">
          <button
            id="analytics-tab-overall"
            onClick={() => setActiveTab('overall')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'overall'
                ? 'bg-zinc-800 text-white shadow border border-white/[0.1]'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
            <span>1. Overall Brigade</span>
          </button>

          <button
            id="analytics-tab-battalions"
            onClick={() => setActiveTab('battalions')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'battalions'
                ? 'bg-zinc-800 text-white shadow border border-white/[0.1]'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-sky-400" />
            <span>2. By Battalion</span>
          </button>

          <button
            id="analytics-tab-individual"
            onClick={() => setActiveTab('individual')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'individual'
                ? 'bg-zinc-800 text-white shadow border border-white/[0.1]'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <User className="w-3.5 h-3.5 text-purple-400" />
            <span>3. Individual Personnel</span>
          </button>
        </div>

        {/* Time range selector */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-zinc-400 font-mono">Timeframe:</span>
          {[7, 14, 30].map((days) => (
            <button
              key={days}
              id={`analytics-range-${days}-btn`}
              onClick={() => setTimeRange(days)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                timeRange === days
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm backdrop-blur-md'
                  : 'text-zinc-400 hover:text-zinc-200 bg-zinc-950/70 border border-white/[0.08]'
              }`}
            >
              {days}D
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: OVERALL BRIGADE GRAPH */}
      {/* ========================================================================= */}
      {activeTab === 'overall' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Area Chart: Overall Quota Compliance Trend */}
            <div className="lg:col-span-2 border border-white/[0.08] bg-zinc-900/40 rounded-2xl p-5 shadow-[0_8px_32px_rgba(0,0,0,0.37)] backdrop-blur-2xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-bold text-white text-sm flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    <span>Brigade Quota Completion Trend ({timeRange} Days)</span>
                  </h4>
                  <p className="text-[11px] text-zinc-400">
                    Brigade personnel completing daily quotas vs no logs
                  </p>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={overallTimelineData}>
                    <defs>
                      <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="colorNoLogs" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="shortDate" stroke="#71717a" fontSize={11} />
                    <YAxis stroke="#71717a" fontSize={11} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'rgba(24, 24, 27, 0.85)', backdropFilter: 'blur(16px)', borderColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '12px', fontSize: '12px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Area type="monotone" dataKey="completed" name="Completed 🟢" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorCompleted)" />
                    <Area type="monotone" dataKey="noLogs" name="No Logs 🔴" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorNoLogs)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Donut Chart: Current Day Status Distribution */}
            <div className="border border-white/[0.08] bg-zinc-900/40 rounded-2xl p-5 shadow-[0_8px_32px_rgba(0,0,0,0.37)] backdrop-blur-2xl flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-white text-sm flex items-center gap-2 mb-1">
                  <PieIcon className="w-4 h-4 text-sky-400" />
                  <span>Today's Status Ratio</span>
                </h4>
                <p className="text-[11px] text-zinc-400 mb-4">
                  Personnel status breakdown for today's shift
                </p>

                {pieData.length === 0 ? (
                  <div className="h-48 flex items-center justify-center text-xs text-zinc-500">
                    No active members logged yet.
                  </div>
                ) : (
                  <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          innerRadius={50}
                          outerRadius={75}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px', fontSize: '12px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Legend Badges */}
              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-zinc-800">
                {pieData.map((p) => (
                  <div key={p.name} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                    <span className="text-zinc-300 truncate">{p.name}:</span>
                    <strong className="text-white font-mono">{p.value}</strong>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Bar Chart: All Battalion Operations Comparison */}
          <div className="border border-zinc-800/80 bg-zinc-900/30 rounded-2xl p-5 shadow-sm">
            <h4 className="font-bold text-white text-sm flex items-center gap-2 mb-1">
              <Building2 className="w-4 h-4 text-emerald-400" />
              <span>Battalion Activity Volume Comparison ({timeRange} Days)</span>
            </h4>
            <p className="text-[11px] text-zinc-400 mb-4">
              Total operations comparison between 1st Bat, 2nd Bat, and Commandants Guards
            </p>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={overallTimelineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="shortDate" stroke="#71717a" fontSize={11} />
                  <YAxis stroke="#71717a" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="1st_Bat_Ops" name="1st Battalion (Tryouts/Recruits/Events)" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="2nd_Bat_Ops" name="2nd Battalion (Supervisions/BMT/Events)" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="CG_Ops" name="Commandants Guards (Recruits/Selections/Events/DDT)" fill="#a855f7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: BATTALIONS COMPARISON GRAPH */}
      {/* ========================================================================= */}
      {activeTab === 'battalions' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {battalionComparisonData.map((b) => (
              <div
                key={b.name}
                className="border border-zinc-800/80 bg-zinc-900/40 rounded-2xl p-5 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: b.fillColor }} />
                      <h4 className="font-bold text-sm text-white">{b.fullName}</h4>
                    </div>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                      {b.membersCount} Staff
                    </span>
                  </div>

                  <div className="space-y-3 mt-4">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-zinc-400">Quota Compliance:</span>
                        <span className="font-bold text-white font-mono">{b.complianceRate}%</span>
                      </div>
                      <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${b.complianceRate}%`,
                            backgroundColor: b.fillColor,
                          }}
                        />
                      </div>
                    </div>

                    <div className="flex justify-between items-center py-2 border-t border-zinc-800 text-xs">
                      <span className="text-zinc-400">Total Ops Logged:</span>
                      <strong className="text-white font-mono text-sm">{b.totalOps}</strong>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-zinc-800/60 text-[11px] text-zinc-500">
                  Data calculated across past {timeRange} days.
                </div>
              </div>
            ))}
          </div>

          {/* Bar Chart: Compliance Comparison */}
          <div className="border border-zinc-800/80 bg-zinc-900/30 rounded-2xl p-5 shadow-sm">
            <h4 className="font-bold text-white text-sm mb-1">
              Battalion Compliance & Operational Output Comparison
            </h4>
            <p className="text-[11px] text-zinc-400 mb-4">
              Member quota compliance rate and total operations output per battalion
            </p>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={battalionComparisonData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis type="number" stroke="#71717a" fontSize={11} domain={[0, 100]} />
                  <YAxis type="category" dataKey="name" stroke="#71717a" fontSize={11} width={80} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="complianceRate" name="Compliance Rate (%)" fill="#10b981" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="totalOps" name="Total Operations Count" fill="#38bdf8" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: INDIVIDUAL MEMBER GRAPH */}
      {/* ========================================================================= */}
      {activeTab === 'individual' && (
        <div className="space-y-6">
          {activeMembers.length === 0 ? (
            <div className="p-8 text-center bg-zinc-900/30 rounded-2xl border border-zinc-800 text-xs text-zinc-400">
              No personnel registered yet. Add personnel in the Staff Roster tab.
            </div>
          ) : (
            <>
              {/* Member Selector Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl">
                <div className="flex items-center gap-3">
                  <label htmlFor="member-select-dropdown" className="text-xs font-semibold text-zinc-400">Select Member:</label>
                  <select
                    id="member-select-dropdown"
                    value={selectedMember?.id || ''}
                    onChange={(e) => setSelectedMemberId(e.target.value)}
                    className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-200 font-semibold focus:outline-none focus:border-emerald-500"
                  >
                    {activeMembers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({BATTALIONS[m.battalion]?.shortName || m.battalion}) - {m.position}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedMember && (
                  <div className="flex items-center gap-4 text-xs font-mono">
                    <div className="flex items-center gap-1.5 text-amber-400">
                      <Flame className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <span>Streak: <strong>{currentStreak} Days</strong></span>
                    </div>
                    <div className="text-zinc-400">
                      Target: <strong className="text-white">{selectedMember.dailyQuotaTarget} / day</strong>
                    </div>
                  </div>
                )}
              </div>

              {selectedMember && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Member Historical Quota Line Chart */}
                  <div className="lg:col-span-2 border border-zinc-800/80 bg-zinc-900/30 rounded-2xl p-5 shadow-sm">
                    <h4 className="font-bold text-white text-sm mb-1 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                      <span>{selectedMember.name}'s Daily Performance ({timeRange} Days)</span>
                    </h4>
                    <p className="text-[11px] text-zinc-400 mb-4">
                      Daily quota achievement and performance status graph (🟢 100%, 🟡 50%, 🔴 0%)
                    </p>

                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={individualTimelineData}>
                          <defs>
                            <linearGradient id="colorIndScore" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
                              <stop offset="95%" stopColor="#a855f7" stopOpacity={0.0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                          <XAxis dataKey="shortDate" stroke="#71717a" fontSize={11} />
                          <YAxis stroke="#71717a" fontSize={11} domain={[0, 100]} />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px', fontSize: '12px' }}
                          />
                          <Legend wrapperStyle={{ fontSize: '12px' }} />
                          <Area type="monotone" dataKey="statusScore" name="Performance Score %" stroke="#a855f7" strokeWidth={2} fillOpacity={1} fill="url(#colorIndScore)" />
                          <Bar dataKey="quotaCount" name="Quotas Done" fill="#10b981" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Individual Profile & Recent Shift Log Notes */}
                  <div className="border border-zinc-800/80 bg-zinc-900/30 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-4 pb-3 border-b border-zinc-800">
                        <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-white text-base">
                          {selectedMember.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-bold text-white text-sm">{selectedMember.name}</h4>
                          <span className="text-[11px] text-zinc-400">{selectedMember.position}</span>
                        </div>
                      </div>

                      <h5 className="text-xs font-semibold text-zinc-300 mb-2">Recent Shift Notes:</h5>
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {individualTimelineData.slice(-6).reverse().map((item) => {
                          const meta = ACTIVITY_META[item.status as ActivityLevel] || ACTIVITY_META.under_1h;
                          return (
                            <div
                              key={item.date}
                              className="p-2 bg-zinc-950/60 rounded-xl border border-zinc-800/80 text-[11px] flex items-center justify-between gap-2"
                            >
                              <div className="flex items-center gap-2">
                                <span>{meta?.emoji || '⚪'}</span>
                                <span className="font-mono text-zinc-400">{item.shortDate}:</span>
                                <span className="text-zinc-200 truncate max-w-[140px]">
                                  {item.note || meta?.label || 'No notes'}
                                </span>
                              </div>
                              <span className="font-mono text-[10px] text-zinc-500 font-bold">
                                {item.quotaCount} done
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-zinc-800 text-[11px] font-mono text-zinc-500 flex justify-between">
                      <span>Discord:</span>
                      <span className="text-zinc-300">
                        {selectedMember.discordId ? `<@${selectedMember.discordId}>` : 'None'}
                      </span>
                    </div>
                  </div>

                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
