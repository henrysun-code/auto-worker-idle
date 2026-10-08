# FIRST COMPANY PROMOTION COST REMOVAL + PAIRED RETEST

升職正式不收費：派發與成功交易均不讀取 Money / promotionCost，不扣款；逾期、E/Q、冷卻、強制 Boss / Boss Meeting 規則維持。Money Gate 確認為上一輪首次考核延到 40～46 分鐘的主因，已完成 3 Seed 完全配對與 30 Seed 擴充。**平衡驗收並非全 PASS：R4 30～40 分鐘與後期升級節奏均未達標。**

## 正式修改與範圍

- `promotion.ts`：派發使用的 canPromote 與完成交易共用資格移除 Money Gate；交易移除扣款。
- `promotionAssignment.ts`：FAILED_REQUIREMENT 文字僅保留職級／逾期；加入唯讀 WorkStart snapshot。
- `SimulationLoop.ts`：既有檢查點透過 optional onPromotionWorkStart 提供 snapshot，無新增 GameState、RNG 抽取或日程變更。
- `Upgrades.tsx`：移除資金條件，改為升職不收費。`v2Defaults.ts` 舊 promotionCost 欄位註明 deprecated metadata。
- promotionCost 220/900/2800/9000 仍保留於舊 Excel / generated config，正式派發、交易、UI 均不讀取。四職級 poison getter regression 證明讀取會拋錯時仍可零資金派發與升職。
- 升級價格、Rank Reward、一般 Workload、考核 factor 1.20、E/Q、Overdue、Cooldown、Low Profile、Prestige、Permanent、Products 全數未調整。generated Config 與基準逐值一致。

## 完全配對方法

基準為上一輪實際現有程式，先複製到 baseline-runtime，再加入與正式版相同的唯讀測量 hook。基準保留舊 Money Gate／扣款，僅供 BEFORE 測量，不被遊戲匯入。三次重現上一輪首次派發、世界時間、期末金錢與能力等級，並逐筆重現 1,785 筆購買（Seed、能力、等級、Rank、時間、成本完全相同）。

每組 3,600 actual online 秒；每 0.25 秒用正式 upgrade action 反覆買當下最便宜且可負擔能力，成本相同時沿用 Config ID 順序。沒有升職預留金、手動升職、強制成功、Prestige、產品、Low Profile、AutoTune 或固定能力。1x 沿用已正式實作的睡眠 ×60 世界時間，因此睡眠期間真人秒不等於世界秒。每個 run 獨立同 Seed 初始化；策略差異後不假設 RNG 事件仍逐一相同。

3 Seed 改善且各有 29／30／30 個「所有非金錢條件通過、僅舊金錢不合格」WorkStart，符合擴充條件。30 Seed 沿用 42+i×7919，重用已完成的 AFTER 三組，再跑其餘 27 組；共 33 次完整模擬（3 BEFORE + 30 AFTER），不是將 3 組複製成 30 組。

## 首次考核前後配對

以下時間為真人分鐘；資格→派發延遲欄為真人秒。第一次 E/Q 達標時間在前後完全相同。

| Seed | 首次 E/Q 達標 | BEFORE 派發 | AFTER 派發 | BEFORE 延遲秒 | AFTER 延遲秒 | 首次結果（前→後） |
| --- | --- | --- | --- | --- | --- | --- |
| 42 | 6.08 | 42.62 | 6.66 | 2192.50 | 34.61 | SUCCESS → FAILED_OVERTIME |
| 7961 | 3.25 | 46.09 | 4.38 | 2570.61 | 67.96 | SUCCESS → SUCCESS |
| 15880 | 3.91 | 40.67 | 4.37 | 2205.53 | 27.57 | SUCCESS → SUCCESS |

首次派發均在第一次無正式阻塞的 WorkStart。所有 AFTER WorkStart 中，非金錢条件全通過卻未派發：**0 次**。完整逐 Rank 首次資格、派發與延遲見 paired-summary.csv；每個 run 的首次合法上班驗證見 first-legal-workstart-verification.csv。

## R1–R4 與停留

以下為真人分鐘；未達者為右設限 >60，不填 0，也不拿僅成功者計整體 quantile。

| Seed | 版本 | R1 | R2 | R3 | R4 |
| --- | --- | --- | --- | --- | --- |
| 42 | BEFORE | 44.22 | >60／未達 | >60／未達 | >60／未達 |
| 42 | AFTER | 14.11 | 27.13 | 38.17 | >60／未達 |
| 7961 | BEFORE | 47.69 | >60／未達 | >60／未達 | >60／未達 |
| 7961 | AFTER | 5.98 | 19.18 | 37.31 | >60／未達 |
| 15880 | BEFORE | 42.27 | >60／未達 | >60／未達 | >60／未達 |
| 15880 | AFTER | 5.97 | 24.51 | 33.69 | >60／未達 |

