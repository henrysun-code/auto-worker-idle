# V2 核心數值／日程改造

2026-10-06。本輪完成 Architecture、Regression、Formula Verification、Curve Preview；沒有 Career Balance、自動 Tune、Commit 或 Push。

## 1. 正式修改範圍

- Config：`src/config/v2Defaults.ts`、`scripts/config.ts`、`config/game_config.xlsx`、`config/generated/game_config.json`。
- State／Save：`src/game/state/gameState.ts`、`initialState.ts`、`src/game/save/saveGame.ts`。
- 能力／費用：`src/game/work/workStats.ts`、新增 `progression.ts`、`src/game/prestige/permanentUpgrades.ts`。
- Boss／日程：`src/game/career/bossEvents.ts`、`src/game/targets/targetManager.ts`、新增 `sleepWindow.ts`、`src/game/time/schedule.ts`、`src/game/engine/SimulationLoop.ts`、`debugActions.ts`。
- UI：`src/screens/Home.tsx`、`Upgrades.tsx`、`src/components/DebugPanel.tsx`、`TargetCard.tsx`、`src/game/presentation/target.ts`。
- 工具／驗收：新增 `scripts/update-progression-core.ts`、`preview-progression-curves.ts`、`verify-progression-config.ts`、`tests/progression-core.test.ts`、`tests/browser/progression.spec.ts`；更新既有測試的被取代預期，以及 `scripts/test-ranks.ts` 的舊 Boss 公式引用、`balanceInstrumentation.ts` 的 Boss 觀測定位字串。觀測副本與正式引擎完整State／RNG一致性驗證通過，沒有重跑Balance批次。

沒有重建 GameState 或 Simulation Engine。Loop 只增加同一 sleep window 的邊界，沿用原進度、完成、到期、Pending、續費、日程及選取順序。沒有增加新工作、專案、產品、能力、資源或永久路線。

## 2–7. 能力與 Boss

Efficiency Raw = baseWorkSpeed + Level；Quality Raw = baseQuality + Level；Life Management Raw = Level。

生活管理經集中轉換取得既有生活速度／午休效果：baseLifeSpeed + Raw×0.2；baseRestOutput + Raw×6，仍依原永久與暫時倍率計算。睡眠另留 sleepOutputRate hook，本輪回傳1，不吃生活管理。

Flattery Work Income = 1 + Level×0.01。只在統一 WORK Reward Pipeline 套一次，涵蓋 NORMAL／FOLLOW_UP／PROJECT Subtask／BOSS／EVENT；Parent Bonus 不套拍馬屁。

Boss Attention = 0.10 + Flattery Level×0.02，不 Clamp、不加 Rank。Attention<1：Bernoulli 成功才 Encounter，Severity=1；Attention>=1：必定 Encounter，Severity=floor(Attention)+Bernoulli(小數部分)。仍需獨立 Escape Check，失敗才是實際被抓並生成加班。

Escape = successValue/(successValue+85+rankEscapeResistance)，successValue=15+Slacking Level。PROVISIONAL Rank Resistance：0／4／9／14／20，非已完成平衡值。

Boss 只生成一件：基礎需求50（60秒日長下的1遊戲小時）×Severity，再由正式 Workload Snapshot 套Rank及Age一次；baseReward=180×Severity，再進統一Rank／Flattery／Prestige／正式產品報酬管線。Severity不在後續helper重複乘。

## 8–13. 日程與睡眠

原 Boss Check 時點保留。未觸發或成功逃跑：晚餐→足夠時間才娛樂→睡眠。逃跑失敗：晚餐→Mandatory Boss Overtime→有時間才娛樂→剩餘窗口睡眠。

Mandatory Work 的同一ID／進度跨 sleepAnchor、WorkStart、換日持續，睡眠不插隊。FOOD、Problem、Target Stack 沿用既有中斷與恢復；未完成Entertainment不能延後WorkStart。急件隔日完成後，若已是工作時段，回到該日工作流程，不重吃昨晚晚餐。

activeMandatoryBoss 同時計入 Queue／Current／Suspended；已存在時 resolveBoss 不建立第二件，也不重建／清零第一件。

Sleep Window = 當日50 → 隔日WorkStart8，按 dayDuration/referenceDayDuration 縮放。目標輸出=18 reference秒；actualSleepOutput只累積實際SLEEP且處於Window的時間×sleepOutputRate。Ratio=actualSleepOutput/targetSleepOutput。工作或中斷占用的窗口輸出0。WorkStart固定結算睡眠，即使整夜未睡亦結算Ratio0。

