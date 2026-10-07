# Rank Content Distribution Report

PROVISIONAL：內容與所有新增數值待平衡。本次沿用原 Rank Runner，每 Rank 10,000 Work draws、10,000 successful Project selections、10,000 Project Chance rolls、10,000 Boss rolls；每 Rank 30 seeds × 30 工作日。Config SHA256=62848e8c3e9a1681d87efbfd22bb68b1880beda4ce60e0a9da4ef8faa0ff0d35。抽樣 seed=424242，完整 seeds/config 保存在 JSON。

## Runtime 與正式規則

最低職級解鎖＋有效權重>0；有 rankWeights 時使用指定 Rank 欄位，缺少整個欄位才 fallback weight。Work 與 Project 分別由集中 helper 計算。Project Chance／Boss／Rank 難度／Age／Follow-up／Promotion／Prestige 沿用原值與流程。已存在 Todo／Project 不重建，工作量／品質／期限／進度保留；Todo 報酬依完成時 Current Rank 動態更新。上一輪四個報酬固定的 Fail 已改為動態更新正確性，沒有 Reward Snapshot。既有 Project Parent Bonus 沿用建立時 p.reward；其子任務 Work Reward 使用動態 Current Rank，沒有改獎金流程。

## Normal Work：完整理論／實際分布

### Rank0 新人

| ID／名稱 | 最低 Rank | Effective Weight | Base Workload | Base Reward | Base Quality | Count | Expected % | Actual % |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| email／回 Email | 0 | 4 | 45 | 16 | 10 | 4485 | 44.44 | 44.85 |
| data／整理資料 | 0 | 3 | 80 | 28 | 12 | 3274 | 33.33 | 32.74 |
| slides／修改簡報 | 0 | 2 | 100 | 38 | 14 | 2241 | 22.22 | 22.41 |

### Rank1 一般員工

| ID／名稱 | 最低 Rank | Effective Weight | Base Workload | Base Reward | Base Quality | Count | Expected % | Actual % |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| email／回 Email | 0 | 2.5 | 45 | 16 | 10 | 1681 | 16.03 | 16.81 |
| data／整理資料 | 0 | 2 | 80 | 28 | 12 | 1303 | 12.82 | 13.03 |
| slides／修改簡報 | 0 | 1.8 | 100 | 38 | 14 | 1116 | 11.54 | 11.16 |
| monthly／月報 | 1 | 2.3 | 130 | 55 | 18 | 1442 | 14.74 | 14.42 |
| client／客戶回覆 | 1 | 2.8 | 90 | 42 | 20 | 1746 | 17.95 | 17.46 |
| requirement_summary／需求彙整 | 1 | 2.2 | 110 | 48 | 19 | 1492 | 14.10 | 14.92 |
| progress_update／進度更新 | 1 | 2 | 105 | 46 | 18 | 1220 | 12.82 | 12.20 |

### Rank2 資深員工

| ID／名稱 | 最低 Rank | Effective Weight | Base Workload | Base Reward | Base Quality | Count | Expected % | Actual % |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| email／回 Email | 0 | 1 | 45 | 16 | 10 | 471 | 4.74 | 4.71 |
| data／整理資料 | 0 | 0.8 | 80 | 28 | 12 | 379 | 3.79 | 3.79 |
| slides／修改簡報 | 0 | 1.2 | 100 | 38 | 14 | 618 | 5.69 | 6.18 |
| monthly／月報 | 1 | 1.7 | 130 | 55 | 18 | 836 | 8.06 | 8.36 |
| client／客戶回覆 | 1 | 2 | 90 | 42 | 20 | 956 | 9.48 | 9.56 |
| revision／需求確認 | 2 | 2.3 | 150 | 68 | 28 | 1043 | 10.90 | 10.43 |
| urgent／急件 | 2 | 2.3 | 180 | 95 | 30 | 1104 | 10.90 | 11.04 |
| requirement_summary／需求彙整 | 1 | 1.6 | 110 | 48 | 19 | 703 | 7.58 | 7.03 |
| progress_update／進度更新 | 1 | 1.4 | 105 | 46 | 18 | 645 | 6.64 | 6.45 |
| client_proposal／客戶提案 | 2 | 2.6 | 160 | 78 | 30 | 1238 | 12.32 | 12.38 |
| cross_department／跨部門協調 | 2 | 2.2 | 140 | 72 | 27 | 1094 | 10.43 | 10.94 |
| risk_review／專案風險整理 | 2 | 2 | 170 | 85 | 32 | 913 | 9.48 | 9.13 |

