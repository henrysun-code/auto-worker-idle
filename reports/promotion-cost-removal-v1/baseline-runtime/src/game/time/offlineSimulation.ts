import { gameConfig as c } from '../../config/gameConfig';
import type { ProductStats, State } from '../state/gameState';
import { advance } from '../engine/SimulationLoop';
import { notify } from '../events/eventLog';
export function settleOfflineMinutes(s: State, minutes: number) {
 if (!Number.isFinite(minutes) || minutes < 0) return 0;
 const total = minutes + s.offline.offlineCarryMinutes; const days = Math.floor((total + 1e-9) / c.offline.minutesPerGameDay);
 s.offline.offlineCarryMinutes = Math.max(0, total - days * c.offline.minutesPerGameDay);
 if (!days) return 0;
 const before = { money: s.player.money, earned: s.runStatistics.earned, age: s.player.age, ageDays: s.player.ageProgressDays, todo: s.todoQueue.length, projects: structuredClone(s.projects), products: structuredClone(s.products) };
 advance(s, days * c.time.dayDuration, { offline: true });
 const products = Object.values(s.products).map(p => {
  const old = before.products[p.id].contributionStats; const stats = Object.fromEntries(Object.entries(p.contributionStats).map(([key, value]) => [key, value - (old[key as keyof ProductStats] ?? 0)])) as unknown as ProductStats;
  return { id: p.id, stats, billingSpend: stats.billingSpent };
 });
 s.offline.lastOfflineSummary = { realOfflineMinutes: minutes, gameDays: days, grossIncome: s.runStatistics.earned - before.earned, productSpending: products.reduce((n,p) => n + p.stats.totalSpent,0), netMoneyChange: s.player.money - before.money, ageBefore: before.age, ageAfter: s.player.age, ageProgressDays: s.player.ageProgressDays - before.ageDays, todoBefore: before.todo, todoAfter: s.todoQueue.length, projects: s.projects.map(p => ({ id: p.id, name: p.name, before: before.projects.find(x => x.id === p.id)?.completedSubtasks ?? 0, after: p.completedSubtasks, status: p.status })), products };
 s.offline.summaryDismissed = false;
 s.offline.lastSettlement = { days, earned: s.runStatistics.earned - before.earned, ageDays: s.player.ageProgressDays - before.ageDays };
 notify(s, '離線', `現實離線 ${minutes.toFixed(1)} 分鐘，結算 ${days} 個遊戲日；收入 +$${Math.round(s.offline.lastSettlement.earned)}，產品支出 $${Math.round(s.offline.lastOfflineSummary.productSpending)}，金錢淨變化 $${Math.round(s.offline.lastOfflineSummary.netMoneyChange)}。`);
 return days;
}
