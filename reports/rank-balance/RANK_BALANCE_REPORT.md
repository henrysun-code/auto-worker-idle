# Rank 難度／工作壓力／經濟平衡報告

基準日期：2026-10-06。Config hash：62848e8c3e9a1681d87efbfd22bb68b1880beda4ce60e0a9da4ef8faa0ff0d35。全程未改正式 Runtime、Config、玩家 Save／localStorage，未購買、升職、Prestige 或啟用產品。沿用正式引擎，只在臨時 source 副本注入無 RNG、無狀態寫入的計數觀測；Rank0／4 各 30 日與原引擎完整狀態及 RNG deepEqual。正式 source＋Excel＋generated JSON 前後 hash 一致。

## 1–6. 檔案、Build 與樣本

新增 scripts/test-rank-balance.ts、balanceInstrumentation.ts、balanceMetrics.ts、rankBalanceReport.ts、finalize-rank-balance.ts、tests/balance-metrics.test.ts。沒有修改正式 Runtime，也沒有修改 scripts/test-ranks.ts／reports/rank-tests。

| Rank | 推薦 Level／Value（效率、品質） | LOW Level／Value | HIGH Level／Value |
|---|---|---|---|
| 0 | E0/20；Q0/10 | E0/20；Q0/10 | E3/35；Q3/19 |
| 1 | E2/30；Q3/19 | E0/20；Q0/10 | E5/45；Q6/28 |
| 2 | E5/45；Q6/28 | E2/30；Q3/19 | E8/60；Q9/37 |
| 3 | E9/65；Q10/40 | E6/50；Q7/31 | E12/80；Q13/49 |
| 4 | E14/90；Q15/55 | E11/75；Q12/46 | E17/105；Q18/64 |

30 日 Matrix：40 個去重 Scenario、1200 Runs。100 日：24 個去重 Scenario、1200 Runs（Day30／60／100 各 checkpoint）。Age cross：15 Scenario、450 邏輯 Runs，其中 Age22 150 筆完全重用 Matrix，新增300條；物理總數 2700，每日快照 165000。所有 Matrix 用相同30 seeds，Long用同組前50 seeds，Cross用前30 seeds。Rank0 LOW=RECOMMENDED 的重複組合列入 scenarios.csv 的 DUPLICATE，不額外跑、不重複計入統計。

## 7–8. 推薦 Build 主表

### 30 工作日（各 Rank Mean，完整 Median／P10／P90 在 summary.csv）

| Rank | Avg Todo | Final Todo | Peak Todo | Avg Due | Avg Overdue | Peak Overdue | Overdue days % | Generated/day | Processed/day | Ratio | Outstanding slope | Income/day | Loss % | Cap days % | Promotion eligible % |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 0 | 8.83 | 8.03 | 21.20 | 3.78 | 0.98 | 9.60 | 20.22 | 557.91 | 539.32 | 0.97 | -1.03 | 241.29 | 1.15 | 6.22 | 88.89 |
| 1 | 8.50 | 7.67 | 19.33 | 3.96 | 0.30 | 4.43 | 10.11 | 823.40 | 801.37 | 0.97 | -3.02 | 789.64 | 0.46 | 2.67 | 91.44 |
| 2 | 9.73 | 11.00 | 21.10 | 4.77 | 0.50 | 5.43 | 16.56 | 1266.64 | 1216.39 | 0.96 | -0.26 | 2115.58 | 0.63 | 5.67 | 82.11 |
| 3 | 10.69 | 11.57 | 22.53 | 5.21 | 0.65 | 6.70 | 16.78 | 1824.25 | 1749.81 | 0.96 | -7.00 | 5789.74 | 0.83 | 20.89 | 76.89 |
| 4 | 11.46 | 12.07 | 23.87 | 5.31 | 1.02 | 8.70 | 24.22 | 2567.27 | 2454.22 | 0.96 | -9.19 | 15206.48 | 0.96 | 36.22 | N/A |

### 100 工作日（各 Rank Mean，完整 Median／P10／P90 在 summary.csv）

