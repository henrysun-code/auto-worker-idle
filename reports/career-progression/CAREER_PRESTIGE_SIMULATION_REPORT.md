# Career / Prestige 正式引擎模擬報告

## 範圍與驗證

30 Scenario × 30 固定 Seed = **900 Run**；每次完整 6 小時 active simulation（360 世界日），合計 5,400 小時遊戲暴露量。沒有減少樣本、沒有調 Balance、沒有產品／Offline／Debug。早餐修正與限定 Boss Follow-up 標記修正之外，正式規則維持不變。

使用正式 SimulationLoop、生成器、結算與 applyAction。策略在正式引擎完成一致狀態邊界後操作，沒有另寫日程、收入、工作或睡眠模型。暫存副本的只讀 hook 記錄老闆判定；Rank0、Rank4、含重生循環均驗證完整 State＋RNG 一致。重生驗證固定 Date.now，避免 lastSeenAt 的實際牆鐘造成假差異。

核心 323/323、瀏覽器 24/24、build 通過。最大 Workload conservation 誤差 3.61e-07，最大收入對帳誤差 0。

同 Seed 各策略共享初始 RNG；之後不同升級／工作／重生會改變呼叫軌跡，配對為共同初始條件，不是假裝事件逐一相同。NEVER 是正式基準。

時間單位：active minutes；1 分鐘 = 1 個目前世界日。重生重設本輪時間，累積 active time 不重設。daily CSV 是固定 60 秒累積暴露窗口，跨重生時包含重置前後兩段；不是硬把重生後日曆接成同一世界日。generated 只計已正式發布的工作，不含未解鎖／未發布工作。未完成工作在重生時計入 discarded，不能把它算成已處理。

所有未達里程碑保留 censored；分位數只針對已達樣本，必須一起看 observed/censored。升級等待含同時間多買的 0 分鐘。gross 不扣成本；netIncomeAfterUpgrades 扣 Run Upgrade，netAfterCareerSpend 再扣升職；Clarity 消費不是現金成本。收入 proxy 為最近 5 個世界日的累積收入／升級支出，首 5 日按已暴露時間計。配對 gross 回本以每日採樣首次超過同策略 NEVER 累積 gross 為準（1 分鐘解析度），不宣稱永遠維持領先。

## 執行摘要：十個問題

1. PROMOTE_ASAP_BALANCED：首次 canPrestige 中位 6.74 分（P10 4.72 / P90 10.64）；首次 Rank4 中位 25.55 分，未達 0/30。
2. PREPARED_BALANCED：首次 canPrestige 中位 8.72 分（P10 5.69 / P90 11.30）；首次 Rank4 中位 15.05 分，未達 0/30。
3. EFFICIENCY_FIRST：首次 canPrestige 中位 9.33 分（P10 6.50 / P90 11.24）；首次 Rank4 中位 15.75 分，未達 0/30。
4. QUALITY_FIRST：首次 canPrestige 中位 8.46 分（P10 7.51 / P90 10.74）；首次 Rank4 中位 14.66 分，未達 0/30。
5. ALL_ROUNDER：首次 canPrestige 中位 16.60 分（P10 13.61 / P90 18.80）；首次 Rank4 中位 23.76 分，未達 0/30。
6. Lv100／200／250／300 能否達成？見下方 NEVER 分位表，未達保留，不外推。
7. Soft Wall 在哪？看 N→N+1 真實等待與 censored，而不是固定五分鐘門檻。
8. 重生是否比 NEVER 賺？見 timing gross／net 及配對回本表，能力追趕與現金回本分開呈現。
9. Permanent 是否有效？比較第二輪里程碑與前峰值 50/80/100% 追趕，不混入零目標。
10. Boss／Sleep 是否形成風險鏈？ALL_ROUNDER 的拍馬屁、遭遇、Severity、加班跨窗與睡眠分布一起檢查，沒有宣告需要 Nerf。

## 職涯與升級

|Policy|Rank1 median|Rank2 median|Rank3 median|Rank4 median / censored|
|---|---:|---:|---:|---:|
|PROMOTE_ASAP_BALANCED|0.59|4.59|13.03|25.55 / 0|
|PREPARED_BALANCED|5.46|8.72|11.62|15.05 / 0|
|EFFICIENCY_FIRST|5.60|9.33|12.42|15.75 / 0|
|QUALITY_FIRST|4.66|8.46|12.30|14.66 / 0|
|ALL_ROUNDER|10.43|16.60|20.73|23.76 / 0|

NEVER_PRESTIGE，首輪里程碑（分）：

