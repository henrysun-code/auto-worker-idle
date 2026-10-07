# Rank 工作內容測試報告

正式 Config SHA256：02faea78e9ec3903b64b0bbde8e10fff2ad9cd81fc172f668d7608b70eed1723。純抽樣 seed=424242；每 Rank 的 Work／Project／Boss 各 10,000 次；Runtime 每 Rank 30 seeds × 30 工作日（共 150 條）。完整設定及 seed 在 rank-results.json。未讀寫玩家存檔、localStorage；未修改正式 Config 或遊戲邏輯。

## 1. Work rank 真正語意

`todoManager.generateDailyWork()` 用 `template.rank <= currentRank` 篩選，再用原 weight 和正式 LCG RNG 抽選，屬 A：最低解鎖職級，之後仍可生成。rank=2 在 Rank2／3／4 可出現。不是職級專屬池。

## 2. Project rankRequirement 語意

`maybeSpawnProject()` 先以當前 Rank 的 projectChance 判定，再篩 `enabled && rankRequirement <= rank && weight > 0` 並加權。直接 `createProject()` 為指定建立入口，本身不做職級篩選；本報告測試正常生成入口。ACTIVE 上限會阻止實際建立。

## 3–5. Eligible Work Pool、10000 次抽樣、理論權重比較

工作池從正式生成結果收集，並 assert 等於 Runtime 條件允許的集合。禁止項目任一出現立即失敗。統計異常暫採各比例偏差超過 4 個二項標準差（另加 1/n）；這是篩查門檻，不是證明 RNG 無偏。

### Rank0 新人

| ID／名稱 | Template rank | weight | base workload | base reward | quality | Count | Expected % | Actual % |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| email／回 Email | 0 | 4 | 45 | 16 | 10 | 4485 | 44.44 | 44.85 |
| data／整理資料 | 0 | 3 | 80 | 28 | 12 | 3274 | 33.33 | 32.74 |
| slides／修改簡報 | 0 | 2 | 100 | 38 | 14 | 2241 | 22.22 | 22.41 |

### Rank1 一般員工

| ID／名稱 | Template rank | weight | base workload | base reward | quality | Count | Expected % | Actual % |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| email／回 Email | 0 | 4 | 45 | 16 | 10 | 2956 | 28.57 | 29.56 |
| data／整理資料 | 0 | 3 | 80 | 28 | 12 | 2094 | 21.43 | 20.94 |
| slides／修改簡報 | 0 | 2 | 100 | 38 | 14 | 1378 | 14.29 | 13.78 |
| monthly／月報 | 1 | 2 | 130 | 55 | 18 | 1420 | 14.29 | 14.20 |
| client／客戶回覆 | 1 | 3 | 90 | 42 | 20 | 2152 | 21.43 | 21.52 |

### Rank2 資深員工

| ID／名稱 | Template rank | weight | base workload | base reward | quality | Count | Expected % | Actual % |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| email／回 Email | 0 | 4 | 45 | 16 | 10 | 2300 | 22.22 | 23.00 |
| data／整理資料 | 0 | 3 | 80 | 28 | 12 | 1658 | 16.67 | 16.58 |
| slides／修改簡報 | 0 | 2 | 100 | 38 | 14 | 1092 | 11.11 | 10.92 |
| monthly／月報 | 1 | 2 | 130 | 55 | 18 | 1059 | 11.11 | 10.59 |
| client／客戶回覆 | 1 | 3 | 90 | 42 | 20 | 1650 | 16.67 | 16.50 |
| revision／需求確認 | 2 | 2 | 150 | 68 | 28 | 1181 | 11.11 | 11.81 |
| urgent／急件 | 2 | 2 | 180 | 95 | 30 | 1060 | 11.11 | 10.60 |

### Rank3 主管