| Rank | Avg Todo | Final Todo | Peak Todo | Avg Due | Avg Overdue | Peak Overdue | Overdue days % | Generated/day | Processed/day | Ratio | Outstanding slope | Income/day | Loss % | Cap days % | Promotion eligible % |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 0 | 8.79 | 9.92 | 24.60 | 3.78 | 0.93 | 11.88 | 20.08 | 538.98 | 532.28 | 0.99 | 3.45 | 247.49 | 1.05 | 6.24 | 88.74 |
| 1 | 8.76 | 8.04 | 22.58 | 4.10 | 0.36 | 7.28 | 11.56 | 808.11 | 801.20 | 0.99 | -2.33 | 812.39 | 0.49 | 5.08 | 93.24 |
| 2 | 9.79 | 11.02 | 24.32 | 4.81 | 0.50 | 8.12 | 15.36 | 1226.00 | 1211.30 | 0.99 | -2.88 | 2258.47 | 0.63 | 10.50 | 87.10 |
| 3 | 10.67 | 9.22 | 25.74 | 5.14 | 0.64 | 9.92 | 17.18 | 1772.96 | 1755.57 | 0.99 | -3.00 | 6158.20 | 0.63 | 23.52 | 80.94 |
| 4 | 11.14 | 11.48 | 26.38 | 5.12 | 0.84 | 10.84 | 21.32 | 2489.56 | 2455.04 | 0.99 | 5.80 | 16346.70 | 0.72 | 39.96 | N/A |

## 9–12. 長期穩定性與主要壓力

- Rank0：**PRESSURED**；UNSTABLE seeds 7/50，RUNAWAY flags 9/50；期末 outstanding 均值 669.85，最終20日 slope 3.45，前10日 outstanding 均值 532.12。
- Rank1：**STABLE**；UNSTABLE seeds 0/50，RUNAWAY flags 1/50；期末 outstanding 均值 691.42，最終20日 slope -2.33，前10日 outstanding 均值 744.92。
- Rank2：**STABLE**；UNSTABLE seeds 2/50，RUNAWAY flags 4/50；期末 outstanding 均值 1469.32，最終20日 slope -2.88，前10日 outstanding 均值 1289.17。
- Rank3：**PRESSURED**；UNSTABLE seeds 0/50，RUNAWAY flags 0/50；期末 outstanding 均值 1738.66，最終20日 slope -3.00，前10日 outstanding 均值 2154.08。
- Rank4：**PRESSURED**；UNSTABLE seeds 3/50，RUNAWAY flags 3/50；期末 outstanding 均值 3451.27，最終20日 slope 5.80，前10日 outstanding 均值 3497.88。

推薦100日平均 backlog（Todo）最大 Rank4；Overdue 最大 Rank0；Project cap 最常達上限 Rank4。最大平均不表示所有種子皆失控，請搭配 P90／Max。

## 13–16. Efficiency／Quality paired comparison

相同初始 seed，不代表完全相同外生事件；速度、品質與完成順序會改變後續 RNG call order。下表 HIGH−RECOMMENDED 固定另一能力在推薦；兩側30 seeds。LOW 的全部配對在 CSV。

| Rank | Axis | Δ Processed Workload | Δ Ratio | Δ Avg Todo | Δ Avg Overdue | Δ Avoidable/source ratio | Δ Gross Income |
|---|---|---:|---:|---:|---:|---:|---:|
| 0 | efficiency | 11244.59 | 0.01 | 0.47 | -0.77 | -0.02 | 3035.97 |
| 0 | quality | -199.85 | 0.01 | -1.49 | -0.61 | -0.25 | 985.57 |
| 1 | efficiency | 11095.04 | 0.00 | 0.39 | -0.22 | -0.01 | 6160.07 |
| 1 | quality | 119.50 | -0.00 | -0.16 | -0.10 | -0.14 | 1251.23 |
| 2 | efficiency | 11164.66 | 0.01 | 0.09 | -0.17 | 0.02 | 12443.63 |
| 2 | quality | 229.44 | -0.00 | 0.12 | -0.07 | -0.11 | 5559.80 |
| 3 | efficiency | 11696.28 | 0.01 | 0.28 | -0.25 | 0.02 | 23555.33 |
| 3 | quality | 670.69 | -0.00 | -0.21 | -0.17 | -0.05 | 1688.23 |
| 4 | efficiency | 12627.98 | 0.00 | -0.05 | -0.29 | 0.02 | 46080.90 |
| 4 | quality | 208.66 | -0.00 | -0.20 | -0.16 | -0.03 | 4030.97 |

Quality 配對中 Avoidable/source ratio 上升的種子 39/420；這是觀測異常候選，單一 seed 可能因路徑或工作組成改變，不直接當 Bug。Efficiency 提高但平均 Todo 上升的種子 210/420；不以件數 alone 認定更難。

