import {gameConfig as c} from '../src/config/gameConfig';
import type {State,UpgradeId} from '../src/game/types';
import {applyAction} from '../src/game/engine/actions';
import {getPromotionQualificationStats} from '../src/game/career/promotionAssignment';
import {upgradeCost} from '../src/game/work/workStats';
import {chooseUpgrade,recommendationReady,type Policy} from './careerPolicies';
export {policies,spendClarity} from './careerPolicies';
export type {Policy} from './careerPolicies';
// Keep legacy build identity; only adapt purchase blocking to automatic assessment.
export function chooseV3Upgrade(s:State,policy:Policy):UpgradeId{
 const requirement=c.promotionQualification.requirements[s.career.rank],q=getPromotionQualificationStats(s);
 if(requirement&&policy==='EFFICIENCY_FIRST'&&q.efficiency>=requirement.efficiency&&q.quality<requirement.quality)return 'quality';
 if(requirement&&policy==='QUALITY_FIRST'&&q.quality>=requirement.quality&&q.efficiency<requirement.efficiency)return 'efficiency';
 return chooseUpgrade(s,policy);
}
export function careerV3Decision(s:State,policy:Policy,onPurchase:(id:UpgradeId,cost:number)=>void=()=>{}){
 for(let guard=0;guard<100000;guard++){
  const next=c.ranks[s.career.rank+1];
  const pending=s.promotion.pending||['SCHEDULED','ACTIVE'].includes(s.promotion.status);
  const ready=policy==='PROMOTE_ASAP_BALANCED'||recommendationReady(s);
  const reserve=next&&(pending||ready)?next.promotionCost:0;
  const id=chooseV3Upgrade(s,policy),cost=upgradeCost(s,id);
  if(s.player.money-reserve<cost)return;
  if(!applyAction(s,{type:'upgrade',id}))throw Error('Production upgrade rejected');
  onPurchase(id,cost);
 }
 throw Error('V3 purchase loop exceeded');
}
