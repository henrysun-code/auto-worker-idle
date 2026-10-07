import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { gameConfig as c } from '../src/config/gameConfig';
import { initialState } from '../src/game/state/initialState';
import { createTodo, generateDailyWork } from '../src/game/work/todoManager';
import { maybeSpawnProject } from '../src/game/projects/projectManager';
import { catchChance, resolveBoss } from '../src/game/career/bossEvents';
import { effectiveWorkSpeed, effectiveWorkQuality, originalWorkReward } from '../src/game/work/workStats';
import { startWork } from '../src/game/targets/targetManager';
import { applyAction } from '../src/game/engine/actions';
import { advance, type SimulationOptions } from '../src/game/engine/SimulationLoop';
import { getDeadlineStatus } from '../src/game/work/deadline';
import { validateSave } from '../src/game/save/saveGame';
import type { State } from '../src/game/state/gameState';
import { getWorkTemplateWeight,getProjectTemplateWeight } from '../src/game/work/templateWeights';
import { buildRankReport } from './rankReport';

type Row=Record<string,string|number|boolean>;
const dir=fileURLToPath(new URL('../reports/rank-tests/',import.meta.url));
const seeds=Array.from({length:30},(_,i)=>42+7919*i), drawSeed=424242, draws=10000;
const configPath=new URL('../config/generated/game_config.json',import.meta.url), configHash=createHash('sha256').update(await readFile(configPath)).digest('hex');
const pools:Row[]=[],workDraws:Row[]=[],projectDraws:Row[]=[],probabilities:Row[]=[],multipliers:Row[]=[],ageRank:Row[]=[],stability:unknown[]=[],runtime:Row[]=[],runtimeContent:Row[]=[],checks:Row[]=[];
const check=(name:string,pass:boolean,details='')=>checks.push({name,pass,details});
function state(rank:number,seed=drawSeed){const s=initialState(seed,0);s.career.rank=rank;s.career.highestRank=rank;return s;}
function live(s:State){return [...new Map([...s.todoQueue,...(s.currentTarget?.type==='WORK'?[s.currentTarget.todo]:[]),...s.suspendedTargets.flatMap(x=>x.target.type==='WORK'?[x.target.todo]:[])].map(t=>[t.id,t])).values()];}
function within(actual:number,expected:number,n:number){return Math.abs(actual-expected)<=4*Math.sqrt(expected*(1-expected)/n)+1/n;}
for(let rank=0;rank<c.ranks.length;rank++){
 const s=state(rank),counts=new Map<string,number>();
 for(let i=0;i<draws;i++){
  generateDailyWork(s,1);const t=s.todoQueue.pop()!,template=c.work.templates.find(j=>j.id===t.sourceId)!;
  assert.ok(template.rank<=rank,`Forbidden work rank=${rank} template=${template.id}`);
  counts.set(template.id,(counts.get(template.id)??0)+1);
 }
 // Eligible pool is obtained from actual generateDailyWork outcomes, not just a config-name inference.
 const observed=c.work.templates.filter(t=>counts.has(t.id)),expected=c.work.templates.filter(t=>getWorkTemplateWeight(t,rank)>0);
 assert.deepEqual(observed.map(t=>t.id),expected.map(t=>t.id));
 const sum=observed.reduce((n,t)=>n+getWorkTemplateWeight(t,rank),0);
 for(const t of observed){
  pools.push({rank,rankName:c.ranks[rank].name,seed:drawSeed,workdays:0,templateId:t.id,name:t.name,templateRank:t.rank,weight:t.weight,effectiveWeight:getWorkTemplateWeight(t,rank),baseWorkload:t.workload,baseReward:t.reward,baseQualityRequirement:t.quality,configHash});
  const actual=counts.get(t.id)!/draws,expectedRate=getWorkTemplateWeight(t,rank)/sum,pass=within(actual,expectedRate,draws);
  workDraws.push({rank,rankName:c.ranks[rank].name,seed:drawSeed,workdays:0,draws,templateId:t.id,name:t.name,count:counts.get(t.id)!,expectedPercent:expectedRate*100,actualPercent:actual*100,differencePercentagePoints:(actual-expectedRate)*100,within4Sigma:pass,configHash});
  check(`Rank${rank} ${t.id} weight distribution`,pass);
 }
 check(`Rank${rank} forbidden templates 10000 draws`,true);
 const p=state(rank),projectCounts=new Map<string,number>();let spawned=0;
 for(let i=0;i<draws;i++){
  p.projects=[];p.todoQueue=[];p.notifications=[];p.eventLog=[];maybeSpawnProject(p);
  if(p.projects.length){spawned++;const t=c.projects.templates.find(t=>t.id===p.projects[0].templateId)!;
   assert.ok(t.enabled&&t.weight>0&&t.rankRequirement<=rank);projectCounts.set(t.id,(projectCounts.get(t.id)??0)+1);
  }
 }
 const selected=state(rank),selectionCounts=new Map<string,number>();let success=0,selectionRolls=0;
 while(success<draws){selected.projects=[];selected.todoQueue=[];selected.notifications=[];selected.eventLog=[];maybeSpawnProject(selected);selectionRolls++;if(selected.projects.length){const t=selected.projects[0];success++;selectionCounts.set(t.templateId,(selectionCounts.get(t.templateId)??0)+1);}}
 const projectWeightSum=c.projects.templates.reduce((n,t)=>n+getProjectTemplateWeight(t,rank),0);
 for(const t of c.projects.templates){const expectedPercent=getProjectTemplateWeight(t,rank)/projectWeightSum*100,actualPercent=(selectionCounts.get(t.id)??0)/draws*100;projectDraws.push({rank,rankName:c.ranks[rank].name,seed:drawSeed,workdays:0,successfulSelections:draws,selectionRolls,templateId:t.id,name:t.name,rankRequirement:t.rankRequirement,enabled:t.enabled,weight:t.weight,effectiveWeight:getProjectTemplateWeight(t,rank),eligible:getProjectTemplateWeight(t,rank)>0,count:selectionCounts.get(t.id)??0,expectedPercent,actualPercent,configHash});check(`Rank${rank} project ${t.id} weighted selection`,within(actualPercent/100,expectedPercent/100,draws));}
 const observedChance=spawned/draws;check(`Rank${rank} project spawn chance`,within(observedChance,c.ranks[rank].projectChance,draws));
 const b=state(rank);let caught=0;for(let i=0;i<draws;i++){b.todoQueue=[];b.notifications=[];b.eventLog=[];if(resolveBoss(b).caught)caught++;}
 const expectedCatch=c.boss.baseAttention;
 check(`Rank${rank} boss formula`,catchChance(b)===expectedCatch);check(`Rank${rank} boss 10000 rolls`,within(caught/draws,expectedCatch,draws));
 probabilities.push({rank,rankName:c.ranks[rank].name,seed:drawSeed,workdays:0,rolls:draws,configProjectChance:c.ranks[rank].projectChance,observedProjectChance:observedChance,projectSpawns:spawned,expectedCatchChance:expectedCatch,formulaCatchChance:catchChance(b),observedCatchChance:caught/draws,bossCaught:caught,configHash});
 const clean=state(rank),t=createTodo(clean,c.work.templates[0]);
 multipliers.push({rank,rankName:c.ranks[rank].name,baseWorkload:t.baseWorkload,finalWorkload:t.workload,baseReward:t.baseReward,finalReward:originalWorkReward(clean,t),baseQuality:c.work.templates[0].quality,finalQuality:t.qualityRequirement});
 assert.equal(t.workload,c.work.templates[0].workload*c.ranks[rank].workloadMultiplier);assert.equal(originalWorkReward(clean,t),Math.round(t.baseReward*c.ranks[rank].rewardMultiplier));assert.equal(t.qualityRequirement,c.work.templates[0].quality*c.ranks[rank].qualityMultiplier);
 check(`Rank${rank} workload/reward/quality applied once`,true);
 if(rank<4){
  const x=state(rank);x.player.money=1e6;const todo=createTodo(x,c.work.templates[0]);startWork(x,todo);if(x.currentTarget?.type==='WORK')x.currentTarget.progress=10;
  const before={...structuredClone(todo),progress:x.currentTarget?.type==='WORK'?x.currentTarget.progress:0,finalReward:originalWorkReward(x,todo)};
  assert.ok(applyAction(x,{type:'promote'}));const after={...structuredClone(todo),progress:x.currentTarget?.type==='WORK'?x.currentTarget.progress:0,finalReward:originalWorkReward(x,todo)};
  assert.deepEqual(todo,Object.fromEntries(Object.entries(before).filter(([k])=>!['progress','finalReward'].includes(k))));
  assert.equal(before.progress,after.progress);check(`Rank${rank} promotion preserves todo fields/progress`,true);
  check(`Rank${rank} existing reward updates to current rank`,after.finalReward===Math.round(todo.baseReward*c.ranks[rank+1].rewardMultiplier),`${before.finalReward} -> ${after.finalReward}`);
  const post=state(rank+1);post.world.rng=x.world.rng;generateDailyWork(x,100);generateDailyWork(post,100);assert.deepEqual(x.todoQueue.map(t=>t.sourceId),post.todoQueue.map(t=>t.sourceId));
  check(`Rank${rank} new work uses promoted pool`,true);stability.push({fromRank:rank,toRank:rank+1,before,after});
 }
 console.log(`Rank${rank} 完成：Work 10000、Project 10000、Boss 10000 抽樣`);
}
for(const rank of [0,4])for(const age of [22,60]){const s=state(rank);s.player.age=age;s.player.ageProgressDays=(age-c.age.start)*c.age.daysPerYear;const t=createTodo(s,c.work.templates[0]);assert.equal(t.workload,t.baseWorkload*t.rankWorkloadMultiplierAtCreation*t.ageWorkloadMultiplierAtCreation);ageRank.push({rank,age,baseWorkload:t.baseWorkload,rankMultiplier:t.rankWorkloadMultiplierAtCreation,ageMultiplier:t.ageWorkloadMultiplierAtCreation,finalWorkload:t.workload});}
check('Age x Rank no duplicate workload multiplication',true);
for(let rank=0;rank<5;rank++){
 const rankConfig=c.ranks[rank];
 const eff=Math.max(0,Math.round((rankConfig.recommendedSpeed-c.economy.baseWorkSpeed)/c.upgrades.efficiency.increment));
 const quality=Math.max(0,Math.round((rankConfig.recommendedQuality-c.economy.baseQuality)/c.upgrades.quality.increment));
 for(const seed of seeds){
  const s=state(rank,seed);s.player.upgrades.efficiency=eff;s.player.upgrades.quality=quality;
  const startSpeed=effectiveWorkSpeed(s),startQuality=effectiveWorkQuality(s);
  let generated=0,workload=0,processed=0,loss=0,last=0,prev=[0,0,0],integral=[0,0,0],peak=[0,0,0];
  const seen=new Set<string>(),followSeen=new Set<string>(),projectsSeen=new Set<string>(),content=new Map<string,number>();
  const increment=(category:string,id:string)=>{const key=category+'|'+id;content.set(key,(content.get(key)??0)+1);};
  const observer:SimulationOptions={onWorkProgress:n=>processed+=n,onWorkCompleted:(_t,_overdue,n)=>loss+=n,onBoundary:x=>{
   const dt=x.world.totalWorldTime-last;integral=integral.map((n,i)=>n+prev[i]*dt);last=x.world.totalWorldTime;const ts=live(x);
   for(const t of ts)if(!seen.has(t.id)){seen.add(t.id);generated++;workload+=t.workload;if(t.sourceType==='NORMAL')increment('NORMAL',t.sourceId);else if(t.sourceType==='BOSS')increment('BOSS','boss');else if(t.sourceType==='PROJECT')increment('PROJECT_SUBTASK',t.subtaskId??'unknown');else if(t.sourceType==='EVENT')increment('EVENT',t.sourceId);}
   // Count follow-up creation once, including pending items before their release.
   for(const t of [...ts,...x.pendingFollowUps.flatMap(p=>p.tasksToCreate)])if(t.followUpType&&!followSeen.has(t.id)){followSeen.add(t.id);increment('FOLLOW_UP',t.followUpType);}
   for(const p of x.projects)if(!projectsSeen.has(p.id)){projectsSeen.add(p.id);increment('PROJECT',p.templateId);}
   prev=[ts.length,ts.filter(t=>getDeadlineStatus(t,x)==='DUE_TODAY').length,ts.filter(t=>getDeadlineStatus(t,x)==='OVERDUE').length];peak=peak.map((n,i)=>Math.max(n,prev[i]));
  }};
  const end=30*c.time.dayDuration+c.time.workStartAnchor*c.time.dayDuration/c.time.referenceDayDuration;advance(s,end,observer);
  assert.ok(validateSave(s));assert.equal(s.career.rank,rank);assert.ok(Object.values(s.products).every(p=>!p.active));assert.ok(processed<=workload+1e-6);
  runtime.push({rank,rankName:rankConfig.name,seed,workdays:30,recommendedSpeed:rankConfig.recommendedSpeed,actualStartingSpeed:startSpeed,efficiencyLevel:eff,recommendedQuality:rankConfig.recommendedQuality,actualStartingQuality:startQuality,qualityLevel:quality,endAge:s.player.age,generatedWorkCount:generated,projectSpawnCount:projectsSeen.size,followUpCount:followSeen.size,averageTodo:integral[0]/end,peakTodo:peak[0],averageDueToday:integral[1]/end,averageOverdue:integral[2]/end,peakOverdue:peak[2],generatedWorkload:workload,processedWorkload:processed,processedGeneratedRatio:processed/workload,grossIncome:s.runStatistics.earned,overdueRevenueLoss:loss,completedWorkCount:s.runStatistics.completedWork,configHash});
  const totals=new Map<string,number>();for(const [key,count]of content){const category=key.split('|')[0];totals.set(category,(totals.get(category)??0)+count);}
  for(const category of ['NORMAL','PROJECT','FOLLOW_UP']){
   const ids=category==='NORMAL'?c.work.templates.map(t=>t.id):category==='PROJECT'?c.projects.templates.map(t=>t.id):c.followUps.types.map(t=>t.type);
   for(const id of ids){const count=content.get(category+'|'+id)??0;runtimeContent.push({rank,rankName:rankConfig.name,seed,workdays:30,category,templateOrType:id,count,percentage:totals.get(category)?count/totals.get(category)!*100:0,configHash});}
  }
 }
 check(`Rank${rank} 30 seeds x 30 workdays valid/no products/no promotion`,true);console.log(`Rank${rank} 完成 30 seeds × 30 工作日`);
}
assert.equal(createHash('sha256').update(await readFile(configPath)).digest('hex'),configHash);check('Formal config unchanged',true);
const groups:Row[]=[];
for(let rank=0;rank<5;rank++){
 const normal=runtimeContent.filter(r=>r.rank===rank&&r.category==='NORMAL'),total=normal.reduce((n,r)=>n+Number(r.count),0);
 for(let group=0;group<=rank;group++){
  const ids=c.work.templates.filter(t=>t.rank===group).map(t=>t.id),drawGroup=workDraws.filter(r=>r.rank===rank&&ids.includes(String(r.templateId)));
  groups.push({rank,templateRankGroup:group,seed:drawSeed,workdays:30,expectedPercent:drawGroup.reduce((n,r)=>n+Number(r.expectedPercent),0),actualDrawPercent:drawGroup.reduce((n,r)=>n+Number(r.actualPercent),0),runtimeCount:normal.filter(r=>ids.includes(String(r.templateOrType))).reduce((n,r)=>n+Number(r.count),0),runtimePercent:normal.filter(r=>ids.includes(String(r.templateOrType))).reduce((n,r)=>n+Number(r.count),0)/total*100,configHash});
 }
 const own=groups.find(g=>g.rank===rank&&g.templateRankGroup===rank)!;
 check(`Rank${rank} own group is largest in Normal draws`,groups.filter(g=>g.rank===rank).every(g=>Number(g.actualDrawPercent)<=Number(own.actualDrawPercent)));
 check(`Rank${rank} own group is largest in Runtime Normal content`,groups.filter(g=>g.rank===rank).every(g=>Number(g.runtimePercent)<=Number(own.runtimePercent)));
 const expectedProject=c.projects.templates.find(t=>t.rankRequirement===rank)!;
 const runtimeProjects=runtimeContent.filter(r=>r.rank===rank&&r.category==='PROJECT');
 const count=(id:string)=>runtimeProjects.filter(r=>r.templateOrType===id).reduce((n,r)=>n+Number(r.count),0);
 check(`Rank${rank} own Project is main Runtime Project`,c.projects.templates.every(t=>count(t.id)<=count(expectedProject.id)));
}
check('Rank4 low Rank0+1 Normal content below 10%',groups.filter(g=>g.rank===4&&Number(g.templateRankGroup)<=1).reduce((n,g)=>n+Number(g.runtimePercent),0)<10);
await mkdir(dir,{recursive:true});
async function csv(name:string,rows:Row[]){const keys=Object.keys(rows[0]);await writeFile(`${dir}/${name}.csv`,'\uFEFF'+keys.join(',')+'\n'+rows.map(r=>keys.map(k=>r[k]).join(',')).join('\n')+'\n');}
await csv('rank-work-pool',pools);await csv('rank-work-distribution',workDraws);await csv('rank-project-distribution',projectDraws);await csv('rank-runtime-summary',runtime);await csv('rank-runtime-content',runtimeContent);await csv('rank-probability-checks',probabilities);await csv('rank-assertions',checks);
await csv('rank-work-group-share',groups);
const report=buildRankReport({c,pools,workDraws,projectDraws,probabilities,multipliers,ageRank,stability,runtime,runtimeContent,checks,configHash,seeds,drawSeed});
await writeFile(`${dir}/RANK_TEST_REPORT.md`,report);
await writeFile(`${dir}/rank-results.json`,JSON.stringify({configSnapshot:c,configHash,seeds,drawSeed,draws,workdays:30,pools,workDraws,projectDraws,probabilities,multipliers,ageRank,stability,runtime,runtimeContent,groups,checks},null,2));
console.log(`報告完成：${checks.filter(c=>c.pass).length} pass，${checks.filter(c=>!c.pass).length} unmet requirements`);