每 Rank 停留秒、upgrade interval P50、median next-upgrade ETA 已輸出 paired-summary.csv；未離開的最後 Rank 停留只計觀測到 60 分鐘，標準時段之外不外推。paired-differences.csv 提供 AFTER−BEFORE；只有兩邊皆觀測到時才計差值，未達標不虛構差值。

## 每次 Promotion 開始值與結果

下表列三個配對 Seed 的全部 AFTER 考核。穩定 E/Q 為資格用數值；實際 E 已包含當時處理 Buff/Debuff，實際 E 超標比=(實際E／門檻E−1)×100%。能力購買及後續 Buff 可在考核途中改變，開始值不是整段常數。未結算不填失敗或 0%。

| Seed | 升職 | 開始分鐘 | 穩定 E/Q | 實際 E／門檻 | 超標% | Dinner 完成% | 結果 | 加班處理秒 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 42 | R0→R1 | 6.66 | 22.00/13.00 | 18.04/20 | -9.80 | 81.87 | FAILED_OVERTIME | 18.99 |
| 42 | R0→R1 | 12.51 | 30.00/21.00 | 30.00/20 | 50.00 | 100.00 | SUCCESS | 0.00 |
| 42 | R1→R2 | 19.82 | 42.00/32.00 | 42.00/40 | 5.00 | 87.50 | FAILED_OVERTIME | 13.71 |
| 42 | R1→R2 | 25.53 | 51.00/42.00 | 51.00/40 | 27.50 | 100.00 | SUCCESS | 0.00 |
| 42 | R2→R3 | 30.85 | 82.00/73.00 | 82.00/80 | 2.50 | 85.42 | FAILED_OVERTIME | 16.39 |
| 42 | R2→R3 | 36.57 | 102.00/92.00 | 89.76/80 | 12.20 | 100.00 | SUCCESS | 0.00 |
| 42 | R3→R4 | 54.00 | 160.00/152.00 | 160.00/160 | 0.00 | 83.33 | FAILED_OVERTIME | 19.20 |
| 42 | R3→R4 | 59.71 | 165.00/157.00 | 165.00/160 | 3.12 | 未達／無資料 | 60 分鐘仍未結算 | 0.00 |
| 7961 | R0→R1 | 4.38 | 27.00/17.00 | 24.30/20 | 21.50 | 100.00 | SUCCESS | 0.00 |
| 7961 | R1→R2 | 11.85 | 43.00/34.00 | 35.26/40 | -11.85 | 89.08 | FAILED_OVERTIME | 11.70 |
| 7961 | R1→R2 | 17.58 | 53.00/44.00 | 53.00/40 | 32.50 | 100.00 | SUCCESS | 0.00 |
| 7961 | R2→R3 | 24.67 | 84.00/74.00 | 84.00/80 | 5.00 | 87.50 | FAILED_OVERTIME | 13.71 |
| 7961 | R2→R3 | 30.32 | 103.00/93.00 | 74.16/80 | -7.30 | 94.08 | FAILED_OVERTIME | 5.30 |
| 7961 | R2→R3 | 35.71 | 115.00/107.00 | 94.30/80 | 17.88 | 100.00 | SUCCESS | 0.00 |
| 7961 | R3→R4 | 53.01 | 161.00/153.00 | 132.02/160 | -17.49 | 80.55 | FAILED_OVERTIME | 22.26 |
| 7961 | R3→R4 | 58.84 | 167.00/159.00 | 150.30/160 | -6.06 | 未達／無資料 | 60 分鐘仍未結算 | 0.00 |
| 15880 | R0→R1 | 4.37 | 25.00/16.00 | 22.50/20 | 12.50 | 100.00 | SUCCESS | 0.00 |
| 15880 | R1→R2 | 11.84 | 44.00/34.00 | 39.60/40 | -1.00 | 85.36 | FAILED_OVERTIME | 15.33 |
| 15880 | R1→R2 | 17.55 | 58.00/48.00 | 41.76/40 | 4.40 | 99.61 | FAILED_OVERTIME | 0.31 |
| 15880 | R1→R2 | 22.91 | 73.00/63.00 | 73.00/40 | 82.50 | 100.00 | SUCCESS | 0.00 |
| 15880 | R2→R3 | 26.55 | 88.00/78.00 | 68.64/80 | -14.20 | 88.11 | FAILED_OVERTIME | 12.45 |
| 15880 | R2→R3 | 32.09 | 100.00/90.00 | 100.00/80 | 25.00 | 100.00 | SUCCESS | 0.00 |
| 15880 | R3→R4 | 49.69 | 163.00/156.00 | 133.66/160 | -16.46 | 84.42 | FAILED_OVERTIME | 17.62 |
| 15880 | R3→R4 | 55.36 | 169.00/161.00 | 121.68/160 | -23.95 | 72.56 | FAILED_OVERTIME | 29.93 |

