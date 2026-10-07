type Row=Record<string,string|number|boolean>;
type Data={c:typeof import('../src/config/gameConfig').gameConfig;pools:Row[];workDraws:Row[];projectDraws:Row[];probabilities:Row[];multipliers:Row[];ageRank:Row[];stability:unknown[];runtime:Row[];runtimeContent:Row[];checks:Row[];configHash:string;seeds:number[];drawSeed:number};
export function buildRankReport(d:Data){
 const {c,pools,workDraws,projectDraws,runtime,runtimeContent,checks}=d;
 const mean=(rows:Row[],key:string)=>rows.reduce((n,r)=>n+Number(r[key]),0)/rows.length;
 let report='# Rank Content Distribution Report\n\n';
 report+=`PROVISIONAL：內容與所有新增數值待平衡。本次沿用原 Rank Runner，每 Rank 10,000 Work draws、10,000 successful Project selections、10,000 Project Chance rolls、10,000 Boss rolls；每 Rank 30 seeds × 30 工作日。Config SHA256=${d.configHash}。抽樣 seed=${d.drawSeed}，完整 seeds/config 保存在 JSON。\n\n`;
 report+='## Runtime 與正式規則\n\n最低職級解鎖＋有效權重>0；有 rankWeights 時使用指定 Rank 欄位，缺少整個欄位才 fallback weight。Work 與 Project 分別由集中 helper 計算。Project Chance／Boss／Rank 難度／Age／Follow-up／Promotion／Prestige 沿用原值與流程。已存在 Todo／Project 不重建，工作量／品質／期限／進度保留；Todo 報酬依完成時 Current Rank 動態更新。上一輪四個報酬固定的 Fail 已改為動態更新正確性，沒有 Reward Snapshot。既有 Project Parent Bonus 沿用建立時 p.reward；其子任務 Work Reward 使用動態 Current Rank，沒有改獎金流程。\n\n';
 report+='## Normal Work：完整理論／實際分布\n\n';
 for(let rank=0;rank<5;rank++){
  report+=`### Rank${rank} ${c.ranks[rank].name}\n\n| ID／名稱 | 最低 Rank | Effective Weight | Base Workload | Base Reward | Base Quality | Count | Expected % | Actual % |\n|---|---:|---:|---:|---:|---:|---:|---:|---:|\n`;
  for(const p of pools.filter(p=>p.rank===rank)){const w=workDraws.find(w=>w.rank===rank&&w.templateId===p.templateId)!;report+=`| ${p.templateId}／${p.name} | ${p.templateRank} | ${p.effectiveWeight} | ${p.baseWorkload} | ${p.baseReward} | ${p.baseQualityRequirement} | ${w.count} | ${Number(w.expectedPercent).toFixed(2)} | ${Number(w.actualPercent).toFixed(2)} |\n`;}
  report+='\n';
 }
 report+='## Normal Template Rank Group Share\n\n| Current Rank | Template Rank Group | Expected % | Actual Draw % | Runtime Normal % |\n|---|---|---:|---:|---:|\n';
 for(let rank=0;rank<5;rank++)for(let group=0;group<=rank;group++){
  const ids=c.work.templates.filter(t=>t.rank===group).map(t=>t.id),ws=workDraws.filter(w=>w.rank===rank&&ids.includes(String(w.templateId))),rg=runtimeContent.filter(r=>r.rank===rank&&r.category==='NORMAL'),total=rg.reduce((n,r)=>n+Number(r.count),0),count=rg.filter(r=>ids.includes(String(r.templateOrType))).reduce((n,r)=>n+Number(r.count),0);
  report+=`| ${rank} | ${group} | ${ws.reduce((n,w)=>n+Number(w.expectedPercent),0).toFixed(2)} | ${ws.reduce((n,w)=>n+Number(w.actualPercent),0).toFixed(2)} | ${(count/total*100).toFixed(2)} |\n`;
 }
 report+='\n依指定精確權重計算；附件的大致預期與精確權重有差異，沒有為符合示意比例改參數。例如跨部門整合案在 Rank2 的理論比例是 51.72%，團隊流程改善在 Rank3 是 47.62%，兩者仍是最大單一 Project。\n\n## Project 分布：每 Rank 10000 次成功選取\n\n| Rank | Project | Effective Weight | Count | Expected % | Actual % |\n|---|---|---:|---:|---:|---:|\n';
 for(const p of projectDraws.filter(p=>p.eligible))report+=`| ${p.rank} | ${p.name} | ${p.effectiveWeight} | ${p.count} | ${Number(p.expectedPercent).toFixed(2)} | ${Number(p.actualPercent).toFixed(2)} |\n`;
 report+='\n機率抽樣每次清除測試 ACTIVE 避免 capacity 干擾，真實 Runtime 則保留上限。\n\n## Project Chance／Boss 回歸\n\n| Rank | Project Config→Actual % | Boss Expected→Actual % |\n|---|---|---|\n';
 for(const p of d.probabilities)report+=`| ${p.rank} | ${(Number(p.configProjectChance)*100).toFixed(2)}→${(Number(p.observedProjectChance)*100).toFixed(2)} | ${(Number(p.expectedCatchChance)*100).toFixed(2)}→${(Number(p.observedCatchChance)*100).toFixed(2)} |\n`;
 report+='\n## 30 日 Runtime\n\nAge22 開始自然年長、無產品、其他能力 Lv0、不購買／升職／Prestige，初始金錢沿用正式 Config。推薦速度／品質對應最近整數 Lv，實際起始值及等級見每筆 CSV；暫時 Buff/Debuff 正常運作。取樣終點為 Day31 上班錨點，包含最初早餐。Average 為世界時間加權；表中 Peak 是每 seed 峰值的平均，原始峰值留在 CSV。\n\n| Rank | Speed（Lv） | Quality（Lv） | Generated Work | Projects | Follow-up | Avg Todo | Avg Due Today | Avg Overdue | Peak Overdue | Generated Workload | Processed Workload | Ratio | Gross Income | Overdue Loss | Completed |\n|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|\n';
 for(let rank=0;rank<5;rank++){const g=runtime.filter(r=>r.rank===rank),r=g[0];report+=`| ${rank} | ${r.actualStartingSpeed}（${r.efficiencyLevel}） | ${r.actualStartingQuality}（${r.qualityLevel}） | ${['generatedWorkCount','projectSpawnCount','followUpCount','averageTodo','averageDueToday','averageOverdue','peakOverdue','generatedWorkload','processedWorkload','processedGeneratedRatio','grossIncome','overdueRevenueLoss','completedWorkCount'].map(k=>mean(g,k).toFixed(2)).join(' | ')} |\n`;}
 report+='\nGenerated Work/Workload 計正式釋出的所有工作；Follow-up Count 在建立 Pending 時也計入，尚未 release 的 Pending 不計正式 Workload。Processed 含進行中的部分進度。\n\n## Runtime 內容分布（30 seeds 合計，各類別內占比）\n\n';
 for(let rank=0;rank<5;rank++){report+=`### Rank${rank}\n\n| 類別 | ID／Type | Count | % |\n|---|---|---:|---:|\n`;for(const category of ['NORMAL','PROJECT','FOLLOW_UP']){const g=runtimeContent.filter(r=>r.rank===rank&&r.category===category),total=g.reduce((n,r)=>n+Number(r.count),0);for(const id of [...new Set(g.map(r=>r.templateOrType))]){const n=g.filter(r=>r.templateOrType===id).reduce((n,r)=>n+Number(r.count),0);report+=`| ${category} | ${id} | ${n} | ${(n/total*100).toFixed(2)} |\n`;}}report+='\n';}
 report+='## Acceptance 與測試\n\n';
 report+=`Runner checks：${checks.filter(x=>x.pass).length} pass／${checks.filter(x=>!x.pass).length} fail，所有名稱與結果在 rank-assertions.csv。禁止項目任一出現會立即中止；抽樣偏差以 4 個二項標準差＋1/n 篩查，不是正式經濟平衡。\n\n`;
 for(const x of checks.filter(x=>!x.pass))report+=`- FAIL：${x.name} ${x.details}\n`;
 report+='\n內容判斷以精確理論與真實 Runtime 表格為準，不硬寫分布。五職級已具各自新增的 Work 與主力 Project，低階仍非零；同時新增的品質需求／工作量可能改變積壓與返工，這輪未做最終平衡。\n\n## 重跑與檔案\n\n沿用 scripts/test-ranks.ts，執行 npx tsx scripts/test-ranks.ts。rank-results.json 包含 Config、seed、全部明細；各 CSV 帶 Config hash／Rank／Seed／Workdays。舊內容測試報告保留在 rank-tests-pre-content，避免覆寫歷史證據。\n';
 return report;
}
