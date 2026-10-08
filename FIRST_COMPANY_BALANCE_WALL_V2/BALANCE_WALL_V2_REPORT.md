# FIRST COMPANY BALANCE WALL REWORK V2

**沒有候選通過第一公司目標。** 12組×10 Seed與人工選出的3組×30 Seed全部未在60真人分鐘到R4。正式Config／GameState／SimulationLoop／Target／UI未修改；升職仍零費用。這輪完成候選測量與驗證，沒有套用Winner。

## 方法與保護

使用既有正式 advanceOnline／upgrade action／Promotion 路徑。12組候選記憶體 overlay：Threshold A或B、growth1.040/1.042/1.045、retry2/3。推薦E/Q依Threshold映射，普通中央Tier為推薦E×7；只有指定的門檻、推薦數值、Tier、Run baseCost、curve及retry改動。baseCosts=30/34/47/38/43（E/Q/拍馬屁/Life/摸魚）；softCap1=60、softCap2=120，post100/200Growth保留1.015/1.005。Rank Reward=1/2.2/5/11/25及其餘禁止項目完全保留。

每組固定42+i×7919，10 Seed i0–9；擴充到30 i0–29。每run3600真人秒，1x含既有SLEEP×60世界時間，每0.25真人秒買盡最便宜可負擔Run能力，沒有升職reserve、manual promote、Products、Prestige、Permanent、Low Profile或Offline。10組前段共120個run；Top3重用各10個已完成run、各補20個，總計180個獨立candidate/seed，非900Career。所有run跑滿60分鐘，不以到R4早停。

候選overlay與正式Config分離。protected-hashes.json涵蓋Excel、generatedJSON、v2Defaults及全部game來源與升職UI，前後SHA256完全相同。npm run build照既有規則生成Config後也保持原hash；沒有偷偷寫候選。正式成本公式已使用Config softCap1/2，無需修改Production。12組overlay allowlist regression同時驗證所有禁止數值不变、普通workload不double Rank scaling、建立後固定快照、四職級零錢派發、Dinner=120以及LowProfile僅影響評估。

## Purchase Burst 定義

同candidate、seed、realSeconds的購買合為一次Burst。interval是本run相鄰Burst時間差；首Burst無interval，跨Rank的interval歸到後一次Burst所屬Rank。所有有效interval均>0，不再將同Tick多買產生的0秒當體感；原purchases.csv逐筆保留。

Rank前25%／中50%／後25%依該Rank的**觀測停留真人時間**切段，再以Burst發生時間分類，interval仍為相鄰Burst完整間隔。右設限Rank以60分鐘作觀測尾端，其後25%不是假想已完成Rank最後四分之一。分位數為同Rank所有實際Burst pooled distribution，不先平均各run。ETA沿用最近60真人秒gross income、保持當下錢包推估五能力的median，每真人整秒採樣；不是預留資金或購買保證。

Career quantile分母包括全部10／30組，未到達視為>60右設限，不排除失敗樣本或填0。Promotion首次率分母為有派發過的run，尚未到Dinner者另列pending；平均Dinner%只含已結算Dinner。平均加班僅含已完成考核（成功=0），不將未完成加班當完整時間。elapsed包含晚餐／中斷，processing僅實際處理原失敗考核。CI為2000次固定測量seed1937+rank的bootstrap median 95% percentile區間，保留右設限；全未到R4時區間不可辨識，標>60而非偽造35分鐘。

## 12組排名與初測

這是人工選擇的「相對可繼續檢查」順序，沒有程式Score或Auto Tune。R4 P50/P90與完整快→中→慢→Wall均未達標，故沒有合格Winner；平手時優先A較低最後門檻、R4考核派發覆蓋、較早進R3、較長後段Burst與較少逾期。前3組A/C3兼顧接近最後考核與三種成本曲線，C2更早重試未必更早成功，B有更多run連最後考核都未觸及。排序不是宣稱R4可達35分鐘。