BEFORE 三次均成功且无加班，其开始實際 E 遠超門檻；全部 BEFORE／AFTER 每次開始 E/Q、資格 E/Q、deadline、Dinner%、加班處理及 elapsed 均在 promotions.csv / results.json。

## 30 Seed 分布

| 達到 | 達成人數 | P10 分鐘 | P50 分鐘 | P90 分鐘 |
| --- | --- | --- | --- | --- |
| R1 | 30/30 | 5.98 | 9.88 | 14.16 |
| R2 | 30/30 | 19.32 | 23.00 | 27.03 |
| R3 | 30/30 | 32.32 | 37.33 | 42.02 |
| R4 | 0/30 | >60 minutes | >60 minutes | >60 minutes |

首次率分母為該 Rank 確實派發過至少一次的 run；R3 有 28 組曾派發，24 組首次失敗、4 組首次尚未結算。平均 Dinner% 僅含已到 Dinner 的考核；重試平均分母為 30 組。未達 Rank 不是 0% 成功。

| 升職 | 考核次數 | 首次成功% | 首次失敗% | 首次未結算% | 平均 Dinner% | 平均已結算考核加班處理秒 | 平均已結算加班 elapsed 秒 | 每 run 平均重試 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| R0→R1 | 48 | 43.33 | 56.67 | 0.00 | 96.45 | 3.63 | 5.13 | 0.60 |
| R1→R2 | 61 | 3.33 | 96.67 | 0.00 | 93.57 | 7.11 | 9.14 | 1.03 |
| R2→R3 | 70 | 0.00 | 100.00 | 0.00 | 92.98 | 7.62 | 9.90 | 1.33 |
| R3→R4 | 47 | 0.00 | 85.71 | 14.29 | 82.75 | 19.47 | 23.47 | 0.63 |

加班處理秒只計 FAILED_OVERTIME 後實際處理同一 Promotion 的時間；elapsed 則从 Dinner 失敗到同一任務完成，包含晚餐等阻塞。表中平均含成功者 0 秒、排除未完成的考核；results.json 另保留所有已觀測加班量（含被 60 分鐘截斷者），不可當作完整時長。每 Seed／Rank 重試數見 rank-retries.csv。

## 升級節奏

| 目前 Rank | 任意升級 interval P50 秒 | median next-upgrade ETA 秒 |
| --- | --- | --- |
| R0 | 5.75 | 8.17 |
| R1 | 2.25 | 2.48 |
| R2 | 0.00 | 1.47 |
| R3 | 1.75 | 2.42 |
| R4 | 未達／無資料 | 未達／無資料 |

interval 為任兩次能力購買之真人秒差，跨 Rank 的間隔歸入後一次購買的 Rank；同一 0.25 秒檢查買多項時真實間隔為 0，故 R2 P50=0 是批次購買結果，不是計算遺漏。ETA 每整真人秒採樣，以最近 60 真人秒 gross income 推估維持當下錢包到各能力所需時間，取五能力 median，再對該 Rank 的採樣取 median；不是保留資金策略或實際下一次購買保證。收入 0 時 ETA=null。逐筆見 purchases.csv / etas.csv。

## 嚴格驗收 A–F

- **A PASS**：首次派發已由 40～46 分鐘提前為 4.37～6.66 分鐘；Money 主因有明確的非金錢全通過阻塞紀錄。
- **B PASS**：3 配對與 30 組全部已資格的考核，在首次無其他阻塞的合法 WorkStart 派發；未派發違例 0。當天稍晚上才買到門檻，必須等下一 WorkStart，此為既有正式規則。
- **C PASS（有壓力，不等於已完美平衡）**：三配對首次為一失敗、兩成功；30 組首次 R0→R1 失敗 56.67%。沒有三次都輕鬆成功的情況。R1→R2 首次失敗 96.67%，R2→R3 首次失敗 100%，R3→R4 所有已結算首次都失敗。factor 保持 1.20。
- **D PASS**：30/30 都到 R2、R3；不再只有 R1。
- **E FAIL**：R4 沒有落在 30～40 分鐘，0/30 在 60 分鐘達成。下一個可證實瓶頸為達到 R3→R4 的 E=160 資格過晚，之後必須處理固定 18,432 workload 的考核及失敗冷卻；未調值。
- **F FAIL**：R0 間隔 P50 5.75 秒落前期目標；後續 2.25／0／1.75 秒沒有形成 6～10、10～20、20～30 秒的牆。應標記「**經濟曲線尚未形成牆**」，沒有修改 Upgrade Cost。

