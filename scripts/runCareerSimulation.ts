import {mkdirSync,writeFileSync,appendFileSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import assert from 'node:assert/strict';
import {simulateCareer,timings,type Row} from './careerSimulation';
import {policies} from './careerPolicies';
import {instrument,setBalanceHooks,sourceHash} from './balanceInstrumentation';
import {initialState} from '../src/game/state/initialState';

const v2=process.argv.includes('--v2');
const root=fileURLToPath(new URL(v2?'../reports/career-progression-v2/':'../reports/career-progression/',import.meta.url));
const partition=Number(process.argv[2]??0),partitions=Number(process.argv[3]??1);
const out=join(root,`part-${partition}`);mkdirSync(out,{recursive:true});
assert.ok(!existsSync(join(out,'runs.jsonl')),'Existing runs must be preserved; choose a fresh output directory before rerunning');
const before=await sourceHash(),engine=await instrument();
const installBossHook=(cb:(a:boolean,b:boolean,c?:number)=>void)=>setBalanceHooks({projectAttempt:()=>{},projectPassed:()=>{},boss:cb});
const verification:Row[]=[];
for(const rank of [0,4]){
 const state=initialState(42,0);state.career.rank=rank;
 const a=simulateCareer('PREPARED_BALANCED','NEVER_PRESTIGE',42,{initial:state,maxSeconds:600,observe:false});
 const b=simulateCareer('PREPARED_BALANCED','NEVER_PRESTIGE',42,{initial:state,maxSeconds:600,advance:engine.advance,installBossHook});
 assert.deepEqual(b.state,a.state);verification.push({rank,fullStateAndRngEqual:true});
}
const realNow=Date.now;Date.now=()=>0;
const a=simulateCareer('ALL_ROUNDER','AS_SOON_AS_ELIGIBLE',42,{maxSeconds:1800,observe:false});
const b=simulateCareer('ALL_ROUNDER','AS_SOON_AS_ELIGIBLE',42,{maxSeconds:1800,advance:engine.advance,installBossHook});
assert.ok(b.state.permanentStatistics.runs>0);assert.deepEqual(b.state,a.state);verification.push({prestigeCycles:b.state.permanentStatistics.runs,fullStateAndRngEqual:true});Date.now=realNow;
const summaries:Row[]=[],headers:Record<string,string[]>={};
function emit(name:string,rows:Row[]){if(!rows.length)return;const keys=headers[name]??=[];for(const row of rows)for(const key of Object.keys(row))if(!keys.includes(key))keys.push(key);appendFileSync(join(out,`${name}.jsonl`),rows.map(r=>JSON.stringify(r)).join('\n')+'\n');}
let index=0;const started=Date.now();
for(const policy of policies)for(const timing of timings)for(let replicate=0;replicate<30;replicate++,index++){
 if(index%partitions!==partition)continue;
 const seed=42+replicate*7919;
 const result=simulateCareer(policy,timing,seed,{advance:engine.advance,installBossHook,onlyTables:v2?['daily','promotions','prestiges','milestones','waits','recrawl','rankResidence','promotionBlocks','boss','sleep','source','economy','crossRank','cycles']:undefined});
 if(v2)assert.ok(result.summary.firstCanPrestigeMinutes===null||result.summary.firstCanPrestigeMinutes>=30-1e-8);
 const summary={scenarioId:`${policy}/${timing}`,replicate,...result.summary};summaries.push(summary);emit('runs',[summary]);
 for(const [name,rows]of Object.entries(result.tables))emit(name,rows.map(r=>({scenarioId:summary.scenarioId,replicate,...r})));
 if(summaries.length%10===0)console.log(`part ${partition}: ${summaries.length} runs, ${Math.round((Date.now()-started)/1000)}s`);
}
assert.equal(await sourceHash(),before,'production source/config changed during simulation');
writeFileSync(join(out,'manifest.json'),JSON.stringify({partition,partitions,count:summaries.length,sourceHash:before,verification,headers,seconds:(Date.now()-started)/1000,summaries},null,2));
console.log(`part ${partition} COMPLETE ${summaries.length}`);
