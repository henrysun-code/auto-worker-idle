import type { FollowUpType, PermanentId, UpgradeId, ProductEffectType, Modifiers } from '../game/state/gameState';
import type { ProductDefinition } from '../game/products/productSchema';
import { workRankWeights, newWorkTemplates, newProjectTemplates } from './rankContent';
const upgrade = (name: string, icon: string, description: string, baseCost: number, increment: number) => ({ name, icon, description, baseCost, increment });
type TargetType = 'WORK' | 'FOOD' | 'LUNCH' | 'ENTERTAINMENT' | 'SLEEP' | 'PROBLEM' | 'MEETING' | 'PROMOTION';
const context = (allowedTargetTypes: TargetType[], randomEnabled = true) => ({ allowedTargetTypes, blockedTargetTypes: [] as TargetType[], requiredWorkTags: [] as string[], allowedTimeRanges: [] as { start: number; end: number }[], allowedRanks: [] as number[], blockedByProtection: true, randomEnabled, contextModifiers: {} as Partial<Record<TargetType, Modifiers>> });
const permanent = (id: PermanentId, name: string) => ({ id, name, multiplierBase: 1.10, baseCost: 5, costGrowth: 2.65 });
export const defaultGameConfig = {
  // Promotion V2 PROVISIONAL. Legacy assignments.workload is retained for archived V1 tools only;
  // runtime snapshots threshold E × scaled working day × workloadFactor.
  promotionQualification: { requirements: [{ efficiency:20, quality:12 },{ efficiency:40, quality:24 },{ efficiency:80, quality:48 },{ efficiency:160, quality:96 }] },
  promotionAssignment: { retryWorkdays:3, workloadFactor:1.2, failedCompletionReward:0, assignments:[{ name:'獨立需求處理', workload:130 },{ name:'重要客戶提案', workload:209 },{ name:'部門協調改善案', workload:330 },{ name:'年度策略方案', workload:507 }] },
  promotionLowProfile: { multiplier:0.8 },
  gameId: 'auto-worker', version: '2.0.0', saveVersion: 2, coreVersion: 'todo-v2', prototypeTargetRunDuration: 480,
  time: { dayDuration: 180, sleepTimeAcceleration:60, referenceDayDuration: 60, hoursPerDay: 24, workStartAnchor: 8, breakfastStart: 0, breakfastCutoff: 8, lunchStart: 20, lunchDuration: 8, offWorkAnchor: 40, sleepAnchor: 50, tickSeconds: .05, speeds: [1, 2, 5, 10] },
  economy: { startingMoney: 120, baseWorkSpeed: 10, baseQuality: 6, baseLifeSpeed: 1, baseRestOutput: 30, incomeWindow: 60, minimumStatMultiplier: .25 },
  upgrades: {
    efficiency: upgrade('工作效率', '⚡', '線性提高處理速度。', 35, 1), quality: upgrade('工作品質', '✦', '減少可避免的返工，達成高階品質要求。', 40, 1),
    flattery: upgrade('拍馬屁', '☕', '收入增加，也更容易被老闆找到。', 55, .01), lifeManagement: upgrade('生活管理', '☯', '加快生活需求並增加午休輸出。', 45, 1), slacking: upgrade('摸魚技巧', '🐟', '已被找到後提高逃跑率。', 50, 1),
  } satisfies Record<UpgradeId, ReturnType<typeof upgrade>>,
  // PROVISIONAL formula shapes, not calibrated career balance.
  runUpgradeCurve: { baseGrowth: 1.025, post100Growth: 1.015, post200Growth: 1.005, softCap1: 100, softCap2: 200 },
  lifeConversion: { speedPerRaw: .2, lunchOutputPerRaw: 6 },
  // Meeting V1: PROVISIONAL, fixed world-time cost, independent of all abilities.
  meeting: { referenceMeetingDurationSeconds: 3, normalChanceByRank: [.02, .04, .07, .12, .18], compensationByRank: [5, 10, 20, 40, 80], bossMeetingChanceOnEscapeFail: .25 },
  deadlines: { overdueRewardMultiplier: .7, defaultProfileId: 'NORMAL',
    profiles: [
      { id: 'BOSS_URGENT', deadlineWorkdays: 0 }, { id: 'REWORK_SHORT', deadlineWorkdays: 1 },
      { id: 'CLIENT_REPLY', deadlineWorkdays: 1 }, { id: 'NEW_REQUEST', deadlineWorkdays: 2 },
      { id: 'NORMAL', deadlineWorkdays: 2 }, { id: 'PROJECT', deadlineWorkdays: 3 },
      { id: 'NO_DEADLINE', deadlineWorkdays: null as number | null },
    ], // PROVISIONAL / pending play balance
    workTypeProfiles: { BOSS: 'BOSS_URGENT', URGENT: 'BOSS_URGENT', REWORK: 'REWORK_SHORT', CORRECTION: 'REWORK_SHORT', MISSING_INFO: 'REWORK_SHORT', CLIENT_REPLY: 'CLIENT_REPLY', NEW_REQUEST: 'NEW_REQUEST', PROJECT_NEXT_STEP: 'PROJECT', PROJECT: 'PROJECT', NORMAL: 'NORMAL', FOLLOW_UP: 'NORMAL', EVENT: 'NORMAL' },
  },
  work: { workloadTierCenters:[70,140,280,560,1120], templateWorkloadReference:100, templateVariationMin:.75, templateVariationMax:1.4, todoLowWatermark: 2, todoRefillTarget: 4, priorities: { NORMAL: 10, FOLLOW_UP: 20, PROJECT: 30, BOSS: 50, URGENT: 60 }, bossWorkHours: 1, bossReward: 180,
    templates: [
      { id: 'email', name: '回 Email', workload: 45, reward: 16, tags: ['行政'], weight: 4, rank: 0, quality: 10 },
      { id: 'data', name: '整理資料', workload: 80, reward: 28, tags: ['行政'], weight: 3, rank: 0, quality: 12 },
      { id: 'slides', name: '修改簡報', workload: 100, reward: 38, tags: ['簡報', '形象'], weight: 2, rank: 0, quality: 14 },
      { id: 'monthly', name: '月報', workload: 130, reward: 55, tags: ['報告'], weight: 2, rank: 1, quality: 18 },
      { id: 'client', name: '客戶回覆', workload: 90, reward: 42, tags: ['客戶'], weight: 3, rank: 1, quality: 20 },
      { id: 'revision', name: '需求確認', workload: 150, reward: 68, tags: ['簡報'], weight: 2, rank: 2, quality: 28 },
      { id: 'urgent', name: '急件', workload: 180, reward: 95, tags: ['客戶'], weight: 2, rank: 2, quality: 30 },
      { id: 'meeting', name: '會議資料整理', workload: 190, reward: 100, tags: ['報告'], weight: 2, rank: 3, quality: 40 },
    ].map(t=>({...t,rankWeights:workRankWeights[t.id]})).concat(newWorkTemplates) },
  followUps: { maxFollowUpDepth: 2, maxExtraTasksPerRootWork: 6, projectMaxExtraTasks: 10, qualityCountBands: [{ minimumRatio: 0, countMin: 2, countMax: 3 }, { minimumRatio: .8, countMin: 1, countMax: 2 }, { minimumRatio: 1.2, countMin: 1, countMax: 1 }],
    types: [
      { type: 'REWORK', name: '修正錯誤', qualitySensitive: true, chance: .35, workloadFactor: .65, rewardFactor: .04, countMin: 1, countMax: 2, delay: 0 },
      { type: 'CORRECTION', name: '再改格式', qualitySensitive: true, chance: .2, workloadFactor: .35, rewardFactor: .02, countMin: 1, countMax: 1, delay: 0 },
      { type: 'MISSING_INFO', name: '補漏資料', qualitySensitive: true, chance: .2, workloadFactor: .4, rewardFactor: 0, countMin: 1, countMax: 2, delay: 8 },
      { type: 'CLIENT_REPLY', name: '客戶回信', qualitySensitive: false, chance: .18, workloadFactor: .65, rewardFactor: .8, countMin: 1, countMax: 2, delay: 20 },
      { type: 'NEW_REQUEST', name: '追加需求', qualitySensitive: false, chance: .12, workloadFactor: .8, rewardFactor: .9, countMin: 1, countMax: 3, delay: 10 },
      { type: 'PROJECT_NEXT_STEP', name: '後續確認', qualitySensitive: false, chance: .08, workloadFactor: .5, rewardFactor: .6, countMin: 1, countMax: 1, delay: 0 },
    ] as { type: FollowUpType; name: string; qualitySensitive: boolean; chance: number; workloadFactor: number; rewardFactor: number; countMin: number; countMax: number; delay: number }[] },
  ranks: [
    { name: '新人', /* @deprecated legacy spreadsheet metadata; never a promotion condition or charge. */ promotionCost: 0, maxOverdueAllowed: 0, workloadMultiplier: 1, rewardMultiplier: 1, qualityMultiplier: 1, projectChance: .16, rankEscapeResistance: 0, recommendedSpeed: 10, recommendedQuality: 6 },
    { name: '一般員工', promotionCost: 220, maxOverdueAllowed: 3, workloadMultiplier: 1.25, rewardMultiplier: 2.2, qualityMultiplier: 1.2, projectChance: .22, rankEscapeResistance: 4, recommendedSpeed: 20, recommendedQuality: 12 },
    { name: '資深員工', promotionCost: 900, maxOverdueAllowed: 2, workloadMultiplier: 1.7, rewardMultiplier: 5, qualityMultiplier: 1.5, projectChance: .3, rankEscapeResistance: 9, recommendedSpeed: 40, recommendedQuality: 24 },
    { name: '主管', promotionCost: 2800, maxOverdueAllowed: 1, workloadMultiplier: 2.2, rewardMultiplier: 11, qualityMultiplier: 1.8, projectChance: .4, rankEscapeResistance: 14, recommendedSpeed: 80, recommendedQuality: 48 },
    { name: '經理', promotionCost: 9000, maxOverdueAllowed: 0, workloadMultiplier: 3, rewardMultiplier: 25, qualityMultiplier: 2.2, projectChance: .5, rankEscapeResistance: 20, recommendedSpeed: 160, recommendedQuality: 96 },
  ],
  projects: { maximumActive: 4, templates: [{ id: 'launch', weight: 1, rankRequirement: 0, enabled: true, name: '新品提案', tier: 1, reward: 600, deadlineDays: 3, subtasks: [
    { id: 'research', name: '資料蒐集', dependencies: [], workload: 140, reward: 40, qualityRequirement: 15 },
    { id: 'market', name: '市場分析', dependencies: ['research'], workload: 160, reward: 50, qualityRequirement: 18 },
    { id: 'data', name: '數據整理', dependencies: ['research'], workload: 120, reward: 35, qualityRequirement: 15 },
    { id: 'plan', name: '企劃草案', dependencies: ['market', 'data'], workload: 200, reward: 70, qualityRequirement: 20 },
    { id: 'slides', name: '提案簡報', dependencies: ['plan'], workload: 180, reward: 60, qualityRequirement: 22 },
    { id: 'review', name: '主管確認', dependencies: ['slides'], workload: 100, reward: 30, qualityRequirement: 20 },
    { id: 'revise', name: '提案修改', dependencies: ['review'], workload: 140, reward: 40, qualityRequirement: 22 },
    { id: 'final', name: '最終提案', dependencies: ['revise'], workload: 160, reward: 50, qualityRequirement: 25 },
  ] }].map(t=>({...t,rankWeights:[3,1.5,.8,.3,.1]})).concat(newProjectTemplates) },
  food: { processingRate: 30, allowWorkInterruption: true, items: [
    { id: 'normal', name: '普通便當', price: 0, requirement: 120, satietyDuration: 18, tags: ['餐點'], productId: '' },
    { id: 'quick', name: '快速飽足飲', price: 8, requirement: 20, satietyDuration: 25, tags: ['食品'], productId: 'quick' },
  ] },
  lunch: { fullRestTarget: 240, tiers: [
    { minimum: 0, name: '沒有休息到', speedBonus: 0 }, { minimum: .2, name: '稍微喘口氣', speedBonus: .04 }, { minimum: .5, name: '精神不錯', speedBonus: .1 }, { minimum: .8, name: '充分休息', speedBonus: .16 }, { minimum: 1, name: '神清氣爽', speedBonus: .22 },
  ] },
  life: { entertainmentRequirement: 8, minimumEntertainmentTime: 3, relaxedQuality: .15 },
  // PROVISIONAL: fixed sleep window; neutral output at ratio 1, capped above 1.1.
  sleep: { targetDuration: 18, effectCurve: [{ ratio: 0, speedModifier: -.30, qualityModifier: -.30 }, { ratio: .5, speedModifier: -.15, qualityModifier: -.15 }, { ratio: 1, speedModifier: 0, qualityModifier: 0 }, { ratio: 1.1, speedModifier: .05, qualityModifier: .05 }] },
  // PROVISIONAL rank resistance; formal attention and escape formulas.
  boss: { baseAttention: .10, flatteryAttentionPerLevel: .02, flatteryIncomePerLevel: .01, baseEscapeValue: 15, baseJobResistance: 85 },
  events: { interval: 18, baseChance: .25, definitions: [
    { id: 'eyes', ...context(['WORK']), requiredWorkTags: ['行政', '簡報', '報告', '客戶'], name: '眼睛酸澀', duration: 40, speedPenalty: -.12, qualityPenalty: -.08, severity: 1, tag: 'eyes', problemName: '用眼問題處理', problemRequirement: 4, interruptImmediately: false, priority: 30, protectionDuration: 20, protectionChanceMultiplier: 0 },
    { id: 'wound', ...context(['WORK', 'FOOD', 'ENTERTAINMENT', 'LUNCH']), name: '傷口事件', duration: 45, speedPenalty: -.18, qualityPenalty: 0, severity: 2, tag: 'wound', problemName: '傷口問題處理', problemRequirement: 4, interruptImmediately: true, priority: 80, protectionDuration: 15, protectionChanceMultiplier: .35 },
    { id: 'itch', ...context(['WORK', 'ENTERTAINMENT', 'SLEEP']), name: '搔癢事件', duration: 30, speedPenalty: -.1, qualityPenalty: 0, severity: 1, tag: 'itch', problemName: '搔癢問題處理', problemRequirement: 3, interruptImmediately: true, priority: 50, protectionDuration: 15, protectionChanceMultiplier: 0 },
    { id: 'tired', ...context(['WORK', 'ENTERTAINMENT'], false), name: '睡眠不足事件', duration: 40, speedPenalty: -.1, qualityPenalty: -.1, severity: 1, tag: 'sleep', problemName: '精神狀態整理', problemRequirement: 4, interruptImmediately: false, priority: 20, protectionDuration: 15, protectionChanceMultiplier: .5 },
  ] },
  products: { billingPeriodDays: 30, definitions: [
    { id: 'quick', name: '快速飽足飲', icon: '🥤', price: 80, effectType: 'FOOD_OPTION' as ProductEffectType, tags: ['food'], description: '啟用期間可選快速食物，每餐另付 $8。', offlineAgeProgressMultiplier: 1, rewardTagBonus: 0 },
    { id: 'wound', ...context(['WORK', 'FOOD', 'ENTERTAINMENT', 'LUNCH']), name: '傷口處理組', icon: '🩹', price: 95, effectType: 'PROBLEM_RESOLVER' as ProductEffectType, tags: ['wound'], description: '傷口遊戲事件轉為可快速處理的需求。', offlineAgeProgressMultiplier: 1, rewardTagBonus: 0 },
    { id: 'eyes', ...context(['WORK']), requiredWorkTags: ['行政', '簡報', '報告', '客戶'], name: '用眼休息組', icon: '👁', price: 85, effectType: 'PROBLEM_RESOLVER' as ProductEffectType, tags: ['eyes'], description: '處理用眼遊戲問題，短暫保護同類事件。', offlineAgeProgressMultiplier: 1, rewardTagBonus: 0 },
    { id: 'sleep', name: '晚安整理組', icon: '🌙', price: 90, effectType: 'PROBLEM_RESOLVER' as ProductEffectType, tags: ['sleep'], description: '處理睡眠類遊戲事件。', offlineAgeProgressMultiplier: 1, rewardTagBonus: 0 },
    { id: 'itch', ...context(['WORK', 'ENTERTAINMENT', 'SLEEP']), name: '舒適整理組', icon: '🍃', price: 75, effectType: 'PROBLEM_RESOLVER' as ProductEffectType, tags: ['itch'], description: '處理搔癢遊戲事件，短暫避免同類打斷。', offlineAgeProgressMultiplier: 1, rewardTagBonus: 0 },
    { id: 'agecare', ageEfficiencyCompensationRate: .5, name: '時光緩衝組', icon: '🌿', price: 120, effectType: 'OFFLINE_AGE_PROTECTION' as ProductEffectType, tags: ['age'], description: '有效期間離線年齡進度暫定減半。', offlineAgeProgressMultiplier: .5, rewardTagBonus: 0 },
    { id: 'care', name: '從容保養組', icon: '✨', price: 100, effectType: 'TAGGED_WORK_REWARD' as ProductEffectType, tags: ['形象', '簡報'], description: '對應工作標籤額外收入 +15%。', offlineAgeProgressMultiplier: 1, rewardTagBonus: .15 },
  ].map(p => ({ ...p, ageEfficiencyCompensationRate: (p as Partial<ProductDefinition>).ageEfficiencyCompensationRate ?? 0 })) as ProductDefinition[] },
  // Provisional runtime ageing: daysPerYear remains a balance input; Debug Set Age is separate.
  age: { start: 22, daysPerYear: 365, workloadCurve: [{ age: 22, multiplier: 1 }, { age: 30, multiplier: 1.1 }, { age: 40, multiplier: 1.25 }, { age: 50, multiplier: 1.45 }, { age: 60, multiplier: 1.7 }] },
  prestige: { minimumPrestigeActiveMinutes: 30, minimumRank: 2, minimumEarned: 1800, incomeDivisor: 4, incomeExponent: .65, rankBonus: 3, projectTierBonus: 2, progressDivisor: 100, healthyBonus: 1.2, severePenalty: .8, minimumReward: 1,
    upgrades: [permanent('workEfficiency', '工作效率'), permanent('workQuality', '工作品質'), permanent('workReward', '工作收入'), permanent('lifeManagement', '生活管理'), permanent('lunchOutput', '午休輸出'), permanent('projectReward', '專案獎金'), permanent('bossTaskReward', '老闆任務報酬'), permanent('startingMoney', '起始資金')] },
  offline: { minutesPerGameDay: 30 }, notifications: { seconds: 3, visibleLimit: 2, historyLimit: 400, queueLimit: 60 },
  save: { key: '012s:auto-worker:v2', legacyKey: '012s:auto-worker:v1', interval: 3 }, debug: { moneyGrant: 1000, clarityGrant: 30, maxValue: 100000000, maxLevel: 1000 },
};
