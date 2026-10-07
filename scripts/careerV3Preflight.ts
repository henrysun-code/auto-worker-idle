import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import assert from 'node:assert/strict';
import {gameConfig as c} from '../src/config/gameConfig';
import {policies} from './careerV3Policy';
import {sourceHash} from './balanceInstrumentation';
import {preflightCareer,compareSemanticState} from './careerV3PreflightCore';
export {preflightCareer} from './careerV3PreflightCore';
// Keep prior blocking reports immutable; this review has its own output.
const root=fileURLToPath(new URL(process.argv.includes('--canonical')?'../reports/career-v3-full/':'../reports/deterministic-boundary-v1/',import.meta.url));
mkdirSync(root,{recursive:true});
assert.deepEqual(JSON.parse(readFileSync(join(root,'config-before.json'),'utf8')),c);
const baselineHash=await sourceHash(),now=Date.now;Date.now=()=>0;
const verification=[];
try{
 for(const policy of policies){
  const reference=preflightCareer(policy,42,60);
  for(const batch of [.05,.25,1,5,60]){
   const candidate=batch===60?reference:preflightCareer(policy,42,batch);
   verification.push({policy,seed:42,batch,referenceBatch:60,activeSeconds:candidate.runStatistics.activeSeconds,rngEqual:candidate.world.rng===reference.world.rng,activeTimeEqual:candidate.runStatistics.activeSeconds===reference.runStatistics.activeSeconds,...compareSemanticState(candidate,reference)});
  }
 }
}finally{Date.now=now;}
assert.equal(await sourceHash(),baselineHash);
const result={sourceHash:baselineHash,configDeepEqual:true,batches:[.05,.25,1,5,60],policies:policies.length,passed:verification.every(v=>v.semanticEqual&&v.rngEqual&&v.activeTimeEqual),verification};
writeFileSync(join(root,'batch-preflight-after.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(verification.map(({differences,nonSemanticTails,...r})=>({...r,differenceCount:differences.length,tailCount:nonSemanticTails.length})),null,2));
if(!result.passed)process.exitCode=2;
