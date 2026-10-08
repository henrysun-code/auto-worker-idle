import { gameConfig as c } from '../../config/gameConfig';
import type { State, PromotionState, PromotionTarget } from '../state/gameState';
import { rawWorkSpeed, rawWorkQuality, earn } from '../work/workStats';
import { permanentMultiplier } from '../prestige/permanentUpgrades';
import { canPromote, promoteTransaction, getUnresolvedOverdueWorkCount } from './promotion';
import { getDeadlineWorkdayIndex } from '../work/deadline';
import { newId, scaledSeconds } from '../time/worldTime';
import { notify } from '../events/eventLog';
import { activeMandatoryBoss } from './bossEvents';
import { activeBossMeeting } from '../targets/meetingTarget';
export const emptyPromotion = ():PromotionState => ({ lowProfileEnabled:false,status:'NOT_ELIGIBLE',lastCheckedWorkday:null,scheduledWorkday:null,fromRank:null,toRank:null,assignmentId:null,createdAt:null,startedAt:null,deadlineWorldTime:null,requirement:0,progress:0,retryAvailableWorkday:null,failureReason:null,pending:false });
export function getPromotionQualificationStats(s:State) {
 const efficiency=rawWorkSpeed(s)*permanentMultiplier(s,'workEfficiency'), quality=rawWorkQuality(s)*permanentMultiplier(s,'workQuality');
 const multiplier=s.promotion.lowProfileEnabled?c.promotionLowProfile.multiplier:1;
 return {efficiency,quality,evaluatedEfficiency:efficiency*multiplier,evaluatedQuality:quality*multiplier};
}
export const hasPromotionWork = (s:State) => s.promotion.assignmentId!==null && ['ACTIVE','FAILED_OVERTIME'].includes(s.promotion.status);
export const isPromotionDay = (s:State) => s.needs.promotionDayWorkday===s.needs.routineDay;
export function promotionWorkload(rank:number) {
 return c.promotionQualification.requirements[rank].efficiency * scaledSeconds(c.time.offWorkAnchor-c.time.workStartAnchor) * c.promotionAssignment.workloadFactor;
}
export function promotionEligible(s:State) {
 const p=s.promotion,r=c.promotionQualification.requirements[s.career.rank],q=getPromotionQualificationStats(s);
 return !!r&&canPromote(s)&&q.evaluatedEfficiency>=r.efficiency&&q.evaluatedQuality>=r.quality&&
 (p.retryAvailableWorkday===null||getDeadlineWorkdayIndex(s.world.totalWorldTime)>=p.retryAvailableWorkday)&&!p.pending&&!hasPromotionWork(s)&&p.status!=='SCHEDULED'&&!activeMandatoryBoss(s)&&!activeBossMeeting(s);
}
export function promotionWorkStartTelemetry(s:State) {
 const q=getPromotionQualificationStats(s),r=c.promotionQualification.requirements[s.career.rank],next=c.ranks[s.career.rank+1],p=s.promotion;
 const overdue=getUnresolvedOverdueWorkCount(s),day=getDeadlineWorkdayIndex(s.world.totalWorldTime);
 const eqQualified=!!r&&q.evaluatedEfficiency>=r.efficiency&&q.evaluatedQuality>=r.quality;
 const overdueQualified=!!next&&overdue<=next.maxOverdueAllowed;
 const cooldownEnded=p.retryAvailableWorkday===null||day>=p.retryAvailableWorkday;
 const unfinishedPromotion=hasPromotionWork(s)||p.pending||p.status==='SCHEDULED';
 const mandatoryBoss=!!activeMandatoryBoss(s),bossMeeting=!!activeBossMeeting(s);
 const blockingReasons=[!next?'MAX_RANK':null,!eqQualified?'EQ':null,!overdueQualified?'OVERDUE':null,!cooldownEnded?'COOLDOWN':null,unfinishedPromotion?'UNFINISHED_PROMOTION':null,mandatoryBoss?'MANDATORY_BOSS':null,bossMeeting?'BOSS_MEETING':null].filter((x):x is string=>x!==null);
 return {worldTime:s.world.totalWorldTime,realSeconds:s.runStatistics.activeSeconds,rank:s.career.rank,...q,eqQualified,overdue,overdueQualified,cooldownEnded,unfinishedPromotion,mandatoryBoss,bossMeeting,blockingReasons};
}
export type PromotionWorkStartTelemetry=ReturnType<typeof promotionWorkStartTelemetry>&{assigned:boolean};
export function checkPromotionWorkStart(s:State,offline=false,onEvaluation?:(snapshot:PromotionWorkStartTelemetry)=>void) {
 const day=getDeadlineWorkdayIndex(s.world.totalWorldTime);
 const record=!offline&&day>=0&&s.promotion.lastCheckedWorkday!==day&&Math.abs(s.world.totalWorldTime-(day*c.time.dayDuration+scaledSeconds(c.time.workStartAnchor)))<=1e-8;
 const snapshot=record&&onEvaluation?promotionWorkStartTelemetry(s):null,old=s.promotion.assignmentId;
 evaluatePromotionWorkStart(s,offline);
 if(snapshot)onEvaluation?.({...snapshot,assigned:s.promotion.assignmentId!==null&&s.promotion.assignmentId!==old});
}
function evaluatePromotionWorkStart(s:State,offline=false) {
 const day=getDeadlineWorkdayIndex(s.world.totalWorldTime),p=s.promotion;
 if(day<0||p.lastCheckedWorkday===day)return;
 p.lastCheckedWorkday=day;
 if(offline||Math.abs(s.world.totalWorldTime-(day*c.time.dayDuration+scaledSeconds(c.time.workStartAnchor)))>1e-8)return;
 if(hasPromotionWork(s)||p.pending||p.status==='SCHEDULED')return;
 if(s.career.rank>=c.ranks.length-1){p.status='MAX_RANK';return;}
 if(p.retryAvailableWorkday!==null&&day<p.retryAvailableWorkday){p.status='COOLDOWN';return;}
 p.status=promotionEligible(s)?'ELIGIBLE':'NOT_ELIGIBLE';
 if(p.status==='ELIGIBLE'){
  Object.assign(p,{status:'SCHEDULED',scheduledWorkday:day,fromRank:s.career.rank,toRank:s.career.rank+1,failureReason:null,pending:true});
  startPromotionAssignment(s);
 }
}
// Kept as a compatibility entry point; assessments no longer wait for evening.
export function preparePromotionEvening(_s:State){return false;}
export function startPromotionAssignment(s:State) {
 const p=s.promotion;if(!p.pending||p.fromRank===null||p.toRank===null)return false;
 const config=c.promotionAssignment.assignments[p.fromRank],now=s.world.totalWorldTime,id=newId(s,'promotion');
 const day=p.scheduledWorkday??getDeadlineWorkdayIndex(now);
 const target:PromotionTarget={id,type:'PROMOTION',name:config.name,requirement:promotionWorkload(p.fromRank),progress:0,createdAt:now,startedAt:now,deadlineWorldTime:day*c.time.dayDuration+scaledSeconds(c.time.offWorkAnchor),fromRank:p.fromRank,toRank:p.toRank};
 if(s.currentTarget)s.suspendedTargets.push({target:s.currentTarget,phase:s.needs.phase});
 Object.assign(p,{status:'ACTIVE',pending:false,assignmentId:id,createdAt:now,startedAt:now,deadlineWorldTime:target.deadlineWorldTime,requirement:target.requirement,progress:0});
 s.needs.promotionDayWorkday=day;s.needs.promotionDinnerHandled=false;s.needs.bossChecked=true;
 s.needs.lunchRest=0;s.needs.lunchSettled=false;
 s.currentTarget=target;s.needs.phase='AFTERNOON';notify(s,'升職',`${config.name}早上開始；下班／晚餐錨點前完成才可升職，今日略過午餐與午休。`);return true;
}
function clearAssignment(s:State){const p=s.promotion;p.pending=false;p.assignmentId=null;p.scheduledWorkday=null;p.deadlineWorldTime=null;}
export function finishPromotion(s:State,t:PromotionTarget) {
 const p=s.promotion;p.progress=t.progress;
 if(p.status==='ACTIVE'&&s.world.totalWorldTime<t.deadlineWorldTime-1e-8){
  p.status='COMPLETED_PENDING_DINNER';notify(s,'升職','考核工作已完成；下班／晚餐錨點結算升職交易。');return true;
 }
 if(p.status==='FAILED_OVERTIME'||(p.status!=='COMPLETED_PENDING_DINNER'&&s.world.totalWorldTime>t.deadlineWorldTime+1e-8)){
  p.status='COOLDOWN';clearAssignment(s);earn(s,c.promotionAssignment.failedCompletionReward);
  notify(s,'升職','考核加班工作已完成；本次未升職。');return false;
 }
 if(s.career.rank!==t.fromRank||!canPromote(s)||!promoteTransaction(s)){
  p.status='FAILED_REQUIREMENT';p.failureReason='完成時資金或逾期工作條件已不符合';
  p.retryAvailableWorkday=getDeadlineWorkdayIndex(s.world.totalWorldTime)+c.promotionAssignment.retryWorkdays;
  clearAssignment(s);notify(s,'升職',p.failureReason);return false;
 }
 const low=p.lowProfileEnabled,last=p.lastCheckedWorkday;s.promotion=emptyPromotion();s.promotion.lowProfileEnabled=low;s.promotion.lastCheckedWorkday=last;
 s.promotion.status=t.toRank===c.ranks.length-1?'MAX_RANK':'NOT_ELIGIBLE';notify(s,'升職',`考核準時完成，升職為 ${c.ranks[t.toRank].name}。`);return true;
}
export function failExpiredPromotion(s:State) {
 const p=s.promotion;
 if(p.status==='COMPLETED_PENDING_DINNER'&&p.deadlineWorldTime!==null&&s.world.totalWorldTime>=p.deadlineWorldTime-1e-8){
  return finishPromotion(s,{id:p.assignmentId!,type:'PROMOTION',name:c.promotionAssignment.assignments[p.fromRank!].name,createdAt:p.createdAt!,startedAt:p.startedAt!,fromRank:p.fromRank!,toRank:p.toRank!,deadlineWorldTime:p.deadlineWorldTime,requirement:p.requirement,progress:p.progress});
 }
 if(p.status==='ACTIVE'&&p.deadlineWorldTime!==null&&s.world.totalWorldTime>=p.deadlineWorldTime-1e-8){
  p.status='FAILED_OVERTIME';p.failureReason='未於下班／晚餐錨點完成，晚餐後仍須完成原工作';
  p.retryAvailableWorkday=getDeadlineWorkdayIndex(s.world.totalWorldTime)+c.promotionAssignment.retryWorkdays;
  notify(s,'升職',`${p.failureReason}；${c.promotionAssignment.retryWorkdays} 個工作日後可重新評估。`);return true;
 }
 return false;
}
export function resumePromotionOvertime(s:State){
 if(s.promotion.status!=='FAILED_OVERTIME')return false;
 const index=s.suspendedTargets.findIndex(x=>x.target.type==='PROMOTION'&&x.target.id===s.promotion.assignmentId);
 if(index<0)return false;
 const [old]=s.suspendedTargets.splice(index,1);s.currentTarget=old.target;s.needs.phase='AFTERNOON';return true;
}
