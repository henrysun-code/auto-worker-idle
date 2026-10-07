import { gameConfig as c } from '../../config/gameConfig';
import type { State } from '../state/gameState';
export const scaledSeconds = (seconds: number) => seconds * c.time.dayDuration / c.time.referenceDayDuration;
export const dayIndexAt = (time: number) => Math.floor((time + 1e-9) / c.time.dayDuration);
export function syncWorld(s: State) { s.world.dayIndex = dayIndexAt(s.world.totalWorldTime); s.world.timeOfDay = Math.max(0, s.world.totalWorldTime - s.world.dayIndex * c.time.dayDuration); }
export function random(s: State) { s.world.rng = (Math.imul(1664525, s.world.rng) + 1013904223) >>> 0; return s.world.rng / 4294967296; }
export const newId = (s: State, prefix: string) => `${prefix}-${++s.world.sequence}`;
export const routineAnchor = (s: State, seconds: number) => s.needs.routineDay * c.time.dayDuration + scaledSeconds(seconds);
