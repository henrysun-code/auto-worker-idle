import { gameConfig as c } from '../../config/gameConfig';
import type { Buff, Modifiers, State } from '../state/gameState';
export function temporaryMultiplier(s: State, key: keyof Modifiers) { return Math.max(c.economy.minimumStatMultiplier, 1 + [...s.buffs.filter(b => b.expiresAt >= s.world.totalWorldTime - 1e-8), ...s.debuffs.filter(b => b.expiresAt >= s.world.totalWorldTime - 1e-8)].reduce((n, b) => n + (b.modifiers[key] ?? 0), 0)); }
export function addBuff(s: State, buff: Buff) { s.buffs = s.buffs.filter(b => b.id !== buff.id); s.buffs.push(buff); }
export function expireEffects(s: State) { const now = s.world.totalWorldTime; s.buffs = s.buffs.filter(b => b.expiresAt > now + 1e-8); s.debuffs = s.debuffs.filter(b => b.expiresAt > now + 1e-8); s.debuffs.forEach(b => b.remainingDuration = Math.max(0, b.expiresAt - now)); }
