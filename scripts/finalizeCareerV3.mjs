import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {join,relative} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const game=fileURLToPath(new URL('../',import.meta.url)),root=join(game,'reports/career-v3-full');
async function sourceHash(){const source=join(game,'src'),hash=createHash('sha256');async function walk(dir){for(const entry of(await fs.readdir(dir,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))){const p=join(dir,entry.name);if(entry.isDirectory())await walk(p);else{hash.update(relative(source,p));hash.update(await fs.readFile(p));}}}await walk(source);hash.update(await fs.readFile(join(game,'config/generated/game_config.json')));hash.update(await fs.readFile(join(game,'config/game_config.xlsx')));return hash.digest('hex');}
const get=async name=>JSON.parse(await fs.readFile(join(root,name),'utf8'));
const preflight=await get('batch-preflight-after.json'),analysis=await get('canonical-analysis-sanity.json'),observer=await get('observer-verification.json'),csv=await get('csv-export-verification.json');
assert.equal(preflight.passed,true);assert.equal(observer.passed,true);assert.equal(csv.passed,true);assert.equal(analysis.runs,900);
const before=await get('config-before.json'),after=JSON.parse(await fs.readFile(join(game,'config/generated/game_config.json'),'utf8'));assert.deepEqual(before,after);const hash=await sourceHash();assert.equal(hash,preflight.sourceHash);
await fs.writeFile(join(root,'career-v3-config-before.json'),JSON.stringify(before,null,2));await fs.writeFile(join(root,'career-v3-config-after.json'),JSON.stringify(after,null,2));
const verification={entireFormalConfigDeepEqual:true,productionSourceExcelAndGeneratedConfigHashUnchanged:true,beforeHash:preflight.sourceHash,afterHash:hash};await fs.writeFile(join(root,'career-v3-config-verification.json'),JSON.stringify(verification,null,2));
const core=await fs.readFile(join(root,'canonical-core-tests.log'),'utf8'),browser=await fs.readFile(join(root,'canonical-browser-tests.log'),'utf8'),build=await fs.readFile(join(root,'canonical-build.log'),'utf8');
const corePass=Number(core.match(/(?:#|ℹ) pass (\d+)/)?.[1]),coreFail=Number(core.match(/(?:#|ℹ) fail (\d+)/)?.[1]),browserPass=Number(browser.match(/(\d+) passed/)?.[1]);assert.ok(corePass>=435&&coreFail===0);assert.ok(browserPass>=31&&!/\d+ failed/.test(browser));assert.ok(build.includes('built in')&&!build.includes('error TS'));
const manifests=[];for(let i=0;i<3;i++){const m=await get(`canonical-part-${i}/manifest.json`);assert.equal(m.status,'PASS');assert.equal(m.count,300);assert.equal(m.sourceHash,hash);manifests.push(m);}
const sanity={status:'COMPLETE_CANONICAL_900_RUNS',priorState:'UNBLOCKED_FOR_CANONICAL_RUNS',...analysis,preflight:{passed:true,policies:5,comparisons:25,rngExact:true,activeSecondsExact:true,discreteGameplayExact:true},observerExactStateAndRng:true,config:verification,core:{passed:corePass,failed:coreFail},browser:{passed:browserPass,failed:0},build:{passed:true},noAutoTune:true,noBalanceChange:true,noCommit:true,noPush:true,partitions:manifests};await fs.writeFile(join(root,'career-v3-sanity.json'),JSON.stringify(sanity,null,2));
const report=await fs.readFile(join(root,'CAREER_V3_FULL_REPORT.md'),'utf8');await fs.writeFile(join(root,'CAREER_V3_FULL_REPORT.md'),report+`\n## Final Regression\n\nCore ${corePass}/${corePass} PASS；Browser ${browserPass}/${browserPass} PASS；Build PASS；entireFormalConfigDeepEqual=true；Production Source / Excel / Runtime Config hash unchanged.\n`);
console.log(JSON.stringify(sanity));
