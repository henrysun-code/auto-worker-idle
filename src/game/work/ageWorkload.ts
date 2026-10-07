import { resolveAgeCompensationRate, resolveOfflineAgeMultiplier } from '../products/productEffects';
import { gameConfig as c } from '../../config/gameConfig';
import type { State, Todo } from '../state/gameState';
export function getAgeWorkloadMultiplier(age: number) {
  return [...c.age.workloadCurve].reverse().find(p => Number(age.toFixed(10)) >= p.age)?.multiplier ?? c.age.workloadCurve[0].multiplier;
}
export function createWorkloadSnapshot(s: State, baseWorkload: number, rankMultiplier = c.ranks[s.career.rank].workloadMultiplier) {
  const ageWorkloadMultiplierAtCreation = getAgeWorkloadMultiplier(s.player.age);
  return { baseWorkload, rankWorkloadMultiplierAtCreation: rankMultiplier, ageWorkloadMultiplierAtCreation, workload: baseWorkload * rankMultiplier * ageWorkloadMultiplierAtCreation };
}
export function getBaseWorkload(todo: Todo) {
  // Respect old/debug work whose workload was changed without matching snapshot fields.
  const expected = todo.baseWorkload * todo.rankWorkloadMultiplierAtCreation * todo.ageWorkloadMultiplierAtCreation;
  return Math.abs(expected - todo.workload) < 1e-8 ? todo.baseWorkload : todo.workload / (todo.rankWorkloadMultiplierAtCreation || 1) / (todo.ageWorkloadMultiplierAtCreation || 1);
}
export function ageProductEfficiencyBonus(s: State, productId?: string) {
  const rate = resolveAgeCompensationRate(s,productId);
  return Math.max(0,getAgeWorkloadMultiplier(s.player.age)-1) * rate;
}
export function nextAgeWorkloadBoundary(s: State, offline: boolean) {
  const next = c.age.workloadCurve.find(p => p.age > Number(s.player.age.toFixed(10)));
  if (!next) return Infinity;
  let ageRate = 1;
  if (offline) ageRate=resolveOfflineAgeMultiplier(s);
  return ageRate > 0 ? s.world.totalWorldTime + Math.max(0,(next.age-c.age.start)*c.age.daysPerYear-s.player.ageProgressDays)*c.time.dayDuration/ageRate : Infinity;
}