## 下一個真正瓶頸

R3 階段，29/30 達到下一階資格，達標時間 P50=52.69 真人分鐘（此值條件於達標者；另 1 組到 60 分鐘仍 E=151 未達）。R3 的 WorkStart 紀錄：EQ=286；ASSIGNED=47；COOLDOWN=55；OVERDUE|COOLDOWN=9；EQ|OVERDUE=5。

到門檻 E=160 時，無干擾且處理速度不變，96 秒可處理 15,360／18,432=83.33%，固定考核需平均有效 E≥192 才準時完成。這只是可解釋的下限，不把開始 E 當整段速度；睡眠／會議／事件 Debuff 可進一步影響。29 組達標後多次失敗與三工作日冷卻，導致 60 分鐘末仍無 R4。期末 E 範圍 151～174，仍未自然跨過上述穩定處理下限。這輪只提出實證瓶頸，沒有選擇新 E 成長、workload、Cooldown 或成本數值。

## 五個正式回答

1. **第一公司 30～40 分鐘？否。** R3 P50 37.33 分鐘，但 R4 全部 >60；不能把 R3 誤稱公司完成。
2. **第一次 Promotion 是否真的有壓力？是。** 第一階首次失敗 56.67%，而非 Money Gate 後的超額能力碾壓；後續首次更難，仍需後續平衡決策。
3. **Low Profile 有存在價值？機制上是，完整 Career 收益尚未量測。** 額外隔離 regression 證明：OFF E20/Q12 考核失敗；ON 在同值不派發；ON E25/Q15 以 0.8 評估剛達20/12，實際處理效率仍25，可在乾淨無干擾考核準時成功。30組正式策略全OFF，不能聲稱已證明ON能更快到R4；1.25倍資格緩衝亦不保證抵禦所有Debuff。
4. **哪一 Rank 是第一個明顯數值牆？** 升級經濟牆尚未形成。考核壓力從 R0 已存在，R1/R2 多次重試仍全員通過；第一個使 60 分鐘觀測整體停住的 Career 牆是 **R3→R4**。
5. **是否仍有非使用者要求的人為 Gate？** 在本輪正式派發／交易路徑與 BUY_ALL 策略未發現新的 Gate：只剩已指定 E/Q、Overdue、Cooldown、未完成考核、強制 Boss／Boss Meeting 與 WorkStart 時點；Money已移除、 reserve=0。舊 Career 模擬工具仍有歷史 reserve／Money分類，這輪沒有使用它們作現行結論，亦不被遊戲匯入；後續若重新使用那些歷史工具必須另做版本遷移。沒有以此檢查宣稱整個 Repository 所有歷史工具已更新。

## 驗證與檔案

- 正式核心：446/446；包含舊系統回歸、四職級 poison cost getter、零資金派發與完成、逾期仍拒絕、hook 全 State/RNG 不變、合法 WorkStart 與 Low Profile 邊界。
- 瀏覽器：32/32；包含行動版不顯示資金條件與零資金考核成功存檔。
- npm run build：PASS；Config 生成、TypeScript、Vite。
- 歷史兩項測試的期望按正式移除成本更新：直接升職政策不再等待金錢；Prestige observer parity 改為明確 ready fixture，避免把特定舊 Career 平衡路程當作 observer 正確性條件。未修改 Prestige 生產規則。
- 詳細證据：results.json、verification.json、workstarts.csv、promotions.csv、paired-summary.csv、paired-differences.csv、rank-time-quantiles.csv、rank-aggregates.csv、rank-retries.csv、purchases.csv、etas.csv、測試／建置 logs。
- 每次 WorkStart telemetry含當前Rank、穩定E/Q、Low Profile評估E/Q、E/Q達標、逾期數與合格、冷卻、未完成考核、強制Boss／BossMeeting、派發結果及非金錢阻塞列表。firstEQQualifiedTime 於每次正式能力購買及邊界更新，首派發在引擎邊界記錄，真人時鐘不靠人工換算。
- BEFORE 專屬 legacyMoneyQualified 只為因果對照，AFTER 阻塞原因沒有 Money。任何已結算與右設限條件均保留於原始輸出。
- 原有 UI／美術、GameState、Target、工作／產品系統及之前報告保留。未 Commit、Push 或部署；公開網頁仍是先前已部署版本。