|Policy|Ability|Lv100|Lv200|Lv250|Lv300|
|---|---|---:|---:|---:|---:|
|PROMOTE_ASAP_BALANCED|efficiency|29.42 (30/30)|73.25 (30/30)|未達／無樣本 (0/30)|未達／無樣本 (0/30)|
|PROMOTE_ASAP_BALANCED|quality|29.55 (30/30)|74.13 (30/30)|未達／無樣本 (0/30)|未達／無樣本 (0/30)|
|PROMOTE_ASAP_BALANCED|lifeManagement|未達／無樣本 (0/30)|未達／無樣本 (0/30)|未達／無樣本 (0/30)|未達／無樣本 (0/30)|
|PROMOTE_ASAP_BALANCED|slacking|未達／無樣本 (0/30)|未達／無樣本 (0/30)|未達／無樣本 (0/30)|未達／無樣本 (0/30)|
|PROMOTE_ASAP_BALANCED|flattery|未達／無樣本 (0/30)|未達／無樣本 (0/30)|未達／無樣本 (0/30)|未達／無樣本 (0/30)|
|PREPARED_BALANCED|efficiency|18.06 (30/30)|60.39 (30/30)|未達／無樣本 (0/30)|未達／無樣本 (0/30)|
|PREPARED_BALANCED|quality|18.09 (30/30)|60.57 (30/30)|未達／無樣本 (0/30)|未達／無樣本 (0/30)|
|PREPARED_BALANCED|lifeManagement|未達／無樣本 (0/30)|未達／無樣本 (0/30)|未達／無樣本 (0/30)|未達／無樣本 (0/30)|
|PREPARED_BALANCED|slacking|未達／無樣本 (0/30)|未達／無樣本 (0/30)|未達／無樣本 (0/30)|未達／無樣本 (0/30)|
|PREPARED_BALANCED|flattery|未達／無樣本 (0/30)|未達／無樣本 (0/30)|未達／無樣本 (0/30)|未達／無樣本 (0/30)|
|EFFICIENCY_FIRST|efficiency|16.66 (30/30)|43.59 (30/30)|354.63 (11/30)|未達／無樣本 (0/30)|
|EFFICIENCY_FIRST|quality|未達／無樣本 (0/30)|未達／無樣本 (0/30)|未達／無樣本 (0/30)|未達／無樣本 (0/30)|
|EFFICIENCY_FIRST|lifeManagement|未達／無樣本 (0/30)|未達／無樣本 (0/30)|未達／無樣本 (0/30)|未達／無樣本 (0/30)|
|EFFICIENCY_FIRST|slacking|未達／無樣本 (0/30)|未達／無樣本 (0/30)|未達／無樣本 (0/30)|未達／無樣本 (0/30)|
|EFFICIENCY_FIRST|flattery|未達／無樣本 (0/30)|未達／無樣本 (0/30)|未達／無樣本 (0/30)|未達／無樣本 (0/30)|
|QUALITY_FIRST|efficiency|未達／無樣本 (0/30)|未達／無樣本 (0/30)|未達／無樣本 (0/30)|未達／無樣本 (0/30)|
|QUALITY_FIRST|quality|16.71 (30/30)|62.07 (30/30)|未達／無樣本 (0/30)|未達／無樣本 (0/30)|
|QUALITY_FIRST|lifeManagement|未達／無樣本 (0/30)|未達／無樣本 (0/30)|未達／無樣本 (0/30)|未達／無樣本 (0/30)|
|QUALITY_FIRST|slacking|未達／無樣本 (0/30)|未達／無樣本 (0/30)|未達／無樣本 (0/30)|未達／無樣本 (0/30)|
|QUALITY_FIRST|flattery|未達／無樣本 (0/30)|未達／無樣本 (0/30)|未達／無樣本 (0/30)|未達／無樣本 (0/30)|
|ALL_ROUNDER|efficiency|25.37 (30/30)|69.71 (30/30)|未達／無樣本 (0/30)|未達／無樣本 (0/30)|
|ALL_ROUNDER|quality|25.37 (30/30)|70.04 (30/30)|未達／無樣本 (0/30)|未達／無樣本 (0/30)|
|ALL_ROUNDER|lifeManagement|25.37 (30/30)|70.42 (30/30)|未達／無樣本 (0/30)|未達／無樣本 (0/30)|
|ALL_ROUNDER|slacking|25.39 (30/30)|70.57 (30/30)|未達／無樣本 (0/30)|未達／無樣本 (0/30)|
|ALL_ROUNDER|flattery|25.39 (30/30)|70.93 (30/30)|未達／無樣本 (0/30)|未達／無樣本 (0/30)|

N→N+1 等待實測（NEVER，分；「未達」代表沒有 N→N+1 完成樣本，不是 0）：

