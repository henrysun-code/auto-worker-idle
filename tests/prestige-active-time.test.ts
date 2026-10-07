import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState} from '../src/game/state/initialState';
import {canPrestige,prestigeReset} from '../src/game/prestige/prestigeManager';
import {advance} from '../src/game/engine/SimulationLoop';
import {applyAction} from '../src/game/engine/actions';
import {saveGame,loadGame} from '../src/game/save/saveGame';
import {gameConfig as c} from '../src/config/gameConfig';
import {getRunUpgradeCost} from '../src/game/work/progression';
const eligible=()=>{const s=initialState(42,0);s.career.rank=s.career.highestRank=c.prestige.minimumRank;s.runStatistics.earned=c.prestige.minimumEarned;return s;};
test('29:59 refuses, 30:00 still requires rank and earned; accepted action resets timer',()=>{
 const s=eligible();s.runStatistics.activeSeconds=1799;assert.equal(canPrestige(s),false);assert.equal(applyAction(s,{type:'prestige'}),false);
 s.runStatistics.activeSeconds=1800;assert.equal(canPrestige(s),true);
 s.career.highestRank=0;assert.equal(canPrestige(s),false);s.career.highestRank=c.prestige.minimumRank;
 s.runStatistics.earned=c.prestige.minimumEarned-1;assert.equal(canPrestige(s),false);s.runStatistics.earned=c.prestige.minimumEarned;
 assert.equal(prestigeReset(s),true);assert.equal(s.runStatistics.activeSeconds,0);assert.equal(canPrestige(s),false);
});
test('World speed and debug jumps cannot replace real active time; offline counts zero',()=>{
 for(const speed of [1,2,5,10]){const s=eligible();advance(s,10*speed,{activeSeconds:10});assert.equal(s.runStatistics.activeSeconds,10);assert.equal(canPrestige(s),false);}
 const s=eligible();advance(s,1800);assert.equal(s.runStatistics.activeSeconds,0);
 advance(s,1800,{offline:true,activeSeconds:1800});assert.equal(s.runStatistics.activeSeconds,0);
 applyAction(s,{type:'debug',command:'day',value:100});assert.equal(s.runStatistics.activeSeconds,0);
});
test('Active timer boundary is precise inside an accelerated world tick',()=>{
 const s=eligible();s.runStatistics.activeSeconds=1799;const seen:number[]=[];
 advance(s,20,{activeSeconds:2,onBoundary:state=>{if(canPrestige(state))seen.push(state.runStatistics.activeSeconds);}});
 assert.equal(seen[0],1800);assert.equal(s.runStatistics.activeSeconds,1801);
});
test('Save reload retains timer; offline does not credit it; missing legacy timer preserves progress',()=>{
 const map=new Map<string,string>(),storage={getItem:(k:string)=>map.get(k)??null,setItem:(k:string,v:string)=>{map.set(k,v)},removeItem:(k:string)=>{map.delete(k)}};
 const s=eligible();s.runStatistics.activeSeconds=1234.5;saveGame(s,storage,0);
 const loaded=loadGame(storage,16*60*60*1000);assert.equal(loaded.error,null);assert.equal(loaded.state.runStatistics.activeSeconds,1234.5);
 const raw=JSON.parse(map.get(c.save.key)!);delete raw.runStatistics.activeSeconds;map.set(c.save.key,JSON.stringify(raw));
 const legacy=loadGame(storage,0);assert.equal(legacy.error,null);assert.equal(legacy.state.runStatistics.activeSeconds,0);assert.equal(legacy.state.runStatistics.earned,s.runStatistics.earned);
});
test('C is1.005, curve follows helper and pre200 prices are exactly unchanged',()=>{
 assert.equal(c.runUpgradeCurve.post200Growth,1.005);
 for(let level=0;level<=200;level++)for(const id of Object.keys(c.upgrades) as (keyof typeof c.upgrades)[]){const u=c.upgrades[id];assert.equal(getRunUpgradeCost(id,level),Math.ceil(u.baseCost*1.025**level*1.015**Math.max(0,level-100)));}
 for(const [level,expected] of [[100,414],[200,21650],[225,65970],[250,201023],[275,612553],[300,1866562]])assert.ok(Math.abs(getRunUpgradeCost('efficiency',level)-expected)<=1);
});
