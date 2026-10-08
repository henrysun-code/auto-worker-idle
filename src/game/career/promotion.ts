import { gameConfig as c } from '../../config/gameConfig';
import type { State, Todo } from '../state/gameState';
import { notify } from '../events/eventLog';
import { getDeadlineStatus } from '../work/deadline';
export function getUnresolvedOverdueWorkCount(s: State) {
  const items: Todo[] = [...s.todoQueue];
  if (s.currentTarget?.type === 'WORK') items.push(s.currentTarget.todo);
  for (const entry of s.suspendedTargets) if (entry.target.type === 'WORK') items.push(entry.target.todo);
  const unique = new Map(items.map(t => [t.id,t]));
  return [...unique.values()].filter(t => getDeadlineStatus(t,s) === 'OVERDUE').length;
}
export function canPromote(s: State) {
  const next = c.ranks[s.career.rank+1];
  return !!next && getUnresolvedOverdueWorkCount(s) <= next.maxOverdueAllowed;
}

// Formal rank-up transaction shared by assessment completion and internal/debug tests.
export function promoteTransaction(s:State) {
 if(!canPromote(s))return false;
 const rank=c.ranks[s.career.rank+1];s.career.rank++;
 s.career.highestRank=Math.max(s.career.highestRank,s.career.rank);
 notify(s,'升職',`升職為 ${rank.name}，工作量、品質要求與專案壓力提高。`);return true;
}
