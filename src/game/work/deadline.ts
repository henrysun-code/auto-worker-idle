import { gameConfig as c } from '../../config/gameConfig';
import type { State, Todo } from '../state/gameState';
import { scaledSeconds } from '../time/worldTime';
import { notify } from '../events/eventLog';
export type DeadlineProfile = typeof c.deadlines.profiles[number];
export type DeadlineStatus = 'NORMAL' | 'DUE_TODAY' | 'OVERDUE' | 'NO_DEADLINE';
export const deadlineUrgency = { NORMAL: 0, NO_DEADLINE: 0, DUE_TODAY: 1, OVERDUE: 2 };
export const workStartOffset = () => scaledSeconds(c.time.workStartAnchor);
export const getDeadlineWorkdayIndex = (time: number) => Math.floor((time - workStartOffset()) / c.time.dayDuration);
export function getAssignmentWorkdayIndex(time: number) {
  const calendar = Math.floor(time / c.time.dayDuration), offset = time - calendar * c.time.dayDuration;
  return calendar + (offset >= scaledSeconds(c.time.offWorkAnchor) ? 1 : 0);
}
export const nextWorkStart = (time: number) => (getDeadlineWorkdayIndex(time) + 1) * c.time.dayDuration + workStartOffset();
export function resolveDeadlineProfile(todo: Pick<Todo, 'sourceType'> & Partial<Pick<Todo, 'type' | 'followUpType'>>, override?: string): DeadlineProfile {
  const key = todo.followUpType ?? (todo.type === 'URGENT' ? 'URGENT' : todo.sourceType);
  const id = override ?? c.deadlines.workTypeProfiles[key] ?? c.deadlines.defaultProfileId;
  const profile = c.deadlines.profiles.find(p => p.id === id);
  if (!profile) throw Error(`Unknown Deadline Profile: ${id}`);
  return profile;
}
export function planDeadline(todo: Todo, override?: string, days?: number | null) {
  const p = resolveDeadlineProfile(todo, override); todo.deadlineProfileId = p.id;
  todo.deadlineWorkdays = days === undefined ? p.deadlineWorkdays : days;
  todo.createdAtWorldTime = null; todo.assignmentWorkdayIndex = null; todo.dueWorkdayIndex = null;
}
export function startDeadline(_s: State, todo: Todo, now: number) {
  if (todo.assignmentWorkdayIndex !== null && todo.assignmentWorkdayIndex !== undefined) return;
  todo.createdAt = now; todo.createdAtWorldTime = now; todo.assignmentWorkdayIndex = getAssignmentWorkdayIndex(now);
  todo.dueWorkdayIndex = todo.deadlineWorkdays === null ? null : todo.assignmentWorkdayIndex + todo.deadlineWorkdays;
}
export function getDeadlineStatus(todo: Todo, stateOrTime: State | number): DeadlineStatus {
  if (todo.dueWorkdayIndex === null) return 'NO_DEADLINE';
  const day = getDeadlineWorkdayIndex(typeof stateOrTime === 'number' ? stateOrTime : stateOrTime.world.totalWorldTime);
  return day > todo.dueWorkdayIndex ? 'OVERDUE' : day === todo.dueWorkdayIndex ? 'DUE_TODAY' : 'NORMAL';
}
// Completion is resolved before the simultaneous workday boundary. Only that exact instant receives full pay.
export function getCompletionDeadlineStatus(todo: Todo, time: number): DeadlineStatus {
  if (todo.dueWorkdayIndex !== null && Number(time.toFixed(10)) === Number(((todo.dueWorkdayIndex + 1) * c.time.dayDuration + workStartOffset()).toFixed(10))) return 'DUE_TODAY';
  return getDeadlineStatus(todo,time);
}
export function deadlineCounts(todos: Todo[], now: number) {
  return { total: todos.length, dueToday: todos.filter(t => getDeadlineStatus(t, now) === 'DUE_TODAY').length, overdue: todos.filter(t => getDeadlineStatus(t, now) === 'OVERDUE').length };
}
export function deadlineLabel(todo: Todo, now: number) {
  if (todo.assignmentWorkdayIndex === null) return '尚未釋出';
  const status = getDeadlineStatus(todo,now);
  if (status === 'NO_DEADLINE') return '無期限';
  if (status === 'OVERDUE') return '🔴 已逾期';
  if (status === 'DUE_TODAY') return '⚠ 今日到期';
  const days = todo.dueWorkdayIndex! - getDeadlineWorkdayIndex(now);
  return days === 1 ? '正常・明天到期' : `正常・${days} 個工作天後到期`;
}
export function notifyDeadlineWorkday(s: State) {
  const day = getDeadlineWorkdayIndex(s.world.totalWorldTime);
  if (day < 0 || s.world.lastDeadlineNoticeWorkday === day) return;
  s.world.lastDeadlineNoticeWorkday = day;
  const counts = deadlineCounts(s.todoQueue,s.world.totalWorldTime);
  if (counts.dueToday || counts.overdue) notify(s,'工作',`今天有 ${counts.dueToday} 件工作到期；目前有 ${counts.overdue} 件工作已逾期。`);
}
