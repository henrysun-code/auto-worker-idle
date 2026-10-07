import { isProductActive } from '../products/productEffects';
import { gameConfig as c } from '../../config/gameConfig';
import type { State, Target } from '../state/gameState';
import { activeProductForTag } from '../products/productManager';
import { newId, scaledSeconds } from '../time/worldTime';
import { addBuff } from '../buffs/buffManager';
import { notify } from '../events/eventLog';
export function startEligibleProblem(s: State) {
  const existing = [s.currentTarget, ...s.suspendedTargets.map(x => x.target)].filter((t): t is Extract<Target, { type: 'PROBLEM' }> => t?.type === 'PROBLEM');
  const candidates = s.debuffs.filter(d => d.expiresAt > s.world.totalWorldTime && !existing.some(t => t.debuffId === d.id)).map(d => ({ d, p: activeProductForTag(s, d.resolvableByProductTag), e: c.events.definitions.find(e => e.id === d.type || e.id === d.sourceEvent)! })).filter(x => x.p && x.e);
  candidates.sort((a, b) => b.e.priority - a.e.priority);
  const current = s.currentTarget;
  const currentPriority = current?.type === 'PROBLEM' ? c.events.definitions.find(e => e.id === current.eventType)?.priority ?? 0 : 0;
  const next = candidates.find(x => !current || x.e.interruptImmediately && (current.type !== 'PROBLEM' || x.e.priority > currentPriority));
  if (!next) return false;
  if (s.currentTarget) s.suspendedTargets.push({ target: s.currentTarget, phase: s.needs.phase });
  s.currentTarget = { id: newId(s, 'problem'), type: 'PROBLEM', name: next.e.problemName, requirement: scaledSeconds(next.e.problemRequirement), progress: 0, createdAt: s.world.totalWorldTime, debuffId: next.d.id, productId: next.p!.id, eventType: next.e.id, originalRemaining: next.d.remainingDuration };
  const stats = s.products[next.p!.id].contributionStats; stats.problemTriggeredCount = (stats.problemTriggeredCount ?? 0) + 1;
  notify(s, '產品', `${next.p!.name} 已開始處理 ${next.d.name}。`, { productId: next.p!.id, sourceId: next.d.id }); return true;
}
export function finishProblem(s: State, target: Extract<Target, { type: 'PROBLEM' }>) {
  const d = s.debuffs.find(d => d.id === target.debuffId); const p = s.products[target.productId]; const e = c.events.definitions.find(e => e.id === target.eventType)!;
  if (d && isProductActive(s,target.productId,'PROBLEM_RESOLVER')) {
    const saved = Math.max(0, d.expiresAt - s.world.totalWorldTime); s.debuffs = s.debuffs.filter(x => x.id !== d.id); p.contributionStats.problemResolvedCount = (p.contributionStats.problemResolvedCount ?? 0) + 1; p.contributionStats.debuffSecondsSaved = (p.contributionStats.debuffSecondsSaved ?? 0) + saved;
    addBuff(s, { id: 'protection-' + e.tag, name: e.name + '保護', expiresAt: s.world.totalWorldTime + scaledSeconds(e.protectionDuration), modifiers: {}, protectionTag: e.tag, eventChanceMultiplier: e.protectionChanceMultiplier });
    notify(s, '產品', `原本還需 ${target.originalRemaining.toFixed(1)} 秒，本次 ${target.progress.toFixed(1)} 秒處理完成，提前解除 ${saved.toFixed(1)} 秒。`, { productId: target.productId, sourceId: d.id });
  }
}
