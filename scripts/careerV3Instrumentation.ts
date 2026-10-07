import {readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import {instrument} from './balanceInstrumentation';
import type {State,Target} from '../src/game/types';
export type Observer=(kind:string,s:State,data?:any)=>void;
export function setV3Observer(observer?:Observer){(globalThis as any).__careerV3=observer;}
export async function instrumentV3(){
 const base=await instrument();
 async function edit(path:string,from:string,to:string){const p=join(base.dir,path),text=await readFile(p,'utf8');assert.equal(text.split(from).length,2,`V3 observer anchor ${path}`);await writeFile(p,text.replace(from,to));}
 const hook=(kind:string,data='undefined')=>`(globalThis as any).__careerV3?.('${kind}',s,${data});`;
 await edit('src/game/career/promotionAssignment.ts',"p.status='SCHEDULED';p.scheduledWorkday=day;p.fromRank=s.career.rank;p.toRank=s.career.rank+1;p.failureReason=null;", "p.status='SCHEDULED';p.scheduledWorkday=day;p.fromRank=s.career.rank;p.toRank=s.career.rank+1;p.failureReason=null;"+hook('scheduled'));
 await edit('src/game/career/promotionAssignment.ts',"p.pending=true;s.needs.bossChecked=true;","p.pending=true;s.needs.bossChecked=true;"+hook('evening'));
 await edit('src/game/career/promotionAssignment.ts',"s.currentTarget=target;s.needs.phase='AFTERNOON';","s.currentTarget=target;s.needs.phase='AFTERNOON';"+hook('promotionStart','target'));
 await edit('src/game/career/promotionAssignment.ts',"const p=s.promotion;p.status=requirement?'FAILED_REQUIREMENT':'COOLDOWN';",hook('promotionFail','{reason,requirement}')+"const p=s.promotion;p.status=requirement?'FAILED_REQUIREMENT':'COOLDOWN';");
 await edit('src/game/career/promotionAssignment.ts',"const rank=c.ranks[t.toRank]; if(!promoteTransaction(s))",hook('promotionFinishBefore','t')+"const rank=c.ranks[t.toRank]; if(!promoteTransaction(s))");
 await edit('src/game/career/promotionAssignment.ts',"s.promotion.status=t.toRank===c.ranks.length-1?'MAX_RANK':'NOT_ELIGIBLE';","s.promotion.status=t.toRank===c.ranks.length-1?'MAX_RANK':'NOT_ELIGIBLE';"+hook('promotionSuccess','t'));
 await edit('src/game/targets/sleepWindow.ts',"w.settled=true;w.lastRatio=sleepRatio(s);","w.settled=true;w.lastRatio=sleepRatio(s);"+hook('sleep','{...w}'));
 await edit('src/game/targets/targetManager.ts',"s.needs.lunchSettled = true; const ratio",hook('lunch','{output:s.needs.lunchRest}')+"s.needs.lunchSettled = true; const ratio");
 await edit('src/game/targets/targetManager.ts',"if (!done) return false; s.currentTarget = null;","if (!done) return false;"+hook('targetComplete','t')+" s.currentTarget = null;");
 // Unique URL forces a fresh dependency graph after adding read-only hooks.
 const loop=await import(pathToFileURL(join(base.dir,'src/game/engine/SimulationLoop.ts')).href+'?careerV3') as typeof import('../src/game/engine/SimulationLoop');
 // The earlier graph was already loaded; its dependencies need hooks before import.
 // A fresh copied entry directory is handled by instrument() only for the first graph;
 // load edited modules through a new physical copy to avoid the ESM module cache.
 const {cp,mkdtemp}=await import('node:fs/promises');const {tmpdir}=await import('node:os');
 const fresh=await mkdtemp(join(tmpdir(),'auto-worker-career-v3-'));await cp(base.dir,fresh,{recursive:true});
 const loaded=await import(pathToFileURL(join(fresh,'src/game/engine/SimulationLoop.ts')).href) as typeof loop;
 return {advance:loaded.advance,dir:fresh};
}