| 順序 | 候選 | R1 P50分 | R2 P50分 | R3 P50分 | R4達成 | R4 P50/P90 | Burst R0/R1/R2/R3秒 | R3後25%秒 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | A-G1.040-C3 | 13.85 | 24.76 | 37.56 | 0/10 | >60 / >60 | 7.25 / 4.50 / 4.25 / 6.00 | 8.50 |
| 2 | A-G1.042-C3 | 13.80 | 26.62 | 41.74 | 0/10 | >60 / >60 | 7.50 / 4.50 / 4.25 / 6.50 | 9.75 |
| 3 | A-G1.045-C3 | 13.79 | 25.16 | 43.43 | 0/10 | >60 / >60 | 8.00 / 4.50 / 4.50 / 6.50 | 9.75 |
| 4 | B-G1.040-C3 | 13.85 | 24.76 | 42.40 | 0/10 | >60 / >60 | 7.25 / 4.50 / 4.25 / 6.50 | 9.00 |
| 5 | A-G1.040-C2 | 13.81 | 27.99 | 42.76 | 0/10 | >60 / >60 | 7.50 / 4.25 / 4.00 / 5.75 | 8.00 |
| 6 | A-G1.042-C2 | 15.83 | 27.85 | 44.36 | 0/10 | >60 / >60 | 8.00 / 4.75 / 4.50 / 5.75 | 7.00 |
| 7 | B-G1.042-C3 | 13.80 | 26.62 | 44.22 | 0/10 | >60 / >60 | 7.50 / 4.50 / 4.25 / 6.75 | 9.75 |
| 8 | A-G1.045-C2 | 15.72 | 27.79 | 45.07 | 0/10 | >60 / >60 | 8.00 / 4.50 / 4.50 / 6.50 | 8.25 |
| 9 | B-G1.040-C2 | 13.81 | 27.99 | 44.23 | 0/10 | >60 / >60 | 7.50 / 4.25 / 4.00 / 6.25 | 8.12 |
| 10 | B-G1.045-C3 | 13.79 | 25.16 | 48.61 | 0/10 | >60 / >60 | 8.00 / 4.50 / 5.00 / 7.00 | 10.00 |
| 11 | B-G1.042-C2 | 15.83 | 27.85 | 49.61 | 0/10 | >60 / >60 | 8.00 / 4.75 / 4.50 / 6.00 | 7.75 |
| 12 | B-G1.045-C2 | 15.72 | 27.79 | 50.10 | 0/10 | >60 / >60 | 8.00 / 4.50 / 4.75 / 6.25 | 8.25 |

每組R1/R2/R3 P10/P50/P90、R4 reached/censored及所有壓力指標完整見candidate-summary.csv；Rank停留、起終E/Q、購買數、ETA見candidate-rank-times.csv與rank-run-details.csv。每Rank Burst count、P10/P50/P90與三時段P50見candidate-burst-intervals.csv；不可只看此表的P50。

## Top3 30 Seed


### A-G1.040-C3

| Rank | P10真人分 | P50真人分 | P90真人分 |
| --- | --- | --- | --- |
| R1 | 9.76 | 11.87 | 15.53 |
| R2 | 20.93 | 23.11 | 28.82 |
| R3 | 31.98 | 35.69 | 41.63 |
| R4 | >60／未觀測到 | >60／未觀測到 | >60／未觀測到 |

R4 0/30，censored 30/30；Burst R0→R3 P50：7.25 / 4.25 / 4.00 / 6.00秒；R3後25% 8.75秒。

| 升職 | 首次成功% | 首次超時失敗% | 首次pending% | Dinner平均% | 平均重試 | 加班processing秒 | 加班elapsed秒 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| R0→R1 | 6.67 | 93.33 | 0.00 | 93.89 | 1.07 | 6.64 | 8.70 |
| R1→R2 | 0.00 | 100.00 | 0.00 | 93.33 | 1.10 | 7.29 | 9.39 |
| R2→R3 | 0.00 | 100.00 | 0.00 | 93.35 | 1.33 | 7.27 | 9.56 |
| R3→R4 | 0.00 | 100.00 | 0.00 | 87.49 | 2.23 | 13.59 | 17.59 |

Todo 時間加權平均 7.22／期末P50 6.00／Peak P90 23.00；DueToday平均 0.84／期末 0.00／Peak P90 12.50；Overdue平均 0.06／期末 0.00／Peak P90 7.00。Boss加班processing平均 17.78世界秒；每run睡眠ratio平均再平均 1.00，窗口pooled P10 1.00。

### A-G1.042-C3

