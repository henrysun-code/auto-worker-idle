import './legacyBalanceFixture';
import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { gameConfig as c } from '../src/config/gameConfig';
import { initialState } from '../src/game/state/initialState';
import type { State, MeetingTarget } from '../src/game/types';
import { advance } from '../src/game/engine/SimulationLoop';
import { ensureTarget, startWork, resumeSuspended } from '../src/game/targets/targetManager';
import { createMeeting, startMeeting, scheduleNormalMeeting, activeBossMeeting, meetingDuration } from '../src/game/targets/meetingTarget';
import { createTodo } from '../src/game/work/todoManager';
import { resolveBoss, activeMandatoryBoss } from '../src/game/career/bossEvents';
import { syncWorld } from '../src/game/time/worldTime';
import { loadGame, saveGame, validateSave } from '../src/game/save/saveGame';
import { getDeadlineWorkdayIndex, getDeadlineStatus } from '../src/game/work/deadline';
import { applyAction } from '../src/game/engine/actions';
import { toggleProduct } from '../src/game/products/productManager';
import { triggerEvent } from '../src/game/events/eventManager';
const original=structuredClone(c.meeting),dayDuration=c.time.dayDuration;
afterEach(()=>{Object.assign(c.meeting,structuredClone(original));c.time.dayDuration=dayDuration;});
const close=(a:number,b:number)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
function quiet(now=10):State {
 c.meeting.normalChanceByRank=[0,0,0,0,0];c.meeting.bossMeetingChanceOnEscapeFail=0;
 const s=initialState(42,0);s.world.totalWorldTime=now;syncWorld(s);s.world.nextEventAt=1e9;
 s.needs.phase='MORNING';s.needs.satietyUntil=1e9;s.needs.projectRollProcessedRoutineId=0;
 s.meetings.lastScheduledWorkday=getDeadlineWorkdayIndex(now);return s;
}
function memory(){const rows=new Map<string,string>();return {getItem:(k:string)=>rows.get(k)??null,setItem:(k:string,v:string)=>{rows.set(k,v);},removeItem:(k:string)=>{rows.delete(k);}};}
test('A normal meeting suspends Work for exactly3 world seconds, preserves identity and progress',()=>{
 const s=quiet();startWork(s,createTodo(s,{...c.work.templates[0],workload:1000}));const w=s.currentTarget!;
 if(w.type!=='WORK')throw Error();w.progress=37;s.meetings.scheduledNormal=createMeeting(s,'NORMAL',10);
 advance(s,1);assert.equal(s.currentTarget?.type,'MEETING');assert.equal(w.progress,37);
 advance(s,2);assert.equal(s.currentTarget?.id,w.id);assert.equal(w.progress,37);assert.equal(s.meetings.statistics.meetingCount,1);
 advance(s,.5);close(w.progress,47);assert.equal(s.meetings.statistics.workInterruptedByMeetingCount,1);
});
for(const ability of ['efficiency','quality','slacking','lifeManagement'] as const)test(`B/C fixed duration independent of ${ability} Lv0 vs500`,()=>{
 for(const level of [0,500]){const s=quiet();s.player.upgrades[ability]=level;s.prestige.levels.workEfficiency=10;s.player.age=60;s.career.rank=4;
 const t=createMeeting(s,'NORMAL',10);startMeeting(s,t);advance(s,2.999);assert.equal(s.currentTarget?.id,t.id);close(t.remainingDuration,.001);advance(s,.001);assert.equal(s.meetings.statistics.meetingCount,1);close(s.meetings.statistics.meetingSeconds,3);}
});
test('duration scales3→9 only with60→180 day duration',()=>{quiet();close(meetingDuration(),3);c.time.dayDuration=180;close(meetingDuration(),9);});
test('D/O compensation once across suspend, save, reload, resume; fixed independent of rank reward buffs',()=>{
 const s=quiet();s.career.rank=4;s.player.upgrades.flattery=500;s.prestige.levels.workReward=10;
 const t=createMeeting(s,'NORMAL',10);startMeeting(s,t);advance(s,1);s.suspendedTargets.push({target:t,phase:s.needs.phase});s.currentTarget=null;
 const store=memory();saveGame(s,store,0);const loaded=loadGame(store,0);assert.equal(loaded.error,null);
 assert.deepEqual(loaded.state.suspendedTargets,s.suspendedTargets);resumeSuspended(loaded.state);const before=loaded.state.player.money;
 advance(loaded.state,2);assert.equal(loaded.state.player.money-before,80);assert.equal(loaded.state.meetings.statistics.meetingCompensation,80);
 advance(loaded.state,.01);assert.equal(loaded.state.meetings.statistics.meetingCount,1);assert.equal(loaded.state.runStatistics.completedWork,0);
});
test('E once per Workday, uniformly scheduled outside Lunch and not fixed at WorkStart',()=>{
 const s=quiet(8);s.meetings.lastScheduledWorkday=null;c.meeting.normalChanceByRank=[1,1,1,1,1];scheduleNormalMeeting(s);
 const t=structuredClone(s.meetings.scheduledNormal);for(let i=0;i<20;i++)scheduleNormalMeeting(s);
 assert.equal(s.meetings.statistics.normalMeetingRolls,1);assert.deepEqual(s.meetings.scheduledNormal,t);
 assert.ok(t!.scheduledStartWorldTime!>8);assert.ok(t!.scheduledStartWorldTime!<20||t!.scheduledStartWorldTime!>=28);
 s.world.totalWorldTime=68;syncWorld(s);scheduleNormalMeeting(s);assert.equal(s.meetings.statistics.normalMeetingRolls,2);
});
test('F uses all rank chances with seeded RNG',()=>{
 const counts:number[]=[];
 for(let rank=0;rank<5;rank++){let count=0;for(let i=0;i<1000;i++){
  const s=quiet(8);Object.assign(c.meeting,structuredClone(original));s.world.rng=42+i*7919;s.career.rank=rank;s.meetings.lastScheduledWorkday=null;
  scheduleNormalMeeting(s);if(s.meetings.scheduledNormal)count++;
 }counts.push(count);assert.ok(Math.abs(count/1000-original.normalChanceByRank[rank])<.02);}
 assert.ok(counts.every((v,i)=>i===0||v>counts[i-1]));
});
test('normal meeting waits for FOOD / LUNCH and never overwrites fixed life targets',()=>{
 const s=quiet(20);s.needs.phase='LUNCH_FOOD';s.meetings.scheduledNormal=createMeeting(s,'NORMAL',20);
 ensureTarget(s);assert.equal(s.currentTarget?.type,'FOOD');advance(s,4);assert.equal(s.currentTarget?.type,'LUNCH');advance(s,4);
 assert.equal((s as State).currentTarget?.type,'MEETING');assert.equal(s.meetings.statistics.normalMeetingsTriggered,1);
});
test('meeting supports existing high priority Problem stack and exact resume',()=>{
 const s=quiet();s.player.money=1000;toggleProduct(s,'wound');const t=createMeeting(s,'NORMAL',10);startMeeting(s,t);advance(s,1);
 triggerEvent(s,'wound',true);ensureTarget(s);assert.equal(s.currentTarget?.type,'PROBLEM');close(t.remainingDuration,2);
 advance(s,4);assert.equal(s.currentTarget?.id,t.id);close(t.remainingDuration,2);advance(s,2);assert.equal(s.meetings.statistics.meetingCount,1);
});
test('G/I Boss meeting is exclusive replacement and Dinner first; Severity never scales meeting',()=>{
 const s=quiet(40);s.needs.phase='AFTERNOON';s.player.upgrades.flattery=245;c.meeting.bossMeetingChanceOnEscapeFail=1;
 const outcome=resolveBoss(s,true,false);assert.equal(outcome.severity,5);assert.equal(s.todoQueue.length,0);assert.equal(activeMandatoryBoss(s),undefined);
 const t=s.meetings.pendingBoss!;close(t.totalDuration,3);assert.equal(t.compensation,5);
 ensureTarget(s);assert.equal(s.currentTarget?.type,'FOOD');advance(s,4);assert.equal(s.currentTarget?.id,t.id);close(t.remainingDuration,3);
 const rng=s.world.rng;resolveBoss(s,true,false);assert.equal(s.world.rng,rng);advance(s,3);assert.equal(activeBossMeeting(s),undefined);assert.equal(s.meetings.statistics.bossMeetingCount,1);
});
test('H Work outcome preserves original workload reward severity and active invariant',()=>{
 const s=quiet(40);s.career.rank=4;s.player.age=60;s.player.upgrades.flattery=245;resolveBoss(s,true,false);
 const todo=activeMandatoryBoss(s)!;assert.equal(todo.bossSeverity,5);close(todo.baseWorkload,250);close(todo.workload,250*3*1.7);assert.equal(todo.baseReward,900);
 c.meeting.bossMeetingChanceOnEscapeFail=1;const rng=s.world.rng;resolveBoss(s,true,false);assert.equal(s.todoQueue.length,1);assert.equal(s.world.rng,rng);assert.equal(s.meetings.pendingBoss,null);
});
test('J Boss meeting crossing Sleep consumes actual sleep output, not guessed loss',()=>{
 const s=quiet(49);s.needs.phase='AFTERNOON';const t=createMeeting(s,'BOSS');startMeeting(s,t);advance(s,3);assert.equal(s.needs.sleep.output,0);
 advance(s,16);close(s.needs.sleep.lastRatio,16/18);assert.equal(s.meetings.statistics.meetingCrossSleepCount,1);
});
test('K/L crossing WorkStart retains remaining meeting, advances Deadline, then breakfast normally',()=>{
 const s=quiet(67);s.needs.phase='AFTERNOON';s.needs.bossChecked=true;const todo=createTodo(s,{...c.work.templates[0],deadlineWorkdays:0});todo.assignmentWorkdayIndex=0;todo.dueWorkdayIndex=0;s.todoQueue.push(todo);
 const t=createMeeting(s,'BOSS');startMeeting(s,t);advance(s,1);assert.equal(s.currentTarget?.id,t.id);close(t.remainingDuration,2);
 assert.equal(getDeadlineWorkdayIndex(s.world.totalWorldTime),1);assert.equal(getDeadlineStatus(todo,s),'OVERDUE');assert.equal(s.needs.sleep.lastRatio,0);
 advance(s,2);assert.equal(s.currentTarget?.type,'FOOD');assert.equal(s.currentTarget?.type==='FOOD'?s.currentTarget.meal:null,'BREAKFAST');
 assert.equal(s.meetings.statistics.meetingCrossWorkStartCount,1);assert.equal(s.meetings.statistics.meetingCompensation,5);
});
test('M/N no workload fields, Todo, Project, Follow-up, completedWork or Deadline on meetings',()=>{
 const s=quiet();const t=createMeeting(s,'NORMAL',10);for(const key of ['workload','requirement','deadline','followUpDepth','todo','projectId'])assert.ok(!Object.hasOwn(t,key));
 startMeeting(s,t);advance(s,3);assert.ok(s.todoQueue.every(w=>w.sourceId!==t.id && w.rootId!==t.id));assert.equal(s.projects.length,0);assert.equal(s.pendingFollowUps.length,0);assert.equal(s.runStatistics.completedWork,0);
});
test('O current mid-progress save reload preserves duration / metadata / RNG; legacy additive defaults',()=>{
 const s=quiet();startMeeting(s,createMeeting(s,'NORMAL',10));advance(s,1.25);const store=memory();saveGame(s,store,0);const loaded=loadGame(store,0);
 assert.equal(loaded.error,null);assert.deepEqual(loaded.state.currentTarget,s.currentTarget);assert.equal(loaded.state.world.rng,s.world.rng);assert.ok(validateSave(loaded.state));
 const old=quiet();const preserved=structuredClone(old);delete (old as Partial<State>).meetings;store.setItem(c.save.key,JSON.stringify(old));const migrated=loadGame(store,0);
 assert.equal(migrated.error,null);assert.deepEqual(migrated.state.player,preserved.player);assert.deepEqual(migrated.state.todoQueue,preserved.todoQueue);assert.equal(migrated.state.world.rng,preserved.world.rng);
});
test('Debug Normal / Boss entries consume no RNG; Boss force respects existing mandatory overtime',()=>{
 const s=quiet();Object.assign(c.meeting,structuredClone(original));s.meetings.lastScheduledWorkday=null;const rng=s.world.rng;applyAction(s,{type:'debug',command:'normalMeeting'});assert.equal(s.world.rng,rng);assert.equal(s.currentTarget?.type,'MEETING');
 const b=quiet(40);Object.assign(c.meeting,structuredClone(original));b.meetings.lastScheduledWorkday=null;b.needs.phase='AFTERNOON';const brng=b.world.rng;applyAction(b,{type:'debug',command:'bossMeeting'});assert.equal(b.world.rng,brng);assert.equal(b.currentTarget?.type,'FOOD');
 const w=quiet(40);resolveBoss(w,true,false);assert.equal(applyAction(w,{type:'debug',command:'bossMeeting'}),false);assert.equal(w.meetings.pendingBoss,null);
});
test('Meeting ON remains deterministic across world-time batch sizes after late Lunch',()=>{
 Object.assign(c.meeting,structuredClone(original));const values=[];
 for(const step of [180,.1,.2,.5,1]){const s=initialState(42,0);for(let j=0;j<180/step;j++)advance(s,step);values.push([s.player.money,s.runStatistics.completedWork,s.world.rng,s.meetings.statistics.meetingCount]);}
 for(const row of values)assert.deepEqual(row,values[0]);
});
