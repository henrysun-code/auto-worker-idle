import { createWorkloadSnapshot, getBaseWorkload } from './ageWorkload';
import { planDeadline, startDeadline } from './deadline';
import { gameConfig as c } from '../../config/gameConfig';
import type { FollowUpType, State, Todo } from '../state/gameState';
import { newId, random, scaledSeconds } from '../time/worldTime';
import { notify } from '../events/eventLog';
import { followUpChance, followUpCount } from './workQuality';
export function createFollowUp(s: State, source: Todo, type: FollowUpType, count: number, delay: number) {
  if (source.followUpDepth >= c.followUps.maxFollowUpDepth) return [];
  const rule = c.followUps.types.find(f => f.type === type)!; const root = source.projectId ?? source.rootId;
  const used = s.runStatistics.rootExtraTasks[root] ?? 0; const cap = source.projectId ? c.followUps.projectMaxExtraTasks : c.followUps.maxExtraTasksPerRootWork;
  const tasks: Todo[] = [];
  for (let i = 0; i < Math.min(count, Math.max(0, cap - used)); i++) tasks.push({ ...source, id: newId(s, 'follow'), name: rule.name + ' · ' + source.name.split(' · ').at(-1), type, sourceType: 'FOLLOW_UP', sourceId: source.id, subtaskId: undefined, ...createWorkloadSnapshot(s,getBaseWorkload(source) * rule.workloadFactor,source.rankWorkloadMultiplierAtCreation ?? 1), baseReward: Math.round(source.baseReward * rule.rewardFactor), priority: c.work.priorities.FOLLOW_UP, createdAt: s.world.totalWorldTime, followUpDepth: source.followUpDepth + 1, followUpType: type });
  for (const t of tasks) { delete t.mandatoryOvertime; delete t.bossSeverity; planDeadline(t, (rule as { deadlineProfileId?: string }).deadlineProfileId, (rule as { deadlineWorkdays?: number | null }).deadlineWorkdays); if (delay <= 0) startDeadline(s, t, s.world.totalWorldTime); }
  s.runStatistics.rootExtraTasks[root] = used + tasks.length;
  if (!tasks.length) return tasks;
  if (delay > 0) s.pendingFollowUps.push({ id: newId(s, 'pending'), sourceWorkId: source.id, sourceProjectId: source.projectId, triggerAtWorldTime: s.world.totalWorldTime + scaledSeconds(delay), followUpType: type, tasksToCreate: tasks, depth: source.followUpDepth + 1 });
  else { s.todoQueue.push(...tasks); notify(s, '工作', `${rule.name}，待辦 +${tasks.length}`, { workId: source.id, projectId: source.projectId }); }
  return tasks;
}
export function generateFollowUps(s: State, source: Todo) {
  for (const rule of c.followUps.types) if (random(s) < followUpChance(s, source, rule)) createFollowUp(s, source, rule.type, followUpCount(s, source, rule, random(s)), rule.delay);
}
export function releasePending(s: State, force = false) {
  const ready = s.pendingFollowUps.filter(p => force || p.triggerAtWorldTime <= s.world.totalWorldTime + 1e-8);
  s.pendingFollowUps = s.pendingFollowUps.filter(p => !ready.includes(p));
  for (const p of ready) { p.tasksToCreate.forEach(t => { Object.assign(t,createWorkloadSnapshot(s,getBaseWorkload(t),t.rankWorkloadMultiplierAtCreation ?? 1)); startDeadline(s, t, s.world.totalWorldTime); }); s.todoQueue.push(...p.tasksToCreate); notify(s, '工作', `${c.followUps.types.find(f => f.type === p.followUpType)!.name}，待辦 +${p.tasksToCreate.length}`, { workId: p.sourceWorkId, projectId: p.sourceProjectId }); }
}
