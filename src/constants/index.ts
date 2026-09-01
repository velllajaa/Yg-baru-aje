import { BattalionId, BattalionInfo, ActivityLevel, ActivityMeta, AppSettings, TaskQuotaSpec, CustomQuotaConfig, CustomTaskDefinition } from '../types';

export const BATTALIONS: Record<BattalionId, BattalionInfo> = {
  '1st_bat': {
    id: '1st_bat',
    name: '1st Battalion',
    shortName: '1B BRIGCOMM',
    code: '1BN',
    color: '#8B0000', // Deep Maroon / Red (Matches Spreadsheet)
    headerBg: 'bg-[#8B0000]',
    footerBg: 'bg-[#8B0000]',
    badgeBg: 'bg-red-500/10 text-red-400 border-red-500/30',
    borderColor: 'border-red-600/40',
    description: '1B BRIGCOMM - Recruitment & Tryouts Division',
    taskFields: [
      { key: 'tryouts', label: 'Tryout', shortLabel: 'Tryout', description: 'Tryout sessions hosted' },
      { key: 'dms', label: 'DMs Reminder', shortLabel: 'DMs Reminder', description: 'Direct messages / reminder' },
    ],
  },
  '2nd_bat': {
    id: '2nd_bat',
    name: '2nd Battalion',
    shortName: '2B BRIGCOMM',
    code: '2BN',
    color: '#1565C0', // Royal Blue (Matches Spreadsheet)
    headerBg: 'bg-[#1565C0]',
    footerBg: 'bg-[#1565C0]',
    badgeBg: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    borderColor: 'border-blue-500/40',
    description: '2B BRIGCOMM - Training, Supervisions & BMT Division',
    taskFields: [
      { key: 'tryouts', label: 'Tryout', shortLabel: 'Tryout', description: 'Tryout sessions' },
      { key: 'bmts', label: 'BMTs / SV', shortLabel: 'BMTs / SV', description: '2 BMTs or 1 SV (OR Logic)' },
      { key: 'dms', label: 'DMs Reminder', shortLabel: 'DMs Reminder', description: 'Direct messages / reminder' },
    ],
  },
  'commandants_guards': {
    id: 'commandants_guards',
    name: 'Commandants Guards',
    shortName: 'Commandants Guards BRIGCOMM',
    code: 'CG',
    color: '#2C2C2C', // Dark Slate / Dark Grey (Matches Spreadsheet)
    headerBg: 'bg-[#2C2C2C]',
    footerBg: 'bg-[#2C2C2C]',
    badgeBg: 'bg-zinc-700/30 text-zinc-300 border-zinc-600/40',
    borderColor: 'border-zinc-700/60',
    description: 'Commandants Guards BRIGCOMM - Elite Selections, DDT Phases & CG WI Division',
    taskFields: [
      { key: 'selections', label: 'Selections Daily', shortLabel: 'Selections', description: 'Elite Selection Trials' },
      { key: 'ddtPhases', label: 'DDT Phases Daily', shortLabel: 'DDT Phases', description: 'DDT Training Phases' },
      { key: 'cgWi', label: 'WI Daily', shortLabel: 'WI Daily', description: 'Commandants Guards WI' },
      { key: 'dms', label: 'DMs Daily', shortLabel: 'DMs Daily', description: 'Direct messages / outreach' },
    ],
  },
};

// Standard Quota Reference by Battalion and Position (BXO / BSM)
export const BATTALION_QUOTA_REFERENCES: Record<BattalionId, Record<string, TaskQuotaSpec>> = {
  '1st_bat': {
    BXO: { tryouts: 8, dms: 5 },
    BSM: { tryouts: 6, dms: 5 },
    Officer: { tryouts: 6, dms: 5 },
  },
  '2nd_bat': {
    BXO: { tryouts: 3, bmts: 2, svs: 1, dms: 5 },
    BSM: { tryouts: 2, bmts: 2, svs: 1, dms: 5 },
    Officer: { tryouts: 2, bmts: 2, svs: 1, dms: 5 },
  },
  'commandants_guards': {
    BXO: { selections: 3, ddtPhases: 2, cgWi: 2, dms: 5 },
    BSM: { selections: 3, ddtPhases: 2, cgWi: 2, dms: 5 },
    Officer: { selections: 3, ddtPhases: 2, cgWi: 2, dms: 5 },
  },
};

// Activity Level Meta (In-Game Activity Hours & Status)
export const ACTIVITY_META: Record<ActivityLevel, ActivityMeta> = {
  under_1h: {
    level: 'under_1h',
    label: 'Under 1 Hour (< 1h)',
    shortLabel: '< 1h',
    hoursDesc: 'Less than 1 hour in-game',
    emoji: '🔴',
    colorClass: 'text-rose-400',
    bgClass: 'bg-rose-500/15',
    borderClass: 'border-rose-500/40',
  },
  under_2h: {
    level: 'under_2h',
    label: 'Under 2 Hours (1 - 2h)',
    shortLabel: '< 2h',
    hoursDesc: '1 to 2 hours in-game',
    emoji: '🟡',
    colorClass: 'text-amber-400',
    bgClass: 'bg-amber-500/15',
    borderClass: 'border-amber-500/40',
  },
  under_3h: {
    level: 'under_3h',
    label: 'Under 3 Hours (2 - 3h)',
    shortLabel: '< 3h',
    hoursDesc: '2 to 3 hours in-game',
    emoji: '🟢',
    colorClass: 'text-emerald-400',
    bgClass: 'bg-emerald-500/15',
    borderClass: 'border-emerald-500/40',
  },
  above_3h: {
    level: 'above_3h',
    label: 'Above 3 Hours (> 3h)',
    shortLabel: '> 3h',
    hoursDesc: 'Over 3 hours in-game',
    emoji: '🔵',
    colorClass: 'text-blue-400',
    bgClass: 'bg-blue-500/15',
    borderClass: 'border-blue-500/40',
  },
  exempted: {
    level: 'exempted',
    label: 'Exempted (Special Duties / LOA)',
    shortLabel: 'Exempted',
    hoursDesc: 'Authorized special duties or leave exemption',
    emoji: '⚪',
    colorClass: 'text-zinc-200',
    bgClass: 'bg-zinc-700/30',
    borderClass: 'border-zinc-500/40',
  },
};

