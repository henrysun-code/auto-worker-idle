import { gameConfig as c } from '../../config/gameConfig';
import type { State } from '../state/gameState';
import { initialState } from '../state/initialState';
import { permanentMultiplier } from './permanentUpgrades';
import { notify } from '../events/eventLog';
export const canPrestige = (s: State) => s.runStatistics.activeSeconds >= c.prestige.minimumPrestigeActiveMinutes*60 && (s.prestige.forcedReady || s.career.highestRank >= c.prestige.minimumRank && s.runStatistics.earned >= c.prestige.minimumEarned);
export function calculateClarityReward(s: State) {
  const severe = s.debuffs.some(d => d.severity >= 2); const healthy = !s.debuffs.length;
  const base = (s.runStatistics.peakIncome / c.prestige.incomeDivisor) ** c.prestige.incomeExponent + s.career.highestRank * c.prestige.rankBonus + s.runStatistics.highestProjectTier * c.prestige.projectTierBonus + s.runStatistics.completedWork / c.prestige.progressDivisor;
  return Math.max(c.prestige.minimumReward, Math.floor(base * (severe ? c.prestige.severePenalty : healthy ? c.prestige.healthyBonus : 1)));
}
export function prestigeReset(s: State, force = false) {
  if (!force && !canPrestige(s)) return false;
  const reward = calculateClarityReward(s); const next = initialState(s.world.rng);
  next.prestige.clarity = s.prestige.clarity + reward; next.prestige.levels = { ...s.prestige.levels };
  next.permanentStatistics = { ...s.permanentStatistics, runs: s.permanentStatistics.runs + 1, clarityEarned: s.permanentStatistics.clarityEarned + reward };
  next.promotion.lowProfileEnabled=false; next.player.settings = { ...s.player.settings }; next.player.money = c.economy.startingMoney * permanentMultiplier(next, 'startingMoney');
  next.eventLog = [...s.eventLog]; next.world.sequence = s.world.sequence; next.offline.offlineCarryMinutes = s.offline.offlineCarryMinutes;
  Object.assign(s, next); notify(s, 'Prestige', `該醒了，別做夢了。獲得 ${reward} 清醒值，永久倍率已保留。`); return true;
}
