import { gameConfig as c } from '../../config/gameConfig';
import type { State, PromotionState, PromotionTarget } from '../state/gameState';
import { rawWorkSpeed, rawWorkQuality } from '../work/workStats';
import { permanentMultiplier } from '../prestige/permanentUpgrades';
import { canPromote, promoteTransaction } from './promotion';
import { getDeadlineWorkdayIndex, nextWorkStart } from '../work/deadline';
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
export function promotionEligible(s:State) {
 const p=s.promotion, r=c.promotionQualification.requirements[s.career.rank], q=getPromotionQualificationStats(s);
 return !!r && canPromote(s) && q.evaluatedEfficiency>=r.efficiency && q.evaluatedQuality>=r.quality &&
  (p.retryAvailableWorkday===null||getDeadlineWorkdayIndex(s.world.totalWorldTime)>=p.retryAvailableWorkday) && !p.pending && !['SCHEDULED','ACTIVE'].includes(p.status) && !activeMandatoryBoss(s) && !activeBossMeeting(s);
}
// Online only, exactly once per WorkStart. No probability or RNG.
export function checkPromotionWorkStart(s:State,offline=false) {
 const day=getDeadlineWorkdayIndex(s.world.totalWorldTime),p=s.promotion;
 if(day<0||p.lastCheckedWorkday===day)return;
 p.lastCheckedWorkday=day;
 if(offline||Math.abs(s.world.totalWorldTime-(day*c.time.dayDuration+scaledSeconds(c.time.workStartAnchor)))>1e-8)return;
 if(p.pending||p.status==='ACTIVE'||p.status==='SCHEDULED')return;
 if(s.career.rank>=c.ranks.length-1){p.status='MAX_RANK';return;}
 if(p.retryAvailableWorkday!==null&&day<p.retryAvailableWorkday){p.status='COOLDOWN';return;}
 p.status=promotionEligible(s)?'ELIGIBLE':'NOT_ELIGIBLE';
 if(p.status==='ELIGIBLE') {p.status='SCHEDULED';p.scheduledWorkday=day;p.fromRank=s.career.rank;p.toRank=s.career.rank+1;p.failureReason=null;}
}
export function preparePromotionEvening(s:State) {
 const p=s.promotion;
 if(p.status!=='SCHEDULED'||p.pending||p.scheduledWorkday===null||s.world.totalWorldTime<p.scheduledWorkday*c.time.dayDuration+scaledSeconds(c.time.offWorkAnchor)-1e-8||activeMandatoryBoss(s)||activeBossMeeting(s))return false;
 p.pending=true;s.needs.bossChecked=true;
 notify(s,'升職','今晚安排升職考核，晚餐後開始；完成即可升職。');return true;
}
export function startPromotionAssignment(s:State) {
 const p=s.promotion;if(!p.pending||p.fromRank===null||p.toRank===null)return false;
 const config=c.promotionAssignment.assignments[p.fromRank],now=s.world.totalWorldTime,id=newId(s,'promotion');
 const target:PromotionTarget={id,type:'PROMOTION',name:config.name,requirement:config.workload,progress:0,createdAt:now,startedAt:now,deadlineWorldTime:nextWorkStart(now),fromRank:p.fromRank,toRank:p.toRank};
 Object.assign(p,{status:'ACTIVE',pending:false,assignmentId:id,createdAt:now,startedAt:now,deadlineWorldTime:target.deadlineWorldTime,requirement:target.requirement,progress:0});
 s.currentTarget=target;s.needs.phase='AFTERNOON';notify(s,'升職',`${config.name}開始，期限為下一個上班時間。`);return true;
}
function fail(s:State,reason:string,requirement=false) {
 const p=s.promotion;p.status=requirement?'FAILED_REQUIREMENT':'COOLDOWN';p.failureReason=reason;p.pending=false;
 p.retryAvailableWorkday=getDeadlineWorkdayIndex(s.world.totalWorldTime)+c.promotionAssignment.retryWorkdays;
 s.currentTarget=s.currentTarget?.type==='PROMOTION'?null:s.currentTarget;
 s.suspendedTargets=s.suspendedTargets.filter(x=>x.target.type!=='PROMOTION');
 p.assignmentId=null;p.deadlineWorldTime=null;p.progress=0;p.requirement=0;p.scheduledWorkday=null;
 notify(s,'升職',`升職考核失敗：${reason}；${c.promotionAssignment.retryWorkdays} 個工作日後可重新評估。`);
}
export function finishPromotion(s:State,t:PromotionTarget) {
 if(s.career.rank!==t.fromRank||!canPromote(s)){fail(s,'資金或逾期工作條件已不符合',true);return false;}
 const rank=c.ranks[t.toRank]; if(!promoteTransaction(s)){fail(s,'正式升職條件已失效',true);return false;}
 const low=s.promotion.lowProfileEnabled,last=s.promotion.lastCheckedWorkday;s.promotion=emptyPromotion();s.promotion.lowProfileEnabled=low;s.promotion.lastCheckedWorkday=last;
 s.promotion.status=t.toRank===c.ranks.length-1?'MAX_RANK':'NOT_ELIGIBLE';notify(s,'升職',`考核完成，升職為 ${rank.name}。`);return true;
}
export function failExpiredPromotion(s:State) {
 const p=s.promotion;if(p.status==='ACTIVE'&&p.deadlineWorldTime!==null&&s.world.totalWorldTime>=p.deadlineWorldTime-1e-8){fail(s,'未於下一個上班時間完成');return true;}return false;
}
