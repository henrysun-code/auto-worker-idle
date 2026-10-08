import './legacyBalanceFixture';
import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState} from '../src/game/state/initialState';
import {advance} from '../src/game/engine/SimulationLoop';
import {ensureTarget} from '../src/game/targets/targetManager';
import {getDeadlineWorkdayIndex} from '../src/game/work/deadline';
for(const ratio of [1,.5,0])test(`sleep ratio ${ratio} settles then breakfast at unchanged workStart`,()=>{
 const s=initialState(42,0);s.world.totalWorldTime=68-18*ratio;s.world.dayIndex=Math.floor(s.world.totalWorldTime/60);s.world.timeOfDay=s.world.totalWorldTime%60;s.world.nextEventAt=1e9;s.needs.phase='SLEEP';
 if(ratio)advance(s,18*ratio);else ensureTarget(s);
 assert.equal(s.needs.sleep.lastRatio,ratio);assert.equal(s.currentTarget?.type,'FOOD');assert.equal(s.currentTarget?.type==='FOOD'?s.currentTarget.meal:null,'BREAKFAST');assert.equal(s.needs.breakfastState,'STARTED');assert.ok(!s.eventLog.some(n=>n.text.includes('早餐時間已經過了')));
 if(!ratio)assert.equal(s.needs.sleep.speedModifier,-.3);
 advance(s,4);assert.equal(s.needs.breakfastState,'COMPLETED');for(let i=0;i<10;i++)ensureTarget(s);assert.equal(s.eventLog.filter(n=>n.text.startsWith('早餐：')).length,1);
});
test('unfinished sleep ends at workStart and does not erase breakfast',()=>{const s=initialState(42,0);s.world.totalWorldTime=67;s.world.dayIndex=1;s.world.timeOfDay=7;s.world.nextEventAt=1e9;s.needs.phase='SLEEP';s.currentTarget={id:'sleep',name:'sleep',type:'SLEEP',requirement:1000,progress:0,createdAt:67};advance(s,1);assert.equal(s.currentTarget?.type,'FOOD');assert.equal(s.needs.breakfastState,'STARTED');});
test('deadline workday index retains exact boundaries',()=>{for(const [time,index] of [[0,-1],[7.999,-1],[8,0],[60,0],[67.999,0],[68,1],[128,2]])assert.equal(getDeadlineWorkdayIndex(time),index);});
