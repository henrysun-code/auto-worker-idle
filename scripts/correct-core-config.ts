import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import XLSX from 'xlsx';
import { defaultGameConfig as defaults } from '../src/config/v2Defaults';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = path.join(root, 'config/game_config.xlsx');
const book = XLSX.readFile(file); const rows = XLSX.utils.sheet_to_json<{key:string;value:unknown;description?:string}>(book.Sheets.Balance);
const backup = path.join(root,'config/archive/game_config-pre-boundary-correction.xlsx'); if (!fs.existsSync(backup)) fs.copyFileSync(file,backup);
function set(key:string,value:unknown) { const row = rows.find(r=>r.key===key); const v = typeof value === 'object' ? JSON.stringify(value) : value; if(row)row.value=v;else rows.push({key,value:v,description:key}); }
set('time.breakfastStart',defaults.time.breakfastStart);set('time.breakfastCutoff',defaults.time.breakfastCutoff);set('food.allowWorkInterruption',true);set('age.daysPerYear',365);set('followUps.qualityCountBands',defaults.followUps.qualityCountBands);
for(const key of ['projects.templates','events.definitions','products.definitions']) {
 const row=rows.find(r=>r.key===key)!; const current=JSON.parse(String(row.value));
 const prototype=key==='projects.templates'?defaults.projects.templates:key==='events.definitions'?defaults.events.definitions:defaults.products.definitions;
 const merged=current.map((entry:any)=>{const def=prototype.find(p=>p.id===entry.id); if(!def)return entry; const result={...def,...entry}; if(key==='products.definitions')result.effectType=(def as any).effectType; return result;});
 set(key,merged);
}
const sheet=XLSX.utils.json_to_sheet(rows);sheet['!cols']=book.Sheets.Balance['!cols'];book.Sheets.Balance=sheet;XLSX.writeFile(book,file);
console.log('保留既有數值並補入 Core 校正設定，原表已備份。');
