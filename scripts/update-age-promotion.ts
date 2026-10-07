import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import XLSX from 'xlsx';
import { defaultGameConfig as c } from '../src/config/v2Defaults';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),file=path.join(root,'config/game_config.xlsx');
const backup=path.join(root,'config/archive/game_config-pre-age-promotion.xlsx');if(!fs.existsSync(backup))fs.copyFileSync(file,backup);
const book=XLSX.readFile(file),rows=XLSX.utils.sheet_to_json<{key:string;value:unknown;description?:string}>(book.Sheets.Balance).filter(r=>!['age.pressureStart','age.pressurePerYear','age.maximumPressure'].includes(r.key));
if(!rows.some(r=>r.key==='age.workloadCurve'))rows.push({key:'age.workloadCurve',value:JSON.stringify(c.age.workloadCurve),description:'PROVISIONAL stepped age workload'});
for(const row of rows){if(row.key==='ranks'){const value=JSON.parse(String(row.value));row.value=JSON.stringify(value.map((r:any,i:number)=>({...r,maxOverdueAllowed:r.maxOverdueAllowed??c.ranks[i]?.maxOverdueAllowed??0})));}
if(row.key==='products.definitions'){const value=JSON.parse(String(row.value));row.value=JSON.stringify(value.map((p:any)=>({...p,ageEfficiencyCompensationRate:p.ageEfficiencyCompensationRate??c.products.definitions.find(x=>x.id===p.id)?.ageEfficiencyCompensationRate??0})));}}
book.Sheets.Balance=XLSX.utils.json_to_sheet(rows);book.Sheets.Balance['!cols']=[{wch:48},{wch:70},{wch:55}];XLSX.writeFile(book,file);
