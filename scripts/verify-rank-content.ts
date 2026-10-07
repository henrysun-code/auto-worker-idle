import XLSX from 'xlsx';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
const read=(name:string)=>new Map(XLSX.utils.sheet_to_json<{key:string;value:unknown}>(XLSX.readFile(fileURLToPath(new URL(name,import.meta.url))).Sheets.Balance).map(r=>[r.key,r.value]));
const old=read('../config/archive/game_config-pre-rank-content.xlsx'),current=read('../config/game_config.xlsx');
assert.equal(current.size,old.size);
for(const [key,value]of old)if(!['work.templates','projects.templates'].includes(key))assert.deepEqual(current.get(key),value,key);
for(const key of ['work.templates','projects.templates']){
 const before=JSON.parse(String(old.get(key))) as {id:string}[],after=JSON.parse(String(current.get(key))) as ({id:string;rankWeights?:number[]})[];
 for(const template of before){const found=after.find(t=>t.id===template.id)!;assert.ok(found);const copy=structuredClone(found);delete copy.rankWeights;assert.deepEqual(copy,template,template.id);}
}
console.log('PASS：Excel 其他 136 列完全保持；8 個舊 Work 與 launch 原本內容／DAG完全保持，僅添加 rankWeights。');
