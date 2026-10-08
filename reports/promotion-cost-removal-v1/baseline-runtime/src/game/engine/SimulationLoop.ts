import { resolveOfflineAgeProgress } from '../products/productEffects';
import { checkPromotionWorkStart, failExpiredPromotion, type PromotionWorkStartTelemetry } from '../career/promotionAssignment';
import { nextAgeWorkloadBoundary } from '../work/ageWorkload';
import { nextWorkStart, notifyDeadlineWorkday, getDeadlineWorkdayIndex } from '../work/deadline';
import { gameConfig as c } from '../../config/gameConfig';
import type { State, Todo, Target } from '../state/gameState';
import { expireEffects } from '../buffs/buffManager';
import { releasePending } from '../work/followUpManager';
import { refreshStats, workReward, originalWorkReward } from '../work/workStats';
import { getCompletionDeadlineStatus } from '../work/deadline';
import { rollEvent } from '../events/eventManager';
import { processBilling } from '../products/billingManager';
import { routineAnchor, scaledSeconds, syncWorld } from '../time/worldTime';
import { updateProjectClosures } from '../projects/projectManager';
import { breakfastStart, breakfastCutoff, completeTarget, ensureTarget, interruptWithFood, lunchEnd, lunchStart, progressTarget, processBreakfastCutoff, settleLunch, targetRate } from '../targets/targetManager';
export interface SimulationOptions {
 // Internal online clock budget; all boundaries still use totalWorldTime.
 realTimeSeconds?: number;
 offline?: boolean;
 // Actual online seconds, before game speed. Offline and debug jumps supply none.
 activeSeconds?: number;
 // Optional read-only measurement hooks; no counters are persisted in GameState.
 onBoundary?: (s: State) => void;
 onPromotionWorkStart?: (snapshot: PromotionWorkStartTelemetry) => void;
 onWorkProgress?: (amount: number) => void;
 onWorkCompleted?: (todo: Todo, overdue: boolean, revenueLoss: number) => void;
 onTargetInterval?: (target: Target | null, worldStart: number, seconds: number) => void;
}
export const onlineTimeRate = (s:State) => s.currentTarget?.type==='SLEEP' ? c.time.sleepTimeAcceleration : s.player.settings.speed;
export function advanceOnline(s:State,realSeconds:number,options:SimulationOptions={}) {
 if(!Number.isFinite(realSeconds)||realSeconds<=0)return;
 runAdvance(s,realSeconds,{...options,offline:false,realTimeSeconds:realSeconds,activeSeconds:realSeconds});
}
function progressAge(s: State, seconds: number, offline: boolean) {
 let ageDays = seconds / c.time.dayDuration;
 if(offline)ageDays=resolveOfflineAgeProgress(s,ageDays);
 s.player.ageProgressDays += ageDays; s.player.age = c.age.start + s.player.ageProgressDays / c.age.daysPerYear;
}
// Same timestamp: complete -> expire -> pending -> billing -> day/schedule -> events -> selection.
export function advance(s: State, seconds: number, options: SimulationOptions = {}) {
 if(!Number.isFinite(seconds)||seconds<=0)return;
 if(!options.offline)return runAdvance(s,seconds,options);
 // Dedicated promotion exception: offline world/work proceeds, assessment and deadline do not.
 const p=structuredClone(s.promotion), target=s.currentTarget?.type==='PROMOTION'?s.currentTarget:s.suspendedTargets.find(x=>x.target.type==='PROMOTION')?.target;
 const phase=s.needs.phase, wasCurrent=s.currentTarget?.type==='PROMOTION', start=s.world.totalWorldTime;
 const promotionDay=s.needs.promotionDayWorkday,dinnerHandled=s.needs.promotionDinnerHandled;
 if(promotionDay!==undefined)s.needs.promotionDayWorkday=null;
 s.suspendedTargets=s.suspendedTargets.filter(x=>x.target.type!=='PROMOTION');
 if(s.currentTarget?.type==='PROMOTION'){s.currentTarget=null;s.needs.phase='WAIT';}
 s.promotion={...p,status:'NOT_ELIGIBLE',pending:false,scheduledWorkday:null,deadlineWorldTime:null};
 runAdvance(s,seconds,options);
 const elapsed=s.world.totalWorldTime-start,last=s.promotion.lastCheckedWorkday;
 s.promotion=p;s.promotion.lastCheckedWorkday=last;
 if(promotionDay!==undefined&&promotionDay!==null){s.needs.promotionDayWorkday=promotionDay+Math.round(elapsed/c.time.dayDuration);s.needs.promotionDinnerHandled=dinnerHandled;}
 if(target?.type==='PROMOTION') {
  target.deadlineWorldTime+=elapsed;p.deadlineWorldTime=target.deadlineWorldTime;
  if(wasCurrent){if(s.currentTarget)s.suspendedTargets.push({target:s.currentTarget,phase:s.needs.phase});s.currentTarget=target;s.needs.phase=phase;}
  else s.suspendedTargets.push({target,phase:'AFTERNOON'});
 }
 else if(p.status==='COMPLETED_PENDING_DINNER'&&p.deadlineWorldTime!==null)p.deadlineWorldTime+=elapsed;
 if(p.status==='SCHEDULED'&&p.scheduledWorkday!==null)p.scheduledWorkday+=Math.round(elapsed/c.time.dayDuration);
}
function runAdvance(s: State, seconds: number, options: SimulationOptions = {}) {
 if (!Number.isFinite(seconds) || seconds <= 0) return;
 const activePerWorld=!options.offline && Number.isFinite(options.activeSeconds) && options.activeSeconds!>0 ? options.activeSeconds!/seconds : 0;
 const activeGate=c.prestige.minimumPrestigeActiveMinutes*60;
 s.world.lastDeadlineNoticeWorkday ??= getDeadlineWorkdayIndex(s.world.totalWorldTime);
 syncWorld(s); if(!options.offline&&s.promotion.status==='ACTIVE'&&s.promotion.deadlineWorldTime!==null&&s.world.totalWorldTime>=s.promotion.deadlineWorldTime-1e-8){if(s.world.totalWorldTime<=s.promotion.deadlineWorldTime+1e-8)completeTarget(s);failExpiredPromotion(s);} checkPromotionWorkStart(s,!!options.offline,options.onPromotionWorkStart); expireEffects(s); releasePending(s); processBilling(s); if(!options.offline)failExpiredPromotion(s); ensureTarget(s); refreshStats(s);
 options.onBoundary?.(s);
 const fixedFinish = s.world.totalWorldTime + seconds;
 let realRemaining=options.realTimeSeconds??0;
 const activeAtStart=s.runStatistics.activeSeconds,worldAtStart=s.world.totalWorldTime;
 while (options.realTimeSeconds!==undefined ? realRemaining>1e-9 : s.world.totalWorldTime < fixedFinish - 1e-8) {
  if (c.food.allowWorkInterruption && s.currentTarget?.type === 'WORK' && s.world.totalWorldTime >= s.needs.satietyUntil - 1e-8) interruptWithFood(s);
  const now = s.world.totalWorldTime; const t = s.currentTarget;
  const timeRate=options.realTimeSeconds!==undefined?onlineTimeRate(s):1;
  const finish=options.realTimeSeconds!==undefined?now+realRemaining*timeRate:fixedFinish;
  const boundaries = [finish, s.needs.sleep.windowStart, s.needs.sleep.windowEnd, nextAgeWorkloadBoundary(s,!!options.offline), nextWorkStart(now), (s.world.dayIndex + 1) * c.time.dayDuration, s.world.nextEventAt, ...s.pendingFollowUps.map(p => p.triggerAtWorldTime), ...s.buffs.map(b => b.expiresAt), ...s.debuffs.map(d => d.expiresAt), ...Object.values(s.products).filter(p => p.active && p.nextBillingWorldTime !== null).map(p => p.nextBillingWorldTime!), breakfastStart(s), breakfastCutoff(s), lunchStart(s), lunchEnd(s), routineAnchor(s, c.time.offWorkAnchor), routineAnchor(s, c.time.sleepAnchor), (s.needs.routineDay + 1) * c.time.dayDuration];
  if(['ACTIVE','COMPLETED_PENDING_DINNER'].includes(s.promotion.status)&&s.promotion.deadlineWorldTime!==null)boundaries.push(s.promotion.deadlineWorldTime);
  const intervalActiveRate=options.realTimeSeconds!==undefined?1/timeRate:activePerWorld;
  if(intervalActiveRate>0 && s.runStatistics.activeSeconds<activeGate-1e-8)boundaries.push(now+(activeGate-s.runStatistics.activeSeconds)/intervalActiveRate);
  if (s.meetings.scheduledNormal?.scheduledStartWorldTime !== null && s.meetings.scheduledNormal) boundaries.push(s.meetings.scheduledNormal.scheduledStartWorldTime!);
  if (t) boundaries.push(t.type === 'MEETING' ? now + t.remainingDuration : t.type === 'SLEEP' ? s.needs.sleep.windowEnd : t.type === 'LUNCH' ? t.windowEnd : now + Math.max(0, t.requirement - t.progress) / targetRate(s, t));
  if (c.food.allowWorkInterruption && t?.type === 'WORK') boundaries.push(s.needs.satietyUntil);
  // Use the same existing world-clock precision for both elapsed work and time.
  // Otherwise fractional batches process a different delta than the clock advances.
  const next = Number(Math.min(...boundaries.filter(x => x > now + 1e-8)).toFixed(10));
  const delta = next - now; if (!(delta > 0)) throw Error('V2 模擬時間無法推進');
  const previousProgress = t?.type === 'WORK' ? t.progress : 0;
  progressTarget(s, delta); progressAge(s, delta, !!options.offline);
  options.onTargetInterval?.(t, now, delta);
  if(options.realTimeSeconds!==undefined){realRemaining=Math.max(0,realRemaining-delta/timeRate);s.runStatistics.activeSeconds=Number((activeAtStart+options.realTimeSeconds-realRemaining).toFixed(10));}
  else s.runStatistics.activeSeconds=Number((activeAtStart+(next-worldAtStart)*activePerWorld).toFixed(10));
  if(Math.abs(s.runStatistics.activeSeconds-activeGate)<1e-8)s.runStatistics.activeSeconds=activeGate;
  if (t?.type === 'WORK') options.onWorkProgress?.(t.progress - previousProgress);
  const oldDay = s.world.dayIndex; s.world.totalWorldTime = Number(next.toFixed(10)); syncWorld(s);
  const completedWork = options.onWorkCompleted && t?.type === 'WORK' && t.progress >= t.requirement - 1e-8
    ? { todo: t.todo, overdue: getCompletionDeadlineStatus(t.todo,s.world.totalWorldTime) === 'OVERDUE', loss: originalWorkReward(s,t.todo) - workReward(s,t.todo,undefined,true) } : null;
  completeTarget(s);
  if(!options.offline)failExpiredPromotion(s);
  if (completedWork) options.onWorkCompleted?.(completedWork.todo,completedWork.overdue,completedWork.loss);
  expireEffects(s); releasePending(s); processBilling(s);
  if (options.offline) s.runStatistics.offlineDays += s.world.dayIndex - oldDay;
  processBreakfastCutoff(s); settleLunch(s);
  if (s.world.totalWorldTime >= s.world.nextEventAt - 1e-8) { rollEvent(s); s.world.nextEventAt += scaledSeconds(c.events.interval); }
  notifyDeadlineWorkday(s); checkPromotionWorkStart(s,!!options.offline,options.onPromotionWorkStart); ensureTarget(s); updateProjectClosures(s); refreshStats(s);
  options.onBoundary?.(s);
 }
}
