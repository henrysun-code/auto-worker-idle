import './legacyBalanceFixture';
import test from 'node:test';
import assert from 'node:assert/strict';
import { gameConfig as c } from '../src/config/gameConfig';
import { initialState } from '../src/game/state/initialState';
import { getWorkTemplateWeight as workWeight,getProjectTemplateWeight as projectWeight,validRankWeights } from '../src/game/work/templateWeights';
import { createTodo,generateDailyWork } from '../src/game/work/todoManager';
import { createProject,maybeSpawnProject,completeProjectSubtask } from '../src/game/projects/projectManager';
import { startWork } from '../src/game/targets/targetManager';
import { applyAction } from '../src/game/engine/actions';
import { originalWorkReward } from '../src/game/work/workStats';
import { newWorkTemplates } from '../src/config/rankContent';
function state(rank=0,age=22){const s=initialState(42,0);s.career.rank=rank;s.player.age=age;s.player.ageProgressDays=(age-c.age.start)*c.age.daysPerYear;return s;}
test('rankWeights absent falls back to legacy Work weight',()=>assert.equal(workWeight({rank:0,weight:4},4),4));
test('legacy Project weight fallback preserves enabled and minimum rank',()=>{assert.equal(projectWeight({enabled:true,rankRequirement:0,weight:3},4),3);assert.equal(projectWeight({enabled:false,rankRequirement:0,weight:3},4),0);});
test('zero rankWeight does not use legacy weight',()=>assert.equal(workWeight({rank:0,weight:4,rankWeights:[4,3,2,1,0]},4),0));
test('invalid rankWeights reject length negative NaN Infinity and unreachable',()=>{for(const weights of [[1],[1,-1,1,1,1],[1,NaN,1,1,1],[1,Infinity,1,1,1],[1,0,0,0,0]])assert.equal(validRankWeights({weight:1,rankWeights:weights},1,5),false);assert.equal(validRankWeights({weight:1},0,5),true);});
test('zero effective Weight is excluded by actual normal generator',()=>{const original=c.work.templates[0].rankWeights;try{c.work.templates[0].rankWeights=[0,0,0,0,1];const s=state();generateDailyWork(s,1000);assert.ok(s.todoQueue.every(t=>t.sourceId!=='email'));}finally{c.work.templates[0].rankWeights=original;}});
for(let rank=0;rank<5;rank++)test(`Rank${rank} 10000 work draws obey pool and effective weights`,()=>{
 const s=state(rank),counts=new Map<string,number>();generateDailyWork(s,10000);
 for(const t of s.todoQueue){const template=c.work.templates.find(x=>x.id===t.sourceId)!;assert.ok(template.rank<=rank&&workWeight(template,rank)>0);counts.set(template.id,(counts.get(template.id)??0)+1);}
 const eligible=c.work.templates.filter(t=>workWeight(t,rank)>0),sum=eligible.reduce((n,t)=>n+workWeight(t,rank),0);
 assert.ok(eligible.some(t=>t.rank===rank));for(const t of eligible){assert.ok(counts.get(t.id));assert.ok(Math.abs(counts.get(t.id)!/10000-workWeight(t,rank)/sum)<.025);}
 if(rank===4)assert.ok(counts.get('email')!<100);
});
for(const template of newWorkTemplates){
 test(`${template.id} Rank workload applies once`,()=>{const s=state(template.rank),t=createTodo(s,template);assert.equal(t.workload,template.workload*c.ranks[template.rank].workloadMultiplier);});
 test(`${template.id} Age workload applies once`,()=>{const s=state(template.rank,60),t=createTodo(s,template);assert.equal(t.workload,template.workload*c.ranks[template.rank].workloadMultiplier*1.7);});
 test(`${template.id} Quality multiplier applies once`,()=>{const s=state(template.rank),t=createTodo(s,template);assert.equal(t.qualityRequirement,template.quality*c.ranks[template.rank].qualityMultiplier);});
}
for(let rank=0;rank<5;rank++)test(`Rank${rank} project pool uses rankWeights`,()=>{const s=state(rank),counts=new Map<string,number>();for(let i=0;i<10000;i++){s.projects=[];s.todoQueue=[];s.notifications=[];s.eventLog=[];maybeSpawnProject(s);for(const p of s.projects){assert.ok(projectWeight(c.projects.templates.find(t=>t.id===p.templateId)!,rank)>0);counts.set(p.templateId,(counts.get(p.templateId)??0)+1);}}const eligible=c.projects.templates.filter(t=>projectWeight(t,rank)>0);for(const t of eligible)assert.ok(counts.get(t.id));if(rank===0)assert.equal(counts.has('annual_strategy'),false);if(rank===4){assert.ok(counts.has('launch'));assert.ok(counts.get('annual_strategy')!>counts.get('process_improvement')!);}});
for(const template of c.projects.templates)test(`${template.id} DAG unlock only after all dependencies`,()=>{
 const s=state(template.rankRequirement),p=createProject(s,template.id)!;const seen=new Set<string>();
 while(p.completedSubtasks<template.subtasks.length){
  for(const sub of p.subtasks)if(sub.status==='QUEUED')assert.ok(sub.dependencies.every(id=>p.subtasks.find(x=>x.id===id)?.status==='DONE'));
  const t=s.todoQueue.shift();assert.ok(t);assert.ok(!seen.has(t.subtaskId!));seen.add(t.subtaskId!);completeProjectSubtask(s,t);
  for(const sub of p.subtasks)if(sub.dependencies.some(id=>p.subtasks.find(x=>x.id===id)?.status!=='DONE'))assert.equal(sub.status,'LOCKED');
 }
 assert.equal(p.status,'DELIVERED');assert.equal(seen.size,template.subtasks.length);
});
for(let rank=0;rank<4;rank++)test(`Rank${rank} promotion preserves old Todo Project and uses dynamic reward/new pools`,()=>{
 const s=state(rank);s.player.money=1e6;const p=createProject(s,'launch')!,t=s.todoQueue.shift()!;startWork(s,t);if(s.currentTarget?.type==='WORK')s.currentTarget.progress=10;
 const beforeTodo=structuredClone(t),beforeProject=structuredClone(p),reward=originalWorkReward(s,t);assert.ok(applyAction(s,{type:'promote'}));assert.deepEqual(t,beforeTodo);assert.deepEqual(p,beforeProject);assert.equal(s.currentTarget?.type==='WORK'?s.currentTarget.progress:0,10);assert.equal(originalWorkReward(s,t),Math.round(t.baseReward*c.ranks[rank+1].rewardMultiplier));assert.ok(originalWorkReward(s,t)>reward);
 generateDailyWork(s,1000);assert.ok(s.todoQueue.some(t=>c.work.templates.find(x=>x.id===t.sourceId)?.rank===rank+1));
 const seen=new Set<string>();for(let i=0;i<500;i++){s.projects=[];s.todoQueue=[];maybeSpawnProject(s);for(const next of s.projects)seen.add(next.templateId);}assert.ok(seen.has(c.projects.templates.find(t=>t.rankRequirement===rank+1)!.id));
});
