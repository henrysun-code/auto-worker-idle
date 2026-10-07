import { validateProductConfig } from '../src/game/products/productEffectRegistry';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import XLSX from 'xlsx';
import { defaultGameConfig } from '../src/config/v2Defaults';
import { validRankWeights,getWorkTemplateWeight,getProjectTemplateWeight } from '../src/game/work/templateWeights';
export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = path.join(root, 'config/game_config.xlsx');
type Row = { key: string; value: unknown; description?: string };
function flatten(value: object, prefix = ''): Row[] { return Object.entries(value).flatMap(([key, v]) => { const p = prefix ? `${prefix}.${key}` : key; return v !== null && typeof v === 'object' && !Array.isArray(v) ? flatten(v, p) : [{ key: p, value: typeof v === 'object' ? JSON.stringify(v) : v, description: p }]; }); }
let book = fs.existsSync(file) ? XLSX.readFile(file) : null;
const isV2 = book?.Sheets.Balance && XLSX.utils.sheet_to_json<Row>(book.Sheets.Balance).some(r => r.key === 'coreVersion' && r.value === 'todo-v2');
if (!isV2 || process.argv.includes('--seed')) {
  if (book) { const dir = path.join(root, 'config/archive'); fs.mkdirSync(dir, { recursive: true }); const backup = path.join(dir, isV2 ? `game_config-${Date.now()}.xlsx` : 'game_config-pre-core-v2.xlsx'); if (!fs.existsSync(backup)) fs.copyFileSync(file, backup); }
  book = XLSX.utils.book_new(); const sheet = XLSX.utils.json_to_sheet(flatten(defaultGameConfig)); sheet['!cols'] = [{ wch: 48 }, { wch: 70 }, { wch: 55 }]; XLSX.utils.book_append_sheet(book, sheet, 'Balance'); XLSX.writeFile(book, file);
}
const config = structuredClone(defaultGameConfig); const known = new Set(flatten(defaultGameConfig).map(r => r.key)); const seen = new Set<string>();
for (const row of XLSX.utils.sheet_to_json<Row>(book!.Sheets.Balance)) {
  if (!known.has(row.key) || seen.has(row.key)) throw Error(`未知或重複設定：${row.key}`); seen.add(row.key);
  const keys = row.key.split('.'); let target: any = config; for (const key of keys.slice(0, -1)) target = target[key]; const key = keys.at(-1)!; const old = target[key];
  target[key] = typeof old === 'number' ? Number(row.value) : typeof old === 'object' ? JSON.parse(String(row.value)) : typeof old === 'boolean' ? String(row.value) === 'true' : String(row.value);
}
const check = (ok: boolean, message: string) => { if (!ok) throw Error(`V2 設定不合法：${message}`); };
const positive = (v: number) => Number.isFinite(v) && v > 0;
check(config.promotionAssignment.assignments.length===config.ranks.length-1&&config.promotionAssignment.assignments.every(v=>positive(v.workload)&&!!v.name)&&Number.isInteger(config.promotionAssignment.retryWorkdays)&&config.promotionAssignment.retryWorkdays>=0&&config.promotionQualification.requirements.length===config.ranks.length-1&&config.promotionQualification.requirements.every(v=>positive(v.efficiency)&&positive(v.quality))&&config.promotionLowProfile.multiplier>0&&config.promotionLowProfile.multiplier<=1,'Promotion V1');
check(positive(config.meeting.referenceMeetingDurationSeconds) && config.meeting.normalChanceByRank.length===config.ranks.length && config.meeting.normalChanceByRank.every(v=>v>=0&&v<=1) && config.meeting.compensationByRank.length===config.ranks.length && config.meeting.compensationByRank.every(v=>v>=0) && config.meeting.bossMeetingChanceOnEscapeFail>=0 && config.meeting.bossMeetingChanceOnEscapeFail<=1,'Meeting V1');
function finiteValues(o: unknown): boolean { return typeof o === 'number' ? Number.isFinite(o) : Array.isArray(o) ? o.every(finiteValues) : o && typeof o === 'object' ? Object.values(o).every(finiteValues) : true; }
const profiles = config.deadlines.profiles;
const profileIds = new Set(profiles.map(p => p.id));
check(profileIds.size === profiles.length && profileIds.has(config.deadlines.defaultProfileId), 'Deadline profiles unique/default');
const workdays = (v: unknown) => v === null || typeof v === 'number' && Number.isInteger(v) && v >= 0;
check(profiles.every(p => workdays(p.deadlineWorkdays)), 'Deadline integer workdays');
check(Object.values(config.deadlines.workTypeProfiles).every(id => profileIds.has(id)) && config.deadlines.overdueRewardMultiplier >= 0 && config.deadlines.overdueRewardMultiplier <= 1, 'Deadline mappings/reward');
for (const row of [...config.work.templates, ...config.followUps.types, ...config.projects.templates, ...config.projects.templates.flatMap(p => p.subtasks)] as { deadlineWorkdays?: number | null; deadlineProfileId?: string }[]) check((row.deadlineWorkdays === undefined || workdays(row.deadlineWorkdays)) && (row.deadlineProfileId === undefined || profileIds.has(row.deadlineProfileId)), 'Deadline template override');
check(config.age.workloadCurve.length > 0 && config.age.workloadCurve[0].age <= config.age.start && config.age.workloadCurve.every((p,i,a) => p.multiplier >= 1 && (i === 0 || p.age > a[i-1].age && p.multiplier >= a[i-1].multiplier)), 'Age workload curve');
check(config.ranks.every(r => Number.isInteger(r.maxOverdueAllowed) && r.maxOverdueAllowed >= 0), 'Promotion overdue limits');
check(config.products.definitions.every(p => p.ageEfficiencyCompensationRate >= 0 && p.ageEfficiencyCompensationRate < 1), 'Age compensation rate');
check(finiteValues(config), '所有數字必須有限');
const t = config.time; check(t.workStartAnchor >= t.breakfastStart && t.workStartAnchor < t.lunchStart, 'workStartAnchor'); check(positive(t.dayDuration) && positive(t.referenceDayDuration) && positive(t.hoursPerDay) && positive(t.tickSeconds), '時間必須為正數');
check(t.breakfastStart >= 0 && t.breakfastStart < t.breakfastCutoff && t.breakfastCutoff < t.lunchStart, '早餐窗口');
check(0 < t.lunchStart && positive(t.lunchDuration) && t.lunchStart + t.lunchDuration < t.offWorkAnchor && t.offWorkAnchor < t.sleepAnchor && t.sleepAnchor < t.referenceDayDuration, '作息節點');
check(Number.isInteger(config.work.todoLowWatermark) && config.work.todoLowWatermark >= 1 && Number.isInteger(config.work.todoRefillTarget) && config.work.todoRefillTarget >= config.work.todoLowWatermark, 'Todo 水位');
check(positive(config.age.daysPerYear) && positive(config.offline.minutesPerGameDay) && positive(config.products.billingPeriodDays), '年齡、離線、續費');
check(config.work.templates.length > 0 && config.work.templates.every(j => positive(j.workload) && j.reward >= 0 && positive(j.weight) && positive(j.quality)), '工作池');
check(config.work.templates.every(t=>Number.isInteger(t.rank)&&t.rank>=0&&t.rank<config.ranks.length&&validRankWeights(t,t.rank,config.ranks.length)), 'Work rankWeights');
check(config.projects.templates.every(t=>t.rankRequirement<config.ranks.length&&validRankWeights(t,t.rankRequirement,config.ranks.length)), 'Project rankWeights');
check(config.ranks.every((_,rank)=>config.work.templates.some(t=>getWorkTemplateWeight(t,rank)>0)&&config.projects.templates.some(t=>getProjectTemplateWeight(t,rank)>0)), '每個職級必須有可生成內容');
check(config.followUps.types.every(f => f.chance >= 0 && f.chance <= 1 && f.countMin >= 1 && f.countMax >= f.countMin && f.delay >= 0 && positive(f.workloadFactor) && f.rewardFactor >= 0), 'Follow-up');
check(Number.isInteger(config.followUps.maxFollowUpDepth) && config.followUps.maxFollowUpDepth >= 0 && config.followUps.maxExtraTasksPerRootWork >= 0, 'Follow-up 上限');
check(config.food.items.some(f => f.id === 'normal' && f.price === 0) && config.food.items.every(f => positive(f.requirement) && positive(f.satietyDuration) && f.price >= 0), '食物');
check(positive(config.food.processingRate) && positive(config.economy.baseWorkSpeed) && positive(config.economy.baseQuality) && positive(config.economy.baseLifeSpeed) && positive(config.lunch.fullRestTarget), '基礎產能');
check(config.prestige.upgrades.every(u => positive(u.baseCost) && u.multiplierBase>1 && u.costGrowth>1), '永久公式');
check(config.prestige.minimumPrestigeActiveMinutes>=0,'Prestige active minutes');
check(Object.values(config.upgrades).every(u=>positive(u.baseCost)&&u.increment>0), 'Run base cost');
const curve=config.runUpgradeCurve;
check([curve.baseGrowth,curve.post100Growth,curve.post200Growth].every(v=>v>1) && curve.softCap1>=0 && curve.softCap2>curve.softCap1, 'Run soft wall');
check(config.boss.baseAttention===.10 && config.boss.flatteryAttentionPerLevel===.02 && config.boss.flatteryIncomePerLevel===.01 && positive(config.boss.baseEscapeValue)&&positive(config.boss.baseJobResistance), 'Boss formulas');
check(config.ranks.every((r,i,a)=>r.rankEscapeResistance>=0&&(i===0||r.rankEscapeResistance>=a[i-1].rankEscapeResistance)), 'Rank resistance');
check(positive(config.sleep.targetDuration)&&config.sleep.effectCurve.length>=2&&config.sleep.effectCurve.every((p,i,a)=>p.ratio>=0&&(i===0||p.ratio>a[i-1].ratio)), 'Sleep curve');
for (const project of config.projects.templates) {
  const done = new Set<string>(); check(new Set(project.subtasks.map(x => x.id)).size === project.subtasks.length, '專案重複 ID');
  while (done.size < project.subtasks.length) { const ready = project.subtasks.filter(x => !done.has(x.id) && x.dependencies.every(d => done.has(d))); check(ready.length > 0, '專案循環或缺少依賴'); ready.forEach(x => done.add(x.id)); }
}
validateProductConfig(config.products,config.food.items);
check(config.events.definitions.every(e => positive(e.duration) && positive(e.problemRequirement) && e.protectionChanceMultiplier >= 0 && e.protectionChanceMultiplier <= 1) && positive(config.events.interval), '事件');


check(config.projects.templates.every(t => positive(t.weight) && Number.isInteger(t.rankRequirement) && t.rankRequirement >= 0 && typeof t.enabled === 'boolean'), '專案模板條件');
check(config.followUps.qualityCountBands.length > 0 && config.followUps.qualityCountBands[0].minimumRatio === 0 && config.followUps.qualityCountBands.every((b,i,a) => b.countMin >= 1 && b.countMax >= b.countMin && (i === 0 || b.minimumRatio > a[i-1].minimumRatio)), '品質數量Bands');

fs.mkdirSync(path.join(root, 'config/generated'), { recursive: true }); fs.writeFileSync(path.join(root, 'config/generated/game_config.json'), JSON.stringify(config, null, 2) + '\n');
console.log(`V2 設定完成：${seen.size} 列，舊表已保留，${config.products.definitions.length} 種訂閱產品。`);
