import type { ProductEffectType } from '../state/gameState';
import type { ProductDefinition,ProductStackingPolicy } from './productSchema';
export interface EffectRegistration {
 valueType:'multiplier'|'additive'|'resolver'; stackingPolicy:ProductStackingPolicy; defaultValue:number|boolean;
 allowNegative:boolean; floor:number|null; cap:number|null; supported:boolean; hooks:string[];
}
export const productEffectRegistry:Record<ProductEffectType,EffectRegistration>={
 FOOD_OPTION:{valueType:'resolver',stackingPolicy:'SELECTED_OPTION',defaultValue:false,allowNegative:false,floor:null,cap:null,supported:true,hooks:['selectedFood']},
 PROBLEM_RESOLVER:{valueType:'resolver',stackingPolicy:'FIRST_MATCH',defaultValue:false,allowNegative:false,floor:null,cap:null,supported:true,hooks:['activeProductForTag','Problem Target']},
 OFFLINE_AGE_PROTECTION:{valueType:'multiplier',stackingPolicy:'MULTIPLY',defaultValue:1,allowNegative:false,floor:0,cap:1,supported:true,hooks:['progressAge','nextAgeWorkloadBoundary']},
 TAGGED_WORK_REWARD:{valueType:'additive',stackingPolicy:'ADD',defaultValue:0,allowNegative:false,floor:0,cap:null,supported:true,hooks:['workReward','workRewardContribution']},
 // Historical declaration only: do not silently invent a Sleep effect during this review.
 SLEEP_MODIFIER:{valueType:'resolver',stackingPolicy:'FIRST_MATCH',defaultValue:false,allowNegative:false,floor:null,cap:null,supported:false,hooks:[]},
};
export const productParameterRegistry={
 offlineAgeProgressMultiplier:{valueType:'multiplier',stackingPolicy:'MULTIPLY',defaultValue:1,floor:0,cap:1,capExclusive:false,allowNegative:false,hook:'offlineAge'},
 rewardTagBonus:{valueType:'additive',stackingPolicy:'ADD',defaultValue:0,floor:0,cap:null,capExclusive:false,allowNegative:false,hook:'workReward'},
 ageEfficiencyCompensationRate:{valueType:'additive',stackingPolicy:'ADD',defaultValue:0,floor:0,cap:1,capExclusive:true,allowNegative:false,hook:'effectiveWorkSpeed'},
} as const;
// Equivalent normalized effect view; no second serialized effects[] or new formal Effect Type.
export function productEffectView(p:ProductDefinition){return {type:p.effectType,enabled:p.enabled!==false,scope:p.tags,stackingPolicy:p.stackingPolicy??productEffectRegistry[p.effectType].stackingPolicy,values:{offlineAgeProgressMultiplier:p.offlineAgeProgressMultiplier,rewardTagBonus:p.rewardTagBonus,ageEfficiencyCompensationRate:p.ageEfficiencyCompensationRate}};}
export function validateProductConfig(config:{billingPeriodDays:number;definitions:ProductDefinition[]},food?:{id:string;productId:string}[]) {
 const fail=(message:string):never=>{throw Error(`Product Config: ${message}`);};
 const days=(v:unknown)=>typeof v==='number'&&Number.isFinite(v)&&Number.isInteger(v)&&v>0;
 if(!days(config.billingPeriodDays))fail('invalid billing duration');
 if(!Array.isArray(config.definitions))fail('missing definitions');
 const ids=new Set<string>();
 const required=['id','name','icon','price','effectType','tags','description',...Object.keys(productParameterRegistry)];
 const allowed=new Set([...required,'billingPeriodDays','enabled','stackingPolicy','allowedTargetTypes','blockedTargetTypes','requiredWorkTags','allowedTimeRanges','allowedRanks','blockedByProtection','randomEnabled','contextModifiers']);
 const targetTypes=['WORK','FOOD','LUNCH','ENTERTAINMENT','SLEEP','PROBLEM','MEETING','PROMOTION'];
 for(const p of config.definitions){
  if(!p||typeof p!=='object')fail('invalid definition');
  for(const field of required)if(!(field in p))fail(`${p.id??'?'} missing ${field}`);
  for(const field of Object.keys(p))if(!allowed.has(field))fail(`${p.id} unknown field ${field}`);
  for(const field of ['id','name','icon','description'] as const)if(typeof p[field]!=='string'||!p[field])fail(`invalid ${field}`);
  if(ids.has(p.id))fail(`duplicate id ${p.id}`);ids.add(p.id);
  if(typeof p.price!=='number'||!Number.isFinite(p.price)||p.price<0)fail(`${p.id} invalid price`);
  if(p.billingPeriodDays!==undefined&&!days(p.billingPeriodDays))fail(`${p.id} invalid billing duration`);
  if(p.enabled!==undefined&&typeof p.enabled!=='boolean')fail(`${p.id} invalid enabled`);
  const registration=productEffectRegistry[p.effectType];if(!registration||!registration.supported)fail(`${p.id} unknown or unsupported effect type ${p.effectType}`);
  if(p.stackingPolicy!==undefined&&p.stackingPolicy!==registration.stackingPolicy)fail(`${p.id} incompatible stacking policy`);
  if(!Array.isArray(p.tags)||p.tags.some(v=>typeof v!=='string'||!v)||new Set(p.tags).size!==p.tags.length)fail(`${p.id} invalid or duplicate tags`);
  if(['PROBLEM_RESOLVER','TAGGED_WORK_REWARD'].includes(p.effectType)&&!p.tags.length)fail(`${p.id} missing effect scope`);
  for(const [key,rule] of Object.entries(productParameterRegistry)){
   const value=p[key as keyof typeof productParameterRegistry];
   if(typeof value!=='number'||!Number.isFinite(value)||value<rule.floor||(rule.cap!==null&&(rule.capExclusive?value>=rule.cap:value>rule.cap)))fail(`${p.id} invalid ${key}`);
  }
  if(p.rewardTagBonus!==0&&p.effectType!=='TAGGED_WORK_REWARD')fail(`${p.id} incompatible reward effect`);
  if(p.offlineAgeProgressMultiplier!==1&&p.effectType!=='OFFLINE_AGE_PROTECTION')fail(`${p.id} incompatible offline-age effect`);
  for(const key of ['allowedTargetTypes','blockedTargetTypes'] as const)if(p[key]!==undefined&&(!Array.isArray(p[key])||p[key]!.some(v=>!targetTypes.includes(v))))fail(`${p.id} invalid ${key}`);
  if(p.requiredWorkTags!==undefined&&(!Array.isArray(p.requiredWorkTags)||p.requiredWorkTags.some(v=>typeof v!=='string')))fail(`${p.id} invalid requiredWorkTags`);
  if(p.allowedRanks!==undefined&&(!Array.isArray(p.allowedRanks)||p.allowedRanks.some(v=>!Number.isInteger(v)||v<0)))fail(`${p.id} invalid allowedRanks`);
  if(p.allowedTimeRanges!==undefined&&(!Array.isArray(p.allowedTimeRanges)||p.allowedTimeRanges.some(v=>!v||!Number.isFinite(v.start)||!Number.isFinite(v.end)||v.start<0||v.end<=v.start)))fail(`${p.id} invalid time ranges`);
  for(const key of ['blockedByProtection','randomEnabled'] as const)if(p[key]!==undefined&&typeof p[key]!=='boolean')fail(`${p.id} invalid ${key}`);
  if(p.contextModifiers!==undefined){if(!p.contextModifiers||typeof p.contextModifiers!=='object'||Array.isArray(p.contextModifiers))fail(`${p.id} invalid context modifiers`);for(const [target,modifiers]of Object.entries(p.contextModifiers)){if(!targetTypes.includes(target)||!modifiers||typeof modifiers!=='object'||Array.isArray(modifiers))fail(`${p.id} invalid context target`);for(const [key,value]of Object.entries(modifiers!))if(!['workSpeed','quality','lifeSpeed','lunchOutput','catchChance','escapeChance'].includes(key)||typeof value!=='number'||!Number.isFinite(value))fail(`${p.id} unknown/invalid context effect field ${key}`);}}
  if(food&&p.effectType==='FOOD_OPTION'&&!food.some(f=>f.productId===p.id))fail(`${p.id} missing linked Food Config`);
 }
 if(food)for(const f of food)if(f.productId&&!config.definitions.some(p=>p.id===f.productId&&p.effectType==='FOOD_OPTION'))fail(`${f.id} unknown or incompatible Food product`);
 return true;
}
