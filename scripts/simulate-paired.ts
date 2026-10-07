import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { gameConfig as c } from '../src/config/gameConfig';
import { initialState } from '../src/game/state/initialState';
import { advance, type SimulationOptions } from '../src/game/engine/SimulationLoop';
import { toggleProduct } from '../src/game/products/productManager';
import { getDeadlineStatus } from '../src/game/work/deadline';
import { canPromote } from '../src/game/career/promotion';
import { validateSave } from '../src/game/save/saveGame';
import type { State } from '../src/game/state/gameState';

const seeds = Array.from({length:30},(_,i)=>42+i*7919), checkpoints = [10,20,30];
type Row = Record<string, number|string|boolean>;
const runs:Row[]=[], daily:Row[]=[];
function tasks(s:State){return [...new Map([...s.todoQueue,...(s.currentTarget?.type==='WORK'?[s.currentTarget.todo]:[]),...s.suspendedTargets.flatMap(x=>x.target.type==='WORK'?[x.target.todo]:[])].map(t=>[t.id,t])).values()];}
for(const age of [22,40,50,60]) for(const efficiencyLevel of [0,5]) for(const qualityLevel of [0,5]) {
 for(const seed of seeds) for(const product of [false,true]) {
  const s=initialState(seed,0);s.player.money=1000;s.player.age=age;s.player.ageProgressDays=(age-c.age.start)*c.age.daysPerYear;
  s.player.upgrades.efficiency=efficiencyLevel;s.player.upgrades.quality=qualityLevel;
  if(product) assert.ok(toggleProduct(s,'agecare'));
  const common={scenario:`age${age}-eff${efficiencyLevel}-quality${qualityLevel}`,age,efficiencyLevel,qualityLevel,seed,product};
  let generatedWorkCount=0,generatedWorkload=0,processedWorkload=0,overdueCompletedCount=0,overdueRevenueLoss=0;
  let previousTime=0,previous=[0,0,0],integrals=[0,0,0],peaks=[0,0,0],eligibleDays=0,streak=0,longest=0;
  const seen=new Set<string>();
  const observer:SimulationOptions={
   onWorkProgress:amount=>{processedWorkload+=amount;},
   onWorkCompleted:(_todo,overdue,loss)=>{if(overdue){overdueCompletedCount++;overdueRevenueLoss+=loss;}},
   onBoundary:state=>{
    const dt=state.world.totalWorldTime-previousTime;integrals=integrals.map((n,i)=>n+previous[i]*dt);previousTime=state.world.totalWorldTime;
    const live=tasks(state);
    for(const t of live) if(!seen.has(t.id)){seen.add(t.id);generatedWorkCount++;generatedWorkload+=t.workload;}
    previous=[live.length,live.filter(t=>getDeadlineStatus(t,state)==='DUE_TODAY').length,live.filter(t=>getDeadlineStatus(t,state)==='OVERDUE').length];
    peaks=peaks.map((n,i)=>Math.max(n,previous[i]));
   }
  };
  for(let day=1;day<=30;day++){
   const end=day*c.time.dayDuration+c.time.workStartAnchor*c.time.dayDuration/c.time.referenceDayDuration;
   advance(s,end-s.world.totalWorldTime,observer);
   const eligible=canPromote(s);if(eligible){eligibleDays++;streak=0;}else{streak++;longest=Math.max(longest,streak);}
   assert.ok(validateSave(s));assert.ok(processedWorkload<=generatedWorkload+1e-6);
   const remaining=tasks(s).reduce((n,t)=>{const active=[s.currentTarget,...s.suspendedTargets.map(x=>x.target)].find(x=>x?.type==='WORK'&&x.todo.id===t.id);return n+t.workload-(active&&active.type==='WORK'?active.progress:0);},0);
   assert.ok(Math.abs(generatedWorkload-processedWorkload-remaining)<1e-5,'workload conservation failed');
   daily.push({...common,day,todo:previous[0],dueToday:previous[1],overdue:previous[2],promotionEligible:eligible,money:s.player.money,productActive:s.products.agecare.active});
   if(checkpoints.includes(day)){
    const productCost=Object.values(s.products).reduce((n,p)=>n+p.contributionStats.totalSpent,0);
    runs.push({...common,workdays:day,averageTodo:integrals[0]/end,finalTodo:previous[0],peakTodo:peaks[0],
     averageDueToday:integrals[1]/end,finalDueToday:previous[1],peakDueToday:peaks[1],
     averageOverdue:integrals[2]/end,finalOverdue:previous[2],peakOverdue:peaks[2],generatedWorkCount,generatedWorkload,processedWorkload,
     processedGeneratedWorkloadRatio:generatedWorkload?processedWorkload/generatedWorkload:0,overdueCompletedCount,overdueRevenueLoss,
     grossIncome:s.runStatistics.earned,productCost,netIncome:s.runStatistics.earned-productCost,moneyNetChange:s.player.money-1000,
     reworkCount:s.runStatistics.reworkCount,promotionEligibleDaysPercent:eligibleDays/day*100,longestPromotionIneligibleStreak:longest,
     completedWork:s.runStatistics.completedWork,productActiveAtEnd:s.products.agecare.active});
   }
  }
 }
 console.log(`完成 age=${age}, efficiency=${efficiencyLevel}, quality=${qualityLevel}：30 個 ON/OFF 配對`);
}
const metrics=Object.keys(runs[0]).filter(k=>!['scenario','age','efficiencyLevel','qualityLevel','seed','product','workdays','productActiveAtEnd'].includes(k));
const paired:Row[]=[],summary:Row[]=[],pairedSummary:Row[]=[];
const average=(rs:Row[],key:string)=>rs.reduce((n,r)=>n+Number(r[key]),0)/rs.length;
for(const off of runs.filter(r=>!r.product)){
 const on=runs.find(r=>r.product&&r.scenario===off.scenario&&r.seed===off.seed&&r.workdays===off.workdays)!;
 const row:Row={scenario:off.scenario,age:off.age,efficiencyLevel:off.efficiencyLevel,qualityLevel:off.qualityLevel,seed:off.seed,workdays:off.workdays};
 for(const m of metrics)row[m]=Number(on[m])-Number(off[m]);paired.push(row);
}
for(const scenario of [...new Set(runs.map(r=>r.scenario))])for(const workdays of checkpoints){
 for(const product of [false,true]){
  const g=runs.filter(r=>r.scenario===scenario&&r.workdays===workdays&&r.product===product);
  const row:Row={scenario,workdays,product,n:g.length};for(const m of metrics)row[m]=average(g,m);summary.push(row);
 }
 const g=paired.filter(r=>r.scenario===scenario&&r.workdays===workdays);
 for(const metric of metrics){const mean=average(g,metric),sd=Math.sqrt(g.reduce((n,r)=>n+(Number(r[metric])-mean)**2,0)/(g.length-1));
  pairedSummary.push({scenario,workdays,metric,n:g.length,meanDifference:mean,standardDeviation:sd,standardError:sd/Math.sqrt(g.length),ci95Low:mean-2.045*sd/Math.sqrt(g.length),ci95High:mean+2.045*sd/Math.sqrt(g.length),minDifference:Math.min(...g.map(r=>Number(r[metric]))),maxDifference:Math.max(...g.map(r=>Number(r[metric])))});
 }
}
const dir=fileURLToPath(new URL('../reports/paired-scenarios/',import.meta.url));await mkdir(dir,{recursive:true});
async function csv(name:string,rs:Row[]){const keys=Object.keys(rs[0]);await writeFile(`${dir}/${name}.csv`,'\uFEFF'+keys.join(',')+'\n'+rs.map(r=>keys.map(k=>r[k]).join(',')).join('\n')+'\n');}
await csv('runs',runs);await csv('daily',daily);await csv('scenario-summary',summary);await csv('paired-differences',paired);await csv('paired-summary',pairedSummary);
await writeFile(`${dir}/results.json`,JSON.stringify({settings:{seeds,checkpoints,startingMoney:1000,config:c},runs,summary,paired,pairedSummary},null,2));
let report='# V2：30 種子產品配對情境測試\n\n';
report+='32 個 Scenario（4 年齡 × 2 效率 × 2 品質 × ON/OFF），每 Scenario 30 次，共 960 條模擬；ON/OFF 配對共 480 組。每條跑 30 工作日，第 10／20／30 日取樣，共 2,880 筆期末結果及 28,800 筆每日結果。\n\n';
report+='初始年齡 22／40／50／60；效率與品質低 Lv0／高 Lv5；新人職級、資金 $1,000、普通食物、其餘能力 Lv0、無永久加成。既有能力不扣購買費，不自動升職或買能力。ON 只啟用 agecare，正常扣款／續費；保留事件、老闆、專案、返工與自然年長。不碰玩家存檔或更改正式 Config。\n\n';
report+='配對使用相同初始 seed。產品改變工作速度、完成時間及分支，之後 RNG 消耗序列可分歧；此為相同起始隨機狀態的完整遊玩路徑比較，不保證每次事件完全相同。差值一律 ON − OFF。95% 區間採配對差值的 t 區間（df=29、t≈2.045），屬初步估計，未做多重比較校正。\n\n';
report+='## 指標定義\n\n- Average Todo／Due Today／Overdue：依引擎每個邊界間隔做世界時間加權平均；Final 為指定工作日上班錨點的值；Peak 為所有引擎結算邊界後最大值。包含 queue/current/suspended 的正式 WORK，ID 去重，排除 Pending、Project Parent。\n- Generated Count／Workload：每個正式 Todo 在首次進入上述集合時計一次；Follow-up Pending 在 release、Project 子任務在 unlock 才算，工作量採當時最終倍率快照。\n- Processed Workload：實際 WORK 進度增量，包含未完成與暫停的部分進度；不包含吃飯、睡眠、娛樂。Ratio=processed/generated；每日驗證 generated=processed+remaining，避免漏算或重複。\n- Overdue Completed／Revenue Loss：使用完成瞬間的正式期限判定及實際 rounding，損失=原報酬−實收；精確準時邊界沿用原規則。\n- Gross Income：工作和專案收入；Product Cost：實際訂閱／產品支出；Net Income=Gross−Product Cost，另列 moneyNetChange（包含所有其他遊戲支出）。\n- Rework Count：已完成品質相關後續工作 REWORK／CORRECTION／MISSING_INFO，不是生成件數。\n- Promotion Eligible Days %：每工作日上班錨點檢查一次 canPromote，合格日數／取樣日數；最長連續不合格天數採同一日取樣序列。資金與逾期皆按正式規則，固定職級新人。\n- 起點為 Day 1 世界 0 秒；10／20／30 日期末為 Day 11／21／31 上班錨點，包含最初早餐時間。平均值亦包含此段。\n\n';
report+='## 30 日配對差值摘要（ON − OFF，30 對平均）\n\n| 年齡／效率／品質 | 平均 Todo | 平均逾期 | 工作量處理率 | 毛收入 | 產品成本 | 淨收入 | 返工 | 升職合格百分點 | 最長不合格天數 |\n|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|\n';
for(const scenario of [...new Set(runs.map(r=>r.scenario))]){const g=paired.filter(r=>r.scenario===scenario&&r.workdays===30),f=(m:string)=>average(g,m).toFixed(2);report+=`| ${scenario} | ${f('averageTodo')} | ${f('averageOverdue')} | ${f('processedGeneratedWorkloadRatio')} | ${f('grossIncome')} | ${f('productCost')} | ${f('netIncome')} | ${f('reworkCount')} | ${f('promotionEligibleDaysPercent')} | ${f('longestPromotionIneligibleStreak')} |\n`;}
report+='\n## 匯出檔案\n\n- runs.csv：2,880 筆，各 seed 在 10／20／30 日全部指定指標。\n- daily.csv：28,800 筆每日狀態／升職資格。\n- scenario-summary.csv：96 筆 Scenario × 日數的 30 次平均（Average／Final／Peak 分別平均，不是合併峰值）。\n- paired-differences.csv：1,440 筆 ON−OFF 配對差值。\n- paired-summary.csv：各指標配對平均、SD、SE、95% 區間與最小／最大差值。\n- results.json：結果與本次完整 Config、seed 快照。\n\n重跑：在遊戲目錄執行 `npm run simulate:paired`。\n';
await writeFile(`${dir}/REPORT.md`,report);console.log(`匯出完成：${runs.length} 筆期末、${daily.length} 筆每日、${paired.length} 筆配對差值。`);