### Rank3 主管

| ID／名稱 | 最低 Rank | Effective Weight | Base Workload | Base Reward | Base Quality | Count | Expected % | Actual % |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| email／回 Email | 0 | 0.3 | 45 | 16 | 10 | 104 | 1.13 | 1.04 |
| data／整理資料 | 0 | 0.2 | 80 | 28 | 12 | 75 | 0.75 | 0.75 |
| slides／修改簡報 | 0 | 0.7 | 100 | 38 | 14 | 275 | 2.64 | 2.75 |
| monthly／月報 | 1 | 0.8 | 130 | 55 | 18 | 297 | 3.02 | 2.97 |
| client／客戶回覆 | 1 | 1 | 90 | 42 | 20 | 401 | 3.77 | 4.01 |
| revision／需求確認 | 2 | 1.6 | 150 | 68 | 28 | 668 | 6.04 | 6.68 |
| urgent／急件 | 2 | 1.8 | 180 | 95 | 30 | 698 | 6.79 | 6.98 |
| meeting／會議資料整理 | 3 | 2.1 | 190 | 100 | 40 | 769 | 7.92 | 7.69 |
| requirement_summary／需求彙整 | 1 | 0.8 | 110 | 48 | 19 | 285 | 3.02 | 2.85 |
| progress_update／進度更新 | 1 | 0.7 | 105 | 46 | 18 | 276 | 2.64 | 2.76 |
| client_proposal／客戶提案 | 2 | 2 | 160 | 78 | 30 | 728 | 7.55 | 7.28 |
| cross_department／跨部門協調 | 2 | 2.4 | 140 | 72 | 27 | 903 | 9.06 | 9.03 |
| risk_review／專案風險整理 | 2 | 2.2 | 170 | 85 | 32 | 780 | 8.30 | 7.80 |
| team_review／團隊進度審查 | 3 | 2.6 | 160 | 90 | 38 | 956 | 9.81 | 9.56 |
| resource_allocation／人力分配 | 3 | 2.4 | 175 | 100 | 40 | 928 | 9.06 | 9.28 |
| manager_report／主管報告 | 3 | 2.7 | 190 | 105 | 42 | 1058 | 10.19 | 10.58 |
| client_escalation／客戶問題升級處理 | 3 | 2.2 | 200 | 110 | 44 | 799 | 8.30 | 7.99 |

### Rank4 經理

