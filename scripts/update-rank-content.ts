import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import XLSX from 'xlsx';
import { defaultGameConfig as c } from '../src/config/v2Defaults';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),file=path.join(root,'config/game_config.xlsx'),backup=path.join(root,'config/archive/game_config-pre-rank-content.xlsx');
if(!fs.existsSync(backup))fs.copyFileSync(file,backup);
const book=XLSX.readFile(file),rows=XLSX.utils.sheet_to_json<{key:string;value:unknown;description?:string}>(book.Sheets.Balance);
for(const row of rows)if(['work.templates','projects.templates'].includes(row.key)){
 const defaults=row.key==='work.templates'?c.work.templates:c.projects.templates;
 const existing=JSON.parse(String(row.value)) as {id:string;rankWeights?:number[]}[];
 for(const t of existing)if(t.rankWeights===undefined){const d=defaults.find(d=>d.id===t.id);if(d)t.rankWeights=[...d.rankWeights];}
 for(const t of defaults)if(!existing.some(x=>x.id===t.id))existing.push(structuredClone(t));
 row.value=JSON.stringify(existing);row.description='PROVISIONAL rank content / base values / rankWeights';
}
book.Sheets.Balance=XLSX.utils.json_to_sheet(rows);book.Sheets.Balance['!cols']=[{wch:48},{wch:70},{wch:55}];XLSX.writeFile(book,file);
