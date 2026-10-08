import { canUseProductFood, canResolveProblem, getProductDefinition, recordProductWorkReward } from '../products/productEffects';
import { preparePromotionEvening, startPromotionAssignment, finishPromotion, isPromotionDay, hasPromotionWork, resumePromotionOvertime } from '../career/promotionAssignment';
import { sleepOutputRate, settleSleepWindow, nextSleepWindow } from './sleepWindow';
import { getDeadlineStatus, getCompletionDeadlineStatus } from '../work/deadline';
import { gameConfig as c } from '../../config/gameConfig';
import type { State, Target, Todo } from '../state/gameState';
import { newId, routineAnchor, scaledSeconds } from '../time/worldTime';
import { effectiveLifeSpeed, effectiveWorkSpeed, earn, restOutput, workReward, originalWorkReward } from '../work/workStats';
import { refillTodos } from '../work/todoManager';
import { selectNextWork } from '../work/workSelector';
import { generateFollowUps } from '../work/followUpManager';
import { completeProjectSubtask, maybeSpawnProject } from '../projects/projectManager';
import { resolveBoss, activeMandatoryBoss } from '../career/bossEvents';
import { addBuff } from '../buffs/buffManager';
import { startEligibleProblem, finishProblem } from './problemTarget';
import { notify } from '../events/eventLog';
import { activeBossMeeting, scheduleNormalMeeting, startScheduledMeeting, startMeeting, progressMeeting, finishMeeting } from './meetingTarget';