| ID／名稱 | 最低 Rank | Effective Weight | Base Workload | Base Reward | Base Quality | Count | Expected % | Actual % |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| email／回 Email | 0 | 0.1 | 45 | 16 | 10 | 31 | 0.33 | 0.31 |
| data／整理資料 | 0 | 0.05 | 80 | 28 | 12 | 11 | 0.16 | 0.11 |
| slides／修改簡報 | 0 | 0.3 | 100 | 38 | 14 | 93 | 0.99 | 0.93 |
| monthly／月報 | 1 | 0.3 | 130 | 55 | 18 | 107 | 0.99 | 1.07 |
| client／客戶回覆 | 1 | 0.4 | 90 | 42 | 20 | 139 | 1.32 | 1.39 |
| revision／需求確認 | 2 | 0.7 | 150 | 68 | 28 | 220 | 2.31 | 2.20 |
| urgent／急件 | 2 | 0.8 | 180 | 95 | 30 | 272 | 2.64 | 2.72 |
| meeting／會議資料整理 | 3 | 1.4 | 190 | 100 | 40 | 490 | 4.61 | 4.90 |
| requirement_summary／需求彙整 | 1 | 0.3 | 110 | 48 | 19 | 123 | 0.99 | 1.23 |
| progress_update／進度更新 | 1 | 0.3 | 105 | 46 | 18 | 113 | 0.99 | 1.13 |
| client_proposal／客戶提案 | 2 | 1 | 160 | 78 | 30 | 344 | 3.29 | 3.44 |
| cross_department／跨部門協調 | 2 | 1.4 | 140 | 72 | 27 | 475 | 4.61 | 4.75 |
| risk_review／專案風險整理 | 2 | 1.3 | 170 | 85 | 32 | 442 | 4.28 | 4.42 |
| team_review／團隊進度審查 | 3 | 2 | 160 | 90 | 38 | 622 | 6.59 | 6.22 |
| resource_allocation／人力分配 | 3 | 2 | 175 | 100 | 40 | 647 | 6.59 | 6.47 |
| manager_report／主管報告 | 3 | 2.2 | 190 | 105 | 42 | 704 | 7.25 | 7.04 |
| client_escalation／客戶問題升級處理 | 3 | 1.8 | 200 | 110 | 44 | 604 | 5.93 | 6.04 |
| department_strategy／部門策略規劃 | 4 | 3 | 210 | 120 | 50 | 943 | 9.88 | 9.43 |
| budget_review／預算審核 | 4 | 2.8 | 190 | 110 | 52 | 895 | 9.23 | 8.95 |
| cross_department_decision／跨部門決策 | 4 | 2.8 | 200 | 115 | 50 | 944 | 9.23 | 9.44 |
| executive_report／高層報告 | 4 | 3 | 220 | 125 | 55 | 1017 | 9.88 | 10.17 |
| critical_issue／重大問題處理 | 4 | 2.4 | 230 | 130 | 58 | 764 | 7.91 | 7.64 |

## Normal Template Rank Group Share

| Current Rank | Template Rank Group | Expected % | Actual Draw % | Runtime Normal % |
|---|---|---:|---:|---:|
| 0 | 0 | 100.00 | 100.00 | 100.00 |
| 1 | 0 | 40.38 | 41.00 | 39.74 |
| 1 | 1 | 59.62 | 59.00 | 60.26 |
| 2 | 0 | 14.22 | 14.68 | 13.32 |
| 2 | 1 | 31.75 | 31.40 | 35.99 |
| 2 | 2 | 54.03 | 53.92 | 50.69 |
| 3 | 0 | 4.53 | 4.54 | 3.85 |
| 3 | 1 | 12.45 | 12.59 | 13.94 |
| 3 | 2 | 37.74 | 37.77 | 37.74 |
| 3 | 3 | 45.28 | 45.10 | 44.47 |
| 4 | 0 | 1.48 | 1.35 | 2.23 |
| 4 | 1 | 4.28 | 4.82 | 6.70 |
| 4 | 2 | 17.13 | 17.53 | 16.20 |
| 4 | 3 | 30.97 | 30.67 | 24.58 |
| 4 | 4 | 46.13 | 45.63 | 50.28 |

依指定精確權重計算；附件的大致預期與精確權重有差異，沒有為符合示意比例改參數。例如跨部門整合案在 Rank2 的理論比例是 51.72%，團隊流程改善在 Rank3 是 47.62%，兩者仍是最大單一 Project。

## Project 分布：每 Rank 10000 次成功選取

