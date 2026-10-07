# Promotion Assignment V1 實作與隔離驗證

本輪僅接入升職考核、穩定資格判定、低調摸魚、Save／UI／Debug 防護與測試。沒有重建 GameState、第二套時鐘、Auto Tune、Commit 或 Push；沒有重跑 900 Career Runs，既有 Career、Career V2 與 Meeting 報告保留。

所有新門檻、工作量、0.8 倍率與 3 工作日冷卻均為 **PROVISIONAL**。

## 1. 正式架構與流程

- `src/game/career/promotionAssignment.ts`：資格 helper、WorkStart 一次性安排、下班通知、考核建立、完成與失敗。
- `src/game/career/promotion.ts`：保留 canPromote 的資金／未解決逾期條件，抽出共用 promoteTransaction。成功考核呼叫此交易；原 promote action 僅保留內部／Debug／Test 用途。
- `src/game/state/gameState.ts`：在原 GameState 增加 promotion 區塊與 PROMOTION Target，原 Todo／Project／Meeting 結構保留。
- `src/game/engine/SimulationLoop.ts`：唯一時間與進度迴圈，新增專屬期限 boundary 與離線暫停例外。
- `src/game/targets/targetManager.ts`：沿用 effectiveWorkSpeed；接入晚餐後考核與原有娛樂／睡眠流程。

WorkStart → 穩定資格與金錢／逾期檢查 → SCHEDULED → OffWork 通知並取代普通 Boss Check → 完成原工作 → Dinner → PROMOTION → 完成時正式交易 → Entertainment（時間足夠時）→ 原固定 Sleep Window。

下班錨點到達時，已接工作不被中止；考核安排會保持 pending，即使原工作跨午夜或上班錨點也不遺失。考核期限在它實際開始時設定為下一個 WorkStart。原有 Boss 工作或 Boss Meeting 尚未結束時不安排新的考核，避免衝突。

PROMOTION 不進 Todo selector，不產生 Follow-up、Project Parent Bonus、普通工作收入、CompletedWork 計數或逾期收入折扣；不使用 Boss Severity／Reward，也不乘 Rank 或 Age 工作量。產品／暫時工作速度效果仍透過正式 effectiveWorkSpeed 作用於實際處理。

## 2. 資格與低調摸魚

```text
Qualification E = rawWorkSpeed × permanentMultiplier(workEfficiency)
Qualification Q = rawWorkQuality × permanentMultiplier(workQuality)
Evaluation E/Q = Qualification E/Q × (Low Profile ON ? 0.8 : 1)
```

採用既有 helper，包含 Base、Run Level 與 Permanent。排除睡眠 modifier、Problem Debuff、Temporary Buff、產品短期效果、Agecare 效率補償、Meeting 與當前 Target。拍馬屁與摸魚等級不參與資格計算。

E60 ×0.8 =48；測試將要求設為 E50 時確認不符合資格，實際工作仍使用 E60。Low Profile 只在 WorkStart 決定是否安排；白天切換不即時建立或取消考核，已 scheduled／pending／active 的考核不取消、不變慢、不改工作量或期限。

| 考核 | 效率需求 | 品質需求 | 固定工作量 | 名稱 |
|---|---:|---:|---:|---|
| R0→R1 | 26 | 16 | 130 | 獨立需求處理 |
| R1→R2 | 38 | 24 | 209 | 重要客戶提案 |
| R2→R3 | 55 | 34 | 330 | 部門協調改善案 |
| R3→R4 | 78 | 48 | 507 | 年度策略方案 |

原 promotionCost 220／900／2800／9000，以及下一階 maxOverdueAllowed 3／2／1／0 完全保留。完成時再次檢查正式交易條件；資金已花掉或逾期條件失效時，Rank 不變、不得負資金，狀態 FAILED_REQUIREMENT 並顯示原因。

## 3. 成功／失敗邊界與冷卻

同一 timestamp 的順序：目標完成 → 升職交易 → 專屬期限失敗 → WorkStart 判定／作息。恰好 WorkStart 完成算成功；尚未完成才清除考核。暫停在 suspendedTargets 的考核也會受期限約束。

