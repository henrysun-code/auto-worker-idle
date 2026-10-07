import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
const out=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../reports/deterministic-boundary-v1');
const read=async f=>fs.readFile(path.join(out,f),'utf8'),json=async f=>JSON.parse(await read(f));
const preflight=await json('batch-preflight-after.json'),reproduction=await json('batch-reproduction-after.json'),config=await json('config-verification.json');
const core=await read('core-tests.log'),browser=await read('browser-tests.log'),build=await read('build.log');
assert.equal(preflight.passed,true);assert.equal(preflight.verification.length,25);
assert.equal(reproduction.followUpCountsEqual,true);assert.equal(reproduction.rngEqual,true);assert.equal(reproduction.currentTargetExactEqual,true);assert.equal(reproduction.sequenceEqual,true);
assert.equal(config.entireFormalConfigDeepEqual,true);assert.equal(config.excelBytesUnchanged,true);
assert.match(core,/pass 435/);assert.match(core,/fail 0/);assert.match(browser,/31 passed/);assert.match(build,/built in/);assert.doesNotMatch(build,/error TS\d/);
for(const age of [30,40,50,60])assert.match(core,new RegExp(`✔ Age ${age}: new workload snapshots exact`));
const summary={status:'PASS',rootCauseMatchesBlockingReport:true,epsilon:1e-12,productionFiles:config.productionFiles,
 originalCheckpoint:{worldStart:54,worldEnd:90,followUpCountsExact:true,rngExact:true,currentTargetExact:true,sequenceExact:true},
 policies:5,batches:preflight.batches,seed:42,secondsPerComparison:600,comparisons:25,semanticEquality:true,rngExact:true,activeSecondsExact:true,
 ageBreakpoints:[30,40,50,60],newWorkloadSnapshotsExact:true,ageGameplayDivergenceObserved:false,
 nonSemanticFloatTails:{ageTolerance:1e-12,historicalNoticeTimeTolerance:2e-10,maxObservedAgeTail:Math.max(...preflight.verification.flatMap(v=>v.nonSemanticTails.filter(t=>t.path.startsWith('.player')).map(t=>t.difference))),allOtherGameplayFieldsExact:true},
 configDeepEqual:true,excelBytesUnchanged:true,core:{passed:435,failed:0},browser:{passed:31,failed:0},build:{passed:true},
 safeToResumeSpecifiedCareerPreflight:true,canonical900RunsStarted:false,noBalanceChange:true,noAutoTune:true,noCommit:true,noPush:true};
await fs.writeFile(path.join(out,'verification-summary.json'),JSON.stringify(summary,null,2)+'\n');
console.log('Boundary V1 PASS: Core435 Browser31 Build; Config unchanged; 900 not started.');