|Policy|Ability|N|Median|P10|P25|P75|P90|完成 / censored|
|---|---|---:|---:|---:|---:|---:|---:|---:|
|PROMOTE_ASAP_BALANCED|efficiency|10|0.00|0.00|0.00|0.00|0.22|30 / 0|
|PROMOTE_ASAP_BALANCED|quality|10|0.00|0.00|0.00|0.00|0.38|30 / 0|
|PROMOTE_ASAP_BALANCED|efficiency|50|0.00|0.00|0.00|0.05|0.12|30 / 0|
|PROMOTE_ASAP_BALANCED|quality|50|0.00|0.00|0.00|0.00|0.10|30 / 0|
|PROMOTE_ASAP_BALANCED|efficiency|100|0.00|0.00|0.00|0.06|0.19|30 / 0|
|PROMOTE_ASAP_BALANCED|quality|100|0.00|0.00|0.00|0.02|0.08|30 / 0|
|PROMOTE_ASAP_BALANCED|efficiency|150|0.01|0.00|0.00|0.27|0.76|30 / 0|
|PROMOTE_ASAP_BALANCED|quality|150|0.02|0.00|0.00|0.25|0.70|30 / 0|
|PROMOTE_ASAP_BALANCED|efficiency|200|1.15|0.97|1.02|1.92|2.29|30 / 0|
|PROMOTE_ASAP_BALANCED|quality|200|1.84|1.02|1.41|2.05|2.66|30 / 0|
|PROMOTE_ASAP_BALANCED|efficiency|225|7.59|6.42|6.85|8.03|8.68|30 / 0|
|PROMOTE_ASAP_BALANCED|quality|225|7.81|6.92|7.02|8.08|8.81|30 / 0|
|PREPARED_BALANCED|efficiency|10|1.32|0.00|0.93|1.93|2.11|30 / 0|
|PREPARED_BALANCED|quality|10|0.04|0.00|0.00|0.08|0.39|30 / 0|
|PREPARED_BALANCED|efficiency|50|0.00|0.00|0.00|0.00|0.00|30 / 0|
|PREPARED_BALANCED|quality|50|0.00|0.00|0.00|0.00|0.03|30 / 0|
|PREPARED_BALANCED|efficiency|100|0.00|0.00|0.00|0.05|0.07|30 / 0|
|PREPARED_BALANCED|quality|100|0.05|0.00|0.00|0.08|0.59|30 / 0|
|PREPARED_BALANCED|efficiency|150|0.12|0.00|0.00|0.65|0.85|30 / 0|
|PREPARED_BALANCED|quality|150|0.12|0.00|0.00|0.32|0.74|30 / 0|
|PREPARED_BALANCED|efficiency|200|1.78|1.08|1.24|2.03|2.90|30 / 0|
|PREPARED_BALANCED|quality|200|1.95|1.03|1.30|2.33|2.63|30 / 0|
|PREPARED_BALANCED|efficiency|225|7.15|6.14|6.99|7.99|8.44|30 / 0|
|PREPARED_BALANCED|quality|225|7.84|6.42|7.15|8.04|8.96|30 / 0|
|EFFICIENCY_FIRST|efficiency|10|3.95|1.82|3.14|4.23|4.63|30 / 0|
|EFFICIENCY_FIRST|quality|10|0.00|0.00|0.00|0.08|0.55|30 / 0|
|EFFICIENCY_FIRST|efficiency|50|0.00|0.00|0.00|0.00|0.07|30 / 0|
|EFFICIENCY_FIRST|efficiency|100|0.00|0.00|0.00|0.00|0.58|30 / 0|
|EFFICIENCY_FIRST|efficiency|150|0.00|0.00|0.00|0.45|0.90|30 / 0|
|EFFICIENCY_FIRST|efficiency|200|0.90|0.04|0.11|1.37|1.96|30 / 0|
|EFFICIENCY_FIRST|efficiency|225|4.95|3.02|3.97|5.82|6.74|30 / 0|
|EFFICIENCY_FIRST|efficiency|250|未達／無樣本|未達／無樣本|未達／無樣本|未達／無樣本|未達／無樣本|0 / 11|
|QUALITY_FIRST|quality|10|0.00|0.00|0.00|0.08|0.21|30 / 0|
|QUALITY_FIRST|efficiency|10|1.59|0.82|0.99|2.93|3.37|30 / 0|
|QUALITY_FIRST|efficiency|50|0.00|0.00|0.00|0.00|0.01|30 / 0|
|QUALITY_FIRST|quality|50|0.00|0.00|0.00|0.00|0.00|30 / 0|
|QUALITY_FIRST|quality|100|0.00|0.00|0.00|0.00|0.58|30 / 0|
|QUALITY_FIRST|quality|150|0.19|0.00|0.00|0.52|0.75|30 / 0|
|QUALITY_FIRST|quality|200|1.07|0.20|0.65|2.69|3.61|30 / 0|
|QUALITY_FIRST|quality|225|7.47|5.67|6.81|8.81|10.89|30 / 0|
|ALL_ROUNDER|efficiency|10|0.96|0.08|0.27|1.53|1.74|30 / 0|
|ALL_ROUNDER|quality|10|0.32|0.00|0.13|0.72|0.85|30 / 0|
|ALL_ROUNDER|lifeManagement|10|0.28|0.00|0.15|0.79|0.95|30 / 0|
|ALL_ROUNDER|slacking|10|0.34|0.00|0.16|0.69|0.78|30 / 0|
|ALL_ROUNDER|flattery|10|0.46|0.00|0.28|0.70|0.88|30 / 0|
|ALL_ROUNDER|efficiency|50|0.00|0.00|0.00|0.06|0.10|30 / 0|
|ALL_ROUNDER|quality|50|0.03|0.00|0.00|0.09|0.19|30 / 0|
|ALL_ROUNDER|lifeManagement|50|0.02|0.00|0.00|0.08|0.11|30 / 0|
|ALL_ROUNDER|slacking|50|0.05|0.00|0.00|0.07|0.10|30 / 0|
|ALL_ROUNDER|flattery|50|0.05|0.00|0.00|0.09|0.18|30 / 0|
|ALL_ROUNDER|efficiency|100|0.03|0.00|0.00|0.10|0.49|30 / 0|
|ALL_ROUNDER|quality|100|0.04|0.00|0.00|0.11|0.51|30 / 0|
|ALL_ROUNDER|lifeManagement|100|0.05|0.00|0.00|0.15|0.51|30 / 0|
|ALL_ROUNDER|slacking|100|0.07|0.00|0.00|0.26|0.54|30 / 0|
|ALL_ROUNDER|flattery|100|0.04|0.00|0.00|0.15|0.50|30 / 0|
|ALL_ROUNDER|efficiency|150|0.19|0.00|0.06|0.71|0.88|30 / 0|
|ALL_ROUNDER|quality|150|0.27|0.00|0.04|0.64|0.89|30 / 0|
|ALL_ROUNDER|lifeManagement|150|0.27|0.00|0.02|0.73|0.81|30 / 0|
|ALL_ROUNDER|slacking|150|0.31|0.00|0.03|0.66|0.87|30 / 0|
|ALL_ROUNDER|flattery|150|0.33|0.00|0.05|0.46|0.75|30 / 0|
|ALL_ROUNDER|efficiency|200|1.23|0.84|0.98|1.76|2.32|30 / 0|
|ALL_ROUNDER|quality|200|1.27|0.78|1.01|1.75|2.03|30 / 0|
|ALL_ROUNDER|lifeManagement|200|1.54|0.73|1.04|1.94|2.12|30 / 0|
|ALL_ROUNDER|slacking|200|1.73|0.74|1.03|1.99|2.18|30 / 0|
|ALL_ROUNDER|flattery|200|1.83|0.99|1.24|2.08|2.48|30 / 0|
|ALL_ROUNDER|efficiency|225|5.97|4.32|5.22|7.32|7.98|30 / 0|
|ALL_ROUNDER|quality|225|6.24|4.86|5.12|7.27|8.34|30 / 0|
|ALL_ROUNDER|lifeManagement|225|6.62|4.91|5.31|6.98|8.06|30 / 0|
|ALL_ROUNDER|slacking|225|6.80|4.95|5.88|7.68|8.21|30 / 0|
|ALL_ROUNDER|flattery|225|6.60|4.82|5.67|7.85|8.14|30 / 0|

Soft Wall 診斷：比較 Lv100、200 後的等待斜率及高等級未達比例。只依實測描述變慢程度；有限 360 分鐘資料不能證明永遠不可達。等待沒有到達 N 的情境要搭配 milestone censored 看，不能只看等待已成功者。

## Prestige Timing 比較

