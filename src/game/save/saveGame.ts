import { planDeadline, startDeadline, getDeadlineWorkdayIndex } from '../work/deadline';
import { gameConfig as c } from '../../config/gameConfig';
import type { State, Target, Todo } from '../state/gameState';
import { initialState } from '../state/initialState';
import { syncWorld, dayIndexAt } from '../time/worldTime';
import { emptyProductStats, createProductSubscription } from '../products/productManager';
import { updateProjectClosures } from '../projects/projectManager';
import { settleOfflineMinutes } from '../time/offlineSimulation';
import { emptyPromotion } from '../career/promotionAssignment';
import { emptyMeetings } from '../targets/meetingTarget';
type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
function shape(value: any, sample: any): boolean { if (sample === null) return value === null || typeof value === 'object' || typeof value === 'string' || typeof value === 'number' && Number.isFinite(value); if (Array.isArray(sample)) return Array.isArray(value); if (typeof sample === 'number') return typeof value === 'number' && Number.isFinite(value); if (typeof sample !== 'object') return typeof value === typeof sample; return !!value && typeof value === 'object' && Object.entries(sample).every(([key, v]) => shape(value[key], v)); }
function validDeadline(t: Todo) {
  return c.deadlines.profiles.some(p => p.id === t.deadlineProfileId) && typeof t.createdAtWorldTime === 'number' && Number.isFinite(t.createdAtWorldTime) && Number.isInteger(t.assignmentWorkdayIndex) && (t.deadlineWorkdays === null ? t.dueWorkdayIndex === null : Number.isInteger(t.deadlineWorkdays) && t.deadlineWorkdays >= 0 && t.dueWorkdayIndex === t.assignmentWorkdayIndex! + t.deadlineWorkdays);
}
function validTarget(t: Target | null) {
  if (!t) return true;
  if (typeof t.id !== 'string' || typeof t.name !== 'string') return false;
  if(t.type==='PROMOTION')return Number.isInteger(t.fromRank)&&t.fromRank>=0&&t.fromRank<c.ranks.length-1&&t.toRank===t.fromRank+1&&Number.isFinite(t.startedAt)&&Number.isFinite(t.deadlineWorldTime)&&t.deadlineWorldTime>t.startedAt&&Number.isFinite(t.requirement)&&t.requirement>0&&Number.isFinite(t.progress)&&t.progress>=0&&t.progress<=t.requirement;
  if (t.type === 'MEETING') return t.meetingId === t.id && ['NORMAL','BOSS'].includes(t.source) && t.isBossMeeting === (t.source === 'BOSS') &&
    Number.isFinite(t.createdAtWorldTime) && t.createdAtWorldTime >= 0 &&
    (t.scheduledStartWorldTime === null || Number.isFinite(t.scheduledStartWorldTime) && t.scheduledStartWorldTime >= 0) &&
    (t.startedAtWorldTime === null || Number.isFinite(t.startedAtWorldTime) && t.startedAtWorldTime >= 0) &&
    Number.isFinite(t.totalDuration) && t.totalDuration > 0 && Number.isFinite(t.remainingDuration) && t.remainingDuration >= 0 && t.remainingDuration <= t.totalDuration &&
    Number.isInteger(t.rankAtCreation) && t.rankAtCreation >= 0 && t.rankAtCreation < c.ranks.length && Number.isFinite(t.compensation) && t.compensation >= 0 && Array.isArray(t.crossedAnchors) && t.crossedAnchors.every(k => typeof k === 'string');
  return t.type === 'LUNCH' ? Number.isFinite(t.windowEnd) && Number.isFinite(t.accumulatedRestOutput) :
    ['PROMOTION','WORK','FOOD','SLEEP','ENTERTAINMENT','PROBLEM'].includes(t.type) && Number.isFinite(t.requirement) && t.requirement > 0 && Number.isFinite(t.progress) && t.progress >= 0 && t.progress <= t.requirement && (t.type !== 'WORK' || !!t.todo && validDeadline(t.todo));
}
export function validateSave(s: State) {
  if(!s.promotion||!['NOT_ELIGIBLE','ELIGIBLE','SCHEDULED','ACTIVE','COOLDOWN','MAX_RANK','FAILED_REQUIREMENT'].includes(s.promotion.status)||s.promotion.requirement<0||s.promotion.progress<0||s.promotion.progress>s.promotion.requirement)return false;
  const assessments=[s.currentTarget,...s.suspendedTargets.map(x=>x.target)].filter(t=>t?.type==='PROMOTION');
  if(assessments.length>1||(s.promotion.status==='ACTIVE')!==(assessments.length===1)||assessments.some(t=>t?.id!==s.promotion.assignmentId))return false;
  if(!Number.isFinite(s.runStatistics?.activeSeconds)||s.runStatistics.activeSeconds<0)return false;
  if (!s.meetings || !validTarget(s.meetings.scheduledNormal) || !validTarget(s.meetings.pendingBoss) ||
    Object.values(s.meetings.statistics).some(n => !Number.isFinite(n) || n < 0) ||
    s.meetings.lastScheduledWorkday !== null && !Number.isInteger(s.meetings.lastScheduledWorkday)) return false;
  return shape(s, initialState(1, 0)) && s.saveVersion === 2 && s.coreVersion === 'todo-v2' && s.world.totalWorldTime >= 0 && s.world.dayIndex === dayIndexAt(s.world.totalWorldTime) && s.player.money >= 0 && s.player.ageProgressDays >= 0 && Number.isInteger(s.career.rank) && s.career.rank >= 0 && s.career.rank < c.ranks.length && Object.values(s.player.upgrades).every(n => Number.isInteger(n) && n >= 0) && c.prestige.upgrades.every(u => Number.isInteger(s.prestige.levels[u.id]) && s.prestige.levels[u.id] >= 0) && validTarget(s.currentTarget) && s.suspendedTargets.every(x => validTarget(x.target)) && s.todoQueue.every(t => typeof t.id === 'string' && t.workload > 0 && t.baseReward >= 0 && validDeadline(t)) && s.pendingFollowUps.every(p => Number.isFinite(p.triggerAtWorldTime) && Array.isArray(p.tasksToCreate)) && Object.values(s.products).every(p => (p.nextBillingWorldTime === null || Number.isFinite(p.nextBillingWorldTime)) && (!p.active || p.nextBillingWorldTime !== null) && p.pricePerBillingPeriod >= 0) && s.needs.sleep.windowEnd>s.needs.sleep.windowStart && s.needs.sleep.duration>=0 && s.needs.sleep.output>=0 && (s.needs.pendingBossId===null||typeof s.needs.pendingBossId==='string') && s.offline.offlineCarryMinutes >= 0 && s.offline.offlineCarryMinutes < c.offline.minutesPerGameDay;
}
export function saveGame(s: State, storage: StorageLike = localStorage, now = Date.now()) { try { s.offline.lastSeenAt = now; storage.setItem(c.save.key, JSON.stringify(s)); return true; } catch { return false; } }
export function loadGame(storage: StorageLike = localStorage, now = Date.now()): { state: State; error: string | null } {
  let raw: string | null = null;
  try {
    raw = storage.getItem(c.save.key);
    if (!raw) {
      const old = storage.getItem(c.save.legacyKey); if (old) { storage.setItem(c.save.key + ':legacy-backup', old); return { state: initialState(undefined, now), error: '新版核心已更新，測試資料需要重置；舊存檔已保留備份。' }; }
      return { state: initialState(undefined, now), error: null };
    }
    const state = JSON.parse(raw) as State;
    if (state?.coreVersion === 'todo-v2' && Number.isFinite(state.world?.totalWorldTime)) {
      syncWorld(state); if(!state.promotion){state.promotion=emptyPromotion();state.promotion.lastCheckedWorkday=getDeadlineWorkdayIndex(state.world.totalWorldTime);state.promotion.status=state.career.rank===c.ranks.length-1?'MAX_RANK':'NOT_ELIGIBLE';} state.needs.breakfastAnchorEligible ??= false;
      // Additive migration: no inference from old Work/Todo data and no RNG consumed.
      if(!state.meetings){state.meetings=emptyMeetings();state.meetings.lastScheduledWorkday=getDeadlineWorkdayIndex(state.world.totalWorldTime);}
      // Legacy world time mixes speed/offline/debug, so it cannot reconstruct real active play time.
      state.runStatistics.activeSeconds ??= 0;
      if(state.needs && !state.needs.sleep){
        const day=state.world.dayIndex-(state.world.timeOfDay<c.time.workStartAnchor*c.time.dayDuration/c.time.referenceDayDuration?1:0);
        state.needs.sleep={windowStart:Math.max(0,day)*c.time.dayDuration+c.time.sleepAnchor*c.time.dayDuration/c.time.referenceDayDuration,windowEnd:(Math.max(0,day)+1)*c.time.dayDuration+c.time.workStartAnchor*c.time.dayDuration/c.time.referenceDayDuration,duration:0,output:0,settled:false,lastRatio:0,speedModifier:0,qualityModifier:0};
        const oldWake=(state.needs.routineDay+1)*c.time.dayDuration+c.time.workStartAnchor*c.time.dayDuration/c.time.referenceDayDuration;
        if(state.world.totalWorldTime>=oldWake-1e-8){if(state.currentTarget?.type==='SLEEP')state.currentTarget=null;state.suspendedTargets=state.suspendedTargets.filter(x=>x.target.type!=='SLEEP');if(state.needs.phase==='SLEEP'||state.needs.phase==='WAIT'){state.needs.phase='BREAKFAST';state.needs.routineDay=state.world.dayIndex;state.needs.breakfastState='PENDING';state.needs.bossChecked=false;state.needs.lunchSettled=false;state.needs.lunchRest=0;}}
        for(const t of [state.currentTarget,...(state.suspendedTargets??[]).map(x=>x.target)])if(t?.type==='SLEEP'){t.requirement=Math.max(1e-8,state.needs.sleep.windowEnd-state.world.totalWorldTime);t.progress=0;}
        delete (state.needs as unknown as Record<string,unknown>).oversleepSeconds;
        state.debuffs=state.debuffs.filter(d=>!['oversleep','late'].includes(d.type));state.buffs=state.buffs.filter(b=>b.id!=='rested');
      }

      const live = [...[state.currentTarget, ...(state.suspendedTargets ?? []).map(x => x.target)].flatMap(t => t?.type === 'WORK' ? [t.todo] : []), ...(state.todoQueue ?? [])];
      const cleanLegacy = (todo: Todo) => { const legacy = todo as unknown as Record<string, unknown>; for (const key of ['dueAtWorldTime','deadlineGameHours','dueSoonLeadGameHours','dueSoonThresholdRatio']) delete legacy[key]; };
      let migratedBoss=live.some(t=>t.mandatoryOvertime);
      for (const todo of live) {
        if(todo.sourceType==='BOSS' && todo.bossSeverity===undefined){todo.bossSeverity=1;todo.mandatoryOvertime=!migratedBoss;migratedBoss=true;}

        if (todo.dueWorkdayIndex === undefined) { const profile = c.deadlines.profiles.some(p => p.id === todo.deadlineProfileId) ? todo.deadlineProfileId : undefined; planDeadline(todo,profile); startDeadline(state,todo,state.world.totalWorldTime); }
        if (todo.baseWorkload === undefined) { todo.baseWorkload=todo.workload; todo.ageWorkloadMultiplierAtCreation=1; todo.rankWorkloadMultiplierAtCreation=1; }
        cleanLegacy(todo);
      }
      const queuedBoss=state.todoQueue?.find(t=>t.mandatoryOvertime);if(queuedBoss)state.needs.pendingBossId=queuedBoss.id;
      for (const pending of state.pendingFollowUps ?? []) for (const todo of pending.tasksToCreate) {
        const profile = c.deadlines.profiles.some(p => p.id === todo.deadlineProfileId) ? todo.deadlineProfileId : undefined;
        planDeadline(todo,profile,todo.deadlineWorkdays); if (todo.baseWorkload === undefined) { todo.baseWorkload=todo.workload; todo.ageWorkloadMultiplierAtCreation=1; todo.rankWorkloadMultiplierAtCreation=1; } cleanLegacy(todo);
      }
      state.world.lastDeadlineNoticeWorkday ??= getDeadlineWorkdayIndex(state.world.totalWorldTime);

      // Additive V2 correction only: retain run/permanent data and translate former remaining-day subscriptions.
      if (state.needs && state.needs.breakfastState === undefined) {
        // Preserve the displayed age of pre-correction V2 runs while changing the runtime year scale.
        if (state.player && Number.isFinite(state.player.age)) state.player.ageProgressDays = Math.max(0, state.player.age - c.age.start) * c.age.daysPerYear;
        const startedBreakfast = [state.currentTarget, ...(state.suspendedTargets ?? []).map(x => x.target)].some(t => t?.type === 'FOOD' && t.meal === 'BREAKFAST');
        state.needs.breakfastState = startedBreakfast ? 'STARTED' : state.needs.phase === 'BREAKFAST' ? 'PENDING' : 'COMPLETED';
        state.needs.projectRollProcessedRoutineId = state.needs.phase === 'BREAKFAST' ? null : state.needs.routineDay;
      }
      for (const def of c.products.definitions) {
        const p = state.products?.[def.id]; if (!p) {state.products[def.id]=createProductSubscription(def);continue;}
        const old = p as unknown as { paidDaysRemaining?: number; contributionStats: { uses?: number; savedSeconds?: number; avoidedImpact?: number } };
        if (p.nextBillingWorldTime === undefined) {
          p.nextBillingWorldTime = (old.paidDaysRemaining ?? 0) > 0 ? state.world.totalWorldTime + old.paidDaysRemaining! * c.time.dayDuration : null;
          const stats = emptyProductStats(def.effectType); const prior = p.contributionStats;
          stats.totalSpent = prior.totalSpent ?? 0; stats.activationCount = p.active ? 1 : 0;
          if (def.effectType === 'FOOD_OPTION') { stats.foodUses = old.contributionStats.uses ?? 0; stats.foodSecondsSaved = old.contributionStats.savedSeconds ?? 0; }
          if (def.effectType === 'PROBLEM_RESOLVER') { stats.problemResolvedCount = old.contributionStats.uses ?? 0; stats.problemTriggeredCount = stats.problemResolvedCount; stats.debuffSecondsSaved = old.contributionStats.savedSeconds ?? 0; }
          if (def.effectType === 'OFFLINE_AGE_PROTECTION') stats.offlineAgeDaysProtected = prior.offlineAgeDaysProtected ?? 0;
          if (def.effectType === 'TAGGED_WORK_REWARD') stats.bonusIncome = old.contributionStats.avoidedImpact ?? 0;
          stats.billingSpent = Math.max(0, stats.totalSpent - (stats.foodUses ?? 0) * (c.food.items.find(f => f.productId === def.id)?.price ?? 0));
          p.contributionStats = stats; delete old.paidDaysRemaining;
        }
        p.effectType = def.effectType; p.contributionStats.billingSpent ??= p.contributionStats.totalSpent;
      }
      for (const p of state.projects ?? []) if ((p.status as string) === 'DONE') p.status = 'DELIVERED';
      if (state.offline && state.offline.lastOfflineSummary === undefined) { state.offline.lastOfflineSummary = null; state.offline.summaryDismissed = false; }
      updateProjectClosures(state);
    }
    if (!validateSave(state) || !state.buffs.every(b => b && typeof b.id === 'string' && Number.isFinite(b.expiresAt) && b.modifiers && typeof b.modifiers === 'object') || !state.debuffs.every(d => d && typeof d.id === 'string' && Number.isFinite(d.expiresAt) && d.modifiers && typeof d.modifiers === 'object') || !state.suspendedTargets.every(x => x && typeof x.phase === 'string')) throw Error('invalid');
    settleOfflineMinutes(state, Math.max(0, now - state.offline.lastSeenAt) / 60000); state.offline.lastSeenAt = now;
    return { state, error: null };
  } catch { try { if (raw) storage.setItem(c.save.key + ':recovery', raw); } catch { /* storage disabled */ } return { state: initialState(undefined, now), error: '新版核心已更新，測試資料需要重置；已嘗試保留原始備份。' }; }
}
export function resetSave(storage: StorageLike = localStorage) { try { storage.removeItem(c.save.key); return true; } catch { return false; } }
