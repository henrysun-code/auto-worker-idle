// Decode the observer's colliding snapshot labels using the official API only.
// This is report interpretation, never an action on a canonical run state.
import {readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import assert from 'node:assert/strict';
import {initialState} from '../src/game/state/initialState';
import {getPromotionQualificationStats} from '../src/game/career/promotionAssignment';
const root=fileURLToPath(new URL('../reports/career-v3-full/',import.meta.url));
const cycles=[] as any[];for(const dir of readdirSync(root,{withFileTypes:true}).filter(x=>x.isDirectory()&&x.name.startsWith('canonical-part-'))){const path=join(root,dir.name,'cycles.jsonl');cycles.push(...readFileSync(path,'utf8').trim().split('\n').map(x=>JSON.parse(x)));}
const seen=new Map<string,any>();for(const row of cycles){const key=`${row.permanentLevels.workEfficiency}:${row.permanentLevels.workQuality}`;const old=seen.get(key);seen.set(key,{levels:row.permanentLevels,max:Math.max(row.efficiency,row.quality,old?.max??0)});}
const lookup:Record<string,any>={};for(const [key,{levels,max}]of seen){const state=initialState(42,0);state.prestige.levels={...levels};const E=[],Q=[];assert.ok(max<100000);for(let level=0;level<=Math.ceil(max);level++){state.player.upgrades.efficiency=level;state.player.upgrades.quality=level;const stats=getPromotionQualificationStats(state);E.push([stats.efficiency,level]);Q.push([stats.quality,level]);}lookup[key]={E,Q};}
writeFileSync(join(root,'snapshot-level-lookup.json'),JSON.stringify({method:'Exact inverse lookup of official getPromotionQualificationStats on disposable report fixtures; no gameplay formula reimplementation or canonical state mutation',lookup},null,2));console.log(`Snapshot lookup verified for ${seen.size} permanent level pairs`);
