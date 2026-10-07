import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {renderToStaticMarkup} from 'react-dom/server';
import {createElement} from 'react';
import * as React from 'react';
import {gameConfig as c} from '../src/config/gameConfig';
import {initialState} from '../src/game/state/initialState';
import {advance} from '../src/game/engine/SimulationLoop';
import {applyAction} from '../src/game/engine/actions';
import {toggleProduct} from '../src/game/products/productManager';
import {processBilling} from '../src/game/products/billingManager';
import {createTodo} from '../src/game/work/todoManager';
import {startWork,startFood,selectedFood} from '../src/game/targets/targetManager';
import {effectiveWorkSpeed,effectiveWorkQuality,workReward} from '../src/game/work/workStats';
import {catchChance,escapeChance,resolveBoss} from '../src/game/career/bossEvents';
import {triggerEvent} from '../src/game/events/eventManager';
import {syncWorld} from '../src/game/time/worldTime';
import {saveGame,loadGame} from '../src/game/save/saveGame';
import {prestigeReset} from '../src/game/prestige/prestigeManager';
import {settleOfflineMinutes} from '../src/game/time/offlineSimulation';
import {Products} from '../src/screens/Products';
import {gameConfig as bc} from '../reports/product-framework-v1/baseline-runtime/src/config/gameConfig';
import {initialState as bi} from '../reports/product-framework-v1/baseline-runtime/src/game/state/initialState';
import {advance as ba} from '../reports/product-framework-v1/baseline-runtime/src/game/engine/SimulationLoop';
import {applyAction as bAction} from '../reports/product-framework-v1/baseline-runtime/src/game/engine/actions';
import {toggleProduct as bt} from '../reports/product-framework-v1/baseline-runtime/src/game/products/productManager';
import {processBilling as bb} from '../reports/product-framework-v1/baseline-runtime/src/game/products/billingManager';
import {createTodo as bTodo} from '../reports/product-framework-v1/baseline-runtime/src/game/work/todoManager';
import {startWork as bWork,startFood as bFood,selectedFood as bSelected} from '../reports/product-framework-v1/baseline-runtime/src/game/targets/targetManager';
import {effectiveWorkSpeed as bSpeed,effectiveWorkQuality as bQuality,workReward as bReward} from '../reports/product-framework-v1/baseline-runtime/src/game/work/workStats';
import {catchChance as bCatch,escapeChance as bEscape,resolveBoss as bBoss} from '../reports/product-framework-v1/baseline-runtime/src/game/career/bossEvents';
import {triggerEvent as bEvent} from '../reports/product-framework-v1/baseline-runtime/src/game/events/eventManager';
import {syncWorld as bSync} from '../reports/product-framework-v1/baseline-runtime/src/game/time/worldTime';
import {saveGame as bSave,loadGame as bLoad} from '../reports/product-framework-v1/baseline-runtime/src/game/save/saveGame';
import {prestigeReset as bPrestige} from '../reports/product-framework-v1/baseline-runtime/src/game/prestige/prestigeManager';
import {settleOfflineMinutes as bOffline} from '../reports/product-framework-v1/baseline-runtime/src/game/time/offlineSimulation';
import {Products as bProducts} from '../reports/product-framework-v1/baseline-runtime/src/screens/Products';
const oldApi={c:bc,initialState:bi,advance:ba,applyAction:bAction,toggleProduct:bt,processBilling:bb,createTodo:bTodo,startWork:bWork,startFood:bFood,selectedFood:bSelected,effectiveWorkSpeed:bSpeed,effectiveWorkQuality:bQuality,workReward:bReward,catchChance:bCatch,escapeChance:bEscape,resolveBoss:bBoss,triggerEvent:bEvent,syncWorld:bSync,saveGame:bSave,loadGame:bLoad,prestigeReset:bPrestige,settleOfflineMinutes:bOffline,Products:bProducts};
const newApi={c,initialState,advance,applyAction,toggleProduct,processBilling,createTodo,startWork,startFood,selectedFood,effectiveWorkSpeed,effectiveWorkQuality,workReward,catchChance,escapeChance,resolveBoss,triggerEvent,syncWorld,saveGame,loadGame,prestigeReset,settleOfflineMinutes,Products};
const scenarios=['ACTIVATE','WORK','REWARD','FOOD','SLEEP','ONLINE_AGE','PROBLEM','DISABLE','REENABLE','BILLING','EXPIRY_FAILURE','SAVE_RELOAD','SAVE_OFFLINE','OFFLINE_BILLING','PRESTIGE','BOSS','UI'] as const;
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),out=path.join(root,'reports/product-framework-v1');
function memory(){const values=new Map<string,string>();return {getItem:(key:string)=>values.get(key)??null,setItem:(key:string,value:string)=>{values.set(key,value);},removeItem:(key:string)=>{values.delete(key);}};}
function fixture(api:any,id:string,scenario:string){
 let s=api.initialState(42,0);s.world.totalWorldTime=10;api.syncWorld(s);s.world.nextEventAt=1e9;s.needs.phase='MORNING';s.needs.breakfastAnchorEligible=false;s.needs.projectRollProcessedRoutineId=0;s.needs.satietyUntil=1e9;s.meetings.lastScheduledWorkday=0;s.promotion.lastCheckedWorkday=0;
 s.player.money=1e6;s.player.age=50;s.player.ageProgressDays=28*api.c.age.daysPerYear;
 assert.equal(api.applyAction(s,{type:'product',id}),true);
 const todo=api.createTodo(s,{...api.c.work.templates[0],workload:1e6,tags:['簡報']});api.startWork(s,todo);
 let extra:any={};
 switch(scenario){
  case 'ACTIVATE':break;
  case 'WORK':api.advance(s,5);break;
  case 'REWARD':extra.rewards=['NORMAL','FOLLOW_UP','PROJECT','BOSS'].map(sourceType=>api.workReward(s,{...todo,sourceType,baseReward:100}));break;
  case 'FOOD':s.currentTarget=null;s.needs.bossChecked=true;s.player.settings.defaultFoodId='quick';api.startFood(s,'DINNER');api.advance(s,3);break;
  case 'SLEEP':s.currentTarget=null;s.world.totalWorldTime=50;api.syncWorld(s);s.needs.phase='SLEEP';api.advance(s,18);break;
  case 'ONLINE_AGE':api.advance(s,120);break;
  case 'PROBLEM':{const def=api.c.products.definitions.find((p:any)=>p.id===id),tag=def.effectType==='PROBLEM_RESOLVER'?def.tags[0]:'wound',event=api.c.events.definitions.find((e:any)=>e.tag===tag);api.triggerEvent(s,event.id,true);api.advance(s,5);break;}
  case 'DISABLE':api.advance(s,2);api.applyAction(s,{type:'product',id});api.advance(s,2);break;
  case 'REENABLE':api.applyAction(s,{type:'product',id});api.applyAction(s,{type:'product',id});break;
  case 'BILLING':s.world.totalWorldTime=s.products[id].nextBillingWorldTime;api.syncWorld(s);api.processBilling(s);break;
  case 'EXPIRY_FAILURE':s.products[id].nextBillingWorldTime=12;s.player.money=0;api.advance(s,3);break;
  case 'SAVE_RELOAD':{api.advance(s,2);const store=memory();api.saveGame(s,store,0);const result=api.loadGame(store,0);assert.equal(result.error,null);s=result.state;break;}
  case 'SAVE_OFFLINE':{const store=memory();api.saveGame(s,store,0);const result=api.loadGame(store,1800000);assert.equal(result.error,null);s=result.state;break;}
  case 'OFFLINE_BILLING':api.settleOfflineMinutes(s,api.c.offline.minutesPerGameDay*31);break;
  case 'PRESTIGE':api.prestigeReset(s,true);break;
  case 'BOSS':s.player.upgrades.flattery=115;api.resolveBoss(s,true,false);break;
  case 'UI':extra.html=renderToStaticMarkup(createElement(api.Products,{s,dispatch:()=>false}));break;
 }
 return {state:s,outputs:{speed:api.effectiveWorkSpeed(s),quality:api.effectiveWorkQuality(s),catchChance:api.catchChance(s),escapeChance:api.escapeChance(s),selectedFood:api.selectedFood(s),...extra}};
}
export function runProductFrameworkRegression(){
 assert.deepEqual(c,bc,'Formal Config changed');
 const manifest=JSON.parse(fs.readFileSync(path.join(out,'product-baseline-manifest.json'),'utf8'));
 for(const [name,hash]of Object.entries(manifest))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(out,'baseline-runtime',name))).digest('hex'),hash,`Baseline changed: ${name}`);
 const realNow=Date.now;Date.now=()=>0;const previousReact=(globalThis as any).React;(globalThis as any).React=React;
 const rows:any[]=[],logs:string[]=[];
 try {
 for(const p of c.products.definitions)for(const scenario of scenarios){const before=fixture(oldApi,p.id,scenario),after=fixture(newApi,p.id,scenario);assert.deepEqual(after,before,`${p.id}/${scenario} exact regression`);logs.push(`PASS ${p.id}/${scenario}: full State + outputs exact equal`);rows.push({productId:p.id,scenario,exactEqual:true,money:after.state.player.money,worldTime:after.state.world.totalWorldTime,active:after.state.products[p.id]?.active,resultHash:crypto.createHash('sha256').update(JSON.stringify(after)).digest('hex')});}
 fs.writeFileSync(path.join(out,'product-framework-regression.log'),logs.join('\n')+`\n${rows.length}/${rows.length} exact behavior fixtures PASS\n`);
 fs.writeFileSync(path.join(out,'product-framework-exact-results.json'),JSON.stringify({products:c.products.definitions.length,scenariosPerProduct:scenarios.length,fixtures:rows.length,fullStateExactEqual:true,uiStaticMarkupExactEqual:true,baselineManifestVerified:true,rows},null,2));
 return {fixtures:rows.length,scenariosPerProduct:scenarios.length};
 } finally {Date.now=realNow;if(previousReact===undefined)delete (globalThis as any).React;else (globalThis as any).React=previousReact;}
}
