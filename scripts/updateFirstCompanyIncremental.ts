import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import XLSX from 'xlsx';
import { defaultGameConfig as defaults } from '../src/config/v2Defaults';
const root=new URL('../',import.meta.url);
const file=new URL('config/game_config.xlsx',root);
const book=XLSX.readFile(fileURLToPath(file));
const rows=XLSX.utils.sheet_to_json<{key:string;value:unknown;description?:string}>(book.Sheets.Balance);
const values:Record<string,unknown>={
 'time.dayDuration':defaults.time.dayDuration,'time.sleepTimeAcceleration':defaults.time.sleepTimeAcceleration,
 'economy.baseWorkSpeed':defaults.economy.baseWorkSpeed,'economy.baseQuality':defaults.economy.baseQuality,
 'promotionQualification.requirements':defaults.promotionQualification.requirements,
 'promotionAssignment.workloadFactor':defaults.promotionAssignment.workloadFactor,
 'promotionAssignment.failedCompletionReward':defaults.promotionAssignment.failedCompletionReward,
 'work.workloadTierCenters':defaults.work.workloadTierCenters,'work.templateWorkloadReference':defaults.work.templateWorkloadReference,
 'work.templateVariationMin':defaults.work.templateVariationMin,'work.templateVariationMax':defaults.work.templateVariationMax,
};
const rankRow=rows.find(r=>r.key==='ranks')!;
const ranks=JSON.parse(String(rankRow.value));
for(let i=0;i<ranks.length;i++)Object.assign(ranks[i],{recommendedSpeed:defaults.ranks[i].recommendedSpeed,recommendedQuality:defaults.ranks[i].recommendedQuality});
values.ranks=ranks;
for(const [key,value] of Object.entries(values)){let row=rows.find(r=>r.key===key);if(!row){row={key,value:null,description:'First Company Incremental V1 · PROVISIONAL'};rows.push(row);}row.value=typeof value==='object'?JSON.stringify(value):value;}
book.Sheets.Balance=XLSX.utils.json_to_sheet(rows);
XLSX.writeFile(book,fileURLToPath(file));
fs.writeFileSync(new URL('reports/first-company-incremental-v1/config-changes.json',root),JSON.stringify(values,null,2));
