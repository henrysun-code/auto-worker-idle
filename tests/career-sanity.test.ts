import test from 'node:test';
import assert from 'node:assert/strict';
import {simulateCareer} from '../scripts/careerSimulation';
import {initialState} from '../src/game/state/initialState';
import {instrument,setBalanceHooks} from '../scripts/balanceInstrumentation';
import {resolveBoss} from '../src/game/career/bossEvents';
import {startWork} from '../src/game/targets/targetManager';
import {createTodo} from '../src/game/work/todoManager';
import {gameConfig as c} from '../src/config/gameConfig';

test('Career observers match full production State and RNG at Rank0, Rank4 and prestige',async()=>{
 const engine=await instrument();
 const installBossHook=(boss:(a:boolean,b:boolean,c?:number)=>void)=>setBalanceHooks({boss,projectAttempt:()=>{},projectPassed:()=>{}});
 const realNow=Date.now;Date.now=()=>0;
 try{
  for(const rank of [0,4]){
   const initial=initialState(42,0);initial.career.rank=rank;
   const a=simulateCareer('PREPARED_BALANCED','NEVER_PRESTIGE',42,{initial,maxSeconds:600,observe:false});
   const b=simulateCareer('PREPARED_BALANCED','NEVER_PRESTIGE',42,{initial,maxSeconds:600,advance:engine.advance,installBossHook});
   assert.deepEqual(b.state,a.state);assert.ok(b.tables.sleep.length>=9);
  }
  const a=simulateCareer('ALL_ROUNDER','AS_SOON_AS_ELIGIBLE',42,{maxSeconds:1800,observe:false});
  const b=simulateCareer('ALL_ROUNDER','AS_SOON_AS_ELIGIBLE',42,{maxSeconds:1800,advance:engine.advance,installBossHook});
  assert.ok(b.state.permanentStatistics.runs>0);assert.deepEqual(b.state,a.state);
 }finally{Date.now=realNow;setBalanceHooks();}
});
test('Six-hour canonical run preserves workload and revenue conservation and daily exposure',()=>{
 const r=simulateCareer('PREPARED_BALANCED','NEVER_PRESTIGE',42);
 assert.equal(r.tables.daily.length,360);assert.equal(r.tables.sleep.length,359);
 assert.ok(r.summary.maxConservationError<1e-4);assert.ok(Math.abs(r.summary.revenueError)<1e-5);
 assert.equal(r.state.runStatistics.offlineDays,0);assert.ok(Object.values(r.state.products).every(p=>!p.active));
});
test('Overtime can skip entertainment without crossing the sleep anchor',()=>{
 const initial=initialState(42,0);initial.world.totalWorldTime=44;initial.world.timeOfDay=44;initial.world.nextEventAt=1e9;
 initial.needs.phase='AFTERNOON';initial.needs.satietyUntil=1e9;initial.needs.breakfastState='COMPLETED';
 resolveBoss(initial,true,false);startWork(initial,initial.todoQueue.shift()!);
 const r=simulateCareer('PROMOTE_ASAP_BALANCED','NEVER_PRESTIGE',42,{initial,maxSeconds:49});
 assert.equal(r.summary.crossSleepOvertimeCount,0);assert.equal(r.summary.entertainmentMissedDueToOvertime,1);
});
test('Food spending updates money and funded-overdue exposure without waiting for income',()=>{
 const initial=initialState(42,0);initial.player.money=c.ranks[1].promotionCost+4;initial.world.nextEventAt=1e9;
 initial.todoQueue=Array.from({length:4},()=>{const t=createTodo(initial,c.work.templates[0]);t.dueWorkdayIndex=-2;return t;});
 // Isolated paid-food fixture; official simulation and persisted config keep the free ordinary meal.
 const oldPrice=c.food.items[0].price,oldStart=c.time.breakfastStart;
 try{c.food.items[0].price=8;c.time.breakfastStart=2;
  const r=simulateCareer('PROMOTE_ASAP_BALANCED','NEVER_PRESTIGE',42,{initial,maxSeconds:3});
  assert.equal(r.summary.moneyBlockedSeconds,1);assert.equal(r.summary.fundedOverdueBlockedSeconds,2);
  assert.equal(r.summary.overdueBlockedSeconds,3);
 }finally{c.food.items[0].price=oldPrice;c.time.breakfastStart=oldStart;}
});

// Legacy Boss Work regression: isolate the original Work outcome.
c.meeting.bossMeetingChanceOnEscapeFail=0;

