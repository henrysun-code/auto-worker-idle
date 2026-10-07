import {readFileSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {simulateCareer,type Timing} from './careerSimulation';
import type {Policy} from './careerPolicies';
const part=Number(process.argv[2]),root=fileURLToPath(new URL(`../reports/career-progression/part-${part}/`,import.meta.url));
const manifest=JSON.parse(readFileSync(root+'manifest.json','utf8')),out=[];
for(const row of manifest.summaries){
 const result=simulateCareer(row.policy as Policy,row.timing as Timing,row.seed,{onlyTables:['promotions','promotionBlocks']});const r=result.summary;
 for(const field of ['grossIncome','upgradeSpend','promotionSpend','processedWorkload','generatedWorkload','prestigeCount'])assert.equal(r[field as keyof typeof r],row[field],`read-only replay ${field}`);
 assert.deepEqual(r.finalLevels,row.finalLevels);assert.deepEqual(r.permanentLevels,row.permanentLevels);
 out.push({policy:row.policy,timing:row.timing,seed:row.seed,entertainmentMissedDueToOvertime:r.entertainmentMissedDueToOvertime,moneyBlockedSeconds:r.moneyBlockedSeconds,overdueBlockedSeconds:r.overdueBlockedSeconds,recommendedBlockedSeconds:r.recommendedBlockedSeconds,fundedOverdueBlockedSeconds:r.fundedOverdueBlockedSeconds,promotionBlocks:result.tables.promotionBlocks,promotions:result.tables.promotions,primaryEconomyAndWorkloadEqual:true});
 if(out.length%50===0)console.log(`audit ${part}: ${out.length}/300`);
}
writeFileSync(root+'entertainment-audit.json',JSON.stringify(out));console.log(`audit ${part} COMPLETE`);
