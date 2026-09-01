import { AppState, Member, DailyMemberLog, BattalionDailyReportData, BattalionId } from '../types';
import { DEFAULT_SETTINGS } from '../constants';
import { getTodayString, addDays } from './date';

const STORAGE_KEY = 'BRIGCOMM_TRACKER_STORAGE_V2';
const LEGACY_STORAGE_KEY = 'BRIGCOMM_TRACKER_STORAGE_V1';

// Roster starts clean (empty) for user to input their real personnel data
export const INITIAL_MEMBERS: Member[] = [];

export const INITIAL_STATE: AppState = {
  members: INITIAL_MEMBERS,
  memberLogs: {},
  battalionReports: {},
  settings: DEFAULT_SETTINGS,
};

export function loadAppState(): AppState {
  try {
    let raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Check legacy key for existing user data if any
      raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    }

    if (!raw) return INITIAL_STATE;
    const parsed = JSON.parse(raw);

    const existingMembers = Array.isArray(parsed.members)
      ? parsed.members.filter((m: Member) => m && m.id && typeof m.name === 'string')
      : [];

    return {
      members: existingMembers,
      memberLogs: parsed.memberLogs && typeof parsed.memberLogs === 'object' ? parsed.memberLogs : {},
      battalionReports: parsed.battalionReports && typeof parsed.battalionReports === 'object' ? parsed.battalionReports : {},
      settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) },
    };
  } catch (err) {
    console.error('Failed to load state from localStorage:', err);
    return INITIAL_STATE;
  }
}

export function saveAppState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Failed to save state to localStorage:', err);
  }
}

export function clearAllPersonnelData(): AppState {
  const clearedState: AppState = {
    ...INITIAL_STATE,
    settings: DEFAULT_SETTINGS,
  };
  saveAppState(clearedState);
  return clearedState;
}

/**
 * Resets all daily logs, activity hours, task progress, notes, and battalion reports
 * while PRESERVING all members (Name, Battalion, Position, Discord ID, Status, Quota Target)
 * and Custom Settings.
 */
export function clearAllLogsPreserveRoster(currentState: AppState): AppState {
  const clearedState: AppState = {
    members: currentState.members || [],
    memberLogs: {},
    battalionReports: {},
    settings: currentState.settings || DEFAULT_SETTINGS,
  };
  saveAppState(clearedState);
  return clearedState;
}

/**
 * Resets daily logs only for a specific date (or selected battalion)
 * while preserving roster members.
 */
export function clearLogsForDate(currentState: AppState, dateToClear: string, battalionId?: BattalionId | 'all'): AppState {
  const newLogs = { ...(currentState.memberLogs || {}) };
  
  Object.keys(newLogs).forEach((key) => {
    // key is `${memberId}_${date}`
    if (key.endsWith(`_${dateToClear}`)) {
      if (!battalionId || battalionId === 'all') {
        delete newLogs[key];
      } else {
        const memberId = key.replace(`_${dateToClear}`, '');
        const member = currentState.members.find((m) => m.id === memberId);
        if (member && member.battalion === battalionId) {
          delete newLogs[key];
        }
      }
    }
  });

  const newReports = { ...(currentState.battalionReports || {}) };
  if (!battalionId || battalionId === 'all') {
    Object.keys(newReports).forEach((key) => {
      if (key.endsWith(`_${dateToClear}`)) {
        delete newReports[key];
      }
    });
  } else {
    delete newReports[`${battalionId}_${dateToClear}`];
  }

  const updatedState: AppState = {
    ...currentState,
    memberLogs: newLogs,
    battalionReports: newReports,
  };
  saveAppState(updatedState);
  return updatedState;
}

export function exportStateToJson(state: AppState): void {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `BRIGCOMM_Tracker_Backup_${getTodayString()}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function importStateFromJson(jsonString: string): AppState {
  const parsed = JSON.parse(jsonString);
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid JSON format');
  }
  return {
    members: Array.isArray(parsed.members) ? parsed.members : [],
    memberLogs: parsed.memberLogs && typeof parsed.memberLogs === 'object' ? parsed.memberLogs : {},
    battalionReports: parsed.battalionReports && typeof parsed.battalionReports === 'object' ? parsed.battalionReports : {},
    settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) },
  };
}

export function generateSampleData(): AppState {
  const today = getTodayString();
  const sampleMembers: Member[] = [
    { id: `demo_1`, name: 'Commander_Alpha', discordId: '1043324306068877453', battalion: '1st_bat', position: 'BXO', dailyQuotaTarget: 8, status: 'active', createdAt: today },
    { id: `demo_2`, name: 'Captain_Bravo', discordId: '962722934508634122', battalion: '1st_bat', position: 'BSM', dailyQuotaTarget: 6, status: 'active', createdAt: today },
    { id: `demo_3`, name: 'Major_Charlie', discordId: '876543210987654321', battalion: '2nd_bat', position: 'BXO', dailyQuotaTarget: 3, status: 'active', createdAt: today },
    { id: `demo_4`, name: 'Sergeant_Delta', discordId: '123456789012345678', battalion: '2nd_bat', position: 'BSM', dailyQuotaTarget: 2, status: 'active', createdAt: today },
    { id: `demo_5`, name: 'Warden_Echo', discordId: '555666777888999000', battalion: 'commandants_guards', position: 'Guard Officer', dailyQuotaTarget: 3, status: 'active', createdAt: today },
  ];

  const sampleLogs: Record<string, DailyMemberLog> = {};
  for (let i = 0; i < 7; i++) {
    const d = addDays(today, -i);
    sampleMembers.forEach((m, idx) => {
      const isCompleted = (idx + i) % 2 === 0;
      sampleLogs[`${m.id}_${d}`] = {
        memberId: m.id,
        date: d,
        activityLevel: isCompleted ? 'above_3h' : 'under_3h',
        status: isCompleted ? 'completed' : 'partial',
        gameHourDropdown: isCompleted ? '3 hour' : '2 hour',
        tasksProgress: {
          tryouts: isCompleted ? 8 : 4,
          dms: 5,
          bmts: 2,
          selections: 3,
        },
        note: isCompleted ? 'Full quota fulfilled.' : 'Partial shift progress.',
        updatedAt: new Date().toISOString(),
      };
    });
  }

  return {
    members: sampleMembers,
    memberLogs: sampleLogs,
    battalionReports: {},
    settings: DEFAULT_SETTINGS,
  };
}
