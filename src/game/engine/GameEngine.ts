import { gameConfig as c } from '../../config/gameConfig';
import type { Action, Notice, State } from '../state/gameState';
import { advance } from './SimulationLoop';
import { applyAction } from './actions';
import { initialState } from '../state/initialState';
import { loadGame, resetSave, saveGame } from '../save/saveGame';
import { notify } from '../events/eventLog';
export class GameEngine {
  state: State; toasts: (Notice & { remaining: number })[] = []; saveError: string | null;
  private listeners = new Set<() => void>(); private revision = 0; private timer: ReturnType<typeof setInterval> | undefined; private saveElapsed = 0;
  constructor() { const loaded = loadGame(); this.state = loaded.state; this.state.notifications = this.state.notifications.filter(n => n.type !== '老闆'); this.saveError = loaded.error; this.persist(); }
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => this.listeners.delete(listener); };
  getSnapshot = () => this.revision;
  private publish() { this.revision++; this.listeners.forEach(l => l()); }
  private persist = () => { if (!saveGame(this.state)) this.saveError = '瀏覽器無法儲存進度。'; };
  private lifecycle(name: 'gameStart' | 'gameComplete', results?: object, duration = this.state.world.totalWorldTime) { window.dispatchEvent(new CustomEvent(`012s:${name}`, { detail: { gameId: c.gameId, version: c.version, timestamp: Date.now(), duration, results } })); }
  start() {
    if (this.timer) return;
    if (!this.state.eventLog.length) notify(this.state, '工作', 'V2 作息開始：效率清待辦，品質減少返工。');
    this.lifecycle('gameStart'); let previous = performance.now();
    this.timer = setInterval(() => {
      const now = performance.now(); const realDelta = Math.max(0, (now - previous) / 1000); previous = now;
      advance(this.state, realDelta * this.state.player.settings.speed, { activeSeconds: realDelta });
      this.toasts = this.toasts.map(n => ({ ...n, remaining: n.remaining - realDelta })).filter(n => n.remaining > 0);
      // Boss outcomes describe the current transition; display them immediately rather than behind old work notices.
      const boss = [...this.state.notifications].reverse().find(n => n.type === '老闆');
      if (boss) {

        this.state.notifications = this.state.notifications.filter(n => n.type !== '老闆');
        this.toasts = this.toasts.filter(n => n.type !== '老闆');
        if (this.toasts.length >= c.notifications.visibleLimit) {
          const displaced = this.toasts.pop()!; const { remaining: _remaining, ...notice } = displaced;
          this.state.notifications.unshift(notice);
        }
        this.toasts.unshift({ ...boss, remaining: c.notifications.seconds });
      }
      while (this.toasts.length < c.notifications.visibleLimit && this.state.notifications.length) this.toasts.push({ ...this.state.notifications.shift()!, remaining: c.notifications.seconds });
      this.saveElapsed += realDelta; if (this.saveElapsed >= c.save.interval) { this.persist(); this.saveElapsed = 0; } this.publish();
    }, c.time.tickSeconds * 1000);
    window.addEventListener('pagehide', this.persist);
  }
  stop() { clearInterval(this.timer); this.timer = undefined; this.persist(); window.removeEventListener('pagehide', this.persist); }
  dispatch = (action: Action) => {
    const before = { duration: this.state.world.totalWorldTime, peakIncome: this.state.runStatistics.peakIncome, highestRank: this.state.career.highestRank, clarity: this.state.prestige.clarity, runs: this.state.permanentStatistics.runs };
    const accepted = applyAction(this.state, action);
    if (accepted && this.state.permanentStatistics.runs !== before.runs) { this.toasts = []; this.lifecycle('gameComplete', { ...before, clarityEarned: this.state.prestige.clarity - before.clarity }, before.duration); this.lifecycle('gameStart'); }
    if (accepted) this.persist(); this.publish(); return accepted;
  };
  resetAll = () => { if (!resetSave()) { this.saveError = '無法清除本機存檔。'; this.publish(); return; } this.state = initialState(); this.toasts = []; this.saveError = null; notify(this.state, '工作', 'V2 測試存檔已重置。'); this.persist(); this.lifecycle('gameStart'); this.publish(); };
}

