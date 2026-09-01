import React, { useState } from 'react';
import { 
  Building2, 
  Target, 
  UserPlus, 
  Calendar, 
  ShieldCheck, 
  GraduationCap, 
  Award, 
  Zap, 
  TrendingUp, 
  Plus, 
  Minus,
  Sparkles,
  FileText,
  Clock,
  CheckCircle,
  BarChart2,
  Users,
  Shield,
  Layers,
  CheckCircle2,
  RefreshCw,
  Info
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend,
  BarChart,
  Bar
} from 'recharts';
import { 
  BattalionId, 
  BattalionDailyReportData, 
  FirstBatReport, 
  SecondBatReport, 
  CommandantsGuardsReport,
  Member,
  DailyMemberLog 
} from '../types';
import { BATTALIONS } from '../constants';
import { getLastNDays, formatShortDate } from '../utils/date';

interface BattalionReportsProps {
  currentDate: string;
  reports?: Record<string, BattalionDailyReportData>;
  battalionReports?: Record<string, BattalionDailyReportData>;
  onSaveReport?: (report: BattalionDailyReportData) => void;
  onUpdateReport?: (battalionId: BattalionId, date: string, updates: Partial<BattalionDailyReportData>) => void;
  members?: Member[];
  memberLogs?: Record<string, DailyMemberLog>;
  selectedBattalionFilter?: BattalionId | 'all';
  onFilterChange?: (filter: BattalionId | 'all') => void;
}

