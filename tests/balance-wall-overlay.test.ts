import test,{afterEach} from 'node:test';
import assert from 'node:assert/strict';
import {gameConfig as c} from '../src/config/gameConfig';
import {candidates,overlay,restore,baseline} from '../scripts/balanceWallCandidates';
import {initialState} from '../src/game/state/initialState';
import {createTodo} from '../src/game/work/todoManager';
import {getRunUpgradeCost} from '../src/game/work/progression';
import {checkPromotionWorkStart,getPromotionQualificationStats,promotionWorkload} from '../src/game/career/promotionAssignment';
import {effectiveWorkSpeed,effectiveWorkQuality,workReward} from '../src/game/work/workStats';
import {syncWorld} from '../src/game/time/worldTime';
afterEach(restore);
for(const candidate of candidates)test(`${candidate.id}: exact allowed overlay, fixed workload, no money gate, Config breakpoints`,()=>{
 overlay(candidate);const expected=structuredClone(baseline);
 expected.promotionQualification=structuredClone(c.promotionQualification);expected.promotionAssignment.retryWorkdays=candidate.cooldown;expected.work.workloadTierCenters=[...c.work.workloadTierCenters];expected.runUpgradeCurve={...c.runUpgradeCurve};
 for(let i=0;i<5;i++){expected.ranks[i].recommendedSpeed=c.ranks[i].recommendedSpeed;expected.ranks[i].recommendedQuality=c.ranks[i].recommendedQuality;}
 for(const id of Object.keys(c.upgrades) as (keyof typeof c.upgrades)[])expected.upgrades[id].baseCost=c.upgrades[id].baseCost;
 assert.deepEqual(c,expected);
 for(let rank=0;rank<5;rank++){
  const s=initialState(42,0);s.career.rank=rank;s.player.age=40;
  const t=createTodo(s,{...c.work.templates[0],workload:c.work.templateWorkloadReference});
  assert.equal(t.rankWorkloadMultiplierAtCreation,1);assert.equal(t.baseWorkload,c.work.workloadTierCenters[rank]);assert.equal(t.workload,t.baseWorkload*t.ageWorkloadMultiplierAtCreation);
  s.player.upgrades.efficiency=1000;s.career.rank=4;assert.equal(t.workload,t.baseWorkload*t.ageWorkloadMultiplierAtCreation);
 }
 for(const level of [59,60,61,119,120,121,200,300,500,1000])assert.equal(getRunUpgradeCost('efficiency',level),Math.ceil(30*candidate.growth**level*1.015**Math.max(0,level-60)*1.005**Math.max(0,level-120)));
 for(let rank=0;rank<4;rank++){
  const s=initialState(42,0),req=c.promotionQualification.requirements[rank];s.career.rank=rank;s.player.money=0;s.world.totalWorldTime=24;syncWorld(s);s.player.upgrades.efficiency=req.efficiency-10;s.player.upgrades.quality=req.quality-6;
  checkPromotionWorkStart(s);assert.equal(s.currentTarget?.type,'PROMOTION');assert.equal(s.promotion.requirement,req.efficiency*96*1.2);assert.equal(s.promotion.deadlineWorldTime,120);
 }
 restore();assert.deepEqual(c,baseline);
});
for(const candidate of candidates.filter(x=>x.threshold==='A'&&x.cooldown===3))test(`${candidate.id}: Low Profile isolates qualification from all work stats and rewards`,()=>{
 overlay(candidate);
 for(let rank=0;rank<4;rank++){
  const req=c.promotionQualification.requirements[rank],s=initialState(42,0);s.career.rank=rank;s.world.totalWorldTime=24;syncWorld(s);s.player.money=0;s.player.upgrades.efficiency=req.efficiency-10;s.player.upgrades.quality=req.quality-6;
  const t=createTodo(s,c.work.templates[0]),speed=effectiveWorkSpeed(s),quality=effectiveWorkQuality(s),reward=workReward(s,t);s.promotion.lowProfileEnabled=true;
  assert.equal(effectiveWorkSpeed(s),speed);assert.equal(effectiveWorkQuality(s),quality);assert.equal(workReward(s,t),reward);checkPromotionWorkStart(s);assert.equal(s.currentTarget?.type==='PROMOTION',false);
  s.promotion.lastCheckedWorkday=null;s.player.upgrades.efficiency=req.efficiency/.8-10;s.player.upgrades.quality=req.quality/.8-6;checkPromotionWorkStart(s);assert.equal(s.currentTarget?.type,'PROMOTION');assert.equal(getPromotionQualificationStats(s).evaluatedEfficiency,req.efficiency);assert.equal(effectiveWorkSpeed(s),req.efficiency/.8);assert.equal(s.promotion.requirement,promotionWorkload(rank));
 }
});
