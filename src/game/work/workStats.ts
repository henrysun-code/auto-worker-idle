import { resolveTaggedRewardBonus } from '../products/productEffects';
import { getRunUpgradeCost } from './progression';
import { ageProductEfficiencyBonus, getAgeWorkloadMultiplier } from './ageWorkload';
import { getDeadlineStatus, getCompletionDeadlineStatus } from './deadline';
import { gameConfig as c } from '../../config/gameConfig';
import type { State, Todo, UpgradeId } from '../state/gameState';
import { temporaryMultiplier } from '../buffs/buffManager';
import { permanentMultiplier } from '../prestige/permanentUpgrades';
export const upgradeCost = (s: State, id: UpgradeId) => getRunUpgradeCost(id, s.player.upgrades[id]);
export const rawWorkSpeed = (s: State) => c.economy.baseWorkSpeed + s.player.upgrades.efficiency;
export const rawWorkQuality = (s: State) => c.economy.baseQuality + s.player.upgrades.quality;
export const effectiveWorkSpeed = (s: State) => rawWorkSpeed(s) * permanentMultiplier(s, 'workEfficiency') * temporaryMultiplier(s, 'workSpeed') * (1 + ageProductEfficiencyBonus(s));
export const effectiveWorkQuality = (s: State) => rawWorkQuality(s) * permanentMultiplier(s, 'workQuality') * temporaryMultiplier(s, 'quality');
export const effectiveLifeSpeed = (s: State) => (c.economy.baseLifeSpeed + getLifeManagementValue(s) * c.lifeConversion.speedPerRaw) * permanentMultiplier(s, 'lifeManagement') * temporaryMultiplier(s, 'lifeSpeed');
export const restOutput = (s: State) => (c.economy.baseRestOutput + getLunchLifeManagementEffect(s)) * permanentMultiplier(s, 'lifeManagement') * permanentMultiplier(s, 'lunchOutput') * temporaryMultiplier(s, 'lunchOutput');
export function refreshStats(s: State) { s.stats = { workSpeed: effectiveWorkSpeed(s), workQuality: effectiveWorkQuality(s), lifeSpeed: effectiveLifeSpeed(s), restOutput: restOutput(s) }; }
export const workloadDifficulty = (s: State) => c.ranks[s.career.rank].workloadMultiplier * getAgeWorkloadMultiplier(s.player.age);
function rawWorkReward(s: State, task: Todo, excludeProductId?: string) {
  const bonus=resolveTaggedRewardBonus(s,task.tags,excludeProductId);
  return task.baseReward * c.ranks[s.career.rank].rewardMultiplier * (1 + s.player.upgrades.flattery * c.boss.flatteryIncomePerLevel) * permanentMultiplier(s, 'workReward') * (task.sourceType === 'BOSS' ? permanentMultiplier(s, 'bossTaskReward') : 1) * (1 + bonus);
}
export const originalWorkReward = (s: State, task: Todo) => Math.round(rawWorkReward(s, task));
export function workReward(s: State, task: Todo, excludeProductId?: string, completion = false) { return Math.round(rawWorkReward(s, task, excludeProductId) * ((completion ? getCompletionDeadlineStatus(task,s.world.totalWorldTime) : getDeadlineStatus(task, s.world.totalWorldTime)) === 'OVERDUE' ? c.deadlines.overdueRewardMultiplier : 1)); }
export function averageIncome(s: State) { const window = scaledIncomeWindow(); return s.runStatistics.incomeSamples.filter(x => x.time > s.world.totalWorldTime - window).reduce((n, x) => n + x.amount, 0) / Math.max(.01, Math.min(window, s.world.totalWorldTime)); }
const scaledIncomeWindow = () => c.economy.incomeWindow * c.time.dayDuration / c.time.referenceDayDuration;
export function earn(s: State, amount: number) { s.player.money += amount; s.runStatistics.earned += amount; s.runStatistics.incomeSamples.push({ time: s.world.totalWorldTime, amount }); s.runStatistics.incomeSamples = s.runStatistics.incomeSamples.filter(x => x.time > s.world.totalWorldTime - scaledIncomeWindow()); s.runStatistics.peakIncome = Math.max(s.runStatistics.peakIncome, averageIncome(s)); }

export const getLifeManagementValue = (s: State) => s.player.upgrades.lifeManagement;
export const getLunchLifeManagementEffect = (s: State) => getLifeManagementValue(s) * c.lifeConversion.lunchOutputPerRaw;
