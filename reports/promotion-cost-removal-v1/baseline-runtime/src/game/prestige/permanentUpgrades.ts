import { gameConfig as c } from '../../config/gameConfig';
import type { PermanentId, State } from '../state/gameState';
import { finiteExp } from '../work/progression';
export function getPermanentMultiplier(id: PermanentId, level: number) { return finiteExp(level * Math.log(c.prestige.upgrades.find(u=>u.id===id)!.multiplierBase)); }
export function permanentMultiplier(s: State, id: PermanentId) { return getPermanentMultiplier(id,s.prestige.levels[id]); }
export function getPrestigeUpgradeCost(id: PermanentId, level: number) { const u=c.prestige.upgrades.find(u=>u.id===id)!; return Math.ceil(finiteExp(Math.log(u.baseCost)+level*Math.log(u.costGrowth))); }
export function buyPermanent(s: State, id: PermanentId) { if (!c.prestige.upgrades.some(u=>u.id===id)) return false; const cost=getPrestigeUpgradeCost(id,s.prestige.levels[id]); if(s.prestige.clarity<cost)return false; s.prestige.clarity-=cost; s.prestige.levels[id]++; return true; }
