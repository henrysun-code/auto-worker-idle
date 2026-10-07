import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import XLSX from 'xlsx';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const rows=(file:string)=>XLSX.utils.sheet_to_json<{key:string;value:unknown}>(XLSX.readFile(file).Sheets.Balance);
const before=rows(path.join(root,'config/archive/game_config-pre-progression-core.xlsx'));
const after=new Map(rows(path.join(root,'config/game_config.xlsx')).map(r=>[r.key,r.value]));
const allowed=new Set(['ranks','prestige.upgrades','debug.maxLevel','lunch.outputIncrement','life.sleepRequirement','life.restedSpeed','life.latePenaltyPerSecond','life.oversleepPenaltyPerSecond','life.maximumPenalty']);
let unchanged=0;
for(const row of before){if(allowed.has(row.key)||row.key.startsWith('boss.')||/^upgrades\..*\.(increment|growthRate)$/.test(row.key))continue;assert.deepEqual(after.get(row.key),row.value,`Unexpected config change: ${row.key}`);unchanged++;}
const oldRanks=JSON.parse(String(before.find(r=>r.key==='ranks')!.value));
const newRanks=JSON.parse(String(after.get('ranks')));
assert.deepEqual(newRanks.map(({rankEscapeResistance,...r}:any)=>r),oldRanks.map(({bossModifier,...r}:any)=>r),'Rank content/economy/promotion changed');
const result={passed:true,unchangedExcelRows:unchanged,rankFieldsExceptResistanceUnchanged:true,scope:'All pre-existing Excel keys except explicitly authorized formula/sleep/boss/debug fields'};
fs.writeFileSync(path.join(root,'reports/progression-curves/CONFIG_PRESERVATION.json'),JSON.stringify(result,null,2));
console.log(JSON.stringify(result));
