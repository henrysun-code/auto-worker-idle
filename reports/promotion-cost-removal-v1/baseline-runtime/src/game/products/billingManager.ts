import { gameConfig as c } from '../../config/gameConfig';
import type { State } from '../state/gameState';
import { notify } from '../events/eventLog';
export function renewProduct(s: State, id: string) {
 const p = s.products[id]; if (!p?.active) return false;
 const name = c.products.definitions.find(x => x.id === id)!.name;
 if (s.player.money < p.pricePerBillingPeriod) { p.active = false; p.nextBillingWorldTime = null; notify(s, '產品', `${name} 續購失敗，效果已暫停。`, { productId: id }); return false; }
 s.player.money -= p.pricePerBillingPeriod; p.contributionStats.totalSpent += p.pricePerBillingPeriod; p.contributionStats.billingSpent += p.pricePerBillingPeriod;
 p.nextBillingWorldTime = (p.nextBillingWorldTime ?? s.world.totalWorldTime) + p.billingPeriodDays * c.time.dayDuration;
 notify(s, '產品', `${name} 已續購 ${p.billingPeriodDays} 日，-$${p.pricePerBillingPeriod}。`, { productId: id }); return true;
}
export function processBilling(s: State) {
 for (const p of Object.values(s.products)) while (p.active && p.nextBillingWorldTime !== null && p.nextBillingWorldTime <= s.world.totalWorldTime + 1e-8) { if (!renewProduct(s, p.id)) break; }
}