|Policy|Timing|重生次數 median|Gross median|Net after career median|gross 配對回本 median / censored|
|---|---|---:|---:|---:|---:|
|PROMOTE_ASAP_BALANCED|NEVER_PRESTIGE|0.00|9,802,714.00|166,284.00|未達／無樣本 / 0|
|PROMOTE_ASAP_BALANCED|AS_SOON_AS_ELIGIBLE|100.00|204,747.00|91,925.00|0.40 / 2953|
|PROMOTE_ASAP_BALANCED|TARGET_30_MIN|12.00|5,392,223.50|49,457.00|10.00 / 359|
|PROMOTE_ASAP_BALANCED|TARGET_60_MIN|6.00|8,823,629.50|95,329.50|148.00 / 174|
|PROMOTE_ASAP_BALANCED|TARGET_120_MIN|3.00|10,186,319.00|154,226.50|94.50 / 44|
|PROMOTE_ASAP_BALANCED|TARGET_180_MIN|2.00|10,329,303.50|141,588.00|122.00 / 30|
|PREPARED_BALANCED|NEVER_PRESTIGE|0.00|10,230,884.50|144,672.00|未達／無樣本 / 0|
|PREPARED_BALANCED|AS_SOON_AS_ELIGIBLE|86.50|294,607.00|10,781.50|0.29 / 2606|
|PREPARED_BALANCED|TARGET_30_MIN|12.00|9,605,253.00|90,218.50|174.00 / 349|
|PREPARED_BALANCED|TARGET_60_MIN|6.00|10,891,120.00|130,899.00|51.50 / 30|
|PREPARED_BALANCED|TARGET_120_MIN|3.00|11,229,876.50|153,981.00|44.00 / 30|
|PREPARED_BALANCED|TARGET_180_MIN|2.00|11,076,462.00|162,966.50|69.00 / 30|
|EFFICIENCY_FIRST|NEVER_PRESTIGE|0.00|8,232,132.50|227,906.50|未達／無樣本 / 0|
|EFFICIENCY_FIRST|AS_SOON_AS_ELIGIBLE|91.00|305,723.50|10,972.50|0.32 / 2723|
|EFFICIENCY_FIRST|TARGET_30_MIN|12.00|8,358,349.00|187,712.00|87.00 / 151|
|EFFICIENCY_FIRST|TARGET_60_MIN|6.00|8,972,516.50|228,248.00|19.50 / 30|
|EFFICIENCY_FIRST|TARGET_120_MIN|3.00|9,218,296.00|282,408.00|31.00 / 30|
|EFFICIENCY_FIRST|TARGET_180_MIN|2.00|8,968,890.50|284,517.00|57.00 / 30|
|QUALITY_FIRST|NEVER_PRESTIGE|0.00|4,925,438.50|103,355.50|未達／無樣本 / 0|
|QUALITY_FIRST|AS_SOON_AS_ELIGIBLE|81.00|274,711.50|9,694.00|0.22 / 2427|
|QUALITY_FIRST|TARGET_30_MIN|12.00|5,379,874.00|102,101.50|52.00 / 30|
|QUALITY_FIRST|TARGET_60_MIN|6.00|5,882,358.50|133,822.00|1.00 / 30|
|QUALITY_FIRST|TARGET_120_MIN|3.00|5,765,871.50|160,616.00|9.50 / 30|
|QUALITY_FIRST|TARGET_180_MIN|2.00|5,455,053.00|160,902.00|50.00 / 30|
|ALL_ROUNDER|NEVER_PRESTIGE|0.00|34,720,963.50|273,516.50|未達／無樣本 / 0|
|ALL_ROUNDER|AS_SOON_AS_ELIGIBLE|35.00|303,960.00|3,566.50|0.24 / 1027|
|ALL_ROUNDER|TARGET_30_MIN|12.00|23,239,434.50|84,998.00|未達／無樣本 / 360|
|ALL_ROUNDER|TARGET_60_MIN|6.00|35,245,570.50|186,469.00|59.00 / 97|
|ALL_ROUNDER|TARGET_120_MIN|3.00|38,679,319.50|210,209.50|64.50 / 32|
|ALL_ROUNDER|TARGET_180_MIN|2.00|38,072,572.00|266,831.00|98.00 / 31|

首輪→第二輪（Cycle1）重新到達 Lv100／200：