| Rank | Project | Effective Weight | Count | Expected % | Actual % |
|---|---|---:|---:|---:|---:|
| 0 | 新品提案 | 3 | 10000 | 100.00 | 100.00 |
| 1 | 新品提案 | 1.5 | 3398 | 33.33 | 33.98 |
| 1 | 客戶活動企劃 | 3 | 6602 | 66.67 | 66.02 |
| 2 | 新品提案 | 0.8 | 1416 | 13.79 | 14.16 |
| 2 | 客戶活動企劃 | 2 | 3456 | 34.48 | 34.56 |
| 2 | 跨部門整合案 | 3 | 5128 | 51.72 | 51.28 |
| 3 | 新品提案 | 0.3 | 469 | 4.76 | 4.69 |
| 3 | 客戶活動企劃 | 1 | 1678 | 15.87 | 16.78 |
| 3 | 跨部門整合案 | 2 | 3156 | 31.75 | 31.56 |
| 3 | 團隊流程改善 | 3 | 4697 | 47.62 | 46.97 |
| 4 | 新品提案 | 0.1 | 127 | 1.32 | 1.27 |
| 4 | 客戶活動企劃 | 0.5 | 693 | 6.58 | 6.93 |
| 4 | 跨部門整合案 | 1 | 1365 | 13.16 | 13.65 |
| 4 | 團隊流程改善 | 2 | 2624 | 26.32 | 26.24 |
| 4 | 年度策略規劃 | 4 | 5191 | 52.63 | 51.91 |

機率抽樣每次清除測試 ACTIVE 避免 capacity 干擾，真實 Runtime 則保留上限。

## Project Chance／Boss 回歸

| Rank | Project Config→Actual % | Boss Expected→Actual % |
|---|---|---|
| 0 | 16.00→16.55 | 25.00→25.87 |
| 1 | 22.00→22.49 | 29.00→29.45 |
| 2 | 30.00→30.33 | 34.00→34.02 |
| 3 | 40.00→39.96 | 39.00→39.13 |
| 4 | 50.00→49.95 | 45.00→44.87 |

## 30 日 Runtime

Age22 開始自然年長、無產品、其他能力 Lv0、不購買／升職／Prestige，初始金錢沿用正式 Config。推薦速度／品質對應最近整數 Lv，實際起始值及等級見每筆 CSV；暫時 Buff/Debuff 正常運作。取樣終點為 Day31 上班錨點，包含最初早餐。Average 為世界時間加權；表中 Peak 是每 seed 峰值的平均，原始峰值留在 CSV。

| Rank | Speed（Lv） | Quality（Lv） | Generated Work | Projects | Follow-up | Avg Todo | Avg Due Today | Avg Overdue | Peak Overdue | Generated Workload | Processed Workload | Ratio | Gross Income | Overdue Loss | Completed |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 0 | 20（0） | 10（0） | 302.00 | 4.73 | 218.37 | 8.13 | 1.65 | 0.25 | 9.60 | 16737.24 | 16179.71 | 0.97 | 7238.57 | 86.73 | 293.97 |
| 1 | 30（2） | 19（3） | 287.17 | 6.87 | 191.27 | 7.70 | 1.16 | 0.04 | 4.43 | 24701.94 | 24041.25 | 0.97 | 23689.17 | 104.80 | 279.50 |
| 2 | 45（5） | 28（6） | 269.47 | 8.47 | 177.60 | 8.88 | 1.55 | 0.07 | 5.43 | 37999.30 | 36491.68 | 0.96 | 63467.53 | 391.63 | 258.47 |
| 3 | 65（9） | 40（10） | 268.40 | 10.13 | 170.73 | 9.81 | 1.80 | 0.10 | 6.70 | 54727.59 | 52494.40 | 0.96 | 173692.30 | 1396.17 | 256.83 |
| 4 | 90（14） | 55（15） | 252.00 | 11.20 | 154.20 | 10.71 | 2.16 | 0.21 | 8.70 | 77018.02 | 73626.62 | 0.96 | 456194.33 | 4361.50 | 239.93 |

