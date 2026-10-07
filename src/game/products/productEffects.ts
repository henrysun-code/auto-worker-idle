import {gameConfig as c} from '../../config/gameConfig';
import type {ProductEffectType,State,Todo} from '../state/gameState';
import type {ProductDefinition} from './productSchema';
import {productParameterRegistry} from './productEffectRegistry';
export const getProductDefinition=(id:string)=>c.products.definitions.find(p=>p.id===id);
export const productBillingDays=(p:ProductDefinition)=>p.billingPeriodDays??c.products.billingPeriodDays;
export function isProductActive(s:State,id:string,type?:ProductEffectType){const p=getProductDefinition(id);return !!p&&p.enabled!==false&&!!s.products[id]?.active&&(!type||p.effectType===type);}
export function activeProductDefinitions(s:State,type?:ProductEffectType){return c.products.definitions.filter(p=>isProductActive(s,p.id,type));}
function combineParameter(s:State,key:keyof typeof productParameterRegistry,products:ProductDefinition[]){const rule=productParameterRegistry[key];return products.reduce((value,p)=>rule.stackingPolicy==='ADD'?value+p[key]:value*p[key],rule.defaultValue as number);}
export function resolveAgeCompensationRate(s:State,id?:string){return combineParameter(s,'ageEfficiencyCompensationRate',activeProductDefinitions(s).filter(p=>!id||p.id===id));}
export function resolveOfflineAgeMultiplier(s:State){return combineParameter(s,'offlineAgeProgressMultiplier',activeProductDefinitions(s,'OFFLINE_AGE_PROTECTION'));}
// Preserve exact ordered marginal attribution, including floating-point operation order.
export function resolveOfflineAgeProgress(s:State,ageDays:number){for(const p of activeProductDefinitions(s,'OFFLINE_AGE_PROTECTION')){const stats=s.products[p.id].contributionStats;stats.offlineAgeDaysProtected=(stats.offlineAgeDaysProtected??0)+ageDays*(1-p.offlineAgeProgressMultiplier);ageDays*=p.offlineAgeProgressMultiplier;}return ageDays;}
export function resolveTaggedRewardProducts(s:State,tags:string[],excludeId?:string){return activeProductDefinitions(s,'TAGGED_WORK_REWARD').filter(p=>p.id!==excludeId&&p.tags.some(tag=>tags.includes(tag)));}
export function resolveTaggedRewardBonus(s:State,tags:string[],excludeId?:string){return combineParameter(s,'rewardTagBonus',resolveTaggedRewardProducts(s,tags,excludeId));}
export function recordProductWorkReward(s:State,todo:Todo,reward:number,withoutProduct:(id:string)=>number){for(const p of resolveTaggedRewardProducts(s,todo.tags)){if(p.rewardTagBonus>0){const stats=s.products[p.id].contributionStats;stats.bonusIncome=(stats.bonusIncome??0)+reward-withoutProduct(p.id);}}}
export const resolveProblemProduct=(s:State,tag:string)=>activeProductDefinitions(s,'PROBLEM_RESOLVER').find(p=>p.tags.includes(tag));
export const canResolveProblem=(s:State,id:string,tag:string)=>isProductActive(s,id,'PROBLEM_RESOLVER')&&!!getProductDefinition(id)?.tags.includes(tag);
export const canUseProductFood=(s:State,id:string)=>isProductActive(s,id,'FOOD_OPTION');
