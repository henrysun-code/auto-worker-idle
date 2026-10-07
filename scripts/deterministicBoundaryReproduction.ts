import {readFileSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import assert from 'node:assert/strict';
import {advance} from '../src/game/engine/SimulationLoop';
import {compareSemanticState} from './careerV3PreflightCore';
import type {State} from '../src/game/types';
const original:State=JSON.parse(readFileSync(new URL('../reports/career-v3-full/career-v3-reproduction-checkpoint.json',import.meta.url),'utf8'));
const before=JSON.parse(readFileSync(new URL('../reports/career-v3-full/career-v3-reproduction-result.json',import.meta.url),'utf8'));
const small=structuredClone(original),large=structuredClone(original);
advance(small,before.firstSmallDelta,{activeSeconds:before.firstSmallDelta});
for(const [s,batch]of [[small,.25],[large,60]] as const)while(s.world.totalWorldTime<90-1e-8){const duration=Math.min(batch,90-s.world.totalWorldTime);advance(s,duration,{activeSeconds:duration});}
assert.deepEqual(small.runStatistics.rootExtraTasks,large.runStatistics.rootExtraTasks);assert.equal(small.world.rng,large.world.rng);assert.deepEqual(small.currentTarget,large.currentTarget);assert.equal(small.world.sequence,large.world.sequence);
const result={checkpointTime:54,end:90,firstSmallDelta:before.firstSmallDelta,policyActionsDuringReplay:0,...compareSemanticState(small,large),followUpCountsEqual:true,rngEqual:true,currentTargetExactEqual:true,sequenceEqual:true,
 small:{rng:small.world.rng,activeSeconds:small.runStatistics.activeSeconds,sequence:small.world.sequence,target:small.currentTarget,sleep:small.needs.sleep,extraTasks:small.runStatistics.rootExtraTasks},large:{rng:large.world.rng,activeSeconds:large.runStatistics.activeSeconds,sequence:large.world.sequence,target:large.currentTarget,sleep:large.needs.sleep,extraTasks:large.runStatistics.rootExtraTasks}};
assert.equal(result.semanticEqual,true);
writeFileSync(join(fileURLToPath(new URL('../reports/deterministic-boundary-v1/',import.meta.url)),'batch-reproduction-after.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({rngEqual:true,currentTargetExactEqual:true,sequenceEqual:true,semanticEqual:true}));
