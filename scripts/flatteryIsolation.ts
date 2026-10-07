import {mkdirSync,writeFileSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {simulateCareer} from './careerSimulation';
import {initialState} from '../src/game/state/initialState';
import {instrument,setBalanceHooks,sourceHash} from './balanceInstrumentation';
const root=fileURLToPath(new URL('../reports/career-progression-v2/',import.meta.url));mkdirSync(root,{recursive:true});
const target=root+'flattery-isolation-raw.json';assert.ok(!existsSync(target));
const before=await sourceHash(),i=await instrument(),rows=[];
for(const profile of ['UNPROTECTED','COUNTERED'])for(const flattery of [0,50,100,150,200])for(let replicate=0;replicate<30;replicate++){
 const seed=42+replicate*7919,s=initialState(seed,0);s.career.rank=s.career.highestRank=4;
 s.player.upgrades={efficiency:200,quality:200,flattery,lifeManagement:profile==='COUNTERED'?200:0,slacking:profile==='COUNTERED'?200:0};
 const r=simulateCareer('ALL_ROUNDER','NEVER_PRESTIGE',seed,{initial:s,maxSeconds:7200,noPurchases:true,onlyTables:['boss','sleep','source','economy'],advance:i.advance,installBossHook:boss=>setBalanceHooks({boss,projectAttempt:()=>{},projectPassed:()=>{}})});
 assert.deepEqual(r.state.player.upgrades,s.player.upgrades);assert.equal(r.state.career.rank,4);assert.equal(r.state.permanentStatistics.runs,0);assert.equal(r.state.runStatistics.activeSeconds,7200);
 assert.ok(r.state.player.age<30); // Natural official aging stays inside the same age22 workload band.
 const b=r.tables.source.find(x=>x.source==='BOSS')!;
 rows.push({profile,flattery,replicate,...r.summary,grossPerActiveMinute:r.summary.grossIncome/120,nonBossWorkIncome:r.summary.workIncome-r.summary.bossIncome,bossIncomeShare:r.summary.bossIncome/r.summary.grossIncome,bossGeneratedWorkload:b.generatedWorkload,bossProcessedWorkload:b.processedWorkload,finalAge:r.state.player.age});
 if(rows.length%30===0)console.log(`Flattery ${profile} Lv${flattery}: ${rows.length}/300`);
}
assert.equal(await sourceHash(),before);writeFileSync(target,JSON.stringify({sourceHash:before,count:300,rows}));console.log('ISOLATION COMPLETE300');
