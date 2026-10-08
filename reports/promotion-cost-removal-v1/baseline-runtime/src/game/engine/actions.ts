import { promoteTransaction } from '../career/promotion';
import { gameConfig as c } from '../../config/gameConfig';
import type { Action, State } from '../state/gameState';
import { upgradeCost, refreshStats } from '../work/workStats';
import { toggleProduct } from '../products/productManager';
import { buyPermanent } from '../prestige/permanentUpgrades';
import { prestigeReset } from '../prestige/prestigeManager';
import { notify } from '../events/eventLog';
import { debugAction } from './debugActions';
export function applyAction(s: State, a: Action) {
  let accepted = false;
  if(a.type==='lowProfile'){s.promotion.lowProfileEnabled=a.value;accepted=true;}
  else if (a.type === 'upgrade') { const cost = upgradeCost(s, a.id); if (s.player.money >= cost) { s.player.money -= cost; s.player.upgrades[a.id]++; accepted = true; } }
  else if (a.type === 'permanent') accepted = buyPermanent(s, a.id);
  else if (a.type === 'product') accepted = toggleProduct(s, a.id);
  else if (a.type === 'food') { const food = c.food.items.find(f => f.id === a.id); if (food && (!food.productId || s.products[food.productId]?.active)) { s.player.settings.defaultFoodId = food.id; accepted = true; } }
  else if (a.type === 'speed') { if (c.time.speeds.includes(a.value)) { s.player.settings.speed = a.value; accepted = true; } }
  else if (a.type === 'dismissOffline') { s.offline.summaryDismissed = true; accepted = true; }
  else if (a.type === 'motion') { s.player.settings.reducedMotion = a.value; accepted = true; }
  else if (a.type === 'promote') accepted=promoteTransaction(s);
  else if (a.type === 'prestige') accepted = prestigeReset(s);
  else accepted = debugAction(s, a);
  if (accepted) refreshStats(s); return accepted;
}
