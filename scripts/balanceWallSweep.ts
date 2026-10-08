import fs from 'node:fs';
import {getUnresolvedOverdueWorkCount} from '../src/game/career/promotion';
import {getDeadlineStatus} from '../src/game/work/deadline';
const output=new URL('../FIRST_COMPANY_BALANCE_WALL_V2/',import.meta.url);
const seeds=Array.from({length:30},(_,i)=>42+i*7919);
const median=(v:number[])=>quantile(v,.5);
function quantile(v:number[],p:number){if(!v.length)return null;const a=[...v].sort((x,y)=>x-y),i=(a.length-1)*p;return a[Math.floor(i)]+(a[Math.ceil(i)]-a[Math.floor(i)])*(i%1);}
const tables:Record<string,any[]>={workstarts:[],promotions:[],purchases:[],etas:[],ranks:[]};
async function api(prefix:string){const [config,state,loop,actions,stats,promotion]=await Promise.all([import(`${prefix}/config/gameConfig.ts`),import(`${prefix}/game/state/initialState.ts`),import(`${prefix}/game/engine/SimulationLoop.ts`),import(`${prefix}/game/engine/actions.ts`),import(`${prefix}/game/work/workStats.ts`),import(`${prefix}/game/career/promotionAssignment.ts`)]);return {c:config.gameConfig,...state,...loop,...actions,...stats,...promotion};}
async function run(a:any,seed:number,version:string){
 const s=a.initialState(seed,0),rankStats:any[]=[{rank:0,start:0,startEQ:a.getPromotionQualificationStats(s),startLevels:{...s.player.upgrades}}],sleepRatios:number[]=[],sleepWindows=new Set<string>();let bossOvertime=0,lastObserve=0;const countSamples:any[]=[],integrals={todo:0,dueToday:0,overdue:0},peaks={todo:0,dueToday:0,overdue:0};let priorCounts={todo:0,dueToday:0,overdue:0};const ids=Object.keys(a.c.upgrades),income:any[]=[],attempts:any[]=[],rankTimes:any[]=[0,null,null,null,null],firstEQ:any[]=Array(4).fill(null),firstAssigned:any[]=Array(4).fill(null),gaps:any[][]=Array.from({length:5},()=>[]),etaSamples:any[][]=Array.from({length:5},()=>[]);
 let real=0,lastBuy:number|null=null,lastEarned=0,lastRank=0,active:any=null;
 const qualification=()=>{const q=a.getPromotionQualificationStats(s),r=a.c.promotionQualification.requirements[s.career.rank];if(r&&q.evaluatedEfficiency>=r.efficiency&&q.evaluatedQuality>=r.quality)firstEQ[s.career.rank]??=s.runStatistics.activeSeconds;};
 const observe=()=>{
  qualification();const p=s.promotion;const now=s.runStatistics.activeSeconds,dt=now-lastObserve;for(const k of ['todo','dueToday','overdue'] as const)integrals[k]+=priorCounts[k]*dt;lastObserve=now;
 const live=new Map([...s.todoQueue,...(s.currentTarget?.type==='WORK'?[s.currentTarget.todo]:[]),...s.suspendedTargets.filter((x:any)=>x.target.type==='WORK').map((x:any)=>x.target.todo)].map((t:any)=>[t.id,t]));priorCounts={todo:live.size,dueToday:[...live.values()].filter((t:any)=>getDeadlineStatus(t,s)==='DUE_TODAY').length,overdue:getUnresolvedOverdueWorkCount(s)};for(const k of ['todo','dueToday','overdue'] as const)peaks[k]=Math.max(peaks[k],priorCounts[k]);
 for(const notice of s.eventLog)if(notice.type==='睡眠'&&notice.text.startsWith('睡眠窗口結算')&&!sleepWindows.has(notice.id)){sleepWindows.add(notice.id);sleepRatios.push(s.needs.sleep.lastRatio);}

  if(p.assignmentId&&(!active||active.id!==p.assignmentId)){const q=a.getPromotionQualificationStats(s),threshold=a.c.promotionQualification.requirements[s.career.rank].efficiency;active={version,seed,id:p.assignmentId,rank:s.career.rank,start:s.runStatistics.activeSeconds,worldStart:s.world.totalWorldTime,deadline:p.deadlineWorldTime,requirement:p.requirement,...q,actualEfficiency:a.effectiveWorkSpeed(s),thresholdEfficiency:threshold,efficiencyOvershootPercent:(a.effectiveWorkSpeed(s)/threshold-1)*100,dinnerCompletionPercent:null,result:null,overtimeWorld:0,overtimeElapsedReal:0};attempts.push(active);firstAssigned[s.career.rank]??=active.start;}
  if(active&&active.result===null&&s.world.totalWorldTime>=active.deadline-1e-8){active.dinnerCompletionPercent??=Math.min(100,p.progress/active.requirement*100);if(s.career.rank>active.rank){active.result='SUCCESS';active.dinnerCompletionPercent=100;}else if(p.status==='FAILED_OVERTIME'||p.status==='FAILED_REQUIREMENT'){active.result=p.status;active.failureRealSeconds=s.runStatistics.activeSeconds;}}
  if(active?.result==='FAILED_OVERTIME'&&!p.assignmentId&&active.overtimeFinished===undefined){active.overtimeFinished=s.runStatistics.activeSeconds;active.overtimeElapsedReal=active.overtimeFinished-active.failureRealSeconds;}
  if(s.career.rank!==lastRank){rankStats[lastRank].end=s.runStatistics.activeSeconds;rankStats[lastRank].endEQ=a.getPromotionQualificationStats(s);rankStats[lastRank].endLevels={...s.player.upgrades};lastRank=s.career.rank;rankStats[lastRank]={rank:lastRank,start:s.runStatistics.activeSeconds,startEQ:a.getPromotionQualificationStats(s),startLevels:{...s.player.upgrades}};rankTimes[lastRank]=s.runStatistics.activeSeconds;tables.ranks.push({version,seed,rank:lastRank,realSeconds:rankTimes[lastRank]});}
 };
 tables.ranks.push({version,seed,rank:0,realSeconds:0});
 while(real<3600-1e-8){
  a.advanceOnline(s,Math.min(.25,3600-real),{onBoundary:observe,onPromotionWorkStart:(row:any)=>{tables.workstarts.push({version,seed,...row,blockingReasons:row.blockingReasons.join('|'),...(version==='BEFORE'?{legacyMoneyQualified:s.player.money>=(a.c.ranks[row.rank+1]?.promotionCost??0)}:{})});},onTargetInterval:(t:any,start:number,seconds:number)=>{if(t?.type==='WORK'&&t.todo.mandatoryOvertime)bossOvertime+=seconds;if(active&&start+seconds>=active.deadline-1e-8&&start<active.deadline&&active.result===null){active.dinnerCompletionPercent=Math.min(100,s.promotion.progress/active.requirement*100);}if(t?.type==='PROMOTION'&&s.promotion.status==='FAILED_OVERTIME'&&active)active.overtimeWorld+=seconds;}});
  real=s.runStatistics.activeSeconds;
  const earned=s.runStatistics.earned-lastEarned;lastEarned=s.runStatistics.earned;if(earned)income.push({time:real,amount:earned});while(income.length&&income[0].time<real-60)income.shift();
  const rate=income.reduce((n,x)=>n+x.amount,0)/Math.max(.25,Math.min(60,real)),next=ids.map(id=>rate>0?Math.max(0,a.upgradeCost(s,id)-s.player.money)/rate:null);
  if(Math.abs(real-Math.round(real))<1e-6){const value=median(next.filter((x):x is number=>x!==null));if(value!==null)etaSamples[s.career.rank].push(value);tables.etas.push({version,seed,realSeconds:real,rank:s.career.rank,medianNextUpgradeETA:value});}
  for(;;){const affordable=ids.filter(id=>s.player.money>=a.upgradeCost(s,id)).sort((x,y)=>a.upgradeCost(s,x)-a.upgradeCost(s,y)||ids.indexOf(x)-ids.indexOf(y));if(!affordable.length)break;const id=affordable[0],cost=a.upgradeCost(s,id),gap=lastBuy===null?null:real-lastBuy;if(!a.applyAction(s,{type:'upgrade',id}))throw Error('BUY_ALL rejected');if(gap!==null)gaps[s.career.rank].push(gap);tables.purchases.push({version,seed,id,level:s.player.upgrades[id],rank:s.career.rank,realSeconds:real,cost,interval:gap});lastBuy=real;qualification();}
 }
 tables.promotions.push(...attempts);rankStats[lastRank].observedEnd=real;rankStats[lastRank].finalEQ=a.getPromotionQualificationStats(s);rankStats[lastRank].finalLevels={...s.player.upgrades};
 return {rankStats,sleepRatios,bossOvertime,counts:{average:Object.fromEntries(Object.entries(integrals).map(([k,v])=>[k,v/real])),peak:peaks,final:priorCounts},version,seed,rank:s.career.rank,worldTime:s.world.totalWorldTime,firstEQQualifiedTime:firstEQ,firstPromotionAssignedTime:firstAssigned,qualificationToAssignmentDelay:firstEQ.map((t,i)=>t!==null&&firstAssigned[i]!==null?firstAssigned[i]-t:null),rankTimes,rankDwellSeconds:rankTimes.map((t,i)=>t===null?null:(rankTimes[i+1]??3600)-t),attempts,upgradeIntervalP50ByRank:gaps.map(median),medianNextUpgradeETAByRank:etaSamples.map(median),finalQualification:a.promotionWorkStartTelemetry(s),netMoney:s.player.money,grossIncome:s.runStatistics.earned,levels:s.player.upgrades};
}
import {candidates,overlay,restore,baseline} from './balanceWallCandidates';
const a=await api('../src');
const selected=process.argv.slice(2),extend=selected.length>0;
const runs:any[]=extend?JSON.parse(fs.readFileSync(new URL('runs.json',output),'utf8')):[];
for(const candidate of candidates.filter(x=>!extend||selected.includes(x.id))){
 overlay(candidate);fs.writeFileSync(new URL(`candidate-${candidate.id}.json`,output),JSON.stringify(a.c,null,2));
 for(const seed of seeds.slice(extend?10:0,extend?30:10)){const r=await run(a,seed,candidate.id);runs.push(r);console.log(candidate.id,seed,r.rankTimes);}
 restore();
}
const csv=(rows:any[])=>{const keys=[...new Set(rows.flatMap(Object.keys))];return [keys.join(','),...rows.map(r=>keys.map(k=>JSON.stringify(r[k]??'')).join(','))].join('\n')+'\n';};
for(const [name,rows] of Object.entries(tables)){const file=new URL(`${name}.csv`,output);if(extend&&fs.existsSync(file)){const old=fs.readFileSync(file,'utf8'),fresh=csv(rows).split('\n').slice(1).join('\n');fs.writeFileSync(file,old+fresh);}else fs.writeFileSync(file,csv(rows));}
fs.writeFileSync(new URL('runs.json',output),JSON.stringify(runs,null,2));
fs.writeFileSync(new URL('baseline-config.json',output),JSON.stringify(baseline,null,2));
restore();
