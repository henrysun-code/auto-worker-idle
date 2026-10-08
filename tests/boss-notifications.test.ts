import './legacyBalanceFixture';
import {gameConfig as c} from '../src/config/gameConfig';
import test from 'node:test';
import assert from 'node:assert/strict';
import { initialState } from '../src/game/state/initialState';
import { resolveBoss } from '../src/game/career/bossEvents';
for (const [caught,escaped] of [[false,false],[true,true],[true,false]]) test(`boss ${caught}/${escaped} queues one coherent outcome and keeps detailed history`,()=>{const s=initialState(42,0);resolveBoss(s,caught,escaped);assert.equal(s.notifications.filter(n=>n.type==='老闆').length,1);assert.ok(s.notifications[0].text.includes('下班前'));assert.ok(s.eventLog.some(n=>n.text==='老闆正在找人……'));if(caught&&!escaped){assert.ok(s.notifications[0].text.includes('先吃晚餐，再完成老闆急件'));assert.equal(s.todoQueue.length,1);}});

// Legacy Boss Work regression: Meeting outcome disabled only in this test process.
c.meeting.bossMeetingChanceOnEscapeFail=0;