Generated Work/Workload 計正式釋出的所有工作；Follow-up Count 在建立 Pending 時也計入，尚未 release 的 Pending 不計正式 Workload。Processed 含進行中的部分進度。

## Runtime 內容分布（30 seeds 合計，各類別內占比）

### Rank0

| 類別 | ID／Type | Count | % |
|---|---|---:|---:|
| NORMAL | email | 616 | 47.60 |
| NORMAL | data | 416 | 32.15 |
| NORMAL | slides | 262 | 20.25 |
| NORMAL | monthly | 0 | 0.00 |
| NORMAL | client | 0 | 0.00 |
| NORMAL | revision | 0 | 0.00 |
| NORMAL | urgent | 0 | 0.00 |
| NORMAL | meeting | 0 | 0.00 |
| NORMAL | requirement_summary | 0 | 0.00 |
| NORMAL | progress_update | 0 | 0.00 |
| NORMAL | client_proposal | 0 | 0.00 |
| NORMAL | cross_department | 0 | 0.00 |
| NORMAL | risk_review | 0 | 0.00 |
| NORMAL | team_review | 0 | 0.00 |
| NORMAL | resource_allocation | 0 | 0.00 |
| NORMAL | manager_report | 0 | 0.00 |
| NORMAL | client_escalation | 0 | 0.00 |
| NORMAL | department_strategy | 0 | 0.00 |
| NORMAL | budget_review | 0 | 0.00 |
| NORMAL | cross_department_decision | 0 | 0.00 |
| NORMAL | executive_report | 0 | 0.00 |
| NORMAL | critical_issue | 0 | 0.00 |
| PROJECT | launch | 142 | 100.00 |
| PROJECT | client_campaign | 0 | 0.00 |
| PROJECT | cross_department_project | 0 | 0.00 |
| PROJECT | process_improvement | 0 | 0.00 |
| PROJECT | annual_strategy | 0 | 0.00 |
| FOLLOW_UP | REWORK | 2484 | 37.92 |
| FOLLOW_UP | CORRECTION | 1281 | 19.55 |
| FOLLOW_UP | MISSING_INFO | 1176 | 17.95 |
| FOLLOW_UP | CLIENT_REPLY | 760 | 11.60 |
| FOLLOW_UP | NEW_REQUEST | 623 | 9.51 |
| FOLLOW_UP | PROJECT_NEXT_STEP | 227 | 3.47 |

### Rank1

| 類別 | ID／Type | Count | % |
|---|---|---:|---:|
| NORMAL | email | 173 | 15.11 |
| NORMAL | data | 155 | 13.54 |
| NORMAL | slides | 127 | 11.09 |
| NORMAL | monthly | 158 | 13.80 |
| NORMAL | client | 199 | 17.38 |
| NORMAL | revision | 0 | 0.00 |
| NORMAL | urgent | 0 | 0.00 |
| NORMAL | meeting | 0 | 0.00 |
| NORMAL | requirement_summary | 184 | 16.07 |
| NORMAL | progress_update | 149 | 13.01 |
| NORMAL | client_proposal | 0 | 0.00 |
| NORMAL | cross_department | 0 | 0.00 |
| NORMAL | risk_review | 0 | 0.00 |
| NORMAL | team_review | 0 | 0.00 |
| NORMAL | resource_allocation | 0 | 0.00 |
| NORMAL | manager_report | 0 | 0.00 |
| NORMAL | client_escalation | 0 | 0.00 |
| NORMAL | department_strategy | 0 | 0.00 |
| NORMAL | budget_review | 0 | 0.00 |
| NORMAL | cross_department_decision | 0 | 0.00 |
| NORMAL | executive_report | 0 | 0.00 |
| NORMAL | critical_issue | 0 | 0.00 |
| PROJECT | launch | 81 | 39.32 |
| PROJECT | client_campaign | 125 | 60.68 |
| PROJECT | cross_department_project | 0 | 0.00 |
| PROJECT | process_improvement | 0 | 0.00 |
| PROJECT | annual_strategy | 0 | 0.00 |
| FOLLOW_UP | REWORK | 1929 | 33.62 |
| FOLLOW_UP | CORRECTION | 1060 | 18.47 |
| FOLLOW_UP | MISSING_INFO | 934 | 16.28 |
| FOLLOW_UP | CLIENT_REPLY | 917 | 15.98 |
| FOLLOW_UP | NEW_REQUEST | 657 | 11.45 |
| FOLLOW_UP | PROJECT_NEXT_STEP | 241 | 4.20 |

