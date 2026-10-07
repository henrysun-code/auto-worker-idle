import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {initialState} from '../src/game/state/initialState';
import {advance as production} from '../src/game/engine/SimulationLoop';
import {getDeadlineWorkdayIndex} from '../src/game/work/deadline';
import {careerV3Decision,policies} from './careerV3Policy';
import {instrumentV3,setV3Observer} from './careerV3Instrumentation';
import {simulateV3} from './careerV3Simulation';
const engine=await instrumentV3();let hooks=0;setV3Observer(()=>hooks++);
function run(policy:any,advance:typeof production){const s=initialState(42,0);let earned=0,day=-999,rank=0;const STOP=Symbol();while(s.world.totalWorldTime<1800-1e-8){careerV3Decision(s,policy);const d=Math.min(60,1800-s.world.totalWorldTime);try{advance(s,d,{activeSeconds:d,onBoundary:()=>{const wd=getDeadlineWorkdayIndex(s.world.totalWorldTime);if(s.runStatistics.earned!==earned||wd!==day||s.career.rank!==rank){earned=s.runStatistics.earned;day=wd;rank=s.career.rank;throw STOP;}}});}catch(e){if(e!==STOP)throw e;}}return s;}
const results=[];for(const p of policies){const a=run(p,production),b=run(p,engine.advance);assert.deepEqual(a,b);results.push({policy:p,seconds:1800,fullStateExact:true,rngExact:true});}assert.ok(hooks>0);setV3Observer();
Date.now=()=>0;const prestige=simulateV3('ALL_ROUNDER','AS_SOON_AS_ELIGIBLE',42,engine.advance,3600);assert.ok(prestige.summary.prestigeCount>=1);
writeFileSync(new URL('../reports/career-v3-full/observer-verification.json',import.meta.url),JSON.stringify({passed:true,hookCalls:hooks,comparisons:results,prestigeSmoke:prestige.summary},null,2));console.log('Observer exact-state/RNG and prestige smoke PASS');
