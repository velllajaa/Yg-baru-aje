import { ActivityLevel, DailyMemberLog } from '../types';
import { ACTIVITY_META } from '../constants';

/**
 * Resolves the standardized ActivityLevel from any log entry,
 * supporting activityLevel, gameHourDropdown, and legacy status seamlessly.
 */
export function resolveActivityLevel(log?: Partial<DailyMemberLog> | null): ActivityLevel {
  if (!log) return 'under_1h';

  // 1. Direct activityLevel check
  if (log.activityLevel && ['above_3h', 'under_3h', 'under_2h', 'under_1h', 'exempted'].includes(log.activityLevel)) {
    return log.activityLevel;
  }

  // 2. Check gameHourDropdown
  if (log.gameHourDropdown) {
    const raw = log.gameHourDropdown.trim();
    if (raw === '3 hour' || raw === '4 hour+' || raw === '4 hour' || raw === '> 3h') {
      return 'above_3h';
    }
    if (raw === '2 hour' || raw === '< 3h') {
      return 'under_3h';
    }
    if (raw === '1 hour' || raw === '< 2h') {
      return 'under_2h';
    }
    if (raw === 'Exempted' || raw === 'LOA' || raw === 'On Leave') {
      return 'exempted';
    }
    if (raw === '-' || raw === '< 1h' || raw === 'No Logs') {
      return 'under_1h';
    }
  }

  // 3. Fallback to status
  if (log.status) {
    const st = String(log.status);
    if (st === 'above_3h' || st === 'completed') return 'above_3h';
    if (st === 'under_3h') return 'under_3h';
    if (st === 'under_2h' || st === 'partial') return 'under_2h';
    if (st === 'exempted') return 'exempted';
    if (st === 'under_1h' || st === 'no_logs') return 'under_1h';
  }

  return 'under_1h';
}

/**
 * Convert ActivityLevel enum to canonical Google Sheets / UI dropdown string
 */
export function activityLevelToDropdown(level: ActivityLevel): string {
  switch (level) {
    case 'above_3h':
      return '3 hour';
    case 'under_3h':
      return '2 hour';
    case 'under_2h':
      return '1 hour';
    case 'exempted':
      return 'Exempted';
    case 'under_1h':
    default:
      return '-';
  }
}

/**
 * Convert Google Sheets / UI dropdown string to ActivityLevel enum
 */
export function dropdownToActivityLevel(dropdownVal: string): ActivityLevel {
  const val = (dropdownVal || '').trim();
  if (val === '3 hour' || val === '4 hour+' || val === '4 hour' || val === '> 3h') {
    return 'above_3h';
  }
  if (val === '2 hour' || val === '< 3h') {
    return 'under_3h';
  }
  if (val === '1 hour' || val === '< 2h') {
    return 'under_2h';
  }
  if (val === 'Exempted' || val === 'LOA' || val === 'On Leave') {
    return 'exempted';
  }
  return 'under_1h';
}

/**
 * Get accurate emoji for Discord Report & UI badges
 */
export function getActivityEmoji(log?: Partial<DailyMemberLog> | null): string {
  const lvl = resolveActivityLevel(log);
  return ACTIVITY_META[lvl]?.emoji || '🔴';
}

/**
 * Get default automatic note for activity level if none provided
 */
export function getDefaultNoteForLevel(level: ActivityLevel, existingNote?: string): string {
  const note = (existingNote || '').trim();
  if (!note || note.includes('***No Logs***') || note.includes('***Exempted***') || note.includes('***On Leave')) {
    if (level === 'under_1h') return '***No Logs*** (Demotion notice)';
    if (level === 'exempted') return '***Exempted***';
    if (level === 'above_3h' || level === 'under_3h' || level === 'under_2h') return '';
  }
  return note;
}
