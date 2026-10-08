import { gameConfig as c } from '../../config/gameConfig';
import type { Notice, NoticeType, State } from '../state/gameState';
import { newId } from '../time/worldTime';
export function notify(s: State, type: NoticeType, text: string, source: Partial<Pick<Notice, 'sourceId' | 'productId' | 'workId' | 'projectId'>> = {}, showToast = true) {
  const n: Notice = { id: newId(s, 'notice'), day: s.world.dayIndex + 1, time: s.world.timeOfDay, type, text, ...source };
  s.eventLog.push(n); if (showToast) s.notifications.push(n);
  s.eventLog = s.eventLog.slice(-c.notifications.historyLimit); s.notifications = s.notifications.slice(-c.notifications.queueLimit);
}
