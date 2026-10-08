import { getDeadlineStatus, deadlineUrgency } from './deadline';
import type { State, Todo } from '../state/gameState';
import { random } from '../time/worldTime';
// One centralized priority + weighted selection; it never constructs new work.
export function selectNextWork(s: State, eligible: (t: Todo) => boolean = () => true): Todo | null {
  const pool = s.todoQueue.filter(eligible); if (!pool.length) return null;
  const urgency = (t: Todo) => deadlineUrgency[getDeadlineStatus(t, s.world.totalWorldTime)];
  const highest = Math.max(...pool.map(urgency)); const urgentPool = pool.filter(t => urgency(t) === highest);
  const top = Math.max(...urgentPool.map(t => t.priority)); const candidates = urgentPool.filter(t => t.priority === top);
  let weight = random(s) * candidates.reduce((n, t) => n + 1 / (1 + t.followUpDepth), 0);
  const chosen = candidates.find(t => (weight -= 1 / (1 + t.followUpDepth)) < 0) ?? candidates.at(-1)!;
  s.todoQueue.splice(s.todoQueue.findIndex(t => t.id === chosen.id), 1); return chosen;
}