| Rank | P10真人分 | P50真人分 | P90真人分 |
| --- | --- | --- | --- |
| R1 | 9.79 | 13.77 | 13.96 |
| R2 | 21.10 | 24.72 | 27.12 |
| R3 | 32.21 | 38.41 | 44.09 |
| R4 | >60／未觀測到 | >60／未觀測到 | >60／未觀測到 |

R4 0/30，censored 30/30；Burst R0→R3 P50：7.50 / 4.50 / 4.25 / 6.50秒；R3後25% 9.75秒。

| 升職 | 首次成功% | 首次超時失敗% | 首次pending% | Dinner平均% | 平均重試 | 加班processing秒 | 加班elapsed秒 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| R0→R1 | 0.00 | 100.00 | 0.00 | 93.54 | 1.07 | 7.02 | 9.08 |
| R1→R2 | 6.67 | 93.33 | 0.00 | 93.20 | 1.03 | 7.49 | 9.52 |
| R2→R3 | 0.00 | 100.00 | 0.00 | 92.43 | 1.53 | 8.24 | 10.66 |
| R3→R4 | 0.00 | 100.00 | 0.00 | 83.73 | 1.53 | 18.05 | 22.05 |

Todo 時間加權平均 7.16／期末P50 5.00／Peak P90 22.00；DueToday平均 0.82／期末 0.00／Peak P90 13.00；Overdue平均 0.05／期末 0.00／Peak P90 5.00。Boss加班processing平均 19.98世界秒；每run睡眠ratio平均再平均 1.00，窗口pooled P10 1.00。

### A-G1.045-C3

| Rank | P10真人分 | P50真人分 | P90真人分 |
| --- | --- | --- | --- |
| R1 | 9.91 | 13.69 | 19.50 |
| R2 | 21.21 | 26.84 | 30.49 |
| R3 | 36.01 | 41.44 | 47.38 |
| R4 | >60／未觀測到 | >60／未觀測到 | >60／未觀測到 |

R4 0/30，censored 30/30；Burst R0→R3 P50：7.75 / 4.50 / 4.50 / 6.75秒；R3後25% 9.50秒。

| 升職 | 首次成功% | 首次超時失敗% | 首次pending% | Dinner平均% | 平均重試 | 加班processing秒 | 加班elapsed秒 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| R0→R1 | 0.00 | 100.00 | 0.00 | 93.40 | 1.13 | 7.14 | 9.27 |
| R1→R2 | 0.00 | 100.00 | 0.00 | 92.96 | 1.30 | 7.75 | 10.01 |
| R2→R3 | 0.00 | 100.00 | 0.00 | 93.11 | 1.70 | 7.48 | 10.00 |
| R3→R4 | 0.00 | 89.29 | 10.71 | 83.10 | 0.90 | 19.28 | 23.28 |

Todo 時間加權平均 7.44／期末P50 6.50／Peak P90 22.50；DueToday平均 0.85／期末 0.00／Peak P90 14.00；Overdue平均 0.06／期末 0.00／Peak P90 5.00。Boss加班processing平均 19.66世界秒；每run睡眠ratio平均再平均 1.00，窗口pooled P10 1.00。

## Gate、Wall與未達標原因

所有180個run，無正式阻塞卻未派Promotion的WorkStart為0。Money不在正式阻塞原因。剩下E/Q、逾期、冷卻、未完成考核、強制Boss／BossMeeting與WorkStart時點，皆為既有正式條件；沒有Level cap、Random Success、升職reserve、新公司或人工停升職。未發現runaway Todo／Overdue，逐run平均／期末／peak完整保留，不用期末正常掩蓋中途壓力。

固定workload=門檻E×96×1.20且派發剛達門檻時，一開始沒有20% headroom；考核不給一般工作收入，BUY_ALL也不能穩定靠考核途中繼續買效率。提高成本成長减少了等下一個合法WorkStart期間的能力超額，結果更常首次必敗；多次失敗又消耗Career時間與一般賺錢時間。該解釋只連結正式路徑與已觀測結果，不是新增成功機率或改factor。

