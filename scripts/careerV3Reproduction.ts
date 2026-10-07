import {readFileSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import {isDeepStrictEqual} from 'node:util';
import {advance} from '../src/game/engine/SimulationLoop';
import type {State} from '../src/game/types';
const root=fileURLToPath(new URL('../reports/career-v3-full/',import.meta.url));
const traces=JSON.parse(readFileSync(join(root,'career-v3-preflight-traces.json'),'utf8'));
const original:State=traces.large.find((x:any)=>x.kind==='CHECKPOINT'&&Math.abs(x.state.world.totalWorldTime-54)<1e-8).state;
writeFileSync(join(root,'career-v3-reproduction-checkpoint.json'),JSON.stringify(original,null,2)+'\n');
const small=structuredClone(original),large=structuredClone(original),end=90;
const firstSmallTime=traces.small.find((x:any)=>x.kind==='CHECKPOINT'&&x.state.world.totalWorldTime>54+1e-8).state.world.totalWorldTime;
const firstSmallDelta=firstSmallTime-original.world.totalWorldTime;
advance(small,firstSmallDelta,{activeSeconds:firstSmallDelta});
for(const [s,batch]of [[small,.25],[large,60]] as const)while(s.world.totalWorldTime<end-1e-8){const delta=Math.min(batch,end-s.world.totalWorldTime);advance(s,delta,{activeSeconds:delta});}
const result={checkpointTime:original.world.totalWorldTime,end,identicalInitialState:true,policyActionsDuringReplay:0,firstSmallDelta,smallBatch:.25,largeBatch:60,stateExactEqual:isDeepStrictEqual(small,large),rngEqual:small.world.rng===large.world.rng,
 small:{rng:small.world.rng,activeSeconds:small.runStatistics.activeSeconds,sequence:small.world.sequence,currentTarget:small.currentTarget?.name,todoNames:small.todoQueue.map(x=>x.name),lunch:small.needs.lunchRest,sleep:small.needs.sleep,quality:small.stats.workQuality,extraTasks:small.runStatistics.rootExtraTasks},
 large:{rng:large.world.rng,activeSeconds:large.runStatistics.activeSeconds,sequence:large.world.sequence,currentTarget:large.currentTarget?.name,todoNames:large.todoQueue.map(x=>x.name),lunch:large.needs.lunchRest,sleep:large.needs.sleep,quality:large.stats.workQuality,extraTasks:large.runStatistics.rootExtraTasks}};
writeFileSync(join(root,'career-v3-reproduction-result.json'),JSON.stringify(result,null,2)+'\n');
writeFileSync(join(root,'career-v3-reproduction-small-state.json'),JSON.stringify(small,null,2)+'\n');
writeFileSync(join(root,'career-v3-reproduction-large-state.json'),JSON.stringify(large,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