|Policy|Timing|Ability|Lv|Cycle0 median|Cycle1 median|縮短 %|Cycle1 achieved / censored|
|---|---|---|---:|---:|---:|---:|---:|
|PROMOTE_ASAP_BALANCED|AS_SOON_AS_ELIGIBLE|efficiency|100|未達／無樣本|未達／無樣本|未達／無樣本|0 / 30|
|PROMOTE_ASAP_BALANCED|AS_SOON_AS_ELIGIBLE|efficiency|200|未達／無樣本|未達／無樣本|未達／無樣本|0 / 30|
|PROMOTE_ASAP_BALANCED|AS_SOON_AS_ELIGIBLE|quality|100|未達／無樣本|未達／無樣本|未達／無樣本|0 / 30|
|PROMOTE_ASAP_BALANCED|AS_SOON_AS_ELIGIBLE|quality|200|未達／無樣本|未達／無樣本|未達／無樣本|0 / 30|
|PROMOTE_ASAP_BALANCED|TARGET_30_MIN|efficiency|100|26.52|23.50|11.39|25 / 5|
|PROMOTE_ASAP_BALANCED|TARGET_30_MIN|efficiency|200|未達／無樣本|未達／無樣本|未達／無樣本|0 / 30|
|PROMOTE_ASAP_BALANCED|TARGET_30_MIN|quality|100|26.52|23.50|11.39|25 / 5|
|PROMOTE_ASAP_BALANCED|TARGET_30_MIN|quality|200|未達／無樣本|未達／無樣本|未達／無樣本|0 / 30|
|PROMOTE_ASAP_BALANCED|TARGET_60_MIN|efficiency|100|29.42|21.88|25.61|30 / 0|
|PROMOTE_ASAP_BALANCED|TARGET_60_MIN|efficiency|200|55.28|55.09|0.34|24 / 6|
|PROMOTE_ASAP_BALANCED|TARGET_60_MIN|quality|100|29.55|21.88|25.93|30 / 0|
|PROMOTE_ASAP_BALANCED|TARGET_60_MIN|quality|200|55.67|55.64|0.05|24 / 6|
|PROMOTE_ASAP_BALANCED|TARGET_120_MIN|efficiency|100|29.42|20.01|31.98|30 / 0|
|PROMOTE_ASAP_BALANCED|TARGET_120_MIN|efficiency|200|73.25|53.41|27.09|30 / 0|
|PROMOTE_ASAP_BALANCED|TARGET_120_MIN|quality|100|29.55|20.01|32.27|30 / 0|
|PROMOTE_ASAP_BALANCED|TARGET_120_MIN|quality|200|74.13|53.63|27.66|30 / 0|
|PROMOTE_ASAP_BALANCED|TARGET_180_MIN|efficiency|100|29.42|22.40|23.87|30 / 0|
|PROMOTE_ASAP_BALANCED|TARGET_180_MIN|efficiency|200|73.25|56.38|23.03|30 / 0|
|PROMOTE_ASAP_BALANCED|TARGET_180_MIN|quality|100|29.55|22.43|24.09|30 / 0|
|PROMOTE_ASAP_BALANCED|TARGET_180_MIN|quality|200|74.13|57.03|23.07|30 / 0|
|PREPARED_BALANCED|AS_SOON_AS_ELIGIBLE|efficiency|100|未達／無樣本|未達／無樣本|未達／無樣本|0 / 30|
|PREPARED_BALANCED|AS_SOON_AS_ELIGIBLE|efficiency|200|未達／無樣本|未達／無樣本|未達／無樣本|0 / 30|
|PREPARED_BALANCED|AS_SOON_AS_ELIGIBLE|quality|100|未達／無樣本|未達／無樣本|未達／無樣本|0 / 30|
|PREPARED_BALANCED|AS_SOON_AS_ELIGIBLE|quality|200|未達／無樣本|未達／無樣本|未達／無樣本|0 / 30|
|PREPARED_BALANCED|TARGET_30_MIN|efficiency|100|18.06|12.33|31.74|30 / 0|
|PREPARED_BALANCED|TARGET_30_MIN|efficiency|200|未達／無樣本|未達／無樣本|未達／無樣本|0 / 30|
|PREPARED_BALANCED|TARGET_30_MIN|quality|100|18.09|12.33|31.87|30 / 0|
|PREPARED_BALANCED|TARGET_30_MIN|quality|200|未達／無樣本|未達／無樣本|未達／無樣本|0 / 30|
|PREPARED_BALANCED|TARGET_60_MIN|efficiency|100|18.06|12.67|29.81|30 / 0|
|PREPARED_BALANCED|TARGET_60_MIN|efficiency|200|57.63|47.06|18.34|30 / 0|
|PREPARED_BALANCED|TARGET_60_MIN|quality|100|18.09|12.70|29.80|30 / 0|
|PREPARED_BALANCED|TARGET_60_MIN|quality|200|58.29|47.17|19.08|30 / 0|
|PREPARED_BALANCED|TARGET_120_MIN|efficiency|100|18.06|11.66|35.42|30 / 0|
|PREPARED_BALANCED|TARGET_120_MIN|efficiency|200|60.39|44.65|26.07|30 / 0|
|PREPARED_BALANCED|TARGET_120_MIN|quality|100|18.09|11.66|35.55|30 / 0|
|PREPARED_BALANCED|TARGET_120_MIN|quality|200|60.57|45.62|24.69|30 / 0|
|PREPARED_BALANCED|TARGET_180_MIN|efficiency|100|18.06|11.44|36.64|30 / 0|
|PREPARED_BALANCED|TARGET_180_MIN|efficiency|200|60.39|44.65|26.07|30 / 0|
|PREPARED_BALANCED|TARGET_180_MIN|quality|100|18.09|11.56|36.11|30 / 0|
|PREPARED_BALANCED|TARGET_180_MIN|quality|200|60.57|45.42|25.02|30 / 0|
|EFFICIENCY_FIRST|AS_SOON_AS_ELIGIBLE|efficiency|100|未達／無樣本|未達／無樣本|未達／無樣本|0 / 30|
|EFFICIENCY_FIRST|AS_SOON_AS_ELIGIBLE|efficiency|200|未達／無樣本|未達／無樣本|未達／無樣本|0 / 30|
|EFFICIENCY_FIRST|AS_SOON_AS_ELIGIBLE|quality|100|未達／無樣本|未達／無樣本|未達／無樣本|0 / 30|
|EFFICIENCY_FIRST|AS_SOON_AS_ELIGIBLE|quality|200|未達／無樣本|未達／無樣本|未達／無樣本|0 / 30|
|EFFICIENCY_FIRST|TARGET_30_MIN|efficiency|100|16.66|10.63|36.20|30 / 0|
|EFFICIENCY_FIRST|TARGET_30_MIN|efficiency|200|未達／無樣本|28.63|未達／無樣本|7 / 23|
|EFFICIENCY_FIRST|TARGET_30_MIN|quality|100|未達／無樣本|未達／無樣本|未達／無樣本|0 / 30|
|EFFICIENCY_FIRST|TARGET_30_MIN|quality|200|未達／無樣本|未達／無樣本|未達／無樣本|0 / 30|
|EFFICIENCY_FIRST|TARGET_60_MIN|efficiency|100|16.66|10.65|36.10|30 / 0|
|EFFICIENCY_FIRST|TARGET_60_MIN|efficiency|200|43.59|32.05|26.47|30 / 0|
|EFFICIENCY_FIRST|TARGET_60_MIN|quality|100|未達／無樣本|未達／無樣本|未達／無樣本|0 / 30|
|EFFICIENCY_FIRST|TARGET_60_MIN|quality|200|未達／無樣本|未達／無樣本|未達／無樣本|0 / 30|
|EFFICIENCY_FIRST|TARGET_120_MIN|efficiency|100|16.66|10.98|34.08|30 / 0|
|EFFICIENCY_FIRST|TARGET_120_MIN|efficiency|200|43.59|31.42|27.92|30 / 0|
|EFFICIENCY_FIRST|TARGET_120_MIN|quality|100|未達／無樣本|未達／無樣本|未達／無樣本|0 / 30|
|EFFICIENCY_FIRST|TARGET_120_MIN|quality|200|未達／無樣本|未達／無樣本|未達／無樣本|0 / 30|
|EFFICIENCY_FIRST|TARGET_180_MIN|efficiency|100|16.66|9.67|41.94|30 / 0|
|EFFICIENCY_FIRST|TARGET_180_MIN|efficiency|200|43.59|29.56|32.18|30 / 0|
|EFFICIENCY_FIRST|TARGET_180_MIN|quality|100|未達／無樣本|未達／無樣本|未達／無樣本|0 / 30|
|EFFICIENCY_FIRST|TARGET_180_MIN|quality|200|未達／無樣本|未達／無樣本|未達／無樣本|0 / 30|
|QUALITY_FIRST|AS_SOON_AS_ELIGIBLE|efficiency|100|未達／無樣本|未達／無樣本|未達／無樣本|0 / 30|
|QUALITY_FIRST|AS_SOON_AS_ELIGIBLE|efficiency|200|未達／無樣本|未達／無樣本|未達／無樣本|0 / 30|
|QUALITY_FIRST|AS_SOON_AS_ELIGIBLE|quality|100|未達／無樣本|未達／無樣本|未達／無樣本|0 / 30|
|QUALITY_FIRST|AS_SOON_AS_ELIGIBLE|quality|200|未達／無樣本|未達／無樣本|未達／無樣本|0 / 30|
|QUALITY_FIRST|TARGET_30_MIN|efficiency|100|未達／無樣本|未達／無樣本|未達／無樣本|0 / 30|
|QUALITY_FIRST|TARGET_30_MIN|efficiency|200|未達／無樣本|未達／無樣本|未達／無樣本|0 / 30|
|QUALITY_FIRST|TARGET_30_MIN|quality|100|16.71|12.05|27.88|30 / 0|
|QUALITY_FIRST|TARGET_30_MIN|quality|200|未達／無樣本|未達／無樣本|未達／無樣本|0 / 30|
|QUALITY_FIRST|TARGET_60_MIN|efficiency|100|未達／無樣本|未達／無樣本|未達／無樣本|0 / 30|
|QUALITY_FIRST|TARGET_60_MIN|efficiency|200|未達／無樣本|未達／無樣本|未達／無樣本|0 / 30|
|QUALITY_FIRST|TARGET_60_MIN|quality|100|16.71|12.14|27.36|30 / 0|
|QUALITY_FIRST|TARGET_60_MIN|quality|200|58.58|46.47|20.68|30 / 0|
|QUALITY_FIRST|TARGET_120_MIN|efficiency|100|未達／無樣本|未達／無樣本|未達／無樣本|0 / 30|
|QUALITY_FIRST|TARGET_120_MIN|efficiency|200|未達／無樣本|未達／無樣本|未達／無樣本|0 / 30|
|QUALITY_FIRST|TARGET_120_MIN|quality|100|16.71|11.46|31.41|30 / 0|
|QUALITY_FIRST|TARGET_120_MIN|quality|200|62.07|45.67|26.42|30 / 0|
|QUALITY_FIRST|TARGET_180_MIN|efficiency|100|未達／無樣本|未達／無樣本|未達／無樣本|0 / 30|
|QUALITY_FIRST|TARGET_180_MIN|efficiency|200|未達／無樣本|未達／無樣本|未達／無樣本|0 / 30|
|QUALITY_FIRST|TARGET_180_MIN|quality|100|16.71|12.25|26.71|30 / 0|
|QUALITY_FIRST|TARGET_180_MIN|quality|200|62.07|46.55|25.00|30 / 0|
|ALL_ROUNDER|AS_SOON_AS_ELIGIBLE|efficiency|100|未達／無樣本|未達／無樣本|未達／無樣本|0 / 30|
|ALL_ROUNDER|AS_SOON_AS_ELIGIBLE|efficiency|200|未達／無樣本|未達／無樣本|未達／無樣本|0 / 30|
|ALL_ROUNDER|AS_SOON_AS_ELIGIBLE|quality|100|未達／無樣本|未達／無樣本|未達／無樣本|0 / 30|
|ALL_ROUNDER|AS_SOON_AS_ELIGIBLE|quality|200|未達／無樣本|未達／無樣本|未達／無樣本|0 / 30|
|ALL_ROUNDER|TARGET_30_MIN|efficiency|100|25.24|19.67|22.08|30 / 0|
|ALL_ROUNDER|TARGET_30_MIN|efficiency|200|未達／無樣本|未達／無樣本|未達／無樣本|0 / 30|
|ALL_ROUNDER|TARGET_30_MIN|quality|100|25.24|19.67|22.08|30 / 0|
|ALL_ROUNDER|TARGET_30_MIN|quality|200|未達／無樣本|未達／無樣本|未達／無樣本|0 / 30|
|ALL_ROUNDER|TARGET_60_MIN|efficiency|100|25.37|18.62|26.60|30 / 0|
|ALL_ROUNDER|TARGET_60_MIN|efficiency|200|未達／無樣本|49.54|未達／無樣本|30 / 0|
|ALL_ROUNDER|TARGET_60_MIN|quality|100|25.37|18.62|26.60|30 / 0|
|ALL_ROUNDER|TARGET_60_MIN|quality|200|未達／無樣本|49.65|未達／無樣本|30 / 0|
|ALL_ROUNDER|TARGET_120_MIN|efficiency|100|25.37|17.37|31.54|30 / 0|
|ALL_ROUNDER|TARGET_120_MIN|efficiency|200|69.71|47.63|31.67|30 / 0|
|ALL_ROUNDER|TARGET_120_MIN|quality|100|25.37|17.37|31.54|30 / 0|
|ALL_ROUNDER|TARGET_120_MIN|quality|200|70.04|47.69|31.90|30 / 0|
|ALL_ROUNDER|TARGET_180_MIN|efficiency|100|25.37|16.77|33.88|30 / 0|
|ALL_ROUNDER|TARGET_180_MIN|efficiency|200|69.71|46.94|32.67|30 / 0|
|ALL_ROUNDER|TARGET_180_MIN|quality|100|25.37|16.77|33.88|30 / 0|
|ALL_ROUNDER|TARGET_180_MIN|quality|200|70.04|46.98|32.93|30 / 0|