export const breakfastStart = (s: State) => routineAnchor(s, c.time.breakfastStart);
export const breakfastCutoff = (s: State) => routineAnchor(s, c.time.breakfastCutoff);
export const lunchStart = (s: State) => routineAnchor(s, c.time.lunchStart);
export const lunchEnd = (s: State) => routineAnchor(s, c.time.lunchStart + c.time.lunchDuration);
export function selectedFood(s: State) {
  const food = c.food.items.find(f => f.id === s.player.settings.defaultFoodId);
  return food && (!food.productId || canUseProductFood(s,food.productId)) && s.player.money >= food.price ? food : c.food.items.find(f => f.id === 'normal')!;
}
export function startFood(s: State, meal: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'EXTRA') {
  if (meal === 'BREAKFAST') {
    if (s.needs.breakfastState === 'MISSED') { s.needs.phase = 'MORNING'; return; }
    if (s.needs.breakfastState !== 'PENDING') return;
    if (s.world.totalWorldTime < breakfastStart(s) - 1e-8) return;
    if (!s.needs.breakfastAnchorEligible && s.world.totalWorldTime >= breakfastCutoff(s) - 1e-8) {
      missBreakfast(s); return;
    }
    s.needs.breakfastState = 'STARTED';
    s.needs.breakfastAnchorEligible = false;
  }
  const food = selectedFood(s); s.player.money -= food.price;
  if (food.productId) s.products[food.productId].contributionStats.totalSpent += food.price;
  s.currentTarget = { id: newId(s, 'food'), type: 'FOOD', name: food.name, requirement: food.requirement, progress: 0, createdAt: s.world.totalWorldTime, foodId: food.id, productId: food.productId || undefined, meal };
  if (meal !== 'EXTRA') s.needs.phase = meal === 'LUNCH' ? 'LUNCH_FOOD' : meal;
  notify(s, '飲食', `${{ BREAKFAST: '早餐', LUNCH: '午餐', DINNER: '晚餐', EXTRA: '工作補給' }[meal]}：自動使用 ${food.name}${s.player.settings.defaultFoodId !== food.id ? '（餘額不足或產品無效，已改用普通餐點）' : ''}。`, { productId: food.productId || undefined });
}
export function startWork(s: State, todo: Todo) { s.currentTarget = { id: newId(s, 'work'), type: 'WORK', name: todo.name, requirement: todo.workload, progress: 0, createdAt: s.world.totalWorldTime, todo }; }
function startLife(s: State, type: 'ENTERTAINMENT' | 'SLEEP') {
  s.needs.phase = type;
  const requirement=type==='SLEEP'?Math.max(1e-8,s.needs.sleep.windowEnd-s.world.totalWorldTime):scaledSeconds(c.life.entertainmentRequirement);
  s.currentTarget={id:newId(s,'life'),type,name:type==='SLEEP'?'睡眠窗口':'娛樂需求怪',requirement,progress:0,createdAt:s.world.totalWorldTime};
}
function missBreakfast(s: State) {
  s.needs.breakfastState = 'MISSED'; s.needs.phase = 'MORNING';
  notify(s, '飲食', '早餐時間已經過了。');
}
export function processBreakfastCutoff(s: State) {
  if (!s.needs.breakfastAnchorEligible && s.needs.breakfastState === 'PENDING' && s.needs.phase === 'BREAKFAST' && s.world.totalWorldTime >= breakfastCutoff(s) - 1e-8) missBreakfast(s);
}
export function lunchTier(rest: number) { const ratio = rest / (c.lunch.fullRestTarget * scaledSeconds(1)); return [...c.lunch.tiers].reverse().find(t => ratio + 1e-8 >= t.minimum)!; }
export function settleLunch(s: State) {
  if(isPromotionDay(s)){s.needs.lunchSettled=true;return;}
  if (s.needs.lunchSettled || s.world.totalWorldTime < lunchEnd(s) - 1e-8) return;
  s.needs.lunchSettled = true; const ratio = s.needs.lunchRest / (c.lunch.fullRestTarget * scaledSeconds(1));
  const tier = lunchTier(s.needs.lunchRest);
  if (tier.speedBonus > 0) addBuff(s, { id: 'lunch', name: tier.name, expiresAt: routineAnchor(s, c.time.offWorkAnchor), modifiers: { workSpeed: tier.speedBonus } });
  notify(s, 'Buff', `午休結束：${tier.name}，休息 ${s.needs.lunchRest.toFixed(0)}（${Math.round(ratio * 100)}%），下午效率 +${Math.round(tier.speedBonus * 100)}%。`);
}
function afterLunchFood(s: State) {
  if (s.world.totalWorldTime < lunchEnd(s) - 1e-8) { s.needs.phase = 'LUNCH'; s.currentTarget = { id: newId(s, 'lunch'), type: 'LUNCH', name: '午休・喘口氣', windowStart: lunchStart(s), windowEnd: lunchEnd(s), accumulatedRestOutput: s.needs.lunchRest, createdAt: s.world.totalWorldTime }; }
  else { settleLunch(s); s.needs.phase = 'AFTERNOON'; }
}
function startRoutine(s: State) {
  nextSleepWindow(s); s.needs.routineDay = s.world.dayIndex; s.needs.bossChecked = false; s.needs.pendingBossId = null; s.needs.lunchSettled = false; s.needs.lunchRest = 0;
  s.needs.breakfastState = 'PENDING'; s.needs.phase = 'BREAKFAST';
}
export function resumeSuspended(s: State) {
  while (s.suspendedTargets.length) {
    const old = s.suspendedTargets.pop()!; s.needs.phase = old.phase;
    if (!targetIsValid(s, old.target)) {
      if (old.target.type === 'LUNCH') s.needs.phase = 'AFTERNOON';
      continue;
    }
    s.currentTarget = old.target; return;
  }
  s.currentTarget = null;
}
export function targetIsValid(s: State, t: Target): boolean {
  if (t.type === 'SLEEP') return s.world.totalWorldTime < s.needs.sleep.windowEnd - 1e-8;
  if (t.type === 'LUNCH') return t.windowEnd > s.world.totalWorldTime + 1e-8;
  if (t.type === 'PROBLEM') {
    const d = s.debuffs.find(d => d.id === t.debuffId && d.expiresAt > s.world.totalWorldTime + 1e-8);
    const p = getProductDefinition(t.productId);
    return !!d && !!p && canResolveProblem(s,p.id,d.resolvableByProductTag) && c.events.definitions.some(e => e.id === t.eventType && (e.id === d.type || e.id === d.sourceEvent) && e.problemRequirement > 0);
  }
  if (t.type === 'WORK') {
    if (!(t.todo.workload > 0)) return false;
    if (!t.todo.projectId) return true;
    const p = s.projects.find(p => p.id === t.todo.projectId);
    return !!p && p.status !== 'CLOSED' && (!t.todo.subtaskId || p.subtasks.some(x => x.id === t.todo.subtaskId && x.status === 'QUEUED'));
  }
  // Already-paid FOOD remains valid even after its subscription expires.
  return t.type !== 'FOOD' || c.food.items.some(f => f.id === t.foodId);
}
export function targetRate(s: State, t: Target) { return t.type === 'MEETING' ? 1 : (t.type === 'WORK' || t.type === 'PROMOTION') ? effectiveWorkSpeed(s) : t.type === 'FOOD' ? c.food.processingRate : t.type === 'LUNCH' ? restOutput(s) : t.type === 'PROBLEM' ? 1 : t.type === 'SLEEP' ? sleepOutputRate(s) : effectiveLifeSpeed(s); }
export function ensureTarget(s: State) {
  scheduleNormalMeeting(s);
  preparePromotionEvening(s);
  settleLunch(s);
  if(settleSleepWindow(s)) {
    if(s.currentTarget?.type==='SLEEP'||s.currentTarget?.type==='ENTERTAINMENT')s.currentTarget=null;
    s.suspendedTargets=s.suspendedTargets.filter(x=>x.target.type!=='SLEEP'&&x.target.type!=='ENTERTAINMENT');
    const mandatory=activeMandatoryBoss(s) || activeBossMeeting(s) || s.promotion.pending || hasPromotionWork(s);
    if(!mandatory)startRoutine(s);
    else { nextSleepWindow(s); s.needs.routineDay=s.world.dayIndex; s.needs.bossChecked=true; }
    s.needs.breakfastState = 'PENDING';
    s.needs.breakfastAnchorEligible = true;
  }
  // Dinner interrupts even a problem holding the failed assessment; no work is discarded.
  if(isPromotionDay(s) && !s.needs.promotionDinnerHandled && s.world.totalWorldTime>=routineAnchor(s,c.time.offWorkAnchor)-1e-8){
    s.needs.promotionDinnerHandled=true;
    if(s.currentTarget)s.suspendedTargets.push({target:s.currentTarget,phase:s.needs.phase});
    s.currentTarget=null;startFood(s,'DINNER');return;
  }
  if(isPromotionDay(s) && s.needs.phase==='DINNER' && s.currentTarget?.type==='FOOD')return;
  // A no-longer-active subscription cannot finish resolving a problem.
  const problem = s.currentTarget;
  if (problem && !targetIsValid(s, problem)) { s.currentTarget = null; resumeSuspended(s); }
  if (!s.currentTarget && s.suspendedTargets.length) resumeSuspended(s);
  if (startEligibleProblem(s)) return;
  if(!s.currentTarget&&s.promotion.pending){startPromotionAssignment(s);return;}
  if(s.needs.breakfastAnchorEligible && s.needs.breakfastState==='PENDING') {
    if(!s.currentTarget){startFood(s,'BREAKFAST');return;}
  }
  if (startScheduledMeeting(s)) return;
  if (s.currentTarget) return;
  if (s.suspendedTargets.length) { resumeSuspended(s); if (s.currentTarget) return; }
  const now = s.world.totalWorldTime;
  switch (s.needs.phase) {
    case 'BREAKFAST': startFood(s, 'BREAKFAST'); if (s.needs.breakfastState === 'MISSED') ensureTarget(s); break;
    case 'LUNCH_FOOD': startFood(s, 'LUNCH'); break;
    case 'LUNCH': afterLunchFood(s); if (!s.currentTarget) ensureTarget(s); break;
    case 'DINNER': startFood(s, 'DINNER'); break;
    case 'ENTERTAINMENT': startLife(s, 'ENTERTAINMENT'); break;
    case 'SLEEP': startLife(s, 'SLEEP'); break;
    case 'WAIT': if(now>=s.needs.sleep.windowStart-1e-8){s.needs.phase='SLEEP';startLife(s,'SLEEP');} break;
    case 'MORNING': case 'AFTERNOON': {
      const morning = s.needs.phase === 'MORNING';
      if (morning && s.needs.projectRollProcessedRoutineId !== s.needs.routineDay) { s.needs.projectRollProcessedRoutineId = s.needs.routineDay; maybeSpawnProject(s); }
      const end = morning ? lunchStart(s) : routineAnchor(s, c.time.offWorkAnchor);
      if (now >= end - 1e-8) {
        if(morning && isPromotionDay(s)){s.needs.phase='AFTERNOON';ensureTarget(s);break;}
        if(!morning && isPromotionDay(s) && s.needs.promotionDinnerHandled){afterEveningWork(s);ensureTarget(s);break;}
        if (morning) { startFood(s, 'LUNCH'); break; }
        if (!s.needs.bossChecked && !preparePromotionEvening(s)) resolveBoss(s);
        startFood(s, 'DINNER');
        break;
      }
      refillTodos(s);
      const next = selectNextWork(s, t => !t.mandatoryOvertime && (['OVERDUE','DUE_TODAY'].includes(getDeadlineStatus(t,s)) || t.sourceType === 'PROJECT' || t.sourceType === 'BOSS' || t.workload / effectiveWorkSpeed(s) <= end - now + 1e-8));
      if (next) { if (next.id === s.needs.pendingBossId) s.needs.pendingBossId = null; startWork(s, next); }
      break;
    }
  }
}
export function progressTarget(s: State, seconds: number) {
  const t = s.currentTarget; if (!t) return;
  if (t.type === 'MEETING') { progressMeeting(s, t, seconds); return; }
  if (t.type === 'LUNCH') { const output = targetRate(s, t) * Math.max(0, Math.min(seconds, t.windowEnd - s.world.totalWorldTime)); t.accumulatedRestOutput += output; s.needs.lunchRest += output; }
  else if(t.type==='SLEEP'){const duration=Math.max(0,Math.min(s.world.totalWorldTime+seconds,s.needs.sleep.windowEnd)-Math.max(s.world.totalWorldTime,s.needs.sleep.windowStart));s.needs.sleep.duration+=duration;s.needs.sleep.output+=duration*sleepOutputRate(s);t.progress=Math.min(t.requirement,t.progress+seconds);}
  else { t.progress = Math.min(t.requirement, t.progress + targetRate(s, t) * seconds); if(t.type==='PROMOTION')s.promotion.progress=t.progress; }
}
export function completeTarget(s: State) {
  const t = s.currentTarget; if (!t) return false;
  const done = t.type === 'MEETING' ? t.remainingDuration <= 1e-8 : t.type === 'SLEEP' ? s.world.totalWorldTime >= s.needs.sleep.windowEnd - 1e-8 : t.type === 'LUNCH' ? s.world.totalWorldTime >= t.windowEnd - 1e-8 : t.progress >= t.requirement - 1e-8;
  if (!done) return false; s.currentTarget = null;
  if (t.type === 'MEETING') {
    finishMeeting(s, t);
    if (t.isBossMeeting) {
      if (s.world.totalWorldTime < routineAnchor(s,c.time.offWorkAnchor) && s.world.totalWorldTime >= routineAnchor(s,c.time.workStartAnchor)) s.needs.phase = 'MORNING';
      else afterEveningWork(s);
    }
  } else if (t.type === 'PROMOTION') {
    s.promotion.progress=t.progress; finishPromotion(s,t);
    if(s.world.totalWorldTime<routineAnchor(s,c.time.offWorkAnchor)-1e-8)s.needs.phase=s.world.totalWorldTime<lunchStart(s)&&!isPromotionDay(s)?'MORNING':'AFTERNOON';
    else afterEveningWork(s);
  } else if (t.type === 'WORK') {
    const reward = workReward(s, t.todo, undefined, true); earn(s, reward); s.runStatistics.completedWork++; s.permanentStatistics.completedWork++;
    if (t.todo.followUpType && c.followUps.types.find(f => f.type === t.todo.followUpType)?.qualitySensitive) s.runStatistics.reworkCount++;
    recordProductWorkReward(s,t.todo,reward,id=>workReward(s,t.todo,id,true));
    notify(s, '工作', getCompletionDeadlineStatus(t.todo, s.world.totalWorldTime) === 'OVERDUE' ? `${t.name}逾期完成：原報酬 $${originalWorkReward(s,t.todo)}，損失 $${originalWorkReward(s,t.todo)-reward}，實收 $${reward}。` : `${t.name}完成，+$${reward}。`, { workId: t.todo.id, projectId: t.todo.projectId });
    generateFollowUps(s, t.todo); completeProjectSubtask(s, t.todo);
    if(t.todo.mandatoryOvertime){s.needs.pendingBossId=null;if(s.world.totalWorldTime<routineAnchor(s,c.time.offWorkAnchor)&&s.world.totalWorldTime>=routineAnchor(s,c.time.workStartAnchor))s.needs.phase='MORNING';else afterEveningWork(s);}
  } else if (t.type === 'FOOD') {
    const food = c.food.items.find(f => f.id === t.foodId)!; s.needs.satietyUntil = s.world.totalWorldTime + scaledSeconds(food.satietyDuration);
    if (t.productId && s.products[t.productId]) { const stats = s.products[t.productId].contributionStats; stats.foodUses = (stats.foodUses ?? 0) + 1; stats.foodSecondsSaved = (stats.foodSecondsSaved ?? 0) + (c.food.items[0].requirement - food.requirement) / c.food.processingRate; }
    if (t.meal === 'BREAKFAST') { s.needs.phase = 'MORNING'; s.needs.breakfastState = 'COMPLETED'; }
    else if (t.meal === 'LUNCH') s.needs.phase = 'LUNCH';
    else if(t.meal==='DINNER'){
      const meeting=s.meetings.pendingBoss;
      if(resumePromotionOvertime(s)){ /* Same failed assessment identity and progress. */ }
      else if(meeting){s.meetings.pendingBoss=null;s.needs.phase='AFTERNOON';startMeeting(s,meeting);}
      else {const boss=selectNextWork(s,t=>t.id===s.needs.pendingBossId&&!!t.mandatoryOvertime);if(boss){s.needs.phase='AFTERNOON';startWork(s,boss);}else afterEveningWork(s);}
    }
    else { /* Restore only after all same-time boundary effects. */ }
  } else if (t.type === 'LUNCH') { s.needs.phase = 'AFTERNOON'; }
  else if (t.type === 'ENTERTAINMENT') { addBuff(s, { id: 'relaxed', name: '放鬆', expiresAt: s.world.totalWorldTime + c.time.dayDuration, modifiers: { quality: c.life.relaxedQuality } }); s.needs.phase = 'SLEEP'; }
  else if(t.type==='SLEEP'){ /* Settled once by ensureTarget at the work-start boundary. */ } else if (t.type === 'PROBLEM') { finishProblem(s, t); }
  return true;
}
export function interruptWithFood(s: State) {
  if (!s.currentTarget || s.currentTarget.type !== 'WORK') return false;
  s.suspendedTargets.push({ target: s.currentTarget, phase: s.needs.phase }); startFood(s, s.needs.breakfastAnchorEligible && s.needs.breakfastState==='PENDING' ? 'BREAKFAST' : 'EXTRA'); return true;
}

function afterEveningWork(s: State) {
 const now=s.world.totalWorldTime;
 if(now>=s.needs.sleep.windowEnd-1e-8){settleSleepWindow(s);startRoutine(s);return;}
 const remaining=s.needs.sleep.windowStart-now;
 if(remaining>=Math.max(scaledSeconds(c.life.minimumEntertainmentTime),scaledSeconds(c.life.entertainmentRequirement)/effectiveLifeSpeed(s)))s.needs.phase='ENTERTAINMENT';
 else s.needs.phase=now<s.needs.sleep.windowStart?'WAIT':'SLEEP';
}
