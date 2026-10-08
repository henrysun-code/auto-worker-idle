import fs from 'node:fs';
import {gameConfig as c} from '../src/config/gameConfig';
import {initialState} from '../src/game/state/initialState';
import {advanceOnline} from '../src/game/engine/SimulationLoop';
import {applyAction} from '../src/game/engine/actions';
import {upgradeCost} from '../src/game/work/workStats';
import type {UpgradeId,State} from '../src/game/types';
const root=new URL('../reports/first-company-incremental-v1/',import.meta.url);
const ids=Object.keys(c.upgrades) as UpgradeId[];
const purchases:object[]=[],etas:object[]=[],ranks:object[]=[],promotions:object[]=[],summaries:object[]=[];
const median=(v:number[])=>{if(!v.length)return null;v.sort((a,b)=>a-b);return (v[Math.floor((v.length-1)/2)]+v[Math.floor(v.length/2)])/2;};
for(const seed of [42,7961,15880]){
 const s=initialState(seed,0),income:{time:number;amount:number}[]=[];
 let real=0,lastBuy:number|null=null,lastEarned=0,lastRank=0,lastStatus=s.promotion.status,assignment:string|null=null;
 let firstPromotion:number|null=null,r4:number|null=null,overtimeWorld=0;
 const gaps:number[]=[],etaValues:number[]=[];const attempts=new Set<string>(),results=new Set<string>();
 const observe=(state:State)=>{
  const time=state.runStatistics.activeSeconds,p=state.promotion;
  if(p.assignmentId&&!attempts.has(p.assignmentId)){
   assignment=p.assignmentId;attempts.add(assignment);firstPromotion??=time;
   promotions.push({seed,id:assignment,event:'RECEIVED',realSeconds:time,worldTime:state.world.totalWorldTime,fromRank:p.fromRank,workload:p.requirement,deadline:p.deadlineWorldTime});
  }
  if(state.career.rank!==lastRank){ranks.push({seed,rank:state.career.rank,realSeconds:time,worldTime:state.world.totalWorldTime});lastRank=state.career.rank;if(lastRank===4)r4??=time;
   if(assignment&&!results.has(assignment)){results.add(assignment);promotions.push({seed,id:assignment,event:'SUCCESS',realSeconds:time,worldTime:state.world.totalWorldTime});}
  }
  if(['FAILED_OVERTIME','FAILED_REQUIREMENT'].includes(p.status)&&p.status!==lastStatus&&assignment&&!results.has(assignment)){
   results.add(assignment);promotions.push({seed,id:assignment,event:p.status,realSeconds:time,worldTime:state.world.totalWorldTime});
  }
  if(lastStatus==='FAILED_OVERTIME'&&p.status==='COOLDOWN')promotions.push({seed,id:assignment,event:'OVERTIME_COMPLETED',realSeconds:time,worldTime:state.world.totalWorldTime});
  lastStatus=p.status;
 };
 ranks.push({seed,rank:0,realSeconds:0,worldTime:0});
 for(;real<3600-1e-8;){
  const dt=Math.min(.25,3600-real);
  advanceOnline(s,dt,{onBoundary:observe,onTargetInterval:(target,_start,seconds)=>{if(target?.type==='PROMOTION'&&s.promotion.status==='FAILED_OVERTIME')overtimeWorld+=seconds;}});
  real=s.runStatistics.activeSeconds;
  const earned=s.runStatistics.earned-lastEarned;lastEarned=s.runStatistics.earned;if(earned)income.push({time:real,amount:earned});
  while(income.length&&income[0].time<real-60)income.shift();
  const grossRate=income.reduce((n,x)=>n+x.amount,0)/Math.max(.25,Math.min(60,real));
  const next=Object.fromEntries(ids.map(id=>[id,grossRate>0?Math.max(0,upgradeCost(s,id)-s.player.money)/grossRate:null]));
  if(Math.abs(real-Math.round(real))<1e-6){const finite=Object.values(next).filter((x):x is number=>x!==null);const value=median(finite);if(value!==null)etaValues.push(value);etas.push({seed,realSeconds:real,rank:s.career.rank,realGrossIncomePerSecond:grossRate,medianNextUpgradeETA:value,...next});}
  // Test policy only: buy every affordable ability, cheapest next cost first (stable ID tie-break).
  for(;;){const affordable=ids.filter(id=>s.player.money>=upgradeCost(s,id)).sort((a,b)=>upgradeCost(s,a)-upgradeCost(s,b)||ids.indexOf(a)-ids.indexOf(b));if(!affordable.length)break;const id=affordable[0],cost=upgradeCost(s,id),gap=lastBuy===null?null:real-lastBuy;
   if(!applyAction(s,{type:'upgrade',id}))throw Error('Formal buy action rejected');if(gap!==null)gaps.push(gap);
   purchases.push({seed,id,level:s.player.upgrades[id],rank:s.career.rank,realSeconds:real,worldTime:s.world.totalWorldTime,cost,sincePreviousAnyUpgradeSeconds:gap,...Object.fromEntries(Object.entries(next).map(([k,v])=>[`${k}NextBuyETA`,v]))});lastBuy=real;
  }
 }
 summaries.push({seed,policy:'BUY_ALL_CHEAPEST_AFFORDABLE',realSeconds:real,worldTime:s.world.totalWorldTime,rank:s.career.rank,levels:s.player.upgrades,firstPromotionRealSeconds:firstPromotion,R4RealSeconds:r4,R4Censored:r4===null,medianObservedUpgradeGap:median(gaps),medianNextUpgradeETA:median(etaValues),promotionAttempts:attempts.size,promotionOvertimeWorldSeconds:overtimeWorld,promotionOvertimeRealSeconds:overtimeWorld,netMoney:s.player.money,grossIncome:s.runStatistics.earned});
}
fs.mkdirSync(root,{recursive:true});
const csv=(rows:object[])=>{const keys=[...new Set(rows.flatMap(r=>Object.keys(r)))];return [keys.join(','),...rows.map(r=>keys.map(k=>{const v=(r as Record<string,unknown>)[k];return JSON.stringify(v===undefined||v===null?'':typeof v==='object'?JSON.stringify(v):v);}).join(','))].join('\n')+'\n';};
for(const [name,rows] of Object.entries({purchases,etas,ranks,promotions}))fs.writeFileSync(new URL(`buy-all-${name}.csv`,root),csv(rows));
fs.writeFileSync(new URL('buy-all-summary.json',root),JSON.stringify({seeds:[42,7961,15880],horizonRealSeconds:3600,purchaseCheckInterval:.25,etaDefinition:'Hypothetical hold-current-wallet next-buy ETA, using trailing 60 real seconds gross income; zero income -> null. Purchases compete for money; not a promise.',products:'OFF',prestige:'OFF',autoTune:false,runs:summaries},null,2));
console.log(JSON.stringify(summaries,null,2));
