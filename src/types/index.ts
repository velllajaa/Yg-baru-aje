export type BattalionId = '1st_bat' | '2nd_bat' | 'commandants_guards';

export type ActivityLevel = 'under_1h' | 'under_2h' | 'under_3h' | 'above_3h' | 'exempted';

export interface ActivityMeta {
  level: ActivityLevel;
  label: string;
  shortLabel: string;
  hoursDesc: string;
  emoji: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
}

export type PositionRole = 'BXO' | 'BSM' | 'Officer' | 'Staff' | string;

export interface TaskQuotaSpec {
  tryouts?: number;
  bmts?: number;
  svs?: number;
  dms?: number;
  selections?: number;
  ddtPhases?: number;
  cgWi?: number;
  recruited?: number;
  events?: number;
  [key: string]: number | undefined;
}

export interface MemberTasksProgress {
  tryouts?: number | string;
  bmts?: number | string;
  svs?: number | string;
  dms?: number | string;
  selections?: number | string;
  ddtPhases?: number | string;
  cgWi?: number | string;
  recruited?: number | string;
  events?: number | string;
  [key: string]: number | string | undefined;
}

export interface CustomTaskDefinition {
  id: string; // unique task slug e.g. "tryouts", "bmts", "custom_task_123"
  name: string; // display name e.g. "Tryout", "Special Patrols"
  shortLabel: string; // e.g. "Tryout", "Patrol"
  battalionId: BattalionId | 'all';
  defaultTarget: number;
  positionTargets?: Record<string, number>; // e.g. { BXO: 8, BSM: 6, Officer: 6 }
  enabled: boolean;
  isCustom?: boolean;
  unit?: string;
  description?: string;
}

export interface Member {
  id: string;
  name: string;
  discordId: string; // e.g. "1516471139134734346"
  battalion: BattalionId;
  position: PositionRole; // "BXO", "BSM", etc.
  dailyQuotaTarget?: number; // Total target or aggregated
  customTaskTargets?: TaskQuotaSpec;
  status: 'active' | 'inactive';
  notes?: string;
  createdAt: string;
}

export interface DailyMemberLog {
  memberId: string;
  date: string; // YYYY-MM-DD
  activityLevel: ActivityLevel; // 🔴 under_1h, 🟡 under_2h, 🟢 under_3h, 🔵 above_3h, ⚪ exempted
  activityHours?: number; // exact hours logged if any (e.g. 1.5, 2.8)
  gameHourDropdown?: string; // '1 hour', '2 hour', '3 hour', '4 hour+', 'Exempted', '-'
  tasksProgress?: MemberTasksProgress;
  // Legacy / derived status
  status?: 'completed' | 'partial' | 'no_logs' | 'exempted';
  quotaCount?: number;
  note: string;
  overseerNotes?: string;
  demotionNotice?: boolean;
  updatedAt: string;
}

export interface BattalionInfo {
  id: BattalionId;
  name: string;
  shortName: string;
  code: string;
  color: string;
  headerBg: string; // CSS bg for spreadsheet headers (Red #8B0000, Blue #1565C0, Grey #2C2C2C)
  footerBg: string; // CSS bg for spreadsheet footers
  badgeBg: string;
  borderColor: string;
  description: string;
  taskFields: { key: keyof MemberTasksProgress; label: string; shortLabel: string; description: string }[];
}

export interface FirstBatReport {
  tryouts: number;
  recruited: number;
  events: number;
  notes?: string;
}

export interface SecondBatReport {
  supervisions: number;
  bmt: number; // Basic military training
  events: number;
  notes?: string;
}

export interface CommandantsGuardsReport {
  recruited: number;
  selections: number;
  events: number;
  ddtPhases: number;
  notes?: string;
}

export interface BattalionDailyReportData {
  id: string; // `${battalionId}_${date}`
  battalionId: BattalionId;
  date: string; // YYYY-MM-DD
  firstBat?: FirstBatReport;
  secondBat?: SecondBatReport;
  commandantsGuards?: CommandantsGuardsReport;
  officerInCharge?: string;
  summaryNote?: string;
  updatedAt: string;
}

export type Language = 'id' | 'en';

export interface CustomQuotaConfig {
  firstBatBxoTryouts: number;
  firstBatBsmTryouts: number;
  firstBatDms: number;
  secondBatBxoTryouts: number;
  secondBatBsmTryouts: number;
  secondBatBmtReq: number;
  secondBatSvReq: number;
  secondBatDms: number;
  cgSelections: number;
  cgDdtPhases: number;
  cgWi: number;
  cgDms: number;
}

export interface AppSettings {
  discordHeaderEmoji: string; // default "<:ETS:962722934508634122> | AEST"
  shiftTime: string; // default "20:30"
  defaultPing: string; // default "<@1043324306068877453> <@&1430465415280066721>"
  theme: 'dark' | 'tactical' | 'light';
  language: Language; // 'id' | 'en'
  autoGenerateNotes: boolean;
  appName: string;
  appSubtitle: string;
  timezoneLabel: string;
  quotas: CustomQuotaConfig;
  customTasks?: CustomTaskDefinition[];
}

export interface AppState {
  members: Member[];
  memberLogs: Record<string, DailyMemberLog>; // key: `${memberId}_${date}`
  battalionReports: Record<string, BattalionDailyReportData>; // key: `${battalionId}_${date}`
  settings: AppSettings;
}

// Backward-compat aliases
export type QuotaStatus = ActivityLevel;
export type StatusMeta = ActivityMeta;
