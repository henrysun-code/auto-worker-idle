import { gameConfig as c } from '../../config/gameConfig';
import type { State } from '../state/gameState';
import { newId, scaledSeconds } from '../time/worldTime';
import { notify } from '../events/eventLog';
import { canonicalizeBreakpoint } from '../numeric/semanticBoundary';
export const sleepOutputRate = (_s: State) => 1; // Reserved Life Management hook, deliberately neutral.
export function sleepEffect(ratio: number) {
  const points=c.sleep.effectCurve;
  ratio=canonicalizeBreakpoint(ratio,points.map(point=>point.ratio));
  const exact=points.find(point=>ratio===point.ratio);if(exact)return exact;
  if(ratio<=points[0].ratio)return points[0];
  for(let i=1;i<points.length;i++)if(ratio<=points[i].ratio){const a=points[i-1],b=points[i],t=(ratio-a.ratio)/(b.ratio-a.ratio);return {ratio,speedModifier:a.speedModifier+t*(b.speedModifier-a.speedModifier),qualityModifier:a.qualityModifier+t*(b.qualityModifier-a.qualityModifier)};}
  return points.at(-1)!;
}
export const sleepRatio = (s: State) => canonicalizeBreakpoint(s.needs.sleep.output/scaledSeconds(c.sleep.targetDuration),c.sleep.effectCurve.map(point=>point.ratio));
export function settleSleepWindow(s: State) {
  const w=s.needs.sleep;if(w.settled||s.world.totalWorldTime<w.windowEnd-1e-8)return false;
  w.settled=true;w.lastRatio=sleepRatio(s);const effect=sleepEffect(w.lastRatio);w.speedModifier=effect.speedModifier;w.qualityModifier=effect.qualityModifier;
  s.buffs=s.buffs.filter(b=>b.id!=='sleep-window');s.debuffs=s.debuffs.filter(d=>d.type!=='sleep-window');
  const expiresAt=w.windowEnd+c.time.dayDuration,modifiers={workSpeed:effect.speedModifier,quality:effect.qualityModifier};
  const name=`睡眠 · 效率 ${effect.speedModifier>=0?'+':''}${(effect.speedModifier*100).toFixed(1)}%／品質 ${effect.qualityModifier>=0?'+':''}${(effect.qualityModifier*100).toFixed(1)}%`;
  if(effect.speedModifier<0||effect.qualityModifier<0)s.debuffs.push({id:newId(s,'sleep-effect'),type:'sleep-window',name,sourceEvent:'tired',duration:c.time.dayDuration,remainingDuration:c.time.dayDuration,expiresAt,modifiers,resolvableByProductTag:'sleep',severity:w.lastRatio===0?2:1,createdAt:s.world.totalWorldTime});
  else s.buffs.push({id:'sleep-window',name,expiresAt,modifiers});
  notify(s,'睡眠',`睡眠窗口結算：實睡 ${w.duration.toFixed(1)} 秒，完成度 ${(w.lastRatio*100).toFixed(1)}%；${name}。`);
  return true;
}
export function nextSleepWindow(s: State) {
  const w=s.needs.sleep;
  w.windowStart=s.world.dayIndex*c.time.dayDuration+scaledSeconds(c.time.sleepAnchor);
  w.windowEnd=(s.world.dayIndex+1)*c.time.dayDuration+scaledSeconds(c.time.workStartAnchor);
  w.duration=0;w.output=0;w.settled=false;
}
