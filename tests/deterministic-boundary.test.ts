import './legacyBalanceFixture';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gameConfig as c} from '../src/config/gameConfig';
import {initialState} from '../src/game/state/initialState';
import {advance} from '../src/game/engine/SimulationLoop';
import {canonicalizeBreakpoint,semanticGte} from '../src/game/numeric/semanticBoundary';
import {sleepEffect,sleepRatio} from '../src/game/targets/sleepWindow';
import {followUpCount} from '../src/game/work/workQuality';
import {createTodo} from '../src/game/work/todoManager';
import {createWorkloadSnapshot,getAgeWorkloadMultiplier} from '../src/game/work/ageWorkload';
import {preflightCareer,compareSemanticState} from '../scripts/careerV3PreflightCore';
import {policies} from '../scripts/careerV3Policy';
import type {State} from '../src/game/types';
const batches=[.05,.25,1,5,60];
function until(s:State,end:number,batch:number){while(s.world.totalWorldTime<end-1e-8){const duration=Math.min(batch,end-s.world.totalWorldTime);advance(s,duration,{activeSeconds:duration});}}
test('Sleep breakpoint canonicalization is narrow and uses exact curve values',()=>{
 for(const point of c.sleep.effectCurve){const result=sleepEffect(point.ratio-5e-13);assert.deepEqual(result,point);}
 assert.equal(sleepEffect(.9999999999999992).ratio,1);assert.equal(sleepEffect(.9999999999999992).speedModifier,0);assert.equal(sleepEffect(.9999999999999992).qualityModifier,0);
 for(const value of [.99,1.01,.9999]){assert.equal(canonicalizeBreakpoint(value,c.sleep.effectCurve.map(p=>p.ratio)),value);assert.notEqual(sleepEffect(value).ratio,1);}
 assert.equal(semanticGte(1.1999999999999997,1.2),true);assert.equal(semanticGte(1.199,1.2),false);
});
for(const slept of [0,9,18])test(`${slept} seconds sleep is identical across legal batches`,()=>{
 const results=batches.map(batch=>{const s=initialState(42,0);s.world.totalWorldTime=68-slept;s.world.timeOfDay=s.world.totalWorldTime;s.world.nextEventAt=1e9;s.promotion.lastCheckedWorkday=0;s.meetings.lastScheduledWorkday=0;s.needs.phase='SLEEP';s.needs.sleep.windowStart=50;s.needs.sleep.windowEnd=68;s.needs.sleep.settled=false;
 if(!slept){s.needs.sleep.output=0;advance(s,.01,{activeSeconds:.01});}else{ s.currentTarget={id:'boundary-sleep',type:'SLEEP',name:'Sleep',requirement:slept,progress:0,createdAt:s.world.totalWorldTime};until(s,68,batch);}
 return {ratio:s.needs.sleep.lastRatio,speed:s.needs.sleep.speedModifier,quality:s.needs.sleep.qualityModifier};});
 for(const r of results)assert.deepEqual(r,results[0]);assert.equal(results[0].ratio,slept/18);if(slept===18)assert.deepEqual(results[0],{ratio:1,speed:0,quality:0});
});
test('Quality boundary equal values share bucket; true deficit retains lower bucket',()=>{
 const s=initialState(42,0),todo=createTodo(s,{...c.work.templates[0],quality:10}),rule=c.followUps.types.find(x=>x.qualitySensitive)!;
 s.player.upgrades.quality=12-c.economy.baseQuality;
 const exact=followUpCount(s,todo,rule,.99);
 s.buffs=[{id:'float',name:'float fixture',expiresAt:1e9,modifiers:{quality:11.999999999999996/12-1}}];
 assert.equal(followUpCount(s,todo,rule,.99),exact);
 s.buffs[0].modifiers.quality=11.99/12-1;
 assert.ok(followUpCount(s,todo,rule,.99)>exact);
});
test('Original world54 checkpoint: no actions, exact Follow-up/RNG/Target/sequence',()=>{
 const original:State=JSON.parse(readFileSync(new URL('../reports/career-v3-full/career-v3-reproduction-checkpoint.json',import.meta.url),'utf8'));
 const before=JSON.parse(readFileSync(new URL('../reports/career-v3-full/career-v3-reproduction-result.json',import.meta.url),'utf8'));
 const small=structuredClone(original),large=structuredClone(original);
 advance(small,before.firstSmallDelta,{activeSeconds:before.firstSmallDelta});until(small,90,.25);until(large,90,60);
 assert.deepEqual(small.runStatistics.rootExtraTasks,large.runStatistics.rootExtraTasks);assert.equal(small.world.rng,large.world.rng);assert.deepEqual(small.currentTarget,large.currentTarget);assert.equal(small.world.sequence,large.world.sequence);assert.equal(compareSemanticState(small,large).semanticEqual,true);
});
for(const policy of policies)test(`${policy}: Seed42 600 active seconds, five batches preserve semantic State and RNG`,()=>{
 const now=Date.now;Date.now=()=>0;
 try{const reference=preflightCareer(policy,42,60);for(const batch of batches){const s=preflightCareer(policy,42,batch),comparison=compareSemanticState(s,reference);assert.deepEqual(comparison.differences,[]);assert.equal(s.world.rng,reference.world.rng);assert.equal(s.runStatistics.activeSeconds,600);assert.deepEqual(s.promotion,reference.promotion);assert.deepEqual(s.meetings,reference.meetings);assert.deepEqual(s.todoQueue,reference.todoQueue);}}finally{Date.now=now;}
});
for(const age of [30,40,50,60])test(`Age ${age}: new workload snapshots exact across five batches at the breakpoint`,()=>{
 const rows=batches.map(batch=>{const s=initialState(42,0);s.player.ageProgressDays=(age-c.age.start)*c.age.daysPerYear-1/60;s.player.age=c.age.start+s.player.ageProgressDays/c.age.daysPerYear;s.world.nextEventAt=1e9;
 s.currentTarget={id:'age-test',type:'WORK',name:'Fixture Work',requirement:1e9,progress:0,createdAt:0,todo:createTodo(s,{...c.work.templates[0],workload:1e9})};s.needs.satietyUntil=1e9;
 const snapshots=[];for(const end of [.5,1,1.5,2]){until(s,end,batch);snapshots.push(createWorkloadSnapshot(s,100));}
 return {snapshots,rng:s.world.rng,age:s.player.age,ageProgressDays:s.player.ageProgressDays};});
 for(const row of rows){assert.deepEqual(row.snapshots,rows[0].snapshots);assert.equal(row.rng,rows[0].rng);assert.equal(row.snapshots.at(-1)!.ageWorkloadMultiplierAtCreation,getAgeWorkloadMultiplier(age));}
});
test('Semantic reporter cannot mask money, target, IDs, workload or count differences',()=>{
 for(const field of ['money','rank','id','rng','workload','progress','count'])assert.equal(compareSemanticState({[field]:1},{[field]:1-1e-13}).semanticEqual,false);
 assert.equal(compareSemanticState({currentTarget:{progress:1}},{currentTarget:{progress:1-1e-13}}).semanticEqual,false);
 assert.equal(compareSemanticState({eventLog:[{time:1}]},{eventLog:[{time:1.0001}]}).semanticEqual,false);
 const s=initialState(42,0);s.needs.sleep.output=18-1e-14;assert.equal(sleepRatio(s),1);
});
