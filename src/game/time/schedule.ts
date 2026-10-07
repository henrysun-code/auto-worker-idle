import { gameConfig as c } from '../../config/gameConfig';
import type { State } from '../state/gameState';
import { routineAnchor } from './worldTime';
export const phaseLabels = { BREAKFAST: '早餐', MORNING: '上午工作', LUNCH_FOOD: '午餐', LUNCH: '午休', AFTERNOON: '下午工作', DINNER: '晚餐', ENTERTAINMENT: '娛樂', SLEEP: '睡眠中', WAIT: '等天亮' };
export function scheduleStatus(s: State) {
  const phase = s.needs.phase;
  const next = phase === 'MORNING' || phase === 'BREAKFAST' ? { label: '午休開始', time: routineAnchor(s, c.time.lunchStart) } : phase === 'LUNCH' || phase === 'LUNCH_FOOD' ? { label: '午休結束', time: routineAnchor(s, c.time.lunchStart + c.time.lunchDuration) } : phase === 'AFTERNOON' ? { label: '下班', time: routineAnchor(s, c.time.offWorkAnchor) } : phase === 'SLEEP' || phase === 'WAIT' ? { label: '次日作息', time: s.needs.sleep.windowEnd } : { label: '就寢', time: routineAnchor(s, c.time.sleepAnchor) };
  const remaining = next.time - s.world.totalWorldTime; return { label: next.label, seconds: Math.abs(remaining), delayed: remaining < 0 };
}