## Boss / Sleep 風險鏈

|Policy (NEVER)|平均拍馬屁 median|遭遇率 median|逃跑成功率 median|Severity median|加班秒 median|跨 Sleep 次數 median|Sleep Ratio median|零睡眠夜 median|
|---|---:|---:|---:|---:|---:|---:|---:|---:|
|PROMOTE_ASAP_BALANCED|0.00|0.11|0.13|1.00|30.74|2.00|0.99|0.00|
|PREPARED_BALANCED|0.00|0.10|0.10|1.00|23.79|1.00|1.00|0.00|
|EFFICIENCY_FIRST|0.00|0.10|0.12|1.00|20.77|0.00|1.00|0.00|
|QUALITY_FIRST|0.00|0.10|0.13|1.00|54.39|8.50|0.96|0.00|
|ALL_ROUNDER|207.37|0.97|0.68|4.42|327.24|3.00|1.00|0.00|

全部情境 Boss Severity 分布：{1: 33410, 2: 2367, 3: 7241, 4: 20395, 5: 13265}；完成 Boss 42541。逐次工作量、報酬、處理秒／歷時秒與跨窗狀態见 career-boss.csv。睡眠逐夜 ratio、modifier、分類见 career-sleep.csv。<1 的分類使用 1e-8 浮點容差，避免把 0.999999999999 當作缺眠。

## 曲線診斷與候選旋鈕（尚未修改）

A/B/C Run Cost：A 在全程生效，B 從 Lv100 後、C 從 Lv200 後疊加。依等待表與首輪 Lv250／300 未達比例評估拐點；高階等待上升不能全部歸因 Boss。對照 EFFICIENCY_FIRST 與 QUALITY_FIRST 的工作處理比例／返工比例可區分速度與品質瓶頸。

Permanent 1.10^Lv：實際效果反映在 Cycle1 Lv100／200 與 peak 追趕表。早重生可能因尚未滿足高等級推薦／取得足夠 Clarity 而反覆低階循環；需同看永久等級、Clarity 消費和 gross 回本。只觀測到若干永久等級，不能宣告整個指數曲線過強或過弱。

候選 A/B/C、SoftCap1/2：若 Lv200 後等待及 censored 明顯增加，應優先審查疊加成本與 Rank4 gross 成長是否匹配；本報告保留原值。候選 Clarity Reward／Permanent Cost Growth：ASAP 與較晚重生的回本和 recrawl 分布若不同，先查兩者的實際永久購買量，不直接提高倍率。候選 Promotion Cost：money-block 時間與 funded-overdue-block 分開，只有前者才能支持改升職費。候選 Rank Escape Resistance／Sleep Curve：ALL_ROUNDER 的跨窗與零睡眠分布可指出風險，但要排除工作量與品質返工原因。候選 Life conversion coefficient：ALL_ROUNDER 花費與睡眠恢復對照可檢查投入生活管理是否抵得上時間代價。

