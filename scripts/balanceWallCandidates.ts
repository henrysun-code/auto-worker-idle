import {gameConfig as c} from '../src/config/gameConfig';
export const baseline=structuredClone(c);
export const candidates=['A','B'].flatMap(threshold=>[1.040,1.042,1.045].flatMap(growth=>[2,3].map(cooldown=>({id:`${threshold}-G${growth.toFixed(3)}-C${cooldown}`,threshold,growth,cooldown}))));
export function overlay(candidate:typeof candidates[number]){
 Object.assign(c,structuredClone(baseline));
 const e=candidate.threshold==='A'?[20,35,60,100]:[20,35,65,110];
 c.promotionQualification.requirements=e.map(efficiency=>({efficiency,quality:efficiency*.6}));
 c.work.workloadTierCenters=[10,...e].map(x=>x*7);
 c.ranks.forEach((r,i)=>{r.recommendedSpeed=[10,...e][i];r.recommendedQuality=[6,...e.map(x=>x*.6)][i];});
 Object.assign(c.runUpgradeCurve,{baseGrowth:candidate.growth,softCap1:60,softCap2:120});
 c.promotionAssignment.retryWorkdays=candidate.cooldown;
 const costs={efficiency:30,quality:34,flattery:47,lifeManagement:38,slacking:43};
 for(const id of Object.keys(costs) as (keyof typeof costs)[])c.upgrades[id].baseCost=costs[id];
 return c;
}
export function restore(){Object.assign(c,structuredClone(baseline));}