失敗無額外罰款，不留下剩餘進度、不生成 Todo／Follow-up；retryAvailableWorkday = 失敗當下工作日 +3。到第三個後續 WorkStart，重新符合資格就安排同一固定考核，不增加難度。期限失敗為 COOLDOWN；交易失敗先顯示 FAILED_REQUIREMENT，再由後續上班判定維持冷卻。

## 4. UI／Save／Prestige／Offline

正式升級頁移除立即升職按鈕，改顯示資格 E/Q、判定 E/Q、資金、逾期限制、狀態、重試工作日與失敗原因。低調摸魚說明它不影響實際工作。中央卡使用獨立獎章圖示與配色，顯示考核名稱、進度、正式處理速度、ETA、下一個 WorkStart 期限與「完成即可升職」。維持既有四頁導航。

原 SaveVersion／CoreVersion 保留。promotion 保存 lowProfileEnabled、status、lastCheckedWorkday、scheduledWorkday、from/toRank、assignmentId、created/startedAt、deadlineWorldTime、requirement、progress、retryAvailableWorkday、failureReason、pending。Target 同時保留考核處理 metadata。中途重讀不重置工作量／進度／期限。舊 Save 只增量補 promotion 預設值，不推算舊當日資格、不消耗 RNG，不更改原 Rank、金錢、能力、Permanent、Todo、Project、Work、Meeting、Boss 或產品。

Prestige 依既有初始狀態流程清除全部考核安排／進度／冷卻，Low Profile OFF；Reward／Clarity／Gate 未改。

**離線專屬例外：**原世界、一般工作、年齡、續費與收入仍走正式 offline advance；不建立或完成升職考核、不直接升職。既有 ACTIVE 考核先移出離線處理，保持其進度；離線結束時恢復它，期限增加實際離線結算所推進的世界秒數。之後線上繼續。既有 SCHEDULED 安排保留，工作日平移，離線不建立其 Target。Offline 的實際遊玩計時仍為零，不放寬 Prestige Gate。

Debug 增加唯讀考核狀態、穩定與判定 E/Q、進度及期限；強制 Boss Catch／Escape Outcome／Boss Meeting 操作在已安排或正在考核時拒絕，避免 Debug 製造同晚混合事件。

## 5. Promotion Assignment Isolation

16 情境：4 Rank × 門檻／處理效率 +20%／處理效率 +50%／門檻且 Low Profile ON；每情境 30 次，共 **480 Runs**。Age22、Products OFF、Prestige Reset OFF、Offline OFF、普通晚餐、正常睡眠；排除額外 Boss、Meeting 與隨機事件。

使用正式 advance、Dinner、PROMOTION、Sleep Window 與只讀時間 hook，沒有用工作量除以速度取代測量。隔離 fixture 在 WorkStart 評估資格，接著設到受控 OffWork 40 秒，排除白天 Todo／Project backlog 的干擾。因此這些是**考核本身的晚間耗時驗證**，不是完整 Career 平衡或真實白天工作壓力結論。

精確 +20%／+50% 使用測試專用臨時 workSpeed modifier，以便保持整數 Run Level 及正式 E/Q 公式；它只建立精確處理速度情境，基礎資格仍為門檻值，沒有寫回任何正式 Config 或存檔。30 個不同 seeds 在此無隨機干擾的受控情境得到相同結果，不應解讀為 30 個有變異的隨機樣本。

| 考核 | Dinner 完成／考核 Start | Finish | 處理秒數 | Sleep Anchor | 碰到 Sleep | 跨 WorkStart 68s | 判斷 |
|---|---:|---:|---:|---:|---|---|---|
| R0→R1 | 44 | 49 | 5 | 50 | 否 | 否 | HEALTHY |
| R1→R2 | 44 | 49.5 | 5.5 | 50 | 否 | 否 | HEALTHY |
| R2→R3 | 44 | 50 | 6 | 50 | 是，恰好錨點 | 否 | HEALTHY |
| R3→R4 | 44 | 50.5 | 6.5 | 50 | 是，超過 0.5s | 否 | HEALTHY |