結構來源：正式補單依 Todo 水位，效率提高可讓普通補單更頻繁、專案步驟更快解鎖，完成更多來源工作也可產生更多後續。請看 paired 的 ΔGeneratedWorkload、ΔProcessedWorkload、ΔFollowUpsGenerated、ΔAvoidableRatio 和長期 slope；相同 seed 分歧並不能完全分離 RNG noise 與結構因果。本輪沒有做更改外生事件的干預實驗。

## 17–21. Rank Economy（推薦100日）

| Rank | Gross/day | Income/processed workload | Loss/Potential % | Parent bonus % | Boss income % | Follow-up income % | Promotion overdue-block-after-money % | Income growth % | Generated workload growth % | Promotion cost/gross days |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 0 | 247.49 | 0.46 | 1.05 | 33.73 | 15.26 | 16.77 | 11.14 | N/A | N/A | 0.89 |
| 1 | 812.39 | 1.01 | 0.49 | 36.87 | 12.27 | 19.46 | 5.72 | 228.25 | 49.93 | 1.11 |
| 2 | 2258.47 | 1.86 | 0.63 | 41.87 | 11.89 | 16.51 | 11.34 | 178.00 | 51.71 | 1.24 |
| 3 | 6158.20 | 3.51 | 0.63 | 47.15 | 10.66 | 13.95 | 17.19 | 172.67 | 44.61 | 1.46 |
| 4 | 16346.70 | 6.66 | 0.72 | 52.05 | 10.77 | 10.76 | N/A | 165.45 | 40.42 | N/A |

這是免費設定既有能力後的運作狀態，不扣不存在的 Upgrade 購買費；Products 全OFF。Promotion cost/gross days 只是毛收入參考，不包含升級、產品或其他消費，不能視為實際升職時間。收入成長超過工作量成長本身不能證明經濟合理。Full Potential=已完成 Work 原報酬＋實際 Parent Bonus，不包含未完成工作的假收入。

## 22. Age Crosscheck（推薦30日，Products 全OFF）

| Rank | Age | Avg Todo | Avg Overdue | Final outstanding | Outstanding slope | Overdue days % | Income/day |
|---|---|---:|---:|---:|---:|---:|---:|
| 0 | 22 | 8.83 | 0.98 | 557.53 | -1.03 | 20.22 | 241.29 |
| 0 | 50 | 9.85 | 2.44 | 1057.93 | -4.28 | 39.89 | 167.03 |
| 0 | 60 | 11.47 | 4.20 | 1369.44 | 7.99 | 51.78 | 141.46 |
| 1 | 22 | 8.50 | 0.30 | 660.69 | -3.02 | 10.11 | 789.64 |
| 1 | 50 | 9.02 | 1.07 | 1194.37 | 13.08 | 26.89 | 571.29 |
| 1 | 60 | 9.21 | 1.57 | 1305.93 | -21.86 | 36.22 | 514.17 |
| 2 | 22 | 9.73 | 0.50 | 1507.62 | -0.26 | 16.56 | 2115.58 |
| 2 | 50 | 10.34 | 1.57 | 1955.14 | -15.92 | 33.78 | 1589.07 |
| 2 | 60 | 10.29 | 2.10 | 2077.26 | -30.16 | 46.22 | 1350.04 |
| 3 | 22 | 10.69 | 0.65 | 2233.19 | -7.00 | 16.78 | 5789.74 |
| 3 | 50 | 10.27 | 1.17 | 2795.56 | -13.70 | 30.22 | 4122.78 |
| 3 | 60 | 11.33 | 2.65 | 3153.49 | -40.51 | 51.44 | 3479.51 |
| 4 | 22 | 11.46 | 1.02 | 3391.40 | -9.19 | 24.22 | 15206.48 |
| 4 | 50 | 12.24 | 2.89 | 5180.07 | -33.01 | 50.22 | 9624.28 |
| 4 | 60 | 14.97 | 6.08 | 6304.95 | -236.16 | 67.22 | 8584.80 |

30日年齡交叉只識別新壓力候選，不能證明100日崩潰。Age50/60 壓力增加時需另跑同 Rank×Age 長期測試；本次不混入 Agecare。

## 23. Diagnostic flags 與判斷門檻

全部 seed／checkpoint flags 在 rank-balance-flags.csv，都是觀測標記，不是自動調值門檻。