PROVISIONAL Control Points：

| Ratio | Speed Modifier | Quality Modifier |
|---:|---:|---:|
| 0 | −30% | −30% |
| 0.5 | −15% | −15% |
| 1 | 0% | 0% |
| 1.1 | +5% | +5% |

線性內插，超過最後點效果封頂；同一睡眠效果每窗口替換一次，不每日堆疊。效果持續至下一WorkStart，既有睡眠產品Resolver仍可處理睡眠不足。

移除正式 oversleepSeconds、oversleepPenaltyPerSecond、sleepRequirement、restedSpeed、latePenaltyPerSecond、maximumPenalty，以及 addTimeDebuff／按需求完成後睡過頭的流程。Migration僅保留辨識及清除舊欄位／舊late與oversleep效果的程式，沒有Dead Config。

注意：既有早餐截止與WorkStart同為8；睡到窗口終點會錯過早餐。本輪沒有改早餐窗口。未睡滿不會繼續睡過8秒。

## 14–16. 費用公式

Run Cost(L) = ceil(BaseCost × A^L × B^max(0,L−100) × C^max(0,L−200))。

PROVISIONAL A=1.025、B=1.015、C=1.025；SoftCap1=100、SoftCap2=200。五能力共用Shape，沿用各自BaseCost35／40／55／45／50。沒有Gameplay等級上限，Debug安全上限1000。

永久路線全部保留：Multiplier=1.10^Level；NextCost=ceil(BaseCost×2.65^Level)，目前各BaseCost5，全部PROVISIONAL。沒有有限表長限制；Reset Scope、Clarity Reward Formula完全不變。

數字仍使用既有JavaScript Number。單一費用／永久公式在超出表示範圍時回傳有限飽和值，避免Infinity／NaN；不是任意精度大數系統，不把此限制當Gameplay Level Cap。

## 17. Save／Config 遷移

沿用V2 Save Key／Version／CoreVersion。直接保留Run和Permanent Level，取消永久表長驗證。保留金錢、Todo、Project、Product、工作需求及進度。

旧Boss工作補Severity1及Mandatory標記，優先保留Current／Suspended急件；不再給其他歷史Boss工作追加第二個Mandatory標記。既有工作量／報酬不重新乘。Queued Mandatory補pendingBossId，避免被普通選取排除後永遠不啟動。

旧Sleep改為固定Window；尚未超過WorkStart則剩餘窗口繼續睡，超過則取消旧Sleep，恢復當日流程。歷史睡眠實際時長無法由旧Requirement精確還原，因此遷移開始累積新Window，沒有虛構過去輸出。刪除旧oversleep欄位及已失效效果。修正原存檔shape驗證拒絕字串pendingBossId的問題。

Excel原表完整備份，單次遷移只改本輪允許的欄位；新增公式與睡眠曲線驗證。保護檢查通過：113列完全不變，Rank除了bossModifier→Resistance外全部欄位不變；工作池、權重、專案、Follow-up、期限、年齡、產品、升職、清醒值取得公式均保留。

## 18–20. Preview與驗證

完整各能力Lv0～500及Permanent Lv0～10預覽在 `reports/progression-curves/PROGRESSION_CURVE_PREVIEW.md`。以下是目前下一級價格：

| 能力 | Lv100 | Lv200 | Lv250 | Lv300 | Lv500 |
|---|---:|---:|---:|---:|---:|
| 效率 | 414 | 21,650 | 538,436 | 13,391,298 | 5,123,624,072,694 |
| 品質 | 473 | 24,743 | 615,356 | 15,304,340 | 5,855,570,368,793 |
| 拍馬屁 | 650 | 34,021 | 846,114 | 21,043,468 | 8,051,409,257,090 |
| 生活管理 | 532 | 27,835 | 692,275 | 17,217,383 | 6,587,516,664,892 |
| 摸魚 | 591 | 30,928 | 769,195 | 19,130,425 | 7,319,462,960,991 |

定向測試60項；npm test共303項通過。npm run test:browser共24項通過；npm run build通過。涵蓋公式、Severity分支、倍率、能力超過Lv1000、睡眠比例與中斷、跨日同一急件、禁止疊加、舊Save及高Permanent Level保存、高等級UI。原Rank Content測試與Rank Balance歷史資料保留。

這些結果驗證規則與實作，不證明30分鐘／2小時Prestige或Lv250～300 Soft Wall已達成。本輪到此停止，下一輪再做Career＋Upgrade＋Prestige Simulation。
