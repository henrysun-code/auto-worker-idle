import type { Modifiers, ProductEffectType } from '../state/gameState';
export type ProductStackingPolicy='SELECTED_OPTION'|'FIRST_MATCH'|'MULTIPLY'|'ADD';
// Existing flat Config remains the persisted source of truth. Optional fields are additive.
export interface ProductDefinition {
 id:string; name:string; icon:string; price:number; effectType:ProductEffectType; tags:string[]; description:string;
 offlineAgeProgressMultiplier:number; rewardTagBonus:number; ageEfficiencyCompensationRate:number;
 billingPeriodDays?:number; enabled?:boolean; stackingPolicy?:ProductStackingPolicy;
 allowedTargetTypes?:string[]; blockedTargetTypes?:string[]; requiredWorkTags?:string[];
 allowedTimeRanges?:{start:number;end:number}[]; allowedRanks?:number[];
 blockedByProtection?:boolean; randomEnabled?:boolean; contextModifiers?:Partial<Record<string,Modifiers>>;
}
