import assert from 'node:assert/strict';
import { mkdirSync,writeFileSync,existsSync,readFileSync } from 'node:fs';
import { fileURLToPath,pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { gameConfig as c } from '../src/config/gameConfig';
import { initialState } from '../src/game/state/initialState';
import { advance } from '../src/game/engine/SimulationLoop';
import { counts,liveWork,outstanding } from './careerSimulation';
import { originalWorkReward } from '../src/game/work/workStats';
import { instrument,setBalanceHooks,sourceHash } from './balanceInstrumentation';
import { mean,quantile } from './balanceMetrics';
import { scaledSeconds } from '../src/game/time/worldTime';
const root=fileURLToPath(new URL('../reports/meeting-v1/',import.meta.url));mkdirSync(root,{recursive:true});
const file=join(root,'meeting-isolation-raw.json');assert.ok(!existsSync(file),'Preserve existing Meeting report');
const prior=JSON.parse(readFileSync(new URL('../config/archive/game_config-pre-meeting-v1.json',import.meta.url),'utf8'));
const current=structuredClone(c) as Record<string,unknown>;delete current.meeting;assert.deepEqual(current,prior,'Non-Meeting Config changed');
const bossBase=c.work.bossWorkHours*c.time.referenceDayDuration/c.time.hoursPerDay*c.economy.baseWorkSpeed;assert.equal(bossBase,50);
writeFileSync(join(root,'meeting-config-verification.json'),JSON.stringify({passed:true,onlyAddedConfig:'meeting',existingConfigDeepEqual:true,bossBaseWorkload:bossBase,meeting:structuredClone(c.meeting)},null,2));
const before=await sourceHash(),observer=await instrument();
const observerConfig=(await import(pathToFileURL(join(observer.dir,'src/config/gameConfig.ts')).href)).gameConfig as typeof c;
const meeting=structuredClone(c.meeting);
function simulate(rank:number,flattery:number,seed:number,on:boolean){
 const config=structuredClone(meeting);if(!on){config.normalChanceByRank=[0,0,0,0,0];config.bossMeetingChanceOnEscapeFail=0;}
 Object.assign(c.meeting,config);Object.assign(observerConfig.meeting,structuredClone(config));
 const s=initialState(seed,0);s.career.rank=s.career.highestRank=rank;s.player.upgrades={efficiency:200,quality:200,lifeManagement:200,slacking:200,flattery};
 let generated=0,processed=0,completed=0,workIncome=0,bossIncome=0,followUps=0,mandatoryCount=0,bossOvertime=0,maxError=0,entertainmentSeconds=0,sleepSeconds=0,checks=0,encounters=0,escapes=0,severityTotal=0,lastSleepNotice=0;
 const ids=new Set<string>(),sleepRatios:number[]=[],sleepOutputs:number[]=[],entertained=new Set<number>(),sleepWindows:number[]=[];
 setBalanceHooks({projectAttempt:()=>{},projectPassed:()=>{},boss:(caught,escaped,severity=0)=>{checks++;if(caught){encounters++;severityTotal+=severity;if(escaped)escapes++;}}});
 observer.advance(s,7200,{activeSeconds:7200,onTargetInterval:(t,from,seconds)=>{
  if(t?.type==='ENTERTAINMENT'){entertainmentSeconds+=seconds;entertained.add(s.needs.sleep.windowStart);}
  if(t?.type==='SLEEP')sleepSeconds+=Math.max(0,Math.min(from+seconds,s.needs.sleep.windowEnd)-Math.max(from,s.needs.sleep.windowStart));
  if(t?.type==='WORK'&&t.todo.mandatoryOvertime)bossOvertime+=seconds;
 },onWorkProgress:amount=>{processed+=amount;},onWorkCompleted:(t,_overdue,loss)=>{completed++;const income=originalWorkReward(s,t)-loss;workIncome+=income;if(t.sourceType==='BOSS')bossIncome+=income;},onBoundary:()=>{
  for(const t of liveWork(s))if(!ids.has(t.id)){ids.add(t.id);generated+=t.workload;if(t.sourceType==='FOLLOW_UP')followUps++;if(t.mandatoryOvertime)mandatoryCount++;}
  const mandatory=liveWork(s).filter(t=>t.mandatoryOvertime);
  const bossMeetings=[s.meetings.pendingBoss,s.currentTarget,...s.suspendedTargets.map(x=>x.target)].filter(t=>t?.type==='MEETING'&&t.isBossMeeting);
  assert.ok(mandatory.length<=1);assert.ok(bossMeetings.length<=1);assert.ok(!mandatory.length||!bossMeetings.length);
  const error=generated-processed-outstanding(s);maxError=Math.max(maxError,Math.abs(error));assert.ok(Math.abs(error)<1e-4,`Conservation ${error}`);
  let notice: typeof s.eventLog[number] | undefined;
  for(let index=s.eventLog.length-1;index>=0;index--)if(s.eventLog[index].type==='睡眠'&&s.eventLog[index].text.startsWith('睡眠窗口結算')){notice=s.eventLog[index];break;}
  const sequence=notice?Number(notice.id.split('-').at(-1)):0;
  if(sequence>lastSleepNotice){lastSleepNotice=sequence;sleepRatios.push(s.needs.sleep.lastRatio);sleepOutputs.push(s.needs.sleep.lastRatio*scaledSeconds(c.sleep.targetDuration));
   // At WorkStart the settled window belongs to the prior world day.
   sleepWindows.push((s.world.dayIndex-1)*c.time.dayDuration+scaledSeconds(c.time.sleepAnchor));}
 }});
 assert.equal(s.runStatistics.activeSeconds,7200);assert.equal(s.world.totalWorldTime,7200);assert.equal(s.career.rank,rank);
 assert.deepEqual(s.player.upgrades,{efficiency:200,quality:200,lifeManagement:200,slacking:200,flattery});assert.equal(s.permanentStatistics.runs,0);assert.equal(s.runStatistics.offlineDays,0);assert.ok(Object.values(s.products).every(p=>!p.active));assert.equal(s.runStatistics.completedWork,completed);
 const days=7200/c.time.dayDuration,gross=s.runStatistics.earned,net=s.player.money-c.economy.startingMoney;
 assert.equal(gross,net);const compensation=s.meetings.statistics.meetingCompensation,parentIncome=gross-workIncome-compensation;assert.ok(parentIncome>=0);
 return {seed,rank,flattery,meetingOn:on,activeMinutes:120,worldDays:days,finalAge:s.player.age,...s.meetings.statistics,
  meetingCountPerDay:s.meetings.statistics.meetingCount/days,normalMeetingCountPerDay:s.meetings.statistics.normalMeetingCount/days,bossMeetingCountPerDay:s.meetings.statistics.bossMeetingCount/days,
  meetingSecondsPerDay:s.meetings.statistics.meetingSeconds/days,normalMeetingSecondsPerDay:s.meetings.statistics.normalMeetingSeconds/days,bossMeetingSecondsPerDay:s.meetings.statistics.bossMeetingSeconds/days,
  meetingCompensationPerDay:compensation/days,completedWork:completed,completedWorkPerDay:completed/days,processedWorkload:processed,processedWorkloadPerDay:processed/days,
  generatedWorkload:generated,generatedWorkloadPerDay:generated/days,workloadRatio:generated?processed/generated:0,grossIncome:gross,grossIncomePerDay:gross/days,netIncome:net,netIncomePerDay:net/days,
  workIncome,parentIncome,bossIncome,bossIncomePerDay:bossIncome/days,followUpCount:followUps,followUpCountPerDay:followUps/days,...counts(s),entertainmentSeconds,entertainmentSecondsPerDay:entertainmentSeconds/days,
  entertainmentMissed:sleepWindows.filter(w=>!entertained.has(w)).length,sleepSeconds,totalSettledSleepOutput:sleepOutputs.reduce((a,b)=>a+b,0),settledSleepNights:sleepRatios.length,
  averageSleepRatio:mean(sleepRatios),p10SleepRatio:quantile(sleepRatios,.1),belowFullSleepNights:sleepRatios.filter(x=>x<1-1e-8).length,belowHalfSleepNights:sleepRatios.filter(x=>x<.5).length,zeroSleepNights:sleepRatios.filter(x=>x===0).length,
  bossChecks:checks,bossEncounters:encounters,bossEncounterRate:checks?encounters/checks:0,escapeSuccess:encounters?escapes/encounters:0,escapeSuccessCount:escapes,meanSeverity:encounters?severityTotal/encounters:0,
  mandatoryBossWorkCount:mandatoryCount,bossOvertimeSeconds:bossOvertime,maxConservationError:maxError,revenueError:gross-workIncome-parentIncome-compensation};
}
const rows:ReturnType<typeof simulate>[]=[],deltas:Record<string,number>[]=[];
try{
 for(const rank of [0,2,4])for(const flattery of [0,100,200])for(let replicate=0;replicate<30;replicate++){
  const seed=42+replicate*7919,off=simulate(rank,flattery,seed,false),on=simulate(rank,flattery,seed,true);rows.push(off,on);
  const percent=(a:number,b:number)=>b?(a/b-1)*100:0;
  deltas.push({rank,flattery,seed,completedWorkPercent:percent(on.completedWork,off.completedWork),processedWorkloadPercent:percent(on.processedWorkload,off.processedWorkload),grossIncomePercent:percent(on.grossIncome,off.grossIncome),
   todoDelta:on.todo-off.todo,dueTodayDelta:on.dueToday-off.dueToday,overdueDelta:on.overdue-off.overdue,entertainmentSecondsDelta:on.entertainmentSeconds-off.entertainmentSeconds,entertainmentSecondsPerDayDelta:(on.entertainmentSeconds-off.entertainmentSeconds)/120,
   entertainmentMissedDelta:on.entertainmentMissed-off.entertainmentMissed,sleepRatioDelta:on.averageSleepRatio-off.averageSleepRatio,sleepSecondsDelta:on.sleepSeconds-off.sleepSeconds,
   entertainmentSecondsLostToMeeting:off.entertainmentSeconds-on.entertainmentSeconds,sleepSecondsLostToMeeting:off.sleepSeconds-on.sleepSeconds});
  if(rows.length%60===0)console.log(`Meeting R${rank} F${flattery}: ${rows.length}/540`);
 }
}finally{Object.assign(c.meeting,meeting);Object.assign(observerConfig.meeting,structuredClone(meeting));setBalanceHooks();}
assert.equal(rows.length,540);assert.equal(await sourceHash(),before);
writeFileSync(file,JSON.stringify({sourceHash:before,count:540,pairs:270,minutesEach:120,rows,deltas}));console.log('MEETING ISOLATION COMPLETE540');
