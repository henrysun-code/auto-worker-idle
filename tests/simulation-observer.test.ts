import './legacyBalanceFixture';
import test from 'node:test';
import assert from 'node:assert/strict';
import { initialState } from '../src/game/state/initialState';
import { advance } from '../src/game/engine/SimulationLoop';
import { createTodo } from '../src/game/work/todoManager';
import { startWork } from '../src/game/targets/targetManager';
import { gameConfig as c } from '../src/config/gameConfig';
import { originalWorkReward, workReward } from '../src/game/work/workStats';

test('measurement hooks preserve exact simulation state and RNG',()=>{
 const a=initialState(42,0),b=structuredClone(a);let processed=0,completed=0,boundaries=0;
 advance(a,1808);advance(b,1808,{onBoundary:()=>boundaries++,onWorkProgress:n=>processed+=n,onWorkCompleted:()=>completed++});
 assert.deepEqual(b,a);assert.equal(completed,b.runStatistics.completedWork);assert.ok(processed>0);assert.ok(boundaries>completed);
});
test('observer measures partial work and exact overdue completion loss',()=>{
 const s=initialState(42,0);s.world.totalWorldTime=8;s.world.timeOfDay=8;s.world.nextEventAt=1e8;
 s.needs.phase='MORNING';s.needs.satietyUntil=1e8;s.needs.projectRollProcessedRoutineId=0;
 const t=createTodo(s,c.work.templates[0]);t.dueWorkdayIndex=-1;t.workload=20;t.baseWorkload=20;
 // At time 8 this todo is exactly on its grace boundary; completion at 9 is genuinely overdue.
 const expected=originalWorkReward(s,t)-workReward(s,t);startWork(s,t);
 let processed=0;const completed:{overdue:boolean,loss:number}[]=[];
 const options={onWorkProgress:(n:number)=>processed+=n,onWorkCompleted:(_t:unknown,overdue:boolean,loss:number)=>completed.push({overdue,loss})};
 advance(s,.25,options);assert.equal(processed,5);assert.equal(completed.length,0);
 advance(s,.75,options);assert.equal(processed,20);assert.deepEqual(completed,[{overdue:true,loss:expected}]);
});
