import { gameConfig as c } from '../../config/gameConfig';
import type { State, Todo } from '../state/gameState';
import { effectiveWorkQuality } from './workStats';
import { semanticGte } from '../numeric/semanticBoundary';
export function followUpChance(s: State, work: Todo, rule: typeof c.followUps.types[number]) { return rule.qualitySensitive ? Math.min(1, rule.chance * work.qualityRequirement / Math.max(1, effectiveWorkQuality(s))) : rule.chance; }

export function followUpCount(s: State, work: Todo, rule: typeof c.followUps.types[number], roll: number) {
 const band = rule.qualitySensitive ? [...c.followUps.qualityCountBands].reverse().find(b => semanticGte(effectiveWorkQuality(s) / Math.max(1, work.qualityRequirement),b.minimumRatio)) : undefined;
 const minimum = band?.countMin ?? rule.countMin; const maximum = band?.countMax ?? rule.countMax;
 return minimum + Math.floor(roll * (maximum - minimum + 1));
}