| ID／名稱 | Template rank | weight | base workload | base reward | quality | Count | Expected % | Actual % |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| email／回 Email | 0 | 4 | 45 | 16 | 10 | 2083 | 20.00 | 20.83 |
| data／整理資料 | 0 | 3 | 80 | 28 | 12 | 1480 | 15.00 | 14.80 |
| slides／修改簡報 | 0 | 2 | 100 | 38 | 14 | 985 | 10.00 | 9.85 |
| monthly／月報 | 1 | 2 | 130 | 55 | 18 | 982 | 10.00 | 9.82 |
| client／客戶回覆 | 1 | 3 | 90 | 42 | 20 | 1449 | 15.00 | 14.49 |
| revision／需求確認 | 2 | 2 | 150 | 68 | 28 | 1006 | 10.00 | 10.06 |
| urgent／急件 | 2 | 2 | 180 | 95 | 30 | 1054 | 10.00 | 10.54 |
| meeting／會議資料整理 | 3 | 2 | 190 | 100 | 40 | 961 | 10.00 | 9.61 |

### Rank4 經理

| ID／名稱 | Template rank | weight | base workload | base reward | quality | Count | Expected % | Actual % |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| email／回 Email | 0 | 4 | 45 | 16 | 10 | 2083 | 20.00 | 20.83 |
| data／整理資料 | 0 | 3 | 80 | 28 | 12 | 1480 | 15.00 | 14.80 |
| slides／修改簡報 | 0 | 2 | 100 | 38 | 14 | 985 | 10.00 | 9.85 |
| monthly／月報 | 1 | 2 | 130 | 55 | 18 | 982 | 10.00 | 9.82 |
| client／客戶回覆 | 1 | 3 | 90 | 42 | 20 | 1449 | 15.00 | 14.49 |
| revision／需求確認 | 2 | 2 | 150 | 68 | 28 | 1006 | 10.00 | 10.06 |
| urgent／急件 | 2 | 2 | 180 | 95 | 30 | 1054 | 10.00 | 10.54 |
| meeting／會議資料整理 | 3 | 2 | 190 | 100 | 40 | 961 | 10.00 | 9.61 |

## 6–8. Eligible Projects、Project Chance、Boss Catch Chance

| Rank | Eligible Projects | Project config % | Observed % | Boss expected % | Formula % | Observed % |
|---|---|---:|---:|---:|---:|---:|
| 0 新人 | 新品提案 | 16.00 | 16.55 | 25.00 | 25.00 | 25.87 |
| 1 一般員工 | 新品提案 | 22.00 | 22.49 | 29.00 | 29.00 | 29.45 |
| 2 資深員工 | 新品提案 | 30.00 | 30.33 | 34.00 | 34.00 | 34.02 |
| 3 主管 | 新品提案 | 40.00 | 39.96 | 39.00 | 39.00 | 39.13 |
| 4 經理 | 新品提案 | 50.00 | 49.95 | 45.00 | 45.00 | 44.87 |

各 Rank 目前皆只能正常生成「新品提案」（launch、rankRequirement=0、enabled=true、weight=1）。Project 機率抽樣每次清除模擬內 ACTIVE，使 capacity 不干擾機率；真實 30 日保留上限，因此 spawn/day 不等於 projectChance。Boss 固定拍馬屁／摸魚 Lv0、無 Buff/Debuff，直接呼叫正式 resolveBoss()，含正式逃跑 RNG 消耗。

## 9. Rank Workload／Reward／Quality 只套一次

相同回 Email，Age22、Lv0、無產品／Buff／永久加成：

| Rank | Base→Final Workload | Base→Final Reward | Base→Final Quality |
|---|---|---|---|
| 0 | 45→45 | 16→16 | 10→10 |
| 1 | 45→56.25 | 16→35 | 10→12 |
| 2 | 45→76.5 | 16→80 | 10→15 |
| 3 | 45→99.00000000000001 | 16→176 | 10→18 |
| 4 | 45→135 | 16→400 | 10→22 |

建立時 Workload 和 Quality 僅乘一次職級；目前 Final Reward 是以查詢時的 Rank 計算，並非建立時固定（見 Bug）。

## 10. Age × Rank

