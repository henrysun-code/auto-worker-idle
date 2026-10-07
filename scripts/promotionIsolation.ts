import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {gameConfig as c} from '../src/config/gameConfig';
import {initialState} from '../src/game/state/initialState';
import {advance} from '../src/game/engine/SimulationLoop';
import {checkPromotionWorkStart,getPromotionQualificationStats} from '../src/game/career/promotionAssignment';
import {syncWorld} from '../src/game/time/worldTime';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),out=path.join(root,'reports/promotion-v1');
const original=structuredClone(c),runs:Record<string,unknown>[]=[];
try {
 for(let rank=0;rank<4;rank++)for(const mode of ['THRESHOLD','EFFICIENCY_PLUS_20','EFFICIENCY_PLUS_50','LOW_PROFILE'] as const)for(let run=0;run<30;run++){
  Object.assign(c,structuredClone(original));c.meeting.normalChanceByRank=[0,0,0,0,0];
  const s=initialState(42+run*7919,0),req=c.promotionQualification.requirements[rank],scale=mode==='EFFICIENCY_PLUS_20'?1.2:mode==='EFFICIENCY_PLUS_50'?1.5:1;
  s.career.rank=rank;s.career.highestRank=rank;s.player.money=1e6;s.player.upgrades.efficiency=req.efficiency-c.economy.baseWorkSpeed;s.player.upgrades.quality=req.quality-c.economy.baseQuality;
  s.world.totalWorldTime=8;syncWorld(s);s.world.nextEventAt=1e9;s.promotion.lowProfileEnabled=mode==='LOW_PROFILE';checkPromotionWorkStart(s);
  // Controlled OffWork fixture isolates assessment from daytime backlog and random events.
  // Exact +20/+50 processing conditions use a test-only temporary work-speed modifier.
  if(scale!==1)s.buffs.push({id:'isolation-speed',name:'Isolation only',expiresAt:1e9,modifiers:{workSpeed:scale-1}});
  s.world.totalWorldTime=40;syncWorld(s);s.needs.phase='AFTERNOON';s.needs.projectRollProcessedRoutineId=0;
  if(mode==='LOW_PROFILE')s.needs.bossChecked=true; // Exclude ordinary Boss from the negative-control evening.
  const q=getPromotionQualificationStats(s);let dinnerFinish:number|null=null,start:number|null=null,finish:number|null=null,processing=0,entertainment=0,sleep=0;
  advance(s,28,{onTargetInterval:(t,now,seconds)=>{if(t?.type==='FOOD'&&t.meal==='DINNER'&&t.progress>=t.requirement-1e-8)dinnerFinish=now+seconds;if(t?.type==='PROMOTION'){start??=t.startedAt;processing+=seconds;if(t.progress>=t.requirement-1e-8)finish=now+seconds;}if(t?.type==='ENTERTAINMENT')entertainment+=seconds;if(t?.type==='SLEEP')sleep+=seconds;}});
  assert.equal(s.meetings.statistics.meetingCount,0);assert.equal(s.todoQueue.some(t=>t.mandatoryOvertime),false);
  assert.equal(s.career.rank,mode==='LOW_PROFILE'?rank:rank+1);
  const row={fromRank:rank,toRank:rank+1,mode,run:run+1,seed:42+run*7919,requiredEfficiency:req.efficiency,requiredQuality:req.quality,qualificationEfficiency:q.efficiency,evaluatedEfficiency:q.evaluatedEfficiency,processingEfficiency:req.efficiency*scale,workload:c.promotionAssignment.assignments[rank].workload,dinnerFinish,promotionStart:start,promotionFinish:finish,sleepAnchor:50,nextWorkStart:68,promotionProcessingSeconds:processing,entertainmentRemainingSeconds:finish===null?null:Math.max(0,50-finish),actualEntertainmentSeconds:entertainment,actualSleepSeconds:sleep,touchesSleep:finish!==null&&finish>=50-1e-8,crossesWorkStart:finish!==null&&finish>68+1e-8,success:s.career.rank===rank+1,generatedAssignment:start!==null,classification:mode==='LOW_PROFILE'?'NOT_SCHEDULED':finish===null||finish>68?'TOO_HEAVY':finish<48?'TOO_LIGHT':'HEALTHY'};
  runs.push(row);
 }
}finally {Object.assign(c,original);}
function csv(rows:Record<string,unknown>[]){const keys=Object.keys(rows[0]);return keys.join(',')+'\n'+rows.map(row=>keys.map(k=>JSON.stringify(row[k]??'')).join(',')).join('\n')+'\n';}
const summary:Record<string,unknown>[]=[];
for(let rank=0;rank<4;rank++)for(const mode of ['THRESHOLD','EFFICIENCY_PLUS_20','EFFICIENCY_PLUS_50','LOW_PROFILE']){
 const rows=runs.filter(r=>r.fromRank===rank&&r.mode===mode),base=runs.find(r=>r.fromRank===rank&&r.mode==='THRESHOLD')!;
 const result={...rows[0],samples:rows.length,processingSecondsSaved:mode==='LOW_PROFILE'?null:Number(base.promotionProcessingSeconds)-Number(rows[0].promotionProcessingSeconds)};delete (result as Record<string,unknown>).run;delete (result as Record<string,unknown>).seed;summary.push(result);
}
fs.writeFileSync(path.join(out,'promotion-isolation-runs.csv'),csv(runs));fs.writeFileSync(path.join(out,'promotion-isolation-summary.csv'),csv(summary));fs.writeFileSync(path.join(out,'promotion-isolation-results.json'),JSON.stringify({runs,summary},null,2));
const before=JSON.parse(fs.readFileSync(path.join(out,'promotion-config-before.json'),'utf8')),after=structuredClone(original),oldBefore=structuredClone(before),oldAfter=structuredClone(after);
for(const key of ['promotionAssignment','promotionQualification','promotionLowProfile']){delete oldBefore[key];delete (oldAfter as Record<string,unknown>)[key];}
assert.deepEqual(oldBefore,oldAfter);
const bossBase=original.work.bossWorkHours*original.time.referenceDayDuration/original.time.hoursPerDay*original.economy.baseWorkSpeed;assert.equal(bossBase,50);
fs.writeFileSync(path.join(out,'promotion-config-after.json'),JSON.stringify(after,null,2));
fs.writeFileSync(path.join(out,'promotion-config-verification.json'),JSON.stringify({existingBalanceDeepEqual:true,allowedNewConfig:['promotionAssignment','promotionQualification','promotionLowProfile'],bossBaseWorkload:bossBase,meetingUnchanged:true,runCostUnchanged:true,prestigeUnchanged:true,rankRewardUnchanged:true,ageUnchanged:true,productsUnchanged:true,isolationConfigRestored:true},null,2));
fs.writeFileSync(path.join(out,'promotion-sanity.json'),JSON.stringify({runs:runs.length,scenarios:summary.length,repeatsPerScenario:30,qualificationNoRng:true,allPositiveControlsSucceeded:runs.filter(r=>r.mode!=='LOW_PROFILE').every(r=>r.success),allLowProfileControlsUnscheduled:runs.filter(r=>r.mode==='LOW_PROFILE').every(r=>!r.generatedAssignment),controlledOffWorkFixture:true,exactSpeedIncreasesUseTestOnlyTemporaryBuff:true,normalDinnerSeconds:4,products:false,prestige:false,offline:false,randomMeetingExcluded:true,randomEventsExcluded:true},null,2));
console.log(JSON.stringify(summary,null,2));