- RUNAWAY：最後20日 outstanding slope > max(1單位/日、前10日均值1%/日)，且期末 > max(前10日均值×2、前10日均值＋一日平均生成量)。
- PERSISTENT_OVERDUE：每日上班取樣有逾期的日數 ≥50%。
- PROMOTION_OVERDUE_BLOCK：資金達標取樣日中，被逾期擋住 ≥25%。Rank4 N/A。
- PROJECT_CAP_SATURATION：每日上班取樣 ACTIVE=cap ≥20%，且 chance成功後被cap阻擋 ≥20%。
- ECONOMY_LOSS_HIGH：Loss% 超過五 Rank 推薦100日均值的 Q3+1.5 IQR，或超過同 Rank 推薦均值2倍且高至少2百分點。

STABLE／PRESSURED／UNSTABLE 都是有限100日診斷。seed若同時有 RUNAWAY＋Todo／Overdue 正 slope 則 UNSTABLE；其他若有RUNAWAY或逾期／cap日≥20%則PRESSURED。Rank判斷需至少50% seeds UNSTABLE才稱UNSTABLE；若有≥20% runaway seeds或平均逾期／cap≥20%則PRESSURED。門檻公開可重分析，無法從有限樣本宣稱「必然不可逆」。

| Flag | Records（跨 checkpoints，不等於独立 runs） |
|---|---:|
| RUNAWAY_BACKLOG | 213 |
| PERSISTENT_OVERDUE | 194 |
| PROMOTION_OVERDUE_BLOCK | 820 |
| PROJECT_CAP_SATURATION | 1625 |
| ECONOMY_LOSS_HIGH | 2144 |

## 24. Runner sanity

通過：所有數字有限；count/workload/income非負；實際 Progress 增量計 processed；每工作日 generated−processed=remaining，未發現合法 work removal（Removed=0，有移除將直接使守恆 fail，不隱藏）；source income＋Parent Bonus=Gross；Loss≤Potential；Rank固定；產品OFF；無Prestige；指定初始Age；所有seed列表一致；臨時觀測與原引擎完整state/RNG一致；正式source/config hash不變。

最大工作量守恆誤差 1.5812020137673244e-8（容許 1e-5，浮點误差）；初始Outstanding=0。Closed Project close time 只統計已CLOSED的專案，未結案樣本為右設限、不能視為0天，另有 closed sample count。

## 25–26. 只選五個人工試玩候選

- Rank0／Efficiency RECOMMENDED／Quality RECOMMENDED／Age22／Products OFF：新人基準，確認補單／返工循環是否清楚。實際 Lv 請查 Build 表，不新增負 Lv。
- Rank4／Efficiency RECOMMENDED／Quality RECOMMENDED／Age22／Products OFF：經理推薦Build的Project上限與收入節奏。實際 Lv 請查 Build 表，不新增負 Lv。
- Rank4／Efficiency LOW／Quality HIGH／Age22／Products OFF：隔離低處理速度與較低可避免返工的不同感受。實際 Lv 請查 Build 表，不新增負 Lv。
- Rank3／Efficiency HIGH／Quality LOW／Age22／Products OFF：觀察完成加快是否帶來更多後續工作，對照100日期末積壓反例。實際 Lv 請查 Build 表，不新增負 Lv。
- Rank4／Efficiency RECOMMENDED／Quality RECOMMENDED／Age60／Products OFF：Age60 平均逾期最高的交叉情境。實際 Lv 請查 Build 表，不新增負 Lv。

## 27. 本輪判斷與後續

B：推薦Build大致可運作，但有壓力職級／情境需後續調查；尚不能從本輪直接指定哪個參數要調。 UNSTABLE Rank：無；PRESSURED Rank：0、3、4。年齡或低能力結果不可替代推薦Build判斷。沒有修改任何平衡數值。

建議下一輪先用壓力來源CSV拆出 Project／Follow-up／Boss 的工作量與收入占比，再針對少數異常長期重跑更多種子；不要用完成件數或單次期末推定崩潰。效率／品質配對反例需檢查工作組成與返工比率，不直接認定公式Bug。

## 指標／匯出與重跑

Average/Median/P10/P90/Peak Todo、Due、Overdue 使用每日上班錨點快照（不是事件時間加權）；100日每checkpoint的trend用其最後20日OLS。統計摘要跨seed列Mean/Median/P10/P90/Min/Max/N與近似t 95%CI（30 seeds t=2.045，50 seeds≈2.01），未校正多重比較。收益source包含EVENT，未分類差額要求為0；Project Parent Bonus獨立計入。

