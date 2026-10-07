import assert from 'node:assert/strict';
import {isDeepStrictEqual} from 'node:util';
import {initialState} from '../src/game/state/initialState';
import {advance} from '../src/game/engine/SimulationLoop';
import {getDeadlineWorkdayIndex} from '../src/game/work/deadline';
import {careerV3Decision,type Policy} from './careerV3Policy';
export function preflightCareer(policy:Policy,seed:number,batch:number,seconds=600){
 const s=initialState(seed,0);let earned=0,day=-999,rank=0;
 const STOP=Symbol('natural policy decision');
 while(s.world.totalWorldTime<seconds-1e-8){
  careerV3Decision(s,policy);
  const duration=Math.min(batch,seconds-s.world.totalWorldTime);
  try{advance(s,duration,{activeSeconds:duration,onBoundary:()=>{
   assert.equal(s.promotion.lowProfileEnabled,false);assert.equal(s.runStatistics.offlineDays,0);
   assert(Object.values(s.products).every(p=>!p.active&&p.contributionStats.totalSpent===0));
   const workday=getDeadlineWorkdayIndex(s.world.totalWorldTime);
   if(s.runStatistics.earned!==earned||workday!==day||s.career.rank!==rank){earned=s.runStatistics.earned;day=workday;rank=s.career.rank;throw STOP;}
  }});}catch(e){if(e!==STOP)throw e;}
 }
 return s;
}
export function compareSemanticState(a:unknown,b:unknown){
 const differences:{path:string;small:unknown;large:unknown}[]=[],tails:{path:string;difference:number;classification:string}[]=[];
 // Only continuous accumulators; money, targets, workloads, RNG and IDs remain exact.
 const continuous=new Set(['.player.age','.player.ageProgressDays']);
 function visit(x:unknown,y:unknown,p=''){
  if(isDeepStrictEqual(x,y))return;
  if(typeof x==='number'&&typeof y==='number'&&continuous.has(p)&&Number.isFinite(x)&&Number.isFinite(y)&&Math.abs(x-y)<=1e-12){tails.push({path:p,difference:Math.abs(x-y),classification:'NON_SEMANTIC_FLOAT_TAIL'});return;}
  // Notices retain relative display times, not scheduling timestamps. One existing
  // 1e-10 world-clock quantum plus binary subtraction noise has no branch consumer.
  if(typeof x==='number'&&typeof y==='number'&&/^\.(eventLog|notifications)\.\d+\.time$/.test(p)&&Number.isFinite(x)&&Number.isFinite(y)&&Math.abs(x-y)<=2e-10){tails.push({path:p,difference:Math.abs(x-y),classification:'NON_SEMANTIC_FLOAT_TAIL'});return;}
  if(x&&y&&typeof x==='object'&&typeof y==='object'){for(const k of new Set([...Object.keys(x),...Object.keys(y)]))visit((x as Record<string,unknown>)[k],(y as Record<string,unknown>)[k],p+'.'+k);return;}
  differences.push({path:p,small:x,large:y});
 }
 visit(a,b);return {semanticEqual:!differences.length,fullStateExactEqual:isDeepStrictEqual(a,b),differences,nonSemanticTails:tails};
}