export const BattalionReports: React.FC<BattalionReportsProps> = ({
  currentDate,
  reports,
  battalionReports,
  onSaveReport,
  onUpdateReport,
  members = [],
  memberLogs = {},
  selectedBattalionFilter = 'all',
  onFilterChange,
}) => {
  const [selectedBatTab, setSelectedBatTab] = useState<BattalionId>('1st_bat');
  const [timeRangeDays, setTimeRangeDays] = useState<number>(7);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);

  // Safe fallback for reports dictionary
  const allReports = reports || battalionReports || {};

  // Retrieve current report data for date
  const rep1stKey = `1st_bat_${currentDate}`;
  const rep2ndKey = `2nd_bat_${currentDate}`;
  const repCgKey = `commandants_guards_${currentDate}`;

  const rep1st: FirstBatReport = allReports[rep1stKey]?.firstBat || { tryouts: 0, recruited: 0, events: 0, notes: '' };
  const rep2nd: SecondBatReport = allReports[rep2ndKey]?.secondBat || { supervisions: 0, bmt: 0, events: 0, notes: '' };
  const repCg: CommandantsGuardsReport = allReports[repCgKey]?.commandantsGuards || { recruited: 0, selections: 0, events: 0, ddtPhases: 0, notes: '' };

  const officer1st = allReports[rep1stKey]?.officerInCharge || '';
  const officer2nd = allReports[rep2ndKey]?.officerInCharge || '';
  const officerCg = allReports[repCgKey]?.officerInCharge || '';

  // Unified save handler
  const handleSave = (batId: BattalionId, updates: Partial<BattalionDailyReportData>) => {
    const key = `${batId}_${currentDate}`;
    const existing = allReports[key] || {
      id: key,
      battalionId: batId,
      date: currentDate,
      updatedAt: new Date().toISOString(),
    };

    const updatedReport: BattalionDailyReportData = {
      ...existing,
      ...updates,
      id: key,
      battalionId: batId,
      date: currentDate,
      updatedAt: new Date().toISOString(),
    };

    if (onSaveReport) {
      onSaveReport(updatedReport);
    }
    if (onUpdateReport) {
      onUpdateReport(batId, currentDate, updates);
    }

    setSaveSuccessNotice(batId);
    setTimeout(() => setSaveSuccessNotice(null), 2000);
  };

  const handleUpdate1stBat = (key: keyof FirstBatReport, value: number | string) => {
    const updated: FirstBatReport = {
      ...rep1st,
      [key]: value,
    };
    handleSave('1st_bat', {
      firstBat: updated,
      officerInCharge: officer1st,
    });
  };

  const handleUpdate2ndBat = (key: keyof SecondBatReport, value: number | string) => {
    const updated: SecondBatReport = {
      ...rep2nd,
      [key]: value,
    };
    handleSave('2nd_bat', {
      secondBat: updated,
      officerInCharge: officer2nd,
    });
  };

  const handleUpdateCG = (key: keyof CommandantsGuardsReport, value: number | string) => {
    const updated: CommandantsGuardsReport = {
      ...repCg,
      [key]: value,
    };
    handleSave('commandants_guards', {
      commandantsGuards: updated,
      officerInCharge: officerCg,
    });
  };

  // Helper: Autofill / calculate stats directly from daily personnel logs
  const handleAutofillFromPersonnelLogs = (batId: BattalionId) => {
    const batMembers = members.filter((m) => m.battalion === batId && m.status !== 'inactive');
    
    if (batId === '1st_bat') {
      let sumTryouts = 0;
      batMembers.forEach((m) => {
        const log = memberLogs[`${m.id}_${currentDate}`];
        sumTryouts += (log?.tasksProgress?.tryouts || 0);
      });
      handleSave('1st_bat', {
        firstBat: {
          ...rep1st,
          tryouts: sumTryouts > 0 ? sumTryouts : rep1st.tryouts,
        },
      });
    } else if (batId === '2nd_bat') {
      let sumBmts = 0;
      let sumSvs = 0;
      batMembers.forEach((m) => {
        const log = memberLogs[`${m.id}_${currentDate}`];
        sumBmts += (log?.tasksProgress?.bmts || 0);
        sumSvs += (log?.tasksProgress?.svs || 0);
      });
      handleSave('2nd_bat', {
        secondBat: {
          ...rep2nd,
          bmt: sumBmts > 0 ? sumBmts : rep2nd.bmt,
          supervisions: sumSvs > 0 ? sumSvs : rep2nd.supervisions,
        },
      });
    } else if (batId === 'commandants_guards') {
      let sumSelections = 0;
      let sumDdt = 0;
      batMembers.forEach((m) => {
        const log = memberLogs[`${m.id}_${currentDate}`];
        sumSelections += (log?.tasksProgress?.selections || 0);
        sumDdt += (log?.tasksProgress?.ddtPhases || 0);
      });
      handleSave('commandants_guards', {
        commandantsGuards: {
          ...repCg,
          selections: sumSelections > 0 ? sumSelections : repCg.selections,
          ddtPhases: sumDdt > 0 ? sumDdt : repCg.ddtPhases,
        },
      });
    }
  };

  // Generate historical data for graphs
  const dateList = getLastNDays(timeRangeDays, currentDate);
  const historyData = dateList.map((d) => {
    const r1 = allReports[`1st_bat_${d}`]?.firstBat;
    const r2 = allReports[`2nd_bat_${d}`]?.secondBat;
    const rc = allReports[`commandants_guards_${d}`]?.commandantsGuards;

    return {
      date: d,
      shortDate: formatShortDate(d),
      // 1st Bat
      '1st_tryouts': r1?.tryouts || 0,
      '1st_recruited': r1?.recruited || 0,
      '1st_events': r1?.events || 0,
      // 2nd Bat
      '2nd_supervisions': r2?.supervisions || 0,
      '2nd_bmt': r2?.bmt || 0,
      '2nd_events': r2?.events || 0,
      // CG
      cg_recruited: rc?.recruited || 0,
      cg_selections: rc?.selections || 0,
      cg_events: rc?.events || 0,
      cg_ddtPhases: rc?.ddtPhases || 0,
    };
  });

  // Calculate totals for quick summary banner
  const total1BnOps = rep1st.tryouts + rep1st.recruited + rep1st.events;
  const total2BnOps = rep2nd.supervisions + rep2nd.bmt + rep2nd.events;
  const totalCgOps = repCg.recruited + repCg.selections + repCg.events + repCg.ddtPhases;
  const grandTotalOps = total1BnOps + total2BnOps + totalCgOps;

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* Top Banner / Explanation & Controls */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-5 bg-zinc-900/60 border border-white/[0.08] rounded-2xl backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.37)]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Building2 className="w-4 h-4" />
            </span>
            <h2 className="text-base font-bold text-white font-['Rajdhani',sans-serif] uppercase tracking-wide">
              Battalion Shift Reports & Daily Operations
            </h2>
            <span className="text-[11px] px-2 py-0.5 rounded-md font-mono bg-zinc-800/80 text-zinc-300 border border-white/[0.08] backdrop-blur-md">
              {currentDate}
            </span>
          </div>
          <p className="text-xs text-zinc-400 max-w-2xl">
            Log official shift operations, tryouts, supervisions, selections, and training phases for each battalion unit. Real-time synced and linked with Discord shift outputs.
          </p>
        </div>

        {/* Global Summary Badge & Time Range Selector */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="px-3 py-1.5 bg-zinc-950/70 border border-white/[0.08] rounded-xl flex items-center gap-2 backdrop-blur-md">
            <span className="text-xs text-zinc-400">Total Shift Ops:</span>
            <span className="text-xs font-mono font-bold text-emerald-400">{grandTotalOps} Activities</span>
          </div>

          <div className="flex items-center gap-1.5 bg-zinc-950/70 p-1 rounded-xl border border-white/[0.08] backdrop-blur-md">
            <span className="text-[11px] text-zinc-400 font-mono px-2">Trend:</span>
            {[7, 14, 30].map((days) => (
              <button
                key={days}
                id={`report-range-${days}-btn`}
                onClick={() => setTimeRangeDays(days)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                  timeRangeDays === days
                    ? 'bg-zinc-800 text-emerald-400 border border-emerald-500/40 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
                }`}
              >
                {days}D
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Battalion Report Input Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ================= 1st Battalion ================= */}
        <div className="border border-red-500/30 bg-zinc-900/50 rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.37)] backdrop-blur-2xl flex flex-col justify-between hover:border-red-500/50 transition-all">
          <div>
            {/* Card Header */}
            <div className="p-4 bg-red-950/40 border-b border-red-500/20 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 flex items-center justify-center font-bold font-mono text-xs">
                  1BN
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white font-['Rajdhani',sans-serif] uppercase">1st Battalion</h3>
                  <p className="text-[11px] text-red-400/80 font-mono">1B BRIGCOMM • Tryouts & Recruits</p>
                </div>
              </div>

              <button
                onClick={() => handleAutofillFromPersonnelLogs('1st_bat')}
                title="Autofill from personnel logs"
                className="flex items-center gap-1 text-[10px] font-mono px-2 py-1 rounded bg-red-500/10 text-red-300 hover:bg-red-500/20 border border-red-500/30 transition-colors"
              >
                <RefreshCw className="w-2.5 h-2.5" />
                <span>Autofill</span>
              </button>
            </div>

            {/* Inputs Body */}
            <div className="p-5 space-y-4">
              
              {/* Field 1: Tryouts */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label htmlFor="1st-tryouts-input" className="font-semibold text-zinc-200 flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-red-400" />
                    <span>1. Tryouts Hosted</span>
                  </label>
                  <span className="text-[11px] font-mono text-zinc-400">Sessions</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    id="1st-tryouts-minus"
                    onClick={() => handleUpdate1stBat('tryouts', Math.max(0, rep1st.tryouts - 1))}
                    className="w-8 h-8 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 flex items-center justify-center text-sm font-bold active:scale-95 transition-all"
                  >
                    -
                  </button>
                  <input
                    id="1st-tryouts-input"
                    type="number"
                    min="0"
                    value={rep1st.tryouts}
                    onChange={(e) => handleUpdate1stBat('tryouts', Math.max(0, parseInt(e.target.value) || 0))}
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-center font-mono font-bold text-red-300 focus:outline-none focus:border-red-500/50 text-sm"
                  />
                  <button
                    id="1st-tryouts-plus"
                    onClick={() => handleUpdate1stBat('tryouts', rep1st.tryouts + 1)}
                    className="w-8 h-8 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 flex items-center justify-center text-sm font-bold active:scale-95 transition-all"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Field 2: Recruited */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label htmlFor="1st-recruited-input" className="font-semibold text-zinc-200 flex items-center gap-1.5">
                    <UserPlus className="w-3.5 h-3.5 text-red-400" />
                    <span>2. Recruited Cadets</span>
                  </label>
                  <span className="text-[11px] font-mono text-zinc-400">Cadets</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    id="1st-recruited-minus"
                    onClick={() => handleUpdate1stBat('recruited', Math.max(0, rep1st.recruited - 1))}
                    className="w-8 h-8 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 flex items-center justify-center text-sm font-bold active:scale-95 transition-all"
                  >
                    -
                  </button>
                  <input
                    id="1st-recruited-input"
                    type="number"
                    min="0"
                    value={rep1st.recruited}
                    onChange={(e) => handleUpdate1stBat('recruited', Math.max(0, parseInt(e.target.value) || 0))}
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-center font-mono font-bold text-red-300 focus:outline-none focus:border-red-500/50 text-sm"
                  />
                  <button
                    id="1st-recruited-plus"
                    onClick={() => handleUpdate1stBat('recruited', rep1st.recruited + 1)}
                    className="w-8 h-8 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 flex items-center justify-center text-sm font-bold active:scale-95 transition-all"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Field 3: Events */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label htmlFor="1st-events-input" className="font-semibold text-zinc-200 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-red-400" />
                    <span>3. Events / Trainings</span>
                  </label>
                  <span className="text-[11px] font-mono text-zinc-400">Events</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    id="1st-events-minus"
                    onClick={() => handleUpdate1stBat('events', Math.max(0, rep1st.events - 1))}
                    className="w-8 h-8 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 flex items-center justify-center text-sm font-bold active:scale-95 transition-all"
                  >
                    -
                  </button>
                  <input
                    id="1st-events-input"
                    type="number"
                    min="0"
                    value={rep1st.events}
                    onChange={(e) => handleUpdate1stBat('events', Math.max(0, parseInt(e.target.value) || 0))}
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-center font-mono font-bold text-red-300 focus:outline-none focus:border-red-500/50 text-sm"
                  />
                  <button
                    id="1st-events-plus"
                    onClick={() => handleUpdate1stBat('events', rep1st.events + 1)}
                    className="w-8 h-8 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 flex items-center justify-center text-sm font-bold active:scale-95 transition-all"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Officer In Charge */}
              <div className="space-y-1 pt-1">
                <label htmlFor="1st-officer-input" className="text-[11px] font-medium text-zinc-400">Officer In Charge (OIC):</label>
                <input
                  id="1st-officer-input"
                  type="text"
                  placeholder="e.g. BXO Vanguard Alpha"
                  value={officer1st}
                  onChange={(e) => handleSave('1st_bat', { officerInCharge: e.target.value, firstBat: rep1st })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-red-500/50"
                />
              </div>

              {/* Notes */}
              <div className="space-y-1 pt-1">
                <label htmlFor="1st-notes-input" className="text-[11px] font-medium text-zinc-400">Shift Notes / Highlights:</label>
                <input
                  id="1st-notes-input"
                  type="text"
                  placeholder="e.g. Tryouts hosted at 14:00 & 18:00 AEST"
                  value={rep1st.notes || ''}
                  onChange={(e) => handleUpdate1stBat('notes', e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-red-500/50"
                />
              </div>
            </div>
          </div>

          {/* Subtotal Footer */}
          <div className="p-3 bg-zinc-950/80 border-t border-zinc-800 text-[11px] font-mono text-zinc-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-400"></span>
              Total 1BN Ops:
            </span>
            <span className="font-bold text-red-400">
              {total1BnOps} Activities
            </span>
          </div>
        </div>

        {/* ================= 2nd Battalion ================= */}
        <div className="border border-blue-500/30 bg-zinc-900/40 rounded-2xl overflow-hidden shadow-lg shadow-blue-950/20 flex flex-col justify-between hover:border-blue-500/50 transition-all">
          <div>
            {/* Card Header */}
            <div className="p-4 bg-blue-950/40 border-b border-blue-500/20 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-500/40 text-blue-400 flex items-center justify-center font-bold font-mono text-xs">
                  2BN
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white font-['Rajdhani',sans-serif] uppercase">2nd Battalion</h3>
                  <p className="text-[11px] text-blue-400/80 font-mono">2B BRIGCOMM • Supervisions & BMT</p>
                </div>
              </div>

              <button
                onClick={() => handleAutofillFromPersonnelLogs('2nd_bat')}
                title="Autofill from personnel logs"
                className="flex items-center gap-1 text-[10px] font-mono px-2 py-1 rounded bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 border border-blue-500/30 transition-colors"
              >
                <RefreshCw className="w-2.5 h-2.5" />
                <span>Autofill</span>
              </button>
            </div>

            {/* Inputs Body */}
            <div className="p-5 space-y-4">
              
              {/* Field 1: Supervisions */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label htmlFor="2nd-supervisions-input" className="font-semibold text-zinc-200 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                    <span>1. Supervisions (SV)</span>
                  </label>
                  <span className="text-[11px] font-mono text-zinc-400">Shifts</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    id="2nd-supervisions-minus"
                    onClick={() => handleUpdate2ndBat('supervisions', Math.max(0, rep2nd.supervisions - 1))}
                    className="w-8 h-8 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 flex items-center justify-center text-sm font-bold active:scale-95 transition-all"
                  >
                    -
                  </button>
                  <input
                    id="2nd-supervisions-input"
                    type="number"
                    min="0"
                    value={rep2nd.supervisions}
                    onChange={(e) => handleUpdate2ndBat('supervisions', Math.max(0, parseInt(e.target.value) || 0))}
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-center font-mono font-bold text-blue-300 focus:outline-none focus:border-blue-500/50 text-sm"
                  />
                  <button
                    id="2nd-supervisions-plus"
                    onClick={() => handleUpdate2ndBat('supervisions', rep2nd.supervisions + 1)}
                    className="w-8 h-8 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 flex items-center justify-center text-sm font-bold active:scale-95 transition-all"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Field 2: Basic Military Training (BMT) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label htmlFor="2nd-bmt-input" className="font-semibold text-zinc-200 flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-blue-400" />
                    <span>2. Basic Military Training (BMT)</span>
                  </label>
                  <span className="text-[11px] font-mono text-zinc-400">Sessions</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    id="2nd-bmt-minus"
                    onClick={() => handleUpdate2ndBat('bmt', Math.max(0, rep2nd.bmt - 1))}
                    className="w-8 h-8 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 flex items-center justify-center text-sm font-bold active:scale-95 transition-all"
                  >
                    -
                  </button>
                  <input
                    id="2nd-bmt-input"
                    type="number"
                    min="0"
                    value={rep2nd.bmt}
                    onChange={(e) => handleUpdate2ndBat('bmt', Math.max(0, parseInt(e.target.value) || 0))}
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-center font-mono font-bold text-blue-300 focus:outline-none focus:border-blue-500/50 text-sm"
                  />
                  <button
                    id="2nd-bmt-plus"
                    onClick={() => handleUpdate2ndBat('bmt', rep2nd.bmt + 1)}
                    className="w-8 h-8 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 flex items-center justify-center text-sm font-bold active:scale-95 transition-all"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Field 3: Events */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label htmlFor="2nd-events-input" className="font-semibold text-zinc-200 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-400" />
                    <span>3. Events / Trainings</span>
                  </label>
                  <span className="text-[11px] font-mono text-zinc-400">Events</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    id="2nd-events-minus"
                    onClick={() => handleUpdate2ndBat('events', Math.max(0, rep2nd.events - 1))}
                    className="w-8 h-8 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 flex items-center justify-center text-sm font-bold active:scale-95 transition-all"
                  >
                    -
                  </button>
                  <input
                    id="2nd-events-input"
                    type="number"
                    min="0"
                    value={rep2nd.events}
                    onChange={(e) => handleUpdate2ndBat('events', Math.max(0, parseInt(e.target.value) || 0))}
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-center font-mono font-bold text-blue-300 focus:outline-none focus:border-blue-500/50 text-sm"
                  />
                  <button
                    id="2nd-events-plus"
                    onClick={() => handleUpdate2ndBat('events', rep2nd.events + 1)}
                    className="w-8 h-8 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 flex items-center justify-center text-sm font-bold active:scale-95 transition-all"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Officer In Charge */}
              <div className="space-y-1 pt-1">
                <label htmlFor="2nd-officer-input" className="text-[11px] font-medium text-zinc-400">Officer In Charge (OIC):</label>
                <input
                  id="2nd-officer-input"
                  type="text"
                  placeholder="e.g. BXO Iron Sentinel"
                  value={officer2nd}
                  onChange={(e) => handleSave('2nd_bat', { officerInCharge: e.target.value, secondBat: rep2nd })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-blue-500/50"
                />
              </div>

              {/* Notes */}
              <div className="space-y-1 pt-1">
                <label htmlFor="2nd-notes-input" className="text-[11px] font-medium text-zinc-400">Shift Notes / Highlights:</label>
                <input
                  id="2nd-notes-input"
                  type="text"
                  placeholder="e.g. All gate & patrol supervisions completed"
                  value={rep2nd.notes || ''}
                  onChange={(e) => handleUpdate2ndBat('notes', e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-blue-500/50"
                />
              </div>
            </div>
          </div>

          {/* Subtotal Footer */}
          <div className="p-3 bg-zinc-950/80 border-t border-zinc-800 text-[11px] font-mono text-zinc-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-400"></span>
              Total 2BN Ops:
            </span>
            <span className="font-bold text-blue-400">
              {total2BnOps} Activities
            </span>
          </div>
        </div>

        {/* ================= Commandants Guards ================= */}
        <div className="border border-zinc-600/40 bg-zinc-900/40 rounded-2xl overflow-hidden shadow-lg shadow-zinc-950/40 flex flex-col justify-between hover:border-zinc-500/60 transition-all">
          <div>
            {/* Card Header */}
            <div className="p-4 bg-zinc-800/50 border-b border-zinc-700/50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-zinc-700/40 border border-zinc-600/60 text-zinc-200 flex items-center justify-center font-bold font-mono text-xs">
                  CG
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white font-['Rajdhani',sans-serif] uppercase">Commandants Guards</h3>
                  <p className="text-[11px] text-zinc-400 font-mono">Elite Selections, DDT & WI</p>
                </div>
              </div>

              <button
                onClick={() => handleAutofillFromPersonnelLogs('commandants_guards')}
                title="Autofill from personnel logs"
                className="flex items-center gap-1 text-[10px] font-mono px-2 py-1 rounded bg-zinc-700/30 text-zinc-300 hover:bg-zinc-700/50 border border-zinc-600/40 transition-colors"
              >
                <RefreshCw className="w-2.5 h-2.5" />
                <span>Autofill</span>
              </button>
            </div>

            {/* Inputs Body */}
            <div className="p-5 space-y-3.5">
              
              {/* Field 1: Recruited Guards */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <label htmlFor="cg-recruited-input" className="font-semibold text-zinc-200 flex items-center gap-1.5">
                    <UserPlus className="w-3.5 h-3.5 text-zinc-300" />
                    <span>1. Recruited Guards</span>
                  </label>
                  <span className="text-[11px] font-mono text-zinc-400">Guards</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    id="cg-recruited-minus"
                    onClick={() => handleUpdateCG('recruited', Math.max(0, repCg.recruited - 1))}
                    className="w-7 h-7 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 flex items-center justify-center text-xs font-bold active:scale-95 transition-all"
                  >
                    -
                  </button>
                  <input
                    id="cg-recruited-input"
                    type="number"
                    min="0"
                    value={repCg.recruited}
                    onChange={(e) => handleUpdateCG('recruited', Math.max(0, parseInt(e.target.value) || 0))}
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 text-center font-mono font-bold text-zinc-200 focus:outline-none focus:border-zinc-500/60 text-xs"
                  />
                  <button
                    id="cg-recruited-plus"
                    onClick={() => handleUpdateCG('recruited', repCg.recruited + 1)}
                    className="w-7 h-7 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 flex items-center justify-center text-xs font-bold active:scale-95 transition-all"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Field 2: Selections */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <label htmlFor="cg-selections-input" className="font-semibold text-zinc-200 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-zinc-300" />
                    <span>2. Selection Trials</span>
                  </label>
                  <span className="text-[11px] font-mono text-zinc-400">Trials</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    id="cg-selections-minus"
                    onClick={() => handleUpdateCG('selections', Math.max(0, repCg.selections - 1))}
                    className="w-7 h-7 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 flex items-center justify-center text-xs font-bold active:scale-95 transition-all"
                  >
                    -
                  </button>
                  <input
                    id="cg-selections-input"
                    type="number"
                    min="0"
                    value={repCg.selections}
                    onChange={(e) => handleUpdateCG('selections', Math.max(0, parseInt(e.target.value) || 0))}
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 text-center font-mono font-bold text-zinc-200 focus:outline-none focus:border-zinc-500/60 text-xs"
                  />
                  <button
                    id="cg-selections-plus"
                    onClick={() => handleUpdateCG('selections', repCg.selections + 1)}
                    className="w-7 h-7 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 flex items-center justify-center text-xs font-bold active:scale-95 transition-all"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Field 3: Events */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <label htmlFor="cg-events-input" className="font-semibold text-zinc-200 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-zinc-300" />
                    <span>3. Events / Ceremonies</span>
                  </label>
                  <span className="text-[11px] font-mono text-zinc-400">Events</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    id="cg-events-minus"
                    onClick={() => handleUpdateCG('events', Math.max(0, repCg.events - 1))}
                    className="w-7 h-7 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 flex items-center justify-center text-xs font-bold active:scale-95 transition-all"
                  >
                    -
                  </button>
                  <input
                    id="cg-events-input"
                    type="number"
                    min="0"
                    value={repCg.events}
                    onChange={(e) => handleUpdateCG('events', Math.max(0, parseInt(e.target.value) || 0))}
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 text-center font-mono font-bold text-zinc-200 focus:outline-none focus:border-zinc-500/60 text-xs"
                  />
                  <button
                    id="cg-events-plus"
                    onClick={() => handleUpdateCG('events', repCg.events + 1)}
                    className="w-7 h-7 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 flex items-center justify-center text-xs font-bold active:scale-95 transition-all"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Field 4: DDT Phases */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <label htmlFor="cg-ddt-input" className="font-semibold text-zinc-200 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-zinc-300" />
                    <span>4. DDT Training Phases</span>
                  </label>
                  <span className="text-[11px] font-mono text-zinc-400">Phases</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    id="cg-ddt-minus"
                    onClick={() => handleUpdateCG('ddtPhases', Math.max(0, repCg.ddtPhases - 1))}
                    className="w-7 h-7 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 flex items-center justify-center text-xs font-bold active:scale-95 transition-all"
                  >
                    -
                  </button>
                  <input
                    id="cg-ddt-input"
                    type="number"
                    min="0"
                    value={repCg.ddtPhases}
                    onChange={(e) => handleUpdateCG('ddtPhases', Math.max(0, parseInt(e.target.value) || 0))}
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 text-center font-mono font-bold text-zinc-200 focus:outline-none focus:border-zinc-500/60 text-xs"
                  />
                  <button
                    id="cg-ddt-plus"
                    onClick={() => handleUpdateCG('ddtPhases', repCg.ddtPhases + 1)}
                    className="w-7 h-7 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 flex items-center justify-center text-xs font-bold active:scale-95 transition-all"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Officer In Charge */}
              <div className="space-y-1 pt-0.5">
                <label htmlFor="cg-officer-input" className="text-[11px] font-medium text-zinc-400">Officer In Charge (OIC):</label>
                <input
                  id="cg-officer-input"
                  type="text"
                  placeholder="e.g. BXO Shadow Warden"
                  value={officerCg}
                  onChange={(e) => handleSave('commandants_guards', { officerInCharge: e.target.value, commandantsGuards: repCg })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500/60"
                />
              </div>

              {/* Notes */}
              <div className="space-y-1 pt-0.5">
                <label htmlFor="cg-notes-input" className="text-[11px] font-medium text-zinc-400">Shift Notes / Highlights:</label>
                <input
                  id="cg-notes-input"
                  type="text"
                  placeholder="e.g. DDT Phase 3 conducted for 4 guards"
                  value={repCg.notes || ''}
                  onChange={(e) => handleUpdateCG('notes', e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500/60"
                />
              </div>
            </div>
          </div>

          {/* Subtotal Footer */}
          <div className="p-3 bg-zinc-950/80 border-t border-zinc-800 text-[11px] font-mono text-zinc-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-zinc-400"></span>
              Total CG Ops:
            </span>
            <span className="font-bold text-zinc-300">
              {totalCgOps} Activities
            </span>
          </div>
        </div>

      </div>

      {/* Historical Battalion Charts Section */}
      <div className="border border-zinc-800/80 bg-zinc-900/30 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2 font-['Rajdhani',sans-serif] uppercase">
              <BarChart2 className="w-4 h-4 text-emerald-400" />
              <span>Battalion Historical Trends ({timeRangeDays} Days Range)</span>
            </h3>
            <p className="text-xs text-zinc-400">
              Visualize activity progression, tryouts, supervisions, and training across time.
            </p>
          </div>

          {/* Battalion Chart Tab Switcher */}
          <div className="flex items-center gap-1.5 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
            {(Object.keys(BATTALIONS) as BattalionId[]).map((batId) => {
              const b = BATTALIONS[batId];
              const isSelected = selectedBatTab === batId;

              return (
                <button
                  key={batId}
                  id={`chart-tab-${batId}-btn`}
                  onClick={() => setSelectedBatTab(batId)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    isSelected
                      ? `${b.badgeBg} shadow border font-bold`
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {b.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Recharts Area for Selected Battalion */}
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {selectedBatTab === '1st_bat' ? (
              <AreaChart data={historyData}>
                <defs>
                  <linearGradient id="color1stTryouts" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="color1stRecruited" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f87171" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f87171" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="color1stEvents" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fca5a5" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#fca5a5" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="shortDate" stroke="#71717a" fontSize={11} />
                <YAxis stroke="#71717a" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Area type="monotone" dataKey="1st_tryouts" name="1. Tryouts Hosted" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#color1stTryouts)" />
                <Area type="monotone" dataKey="1st_recruited" name="2. Recruited Cadets" stroke="#f87171" strokeWidth={2} fillOpacity={1} fill="url(#color1stRecruited)" />
                <Area type="monotone" dataKey="1st_events" name="3. Events / Trainings" stroke="#fca5a5" strokeWidth={2} fillOpacity={1} fill="url(#color1stEvents)" />
              </AreaChart>
            ) : selectedBatTab === '2nd_bat' ? (
              <AreaChart data={historyData}>
                <defs>
                  <linearGradient id="color2ndSupervisions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="color2ndBmt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#60a5fa" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="color2ndEvents" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#93c5fd" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#93c5fd" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="shortDate" stroke="#71717a" fontSize={11} />
                <YAxis stroke="#71717a" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Area type="monotone" dataKey="2nd_supervisions" name="1. Supervisions (SV)" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#color2ndSupervisions)" />
                <Area type="monotone" dataKey="2nd_bmt" name="2. Basic Military Training (BMT)" stroke="#60a5fa" strokeWidth={2} fillOpacity={1} fill="url(#color2ndBmt)" />
                <Area type="monotone" dataKey="2nd_events" name="3. Events / Trainings" stroke="#93c5fd" strokeWidth={2} fillOpacity={1} fill="url(#color2ndEvents)" />
              </AreaChart>
            ) : (
              <AreaChart data={historyData}>
                <defs>
                  <linearGradient id="colorCgRecruited" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#71717a" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#71717a" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorCgSelections" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a1a1aa" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#a1a1aa" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorCgEvents" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d4d4d8" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#d4d4d8" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorCgDdt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#e4e4e7" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#e4e4e7" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="shortDate" stroke="#71717a" fontSize={11} />
                <YAxis stroke="#71717a" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Area type="monotone" dataKey="cg_recruited" name="1. Recruited Guards" stroke="#71717a" strokeWidth={2} fillOpacity={1} fill="url(#colorCgRecruited)" />
                <Area type="monotone" dataKey="cg_selections" name="2. Selection Trials" stroke="#a1a1aa" strokeWidth={2} fillOpacity={1} fill="url(#colorCgSelections)" />
                <Area type="monotone" dataKey="cg_events" name="3. Events / Ceremonies" stroke="#d4d4d8" strokeWidth={2} fillOpacity={1} fill="url(#colorCgEvents)" />
                <Area type="monotone" dataKey="cg_ddtPhases" name="4. DDT Training Phases" stroke="#e4e4e7" strokeWidth={2} fillOpacity={1} fill="url(#colorCgDdt)" />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
