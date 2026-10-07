import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import XLSX from 'xlsx';
import { defaultGameConfig as c } from '../src/config/v2Defaults';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const report=path.join(root,'reports/promotion-v1');fs.mkdirSync(report,{recursive:true});
const file=path.join(root,'config/game_config.xlsx'),generated=path.join(root,'config/generated/game_config.json');
for(const [src,name] of [[file,'game_config-pre-promotion-v1.xlsx'],[generated,'game_config-pre-promotion-v1.json']]){const dest=path.join(root,'config/archive',name);if(!fs.existsSync(dest))fs.copyFileSync(src,dest);}
const before=path.join(report,'promotion-config-before.json');if(!fs.existsSync(before))fs.copyFileSync(generated,before);
const book=XLSX.readFile(file),rows=XLSX.utils.sheet_to_json<{key:string,value:unknown,description:string}>(book.Sheets.Balance);
for(const name of ['promotionQualification','promotionAssignment','promotionLowProfile'] as const)for(const [key,value]of Object.entries(c[name])){const full=`${name}.${key}`;if(!rows.some(r=>r.key===full))rows.push({key:full,value:typeof value==='object'?JSON.stringify(value):value,description:'Promotion V1 PROVISIONAL'});}
book.Sheets.Balance=XLSX.utils.json_to_sheet(rows);book.Sheets.Balance['!cols']=[{wch:48},{wch:70},{wch:55}];XLSX.writeFile(book,file);