門檻玩家娛樂可用時間為 1／0.5／0／0 秒，均不足以完成原正式娛樂需求，因此略過娛樂；實際睡眠為 18／18／18／17.5 秒。R2 雖碰到睡眠錨點，沒有損失睡眠；R3 損失 0.5 秒。沒有任何門檻玩家通宵。

| 考核 | +20% 處理秒數 | 較門檻減少 | +50% 處理秒數 | 較門檻減少 |
|---|---:|---:|---:|---:|
| R0→R1 | 4.166667 | 0.833333 | 3.333333 | 1.666667 |
| R1→R2 | 4.583333 | 0.916667 | 3.666667 | 1.833333 |
| R2→R3 | 5 | 1 | 4 | 2 |
| R3→R4 | 5.416667 | 1.083333 | 4.333333 | 2.166667 |

處理時間分別縮短 16.67%／33.33%；固定工作量未隨能力放大。四階 Low Profile 門檻玩家均未安排考核。

HEALTHY 判讀：門檻玩家進入晚間、於 Sleep 附近完成，且不需跨下一次 WorkStart。CSV 的輔助分級使用 Finish <48 秒標 TOO_LIGHT、跨上班或無法完成標 TOO_HEAVY，其餘 HEALTHY；這是報告診斷界線，不是正式 Config 或自動校準規則。效率較高玩家較早完成是預期收益，不因此自動增加考核工作量。

## 6. Config 與既有系統保護

新增的正式 Config 限於 promotionQualification、promotionAssignment、promotionLowProfile。Excel 從 140 列增至 144 列，新增 requirements、assignments、retryWorkdays、multiplier；**原 140 列含 description 全部 deep-equal**。

既有 JSON Balance 排除三個新增區塊後 deep-equal：Boss Base Workload 50、Boss Reward／Attention／Severity／Escape、Meeting Duration／Chance／Compensation、Run Cost、Prestige、Permanent、Rank Reward、Age、Products、Work／Project／Follow-up、一般 Deadline、Sleep／Lunch／Entertainment 均未改。

Boss／Meeting 正式演算法未改；考核當晚改走 Promotion 分支，白天 Normal Meeting 仍使用原排程。舊報告不覆蓋。備份保留於 config/archive/game_config-pre-promotion-v1.xlsx 與同名 JSON。

`promotion-config-before.json` 是新增 defaults 後、Excel 還沒有新列時觀察到的 converter 輸出，含新區塊預設值；真正舊 Balance 的比較基準為 `promotion-config-before-existing-balance.json`，並由新增前 Excel 原 140 列獨立驗證，避免把新增預設值混充舊設定。

## 7. Regression 與交付

- `npm test`: **381 / 381 PASS**, including **33 Promotion V1 tests**.
- `npm run test:browser`: **29 / 29 PASS**, including **3 Promotion V1 browser tests**.
- `npm run build`: **PASS** (Config conversion, TypeScript, Vite).
- Config verification: existing JSON Balance and all 140 existing Excel rows deep-equal.
- Isolation: 16 scenarios x30 =480 Runs, all expected controls PASS.

核心測試含規格 A–Z，以及晚間延後工作、跨日 pending、suspended 期限、完成時逾期條件失效、已安排考核離線、無效 delta 不變與 Debug Boss 排他防護。既有 Todo／Follow-up／Project／Boss／Meeting／Save／Prestige 回歸保留。既有逾期 UI 測試改驗證沒有直接 Promote 按鈕，不再驗證舊按鈕 disabled。

交付：PROMOTION_V1_IMPLEMENTATION_REPORT.md、promotion-isolation-summary.csv、promotion-isolation-runs.csv、promotion-sanity.json、promotion-config-verification.json；另附完整測量 JSON、Config 前後快照、測試 logs、手機截圖及 AI review ZIP。

本輪結論只適用於上述考核隔離與回歸。沒有據此調整任何正式平衡，也沒有重跑完整 Career。
