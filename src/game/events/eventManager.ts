import { gameConfig as c } from '../../config/gameConfig';
import type { State, Target } from '../state/gameState';
import { newId, random, scaledSeconds } from '../time/worldTime';
import { notify } from './eventLog';
type EventDefinition = typeof c.events.definitions[number];
export function eventEligible(s: State, e: EventDefinition) {
 const type = s.currentTarget?.type;
 if (!type || e.allowedTargetTypes.length && !e.allowedTargetTypes.includes(type) || e.blockedTargetTypes.includes(type)) return false;
 if (e.allowedRanks.length && !e.allowedRanks.includes(s.career.rank)) return false;
 if (e.allowedTimeRanges.length && !e.allowedTimeRanges.some(r => s.world.timeOfDay >= scaledSeconds(r.start) && s.world.timeOfDay < scaledSeconds(r.end))) return false;
 if (e.requiredWorkTags.length && (s.currentTarget?.type !== 'WORK' || !e.requiredWorkTags.some(tag => s.currentTarget?.type === 'WORK' && s.currentTarget.todo.tags.includes(tag)))) return false;
 return true;
}
export function triggerEvent(s: State, type: string, forced = false) {
 const e = c.events.definitions.find(e => e.id === type); if (!e) return null;
 if (!forced) {
  if (!eventEligible(s, e)) return null;
  const protection = e.blockedByProtection ? s.buffs.filter(b => b.protectionTag === e.tag && b.expiresAt > s.world.totalWorldTime).reduce((n, b) => n * (b.eventChanceMultiplier ?? 1), 1) : 1;
  if (random(s) >= protection || s.debuffs.some(d => d.type === type)) return null;
 }
 const duration = scaledSeconds(e.duration); const context = s.currentTarget?.type as Target['type'] | undefined;
 const modifiers = { workSpeed: e.speedPenalty, quality: e.qualityPenalty, ...(context ? e.contextModifiers[context] : {}) };
 const d = { id: newId(s, 'debuff'), type, name: e.name, sourceEvent: e.id, duration, remainingDuration: duration, expiresAt: s.world.totalWorldTime + duration, modifiers, resolvableByProductTag: e.tag, severity: e.severity, createdAt: s.world.totalWorldTime };
 s.debuffs.push(d); notify(s, 'Debuff', `${e.name}，持續 ${duration.toFixed(1)} 世界秒。`, { sourceId: d.id }); return d;
}
export function rollEvent(s: State) {
 const pool = c.events.definitions.filter(e => e.randomEnabled && eventEligible(s, e));
 if (pool.length && random(s) < c.events.baseChance) triggerEvent(s, pool[Math.floor(random(s) * pool.length)].id);
}
