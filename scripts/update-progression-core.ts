import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import XLSX from 'xlsx';
import {defaultGameConfig as c} from '../src/config/v2Defaults';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),file=path.join(root,'config/game_config.xlsx');
const backup=path.join(root,'config/archive/game_config-pre-progression-core.xlsx');if(!fs.existsSync(backup))fs.copyFileSync(file,backup);
const book=XLSX.readFile(file);let rows=XLSX.utils.sheet_to_json<{key:string;value:unknown;description?:string}>(book.Sheets.Balance);
rows=rows.filter(r=>!/^boss\./.test(r.key)&&!['life.sleepRequirement','life.restedSpeed','life.latePenaltyPerSecond','life.oversleepPenaltyPerSecond','life.maximumPenalty','lunch.outputIncrement'].includes(r.key)&&!r.key.endsWith('.growthRate'));
for(const row of rows){
 if(/^upgrades\..*\.increment$/.test(row.key))row.value=c.upgrades[row.key.split('.')[1] as keyof typeof c.upgrades].increment;
 if(row.key==='debug.maxLevel')row.value=1000;
 if(row.key==='ranks')row.value=JSON.stringify(JSON.parse(String(row.value)).map((r:any,i:number)=>{const {bossModifier,...rest}=r;return {...rest,rankEscapeResistance:r.rankEscapeResistance??Math.round((bossModifier??c.ranks[i].rankEscapeResistance/100)*100)};}));
 if(row.key==='prestige.upgrades')row.value=JSON.stringify(JSON.parse(String(row.value)).map((u:any)=>{const {costs,multipliers,...rest}=u;return {...rest,multiplierBase:u.multiplierBase??1.1,baseCost:u.baseCost??costs?.[0]??5,costGrowth:u.costGrowth??2.65};}));
}
function add(o:object,prefix:string){for(const [key,v] of Object.entries(o)){const k=prefix+'.'+key;if(v&&typeof v==='object'&&!Array.isArray(v))add(v,k);else if(!rows.some(r=>r.key===k))rows.push({key:k,value:typeof v==='object'?JSON.stringify(v):v,description:'PROVISIONAL progression core / formal formula'});}}
add(c.boss,'boss');add(c.runUpgradeCurve,'runUpgradeCurve');add(c.lifeConversion,'lifeConversion');add(c.sleep,'sleep');
book.Sheets.Balance=XLSX.utils.json_to_sheet(rows);XLSX.writeFile(book,file);
