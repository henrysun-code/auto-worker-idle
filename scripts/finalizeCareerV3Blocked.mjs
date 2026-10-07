import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),out=path.join(root,'reports/career-v3-full');
async function sourceHash(){const src=path.join(root,'src'),h=createHash('sha256');async function visit(d){for(const e of(await fs.readdir(d,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))){const p=path.join(d,e.name);if(e.isDirectory())await visit(p);else{h.update(path.relative(src,p));h.update(await fs.readFile(p));}}}await visit(src);h.update(await fs.readFile(path.join(root,'config/generated/game_config.json')));h.update(await fs.readFile(path.join(root,'config/game_config.xlsx')));return h.digest('hex');}
const read=async f=>JSON.parse(await fs.readFile(path.join(out,f),'utf8'));
const before=await read('career-v3-config-before.json'),after=JSON.parse(await fs.readFile(path.join(root,'config/generated/game_config.json'),'utf8'));
assert.deepEqual(after,before);const pre=await read('career-v3-preflight.json'),reproduction=await read('career-v3-reproduction-result.json');
assert.equal(await sourceHash(),pre.sourceHash);assert.equal(reproduction.identicalInitialState,true);assert.equal(reproduction.policyActionsDuringReplay,0);assert.equal(reproduction.rngEqual,false);
await fs.writeFile(path.join(out,'career-v3-config-after.json'),JSON.stringify(after,null,2)+'\n');
const bossBase=after.work.bossWorkHours*after.time.referenceDayDuration/after.time.hoursPerDay*after.economy.baseWorkSpeed;assert.equal(bossBase,50);
const verification={entireFormalConfigDeepEqual:true,productionSourceAndExcelUnchanged:true,sourceHash:pre.sourceHash,bossBaseWorkload:bossBase,productsUnchanged:true,allProtectedBalanceUnchanged:true,noBalanceRowsAdded:true};
await fs.writeFile(path.join(out,'career-v3-config-verification.json'),JSON.stringify(verification,null,2)+'\n');
const logs={};for(const f of ['core-tests.log','browser-tests.log','build.log']){try{const text=await fs.readFile(path.join(out,f),'utf8');logs[f]=f==='core-tests.log'?{passed:Number(text.match(/pass (\d+)/)?.[1]??0),failed:Number(text.match(/fail (\d+)/)?.[1]??0)}:f==='browser-tests.log'?{passed:Number(text.match(/(\d+) passed/)?.[1]??0)}:{passed:/built in/.test(text)&&!/error TS\d/.test(text)};}catch{logs[f]={status:'NOT_RUN'};}}
await fs.writeFile(path.join(out,'career-v3-sanity.json'),JSON.stringify({status:'BLOCKED_BEFORE_CANONICAL_RUNS',logicalRunsPlanned:900,logicalRunsCompleted:0,seeds:Array.from({length:30},(_,i)=>42+i*7919),seedSet:'REUSED_PREVIOUS_CAREER',productsOff:true,productSpending:0,offlineOff:true,lowProfileOff:true,manualPromotionActions:0,batchConsistencyPassed:false,independentReproduction:reproduction,verification,regressions:logs,revenueReconciliation:'NOT_RUN',workloadConservation:'NOT_RUN',careerMetrics:'NOT_RUN',noGameplayModification:true,noAutoTune:true,noCommit:true,noPush:true},null,2)+'\n');
console.log('Blocked Career V3: Config and production Source unchanged; 0/900 Canonical Runs.');