每日第一區間含Day1早餐，期末取Day(N+1)上班錨點；workdayIndex由正式Deadline helper決定。Age22 reused無重複daily行，可用scenario manifest追到MATRIX基準。Source Overdue Count分列逾期完成與期末尚未完成；CloseTime以遊戲工作日單位，樣本僅已closed。

執行 npx tsx scripts/test-rank-balance.ts。輸出目錄 reports/rank-balance；JSON保留完整設定、種子、runs、summary與flags，largest daily僅CSV（JSON有路徑說明）。文件不覆寫Rank Content測試結果。

## 補充：配對檢查的統計證據

| Rank | Axis | 固定另一能力 Level | Metric | Δ Mean | 95% CI |
|---|---|---|---|---:|---|
| 0 | quality | 0 | avoidableFollowUpRatio | -0.2523 | -0.2709～-0.2338 |
| 0 | efficiency | 0 | processedWorkload | 11244.5928 | 10966.4748～11522.7108 |
| 0 | efficiency | 3 | processedWorkload | 11453.6971 | 11132.6375～11774.7567 |
| 0 | quality | 3 | avoidableFollowUpRatio | -0.2530 | -0.2642～-0.2418 |
| 1 | quality | 0 | avoidableFollowUpRatio | -0.1338 | -0.1505～-0.1170 |
| 1 | quality | 2 | avoidableFollowUpRatio | -0.1449 | -0.1587～-0.1311 |
| 1 | efficiency | 0 | processedWorkload | 10813.1485 | 10494.6617～11131.6353 |
| 1 | efficiency | 3 | processedWorkload | 11095.0422 | 10709.5109～11480.5736 |
| 1 | efficiency | 6 | processedWorkload | 11023.2651 | 10629.3695～11417.1606 |
| 1 | quality | 5 | avoidableFollowUpRatio | -0.1452 | -0.1563～-0.1342 |
| 2 | quality | 2 | avoidableFollowUpRatio | -0.0877 | -0.1145～-0.0609 |
| 2 | quality | 5 | avoidableFollowUpRatio | -0.1121 | -0.1307～-0.0934 |
| 2 | efficiency | 3 | processedWorkload | 11532.7987 | 10847.4420～12218.1553 |
| 2 | efficiency | 6 | processedWorkload | 11164.6582 | 10718.3591～11610.9573 |
| 2 | efficiency | 9 | processedWorkload | 11434.7203 | 10865.6897～12003.7508 |
| 2 | quality | 8 | avoidableFollowUpRatio | -0.1226 | -0.1401～-0.1052 |
| 3 | quality | 6 | avoidableFollowUpRatio | -0.0525 | -0.0748～-0.0301 |
| 3 | quality | 9 | avoidableFollowUpRatio | -0.0491 | -0.0760～-0.0222 |
| 3 | efficiency | 7 | processedWorkload | 11809.9592 | 10875.0593～12744.8592 |
| 3 | efficiency | 10 | processedWorkload | 11696.2789 | 10772.3978～12620.1600 |
| 3 | efficiency | 13 | processedWorkload | 12010.4107 | 11384.7496～12636.0717 |
| 3 | quality | 12 | avoidableFollowUpRatio | -0.0698 | -0.0906～-0.0490 |
| 4 | quality | 11 | avoidableFollowUpRatio | -0.0333 | -0.0498～-0.0168 |
| 4 | quality | 14 | avoidableFollowUpRatio | -0.0340 | -0.0559～-0.0121 |
| 4 | efficiency | 12 | processedWorkload | 11504.7926 | 10395.8880～12613.6972 |
| 4 | efficiency | 15 | processedWorkload | 12627.9831 | 11663.4769～13592.4893 |
| 4 | efficiency | 18 | processedWorkload | 12669.0885 | 11324.9856～14013.1915 |
| 4 | quality | 17 | avoidableFollowUpRatio | -0.0411 | -0.0647～-0.0176 |

HIGH Quality 的可避免返工比率出現顯著正向反例（95% CI全>0）的比較：0 組。100日 HIGH−LOW Efficiency 的期末Outstanding顯著增加：1 組；這只標記反例，不證明結構原因。
- Rank3、Quality Lv7：Δ Outstanding=537.80，95% CI 82.87～992.74；搭配對應工作量與返工差值檢查。

