import { getDeadlineWorkdayIndex, nextWorkStart } from '../work/deadline';
import { gameConfig as c } from '../../config/gameConfig';
import type { Action, PermanentId, State, UpgradeId } from '../state/gameState';
import { generateDailyWork, createTodo } from '../work/todoManager';
import { createFollowUp, releasePending } from '../work/followUpManager';
import { createProject, completeProjectSubtask } from '../projects/projectManager';
import { resolveBoss } from '../career/bossEvents';
import { triggerEvent } from '../events/eventManager';
import { toggleProduct } from '../products/productManager';
import { renewProduct } from '../products/billingManager';
import { settleOfflineMinutes } from '../time/offlineSimulation';
import { scaledSeconds } from '../time/worldTime';
import { advance } from './SimulationLoop';
import { ensureTarget, interruptWithFood, startFood } from '../targets/targetManager';
import { prestigeReset } from '../prestige/prestigeManager';
import { activeBossMeeting, createMeeting, startMeeting } from '../targets/meetingTarget';
import { activeMandatoryBoss } from '../career/bossEvents';
export function debugAction(s: State, a: Extract<Action, { type: 'debug' }>) {
  const value = Math.max(0, Math.min(c.debug.maxValue, Number(a.value ?? 0))); if (!Number.isFinite(value)) return false;
  switch (a.command) {
    case 'normalMeeting': {
      // Do not call ensureTarget here: an unprocessed WorkStart can otherwise consume formal RNG.
      if (!['MORNING','AFTERNOON'].includes(s.needs.phase) || s.currentTarget &&
        (s.currentTarget.type!=='WORK' || s.currentTarget.todo.mandatoryOvertime)) return false;
      startMeeting(s,createMeeting(s,'NORMAL',s.world.totalWorldTime));return true;
    }
    case 'bossMeeting': {
      if (activeMandatoryBoss(s) || activeBossMeeting(s) || s.promotion.pending || ['SCHEDULED','ACTIVE'].includes(s.promotion.status)) return false;
      s.meetings.pendingBoss=createMeeting(s,'BOSS');s.needs.bossChecked=true;
      if(s.currentTarget?.type==='FOOD' && s.currentTarget.meal==='DINNER'){s.needs.phase='DINNER';return true;}
      if(s.currentTarget){s.suspendedTargets.push({target:s.currentTarget,phase:s.needs.phase});s.currentTarget=null;}
      startFood(s,'DINNER');return true;
    }
    case 'ageProductEnable': case 'ageProductDisable': { const def=c.products.definitions.find(p=>p.ageEfficiencyCompensationRate>0); if (!def) return false; if (s.products[def.id].active !== (a.command==='ageProductEnable')) return toggleProduct(s,def.id); break; }
    case 'overdue5': for(let i=0;i<5;i++){const t=createTodo(s,c.work.templates[0]);t.assignmentWorkdayIndex=getDeadlineWorkdayIndex(s.world.totalWorldTime)-1;t.deadlineWorkdays=0;t.dueWorkdayIndex=t.assignmentWorkdayIndex;s.todoQueue.push(t);} break;
    case 'money': s.player.money = value; break;
    case 'moneyAdd': s.player.money += c.debug.moneyGrant; break;
    case 'age': s.player.ageProgressDays = Math.max(0, (value - c.age.start) * c.age.daysPerYear); s.player.age = c.age.start + s.player.ageProgressDays / c.age.daysPerYear; break;
    case 'upgrade': if (!(a.id! in c.upgrades)) return false; s.player.upgrades[a.id as UpgradeId] = Math.min(c.debug.maxLevel, Math.floor(value)); break;
    case 'rank': s.career.rank = Math.min(c.ranks.length - 1, Math.floor(value)); s.career.highestRank = Math.max(s.career.highestRank, s.career.rank); break;
    case 'clarity': s.prestige.clarity += a.value ?? c.debug.clarityGrant; break;
    case 'permanent': { const u = c.prestige.upgrades.find(u => u.id === a.id); if (!u) return false; s.prestige.levels[u.id as PermanentId] = Math.min(c.debug.maxLevel, Math.floor(value)); break; }
    case 'day': advance(s, Math.max(0, (Math.max(1, Math.floor(value)) - 1) * c.time.dayDuration - s.world.totalWorldTime)); break;
    case 'lunch': case 'offwork': case 'sleep': { const reference = a.command === 'lunch' ? c.time.lunchStart : a.command === 'offwork' ? c.time.offWorkAnchor : c.time.sleepAnchor; let at = s.world.dayIndex * c.time.dayDuration + scaledSeconds(reference); if (at < s.world.totalWorldTime) at += c.time.dayDuration; advance(s, at - s.world.totalWorldTime); break; }
    case 'nextWorkStart': case 'beforeWorkStart': { const at=nextWorkStart(s.world.totalWorldTime); advance(s,at-s.world.totalWorldTime-(a.command === 'beforeWorkStart' ? .01 : 0)); break; }
    case 'setDeadlineWorkday': { const t = s.todoQueue[0] ?? (s.currentTarget?.type === 'WORK' ? s.currentTarget.todo : null); if (!t) return false; t.dueWorkdayIndex = Math.max(t.assignmentWorkdayIndex!,Math.floor(value)); t.deadlineWorkdays=t.dueWorkdayIndex-t.assignmentWorkdayIndex!; break; }
    case 'deadlineBoss': case 'deadlineRework': case 'deadlineProject': case 'deadlineNone': case 'deadlineNormal': case 'deadlineToday': case 'deadlineOverdue': case 'deadline1': case 'deadline3': {
      const profile = a.command === 'deadlineBoss' ? 'BOSS_URGENT' : a.command === 'deadlineRework' ? 'REWORK_SHORT' : a.command === 'deadlineNone' ? 'NO_DEADLINE' : 'NORMAL';
      if (a.command === 'deadlineProject') { createProject(s); break; }
      const t = createTodo(s, { ...c.work.templates[0], deadlineProfileId: profile, ...(a.command === 'deadline1' ? {deadlineWorkdays:1} : a.command === 'deadline3' ? {deadlineWorkdays:3} : {}) }, a.command === 'deadlineBoss' ? 'BOSS' : a.command === 'deadlineRework' ? 'FOLLOW_UP' : 'NORMAL');
      if (a.command === 'deadlineRework') { t.type = 'REWORK'; t.followUpType = 'REWORK'; t.name = '期限測試返工'; t.baseReward = 0; }
      if (a.command === 'deadlineToday' || a.command === 'deadlineOverdue') { t.assignmentWorkdayIndex = getDeadlineWorkdayIndex(s.world.totalWorldTime) - (a.command === 'deadlineOverdue' ? 1 : 0); t.deadlineWorkdays=0; t.dueWorkdayIndex=t.assignmentWorkdayIndex; }
      s.todoQueue.push(t); break;
    }
    case 'daily': generateDailyWork(s); break;
    case 'todos10': generateDailyWork(s, 10); break;
    case 'clearTodos': s.todoQueue = []; break;
    case 'followImmediate': case 'followDelayed': { const todo = s.currentTarget?.type === 'WORK' ? s.currentTarget.todo : s.todoQueue[0] ?? createTodo(s, c.work.templates[0]); createFollowUp(s, todo, 'CLIENT_REPLY', 2, a.command === 'followDelayed' ? 20 : 0); break; }
    case 'pendingNow': releasePending(s, true); break;
    case 'project': createProject(s); break;
    case 'subtask': { const p = s.projects.find(p => p.status === 'ACTIVE'); if (!p) return false; const todo = s.currentTarget?.type === 'WORK' && s.currentTarget.todo.projectId === p.id ? s.currentTarget.todo : s.todoQueue.find(t => t.projectId === p.id && t.subtaskId); if (!todo) return false; s.todoQueue = s.todoQueue.filter(t => t.id !== todo.id); if (s.currentTarget?.type === 'WORK' && s.currentTarget.todo.id === todo.id) s.currentTarget = null; completeProjectSubtask(s, todo); break; }
    case 'bossCatch': if(s.promotion.pending||['SCHEDULED','ACTIVE'].includes(s.promotion.status))return false; resolveBoss(s, true); break;
    case 'escapeSuccess': if(s.promotion.pending||['SCHEDULED','ACTIVE'].includes(s.promotion.status))return false; resolveBoss(s, true, true); break;
    case 'escapeFail': if(s.promotion.pending||['SCHEDULED','ACTIVE'].includes(s.promotion.status))return false; resolveBoss(s, true, false); break;
    case 'event': if (!triggerEvent(s, a.id!, true)) return false; break;
    case 'product': return toggleProduct(s, a.id!);
    case 'productDays': if (!s.products[a.id!]) return false; s.products[a.id!].nextBillingWorldTime = s.world.totalWorldTime + value * c.time.dayDuration; break;
    case 'renew': if (!s.products[a.id!]) return false; s.products[a.id!].nextBillingWorldTime = s.world.totalWorldTime; renewProduct(s, a.id!); break;
    case 'offline30': settleOfflineMinutes(s, 30); break;
    case 'offline16h': settleOfflineMinutes(s, 960); break;
    case 'prestige': prestigeReset(s, true); break;
    case 'prestigeReady': s.prestige.forcedReady = true; break;
    case 'foodInterrupt': return interruptWithFood(s);
    default: return false;
  }
  ensureTarget(s); return true;
}
