import { BattalionId, Member, AppSettings, CustomTaskDefinition } from '../types';
import { DEFAULT_CUSTOM_TASKS } from '../constants';

/**
 * Retrieves all enabled tasks for a specific battalion.
 * Merges battalion-specific and 'all' unit tasks.
 */
export function getActiveBattalionTasks(
  battalionId: BattalionId,
  settings?: AppSettings
): CustomTaskDefinition[] {
  const allTasks: CustomTaskDefinition[] = 
    settings?.customTasks && settings.customTasks.length > 0
      ? settings.customTasks
      : DEFAULT_CUSTOM_TASKS;

  return allTasks.filter(
    (t) => (t.battalionId === battalionId || t.battalionId === 'all') && t.enabled !== false
  );
}

/**
 * Gets the numeric target required for a given member on a specific task.
 * Precedence:
 * 1. Member's custom target override on their profile (if set)
 * 2. Role/Position target on the task definition (e.g. BXO, BSM, Officer)
 * 3. Default target on the task definition
 */
export function getTaskTargetForMember(
  task: CustomTaskDefinition,
  member: Member,
  settings?: AppSettings
): number {
  // Check member custom target override
  if (member.customTaskTargets && member.customTaskTargets[task.id] !== undefined) {
    return Number(member.customTaskTargets[task.id]);
  }

  const pos = (member.position || '').trim().toUpperCase();

  // If task has explicit position targets
  if (task.positionTargets) {
    // Exact match
    if (task.positionTargets[member.position] !== undefined) {
      return Number(task.positionTargets[member.position]);
    }
    // Uppercase key match
    for (const [key, val] of Object.entries(task.positionTargets)) {
      if (key.toUpperCase() === pos || pos.includes(key.toUpperCase())) {
        return Number(val);
      }
    }
  }

  // Fallback to legacy AppSettings.quotas if default tasks
  if (settings?.quotas) {
    const q = settings.quotas;
    const isBXO = pos.includes('BXO');
    const isBSM = pos.includes('BSM');

    if (task.battalionId === '1st_bat') {
      if (task.id === 'tryouts') return isBXO ? q.firstBatBxoTryouts : q.firstBatBsmTryouts;
      if (task.id === 'dms') return q.firstBatDms;
    } else if (task.battalionId === '2nd_bat') {
      if (task.id === 'tryouts') return isBXO ? q.secondBatBxoTryouts : q.secondBatBsmTryouts;
      if (task.id === 'bmts') return q.secondBatBmtReq;
      if (task.id === 'svs') return q.secondBatSvReq;
      if (task.id === 'dms') return q.secondBatDms;
    } else if (task.battalionId === 'commandants_guards') {
      if (task.id === 'selections') return q.cgSelections;
      if (task.id === 'ddtPhases') return q.cgDdtPhases;
      if (task.id === 'cgWi') return q.cgWi;
      if (task.id === 'dms') return q.cgDms;
    }
  }

  return task.defaultTarget ?? 0;
}

export interface TaskEvaluationResult {
  status: 'Met' | 'Not Met' | '-';
  currentValue: number | string;
  targetValue: number;
  isMet: boolean;
}

/**
 * Evaluates whether a member met the quota for a specific task.
 */
export function evaluateTaskProgress(
  task: CustomTaskDefinition,
  member: Member,
  inputValue: string | number | undefined,
  settings?: AppSettings
): TaskEvaluationResult {
  const target = getTaskTargetForMember(task, member, settings);
  
  if (inputValue === undefined || inputValue === null || String(inputValue).trim() === '') {
    return {
      status: '-',
      currentValue: '',
      targetValue: target,
      isMet: false,
    };
  }

  const strVal = String(inputValue).trim().toLowerCase();
  const numVal = Number(inputValue) || 0;

  // Special logic for 2nd Bat BMT/SV OR logic (e.g. "1 SV" or "2" meets requirement)
  if (task.battalionId === '2nd_bat' && task.id === 'bmts') {
    const svReq = settings?.quotas?.secondBatSvReq ?? 1;
    const bmtReq = target || (settings?.quotas?.secondBatBmtReq ?? 2);
    const has1SV = strVal.includes('sv') || (numVal >= svReq && strVal.includes('sv'));
    const has2BMT = numVal >= bmtReq || strVal.includes(String(bmtReq));

    const isMet = has1SV || has2BMT || numVal >= bmtReq;
    return {
      status: isMet ? 'Met' : 'Not Met',
      currentValue: inputValue,
      targetValue: target,
      isMet,
    };
  }

  const isMet = numVal >= target;
  return {
    status: isMet ? 'Met' : 'Not Met',
    currentValue: inputValue,
    targetValue: target,
    isMet,
  };
}
