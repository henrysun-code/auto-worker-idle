import { planDeadline, startDeadline } from './deadline';
import { gameConfig as c } from '../../config/gameConfig';
import type { SourceType, State, Todo } from '../state/gameState';
import { newId, random } from '../time/worldTime';
import { createWorkloadSnapshot } from './ageWorkload';
import { getWorkTemplateWeight } from './templateWeights';
export type WorkTemplate = Omit<typeof c.work.templates[number], 'rankWeights'> & { rankWeights?:number[]; deadlineProfileId?: string; deadlineWorkdays?: number | null };
export function createTodo(s: State, j: WorkTemplate, sourceType: SourceType = 'NORMAL'): Todo {
  const id = newId(s, 'todo');
  const todo: Todo = { id, name: j.name, type: j.id === 'urgent' ? 'URGENT' : sourceType, sourceType, sourceId: j.id, rootId: id, ...createWorkloadSnapshot(s,j.workload), baseReward: j.reward, tags: [...j.tags], priority: j.id === 'urgent' ? c.work.priorities.URGENT : c.work.priorities[sourceType === 'EVENT' ? 'FOLLOW_UP' : sourceType], qualityRequirement: j.quality * c.ranks[s.career.rank].qualityMultiplier, createdAtWorldTime: null, assignmentWorkdayIndex: null, dueWorkdayIndex: null, deadlineWorkdays: null, deadlineProfileId: '', createdAt: s.world.totalWorldTime, followUpDepth: 0 };
  planDeadline(todo, j.deadlineProfileId, j.deadlineWorkdays); startDeadline(s, todo, s.world.totalWorldTime); return todo;
}
export function generateDailyWork(s: State, count = 1) {
  const pool = c.work.templates.filter(j => getWorkTemplateWeight(j,s.career.rank)>0); const sum = pool.reduce((n,j)=>n+getWorkTemplateWeight(j,s.career.rank),0);
  if(!pool.length)return;
  for (let i = 0; i < count; i++) { let weight = random(s) * sum; const j = pool.find(j => (weight -= getWorkTemplateWeight(j,s.career.rank)) < 0) ?? pool.at(-1)!; s.todoQueue.push(createTodo(s, j)); }
}
export function refillTodos(s: State) { if (s.todoQueue.length < c.work.todoLowWatermark) generateDailyWork(s, c.work.todoRefillTarget - s.todoQueue.length); }
