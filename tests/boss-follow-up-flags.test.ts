import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState} from '../src/game/state/initialState';
import {gameConfig as c} from '../src/config/gameConfig';
import {resolveBoss,activeMandatoryBoss} from '../src/game/career/bossEvents';
import {createFollowUp,releasePending} from '../src/game/work/followUpManager';

for(const delay of [0,5])test(`Boss Follow-up excludes overtime flags, delay ${delay}`,()=>{
 const s=initialState(42,0);resolveBoss(s,true,false);
 const boss=s.todoQueue[0],before=structuredClone(boss),rule=c.followUps.types[0];
 const tasks=createFollowUp(s,boss,rule.type,1,delay);
 assert.equal(tasks.length,1);
 const child=tasks[0];
 assert.equal(child.mandatoryOvertime,undefined);assert.equal(child.bossSeverity,undefined);
 assert.equal(Object.hasOwn(child,'mandatoryOvertime'),false);assert.equal(Object.hasOwn(child,'bossSeverity'),false);
 assert.equal(child.sourceType,'FOLLOW_UP');assert.equal(child.sourceId,boss.id);
 assert.equal(child.rootId,boss.rootId);assert.equal(child.followUpDepth,boss.followUpDepth+1);
 assert.equal(child.baseReward,Math.round(boss.baseReward*rule.rewardFactor));
 assert.equal(child.baseWorkload,boss.baseWorkload*rule.workloadFactor);
 assert.deepEqual(boss,before);assert.equal(activeMandatoryBoss(s)?.id,boss.id);
 s.todoQueue=s.todoQueue.filter(t=>t.id!==boss.id);releasePending(s,true);
 assert.equal(activeMandatoryBoss(s),undefined);
 assert.ok(s.todoQueue.some(t=>t.id===child.id));
});

// Legacy Boss Work regression: Meeting outcome disabled only in this test process.
c.meeting.bossMeetingChanceOnEscapeFail=0;

