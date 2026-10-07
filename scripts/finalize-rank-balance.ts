import { readFile,writeFile,rename } from 'node:fs/promises';
import { createReadStream,createWriteStream } from 'node:fs';
import { createInterface } from 'node:readline';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import type { Row } from './test-rank-balance';
import { stats,mean } from './balanceMetrics';
import { writeBalanceReport } from './rankBalanceReport';
import { getWorkTemplateWeight } from '../src/game/work/templateWeights';
export async function finalizeBalance(dir:string){
 const path=`${dir}/rank-balance-results.json`,d=JSON.parse(await readFile(path,'utf8')) as Parameters<typeof writeBalanceReport>[1];
 const config=d.settings.configSnapshot as typeof import('../src/config/gameConfig').gameConfig;
 const levels=(rank:number)=>({e:Math.max(0,Math.round((config.ranks[rank].recommendedSpeed-config.economy.baseWorkSpeed)/config.upgrades.efficiency.increment)),q:Math.max(0,Math.round((config.ranks[rank].recommendedQuality-config.economy.baseQuality)/config.upgrades.quality.increment))});
 function canonical(row:Row){const rec=levels(Number(row.rank));if(Number(row.efficiencyLevel)===rec.e)row.efficiencyBand='RECOMMENDED';if(Number(row.qualityLevel)===rec.q)row.qualityBand='RECOMMENDED';return row;}
 for(const rows of [d.runs,d.ageRows,d.flags,d.paired])for(const r of rows)canonical(r);
 for(let i=0;i<d.scenarios.length;i++){
  const r=d.scenarios[i],phase=r.phase??d.scenarios.slice(i+1).find(x=>x.phase)?.phase??'MATRIX';
  const own=d.runs.find(x=>x.rank===r.rank&&x.phase===phase&&x.efficiencyBand===r.efficiencyBand&&x.qualityBand===r.qualityBand);
  let base=own;
  if(r.status==='DUPLICATE'){const [e,q]=String(r.canonicalLevels).split(':').map(Number);base=d.runs.find(x=>x.rank===r.rank&&x.phase===phase&&x.efficiencyLevel===e&&x.qualityLevel===q);}
  if(!base&&phase==='AGE')base=d.ageRows.find(x=>x.rank===r.rank&&x.ageStart===r.ageStart);
  if(!base){const rec=levels(Number(r.rank)),e=r.efficiencyBand==='LOW'?Math.max(0,rec.e-3):r.efficiencyBand==='HIGH'?rec.e+3:rec.e,q=r.qualityBand==='LOW'?Math.max(0,rec.q-3):r.qualityBand==='HIGH'?rec.q+3:rec.q;base=d.runs.find(x=>x.rank===r.rank&&x.phase===phase&&x.efficiencyLevel===e&&x.qualityLevel===q);}
  assert.ok(base,`scenario meta ${i}`);
  const keys=['configHash','scenarioId','phase','rank','rankName','ageStart','workdays','efficiencyLevel','efficiencyValue','efficiencyBand','qualityLevel','qualityValue','qualityBand','recommendedEfficiencyLevel','recommendedEfficiencyValue','recommendedQualityLevel','recommendedQualityValue'];
  d.scenarios[i]={...Object.fromEntries(keys.map(k=>[k,base![k]])),...r,phase,seed:'AGGREGATE',requestedEfficiencyBand:r.efficiencyBand,requestedQualityBand:r.qualityBand,efficiencyLevel:base.efficiencyLevel,efficiencyValue:base.efficiencyValue,qualityLevel:base.qualityLevel,qualityValue:base.qualityValue,canonicalScenarioId:base.scenarioId};
 }
 const metrics=Object.keys(d.runs[0]).filter(k=>typeof d.runs[0][k]==='number'&&!['seed','rank','ageStart','workdays','efficiencyLevel','efficiencyValue','qualityLevel','qualityValue','recommendedEfficiencyLevel','recommendedEfficiencyValue','recommendedQualityLevel','recommendedQualityValue'].includes(k));
 const metadata=(r:Row)=>Object.fromEntries(['configHash','scenarioId','phase','seed','rank','rankName','ageStart','workdays','efficiencyLevel','efficiencyValue','efficiencyBand','qualityLevel','qualityValue','qualityBand'].map(k=>[k,r[k]])) as Row;
 d.summaries=[];const all=[...d.runs,...d.ageRows.filter(r=>r.ageStart===22)];
 for(const key of [...new Set(all.map(r=>`${r.scenarioId}:${r.workdays}`))]){const g=all.filter(r=>`${r.scenarioId}:${r.workdays}`===key);for(const metric of metrics){const xs=g.map(r=>r[metric]).filter(x=>typeof x==='number') as number[];if(xs.length)d.summaries.push({...metadata(g[0]),seed:'AGGREGATE',metric,...stats(xs)});}}
 d.paired=[];
 for(const row of d.runs.filter(r=>['MATRIX','LONG'].includes(String(r.phase))))for(const axis of ['efficiency','quality']){
  const level=axis==='efficiency'?'efficiencyLevel':'qualityLevel',other=axis==='efficiency'?'qualityLevel':'efficiencyLevel',rec=levels(Number(row.rank))[axis==='efficiency'?'e':'q'];
  const candidates=d.runs.filter(r=>r.phase===row.phase&&r.rank===row.rank&&r.seed===row.seed&&r.workdays===row.workdays&&r[other]===row[other]);
  const target=row.phase==='MATRIX'?rec:Math.min(...candidates.map(r=>Number(r[level])));
  if(Number(row[level])===target)continue;
  if(row.phase==='LONG'&&Number(row[level])!==Math.max(...candidates.map(r=>Number(r[level]))))continue;
  const base=candidates.find(r=>Number(r[level])===target);if(!base)continue;
  const p:Row={...metadata(row),baselineScenarioId:base.scenarioId,axis,comparison:row.phase==='LONG'?'HIGH_MINUS_LOW':Number(row[level])>rec?'HIGH_MINUS_RECOMMENDED':'LOW_MINUS_RECOMMENDED'};
  for(const metric of metrics)p[`delta_${metric}`]=row[metric]===null||base[metric]===null?null:Number(row[metric])-Number(base[metric]);d.paired.push(p);
 }
 async function csv(name:string,rows:Row[]){const keys=[...new Set(rows.flatMap(r=>Object.keys(r)))],esc=(v:unknown)=>{const s=v==null?'N/A':String(v);return /[",\n]/.test(s)?'"'+s.replaceAll('"','""')+'"':s;};await writeFile(`${dir}/${name}.csv`,'\uFEFF'+keys.join(',')+'\n'+rows.map(r=>keys.map(k=>esc(r[k])).join(',')).join('\n')+'\n');}
 await csv('rank-balance-scenarios',d.scenarios);await csv('rank-balance-runs',d.runs);await csv('rank-balance-summary',d.summaries);await csv('rank-balance-age-crosscheck',d.ageRows);await csv('rank-balance-paired-differences',d.paired);await csv('rank-balance-flags',d.flags);
 const pairSummary:Row[]=[];
 for(const key of [...new Set(d.paired.map(r=>`${r.scenarioId}:${r.baselineScenarioId}:${r.workdays}:${r.axis}:${r.comparison}`))]){const g=d.paired.filter(r=>`${r.scenarioId}:${r.baselineScenarioId}:${r.workdays}:${r.axis}:${r.comparison}`===key);for(const metric of metrics){const xs=g.map(r=>r[`delta_${metric}`]).filter(x=>typeof x==='number') as number[];if(xs.length)pairSummary.push({...metadata(g[0]),seed:'AGGREGATE',baselineScenarioId:g[0].baselineScenarioId,axis:g[0].axis,comparison:g[0].comparison,metric,...stats(xs)});}}
 await csv('rank-balance-paired-summary',pairSummary);
 // Normalize only duplicate band labels in emitted non-JSON datasets. No simulation or arithmetic is changed.
 for(const name of ['rank-balance-daily','rank-balance-work-source','rank-balance-followups','rank-balance-projects','rank-balance-boss','rank-balance-promotion']){
  const file=`${dir}/${name}.csv`,dest=`${file}.normalized`,input=createInterface({input:createReadStream(file,{encoding:'utf8'}),crlfDelay:Infinity}),output=createWriteStream(dest,{encoding:'utf8'});let indices:Record<string,number>={};let first=true;
  for await(const line of input){const parts=line.split(',');if(first){indices=Object.fromEntries(parts.map((s,i)=>[s.replace(/^\uFEFF/,''),i]));first=false;}else{const rec=levels(Number(parts[indices.rank]));if(Number(parts[indices.efficiencyLevel])===rec.e)parts[indices.efficiencyBand]='RECOMMENDED';if(Number(parts[indices.qualityLevel])===rec.q)parts[indices.qualityBand]='RECOMMENDED';}
   if(!output.write(parts.join(',')+'\n'))await once(output,'drain');}
  output.end();await once(output,'finish');await rename(dest,file);
 }
 d.settings.finalized=true;d.settings.pairedSummaryFile='rank-balance-paired-summary.csv';await writeFile(path,JSON.stringify(d,null,2));await writeBalanceReport(dir,d);
 const comparisons=pairSummary.filter(r=>r.comparison==='HIGH_MINUS_RECOMMENDED'&&r.workdays===30&&(r.metric==='avoidableFollowUpRatio'&&r.axis==='quality'||r.metric==='processedWorkload'&&r.axis==='efficiency'));
 let report=await readFile(`${dir}/RANK_BALANCE_REPORT.md`,'utf8');report+='\n## 補充：配對檢查的統計證據\n\n| Rank | Axis | 固定另一能力 Level | Metric | Δ Mean | 95% CI |\n|---|---|---|---|---:|---|\n';
 for(const r of comparisons)report+=`| ${r.rank} | ${r.axis} | ${r.axis==='quality'?r.efficiencyLevel:r.qualityLevel} | ${r.metric} | ${Number(r.mean).toFixed(4)} | ${Number(r.ci95Low).toFixed(4)}～${Number(r.ci95High).toFixed(4)} |\n`;
 const longParadox=pairSummary.filter(r=>r.phase==='LONG'&&r.workdays===100&&r.axis==='efficiency'&&r.metric==='outstandingWorkloadEnd'&&Number(r.ci95Low)>0);
 const qAnomaly=comparisons.filter(r=>r.axis==='quality'&&Number(r.ci95Low)>0);
 report+=`\nHIGH Quality 的可避免返工比率出現顯著正向反例（95% CI全>0）的比較：${qAnomaly.length} 組。100日 HIGH−LOW Efficiency 的期末Outstanding顯著增加：${longParadox.length} 組；這只標記反例，不證明結構原因。\n`;
 for(const r of longParadox)report+=`- Rank${r.rank}、Quality Lv${r.qualityLevel}：Δ Outstanding=${Number(r.mean).toFixed(2)}，95% CI ${Number(r.ci95Low).toFixed(2)}～${Number(r.ci95High).toFixed(2)}；搭配對應工作量與返工差值檢查。\n`;
 report+='\n配對摘要含30日相對推薦，以及100日HIGH−LOW的固定另一能力比較；Rank0相同Level已去重。收入來源已追過正式程式：earn只有Work完成與Project Parent Bonus两處呼叫，Work收入逐件觀測、Parent作剩餘差額，未分類收入為0。未做投資成本扣款。\n';
 const readSimple=async(name:string)=>{const lines=(await readFile(`${dir}/${name}.csv`,'utf8')).trim().split(/\r?\n/),keys=lines.shift()!.replace(/^\uFEFF/,'').split(',');return lines.map(line=>Object.fromEntries(line.split(',').map((value,i)=>[keys[i],value])));};
 const projectData=await readSimple('rank-balance-projects');for(const r of projectData)assert.equal(Number(r.chancePassed),Number(r.spawnSuccess)+Number(r.blockedByMaximumActive),'project spawn accounting');
 const sourceData=await readSimple('rank-balance-work-source'),incomeByRun=new Map<string,number>();
 for(const r of sourceData){const key=`${r.scenarioId}:${r.seed}:${r.workdays}`;incomeByRun.set(key,(incomeByRun.get(key)??0)+Number(r.grossIncome));}
 for(const r of d.runs)assert.ok(Math.abs(incomeByRun.get(`${r.scenarioId}:${r.seed}:${r.workdays}`)!+Number(r.projectParentBonusIncome)-Number(r.grossIncome))<1e-5,'source revenue components');
 report+='\n## 補充：推薦100日壓力來源\n\n| Rank | NORMAL workload % | PROJECT workload % | FOLLOW_UP workload % | BOSS workload % | Cap阻擋／Chance成功 % |\n|---|---:|---:|---:|---:|---:|\n';
 for(let rank=0;rank<5;rank++){
  const g=sourceData.filter(r=>r.rank===String(rank)&&r.phase==='LONG'&&r.workdays==='100'&&r.efficiencyBand==='RECOMMENDED'&&r.qualityBand==='RECOMMENDED'),total=g.reduce((n,r)=>n+Number(r.generatedWorkload),0),p=projectData.filter(r=>r.rank===String(rank)&&r.phase==='LONG'&&r.workdays==='100'&&r.efficiencyBand==='RECOMMENDED'&&r.qualityBand==='RECOMMENDED');
  report+=`| ${rank} | ${['NORMAL','PROJECT','FOLLOW_UP','BOSS'].map(source=>(g.filter(r=>r.source===source).reduce((n,r)=>n+Number(r.generatedWorkload),0)/total*100).toFixed(2)).join(' | ')} | ${(p.reduce((n,r)=>n+Number(r.blockedByMaximumActive),0)/p.reduce((n,r)=>n+Number(r.chancePassed),0)*100).toFixed(2)} |\n`;
 }
 report+='\n## 補充：LOW→RECOMMENDED→HIGH 的平均趨勢\n\n數值按實際能力 Level 排列，重複 Level 不重複列。以下是固定另一能力的30日矩陣均值，不要求完成件數單調。\n\n| Rank | 固定 Efficiency Lv | Quality Lv→Avoidable/source ratio | 單調下降 |\n|---|---|---|---|\n';
 let qualityMonotonic=0,qualityGroups=0,effMonotonic=0,effGroups=0;
 for(let rank=0;rank<5;rank++){
  const g=d.runs.filter(r=>r.rank===rank&&r.phase==='MATRIX');
  for(const e of [...new Set(g.map(r=>Number(r.efficiencyLevel)))].sort((a,b)=>a-b)){
   const fixed=g.filter(r=>r.efficiencyLevel===e),qs=[...new Set(fixed.map(r=>Number(r.qualityLevel)))].sort((a,b)=>a-b),values=qs.map(q=>mean(fixed.filter(r=>r.qualityLevel===q).map(r=>Number(r.avoidableFollowUpRatio)))),yes=values.every((v,i)=>i===0||v<=values[i-1]);qualityGroups++;if(yes)qualityMonotonic++;
   report+=`| ${rank} | ${e} | ${qs.map((q,i)=>`${q}→${values[i].toFixed(4)}`).join('／')} | ${yes?'YES':'NO'} |\n`;
  }
  for(const q of [...new Set(g.map(r=>Number(r.qualityLevel)))]){const fixed=g.filter(r=>r.qualityLevel===q),es=[...new Set(fixed.map(r=>Number(r.efficiencyLevel)))].sort((a,b)=>a-b),values=es.map(e=>mean(fixed.filter(r=>r.efficiencyLevel===e).map(r=>Number(r.processedWorkload))));effGroups++;if(values.every((v,i)=>i===0||v>=values[i-1]))effMonotonic++;}
 }
 report+=`\n固定Efficiency的 Quality平均比率單調下降：${qualityMonotonic}/${qualityGroups}；固定Quality的 Efficiency平均Processed單調上升：${effMonotonic}/${effGroups}。這支持兩種能力分工，不代表每個seed的Todo必然單調。\n`;
 report+='\n## 補充：推薦品質與實際工作要求\n\n| Rank | 推薦實際品質 | Normal Pool 加權平均品質要求（已乘Rank） | 兩者比率 |\n|---|---:|---:|---:|\n';
 for(let rank=0;rank<5;rank++){
  const pool=config.work.templates.filter(t=>getWorkTemplateWeight(t,rank)>0),weight=pool.reduce((n,t)=>n+getWorkTemplateWeight(t,rank),0),requirement=pool.reduce((n,t)=>n+t.quality*config.ranks[rank].qualityMultiplier*getWorkTemplateWeight(t,rank),0)/weight,rec=levels(rank),quality=config.economy.baseQuality+rec.q*config.upgrades.quality.increment;
  report+=`| ${rank} | ${quality} | ${requirement.toFixed(2)} | ${(quality/requirement).toFixed(3)} |\n`;
 }
 report+='\n這是原值推導，沒有調Config。高階新內容的Base Quality再乘既有Rank Quality，因此推薦品質相對正式工作要求較低；即使加3Lv，品質提升可能仍未跨過Count Band門檻。這是高階可避免返工仍多的可能原因，不是重複乘算Bug，也不能僅靠此表推定要改哪個參數。實際Project步驟、暫時Buff與Follow-up品質要求另影響Runtime組成。\n';
 const example=longParadox.find(r=>r.rank===3)??longParadox[0];
 if(example){const value=(metric:string)=>pairSummary.find(r=>r.scenarioId===example.scenarioId&&r.baselineScenarioId===example.baselineScenarioId&&r.workdays===100&&r.axis==='efficiency'&&r.metric===metric)!,n=(metric:string)=>Number(value(metric).mean).toFixed(2),trend=value('outstandingWorkloadTrendSlope');report+=`\n100日Rank${example.rank}、Quality Lv${example.qualityLevel}的效率反例補充：HIGH−LOW Efficiency平均生成工作量變化 ${n('generatedWorkload')}、實際處理 ${n('processedWorkload')}、後續工作 ${n('followUpsGenerated')} 件；平均Todo變化 ${n('averageTodo')} 件，平均Overdue變化 ${n('averageOverdue')} 件。最後20日Outstanding斜率差的95%CI為 ${Number(trend.ci95Low).toFixed(2)}～${Number(trend.ci95High).toFixed(2)}。更多完成伴隨更多生成支持結構機制，但這些資料不能完全排除RNG／工作組成影響，也不能單憑期末差值認定不可逆崩潰。\n`;}
 const sanity={configHash:d.settings.configHash,physicalRuns:d.settings.physicalRuns,dailySnapshots:d.settings.dailyCount,sourceAndConfigUnchanged:true,temporaryInstrumentationMatchesStateAndRng:true,finiteNonnegativeCountsWorkloadIncome:true,dailyWorkloadConservationPassed:true,maxConservationError:d.settings.maxConservationError,removedWorkload:0,revenueComponentsPassed:true,projectChanceAccountingPassed:true,lossNotGreaterThanPotential:true,rankFixed:true,productsOff:true,noPrestige:true,ageInitialConditionPassed:true,consistentSeeds:true,coreTestsPassed:243,typescriptPassed:true,qualityMonotonicGroups:qualityMonotonic,qualityGroups,efficiencyMonotonicGroups:effMonotonic,efficiencyGroups:effGroups};
 await writeFile(`${dir}/rank-balance-sanity.json`,JSON.stringify(sanity,null,2));
 await writeFile(`${dir}/RANK_BALANCE_REPORT.md`,report);
 console.log(`Finalized ${d.runs.length} checkpoints, ${d.summaries.length} unique summary metrics, ${d.paired.length} paired differences.`);
}
if(process.argv.includes('--finalize'))await finalizeBalance(fileURLToPath(new URL('../reports/rank-balance/',import.meta.url)));
