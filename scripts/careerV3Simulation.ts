import assert from 'node:assert/strict';
import {gameConfig as c} from '../src/config/gameConfig';
import {initialState} from '../src/game/state/initialState';
import type {State,UpgradeId,Target} from '../src/game/types';
import {advance as productionAdvance} from '../src/game/engine/SimulationLoop';
import {applyAction} from '../src/game/engine/actions';
import {canPrestige,calculateClarityReward} from '../src/game/prestige/prestigeManager';
import {getPromotionQualificationStats,promotionEligible} from '../src/game/career/promotionAssignment';
import {getDeadlineWorkdayIndex} from '../src/game/work/deadline';
import {effectiveWorkSpeed,originalWorkReward} from '../src/game/work/workStats';
import {getAgeWorkloadMultiplier} from '../src/game/work/ageWorkload';
import {careerV3Decision,spendClarity,type Policy} from './careerV3Policy';
import {counts,liveWork,outstanding,type Row} from './careerSimulation';
import {mean,quantile} from './balanceMetrics';
import {setBalanceHooks} from './balanceInstrumentation';
import {setV3Observer} from './careerV3Instrumentation';
export const timings=['NEVER','AS_SOON_AS_ELIGIBLE','TARGET_30_MIN','TARGET_60_MIN','TARGET_120_MIN','TARGET_180_MIN'] as const;
export type Timing=typeof timings[number];
const abilities:UpgradeId[]=['efficiency','quality','flattery','lifeManagement','slacking'];
const thresholds=[10,25,50,75,100,150,175,200,225,250,275,300];
const STOP=Symbol('natural policy boundary');
export function simulateV3(policy:Policy,timing:Timing,seed:number,engine=productionAdvance,maximum=21600){
 const s=initialState(seed,0),tables:Record<string,Row[]>={ranks:[],promotions:[],bottlenecks:[],thresholds:[],prestiges:[],sleep:[],lunch:[],dinner:[],cycles:[],daily:[]};
 let cycle=0,offset=0,cycleStart=0,lastEarned=0,lastMeeting=0,lastSafeDay=-999,lastRank=0,lastSafeEarned=0;
 let gross=0,workIncome=0,meetingIncome=0,upgradeSpend=0,promotionSpend=0,otherSpend=0,startingMoney=s.player.money,resetCash=0;
 let generated=0,processed=0,discarded=0,completed=0,overdueCompleted=0,overdueLoss=0,rework=0,maxWorkError=0,maxRevenueError=0;
 let bossChecks=0,bossEncounter=0,bossEscapes=0,bossSeconds=0,promoNights=0,projectSpawn=0,projectDelivered=0,projectClosed=0;
 let actualSleep=0,entSeconds=0,entCompleted=0,ageExposure=0,speedExposure=0,qualityExposure=0,normalMeetingCount=0,bossMeetingCount=0;
 let firstEligible:number|null=null,firstPrestige:number|null=null,clarityEarned=0;
 const severity:number[]=[],time:Record<string,number>={},integrals={todo:0,dueToday:0,overdue:0},peaks={todo:0,dueToday:0,overdue:0};
 const sources:Record<string,{count:number,generated:number,processed:number,completed:number,income:number}>={};
 for(const id of ['NORMAL','FOLLOW_UP','PROJECT','BOSS','EVENT'])sources[id]={count:0,generated:0,processed:0,completed:0,income:0};
 const known=new Map<string,number>(),projects=new Map<string,string>(),targets=new Set<string>(),entNights=new Set<string>(),finishedEntNights=new Set<string>();
 const meetingTouch=new Set<string>(),meetingCross=new Set<string>(),meetingSeen=new Set<string>(),sleepLoss={Promotion:0,Boss:0,Meeting:0,UNATTRIBUTED:0};
 const rankDwell=Array(5).fill(0),blocks=new Map<string,number>(),rankReached=new Set<string>(),thresholdReached=new Set<string>();
 const attempts=new Map<string,number>();let promotion:any=null,dinnerFinish:number|null=null,lastDay=0;
 const now=()=>offset+s.runStatistics.activeSeconds;
 const put=(table:string,data:any)=>tables[table].push({policy,timing,seed,cycle,activeMinute:now()/60,runActiveMinute:s.runStatistics.activeSeconds/60,...data});
 const snap=()=>({worldTime:s.world.totalWorldTime,day:s.world.dayIndex+1,money:s.player.money,age:s.player.age,...s.player.upgrades,...counts(s),...getPromotionQualificationStats(s)});
 function milestones(){for(const id of abilities)for(const level of thresholds){const key=`${cycle}:${id}:${level}`;if(s.player.upgrades[id]>=level&&!thresholdReached.has(key)){thresholdReached.add(key);put('thresholds',{ability:id,level,censored:false,minutesInRun:s.runStatistics.activeSeconds/60});}}}
 function trackRank(){if(s.career.rank>lastRank){assert.ok(promotion&&promotion.success&&promotion.toRank===s.career.rank,'Rank changes must come from completed formal assignment');}lastRank=s.career.rank;const key=`${cycle}:${s.career.rank}`;if(!rankReached.has(key)){rankReached.add(key);put('ranks',{rank:s.career.rank,minutesInRun:s.runStatistics.activeSeconds/60,...snap()});}}
 function bottleneck(){const r=c.promotionQualification.requirements[s.career.rank],next=c.ranks[s.career.rank+1],p=s.promotion,q=getPromotionQualificationStats(s);if(!r||!next)return 'MAX_RANK';if(p.status==='ACTIVE')return 'Assignment active';if(p.pending||p.status==='SCHEDULED')return 'Scheduled waiting OffWork';if(p.retryAvailableWorkday!==null&&getDeadlineWorkdayIndex(s.world.totalWorldTime)<p.retryAvailableWorkday)return 'Cooldown';if(q.efficiency<r.efficiency)return 'E不足';if(q.quality<r.quality)return 'Q不足';if(s.player.money<next.promotionCost)return 'Money不足';if(counts(s).overdue>next.maxOverdueAllowed)return 'Overdue超限';return promotionEligible(s)?'Waiting WorkStart':'Other';}
 function check(){
  assert.ok(Number.isFinite(s.player.money)&&s.player.money>=0);assert.ok(Number.isInteger(s.world.rng));assert.ok(s.career.rank>=0&&s.career.rank<=4);assert.equal(s.promotion.lowProfileEnabled,false);assert.equal(s.runStatistics.offlineDays,0);assert.equal(s.prestige.forcedReady,false);
  for(const p of Object.values(s.products)){assert.equal(p.active,false);assert.equal(p.contributionStats.totalSpent,0);assert.equal(p.contributionStats.bonusIncome??0,0);}
  assert.ok(liveWork(s).filter(t=>t.mandatoryOvertime).length<=1);
  assert.ok(!(liveWork(s).some(t=>t.mandatoryOvertime)&&(s.meetings.pendingBoss||s.currentTarget?.type==='MEETING'&&s.currentTarget.isBossMeeting)),'Boss work and meeting must be mutually exclusive');
  for(const t of liveWork(s)){assert.ok(Number.isFinite(t.workload)&&t.workload>=0);assert.equal(t.workload,known.get(t.id)??t.workload,'Existing workload changed retroactively');if(t.sourceType==='FOLLOW_UP'){assert.equal(t.mandatoryOvertime,undefined);assert.equal(t.bossSeverity,undefined);}}
  const we=generated-processed-discarded-outstanding(s);maxWorkError=Math.max(maxWorkError,Math.abs(we));assert.ok(Math.abs(we)<1e-4,`Work conservation ${we}`);
  const re=startingMoney+gross-upgradeSpend-promotionSpend-otherSpend-resetCash-s.player.money;maxRevenueError=Math.max(maxRevenueError,Math.abs(re));assert.ok(Math.abs(re)<1e-4,`Revenue conservation ${re}`);
 }
 function boundary(){
  for(const t of liveWork(s))if(!known.has(t.id)){known.set(t.id,t.workload);generated+=t.workload;const m=sources[t.sourceType];m.count++;m.generated+=t.workload;}
  for(const p of s.projects){const old=projects.get(p.id);if(!old){projectSpawn++;projects.set(p.id,p.status);}if(old!==p.status){if(p.status==='DELIVERED')projectDelivered++;if(p.status==='CLOSED'){projectClosed++;if(old==='ACTIVE')projectDelivered++;}projects.set(p.id,p.status);}}
  const earned=s.runStatistics.earned-lastEarned;gross+=earned;lastEarned=s.runStatistics.earned;const meeting=s.meetings.statistics.meetingCompensation-lastMeeting;meetingIncome+=meeting;lastMeeting=s.meetings.statistics.meetingCompensation;
  const t=s.currentTarget;if(t&&!targets.has(t.id)){targets.add(t.id);if(t.type==='ENTERTAINMENT')entNights.add(`${cycle}:${s.needs.sleep.windowStart}`);if(t.type==='FOOD'){otherSpend+=c.food.items.find(f=>f.id===t.foodId)!.price;if(t.meal==='DINNER'){dinnerFinish=null;put('dinner',{kind:'START',delay:Math.max(0,s.world.totalWorldTime-(s.needs.routineDay*c.time.dayDuration+c.time.offWorkAnchor)),...snap()});}}}
  trackRank();milestones();if(firstEligible===null&&canPrestige(s))firstEligible=now()/60;
  check();const day=getDeadlineWorkdayIndex(s.world.totalWorldTime),safe=earned>0||day!==lastSafeDay||s.career.rank!==lastSafeEarned||ready();lastSafeDay=day;lastSafeEarned=s.career.rank;if(safe)throw STOP;
 }
 function ready(){const target=timing.startsWith('TARGET_')?Number(timing.split('_')[1])*60:0;return timing!=='NEVER'&&s.runStatistics.activeSeconds>=target&&canPrestige(s);}
 function censor(){for(const id of abilities)for(const level of thresholds)if(!thresholdReached.has(`${cycle}:${id}:${level}`))put('thresholds',{ability:id,level,minutesInRun:null,censored:true,censorReason:now()>=maximum-1e-8?'CENSORED_AT_360':'CENSORED_AT_PRESTIGE',observedRunMinutes:s.runStatistics.activeSeconds/60});put('cycles',{duration:s.runStatistics.activeSeconds/60,rank:s.career.rank,...snap(),permanentLevels:{...s.prestige.levels}});}
 function decide(){if(ready()){
   assert.ok(canPrestige(s));const minutes=s.runStatistics.activeSeconds/60,reward=calculateClarityReward(s),before={...snap(),levels:{...s.player.upgrades},permanentLevels:{...s.prestige.levels}};censor();discarded+=outstanding(s);resetCash+=s.player.money;offset=now();if(firstPrestige===null)firstPrestige=offset/60;assert.ok(applyAction(s,{type:'prestige'}));clarityEarned+=reward;startingMoney+=s.player.money;const permanentPurchases=spendClarity(s);put('prestiges',{completedCycle:cycle,runLength:minutes,reward,before,permanentPurchases,permanentLevelsAfter:{...s.prestige.levels}});cycle++;cycleStart=offset;lastEarned=0;lastMeeting=0;lastSafeDay=-999;lastRank=0;lastSafeEarned=0;known.clear();projects.clear();targets.clear();promotion=null;dinnerFinish=null;assert.equal(s.runStatistics.activeSeconds,0);assert.equal(s.player.age,c.age.start);assert.equal(s.career.rank,0);assert.ok(Object.values(s.player.upgrades).every(x=>x===0));
  }
  careerV3Decision(s,policy,(_id,cost)=>{upgradeSpend+=cost;milestones();});trackRank();check();
 }
 setBalanceHooks({projectAttempt:()=>{},projectPassed:()=>{},boss:(caught,escaped,value)=>{bossChecks++;if(caught){bossEncounter++;severity.push(value??0);if(escaped)bossEscapes++;}}});
 setV3Observer((kind,observed,data)=>{
  assert.equal(observed,s);
  if(kind==='scheduled'){const key=`${cycle}:${s.promotion.fromRank}`;const retry=attempts.get(key)??0;attempts.set(key,retry+1);promotion={fromRank:s.promotion.fromRank,toRank:s.promotion.toRank,qualificationTime:now(),scheduledTime:now(),qualificationWorld:s.world.totalWorldTime,offWorkAnchor:s.promotion.scheduledWorkday!*c.time.dayDuration+c.time.offWorkAnchor,offWorkEventTime:null,actualStart:null,finish:null,rankUpTime:null,processingSeconds:0,sleepSecondsLost:0,touchesSleep:false,crossesWorkStart:false,retryCount:retry,moneyQualification:s.player.money,overdueQualification:counts(s).overdue,qualificationE:getPromotionQualificationStats(s).efficiency,qualificationQ:getPromotionQualificationStats(s).quality,delaySources:{},success:false};}
  if(kind==='evening'){assert.ok(promotion);promoNights++;promotion.offWorkEventTime=now();}
  if(kind==='promotionStart'){assert.ok(promotion);promotion.actualStart=now();promotion.startWorld=s.world.totalWorldTime;promotion.startDelayOffWork=s.world.totalWorldTime-promotion.offWorkAnchor;promotion.startDelayDinner=dinnerFinish===null?null:s.world.totalWorldTime-dinnerFinish;promotion.moneyStart=s.player.money;promotion.effectiveWorkSpeedStart=effectiveWorkSpeed(s);}
  if(kind==='promotionFinishBefore'){assert.ok(promotion);promotionSpend+=c.ranks[data.toRank].promotionCost;}
  if(kind==='promotionSuccess'){promotion.success=true;promotion.finish=now();promotion.rankUpTime=now();promotion.moneyCompletion=s.player.money;promotion.overdueCompletion=counts(s).overdue;put('promotions',promotion);}
  if(kind==='promotionFail'){assert.ok(promotion);promotion.finish=now();promotion.failureReason=data.reason;promotion.failureCategory=!data.requirement?'Deadline':s.player.money<c.ranks[s.promotion.toRank!].promotionCost?'Money':counts(s).overdue>c.ranks[s.promotion.toRank!].maxOverdueAllowed?'Overdue':'FAILED_REQUIREMENT';promotion.moneyCompletion=s.player.money;promotion.overdueCompletion=counts(s).overdue;put('promotions',promotion);promotion=null;}
  if(kind==='sleep'){put('sleep',{ratio:data.lastRatio,actualDuration:data.duration,actualOutput:data.output,windowStart:data.windowStart,windowEnd:data.windowEnd,zero:data.duration===0});}
  if(kind==='lunch'){put('lunch',{output:data.output,ratio:data.output/(c.lunch.fullRestTarget*c.time.dayDuration/c.time.referenceDayDuration),missed:data.output===0,lifeLevel:s.player.upgrades.lifeManagement});}
  if(kind==='targetComplete'){if(data.type==='FOOD'&&data.meal==='DINNER'){dinnerFinish=s.world.totalWorldTime;put('dinner',{kind:'COMPLETE',delay:Math.max(0,s.world.totalWorldTime-(s.needs.routineDay*c.time.dayDuration+c.time.offWorkAnchor)),...snap()});}if(data.type==='ENTERTAINMENT'){entCompleted++;finishedEntNights.add(`${cycle}:${s.needs.sleep.windowStart}`);}}
 });
 trackRank();decide();let guard=0;
 while(now()<maximum-1e-8){assert.ok(++guard<2000000,'Canonical runner failed to advance');const before=now(),target=timing.startsWith('TARGET_')?Number(timing.split('_')[1])*60:Infinity;const timer=s.runStatistics.activeSeconds<target?target-s.runStatistics.activeSeconds:Infinity;const duration=Math.min(maximum-before,60,timer);
  try{engine(s,duration,{activeSeconds:duration,onBoundary:boundary,onWorkProgress:amount=>{processed+=amount;const t=s.currentTarget;if(t?.type==='WORK')sources[t.todo.sourceType].processed+=amount;},onWorkCompleted:(t,overdue,loss)=>{completed++;sources[t.sourceType].completed++;const reward=originalWorkReward(s,t)-loss;workIncome+=reward;sources[t.sourceType].income+=reward;if(overdue)overdueCompleted++;overdueLoss+=loss;if(t.followUpType&&c.followUps.types.find(f=>f.type===t.followUpType)?.qualitySensitive)rework++;},onTargetInterval:(t,start,seconds)=>{
   const cc=counts(s);for(const id of ['todo','dueToday','overdue'] as const){integrals[id]+=cc[id]*seconds;peaks[id]=Math.max(peaks[id],cc[id]);}
   const kind=t?.type??'IDLE';time[kind]=(time[kind]??0)+seconds;if(cycle===0)rankDwell[s.career.rank]+=seconds;const b=bottleneck(),key=`${cycle}:${s.career.rank}:${b}`;blocks.set(key,(blocks.get(key)??0)+seconds);
   ageExposure+=getAgeWorkloadMultiplier(s.player.age)*seconds;speedExposure+=s.needs.sleep.speedModifier*seconds;qualityExposure+=s.needs.sleep.qualityModifier*seconds;
   const overlap=Math.max(0,Math.min(start+seconds,s.needs.sleep.windowEnd)-Math.max(start,s.needs.sleep.windowStart));
   if(t?.type==='SLEEP')actualSleep+=overlap;else if(overlap>0){const owner=t?.type==='PROMOTION'?'Promotion':t?.type==='MEETING'?'Meeting':t?.type==='WORK'&&t.todo.mandatoryOvertime?'Boss':'UNATTRIBUTED';sleepLoss[owner]+=overlap;}
   if(t?.type==='WORK'&&t.todo.mandatoryOvertime)bossSeconds+=seconds;
   if(t?.type==='ENTERTAINMENT')entSeconds+=seconds;
   if(t?.type==='MEETING'){const key=`${cycle}:${t.id}`;if(!meetingSeen.has(key)){meetingSeen.add(key);if(t.isBossMeeting)bossMeetingCount++;else normalMeetingCount++;}if(overlap>0)meetingTouch.add(key);if(start<Math.floor(start/60)*60+c.time.workStartAnchor&&start+seconds>=Math.floor(start/60)*60+c.time.workStartAnchor)meetingCross.add(key);}
   if(promotion&&!promotion.success){if(t?.type==='PROMOTION'){promotion.processingSeconds+=seconds;promotion.sleepSecondsLost+=overlap;promotion.touchesSleep ||= overlap>0;promotion.crossesWorkStart ||= start+seconds>=s.promotion.deadlineWorldTime!;}else if(promotion.actualStart===null&&start+seconds>promotion.offWorkAnchor){const source=t?.type==='WORK'?(t.todo.mandatoryOvertime?'Boss legacy state':'Existing Work'):t?.type??'Other';const elapsed=Math.max(0,start+seconds-Math.max(start,promotion.offWorkAnchor));promotion.delaySources[source]=(promotion.delaySources[source]??0)+elapsed;}}
  }});}catch(e){if(e!==STOP){(e as any).reproductionState=structuredClone(s);throw e;}}
  // Initial onBoundary may pause before advancing. A second call sees updated safe markers.
  if(now()>before&&Math.floor(now()/60)>lastDay){lastDay=Math.floor(now()/60);put('daily',{...snap()});}
  decide();
 }
 censor();for(const [key,seconds]of blocks){const [cy,rank,reason]=key.split(':');put('bottlenecks',{cycle:Number(cy),fromRank:Number(rank),toRank:Number(rank)+1,reason,activeMinutes:seconds/60});}
 if(promotion&&!promotion.success){put('promotions',{...promotion,censored:true});}
 const sleep=tables.sleep.map(r=>Number(r.ratio)),mt=s.meetings.statistics;
 // Meeting totals are measured through actual interval/time and compensation ledger;
 // count across resets derives from unique target IDs plus observer completions below.
 const summary={policy,timing,seed,actualActiveMinutes:now()/60,firstR4ActiveMinute:tables.ranks.find(r=>r.cycle===0&&r.rank===4)?.activeMinute??null,firstPrestigeEligibleActiveMinute:firstEligible,firstPrestigeActiveMinute:firstPrestige,prestigeCount:cycle,clarityEarned,clarityTotal:s.prestige.clarity,permanentLevels:{...s.prestige.levels},finalRank:s.career.rank,finalLevels:{...s.player.upgrades},finalMoney:s.player.money,startAge:c.age.start,endAge:s.player.age,ageProgressDays:s.player.ageProgressDays,ageWorkloadMultiplierExposure:ageExposure/maximum,agecareCompensation:0,grossIncome:gross,grossWorkIncome:workIncome,grossPerMinute:gross/(now()/60),promotionSpend,runUpgradeSpend:upgradeSpend,productSpend:0,taggedProductIncome:0,otherSpend,startingMoneyContribution:startingMoney,prestigeDiscardedCash:resetCash,netIncome:gross-upgradeSpend-promotionSpend-otherSpend,projectParentBonus:gross-workIncome-meetingIncome,meetingCompensation:meetingIncome,bossIncome:sources.BOSS.income,generatedWorkCount:Object.values(sources).reduce((n,m)=>n+m.count,0),generatedWorkload:generated,processedWorkload:processed,workloadRatio:generated?processed/generated:null,discardedWorkload:discarded,finalOutstanding:outstanding(s),completedWork:completed,completedWorkPerDay:completed/(now()/c.time.dayDuration),overdueCompleted,overdueRevenueLoss:overdueLoss,reworkCount:rework,sources,averageTodo:integrals.todo/maximum,finalTodo:counts(s).todo,peakTodo:peaks.todo,averageDueToday:integrals.dueToday/maximum,finalDueToday:counts(s).dueToday,peakDueToday:peaks.dueToday,averageOverdue:integrals.overdue/maximum,finalOverdue:counts(s).overdue,peakOverdue:peaks.overdue,projectSpawn,projectDelivered,projectClosed,bossChecks,bossEncounter,bossEncounterRate:bossChecks?bossEncounter/bossChecks:0,escapeAttempts:bossEncounter,escapeSuccess:bossEscapes,escapeFailure:bossEncounter-bossEscapes,severityMean:mean(severity),severityP50:quantile(severity,.5),severityP90:quantile(severity,.9),severityMax:severity.length?Math.max(...severity):0,bossWorkSeconds:bossSeconds,bossWorkSecondsPerDay:bossSeconds/(now()/60),promotionNightReplacedBossCheck:promoNights,meetingSeconds:time.MEETING??0,meetingSecondsPerDay:(time.MEETING??0)/(now()/60),meetingTouchSleep:meetingTouch.size,meetingCrossWorkStart:meetingCross.size,meetingCausedWorkDelay:'N/A',sleepRatioMean:mean(sleep),sleepRatioMedian:quantile(sleep,.5),sleepRatioP10:quantile(sleep,.1),sleepRatioP90:quantile(sleep,.9),sleepBelow1:sleep.filter(v=>v<1).length,sleepBelowHalf:sleep.filter(v=>v<.5).length,zeroSleepDays:sleep.filter(v=>v===0).length,allNighterDays:tables.sleep.filter(r=>r.zero).length,actualSleepSeconds:actualSleep,actualSleepSecondsPerDay:actualSleep/(now()/60),sleepSpeedModifierExposure:speedExposure/maximum,sleepQualityModifierExposure:qualityExposure/maximum,sleepLoss,entertainmentAttemptDays:entNights.size,entertainmentCompletedDays:finishedEntNights.size,entertainmentSkippedDays:Math.max(0,tables.sleep.length-entNights.size),entertainmentSecondsPerDay:entSeconds/(now()/60),lunchOutputMean:mean(tables.lunch.map(r=>Number(r.output))),lunchRatioMean:mean(tables.lunch.map(r=>Number(r.ratio))),lunchMissed:tables.lunch.filter(r=>r.missed).length,rankDwellFirstRunMinutes:rankDwell.map(x=>x/60),maxRevenueError,maxWorkloadError:maxWorkError,timeSeconds:time};
 Object.assign(summary,{normalMeetingCount,bossMeetingCount,totalMeetingCount:normalMeetingCount+bossMeetingCount,bossMeetingReplacementCount:bossMeetingCount,mandatoryBossWorkCount:sources.BOSS.count,followUpGenerated:sources.FOLLOW_UP.count,followUpCompleted:sources.FOLLOW_UP.completed,projectCompleted:s.permanentStatistics.projectsCompleted});
 assert.equal(now(),maximum);setV3Observer();setBalanceHooks();return {state:s,summary,tables};
}