## 早餐與正式修正

Sleep Window 在 WorkStart 同 anchor 結算後，授予一次早餐資格；同時間 cutoff 不再把它標成 MISSED。沒有動 WorkStart／Deadline Index，也沒有強制中止已接工作。早餐開始消耗一次資格；原 FOOD interruption／suspended work 行為維持。Full/Half/Zero、強制結束、同 anchor Deadline 與不重複早餐皆有測試。

Boss Follow-up 只刪除 child 的 mandatoryOvertime／bossSeverity，原父工作未更動；立即／延遲發布的回歸確認 child 不被 activeMandatoryBoss 計入。Follow-up 機率、數量、報酬、Workload、Deadline、Root／Depth 全部維持。沒有改存檔的既有任務標記。

## 檔案

所有 CSV、career-results.json、career-sanity.json 位於同目錄。原始逐 Run 表保留在 part-0/1/2 的 JSONL；可以重建匯出。career-milestone-summary、career-upgrade-wait-summary、career-recrawl-summary、career-paired-payback 是額外方便審查的統計表。

無 Commit、Push 或自動 Tune。
## 十四項正式回答（實測數據）

1. **早餐同 Anchor Bug**：Sleep Window 結算後給一次早餐資格，避免同時 cutoff 誤判 MISSED；資格在早餐開始時消耗。WorkStart／Deadline 不變，沒有新增強制中斷工作。

2. **Regression**：323 核心＋24 瀏覽器，全數通過；build 通過。含 Boss Follow-up 立即／延遲生成與完整 State＋RNG 對照。

3. **樣本**：30 Scenario、900 Run；每組 30 次、每次完整 360 active 分鐘。

4. **首次 canPrestige**（NEVER 同初始 seed 基準；分鐘）：

|Policy|Median|P10|P90|未達|
|---|---:|---:|---:|---:|
|PROMOTE_ASAP_BALANCED|6.74|4.72|10.64|0/30|
|PREPARED_BALANCED|8.72|5.69|11.30|0/30|
|EFFICIENCY_FIRST|9.33|6.50|11.24|0/30|
|QUALITY_FIRST|8.46|7.51|10.74|0/30|
|ALL_ROUNDER|16.60|13.61|18.80|0/30|

5. **首次 Rank4**（NEVER，分鐘）：

|Policy|Median|P10|P90|未達|
|---|---:|---:|---:|---:|
|PROMOTE_ASAP_BALANCED|25.55|22.42|34.78|0/30|
|PREPARED_BALANCED|15.05|12.21|18.25|0/30|
|EFFICIENCY_FIRST|15.75|12.43|18.57|0/30|
|QUALITY_FIRST|14.66|13.45|17.48|0/30|
|ALL_ROUNDER|23.76|20.67|26.34|0/30|

6. **NEVER 到 Lv100／200／250／300**：

|Policy|能力|100|200|250|300|
|---|---|---:|---:|---:|---:|
|PROMOTE_ASAP_BALANCED|efficiency|29.42 (30/30)|73.25 (30/30)|未達／無完成樣本 (0/30)|未達／無完成樣本 (0/30)|
|PROMOTE_ASAP_BALANCED|quality|29.55 (30/30)|74.13 (30/30)|未達／無完成樣本 (0/30)|未達／無完成樣本 (0/30)|
|PREPARED_BALANCED|efficiency|18.06 (30/30)|60.39 (30/30)|未達／無完成樣本 (0/30)|未達／無完成樣本 (0/30)|
|PREPARED_BALANCED|quality|18.09 (30/30)|60.57 (30/30)|未達／無完成樣本 (0/30)|未達／無完成樣本 (0/30)|
|EFFICIENCY_FIRST|efficiency|16.66 (30/30)|43.59 (30/30)|354.63 (11/30)|未達／無完成樣本 (0/30)|
|EFFICIENCY_FIRST|quality|未達／無完成樣本 (0/30)|未達／無完成樣本 (0/30)|未達／無完成樣本 (0/30)|未達／無完成樣本 (0/30)|
|QUALITY_FIRST|efficiency|未達／無完成樣本 (0/30)|未達／無完成樣本 (0/30)|未達／無完成樣本 (0/30)|未達／無完成樣本 (0/30)|
|QUALITY_FIRST|quality|16.71 (30/30)|62.07 (30/30)|未達／無完成樣本 (0/30)|未達／無完成樣本 (0/30)|
|ALL_ROUNDER|efficiency|25.37 (30/30)|69.71 (30/30)|未達／無完成樣本 (0/30)|未達／無完成樣本 (0/30)|
|ALL_ROUNDER|quality|25.37 (30/30)|70.04 (30/30)|未達／無完成樣本 (0/30)|未達／無完成樣本 (0/30)|

策略限制要另看：EFFICIENCY_FIRST 在最高職級主要投入效率，QUALITY_FIRST 主要投入品質；另一能力未到高等級是策略選擇。Balanced 沒買的生活管理／摸魚／拍馬屁也不能當成成本曲線的牆。

7. **Soft Wall**：下表是已測得的 N→N+1 等待中位數；Lv250／300 的 censored 是 360 分鐘視窗的實際限制，不是永久不可達。

|Policy|能力|100→101|200→201|225→226|250→251|
|---|---|---:|---:|---:|---:|
|PROMOTE_ASAP_BALANCED|efficiency|0.00|1.15|7.59|未到 N|
|PROMOTE_ASAP_BALANCED|quality|0.00|1.84|7.81|未到 N|
|PREPARED_BALANCED|efficiency|0.00|1.78|7.15|未到 N|
|PREPARED_BALANCED|quality|0.05|1.95|7.84|未到 N|
|EFFICIENCY_FIRST|efficiency|0.00|0.90|4.95|未達／無完成樣本|
|EFFICIENCY_FIRST|quality|未到 N|未到 N|未到 N|未到 N|
|QUALITY_FIRST|efficiency|未到 N|未到 N|未到 N|未到 N|
|QUALITY_FIRST|quality|0.00|1.07|7.47|未到 N|
|ALL_ROUNDER|efficiency|0.03|1.23|5.97|未到 N|
|ALL_ROUNDER|quality|0.04|1.27|6.24|未到 N|