### Rank2

| 類別 | ID／Type | Count | % |
|---|---|---:|---:|
| NORMAL | email | 34 | 5.21 |
| NORMAL | data | 18 | 2.76 |
| NORMAL | slides | 35 | 5.36 |
| NORMAL | monthly | 62 | 9.49 |
| NORMAL | client | 80 | 12.25 |
| NORMAL | revision | 55 | 8.42 |
| NORMAL | urgent | 78 | 11.94 |
| NORMAL | meeting | 0 | 0.00 |
| NORMAL | requirement_summary | 51 | 7.81 |
| NORMAL | progress_update | 42 | 6.43 |
| NORMAL | client_proposal | 83 | 12.71 |
| NORMAL | cross_department | 75 | 11.49 |
| NORMAL | risk_review | 40 | 6.13 |
| NORMAL | team_review | 0 | 0.00 |
| NORMAL | resource_allocation | 0 | 0.00 |
| NORMAL | manager_report | 0 | 0.00 |
| NORMAL | client_escalation | 0 | 0.00 |
| NORMAL | department_strategy | 0 | 0.00 |
| NORMAL | budget_review | 0 | 0.00 |
| NORMAL | cross_department_decision | 0 | 0.00 |
| NORMAL | executive_report | 0 | 0.00 |
| NORMAL | critical_issue | 0 | 0.00 |
| PROJECT | launch | 40 | 15.75 |
| PROJECT | client_campaign | 91 | 35.83 |
| PROJECT | cross_department_project | 123 | 48.43 |
| PROJECT | process_improvement | 0 | 0.00 |
| PROJECT | annual_strategy | 0 | 0.00 |
| FOLLOW_UP | REWORK | 1952 | 36.64 |
| FOLLOW_UP | CORRECTION | 998 | 18.73 |
| FOLLOW_UP | MISSING_INFO | 922 | 17.30 |
| FOLLOW_UP | CLIENT_REPLY | 642 | 12.05 |
| FOLLOW_UP | NEW_REQUEST | 608 | 11.41 |
| FOLLOW_UP | PROJECT_NEXT_STEP | 206 | 3.87 |

### Rank3

| 類別 | ID／Type | Count | % |
|---|---|---:|---:|
| NORMAL | email | 4 | 0.96 |
| NORMAL | data | 3 | 0.72 |
| NORMAL | slides | 9 | 2.16 |
| NORMAL | monthly | 11 | 2.64 |
| NORMAL | client | 17 | 4.09 |
| NORMAL | revision | 21 | 5.05 |
| NORMAL | urgent | 31 | 7.45 |
| NORMAL | meeting | 31 | 7.45 |
| NORMAL | requirement_summary | 15 | 3.61 |
| NORMAL | progress_update | 15 | 3.61 |
| NORMAL | client_proposal | 33 | 7.93 |
| NORMAL | cross_department | 34 | 8.17 |
| NORMAL | risk_review | 38 | 9.13 |
| NORMAL | team_review | 39 | 9.38 |
| NORMAL | resource_allocation | 45 | 10.82 |
| NORMAL | manager_report | 36 | 8.65 |
| NORMAL | client_escalation | 34 | 8.17 |
| NORMAL | department_strategy | 0 | 0.00 |
| NORMAL | budget_review | 0 | 0.00 |
| NORMAL | cross_department_decision | 0 | 0.00 |
| NORMAL | executive_report | 0 | 0.00 |
| NORMAL | critical_issue | 0 | 0.00 |
| PROJECT | launch | 16 | 5.26 |
| PROJECT | client_campaign | 47 | 15.46 |
| PROJECT | cross_department_project | 104 | 34.21 |
| PROJECT | process_improvement | 137 | 45.07 |
| PROJECT | annual_strategy | 0 | 0.00 |
| FOLLOW_UP | REWORK | 1809 | 35.32 |
| FOLLOW_UP | CORRECTION | 996 | 19.45 |
| FOLLOW_UP | MISSING_INFO | 957 | 18.68 |
| FOLLOW_UP | CLIENT_REPLY | 667 | 13.02 |
| FOLLOW_UP | NEW_REQUEST | 529 | 10.33 |
| FOLLOW_UP | PROJECT_NEXT_STEP | 164 | 3.20 |

