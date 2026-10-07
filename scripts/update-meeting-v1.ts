import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import XLSX from 'xlsx';
import assert from 'node:assert/strict';
import { defaultGameConfig } from '../src/config/v2Defaults';
const url=(name:string)=>fileURLToPath(new URL('../'+name,import.meta.url));
for(const ext of ['xlsx','json']){
 const source=url(ext==='xlsx'?'config/game_config.xlsx':'config/generated/game_config.json');
 const backup=url('config/archive/game_config-pre-meeting-v1.'+ext);
 assert.ok(!fs.existsSync(backup),'Do not overwrite Meeting baseline');fs.copyFileSync(source,backup);
}
const file=url('config/game_config.xlsx'),book=XLSX.readFile(file);
const rows=XLSX.utils.sheet_to_json<{key:string;value:unknown;description?:string}>(book.Sheets.Balance);
assert.ok(!rows.some(r=>r.key.startsWith('meeting.')));
for(const [key,value] of Object.entries(defaultGameConfig.meeting))rows.push({key:'meeting.'+key,value:Array.isArray(value)?JSON.stringify(value):value,description:'PROVISIONAL Meeting V1: fixed world time, independent compensation / probability.'});
const sheet=XLSX.utils.json_to_sheet(rows);sheet['!cols']=book.Sheets.Balance['!cols'];book.Sheets.Balance=sheet;XLSX.writeFile(book,file);
