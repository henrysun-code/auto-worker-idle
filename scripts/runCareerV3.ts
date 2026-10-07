import {mkdirSync,writeFileSync,appendFileSync,existsSync,readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import assert from 'node:assert/strict';
import {simulateV3,timings} from './careerV3Simulation';
import {policies} from './careerV3Policy';
import {instrumentV3} from './careerV3Instrumentation';
import {sourceHash} from './balanceInstrumentation';
const root=fileURLToPath(new URL('../reports/career-v3-full/',import.meta.url));
const before=await sourceHash(),preflight=JSON.parse(readFileSync(join(root,'batch-preflight-after.json'),'utf8'));
assert.equal(preflight.passed,true);assert.equal(preflight.sourceHash,before);
const previous=JSON.parse(readFileSync(new URL('../reports/deterministic-boundary-v1/verification-summary.json',import.meta.url),'utf8'));assert.equal(previous.status,'PASS');assert.equal(previous.configDeepEqual,true);
const part=Number(process.argv[2]??0),parts=Number(process.argv[3]??1),smoke=process.argv.includes('--smoke');
const out=join(root,smoke?'smoke':`canonical-part-${part}`);mkdirSync(out,{recursive:true});assert.ok(!existsSync(join(out,'runs.jsonl')),'Do not overwrite completed canonical runs');
const engine=await instrumentV3(),realNow=Date.now;Date.now=()=>0;
let count=0,index=0;const started=performance.now();
try{
 for(const policy of policies)for(const timing of timings)for(let rep=0;rep<30;rep++,index++){
  if(index%parts!==part||smoke&&index>0)continue;
  const seed=42+rep*7919,result=simulateV3(policy,timing,seed,engine.advance);
  appendFileSync(join(out,'runs.jsonl'),JSON.stringify({replicate:rep,...result.summary})+'\n');
  for(const [table,rows]of Object.entries(result.tables))if(rows.length)appendFileSync(join(out,`${table}.jsonl`),rows.map(r=>JSON.stringify(r)).join('\n')+'\n');
  count++;if(count%5===0||smoke)console.log(JSON.stringify({part,count,seconds:Math.round((performance.now()-started)/1000),policy,timing,seed}));
 }
 assert.equal(await sourceHash(),before);writeFileSync(join(out,'manifest.json'),JSON.stringify({status:'PASS',part,parts,count,sourceHash:before,seconds:(performance.now()-started)/1000}));
}catch(error){const e=error as any;writeFileSync(join(out,'runner-error.json'),JSON.stringify({message:e.message,stack:e.stack,state:e.reproductionState},null,2));throw error;}
finally{Date.now=realNow;}
