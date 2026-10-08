import './legacyBalanceFixture';
import test from 'node:test';
import assert from 'node:assert/strict';
import { initialState } from '../src/game/state/initialState';
import { advance } from '../src/game/engine/SimulationLoop';
import { currentTarget } from '../src/game/presentation/target';
import { applyAction } from '../src/game/engine/actions';
import { validateSave } from '../src/game/save/saveGame';
test('full eight-minute V2 run retains valid state and completes several calendar days',()=>{const s=initialState(42,0);for(let i=0;i<480;i++){advance(s,1);for(const id of ['efficiency','quality','lifeManagement'] as const)if(s.player.upgrades[id]<4)applyAction(s,{type:'upgrade',id});if(s.career.rank<2&&s.player.upgrades.efficiency>=3)applyAction(s,{type:'promote'});}assert.equal(s.world.dayIndex,8);assert.ok(s.runStatistics.completedWork>20);assert.ok(s.runStatistics.earned>0);assert.ok(validateSave(s));console.log('V2 八分鐘:',s.runStatistics.completedWork,'份工作，Todo',s.todoQueue.length,'專案',s.projects.length,'收入',s.runStatistics.earned);});
test('central lunch view uses seconds and rest output rather than workload HP',()=>{const s=initialState(1,0);s.world.totalWorldTime=24;s.world.timeOfDay=24;s.needs.phase='LUNCH';s.currentTarget={id:'lunch',type:'LUNCH',name:'午休',windowStart:20,windowEnd:28,accumulatedRestOutput:0,createdAt:24};const view=currentTarget(s);assert.equal(view.timed,true);assert.equal(view.remaining,4);assert.equal(view.unit,'午休剩餘');assert.equal(view.rate,30);});

test('backlog itself never deducts work efficiency',()=>{const s=initialState(1,0);s.needs.phase='MORNING';const before=s.stats.workSpeed;applyAction(s,{type:'debug',command:'todos10'});assert.equal(s.stats.workSpeed,before);assert.ok(s.todoQueue.length>=9);});