**NEXT BOTTLENECK: RANK REWARD MULTIPLIER**。候選仍呈現R0較慢、升R1/R2反而Burst變快，提前成本成長未抵銷Rank收入跳躍。這是下一輪應隔離檢查的參數，但本輪一律保留1/2.2/5/11/25；它也不是唯一原因，Promotion頭部壓力與賺錢時間被重試占用同時存在，不能承諾只調Reward便能到35分鐘。

## Level爆炸與數學表

180個run沒有到R4，故candidate-levels-at-r4.csv的R4樣本數全0，P10/P50/P90留空；不可用60分鐘的期末能力冒充到R4時能力。runs.json另外保存真實期末能力；未達R4無法驗證「R4時主要能力100上下」。Lv200/300/500/1000下一級Cost用現有正式函數形狀推算，見candidate-softwall-costs.csv（五能力×三curve×四levels）。此表是數學延伸，沒有執行Prestige或將1～2周目沒有Lv1000宣稱為已模擬證據。

## Regression與交付

npm test 461/461；browser tests 32/32；npm run build PASS。原正式Cost Removal、Dinner deadline、Lunch bypass、SLEEP×60、180日長、普通workload快照、Save／Offline／Products／Prestige均保留，全部protected source/config hash相同。瀏覽器首輪31/32，產品framework測試在並行長模擬時遇60秒timeout；停止長運算後完整重跑通過，保留browser-tests-initial.log。没有為過測試放寬timeout或修改產品。

睡眠結算旗標在observer前已重設，首次測量漏記；已改為每個正式邊界讀取既有「睡眠窗口結算」通知並以id去重，再重播相同180情境。此修正不讀取通知排隊時間、不影響引擎/RNG；報告使用重播後資料。12組10Seed與Top3擴充原始CSV保留購買/Burst/Promotion/WorkStart，每項指標可追到candidate+seed。前10Seed重用而非擴充為偽獨立樣本。

檔案：BALANCE_WALL_V2_REPORT.md、candidate-ranking.csv、candidate-summary.csv、candidate-rank-times.csv、candidate-burst-intervals.csv、candidate-promotions.csv、candidate-levels-at-r4.csv、candidate-softwall-costs.csv、top3-30seed-summary.csv、top3-confidence-intervals.csv、runs.json、candidate JSON、原始CSV、verification.json與三種驗證logs。未Commit／Push／部署。

## 最後11個回答

1. **哪3組最好？** 相對選出A-G1.040-C3、A-G1.042-C3、A-G1.045-C3；三組均未合格，不存在正式Winner。
2. **哪組最接近35分鐘R4？** 無法證明。三組30Seed的R4全部>60；A-G1.040-C3較早到R3只是候選比較代理，不是R4=35。
3. **哪組最接近目標升級節奏？** 高growth候選後段Burst稍長，A-G1.045-C3／B-G1.045-C3在10Seed接近後段相對上緣，但所有候選都仍升職後變快，沒有任何完整3～6→6～10→10～20→20～30秒節奏達標。
4. **Cooldown2或3？** 此組固定配對中3較適合作為進一步檢查基準；2較快再次考核但常在不足能力時再次失敗，不保證縮短到R3/R4。這不是所有策略都應選3的普遍結論。
5. **ThresholdA或B？** A較合適；B最後E110/Q66更晚觸及，R4完成目標未見改善。
6. **baseGrowth哪個最好？** 1.040在Career推進上相對較好；1.045後段等待稍長但仍沒有SoftWall。沒有一個同時滿足Career和升級體感，不指定正式值。
7. **Promotion仍過難？** 是。各候選後續首次超時比例多接近100%，超出40～80%；pending不是成功，不能將未結算導致的較低失敗百分比當改善。
8. **真正SoftWall形成？** 否。後段等待增加一些，但遠未達20～30秒，且Rank升級後還會變快。
9. **R4時能力多少？** 無R4樣本，不能回答實際分布。沒有用期末能力冒充，亦未用數學表宣稱長期Prestige已驗證。
10. **非使用者要求的人為Gate？** 本輪正式升職與BUY_ALL路徑未發現；未加入新Gate，零Money、零reserve，沒有Level cap或隨機成功。
11. **下一個參數是否Rank Reward multiplier？** 是，至少對升職後Burst反而縮短而言應列下一個隔離檢查；同時必須保留Promotion過難與收入時間被重試占用的證據。本輪完全未改Reward，也不宣稱單調它必能解全部問題。
