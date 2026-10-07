import { createWorkloadSnapshot } from '../work/ageWorkload';
import { planDeadline, startDeadline } from '../work/deadline';
import { gameConfig as c } from '../../config/gameConfig';
import type { Project, State, Todo } from '../state/gameState';
import { newId, random } from '../time/worldTime';
import { notify } from '../events/eventLog';
import { earn } from '../work/workStats';
import { permanentMultiplier } from '../prestige/permanentUpgrades';
import { getProjectTemplateWeight } from '../work/templateWeights';
export function unlockSubtasks(s: State, p: Project) {
  for (const sub of p.subtasks) if (sub.status === 'LOCKED' && sub.dependencies.every(id => p.subtasks.find(t => t.id === id)?.status === 'DONE')) {
    sub.status = 'QUEUED'; const todo: Todo = { id: newId(s, 'subtask'), name: sub.name, type: 'PROJECT', sourceType: 'PROJECT', sourceId: p.id, rootId: p.id, projectId: p.id, subtaskId: sub.id, ...createWorkloadSnapshot(s,sub.baseWorkload ?? sub.workload,sub.rankWorkloadMultiplierAtCreation ?? 1), baseReward: sub.reward, tags: ['專案', '簡報'], priority: c.work.priorities.PROJECT, qualityRequirement: sub.qualityRequirement, createdAtWorldTime: null, assignmentWorkdayIndex: null, dueWorkdayIndex: null, deadlineWorkdays: null, deadlineProfileId: '', createdAt: s.world.totalWorldTime, followUpDepth: 0 };
    const template = c.projects.templates.find(t => t.id === p.templateId) as typeof c.projects.templates[number] & { deadlineProfileId?: string; deadlineWorkdays?: number | null };
    planDeadline(todo, sub.deadlineProfileId ?? template.deadlineProfileId, sub.deadlineWorkdays === undefined ? template.deadlineWorkdays : sub.deadlineWorkdays); startDeadline(s, todo, s.world.totalWorldTime); s.todoQueue.push(todo);
  }
}
export function createProject(s: State, templateId = c.projects.templates[0].id) {
  if (s.projects.filter(p => p.status === 'ACTIVE').length >= c.projects.maximumActive) return null;
  const t = c.projects.templates.find(p => p.id === templateId)!;
  const p: Project = { id: newId(s, 'project'), templateId, name: t.name, tier: t.tier, status: 'ACTIVE', reward: t.reward * c.ranks[s.career.rank].rewardMultiplier, subtasks: t.subtasks.map(sub => ({ ...structuredClone(sub), baseWorkload: sub.workload, rankWorkloadMultiplierAtCreation: c.ranks[s.career.rank].workloadMultiplier, workload: sub.workload * c.ranks[s.career.rank].workloadMultiplier, qualityRequirement: sub.qualityRequirement * c.ranks[s.career.rank].qualityMultiplier, status: 'LOCKED' })), completedSubtasks: 0, dependencies: Object.fromEntries(t.subtasks.map(x => [x.id, [...x.dependencies]])), createdAt: s.world.totalWorldTime, deadline: s.world.totalWorldTime + t.deadlineDays * c.time.dayDuration };
  s.projects.push(p); unlockSubtasks(s, p); notify(s, '專案', `大型專案 ${p.name} 已加入，${p.subtasks.length} 個主要步驟。`, { projectId: p.id }); return p;
}
export function maybeSpawnProject(s: State) {
 if (random(s) >= c.ranks[s.career.rank].projectChance) return;
 const pool = c.projects.templates.filter(t => getProjectTemplateWeight(t,s.career.rank)>0);
 if (!pool.length) return;
 let weight = random(s) * pool.reduce((n,t)=>n+getProjectTemplateWeight(t,s.career.rank),0);
 const template = pool.find(t => (weight -= getProjectTemplateWeight(t,s.career.rank)) < 0) ?? pool.at(-1)!;
 createProject(s, template.id);
}
export function completeProjectSubtask(s: State, todo: Todo) {
  if (!todo.projectId || !todo.subtaskId) return;
  const p = s.projects.find(p => p.id === todo.projectId); const sub = p?.subtasks.find(t => t.id === todo.subtaskId);
  if (!p || !sub || sub.status === 'DONE') return; sub.status = 'DONE'; p.completedSubtasks++; unlockSubtasks(s, p);
  if (p.status === 'ACTIVE' && p.completedSubtasks === p.subtasks.length) { p.status = 'DELIVERED'; const amount = Math.round(p.reward * permanentMultiplier(s, 'projectReward')); earn(s, amount); s.runStatistics.projectsCompleted++; s.permanentStatistics.projectsCompleted++; s.runStatistics.highestProjectTier = Math.max(s.runStatistics.highestProjectTier, p.tier); notify(s, '專案', `${p.name} 主要交付完成，獎金 +$${amount}。`, { projectId: p.id }); }
}

export function updateProjectClosures(s: State) {
 for (const p of s.projects) if (p.status === 'DELIVERED') {
  const belongs = (t: Todo) => t.projectId === p.id;
  const open = s.todoQueue.some(belongs) || s.pendingFollowUps.some(x => x.tasksToCreate.some(belongs)) || (s.currentTarget?.type === 'WORK' && belongs(s.currentTarget.todo)) || s.suspendedTargets.some(x => x.target.type === 'WORK' && belongs(x.target.todo));
  if (!open) { p.status = 'CLOSED'; notify(s, '專案', `${p.name} 專案已結案。`, { projectId: p.id }); }
 }
}
