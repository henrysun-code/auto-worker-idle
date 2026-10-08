import { gameConfig as c } from '../../config/gameConfig';
import type { PermanentId, State, UpgradeId } from './gameState';
import { createProductSubscription } from '../products/productManager';
import { scaledSeconds } from '../time/worldTime';
import { emptyPromotion } from '../career/promotionAssignment';
import { emptyMeetings } from '../targets/meetingTarget';
export function initialState(seed = Date.now() >>> 0, now = Date.now()): State {
  return {
    promotion: emptyPromotion(),
    meetings: emptyMeetings(),
    saveVersion: 2, coreVersion: 'todo-v2', world: { dayDurationAtSave:c.time.dayDuration, totalWorldTime: 0, dayIndex: 0, timeOfDay: 0, rng: seed || 1, sequence: 0, nextEventAt: scaledSeconds(c.events.interval) },
    player: { money: c.economy.startingMoney, age: c.age.start, ageProgressDays: 0, upgrades: Object.fromEntries(Object.keys(c.upgrades).map(id => [id, 0])) as Record<UpgradeId, number>, settings: { speed: 1, defaultFoodId: 'normal', reducedMotion: false } },
    career: { rank: 0, highestRank: 0 }, stats: { workSpeed: c.economy.baseWorkSpeed, workQuality: c.economy.baseQuality, lifeSpeed: c.economy.baseLifeSpeed, restOutput: c.economy.baseRestOutput },
    todoQueue: [], pendingFollowUps: [], projects: [], currentTarget: null, suspendedTargets: [], needs: { phase: 'BREAKFAST', routineDay: 0, bossChecked: false, lunchSettled: false, lunchRest: 0, satietyUntil: 0, sleep: { windowStart: scaledSeconds(c.time.sleepAnchor), windowEnd: c.time.dayDuration + scaledSeconds(c.time.workStartAnchor), duration: 0, output: 0, settled: false, lastRatio: 0, speedModifier: 0, qualityModifier: 0 }, pendingBossId: null, breakfastState: 'PENDING', projectRollProcessedRoutineId: null }, buffs: [], debuffs: [],
    products: Object.fromEntries(c.products.definitions.map(p => [p.id, createProductSubscription(p)])),
    prestige: { clarity: 0, levels: Object.fromEntries(c.prestige.upgrades.map(u => [u.id, 0])) as Record<PermanentId, number>, forcedReady: false }, notifications: [], eventLog: [],
    runStatistics: { activeSeconds: 0, earned: 0, completedWork: 0, reworkCount: 0, projectsCompleted: 0, highestProjectTier: 0, peakIncome: 0, incomeSamples: [], rootExtraTasks: {}, offlineDays: 0 }, permanentStatistics: { runs: 0, clarityEarned: 0, completedWork: 0, projectsCompleted: 0 },
    offline: { lastSeenAt: now, offlineCarryMinutes: 0, lastSettlement: null, lastOfflineSummary: null, summaryDismissed: false },
  };
}
