import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import XLSX from 'xlsx';
import { defaultGameConfig as c } from '../src/config/v2Defaults';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = path.join(root, 'config/game_config.xlsx');
const backup = path.join(root, 'config/archive/game_config-pre-workday-deadline.xlsx');
if (!fs.existsSync(backup)) fs.copyFileSync(file,backup);
const book=XLSX.readFile(file), prior=XLSX.utils.sheet_to_json<{key:string;value:unknown;description?:string}>(book.Sheets.Balance);
const rows=prior.filter(r=>!r.key.startsWith('deadlines.'));
if(!rows.some(r=>r.key==='time.workStartAnchor')) rows.push({key:'time.workStartAnchor',value:c.time.workStartAnchor,description:'PROVISIONAL reference seconds / deadline workday start'});
const legacyProfiles:Record<string,string>={NORMAL_SHORT:'NORMAL',PROJECT_MULTI_DAY:'PROJECT',REWORK_SAME_DAY:'REWORK_SHORT',CLIENT_SAME_DAY:'CLIENT_REPLY'};
for(const row of rows) if(['work.templates','followUps.types','projects.templates'].includes(row.key)){const clean=(v:any):any=>Array.isArray(v)?v.map(clean):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).filter(([k])=>!['deadlineGameHours','deadlineMinGameHours','deadlineMaxGameHours','dueSoonLeadGameHours','dueSoonRatio','dueSoonThresholdRatio'].includes(k)).map(([k,val])=>[k,k==='deadlineProfileId'&&typeof val==='string'?legacyProfiles[val]??val:clean(val)])):v;row.value=JSON.stringify(clean(JSON.parse(String(row.value))));}
function flatten(value:object,prefix:string):{key:string;value:unknown;description:string}[]{return Object.entries(value).flatMap(([k,v])=>{const key=`${prefix}.${k}`;return typeof v==='object'&&!Array.isArray(v)?flatten(v,key):[{key,value:Array.isArray(v)?JSON.stringify(v):v,description:'PROVISIONAL / pending play balance'}];});}
for(const row of flatten(c.deadlines,'deadlines')){const old=prior.find(r=>r.key===row.key);rows.push(row.key==='deadlines.overdueRewardMultiplier'&&old?{...row,value:old.value}:row);}
book.Sheets.Balance=XLSX.utils.json_to_sheet(rows);book.Sheets.Balance['!cols']=[{wch:48},{wch:70},{wch:55}];XLSX.writeFile(book,file);