// Aliases for compatibility
export const STATUS_META = ACTIVITY_META;

export const DEFAULT_QUOTAS: CustomQuotaConfig = {
  firstBatBxoTryouts: 8,
  firstBatBsmTryouts: 6,
  firstBatDms: 5,
  secondBatBxoTryouts: 3,
  secondBatBsmTryouts: 2,
  secondBatBmtReq: 2,
  secondBatSvReq: 1,
  secondBatDms: 5,
  cgSelections: 3,
  cgDdtPhases: 2,
  cgWi: 2,
  cgDms: 5,
};

export const DEFAULT_CUSTOM_TASKS: CustomTaskDefinition[] = [
  // 1st Battalion
  {
    id: 'tryouts',
    name: 'Tryout',
    shortLabel: 'Tryout',
    battalionId: '1st_bat',
    defaultTarget: 6,
    positionTargets: { BXO: 8, BSM: 6, Officer: 6 },
    enabled: true,
    isCustom: false,
    unit: 'sessions',
    description: 'Tryout sessions hosted for candidates',
  },
  {
    id: 'dms',
    name: 'DMs Reminder',
    shortLabel: 'DMs Reminder',
    battalionId: '1st_bat',
    defaultTarget: 5,
    positionTargets: { BXO: 5, BSM: 5, Officer: 5 },
    enabled: true,
    isCustom: false,
    unit: 'messages',
    description: 'Direct message outreach and shift reminders',
  },

  // 2nd Battalion
  {
    id: 'tryouts',
    name: 'Tryout',
    shortLabel: 'Tryout',
    battalionId: '2nd_bat',
    defaultTarget: 2,
    positionTargets: { BXO: 3, BSM: 2, Officer: 2 },
    enabled: true,
    isCustom: false,
    unit: 'sessions',
    description: 'Tryout sessions conducted',
  },
  {
    id: 'bmts',
    name: 'BMTs / SV',
    shortLabel: 'BMTs / SV',
    battalionId: '2nd_bat',
    defaultTarget: 2,
    positionTargets: { BXO: 2, BSM: 2, Officer: 2 },
    enabled: true,
    isCustom: false,
    unit: 'sessions',
    description: '2 BMTs or 1 Supervisions (OR logic)',
  },
  {
    id: 'dms',
    name: 'DMs Reminder',
    shortLabel: 'DMs Reminder',
    battalionId: '2nd_bat',
    defaultTarget: 5,
    positionTargets: { BXO: 5, BSM: 5, Officer: 5 },
    enabled: true,
    isCustom: false,
    unit: 'messages',
    description: 'Direct message reminders',
  },

  // Commandants Guards
  {
    id: 'selections',
    name: 'Selections Daily',
    shortLabel: 'Selections',
    battalionId: 'commandants_guards',
    defaultTarget: 3,
    positionTargets: { BXO: 3, BSM: 3, Officer: 3 },
    enabled: true,
    isCustom: false,
    unit: 'trials',
    description: 'Elite Selection Trials hosted',
  },
  {
    id: 'ddtPhases',
    name: 'DDT Phases Daily',
    shortLabel: 'DDT Phases',
    battalionId: 'commandants_guards',
    defaultTarget: 2,
    positionTargets: { BXO: 2, BSM: 2, Officer: 2 },
    enabled: true,
    isCustom: false,
    unit: 'phases',
    description: 'DDT Training Phases conducted',
  },
  {
    id: 'cgWi',
    name: 'WI Daily',
    shortLabel: 'WI Daily',
    battalionId: 'commandants_guards',
    defaultTarget: 2,
    positionTargets: { BXO: 2, BSM: 2, Officer: 2 },
    enabled: true,
    isCustom: false,
    unit: 'inspections',
    description: 'Commandants Guards War Inspections',
  },
  {
    id: 'dms',
    name: 'DMs Daily',
    shortLabel: 'DMs Daily',
    battalionId: 'commandants_guards',
    defaultTarget: 5,
    positionTargets: { BXO: 5, BSM: 5, Officer: 5 },
    enabled: true,
    isCustom: false,
    unit: 'messages',
    description: 'Direct messages / outreach',
  },
];

export const DEFAULT_SETTINGS: AppSettings = {
  discordHeaderEmoji: '<:ETS:962722934508634122> | AEST',
  shiftTime: '20:30',
  defaultPing: '<@1043324306068877453> <@&1430465415280066721>',
  theme: 'dark',
  language: 'en', // Default English
  autoGenerateNotes: true,
  appName: 'BRIGCOMM',
  appSubtitle: 'Daily Quota & Shift System',
  timezoneLabel: 'AEST COMMAND',
  quotas: DEFAULT_QUOTAS,
  customTasks: DEFAULT_CUSTOM_TASKS,
};