8. **30／60／120／180 比較**（PREPARED_BALANCED 的 360 分鐘總 gross 中位）：

|Timing|Gross|相對 NEVER %|
|---|---:|---:|
|NEVER_PRESTIGE|10,230,884.50|0.00|
|AS_SOON_AS_ELIGIBLE|294,607.00|-97.12|
|TARGET_30_MIN|9,605,253.00|-6.12|
|TARGET_60_MIN|10,891,120.00|6.45|
|TARGET_120_MIN|11,229,876.50|9.76|
|TARGET_180_MIN|11,076,462.00|8.26|

這只回答 gross；net 與各種子配對首次回本另見 timing-summary／paired-payback，不用 gross 排序冒充全面最優。

9. **第二輪 Lv100／200 追趕**（PREPARED_BALANCED；同 Seed 兩輪均達成的配對，縮短率為逐 Seed 中位）：

|Timing|能力|Lv|首輪分|第二輪分|縮短 %|第二輪完成 / censored|
|---|---|---:|---:|---:|---:|---:|
|AS_SOON_AS_ELIGIBLE|efficiency|100|未達／無完成樣本|未達／無完成樣本|未達／無完成樣本|0 / 30|
|AS_SOON_AS_ELIGIBLE|efficiency|200|未達／無完成樣本|未達／無完成樣本|未達／無完成樣本|0 / 30|
|AS_SOON_AS_ELIGIBLE|quality|100|未達／無完成樣本|未達／無完成樣本|未達／無完成樣本|0 / 30|
|AS_SOON_AS_ELIGIBLE|quality|200|未達／無完成樣本|未達／無完成樣本|未達／無完成樣本|0 / 30|
|TARGET_30_MIN|efficiency|100|18.06|12.33|30.79|30 / 0|
|TARGET_30_MIN|efficiency|200|未達／無完成樣本|未達／無完成樣本|未達／無完成樣本|0 / 30|
|TARGET_30_MIN|quality|100|18.09|12.33|30.13|30 / 0|
|TARGET_30_MIN|quality|200|未達／無完成樣本|未達／無完成樣本|未達／無完成樣本|0 / 30|
|TARGET_60_MIN|efficiency|100|18.06|12.67|31.52|30 / 0|
|TARGET_60_MIN|efficiency|200|57.63|47.00|19.21|14 / 16|
|TARGET_60_MIN|quality|100|18.09|12.70|31.02|30 / 0|
|TARGET_60_MIN|quality|200|58.29|48.51|18.46|13 / 17|
|TARGET_120_MIN|efficiency|100|18.06|11.66|33.98|30 / 0|
|TARGET_120_MIN|efficiency|200|60.39|44.65|24.29|30 / 0|
|TARGET_120_MIN|quality|100|18.09|11.66|33.02|30 / 0|
|TARGET_120_MIN|quality|200|60.57|45.62|24.58|30 / 0|
|TARGET_180_MIN|efficiency|100|18.06|11.44|35.01|30 / 0|
|TARGET_180_MIN|efficiency|200|60.39|44.65|26.42|30 / 0|
|TARGET_180_MIN|quality|100|18.09|11.56|34.24|30 / 0|
|TARGET_180_MIN|quality|200|60.57|45.42|26.39|30 / 0|

10. **A/B/C 診斷**：100 與 200 後疊加成本的效應，可由上方實際等待拐點與 250／300 達成率辨識；沒有把未完成樣本填成 360 分鐘假事件。有限暴露量支持「高階增長明顯變慢」，不支持宣稱永遠無法突破。

11. **Permanent 1.10^Lv**：PREPARED 的 ASAP 永久工作效率中位 Lv5（倍率 1.61051），30／60 分鐘中位 Lv4（1.4641），120／180 分鐘中位 Lv3（1.331）。ASAP 的總 gross 遠低於 NEVER，說明較多永久升級不等於較快回本；現階段要一起審查重生門檻、Clarity 來源與高職級停留時間，不能單独歸因 1.10 過弱。

12. **Boss／Sleep 風險鏈**：

|NEVER Policy|平均拍馬屁|遭遇率|逃跑成功率|Severity|加班總秒|跨睡窗次數|平均 Sleep Ratio|
|---|---:|---:|---:|---:|---:|---:|---:|
|PROMOTE_ASAP_BALANCED|0.00|0.11|0.13|1.00|30.74|2.00|0.99|
|PREPARED_BALANCED|0.00|0.10|0.10|1.00|23.79|1.00|1.00|
|EFFICIENCY_FIRST|0.00|0.10|0.12|1.00|20.77|0.00|1.00|
|QUALITY_FIRST|0.00|0.10|0.13|1.00|54.39|8.50|0.96|
|ALL_ROUNDER|207.37|0.97|0.68|4.42|327.24|3.00|1.00|

ALL_ROUNDER 的遭遇、Severity、加班量確實提高，但睡眠平均仍接近完整；所有 NEVER 樣本沒有零睡眠夜。現有投入效率／摸魚／生活管理同時抵消風險，因此 **沒有出現強烈的睡眠惡性循環證據**，不能宣稱預期鏈條已完整成立。QUALITY_FIRST 的睡眠損失反而較大，顯示速度瓶頸必須一併檢查。

13. **下輪候選旋鈕**：優先討論 Lv200 後 Run Cost C／SoftCap2（高階等待與未達樣本）、重生 eligibility／Clarity reward／Permanent cost growth（ASAP 低階反覆循環與收入落後）、Flattery 收入係數與 Rank escape resistance／Life conversion（ALL_ROUNDER 高收入但睡眠風險未形成）。这些是有數據依據的候選，尚未修改任何數值。

14. **位置**：本報告、所有 CSV、career-results.json、career-sanity.json 同在 reports/career-progression。壓縮包只包含匯出結果，不重複收錄大型原始 JSONL；原始資料仍保留在 part-0/1/2。

額外觀測复核：相同 900 個邏輯 Run 共進行兩次同種子重播（合計 1800 次指標复核），補齊 Boss 完成後不足以生成娛樂的跳過事件（原先只計跨睡窗）。所有主要收入、成本、工作量、重生數、最終能力與永久等級一致；這 1800 次是指標复核，不算額外獨立 Seed。匯出 runs/economy/summary 的娛樂跳過值已以 career-entertainment-audit.csv 校正；升職卡關區間也在每個邊界更新，包含餐費支出；promotions/promotion-blocks 已以最終复核更新。原始 JSONL 仍保留首次觀測值作追溯。
