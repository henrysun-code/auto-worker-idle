import assert from 'node:assert/strict';
import {gameConfig as c} from '../src/config/gameConfig';
import {initialState} from '../src/game/state/initialState';
import type {State,Todo,UpgradeId} from '../src/game/types';
import {advance as productionAdvance} from '../src/game/engine/SimulationLoop';
import {applyAction} from '../src/game/engine/actions';
import {canPrestige,calculateClarityReward} from '../src/game/prestige/prestigeManager';
import {getUnresolvedOverdueWorkCount} from '../src/game/career/promotion';
import {getDeadlineStatus,getDeadlineWorkdayIndex} from '../src/game/work/deadline';
import {rawWorkSpeed,rawWorkQuality,originalWorkReward,upgradeCost,effectiveWorkSpeed} from '../src/game/work/workStats';
import {careerDecision,recommendationReady,spendClarity,type Policy} from './careerPolicies';
import {mean,quantile} from './balanceMetrics';
export const timings=['NEVER_PRESTIGE','AS_SOON_AS_ELIGIBLE','TARGET_30_MIN','TARGET_60_MIN','TARGET_120_MIN','TARGET_180_MIN'] as const;
export type Timing=typeof timings[number];
export type Row=Record<string,unknown>;
const abilities:UpgradeId[]=['efficiency','quality','lifeManagement','slacking','flattery'];
const milestoneLevels=[10,25,50,75,100,125,150,175,200,225,250,275,300,350,400,500];
const waitLevels=[10,50,100,150,175,200,225,250,275,300,350,400];
const STOP=Symbol('safe production boundary'),PRESTIGE=Symbol('policy eligibility boundary');
export const liveWork=(s:State)=>[...new Map([...s.todoQueue,...[s.currentTarget,...s.suspendedTargets.map(x=>x.target)].flatMap(t=>t?.type==='WORK'?[t.todo]:[])].map(t=>[t.id,t])).values()];
export function outstanding(s:State){const progress=new Map([s.currentTarget,...s.suspendedTargets.map(x=>x.target)].flatMap(t=>t?.type==='WORK'?[[t.todo.id,t.progress] as const]:[]));return liveWork(s).reduce((n,t)=>n+t.workload-(progress.get(t.id)??0),0);}
export function counts(s:State){const live=liveWork(s);return {todo:live.length,dueToday:live.filter(t=>getDeadlineStatus(t,s)==='DUE_TODAY').length,overdue:getUnresolvedOverdueWorkCount(s)};}
export interface Options {advance?:typeof productionAdvance;observe?:boolean;noPurchases?:boolean;onlyTables?:string[];maxSeconds?:number;initial?:State;installBossHook?:(cb:(caught:boolean,escaped:boolean,severity?:number)=>void)=>void}
export function simulateCareer(policy:Policy,timing:Timing,seed:number,options:Options={}){
 const engine=options.advance??productionAdvance,maximum=options.maxSeconds??6*60*60,observing=options.observe!==false;
 const s=options.initial?structuredClone(options.initial):initialState(seed,0);
 assert.equal(c.time.dayDuration,60,'Scenario uses current Prototype duration');
 const tables:Record<string,Row[]>={daily:[],purchases:[],promotions:[],prestiges:[],milestones:[],waits:[],recrawl:[],rankResidence:[],promotionBlocks:[],boss:[],sleep:[],source:[],economy:[],crossRank:[],cycles:[]};
 const put=(name:string,row:Row)=>{if(observing&&(!options.onlyTables||options.onlyTables.includes(name)))tables[name].push({seed,policy,timing,...row});};
 let targetBlockReason="NONE";
 let offset=0,cycle=0,cycleStart=0,lastTime=0,lastEarned=0,lastNotice=0,lastSafeWorkday=-999;
 let meetingIncome=0,lastMeetingCompensation=0;
 let gross=0,workIncome=0,parentIncome=0,upgradeSpend=0,promotionSpend=0,permanentSpend=0,clarityEarned=0,processed=0,generated=0,discarded=0,completed=0,avoidable=0,followCount=0,overdueLoss=0,bossIncome=0,followIncome=0,crossCount=0,crossWorkload=0,crossReward=0;
 let maxError=0,firstEligibility:number|null=null,eligibleThisCycle=false,lastDay=0,dayStartOutstanding=0,dayStartGenerated=0,dayStartProcessed=0,dayStartDiscarded=0,dayStartGross=0,dayStartUpgrade=0,dayStartPromotion=0;
 let cyclePeak={rank:s.career.rank,...s.player.upgrades},priorPeak:typeof cyclePeak|null=null;
 let lastSleepNoticeTime=-1,flatteryIntegral=0,overtimeSeconds=0;
 const rankTime=Array(c.ranks.length).fill(0) as number[],block={money:0,overdue:0,recommended:0,fundedOverdue:0};
 const generatedIds=new Set<string>(),creationRank=new Map<string,number>(),knownTodos=new Map<string,Todo>();
 const boughtAt=new Map<string,number>(),milestones=new Set<string>(),recrawled=new Set<string>(),rankReached=new Map<number,number>();
 const spendAbility=Object.fromEntries(abilities.map(id=>[id,0])) as Record<UpgradeId,number>;
 const source=Object.fromEntries(['NORMAL','PROJECT','FOLLOW_UP','BOSS','EVENT'].map(id=>[id,{generated:0,processed:0,count:0}])) as Record<string,{generated:number;processed:number;count:number}>;
 const sourceAtDay=Object.fromEntries(Object.keys(source).map(id=>[id,{generated:0,processed:0}])) as Record<string,{generated:number;processed:number}>;
 const bossCrossSleep=new Set<string>(),bossCrossStart=new Set<string>(),bossCreated=new Map<string,number>();
 const entertainmentMissedNights=new Set<string>(),bossDurations=new Map<string,number>();
 let exposure={rank:s.career.rank,flattery:s.player.upgrades.flattery,moneyBlocked:false,overdueBlocked:false,recommendedBlocked:false,fundedOverdue:false};
 const ledger:{time:number;gross:number;upgrade:number;generated:number;processed:number}[]=[{time:0,gross:0,upgrade:0,generated:0,processed:0}];
 const globalTime=()=>offset+s.world.totalWorldTime;
 const snapshot=()=>({cycle,runActiveMinutes:s.runStatistics.activeSeconds/60,worldTime:s.world.totalWorldTime,worldSeconds:globalTime(),activeMinutes:globalTime()/60,gameDays:globalTime()/c.time.dayDuration,age:s.player.age,rank:s.career.rank,money:s.player.money,...s.player.upgrades,rawEfficiency:rawWorkSpeed(s),rawQuality:rawWorkQuality(s),...counts(s),currentWork:s.currentTarget?.type==='WORK'?s.currentTarget.todo.name:null,activeProjects:s.projects.filter(p=>p.status==='ACTIVE').length,permanentLevels:{...s.prestige.levels}});
 function trailing(days=5){const start=globalTime()-days*c.time.dayDuration;let lo=0,hi=ledger.length-1;while(lo<hi){const mid=Math.ceil((lo+hi)/2);if(ledger[mid].time<=start)lo=mid;else hi=mid-1;}const base=ledger[lo],duration=Math.min(globalTime(),days*c.time.dayDuration);return {trailingGross:gross-base.gross,trailingNet:gross-base.gross-upgradeSpend+base.upgrade,trailingGenerated:generated-base.generated,trailingProcessed:processed-base.processed,minutes:duration/60};}
 function observeBoundary(){
  const now=globalTime(),delta=now-lastTime;
  if(delta>0){rankTime[exposure.rank]+=delta;flatteryIntegral+=exposure.flattery*delta;if(exposure.moneyBlocked)block.money+=delta;if(exposure.overdueBlocked)block.overdue+=delta;if(exposure.recommendedBlocked)block.recommended+=delta;if(exposure.fundedOverdue)block.fundedOverdue+=delta;}
  lastTime=now;
  for(const t of liveWork(s))if(!generatedIds.has(t.id)){generatedIds.add(t.id);creationRank.set(t.id,s.career.rank);knownTodos.set(t.id,t);generated+=t.workload;source[t.sourceType].generated+=t.workload;source[t.sourceType].count++;assert.ok(Number.isFinite(t.workload)&&t.workload>=0);assert.ok(Number.isFinite(t.baseReward)&&t.baseReward>=0);if(t.sourceType==='FOLLOW_UP'){followCount++;if(t.followUpType&&c.followUps.types.find(f=>f.type===t.followUpType)?.qualitySensitive)avoidable++;}if(t.mandatoryOvertime){bossCreated.set(t.id,now);assert.equal(t.baseReward,c.work.bossReward*(t.bossSeverity??1));assert.ok(Math.abs(t.baseWorkload- c.work.bossWorkHours*c.time.dayDuration/c.time.hoursPerDay*c.economy.baseWorkSpeed*(t.bossSeverity??1))<1e-6);}}
  const mandatory=liveWork(s).filter(t=>t.mandatoryOvertime);assert.ok(mandatory.length<=1);
  for(const t of mandatory){if(s.world.totalWorldTime>=s.needs.sleep.windowStart-1e-8){bossCrossSleep.add(t.id);entertainmentMissedNights.add(`${cycle}:${s.needs.sleep.windowStart}`);}if(s.world.totalWorldTime>=Math.floor(t.createdAt/c.time.dayDuration+1)*c.time.dayDuration+c.time.workStartAnchor*c.time.dayDuration/c.time.referenceDayDuration-1e-8)bossCrossStart.add(t.id);}
  const incomeDelta=s.runStatistics.earned-lastEarned;
  const meetingDelta=s.meetings.statistics.meetingCompensation-lastMeetingCompensation;meetingIncome+=meetingDelta;lastMeetingCompensation=s.meetings.statistics.meetingCompensation;
  if(incomeDelta>0){gross+=incomeDelta;parentIncome+=incomeDelta-meetingDelta;}
  lastEarned=s.runStatistics.earned;
  ledger.push({time:now,gross,upgrade:upgradeSpend,generated,processed});
  const fresh:typeof s.eventLog=[];
  for(let i=s.eventLog.length-1;i>=0;i--){const n=s.eventLog[i];if(Number(n.id.split('-').at(-1))<=lastNotice)break;fresh.unshift(n);}
  lastNotice=s.world.sequence;
  for(const n of fresh)if(n.type==='睡眠'&&n.text.startsWith('睡眠窗口結算')&&now!==lastSleepNoticeTime){lastSleepNoticeTime=now;put('sleep',{...snapshot(),ratio:s.needs.sleep.lastRatio,actualOutput:s.needs.sleep.lastRatio*c.sleep.targetDuration*c.time.dayDuration/c.time.referenceDayDuration,actualDuration:s.needs.sleep.lastRatio*c.sleep.targetDuration*c.time.dayDuration/c.time.referenceDayDuration,speedModifier:s.needs.sleep.speedModifier,qualityModifier:s.needs.sleep.qualityModifier,zero:s.needs.sleep.lastRatio===0,belowHalf:s.needs.sleep.lastRatio<.5,belowFull:s.needs.sleep.lastRatio<1-1e-8});assert.ok(Number.isFinite(s.needs.sleep.lastRatio)&&s.needs.sleep.lastRatio>=0);}
  const error=generated-processed-discarded-outstanding(s)+dayStartOutstanding;maxError=Math.max(maxError,Math.abs(error));assert.ok(Math.abs(error)<1e-4,`workload conservation ${error}`);
  assert.ok(Number.isFinite(s.player.money)&&s.player.money>=0);assert.ok(Object.values(s.player.upgrades).every(l=>Number.isFinite(l)&&Number.isInteger(l)&&l>=0));assert.ok(Object.values(s.prestige.levels).every(l=>Number.isFinite(l)&&Number.isInteger(l)&&l>=0));assert.ok(!Object.values(s.products).some(p=>p.active));assert.equal(s.runStatistics.offlineDays,0);
  const workday=getDeadlineWorkdayIndex(s.world.totalWorldTime);
  const safe=incomeDelta>0||workday!==lastSafeWorkday;
  lastSafeWorkday=workday;
  if(safe)throw STOP;
  // Food spending can change funding between policy decisions; measure the next interval from the fresh state.
  const nextRank=c.ranks[s.career.rank+1],overdueBlocked=!!nextRank&&counts(s).overdue>nextRank.maxOverdueAllowed;
  exposure={rank:s.career.rank,flattery:s.player.upgrades.flattery,moneyBlocked:!!nextRank&&s.player.money<nextRank.promotionCost,overdueBlocked,recommendedBlocked:!!nextRank&&policy!=='PROMOTE_ASAP_BALANCED'&&!recommendationReady(s),fundedOverdue:!!nextRank&&s.player.money>=nextRank.promotionCost&&overdueBlocked};
 }
 function eligibility(){if(!eligibleThisCycle&&canPrestige(s)){eligibleThisCycle=true;if(cycle===0)firstEligibility=globalTime()/60;put('cycles',{...snapshot(),firstEligibleMinutesInRun:(globalTime()-cycleStart)/60,firstEligibleEarned:s.runStatistics.earned,deltaFrom30Minutes:(globalTime()-cycleStart)/60-30,censored:false});}}
 const targetMinutes=timing.startsWith('TARGET_')?Number(timing.split('_')[1]):0;
 const prestigeReady=()=>timing!=='NEVER_PRESTIGE'&&canPrestige(s)&&(globalTime()-cycleStart)>=targetMinutes*60-1e-8;
 function progressMilestones(){
  cyclePeak.rank=Math.max(cyclePeak.rank,s.career.rank);
  for(const id of abilities){cyclePeak[id]=Math.max(cyclePeak[id],s.player.upgrades[id]);for(const level of milestoneLevels){const key=`${cycle}:${id}:${level}`;if(s.player.upgrades[id]>=level&&!milestones.has(key)){milestones.add(key);const trail=trailing(),cost=upgradeCost(s,id);put('milestones',{...snapshot(),ability:id,level,minutesInRun:(globalTime()-cycleStart)/60,nextUpgradeCost:cost,...trail,estimatedCostPerMinuteIncome:trail.trailingGross>0?cost/(trail.trailingGross/Math.max(.001,trail.minutes)):null,censored:false});}}
   if(priorPeak)for(const fraction of [.5,.8,1]){const goal=Math.ceil(priorPeak[id]*fraction),key=`${cycle}:${id}:${fraction}`;if(s.player.upgrades[id]>=goal&&!recrawled.has(key)){recrawled.add(key);put('recrawl',{...snapshot(),ability:id,fraction,previousPeak:priorPeak[id],target:goal,minutesInRun:(globalTime()-cycleStart)/60,censored:false});}}
  }
  if(!rankReached.has(s.career.rank))rankReached.set(s.career.rank,globalTime());
 }
 function decide(){
  if(timing.startsWith('TARGET_')&&globalTime()-cycleStart>=targetMinutes*60-1e-8&&!canPrestige(s)&&targetBlockReason==='NONE')targetBlockReason=s.career.rank<c.prestige.minimumRank?'RANK_BELOW_REQUIRED':'EARNED_BELOW_REQUIRED';
  eligibility();if(prestigeReady()){doPrestige();return;}if(options.noPurchases)return;
  try{careerDecision(s,policy,(type,id,before)=>{
    const spent=before.player.money-s.player.money;
    if(type==='upgrade'&&id){upgradeSpend+=spent;spendAbility[id]+=spent;const old=before.player.upgrades[id],last=boughtAt.get(`${cycle}:${id}:${old}`);put('purchases',{...snapshot(),ability:id,levelBefore:old,levelAfter:s.player.upgrades[id],cost:spent,moneyBefore:before.player.money,moneyAfter:s.player.money,incomeRateProxy:trailing().trailingGross/Math.max(.001,trailing().minutes*60),secondsSincePreviousPurchase:last===undefined?null:globalTime()-last});if(waitLevels.includes(old))put('waits',{...snapshot(),ability:id,level:old,waitActiveMinutes:last===undefined?null:(globalTime()-last)/60,censored:last===undefined});boughtAt.set(`${cycle}:${id}:${old+1}`,globalTime());}
    else {promotionSpend+=spent;put('promotions',{...snapshot(),fromRank:before.career.rank,toRank:s.career.rank,cost:spent,moneyBefore:before.player.money,moneyAfter:s.player.money,minutesInRun:(globalTime()-cycleStart)/60,...trailing(),overdueBlockSecondsSoFar:block.overdue,fundedOverdueBlockSecondsSoFar:block.fundedOverdue});put('recrawl',{...snapshot(),ability:'rank',target:s.career.rank,minutesInRun:(globalTime()-cycleStart)/60,censored:false});}
    progressMilestones();eligibility();if(prestigeReady())throw PRESTIGE;
  });}catch(e){if(e!==PRESTIGE)throw e;doPrestige();}
 }
 function censorCycle(){for(const id of abilities){for(const level of milestoneLevels)if(!milestones.has(`${cycle}:${id}:${level}`))put('milestones',{...snapshot(),ability:id,level,minutesInRun:null,observedMinutes:(globalTime()-cycleStart)/60,censored:true});for(const level of waitLevels){const since=boughtAt.get(`${cycle}:${id}:${level}`);if(since!==undefined&&!boughtAt.has(`${cycle}:${id}:${level+1}`))put('waits',{...snapshot(),ability:id,level,waitActiveMinutes:null,observedWaitMinutes:(globalTime()-since)/60,censored:true});}if(priorPeak)for(const fraction of [.5,.8,1])if(!recrawled.has(`${cycle}:${id}:${fraction}`))put('recrawl',{...snapshot(),ability:id,fraction,previousPeak:priorPeak[id],target:Math.ceil(priorPeak[id]*fraction),minutesInRun:null,censored:true});}
  if(!eligibleThisCycle)put('cycles',{...snapshot(),firstEligibleMinutesInRun:null,observedMinutes:(globalTime()-cycleStart)/60,censored:true});
  for(let rank=1;rank<c.ranks.length;rank++)if(!tables.promotions.some(r=>r.cycle===cycle&&r.toRank===rank))put('recrawl',{...snapshot(),ability:'rank',target:rank,minutesInRun:null,censored:true});
 }
 function doPrestige(){
  const now=globalTime(),before=snapshot(),reward=calculateClarityReward(s),permanentBefore={...s.prestige.levels},peak={...cyclePeak},runAge=(now-cycleStart)/60;
  const previousSleep=tables.sleep.filter(r=>Number(r.worldSeconds)>=now-10*c.time.dayDuration),bossLast=tables.boss.filter(r=>r.encounter&&Number(r.worldSeconds)>=now-10*c.time.dayDuration);
  censorCycle();discarded+=outstanding(s);if(!applyAction(s,{type:'prestige'}))throw Error('Production prestige refused');clarityEarned+=reward;
  const permanentPurchases=spendClarity(s);permanentSpend+=permanentPurchases.reduce((n,p)=>n+p.cost,0);
  put('prestiges',{...before,targetMinutes,actualRunMinutes:runAge,delayMinutes:Math.max(0,runAge-targetMinutes),delayReason:targetBlockReason,earnedThisRun:lastEarned,clarityReward:reward,permanentLevelsBefore:permanentBefore,permanentPurchases,permanentLevelsAfter:{...s.prestige.levels},peak,averageSleepRatioLast10Days:mean(previousSleep.map(r=>Number(r.ratio))),bossEncountersLast10Days:bossLast.length,cumulativeGross:gross});
  targetBlockReason="NONE";offset=now;cycle++;cycleStart=now;lastEarned=0;lastMeetingCompensation=0;lastSafeWorkday=-999;eligibleThisCycle=false;cyclePeak={rank:0,...s.player.upgrades};priorPeak=peak;rankReached.clear();lastSleepNoticeTime=-1;lastNotice=s.world.sequence;progressMilestones();
 }
 function daily(){const now=globalTime(),row={...snapshot(),exposureDay:Math.round(now/c.time.dayDuration),generatedWorkload:generated-dayStartGenerated,processedWorkload:processed-dayStartProcessed,discardedWorkload:discarded-dayStartDiscarded,outstanding:outstanding(s),grossIncome:gross-dayStartGross,upgradeSpend:upgradeSpend-dayStartUpgrade,promotionSpend:promotionSpend-dayStartPromotion,netIncomeAfterUpgrades:gross-dayStartGross-(upgradeSpend-dayStartUpgrade),netAfterCareerSpend:gross-dayStartGross-(upgradeSpend-dayStartUpgrade)-(promotionSpend-dayStartPromotion),cumulativeGross:gross,cumulativeNet:gross-upgradeSpend-promotionSpend,...Object.fromEntries(Object.keys(source).flatMap(id=>[[`${id}GeneratedWorkload`,source[id].generated-sourceAtDay[id].generated],[`${id}ProcessedWorkload`,source[id].processed-sourceAtDay[id].processed]]))};put('daily',row);for(const id of Object.keys(source))sourceAtDay[id]={generated:source[id].generated,processed:source[id].processed};lastDay=now;dayStartGenerated=generated;dayStartProcessed=processed;dayStartDiscarded=discarded;dayStartGross=gross;dayStartUpgrade=upgradeSpend;dayStartPromotion=promotionSpend;}
 options.installBossHook?.((encounter,escaped,severity)=>put('boss',{...snapshot(),kind:'CHECK',encounter,escaped,severity:severity??0}));
 progressMilestones();decide();
 while(globalTime()<maximum-1e-8){
  const now=globalTime(),nextDay=(Math.floor((now+1e-8)/c.time.dayDuration)+1)*c.time.dayDuration,nextTimer=timing.startsWith('TARGET_')&&now<cycleStart+targetMinutes*60-1e-8?cycleStart+targetMinutes*60:Infinity;
  const horizon=Math.min(maximum,nextDay,nextTimer),duration=horizon-now;
  const nextRank=c.ranks[s.career.rank+1],overdueBlocked=!!nextRank&&counts(s).overdue>nextRank.maxOverdueAllowed;
  exposure={rank:s.career.rank,flattery:s.player.upgrades.flattery,moneyBlocked:!!nextRank&&s.player.money<nextRank.promotionCost,overdueBlocked,recommendedBlocked:!!nextRank&&policy!=='PROMOTE_ASAP_BALANCED'&&!recommendationReady(s),fundedOverdue:!!nextRank&&s.player.money>=nextRank.promotionCost&&overdueBlocked};
  try{engine(s,duration,{activeSeconds:duration,onBoundary:observeBoundary,onWorkProgress:amount=>{processed+=amount;const t=s.currentTarget;if(t?.type==='WORK'){source[t.todo.sourceType].processed+=amount;if(t.todo.mandatoryOvertime){const seconds=amount/effectiveWorkSpeed(s);overtimeSeconds+=seconds;bossDurations.set(t.todo.id,(bossDurations.get(t.todo.id)??0)+seconds);}}},onWorkCompleted:(t,overdue,loss)=>{completed++;overdueLoss+=loss;const reward=originalWorkReward(s,t)-loss;workIncome+=reward;parentIncome-=reward;if(t.sourceType==='BOSS'){if(s.needs.phase==='WAIT'||s.needs.phase==='SLEEP')entertainmentMissedNights.add(`${cycle}:${s.needs.sleep.windowStart}`);bossIncome+=reward;put('boss',{...snapshot(),kind:'COMPLETED',workId:t.id,severity:t.bossSeverity??1,workload:t.workload,baseReward:t.baseReward,reward,processingSeconds:bossDurations.get(t.id)??0,elapsedSeconds:globalTime()-(bossCreated.get(t.id)??globalTime()),crossSleep:bossCrossSleep.has(t.id),crossWorkStart:bossCrossStart.has(t.id)});}if(t.sourceType==='FOLLOW_UP')followIncome+=reward;const rank=creationRank.get(t.id)??s.career.rank;if(rank!==s.career.rank){crossCount++;crossWorkload+=t.workload;crossReward+=reward;put('crossRank',{...snapshot(),workId:t.id,source:t.sourceType,createdRank:rank,completedRank:s.career.rank,workload:t.workload,reward});}}});}catch(e){if(e!==STOP)throw e;}
  if(globalTime()>=nextDay-1e-8&&globalTime()>lastDay+1e-8)daily();
  decide();
 }
 censorCycle();
 for(let rank=0;rank<rankTime.length;rank++)put('rankResidence',{rank,seconds:rankTime[rank],activeMinutes:rankTime[rank]/60});
 put('promotionBlocks',{moneySeconds:block.money,overdueSeconds:block.overdue,fundedOverdueSeconds:block.fundedOverdue,recommendedTargetSeconds:block.recommended,overlapAllowed:true});
 for(const [id,m]of Object.entries(source))put('source',{source:id,generatedWorkload:m.generated,processedWorkload:m.processed,generatedCount:m.count});
 const sleeps=tables.sleep.map(r=>Number(r.ratio));
 const checks=tables.boss.filter(r=>r.kind==='CHECK'),encounters=checks.filter(r=>r.encounter),escaped=encounters.filter(r=>r.escaped);
 const summary={seed,policy,timing,observedActiveMinutes:maximum/60,firstCanPrestigeMinutes:firstEligibility,firstCanPrestigeCensored:firstEligibility===null,prestigeCount:s.permanentStatistics.runs,clarityEarned,permanentSpend,finalRank:s.career.rank,finalLevels:{...s.player.upgrades},permanentLevels:{...s.prestige.levels},grossIncome:gross,netIncomeAfterUpgrades:gross-upgradeSpend,netAfterCareerSpend:gross-upgradeSpend-promotionSpend,upgradeSpend,promotionSpend,spendByAbility:spendAbility,workIncome,parentIncome,meetingIncome,bossIncome,followIncome,overdueLoss,generatedWorkload:generated,processedWorkload:processed,outstanding:outstanding(s),discardedWorkload:discarded,workloadRatio:generated?processed/generated:0,completedWork:completed,avoidableFollowUps:avoidable,followUpCount:followCount,avoidableFollowUpRatio:completed?avoidable/completed:0,averageFlattery:flatteryIntegral/maximum,averageSleepRatio:mean(sleeps),medianSleepRatio:quantile(sleeps,.5),p10SleepRatio:quantile(sleeps,.1),zeroSleepNights:sleeps.filter(x=>x===0).length,belowHalfNights:sleeps.filter(x=>x<.5).length,belowFullNights:sleeps.filter(x=>x<1-1e-8).length,fullSleepNights:sleeps.filter(x=>x>=1-1e-8).length,averageSleepSpeedModifier:mean(tables.sleep.map(r=>Number(r.speedModifier))),averageSleepQualityModifier:mean(tables.sleep.map(r=>Number(r.qualityModifier))),bossChecks:checks.length,bossEncounters:encounters.length,encounterRate:checks.length?encounters.length/checks.length:0,escapeAttempts:encounters.length,escapeSuccessRate:encounters.length?escaped.length/encounters.length:0,meanSeverity:mean(encounters.map(r=>Number(r.severity))),overtimeSeconds,entertainmentMissedDueToOvertime:entertainmentMissedNights.size,crossSleepOvertimeCount:bossCrossSleep.size,crossWorkStartOvertimeCount:bossCrossStart.size,crossRankWorkCount:crossCount,crossRankWorkload:crossWorkload,crossRankReward:crossReward,moneyBlockedSeconds:block.money,overdueBlockedSeconds:block.overdue,recommendedBlockedSeconds:block.recommended,fundedOverdueBlockedSeconds:block.fundedOverdue,maxConservationError:maxError,revenueError:gross-workIncome-parentIncome-meetingIncome,...counts(s)};
 assert.ok(Math.abs(summary.revenueError)<1e-5);put('economy',summary);
 return {state:s,summary,tables};
}

