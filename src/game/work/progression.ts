import { gameConfig as c } from '../../config/gameConfig';
import type { UpgradeId } from '../state/gameState';
// Number-based runtime: saturate representation, never use Infinity or a level cap.
export function finiteExp(logValue: number) { return Math.exp(Math.min(Math.log(Number.MAX_VALUE) - 1e-12, logValue)); }
export function getRunUpgradeCost(id: UpgradeId, level: number) {
  const u = c.upgrades[id], curve = c.runUpgradeCurve;
  const value=u.baseCost*curve.baseGrowth**level*curve.post100Growth**Math.max(0,level-curve.softCap1)*curve.post200Growth**Math.max(0,level-curve.softCap2);
  return Math.ceil(Number.isFinite(value)?value:Number.MAX_VALUE);
}