配對摘要含30日相對推薦，以及100日HIGH−LOW的固定另一能力比較；Rank0相同Level已去重。收入來源已追過正式程式：earn只有Work完成與Project Parent Bonus两處呼叫，Work收入逐件觀測、Parent作剩餘差額，未分類收入為0。未做投資成本扣款。

## 補充：推薦100日壓力來源

| Rank | NORMAL workload % | PROJECT workload % | FOLLOW_UP workload % | BOSS workload % | Cap阻擋／Chance成功 % |
|---|---:|---:|---:|---:|---:|
| 0 | 15.70 | 33.14 | 49.21 | 1.95 | 5.48 |
| 1 | 16.75 | 33.74 | 47.57 | 1.94 | 2.59 |
| 2 | 10.90 | 40.04 | 46.99 | 2.07 | 7.70 |
| 3 | 6.70 | 47.15 | 44.09 | 2.06 | 16.22 |
| 4 | 3.27 | 54.09 | 40.28 | 2.36 | 30.18 |

## 補充：LOW→RECOMMENDED→HIGH 的平均趨勢

數值按實際能力 Level 排列，重複 Level 不重複列。以下是固定另一能力的30日矩陣均值，不要求完成件數單調。

| Rank | 固定 Efficiency Lv | Quality Lv→Avoidable/source ratio | 單調下降 |
|---|---|---|---|
| 0 | 0 | 0→0.5588／3→0.3064 | YES |
| 0 | 3 | 0→0.5404／3→0.2874 | YES |
| 1 | 0 | 0→0.6696／3→0.4672／6→0.3335 | YES |
| 1 | 2 | 0→0.6669／3→0.4670／6→0.3221 | YES |
| 1 | 5 | 0→0.6847／3→0.4529／6→0.3076 | YES |
| 2 | 2 | 3→0.5978／6→0.4665／9→0.3788 | YES |
| 2 | 5 | 3→0.5917／6→0.4994／9→0.3873 | YES |
| 2 | 8 | 3→0.6000／6→0.5149／9→0.3923 | YES |
| 3 | 6 | 7→0.5521／10→0.4905／13→0.4380 | YES |
| 3 | 9 | 7→0.5452／10→0.4879／13→0.4388 | YES |
| 3 | 12 | 7→0.5596／10→0.5039／13→0.4340 | YES |
| 4 | 11 | 12→0.5261／15→0.5009／18→0.4676 | YES |
| 4 | 14 | 12→0.5273／15→0.4973／18→0.4633 | YES |
| 4 | 17 | 12→0.5432／15→0.5143／18→0.4732 | YES |

固定Efficiency的 Quality平均比率單調下降：14/14；固定Quality的 Efficiency平均Processed單調上升：14/14。這支持兩種能力分工，不代表每個seed的Todo必然單調。

## 補充：推薦品質與實際工作要求

| Rank | 推薦實際品質 | Normal Pool 加權平均品質要求（已乘Rank） | 兩者比率 |
|---|---:|---:|---:|
| 0 | 10 | 11.56 | 0.865 |
| 1 | 19 | 19.18 | 0.990 |
| 2 | 28 | 35.36 | 0.792 |
| 3 | 40 | 58.44 | 0.684 |
| 4 | 55 | 94.72 | 0.581 |

這是原值推導，沒有調Config。高階新內容的Base Quality再乘既有Rank Quality，因此推薦品質相對正式工作要求較低；即使加3Lv，品質提升可能仍未跨過Count Band門檻。這是高階可避免返工仍多的可能原因，不是重複乘算Bug，也不能僅靠此表推定要改哪個參數。實際Project步驟、暫時Buff與Follow-up品質要求另影響Runtime組成。

100日Rank3、Quality Lv7的效率反例補充：HIGH−LOW Efficiency平均生成工作量變化 81954.95、實際處理 81417.15、後續工作 258.68 件；平均Todo變化 0.57 件，平均Overdue變化 -0.66 件。最後20日Outstanding斜率差的95%CI為 -7.16～33.31。更多完成伴隨更多生成支持結構機制，但這些資料不能完全排除RNG／工作組成影響，也不能單憑期末差值認定不可逆崩潰。

指標補充：Avoidable/source ratio 分母為全部已完成正式 WORK（含 Follow-up，因正式完成流程皆呼叫 generateFollowUps）；Parent 不算 Work。已達 root/depth 上限的來源可能不再產生新後續，這也會影響比率；來源明細保留各類 completed count。
