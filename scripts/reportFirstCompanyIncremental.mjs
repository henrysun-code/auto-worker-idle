import fs from 'node:fs';
import assert from 'node:assert/strict';
const root=new URL('../',import.meta.url),out=new URL('reports/first-company-incremental-v1/',root);
const before=JSON.parse(fs.readFileSync(new URL('config-before.json',out))),after=JSON.parse(fs.readFileSync(new URL('config/generated/game_config.json',root)));
fs.writeFileSync(new URL('config-after.json',out),JSON.stringify(after,null,2));
const protectedKeys=['upgrades','runUpgradeCurve','prestige','products','food','boss','meeting','projects','followUps','deadlines','age','life','lunch','sleep','offline'];
for(const key of protectedKeys)assert.deepEqual(after[key],before[key],`Protected balance changed: ${key}`);
for(let i=0;i<5;i++){const a={...after.ranks[i]},b={...before.ranks[i]};delete a.recommendedSpeed;delete a.recommendedQuality;delete b.recommendedSpeed;delete b.recommendedQuality;assert.deepEqual(a,b);}
const differences=[];
function walk(a,b,path=''){if(JSON.stringify(a)===JSON.stringify(b))return;if(a&&b&&typeof a==='object'&&typeof b==='object'&&!Array.isArray(a)&&!Array.isArray(b)){for(const k of new Set([...Object.keys(a),...Object.keys(b)]))walk(a[k],b[k],path?`${path}.${k}`:k);}else differences.push({path,before:a??null,after:b??null});}
walk(before,after);
fs.writeFileSync(new URL('config-verification.json',out),JSON.stringify({protectedKeys,protectedBalanceUnchanged:true,rankRewardCostAndResistanceUnchanged:true,differences},null,2));
const telemetry=JSON.parse(fs.readFileSync(new URL('buy-all-summary.json',out)));
const parse=name=>{const [header,...lines]=fs.readFileSync(new URL(name,out),'utf8').trim().split(/\r?\n/);const keys=header.split(',');return lines.map(line=>Object.fromEntries(line.split(',').map((v,i)=>[keys[i],v.startsWith('"')?JSON.parse(v):v===''?null:Number(v)])));};
const purchases=parse('buy-all-purchases.csv'),etas=parse('buy-all-etas.csv');
const median=v=>{v=v.filter(x=>typeof x==='number'&&Number.isFinite(x)).sort((a,b)=>a-b);return v.length?(v[Math.floor((v.length-1)/2)]+v[Math.floor(v.length/2)])/2:null;};
const f=x=>x===null?'N/A':Number(x.toFixed(3));
const abilityEtas=Object.fromEntries(['efficiency','quality','flattery','lifeManagement','slacking'].map(id=>[id,median(etas.map(r=>r[id]))]));
const rankMetrics=[0,1,2,3,4].map(rank=>({rank,purchases:purchases.filter(p=>p.rank===rank).length,medianGap:median(purchases.filter(p=>p.rank===rank).map(p=>p.sincePreviousAnyUpgradeSeconds)),medianNextETA:median(etas.filter(p=>p.rank===rank).map(p=>p.medianNextUpgradeETA))}));
fs.writeFileSync(new URL('telemetry-aggregates.json',out),JSON.stringify({abilityEtas,rankMetrics},null,2));
const report=`# FIRST COMPANY INCREMENTAL REWORK V1

日期：2026-10-08。直接修改 games/auto-worker，保留 GameState、唯一 SimulationLoop、Target/suspendedTargets、四頁 UI 與美術。所有新數值都是 PROVISIONAL；沒有 Auto Tune、沒有 900 Career Runs、沒有新增 R5 或第二家公司。

## 1. 檔案與核心流程

- Config：src/config/v2Defaults.ts、config/game_config.xlsx、config/generated/game_config.json、scripts/config.ts；一次性 scripts/updateFirstCompanyIncremental.ts。原 Excel 備份 config/archive/game_config-pre-first-company-incremental-v1.xlsx。
- 角色狀態：src/game/state/gameState.ts、initialState.ts。僅增量新增可選日長座標／考核日與晚餐處理標記、FAILED_OVERTIME／COMPLETED_PENDING_DINNER；沒有重新建立 State。
- 模擬：src/game/engine/SimulationLoop.ts、GameEngine.ts、debugActions.ts。advanceOnline 與 advance 共用 runAdvance；真人預算只控制世界區間速率，不增加第二套世界鐘。
- 需求／考核：src/game/career/promotionAssignment.ts、src/game/targets/targetManager.ts。
- 工作：src/game/work/todoManager.ts；沒有重寫 selector、Follow-up、Project 或 Boss。
- 存檔：src/game/save/saveGame.ts、dayDurationMigration.ts。
- UI：src/components/TargetCard.tsx、src/game/presentation/target.ts、src/screens/Upgrades.tsx。睡眠 ×60、考核晚餐期限、失敗加班文案。
- 測量：scripts/firstCompanyTelemetry.ts、scripts/reportFirstCompanyIncremental.mjs。
- 測試：tests/promotion-v1.test.ts 更新為 V2（舊檔保存於本輪報告資料夾）；tests/legacyBalanceFixture.ts 明確隔離舊 Config。既有 *.test.ts 以一行 import 保留歷史 60 秒／E20／Q10 fixture；正式新規則另以 38 項驗證。browser 的 age-promotion、corrections、deadline、product-framework、progression、promotion-v1、targets 更新為實際 180 秒／E10。scripts/productFrameworkRegression.ts 僅讓歷史比對排除無遊玩效果的新增存檔日長標記，將本轮結果另存新資料夾，未改產品規則。

## 2. 完整時間軸（世界秒）

| 節點 | 世界時間 | 規則 |
|---|---:|---|
| Day 起點／早餐可開始 | 0 | 免費普通食物仍需4秒；既有早餐截止不變，只按比例映射 |
| WorkStart／早餐截止／Deadline 工作日切換 | 24 | 睡眠結算後保留一次早餐資格；達標考核當場最高優先 |
| 午餐／午休窗口開始 | 60 | 普通日吃午餐，餘時休息；考核日整段略過 |
| 午休窗口結束 | 84 | 普通日按輸出取得原 Buff；考核日沒有輸出或 Buff/Debuff |
| 正常下班／Dinner／考核期限 | 120 | 同 timestamp 先完成，再判定考核失敗，再晚餐 |
| 娛樂 | 晚餐／強制工作完成後至150 | 沿用時間足夠才生成條件 |
| Sleep 開始 | 150 | 正式 SLEEP Target 時使用 Config ×60 |
| 世界換 Day | 180 | 不終止 Target；期限工作日不在午夜切換 |
| 次日 WorkStart／Sleep 結束 | 204 | 54世界秒睡眠結算，回1x；早餐資格與新考核判定 |

所有 anchor 保留在 Config 的 referenceDayDuration=60 座標，唯一 scaledSeconds ×3 換算。沒有額外 anchor 或世界時間系統。一天180，正常完整睡眠窗口54世界秒（不是任意設成60）。

## 3. Sleep ×60

- 正式 currentTarget.type=SLEEP 才使用 sleepTimeAcceleration=60；暫停在 stack 的 Sleep 不加速。
- 睡54世界秒真人0.9秒；跨 WorkStart 完成後，該 Tick 餘下真人時間立刻以正常倍率消耗。正常玩家1x；既有 Debug 2/5/10x仍保留，Sleep採60x而不是再乘Debug倍率。
- 事件、Buff到期、Meeting、食物、Boss、Promotion 與產品續费邊界仍由同一 runAdvance 逐邊界處理。Sleep 被其他 Target 打斷即回正常倍率。
- Sleep duration/output依實際睡眠世界區間累積，完整睡眠 ratio=1；Offline只使用既有世界日換算，無再乘60；Debug advance不增加 activeSeconds。
- 存檔記錄日長座標；舊60秒資料一次按比例換算世界 timestamp、窗口、效果／訂閱剩餘時間，保留工作量、進度、錢、等級、年齡與真人在線時間。新睡眠中讀檔自然按 currentTarget 恢復60x。
- 舊晚間 ACTIVE考核讀檔已超過新版Dinner時標為 FAILED_OVERTIME並保留原工作；原 SCHEDULED轉待啟動，不默默刪除。

## 4. 第一公司 Base／Recommended 與 Workload Tier

| Rank | 名稱 | 推薦 E / Q | 普通中央工作量 | 推薦E下中央耗時 |
|---|---|---|---:|---:|
| R0 | 新人 | 10 / 6 | 70 | 7世界秒 |
| R1 | 一般員工 | 20 / 12 | 140 | 7世界秒 |
| R2 | 資深員工 | 40 / 24 | 280 | 7世界秒 |
| R3 | 主管 | 80 / 48 | 560 | 7世界秒 |
| R4 | 經理 | 160 / 96 | 1120 | 7世界秒 |

Base E=10、Q=6只影響原 base stat；五種 Run Level仍從0開始，其他能力沒有贈送等級。正式線性增量與升級成本曲線完全不變。

Normal/普通池（含既有 urgent模板）建立時：Tier[建立時Rank] × clamp(template.workload/100,0.75,1.4) × 建立時AgeMultiplier；5.25～9.8世界秒（Age22、推薦E、無其他倍率）。模板形狀保留名稱、權重、收入、品質要求，只映射工作量；較大原模板可能同達上限，但每Rank累積池仍有不同工作量。

Tier已包含Rank跳階，因此 rankWorkloadMultiplierAtCreation=1，絕不再乘原Rank workloadMultiplier。Base snapshot存的是Tier後、Age前量；舊工作不因能力提高／升職再改需求。R1中央140：E20=7秒、E40=3.5秒、E100=1.4秒。沒有 currentEfficiency×targetSeconds 公式。

Boss仍是基礎1遊戲小時（本輪7.5世界秒×基礎E10）再套原Rank／Age／Severity各一次；Project保留建立時Rank快照、子任務解鎖時Age快照；Follow-up從未乘Age的父Base派生，延迟释放只重取Age，保留原Rank快照与Boss专用标记清除。Normal的Follow-up繼承Tier後Base及Rank=1，不重乘Rank Tier。

## 5. Promotion Assignment V2

| 升職 | 接任務 E / Q | 快照工作量 | 門檻E下耗時 | 可工作時間 |
|---|---|---:|---:|---:|
| R0→R1 | 20 / 12 | 2304 | 115.2世界秒 | 96世界秒 |
| R1→R2 | 40 / 24 | 4608 | 115.2世界秒 | 96世界秒 |
| R2→R3 | 80 / 48 | 9216 | 115.2世界秒 | 96世界秒 |
| R3→R4 | 160 / 96 | 18432 | 115.2世界秒 | 96世界秒 |

固定快照=Qualification Threshold E × scaled(OffWork−WorkStart) × workloadFactor1.20。96世界秒包含略過午餐／午休的整個白天；實際Buff/事件會影響處理速度，不改快照。沒有首考強制失敗。Low Profile仍只將穩定E/Q判定×0.8，實際effectiveWorkSpeed完整保留。舊 assignments.workload欄位留給封存V1工具，相當於已停用資料；正式引擎不讀130/209/330/507。

WorkStart達標立即建立、必要時將原Target連同進度推入suspendedTargets；考核不進Todo、不生成Follow-up、沒有普通CompletedWork、普通Work Reward或Project Parent Bonus。當日標記跳過午餐／午休正負效果，早於Dinner完成後也不追補午餐。

- 完成<120：先記錄 COMPLETED_PENDING_DINNER，不提前升職；到120才共用 promoteTransaction 再驗證並扣款升職。完成恰好120：同timestamp先完成，再執行交易，算準時成功。
- 120仍有剩餘：狀態FAILED_OVERTIME即確定失敗；保留id、requirement與progress，Dinner成為当前FOOD，考核暫放stack。
- Dinner完成：從stack取回同一考核，繼續原進度到真正完成；失敗不可翻成功，不補升職，不進普通收益/Follow-up。failedCompletionReward=0集中Config。
- 問題處理持有考核時，Dinner boundary依然確定失敗並開始晚餐，所有被中断Target保留。
- Offline維持既有例外：世界繼續、考核暫停，不建立／完成／升職；期限按離線真正推进的世界時間平移，回在線繼續。

## 6. Cooldown與交易分層

retryWorkdays仍為3，沒有修改。程式從失敗所在的Deadline工作日index+3取得retryAvailableWorkday，再於WorkStart檢查；這不是從Dinner起整整3個完整180世界秒。在Day0 Dinner失敗，最早Day3 WorkStart重評；中間Day1/2為完整日。若失敗工作仍未做完，不能接新考核，即使冷卻已過。

無加班／中斷、普通1x、每個完整日含54秒Sleep×60時：

| 完整工作日起點間隔 | 世界時間 | 真人時間 |
|---|---:|---:|
| 1日 | 180秒 | 126.9秒（2分6.9秒） |
| 2日 | 360秒 | 253.8秒（4分13.8秒） |
| 3日 | 540秒 | 380.7秒（6分20.7秒） |

睡眠被其他需求占用則真人更久；全部未進SLEEP時可達每完整日180真人秒。Day0 Dinner120→Day3 WorkStart564的原機制理想間隔為444世界秒、284.7真人秒（3次完整Sleep），不是上表3完整日。

| 階段 | 驗證 |
|---|---|
| A 接任務前 | WorkStart一次；穩定Base+Run+Permanent E/Q（LowProfile只此处×0.8）；有下一Rank；Money≥next.promotionCost；未解決Overdue≤next.maxOverdueAllowed；冷卻；無未完考核／强制Boss／BossMeeting |
| B 截止成功 | 需求真正完成且timestamp≤當日OffWork/Dinner。无随机率；任何剩余確定失敗 |
| C Dinner成功交易 | 原Rank仍等於fromRank；canPromote再次檢查Money、Overdue與promotionCost，再正式扣款升職。若Dinner交易时資金/逾期條件失效則FAILED_REQUIREMENT，沒有負債或補升職 |

原promotionCost=220/900/2800/9000及Overdue上限3/2/1/0維持。

## 7. 驗證

- 本輪正式規則 deterministic 38項（含一天180、Sleep分段／世界輸出／Reload／Offline／中斷倍率、WorkStart立即、Lunch例外、Dinner前与精确timestamp成功、剩余量失败／晚餐／同id加班、LowProfile、交易重验、冷卻、Tier、Boss/Project/Follow-up及多日State有效）。
- npm test：440／440通過；最終精確結果見本輪 core-tests.log。其中402項历史Config回歸，不應誤稱全部都在新正式數值下執行；38項使用新Config。產品歷史119完整fixture仍通過。
- browser：32／32，使用正式180秒數值；重點含睡眠×60显示与醒来、午夜／WorkStart Deadline、考核早上／失败加班／成功／Reload、产品、Boss长加班、手机布局。最終log见browser-tests.log。
- npm run build：TypeScript與Vite成功，84modules；最终记录build.log。
- Config保護比對PASS：完整differences见config-verification.json，before/after独立保存。游戏逻辑修改没有更改本轮禁止的Balance键。

## 8. BUY_ALL小規模正式引擎测量

3個固定Seed×60真人分鐘，Products OFF、Prestige OFF、LowProfile OFF、速度1x；使用正式advanceOnline、applyAction、Config。BUY_ALL每0.25真人秒按當下最便宜能力的價格連續買盡所有可負擔升級，不保留升職資金、不修改Money/Overdue条件。測量是策略，不加入玩家自動買能力。

| Seed | 最早考核（真人分鐘） | 最終Rank | 購買間隔median（秒） | next-upgrade ETA median（秒） | R4 |
|---|---:|---:|---:|---:|---|
${telemetry.runs.map(r=>`| ${r.seed} | ${f(r.firstPromotionRealSeconds/60)} | ${r.rank} | ${f(r.medianObservedUpgradeGap)} | ${f(r.medianNextUpgradeETA)} | >60分鐘，censored |`).join('\n')}

三組都只收到一次考核且首次成功；加班時長0。沒有R2/R3/R4樣本，因此不能證明30～40分鐘到R4或後段／SoftWall20～30秒升級目標。購買間隔可能0（同一Tick多次買），不是手動玩家的每次有意義操作時間。

| Rank | 全部購買筆數 | 任意升級間隔median | median next-upgrade ETA |
|---|---:|---:|---:|
${rankMetrics.map(r=>`| R${r.rank} | ${r.purchases} | ${f(r.medianGap)} | ${f(r.medianNextETA)} |`).join('\n')}

各能力next-buy ETA跨三seed／全部秒取樣median：${Object.entries(abilityEtas).map(([k,v])=>`${k}=${f(v)}秒`).join('；')}。

ETA定义：在当前钱包保持不动的假設下，max(0,nextCost−money)／过去60真人秒的实际毛收入；无收入为null。各能力竞争同一钱包，因此ETA仅诊断，不保证实际下一次购买时间，不能和上述节奏目标直接等同。第一轮约3～6秒、中段6～10、后段10～20、SoftWall20～30及R4 30～40分钟只列为后续验证目标，没有自动调值。

已輸出buy-all-purchases.csv（每次购买的真人／世界时间、等级、费用、与上一任意升级间隔、各能力ETA）、buy-all-etas.csv（每真人秒各能力与median ETA）、buy-all-ranks.csv、buy-all-promotions.csv（首次／每次接考核、成功／失败／加班完成）、buy-all-summary.json及telemetry-aggregates.json。完整原始文件保留本地，不覆盖Career V3历史报告。

測量提示：最便宜買盡策略持续消耗资金，既有升职资金与逾期门槛可能延后接考核；未建立反事实或归因占比，不能仅凭3seed判定唯一原因。下一轮宜对照保留promotionCost的BUY_ALL策略，并记录资格失败原因。这里未偷偷添加资金保留、删除交易条件或修改成本。

## 9. 本輪沒有改動

Prestige Reward、30 active-minute gate、Clarity costs、全部Permanent倍率/成本、Run升级成本／增量、Rank报酬／promotionCost／Overdue上限、产品定义／价格／效果／订阅周期、Boss概率／逃跑公式、Project奖励／DAG、Follow-up机率／数量／奖励／深度／Root上限、Deadline profile与折扣、Age倍率、Sleep效果曲线、Lunch效果曲线、娱乐条件、第二家公司／Job Market、底部导航及美术均保留。

睡眠速率只改变在线真人等待，延长日长会自然改变世界时间相关系统的真人周期；这不是产品或收入公式重平衡。旧存档时间坐标转换／新考核的离线保护属于兼容修复。未自动Commit、Push或部署；公开网页仍为上一部署版本。
`;
fs.writeFileSync(new URL('FIRST_COMPANY_INCREMENTAL_REWORK_V1_REPORT.md',root),report);
fs.writeFileSync(new URL('FIRST_COMPANY_INCREMENTAL_REWORK_V1_REPORT.md',out),report);
console.log(JSON.stringify({configProtected:true,rankMetrics,abilityEtas},null,2));