### Rank4

| 類別 | ID／Type | Count | % |
|---|---|---:|---:|
| NORMAL | email | 0 | 0.00 |
| NORMAL | data | 1 | 0.56 |
| NORMAL | slides | 3 | 1.68 |
| NORMAL | monthly | 3 | 1.68 |
| NORMAL | client | 3 | 1.68 |
| NORMAL | revision | 2 | 1.12 |
| NORMAL | urgent | 9 | 5.03 |
| NORMAL | meeting | 4 | 2.23 |
| NORMAL | requirement_summary | 2 | 1.12 |
| NORMAL | progress_update | 4 | 2.23 |
| NORMAL | client_proposal | 5 | 2.79 |
| NORMAL | cross_department | 6 | 3.35 |
| NORMAL | risk_review | 7 | 3.91 |
| NORMAL | team_review | 14 | 7.82 |
| NORMAL | resource_allocation | 13 | 7.26 |
| NORMAL | manager_report | 7 | 3.91 |
| NORMAL | client_escalation | 6 | 3.35 |
| NORMAL | department_strategy | 23 | 12.85 |
| NORMAL | budget_review | 19 | 10.61 |
| NORMAL | cross_department_decision | 18 | 10.06 |
| NORMAL | executive_report | 25 | 13.97 |
| NORMAL | critical_issue | 5 | 2.79 |
| PROJECT | launch | 3 | 0.89 |
| PROJECT | client_campaign | 13 | 3.87 |
| PROJECT | cross_department_project | 40 | 11.90 |
| PROJECT | process_improvement | 87 | 25.89 |
| PROJECT | annual_strategy | 193 | 57.44 |
| FOLLOW_UP | REWORK | 1836 | 39.69 |
| FOLLOW_UP | CORRECTION | 964 | 20.84 |
| FOLLOW_UP | MISSING_INFO | 778 | 16.82 |
| FOLLOW_UP | CLIENT_REPLY | 512 | 11.07 |
| FOLLOW_UP | NEW_REQUEST | 391 | 8.45 |
| FOLLOW_UP | PROJECT_NEXT_STEP | 145 | 3.13 |

## Acceptance 與測試

Runner checks：146 pass／0 fail，所有名稱與結果在 rank-assertions.csv。禁止項目任一出現會立即中止；抽樣偏差以 4 個二項標準差＋1/n 篩查，不是正式經濟平衡。


內容判斷以精確理論與真實 Runtime 表格為準，不硬寫分布。五職級已具各自新增的 Work 與主力 Project，低階仍非零；同時新增的品質需求／工作量可能改變積壓與返工，這輪未做最終平衡。

## 重跑與檔案

沿用 scripts/test-ranks.ts，執行 npx tsx scripts/test-ranks.ts。rank-results.json 包含 Config、seed、全部明細；各 CSV 帶 Config hash／Rank／Seed／Workdays。舊內容測試報告保留在 rank-tests-pre-content，避免覆寫歷史證據。