| Rank | Age | Base | Rank × Age | Final |
|---|---|---|---|---|
| 0 | 22 | 45 | 1 × 1 | 45 |
| 0 | 60 | 45 | 1 × 1.7 | 76.5 |
| 4 | 22 | 45 | 3 × 1 | 135 |
| 4 | 60 | 45 | 3 × 1.7 | 229.5 |

上述四組 assert 成功，沒有重複乘算。

## 11. 升職前後 Todo 穩定性

四次相鄰升職測試：ID、名稱、來源、Type、baseWorkload、Final Workload、品質、完整 Deadline 欄位與進度均保留；升職不重建 Todo。但既有工作 Final Reward 未保留：

- Rank0→1：既有回 Email 報酬 $16→$35。
- Rank1→2：既有回 Email 報酬 $35→$80。
- Rank2→3：既有回 Email 報酬 $80→$176。
- Rank3→4：既有回 Email 報酬 $176→$400。

升職後新工作池與同 RNG 的新 Rank 狀態抽取結果完全一致（各 100 次），測試通過。

## 12. 30 日 Runtime 職級模擬

Age22 開始、自然年長，不鎖住世界時間；所有产品 OFF、其他能力 Lv0、無 Prestige、不購買／升職。初始金錢沿用正式 startingMoney。能力以 recommended 值對應最近整數 Lv（四捨五入），實際初始值如下；後續保留正式 Buff/Debuff。

| Rank | 推薦→實際速度（Lv） | 推薦→實際品質（Lv） |
|---|---|---|
| 0 | 20→20（0） | 10→10（0） |
| 1 | 30→30（2） | 18→19（3） |
| 2 | 45→45（5） | 28→28（6） |
| 3 | 65→65（9） | 40→40（10） |
| 4 | 90→90（14） | 55→55（15） |

### 各 Rank 30 次平均

| Rank | Generated Work | Projects | Follow-up | Avg Todo | Peak Todo 平均 | Avg Due Today | Avg Overdue | Peak Overdue 平均 | Generated Workload | Processed Workload | Ratio | Gross Income | Overdue Loss | Completed |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 0 | 302.00 | 4.73 | 218.37 | 8.13 | 22.43 | 1.65 | 0.25 | 9.60 | 16737.24 | 16179.71 | 0.97 | 7238.57 | 86.73 | 293.97 |
| 1 | 280.93 | 6.43 | 185.40 | 8.05 | 21.00 | 1.33 | 0.06 | 5.27 | 25279.48 | 24375.11 | 0.97 | 21646.80 | 136.17 | 271.47 |
| 2 | 254.03 | 8.83 | 160.40 | 8.97 | 20.67 | 1.44 | 0.06 | 4.97 | 37898.82 | 36533.05 | 0.96 | 59060.63 | 348.70 | 245.37 |
| 3 | 266.13 | 11.07 | 159.50 | 9.41 | 20.87 | 1.32 | 0.03 | 4.07 | 55260.17 | 52952.97 | 0.96 | 155325.23 | 635.70 | 254.67 |
| 4 | 265.90 | 12.50 | 154.20 | 10.03 | 21.07 | 1.35 | 0.03 | 3.60 | 77506.47 | 74316.81 | 0.96 | 383775.40 | 1473.77 | 254.83 |

Average 是世界時間加權；Peak 平均是每 seed 自己峰值再平均，原始峰值保存 CSV。Generated Work 計正式釋出／解鎖的所有 Work，含 Normal/Boss/Project/Follow-up；Pending 尚未釋出不算正式 Workload，但 Follow-up Count 在建立 Pending 時即計生成，兩者分母不同。Processed 含未完成的部分進度。30 日期末取 Day31 上班錨點，含最初早餐。

### Runtime 內容組成（30 seeds 合計；各類別內百分比）

#### Rank0

