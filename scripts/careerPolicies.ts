import {gameConfig as c} from '../src/config/gameConfig';
import type {State,UpgradeId,PermanentId} from '../src/game/types';
import {applyAction} from '../src/game/engine/actions';
import {canPromote} from '../src/game/career/promotion';
import {rawWorkSpeed,rawWorkQuality,upgradeCost} from '../src/game/work/workStats';
import {getPrestigeUpgradeCost} from '../src/game/prestige/permanentUpgrades';
export const policies=['PROMOTE_ASAP_BALANCED','PREPARED_BALANCED','EFFICIENCY_FIRST','QUALITY_FIRST','ALL_ROUNDER'] as const;
export type Policy=typeof policies[number];
const order:UpgradeId[]=['efficiency','quality','lifeManagement','slacking','flattery'];
export const recommendationReady=(s:State)=>!c.ranks[s.career.rank+1]||(rawWorkSpeed(s)>=c.ranks[s.career.rank+1].recommendedSpeed&&rawWorkQuality(s)>=c.ranks[s.career.rank+1].recommendedQuality);
export function chooseUpgrade(s:State,policy:Policy):UpgradeId{
 const next=c.ranks[s.career.rank+1],current=c.ranks[s.career.rank];
 if(policy==='ALL_ROUNDER')return [...order].sort((a,b)=>s.player.upgrades[a]-s.player.upgrades[b]||upgradeCost(s,a)-upgradeCost(s,b)||order.indexOf(a)-order.indexOf(b))[0];
 if(policy==='EFFICIENCY_FIRST'){
  if(rawWorkQuality(s)<current.recommendedQuality)return 'quality';
  if(next&&rawWorkSpeed(s)>=next.recommendedSpeed&&rawWorkQuality(s)<next.recommendedQuality)return 'quality';
  return 'efficiency';
 }
 if(policy==='QUALITY_FIRST'){
  if(rawWorkSpeed(s)<current.recommendedSpeed)return 'efficiency';
  if(next&&rawWorkQuality(s)>=next.recommendedQuality&&rawWorkSpeed(s)<next.recommendedSpeed)return 'efficiency';
  return 'quality';
 }
 const candidates:UpgradeId[]=['efficiency','quality'];
 if(policy==='PREPARED_BALANCED'&&next&&!recommendationReady(s)){
  const missing=candidates.filter(id=>id==='efficiency'?rawWorkSpeed(s)<next.recommendedSpeed:rawWorkQuality(s)<next.recommendedQuality);
  return missing.sort((a,b)=>s.player.upgrades[a]-s.player.upgrades[b]||upgradeCost(s,a)-upgradeCost(s,b))[0];
 }
 return candidates.sort((a,b)=>s.player.upgrades[a]-s.player.upgrades[b]||upgradeCost(s,a)-upgradeCost(s,b))[0];
}
export function careerDecision(s:State,policy:Policy,onAction:(type:'upgrade'|'promote',id:UpgradeId|undefined,before:State)=>void){
 let guard=0;
 while(++guard<100000){
  const next=c.ranks[s.career.rank+1],ready=policy==='PROMOTE_ASAP_BALANCED'||recommendationReady(s);
  if(next&&ready&&canPromote(s)){const before={...s,player:{...s.player,upgrades:{...s.player.upgrades}},career:{...s.career}};if(!applyAction(s,{type:'promote'}))throw Error('Production promotion refused');onAction('promote',undefined,before);continue;}
  const reserve=next&&(policy==='PROMOTE_ASAP_BALANCED'||ready)?next.promotionCost:0;
  const id=chooseUpgrade(s,policy),cost=upgradeCost(s,id);
  if(s.player.money-reserve<cost)return;
  const before={...s,player:{...s.player,upgrades:{...s.player.upgrades}},career:{...s.career}};if(!applyAction(s,{type:'upgrade',id}))throw Error('Production upgrade refused');onAction('upgrade',id,before);
 }
 throw Error('Policy purchase loop limit');
}
export function spendClarity(s:State){
 const lines:PermanentId[]=['workEfficiency','workQuality','workReward','startingMoney'],purchases:{id:PermanentId;levelBefore:number;levelAfter:number;cost:number}[]=[];
 while(true){const id=[...lines].sort((a,b)=>getPrestigeUpgradeCost(a,s.prestige.levels[a])-getPrestigeUpgradeCost(b,s.prestige.levels[b])||lines.indexOf(a)-lines.indexOf(b))[0],cost=getPrestigeUpgradeCost(id,s.prestige.levels[id]);if(s.prestige.clarity<cost)return purchases;const before=s.prestige.levels[id];if(!applyAction(s,{type:'permanent',id}))throw Error('Production permanent refused');purchases.push({id,levelBefore:before,levelAfter:s.prestige.levels[id],cost});}
}
