import { gameConfig as c } from '../../config/gameConfig';
import type { ProductEffectType, ProductStats, State } from '../state/gameState';
import type { ProductDefinition } from './productSchema';
import { productBillingDays, resolveProblemProduct } from './productEffects';
import { notify } from '../events/eventLog';
export function emptyProductStats(type: ProductEffectType): ProductStats {
 const common = { activationCount: 0, totalSpent: 0, billingSpent: 0 };
 if (type === 'PROBLEM_RESOLVER') return { ...common, problemTriggeredCount: 0, problemResolvedCount: 0, debuffSecondsSaved: 0 };
 if (type === 'FOOD_OPTION') return { ...common, foodUses: 0, foodSecondsSaved: 0 };
 if (type === 'OFFLINE_AGE_PROTECTION') return { ...common, offlineAgeDaysProtected: 0 };
 if (type === 'TAGGED_WORK_REWARD') return { ...common, bonusIncome: 0 };
 return common;
}
export const remainingProductDays = (s: State, id: string) => Math.max(0, ((s.products[id]?.nextBillingWorldTime ?? s.world.totalWorldTime) - s.world.totalWorldTime) / c.time.dayDuration);
export const activeProductForTag = resolveProblemProduct;
export const createProductSubscription=(p:ProductDefinition):State['products'][string]=>({id:p.id,active:false,pricePerBillingPeriod:p.price,billingPeriodDays:productBillingDays(p),nextBillingWorldTime:null,effectType:p.effectType,contributionStats:emptyProductStats(p.effectType)});
export function toggleProduct(s: State, id: string) {
 const p = s.products[id]; const definition = c.products.definitions.find(x => x.id === id); if (!p || !definition || !p.active && definition.enabled===false) return false;
 if (p.active) { p.active = false; notify(s, '產品', `${definition.name} 已停用，已付期限仍按世界時間計算。`, { productId: id }); return true; }
 if (p.nextBillingWorldTime === null || p.nextBillingWorldTime <= s.world.totalWorldTime) {
  if (s.player.money < p.pricePerBillingPeriod) return false;
  s.player.money -= p.pricePerBillingPeriod; p.contributionStats.totalSpent += p.pricePerBillingPeriod; p.contributionStats.billingSpent += p.pricePerBillingPeriod;
  p.nextBillingWorldTime = s.world.totalWorldTime + p.billingPeriodDays * c.time.dayDuration;
 }
 p.active = true; p.contributionStats.activationCount++;
 notify(s, '產品', `${definition.name} 已啟用，有效 ${remainingProductDays(s, id).toFixed(1)} 個完整遊戲日。`, { productId: id }); return true;
}