| 類別 | Template／Type | Count | % |
|---|---|---:|---:|
| NORMAL | email | 616 | 47.60 |
| NORMAL | data | 416 | 32.15 |
| NORMAL | slides | 262 | 20.25 |
| NORMAL | monthly | 0 | 0.00 |
| NORMAL | client | 0 | 0.00 |
| NORMAL | revision | 0 | 0.00 |
| NORMAL | urgent | 0 | 0.00 |
| NORMAL | meeting | 0 | 0.00 |
| PROJECT | launch | 142 | 100.00 |
| FOLLOW_UP | REWORK | 2484 | 37.92 |
| FOLLOW_UP | CORRECTION | 1281 | 19.55 |
| FOLLOW_UP | MISSING_INFO | 1176 | 17.95 |
| FOLLOW_UP | CLIENT_REPLY | 760 | 11.60 |
| FOLLOW_UP | NEW_REQUEST | 623 | 9.51 |
| FOLLOW_UP | PROJECT_NEXT_STEP | 227 | 3.47 |

#### Rank1

| 類別 | Template／Type | Count | % |
|---|---|---:|---:|
| NORMAL | email | 341 | 28.23 |
| NORMAL | data | 268 | 22.19 |
| NORMAL | slides | 169 | 13.99 |
| NORMAL | monthly | 176 | 14.57 |
| NORMAL | client | 254 | 21.03 |
| NORMAL | revision | 0 | 0.00 |
| NORMAL | urgent | 0 | 0.00 |
| NORMAL | meeting | 0 | 0.00 |
| PROJECT | launch | 193 | 100.00 |
| FOLLOW_UP | REWORK | 1730 | 31.10 |
| FOLLOW_UP | CORRECTION | 956 | 17.19 |
| FOLLOW_UP | MISSING_INFO | 899 | 16.16 |
| FOLLOW_UP | CLIENT_REPLY | 960 | 17.26 |
| FOLLOW_UP | NEW_REQUEST | 760 | 13.66 |
| FOLLOW_UP | PROJECT_NEXT_STEP | 257 | 4.62 |

#### Rank2

| 類別 | Template／Type | Count | % |
|---|---|---:|---:|
| NORMAL | email | 132 | 21.19 |
| NORMAL | data | 114 | 18.30 |
| NORMAL | slides | 59 | 9.47 |
| NORMAL | monthly | 74 | 11.88 |
| NORMAL | client | 95 | 15.25 |
| NORMAL | revision | 78 | 12.52 |
| NORMAL | urgent | 71 | 11.40 |
| NORMAL | meeting | 0 | 0.00 |
| PROJECT | launch | 265 | 100.00 |
| FOLLOW_UP | REWORK | 1541 | 32.02 |
| FOLLOW_UP | CORRECTION | 743 | 15.44 |
| FOLLOW_UP | MISSING_INFO | 708 | 14.71 |
| FOLLOW_UP | CLIENT_REPLY | 854 | 17.75 |
| FOLLOW_UP | NEW_REQUEST | 719 | 14.94 |
| FOLLOW_UP | PROJECT_NEXT_STEP | 247 | 5.13 |

#### Rank3

| 類別 | Template／Type | Count | % |
|---|---|---:|---:|
| NORMAL | email | 98 | 19.96 |
| NORMAL | data | 78 | 15.89 |
| NORMAL | slides | 48 | 9.78 |
| NORMAL | monthly | 51 | 10.39 |
| NORMAL | client | 75 | 15.27 |
| NORMAL | revision | 39 | 7.94 |
| NORMAL | urgent | 49 | 9.98 |
| NORMAL | meeting | 53 | 10.79 |
| PROJECT | launch | 332 | 100.00 |
| FOLLOW_UP | REWORK | 1325 | 27.69 |
| FOLLOW_UP | CORRECTION | 705 | 14.73 |
| FOLLOW_UP | MISSING_INFO | 673 | 14.06 |
| FOLLOW_UP | CLIENT_REPLY | 984 | 20.56 |
| FOLLOW_UP | NEW_REQUEST | 845 | 17.66 |
| FOLLOW_UP | PROJECT_NEXT_STEP | 253 | 5.29 |

#### Rank4

