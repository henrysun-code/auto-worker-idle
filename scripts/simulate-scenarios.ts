import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { gameConfig as c } from '../src/config/gameConfig';
import { initialState } from '../src/game/state/initialState';
import { advance } from '../src/game/engine/SimulationLoop';
import { toggleProduct } from '../src/game/products/productManager';
import { effectiveWorkSpeed, effectiveWorkQuality } from '../src/game/work/workStats';
import { getDeadlineStatus } from '../src/game/work/deadline';
import { canPromote, getUnresolvedOverdueWorkCount } from '../src/game/career/promotion';
import { validateSave } from '../src/game/save/saveGame';
import type { State, Todo } from '../src/game/state/gameState';

// Independent initial states; never read or write the player's browser save.
const ages = [22, 40, 50, 60], seeds = [42, 2026, 314159], checkpoints = [10, 20, 30];
const rows: Record<string, number | string | boolean>[] = [];
function liveWork(s: State): Todo[] {
  const tasks = [...s.todoQueue, ...(s.currentTarget?.type === 'WORK' ? [s.currentTarget.todo] : []),
    ...s.suspendedTargets.flatMap(x => x.target.type === 'WORK' ? [x.target.todo] : [])];
  return [...new Map(tasks.map(t => [t.id, t])).values()];
}
for (const age of ages) for (const product of [false, true]) for (const efficiency of [0, 5]) for (const quality of [0, 5]) for (const seed of seeds) {
  const s = initialState(seed, 0);
  s.player.money = 1000;
  s.player.age = age; s.player.ageProgressDays = (age - c.age.start) * c.age.daysPerYear;
  s.player.upgrades.efficiency = efficiency; s.player.upgrades.quality = quality;
  if (product) toggleProduct(s, 'agecare');
  const startingSpeed = effectiveWorkSpeed(s), startingQuality = effectiveWorkQuality(s);
  for (const days of checkpoints) {
    const end = days * c.time.dayDuration + c.time.workStartAnchor * c.time.dayDuration / c.time.referenceDayDuration;
    advance(s, end - s.world.totalWorldTime);
    assert.ok(validateSave(s), `invalid scenario age=${age} seed=${seed} days=${days}`);
    const tasks = liveWork(s), overdue = getUnresolvedOverdueWorkCount(s);
    assert.equal(overdue, tasks.filter(t => getDeadlineStatus(t, s) === 'OVERDUE').length);
    for (const t of tasks) assert.ok(Number.isFinite(t.workload) && t.workload > 0);
    const next = c.ranks[s.career.rank + 1];
    rows.push({ age, product, efficiencyLevel: efficiency, qualityLevel: quality, seed, workdays: days,
      startingSpeed, startingQuality, endAge: s.player.age, queuedTodo: s.todoQueue.length,
      unresolvedTodo: tasks.length, dueToday: tasks.filter(t => getDeadlineStatus(t, s) === 'DUE_TODAY').length,
      overdue, pendingTasks: s.pendingFollowUps.reduce((n, p) => n + p.tasksToCreate.length, 0),
      grossIncome: s.runStatistics.earned, netMoneyChange: s.player.money - 1000, money: s.player.money,
      productSpending: Object.values(s.products).reduce((n, p) => n + p.contributionStats.totalSpent, 0),
      completedWork: s.runStatistics.completedWork, rework: s.runStatistics.reworkCount,
      unresolvedRework: tasks.filter(t => c.followUps.types.some(f => f.type === t.followUpType && f.qualitySensitive)).length,
      projectsCompleted: s.runStatistics.projectsCompleted, promotionEligible: canPromote(s),
      promotionMoneyOK: s.player.money >= next.promotionCost, promotionOverdueOK: overdue <= next.maxOverdueAllowed,
      maxOverdueAllowed: next.maxOverdueAllowed, productActiveAtEnd: s.products.agecare.active,
      phase: s.needs.phase, target: s.currentTarget?.type ?? 'NONE' });
  }
}
const output = fileURLToPath(new URL('../reports/scenarios/', import.meta.url));
await mkdir(output, { recursive: true });
const headers = Object.keys(rows[0]);
await writeFile(`${output}/results.csv`, '\uFEFF' + headers.join(',') + '\n' + rows.map(r => headers.map(h => r[h]).join(',')).join('\n') + '\n');
await writeFile(`${output}/results.json`, JSON.stringify({ settings: { ages, seeds, checkpoints, startingMoney: 1000, rank: 0, lowLevel: 0, highLevel: 5, config: c }, rows }, null, 2));
const mean = (group: typeof rows, key: string) => group.reduce((n, r) => n + Number(r[key]), 0) / group.length;
let report = '# V2 批次情境模擬\n\n';
report += '32 組條件 × 3 個固定 seed = 96 條獨立模擬；每條在第 10／20／30 個工作日上班錨點取樣，共 288 筆結果。表格數值為三個 seed 的平均，逾期範圍保留最小～最大；升職欄為符合資格的 seed 數／3。\n\n';
report += '年齡 22／40／50／60；產品只切換時光緩衝組（agecare）；效率與品質低=Lv0、高=Lv5。初始資金 $1,000、職級新人，其他能力 Lv0、普通食物、無永久加成；能力視為已持有，不扣購買成本。保留事件、老闆、專案、返工、餐費、產品扣款與自然年長。固定職級，不自動購買或升職，只檢查資格。產品不是強制永久啟用，依正式續費規則運作。\n\n';
report += 'Todo 包含 queue/current/suspended 並按 ID 去重；排除尚未釋出的 Pending 與 Project Parent。今日到期／逾期採相同集合。CSV 另列 queuedTodo。收入是工作與專案累計毛收入；淨變化包含遊戲支出；返工沿用引擎累計 reworkCount，代表已完成的品質相關後續工作（REWORK／CORRECTION／MISSING_INFO），不是生成總數；CSV 另列尚未完成的 unresolvedRework。10～30 工作日是世界時間區間，不保證角色完成相同數量作息；起點為 Day 1 的世界 0 秒，取樣點為 Day 11／21／31 的上班錨點，因此包含最初上班前早餐。\n\n';
report += `基礎速度低=${c.economy.baseWorkSpeed}、高=${c.economy.baseWorkSpeed + 5*c.upgrades.efficiency.increment}；基礎品質低=${c.economy.baseQuality}、高=${c.economy.baseQuality + 5*c.upgrades.quality.increment}。年齡产品另依實際年齡增加工作速度。下一職級需要 $${c.ranks[1].promotionCost} 且逾期 ≤${c.ranks[1].maxOverdueAllowed}。\n\n`;
for (const days of checkpoints) {
  report += `## ${days} 個工作日\n\n| 年齡 | 產品 | 效率 | 品質 | Todo | 今日到期 | 逾期均值（範圍） | 毛收入 | 淨變化 | 返工 | 完成工作 | 升職資格 |\n|---|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|\n`;
  for (const age of ages) for (const product of [false,true]) for (const efficiency of [0,5]) for (const quality of [0,5]) {
    const g = rows.filter(r => r.age===age && r.product===product && r.efficiencyLevel===efficiency && r.qualityLevel===quality && r.workdays===days);
    const f = (key: string) => mean(g,key).toFixed(1);
    report += `| ${age} | ${product?'有':'無'} | ${efficiency?'高':'低'} | ${quality?'高':'低'} | ${f('unresolvedTodo')} | ${f('dueToday')} | ${f('overdue')}（${Math.min(...g.map(r=>Number(r.overdue)))}～${Math.max(...g.map(r=>Number(r.overdue)))}） | ${f('grossIncome')} | ${f('netMoneyChange')} | ${f('rework')} | ${f('completedWork')} | ${g.filter(r=>r.promotionEligible).length}/3 |\n`;
  }
  report += '\n';
}
const final = rows.filter(r => r.workdays === 30), blocked = final.filter(r => !r.promotionEligible);
report += `## 本次觀察\n\n30 日取樣：${final.filter(r=>r.promotionEligible).length}/96 條模擬可升職；${blocked.length} 條不符合，其中資金不足 ${blocked.filter(r=>!r.promotionMoneyOK).length} 條、逾期超限 ${blocked.filter(r=>!r.promotionOverdueOK).length} 條。\n\n`;
for (const r of blocked) report += `- ${r.age} 歲／${r.product?'有':'無'}產品／效率 Lv${r.efficiencyLevel}／品質 Lv${r.qualityLevel}／seed ${r.seed}：逾期 ${r.overdue} 件，資金 $${r.money}。\n`;
report += '\n22 歲有／無產品的工作結果一致，產品此時不提供效率增益，但仍有訂閱費。高效率低品質的完成返工數可能更多，因為處理及生成工作更多；不能只看返工絕對數判斷品質效果。\n\n';
report += '## 判讀限制與重跑\n\n三個 seed 是初步情境比較，不代表正式統計平衡；不同效率改變完成時間與事件分支，之後隨機抽取序列也會分歧，不能把收入差全部歸因於單一產品。初始資金與免費能力設定會影響升職資格，請搭配 CSV 的 promotionMoneyOK／promotionOverdueOK 看原因。正式 Config 未修改，玩家存檔未觸碰。\n\n在遊戲目錄執行 `npm run simulate:scenarios`；會先從 Excel 更新 Config，再使用同一引擎重跑並覆寫本資料夾報告。JSON 包含本次完整設定快照；CSV 保存每個 seed 的實際結果。\n';
await writeFile(`${output}/REPORT.md`, report);
console.log(`完成 ${rows.length} 筆取樣，96 條模擬。輸出 reports/scenarios/{REPORT.md,results.csv,results.json}`);
console.log(JSON.stringify(checkpoints.map(days=>({days, eligible:rows.filter(r=>r.workdays===days&&r.promotionEligible).length, total:96, overdueMean:mean(rows.filter(r=>r.workdays===days),'overdue')}))));
