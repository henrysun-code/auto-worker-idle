import { cp,mkdtemp,mkdir,readFile,writeFile,readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join,relative } from 'node:path';
import { pathToFileURL,fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import type { State } from '../src/game/state/gameState';
export interface Hooks {projectAttempt:()=>void;projectPassed:(blocked:boolean)=>void;boss:(caught:boolean,escaped:boolean,severity?:number)=>void}
const host=globalThis as unknown as {__rankBalance?:Hooks};
export function setBalanceHooks(hooks?:Hooks){host.__rankBalance=hooks;}
export async function sourceHash(){const root=fileURLToPath(new URL('../src/',import.meta.url));const hash=createHash('sha256');async function visit(dir:string){for(const entry of (await readdir(dir,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))){const p=join(dir,entry.name);if(entry.isDirectory())await visit(p);else{hash.update(relative(root,p));hash.update(await readFile(p));}}}await visit(root);hash.update(await readFile(new URL('../config/generated/game_config.json',import.meta.url)));hash.update(await readFile(new URL('../config/game_config.xlsx',import.meta.url)));return hash.digest('hex');}
export async function instrument(){
 const dir=await mkdtemp(join(tmpdir(),'auto-worker-balance-'));
 await cp(fileURLToPath(new URL('../src/',import.meta.url)),join(dir,'src'),{recursive:true});await mkdir(join(dir,'config/generated'),{recursive:true});await writeFile(join(dir,'config/generated/game_config.json'),JSON.stringify((await import('../src/config/gameConfig')).gameConfig));await writeFile(join(dir,'package.json'),JSON.stringify({type:'module'}));
 const edit=async(path:string,from:string,to:string)=>{const file=join(dir,path),text=await readFile(file,'utf8');assert.equal(text.split(from).length,2,`instrumentation anchor ${path}`);await writeFile(file,text.replace(from,to));};
 await edit('src/game/projects/projectManager.ts','if (random(s) >= c.ranks[s.career.rank].projectChance) return;','(globalThis as any).__rankBalance?.projectAttempt();\n if (random(s) >= c.ranks[s.career.rank].projectChance) return;');
 await edit('src/game/projects/projectManager.ts','createProject(s, template.id);','(globalThis as any).__rankBalance?.projectPassed(s.projects.filter(p=>p.status===\'ACTIVE\').length >= c.projects.maximumActive);\n createProject(s, template.id);');
 await edit('src/game/career/bossEvents.ts','if(!severity){','if(!severity){ (globalThis as any).__rankBalance?.boss(false,false);');
 await edit('src/game/career/bossEvents.ts',"if(escaped)notify",'(globalThis as any).__rankBalance?.boss(true,escaped,severity);\n  if(escaped)notify');
 const load=(path:string)=>import(pathToFileURL(join(dir,path)).href);
 const loop=await load('src/game/engine/SimulationLoop.ts') as typeof import('../src/game/engine/SimulationLoop');
 const reward=await load('src/game/work/workStats.ts') as typeof import('../src/game/work/workStats');
 const original=await import('../src/game/engine/SimulationLoop');const {initialState}=await import('../src/game/state/initialState');
 let observed=0;setBalanceHooks({projectAttempt:()=>observed++,projectPassed:()=>observed++,boss:()=>observed++});
 for(const rank of [0,4]){const a:State=initialState(42,0);a.career.rank=rank;a.player.upgrades.efficiency=rank===4?14:0;a.player.upgrades.quality=rank===4?15:0;const b=structuredClone(a);original.advance(a,1808);loop.advance(b,1808);assert.deepEqual(b,a,'temporary observer changes production state/RNG');}
 setBalanceHooks();assert.ok(observed>0);
 return {advance:loop.advance,reward,dir};
}