| 類別 | Template／Type | Count | % |
|---|---|---:|---:|
| NORMAL | email | 65 | 19.94 |
| NORMAL | data | 49 | 15.03 |
| NORMAL | slides | 31 | 9.51 |
| NORMAL | monthly | 27 | 8.28 |
| NORMAL | client | 51 | 15.64 |
| NORMAL | revision | 32 | 9.82 |
| NORMAL | urgent | 40 | 12.27 |
| NORMAL | meeting | 31 | 9.51 |
| PROJECT | launch | 375 | 100.00 |
| FOLLOW_UP | REWORK | 1100 | 23.78 |
| FOLLOW_UP | CORRECTION | 632 | 13.66 |
| FOLLOW_UP | MISSING_INFO | 609 | 13.16 |
| FOLLOW_UP | CLIENT_REPLY | 1070 | 23.13 |
| FOLLOW_UP | NEW_REQUEST | 932 | 20.15 |
| FOLLOW_UP | PROJECT_NEXT_STEP | 283 | 6.12 |

## 13–14. 內容判斷

目前經理沒有專屬 Normal Work Template。屬 B：有差異但不足，主要缺口在主管→經理：兩者 Eligible Pool 完全相同，Project 也相同，差異主要是數值、Project 機率及 Boss 壓力。前三次升職有新增內容，但不替換低階工作，屬工作池累積：

- 新人→一般員工：月報、客戶回覆。
- 一般員工→資深員工：需求確認、急件。
- 資深員工→主管：會議資料整理。
- 主管→經理：沒有新增 Normal Work。

Rank3／4 理論仍有低階工作占比，實際內容表提供 30 日觀測；這不是禁止低階工作失效，而是正式累積池與同一組 weight 的結果。不同 Rank Follow-up 組成有自然變化，但同時受品質比率、處理量、專案頻率影響，不能把差異全部歸因於 Pool。沒有新增模板或改權重。

## 15. Bug 與未通過要求

**既有 Todo 在升職後 Final Reward 改變。** 現象：回 Email 在四次升職的報酬皆增加（上列完整數值）。原因：`workStats.rawWorkReward()` 使用 `c.ranks[s.career.rank].rewardMultiplier`，Todo 只保存 baseReward，沒有 reward 職級快照。影響：升職前已接／執行／暫停的工作，其收入與逾期損失按新職級改算，違反這次指定的「升職只影響新工作／舊 Reward 不重算」。建議修法：日後另行核准時，新增建立時 rewardRankMultiplier 快照，統一 Reward 查詢／完成使用快照並制定舊存檔相容；明確區分產品、能力、永久加成是否仍動態。這次只記錄，沒有修正式程式。

Assertions：71 通過、4 未通過。未通過的四项皆為上述升職 Reward 穩定性要求。其他禁止項目、Weight、Project、Boss、一次倍率及 Simulation 檢查通過。完整 assertions 在 CSV。

## 16. 修改範圍與重跑

本次未修改正式遊戲邏輯。只新增本測試脚本與 reports/rank-tests 輸出。執行 npx tsx scripts/test-ranks.ts，直接讀取當前 Runtime 的 generated Config，不執行設定轉換或改正式數值。

rank-work-pool.csv／rank-work-distribution.csv／rank-project-distribution.csv／rank-runtime-summary.csv 皆包含 Rank、Seed、Workdays、Config hash；rank-results.json 保存完整 Config snapshot 及所有樣本。其他檔：rank-runtime-content.csv、rank-probability-checks.csv、rank-assertions.csv。

## 補充：普通工作在全體工作中的占比

| Rank | 30 seeds 普通工作總數 | 占全部正式生成工作 % |
|---|---:|---:|
| 0 | 1294 | 14.28 |
| 1 | 1208 | 14.33 |
| 2 | 623 | 8.17 |
| 3 | 491 | 6.15 |
| 4 | 326 | 4.09 |

高職級普通工作在全體正式工作中的占比下降，實際執行內容更多由專案子任務與後續工作組成。因此普通池的解鎖差異未必等比例反映為中央目標的內容差異；Project Template 仍相同，尤其主管／經理的內容區分不足。

