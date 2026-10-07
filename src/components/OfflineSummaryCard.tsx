import type { OfflineSummary } from '../game/types';
import { gameConfig as c } from '../config/gameConfig';
import { decimal, money } from '../utils/format';
export function OfflineSummaryCard({ summary: x, dismiss }: { summary: OfflineSummary; dismiss?: () => void }) {
  return <section className="offline-summary" aria-label="離線摘要"><h3>離線期間的生活</h3>
    <p>現實 {decimal(x.realOfflineMinutes)} 分鐘 → {x.gameDays} 遊戲日</p>
    <p>工作／專案總收入 ${money(x.grossIncome)} · 產品支出 ${money(x.productSpending)}<br />金錢淨變化 ${money(x.netMoneyChange)}</p>
    <p>年齡 {decimal(x.ageBefore)} → {decimal(x.ageAfter)} 歲 · 人生進度 +{decimal(x.ageProgressDays)} 日<br />Todo {x.todoBefore} → {x.todoAfter}</p>
    <details><summary>專案與產品貢獻</summary>{x.projects.map(p => <p key={p.id}>{p.name}：{p.before} → {p.after} 步 · {p.status === 'ACTIVE' ? '進行中' : p.status === 'DELIVERED' ? '已交付，仍有後續' : '已結案'}</p>)}
      {x.products.map(p => <p key={p.id}>{c.products.definitions.find(d => d.id === p.id)?.name}：觸發 {p.stats.problemTriggeredCount ?? 0} · 處理 {p.stats.problemResolvedCount ?? 0} · 食物 {p.stats.foodUses ?? 0} 次<br />省進食 {decimal(p.stats.foodSecondsSaved ?? 0)} 秒 · 提前解除 {decimal(p.stats.debuffSecondsSaved ?? 0)} 秒 · 年齡保護 {decimal(p.stats.offlineAgeDaysProtected ?? 0)} 日 · 額外收入 ${money(p.stats.bonusIncome ?? 0)} · 續費 ${money(p.billingSpend)}</p>)}</details>
    {dismiss && <button onClick={dismiss}>關閉離線摘要</button>}
  </section>;
}
