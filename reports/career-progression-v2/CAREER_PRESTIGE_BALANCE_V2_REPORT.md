# V2 第一輪正式 Balance Adjustment + Verification

只改 minimumPrestigeActiveMinutes=30、C=1.005。其他 Config 完整 deep-equal（見 config-verification.json）；原報告保持。900 Career Run＋300 Isolation Run，全數完整暴露時間，沒有減少樣本或去重。

## 1–3：實作與回歸

runStatistics.activeSeconds 是獨立的每輪實際在線時間。GameEngine 把 performance.now 的未乘速度秒數传入正式 Loop；每個內部區間按 active/world 比例累積。世界速度不改這個時鐘；Offline／Debug 跳時間未提供 active credit。Prestige 使用 active≥30 AND 原 eligibility，正常操作仍需職級／收入。明確 Debug 強制重生仍為測試功能。

Prestige 重置 timer=0；Save／Reload 保存；舊存檔沒有可靠的 active 記錄，欄位補0，保留全部其他進度，不拿世界時間冒充。Gate 是 Loop 邊界，不等下一筆收入才檢查。

328 核心、25 瀏覽器與 build 通過。29:59／30:00、其他條件不足、重生歸零、離線、存檔、10x 在線門檻均有測試。成本六個預期值全部吻合，差異0。

## 4：首次 canPrestige（NEVER 基準，各30 Seed）

|Policy|Median|P10|P90|未達|
|---|---:|---:|---:|---:|
|PROMOTE_ASAP_BALANCED|30.00|30.00|30.00|0|
|PREPARED_BALANCED|30.00|30.00|30.00|0|
|EFFICIENCY_FIRST|30.00|30.00|30.00|0|
|QUALITY_FIRST|30.00|30.00|30.00|0|
|ALL_ROUNDER|30.00|30.00|30.00|0|

## 5–7：NEVER 里程碑與真實 N→N+1 等待

所有分鐘均為 actual active minutes。未投資的能力不可當作成本牆。分位數只對 observed 計算，未達保留 censored；N→N+1 是實際兩次購買的間隔，包含同時間批次購買的0。

|Policy|能力|Lv|舊到達 median|新到達 median|新 observed/censored|舊等待 median|新等待 median|
|---|---|---:|---:|---:|---:|---:|---:|
|PROMOTE_ASAP_BALANCED|efficiency|100|29.42|29.42|30/0|0.00|0.00|
|PROMOTE_ASAP_BALANCED|efficiency|150|35.62|35.62|30/0|0.01|0.01|
|PROMOTE_ASAP_BALANCED|efficiency|175|45.65|45.65|30/0|0.90|0.90|
|PROMOTE_ASAP_BALANCED|efficiency|200|73.25|73.25|30/0|1.15|1.15|
|PROMOTE_ASAP_BALANCED|efficiency|225|165.56|143.59|30/0|7.59|4.77|
|PROMOTE_ASAP_BALANCED|efficiency|250|未達|340.66|29/1|未達|12.98|
|PROMOTE_ASAP_BALANCED|efficiency|275|未達|未達|0/30|未達|未達|
|PROMOTE_ASAP_BALANCED|efficiency|300|未達|未達|0/30|未達|未達|
|PROMOTE_ASAP_BALANCED|quality|100|29.55|29.55|30/0|0.00|0.00|
|PROMOTE_ASAP_BALANCED|quality|150|35.64|35.64|30/0|0.02|0.02|
|PROMOTE_ASAP_BALANCED|quality|175|46.45|46.45|30/0|0.68|0.68|
|PROMOTE_ASAP_BALANCED|quality|200|74.13|74.13|30/0|1.84|1.84|
|PROMOTE_ASAP_BALANCED|quality|225|170.00|145.98|30/0|7.81|4.93|
|PROMOTE_ASAP_BALANCED|quality|250|未達|347.29|25/5|未達|12.99|
|PROMOTE_ASAP_BALANCED|quality|275|未達|未達|0/30|未達|未達|
|PROMOTE_ASAP_BALANCED|quality|300|未達|未達|0/30|未達|未達|
|PREPARED_BALANCED|efficiency|100|18.06|18.06|30/0|0.00|0.00|
|PREPARED_BALANCED|efficiency|150|24.64|24.64|30/0|0.12|0.12|
|PREPARED_BALANCED|efficiency|175|34.68|34.68|30/0|0.67|0.67|
|PREPARED_BALANCED|efficiency|200|60.39|60.39|30/0|1.78|1.78|
|PREPARED_BALANCED|efficiency|225|152.55|131.42|30/0|7.15|4.32|
|PREPARED_BALANCED|efficiency|250|未達|330.63|30/0|未達|13.08|
|PREPARED_BALANCED|efficiency|275|未達|未達|0/30|未達|未達|
|PREPARED_BALANCED|efficiency|300|未達|未達|0/30|未達|未達|
|PREPARED_BALANCED|quality|100|18.09|18.09|30/0|0.05|0.05|
|PREPARED_BALANCED|quality|150|25.01|25.01|30/0|0.12|0.12|
|PREPARED_BALANCED|quality|175|35.45|35.45|30/0|0.73|0.73|
|PREPARED_BALANCED|quality|200|60.57|60.57|30/0|1.95|1.95|
|PREPARED_BALANCED|quality|225|156.55|133.63|30/0|7.84|4.63|
|PREPARED_BALANCED|quality|250|未達|337.46|30/0|未達|12.98|
|PREPARED_BALANCED|quality|275|未達|未達|0/30|未達|未達|
|PREPARED_BALANCED|quality|300|未達|未達|0/30|未達|未達|
|EFFICIENCY_FIRST|efficiency|100|16.66|16.66|30/0|0.00|0.00|
|EFFICIENCY_FIRST|efficiency|150|21.53|21.53|30/0|0.00|0.00|
|EFFICIENCY_FIRST|efficiency|175|28.28|28.28|30/0|0.04|0.04|
|EFFICIENCY_FIRST|efficiency|200|43.59|43.59|30/0|0.90|0.90|
|EFFICIENCY_FIRST|efficiency|225|97.64|82.96|30/0|4.95|2.97|
|EFFICIENCY_FIRST|efficiency|250|354.63|203.12|30/0|未達|8.35|
|EFFICIENCY_FIRST|efficiency|275|未達|未達|0/30|未達|未達|
|EFFICIENCY_FIRST|efficiency|300|未達|未達|0/30|未達|未達|
|EFFICIENCY_FIRST|quality|100|未達|未達|0/30|未達|未達|
|EFFICIENCY_FIRST|quality|150|未達|未達|0/30|未達|未達|
|EFFICIENCY_FIRST|quality|175|未達|未達|0/30|未達|未達|
|EFFICIENCY_FIRST|quality|200|未達|未達|0/30|未達|未達|
|EFFICIENCY_FIRST|quality|225|未達|未達|0/30|未達|未達|
|EFFICIENCY_FIRST|quality|250|未達|未達|0/30|未達|未達|
|EFFICIENCY_FIRST|quality|275|未達|未達|0/30|未達|未達|
|EFFICIENCY_FIRST|quality|300|未達|未達|0/30|未達|未達|
|QUALITY_FIRST|efficiency|100|未達|未達|0/30|未達|未達|
|QUALITY_FIRST|efficiency|150|未達|未達|0/30|未達|未達|
|QUALITY_FIRST|efficiency|175|未達|未達|0/30|未達|未達|
|QUALITY_FIRST|efficiency|200|未達|未達|0/30|未達|未達|
|QUALITY_FIRST|efficiency|225|未達|未達|0/30|未達|未達|
|QUALITY_FIRST|efficiency|250|未達|未達|0/30|未達|未達|
|QUALITY_FIRST|efficiency|275|未達|未達|0/30|未達|未達|
|QUALITY_FIRST|efficiency|300|未達|未達|0/30|未達|未達|
|QUALITY_FIRST|quality|100|16.71|16.71|30/0|0.00|0.00|
|QUALITY_FIRST|quality|150|25.07|25.07|30/0|0.19|0.19|
|QUALITY_FIRST|quality|175|33.70|33.70|30/0|0.81|0.81|
|QUALITY_FIRST|quality|200|62.07|62.07|30/0|1.07|1.07|
|QUALITY_FIRST|quality|225|167.02|141.05|30/0|7.47|4.56|
|QUALITY_FIRST|quality|250|未達|未達|0/30|未達|未達|
|QUALITY_FIRST|quality|275|未達|未達|0/30|未達|未達|
|QUALITY_FIRST|quality|300|未達|未達|0/30|未達|未達|
|ALL_ROUNDER|efficiency|100|25.37|25.37|30/0|0.03|0.03|
|ALL_ROUNDER|efficiency|150|32.70|32.70|30/0|0.19|0.19|
|ALL_ROUNDER|efficiency|175|44.05|44.05|30/0|0.45|0.45|
|ALL_ROUNDER|efficiency|200|69.71|69.71|30/0|1.23|1.23|
|ALL_ROUNDER|efficiency|225|149.96|130.78|30/0|5.97|3.22|
|ALL_ROUNDER|efficiency|250|未達|291.54|30/0|未達|11.84|
|ALL_ROUNDER|efficiency|275|未達|未達|0/30|未達|未達|
|ALL_ROUNDER|efficiency|300|未達|未達|0/30|未達|未達|
|ALL_ROUNDER|quality|100|25.37|25.37|30/0|0.04|0.04|
|ALL_ROUNDER|quality|150|32.72|32.72|30/0|0.27|0.27|
|ALL_ROUNDER|quality|175|44.39|44.39|30/0|0.53|0.53|
|ALL_ROUNDER|quality|200|70.04|70.04|30/0|1.27|1.27|
|ALL_ROUNDER|quality|225|151.07|131.56|30/0|6.24|3.88|
|ALL_ROUNDER|quality|250|未達|293.56|30/0|未達|11.26|
|ALL_ROUNDER|quality|275|未達|未達|0/30|未達|未達|
|ALL_ROUNDER|quality|300|未達|未達|0/30|未達|未達|

Lv200 前 helper 價格與 NEVER 每 Seed 的對照里程碑完全不變，不只平均近似；兩個價格軟節點仍100／200。新 practical wall 依225／250／275／300 等待和 censor 分布判斷，不將固定5分鐘當作牆。

## 8：Prestige Timing

|Policy|Timing|Gross median|Net after upgrade|Net after career|Prestige次數|Clarity|Rank4分鐘 / 未達|
|---|---|---:|---:|---:|---:|---:|---:|
|PROMOTE_ASAP_BALANCED|NEVER_PRESTIGE|9,968,144.50|150,254.00|137,334.00|0.00|0.00|25.55 / 0|
|PROMOTE_ASAP_BALANCED|AS_SOON_AS_ELIGIBLE|5,392,223.50|202,936.50|49,457.00|12.00|720.50|24.03 / 7|
|PROMOTE_ASAP_BALANCED|TARGET_30_MIN|5,392,223.50|202,936.50|49,457.00|12.00|720.50|24.03 / 7|
|PROMOTE_ASAP_BALANCED|TARGET_60_MIN|8,762,275.50|167,595.50|90,075.50|6.00|426.00|25.55 / 0|
|PROMOTE_ASAP_BALANCED|TARGET_120_MIN|10,105,070.50|146,726.50|107,966.50|3.00|241.50|25.55 / 0|
|PROMOTE_ASAP_BALANCED|TARGET_180_MIN|10,311,057.00|97,892.00|72,052.00|2.00|189.50|25.55 / 0|
|PREPARED_BALANCED|NEVER_PRESTIGE|10,343,463.00|132,638.50|119,718.50|0.00|0.00|15.05 / 0|
|PREPARED_BALANCED|AS_SOON_AS_ELIGIBLE|9,605,253.00|245,258.50|90,218.50|12.00|808.50|15.05 / 0|
|PREPARED_BALANCED|TARGET_30_MIN|9,605,253.00|245,258.50|90,218.50|12.00|808.50|15.05 / 0|
|PREPARED_BALANCED|TARGET_60_MIN|10,906,143.50|180,757.00|103,237.00|6.00|443.50|15.05 / 0|
|PREPARED_BALANCED|TARGET_120_MIN|11,315,306.50|169,611.50|130,851.50|3.00|266.00|15.05 / 0|
|PREPARED_BALANCED|TARGET_180_MIN|11,094,572.50|128,594.00|102,754.00|2.00|190.50|15.05 / 0|
|EFFICIENCY_FIRST|NEVER_PRESTIGE|8,386,029.50|222,371.50|209,451.50|0.00|0.00|15.75 / 0|
|EFFICIENCY_FIRST|AS_SOON_AS_ELIGIBLE|8,501,825.50|322,526.00|167,486.00|12.00|823.50|15.75 / 0|
|EFFICIENCY_FIRST|TARGET_30_MIN|8,501,825.50|322,526.00|167,486.00|12.00|823.50|15.75 / 0|
|EFFICIENCY_FIRST|TARGET_60_MIN|9,127,063.00|273,720.50|196,200.50|6.00|459.00|15.75 / 0|
|EFFICIENCY_FIRST|TARGET_120_MIN|9,375,206.00|232,031.50|193,271.50|3.00|283.50|15.75 / 0|
|EFFICIENCY_FIRST|TARGET_180_MIN|9,170,146.50|229,000.50|203,160.50|2.00|212.50|15.75 / 0|
|QUALITY_FIRST|NEVER_PRESTIGE|4,903,053.50|115,095.00|102,175.00|0.00|0.00|14.66 / 0|
|QUALITY_FIRST|AS_SOON_AS_ELIGIBLE|5,379,874.00|257,141.50|102,101.50|12.00|721.50|14.66 / 0|
|QUALITY_FIRST|TARGET_30_MIN|5,379,874.00|257,141.50|102,101.50|12.00|721.50|14.66 / 0|
|QUALITY_FIRST|TARGET_60_MIN|5,878,594.00|183,510.50|105,990.50|6.00|405.00|14.66 / 0|
|QUALITY_FIRST|TARGET_120_MIN|5,740,239.00|170,873.50|132,113.50|3.00|221.50|14.66 / 0|
|QUALITY_FIRST|TARGET_180_MIN|5,499,300.50|135,563.00|109,723.00|2.00|155.50|14.66 / 0|
|ALL_ROUNDER|NEVER_PRESTIGE|36,100,883.50|203,982.00|191,062.00|0.00|0.00|23.76 / 0|
|ALL_ROUNDER|AS_SOON_AS_ELIGIBLE|23,239,434.50|240,038.00|84,998.00|12.00|1,367.00|23.72 / 1|
|ALL_ROUNDER|TARGET_30_MIN|23,239,434.50|240,038.00|84,998.00|12.00|1,367.00|23.72 / 1|
|ALL_ROUNDER|TARGET_60_MIN|34,894,818.00|212,117.50|134,597.50|6.00|878.00|23.76 / 0|
|ALL_ROUNDER|TARGET_120_MIN|39,825,970.50|197,851.00|159,091.00|3.00|519.00|23.76 / 0|
|ALL_ROUNDER|TARGET_180_MIN|39,981,735.00|180,503.50|154,663.50|2.00|369.00|23.76 / 0|

永久等級完整分布、各時機 Lv100／200／250 見 timing-summary／milestone-summary；gross／net 分列，不把未花掉的資金或重生後注入的起始金錢當收入。ASAP 與 TARGET30 仍各保留30語意結果，沒有降低 logical sample 數。

## 9–10：TARGET120 同 Seed Cycle0→Cycle1 配對追趕

|Policy|能力|Lv|首輪 median|第二輪 median|paired observed/censored|縮短 % median|P10|P90|
|---|---|---:|---:|---:|---:|---:|---:|---:|
|PROMOTE_ASAP_BALANCED|efficiency|100|29.42|23.31|30/0|20.91|-14.75|46.13|
|PROMOTE_ASAP_BALANCED|efficiency|200|73.25|56.57|30/0|22.84|11.84|34.92|
|PROMOTE_ASAP_BALANCED|efficiency|250|未達|未達|0/30|未達|未達|未達|
|PROMOTE_ASAP_BALANCED|quality|100|29.55|23.31|30/0|21.27|-14.83|46.15|
|PROMOTE_ASAP_BALANCED|quality|200|74.13|57.43|30/0|22.44|12.25|33.56|
|PROMOTE_ASAP_BALANCED|quality|250|未達|未達|0/30|未達|未達|未達|
|PREPARED_BALANCED|efficiency|100|18.06|12.44|30/0|27.94|16.54|43.05|
|PREPARED_BALANCED|efficiency|200|60.39|45.59|30/0|23.88|17.77|30.76|
|PREPARED_BALANCED|efficiency|250|未達|未達|0/30|未達|未達|未達|
|PREPARED_BALANCED|quality|100|18.09|12.44|30/0|27.23|16.54|43.06|
|PREPARED_BALANCED|quality|200|60.57|46.56|30/0|23.48|19.05|32.23|
|PREPARED_BALANCED|quality|250|未達|未達|0/30|未達|未達|未達|
|EFFICIENCY_FIRST|efficiency|100|16.66|11.25|30/0|34.13|16.07|44.97|
|EFFICIENCY_FIRST|efficiency|200|43.59|30.72|30/0|27.17|12.81|37.34|
|EFFICIENCY_FIRST|efficiency|250|未達|未達|0/30|未達|未達|未達|
|EFFICIENCY_FIRST|quality|100|未達|未達|0/30|未達|未達|未達|
|EFFICIENCY_FIRST|quality|200|未達|未達|0/30|未達|未達|未達|
|EFFICIENCY_FIRST|quality|250|未達|未達|0/30|未達|未達|未達|
|QUALITY_FIRST|efficiency|100|未達|未達|0/30|未達|未達|未達|
|QUALITY_FIRST|efficiency|200|未達|未達|0/30|未達|未達|未達|
|QUALITY_FIRST|efficiency|250|未達|未達|0/30|未達|未達|未達|
|QUALITY_FIRST|quality|100|16.71|11.62|30/0|29.83|15.61|48.98|
|QUALITY_FIRST|quality|200|62.07|45.93|30/0|25.74|17.55|32.11|
|QUALITY_FIRST|quality|250|未達|未達|0/30|未達|未達|未達|
|ALL_ROUNDER|efficiency|100|25.37|17.55|30/0|29.14|22.18|43.55|
|ALL_ROUNDER|efficiency|200|69.71|48.58|30/0|32.11|24.20|36.29|
|ALL_ROUNDER|efficiency|250|未達|未達|0/30|未達|未達|未達|
|ALL_ROUNDER|quality|100|25.37|17.55|30/0|29.10|22.18|43.45|
|ALL_ROUNDER|quality|200|70.04|48.65|30/0|31.96|23.90|36.39|
|ALL_ROUNDER|quality|250|未達|未達|0/30|未達|未達|未達|

配對只計兩輪均達成者，避免不同 survivor cohort 的中位數誤判。永久倍率仍1.10^Lv、費用成長2.65、Clarity公式不變；用配對縮短與 censored 判斷「舊區域重跑」，不因少數未達直接提高倍率。

## 11–12：Flattery Isolation

見 FLATTERY_ISOLATION_REPORT.md；沒有買能力、升職、產品或Prestige。Rank4固定，Age22初始化後沿用正式老化，在120世界日仍屬相同22–29歲工作量倍率，沒有改Age公式。固定五能力、每組30同Seed。

## 方法與限制

一天60世界秒；本次1x模擬的 active 与 world秒相同，但 eligibility實際讀獨立timer。daily為固定累積60秒暴露窗口；每輪日曆重置而累積active不重置。Seed42+i×7919，共同初始 RNG，不假設不同策略後的事件逐一相同。

WORK生成只計正式發布；尚未發布／未解鎖不算。重生取消的剩餘量列discarded；收入與工作量守恆每邊界檢查。Sleep只統計已結算窗口，重生中斷的窗口不填成零睡眠。現在普通餐免費；付費餐統計边界有隔離Fixture，未改正式餐價。

新等待輸出加入175；舊175从原始 purchase 的實際間隔重建，没有推估。Lv≤200行為比對使用NEVER，排除新增正式Gate帶來的刻意重生策略改變。所有關於永久／Flattery 的判斷僅為診斷，沒有額外Tune。

## 正式診斷


所有到達／等待時間為 active 分鐘；分位數只使用達成樣本，未達另列。

|能力|等級|到達 median|observed/censored|N→N+1 median|
|---|---:|---:|---:|---:|
|efficiency|100|18.06|30/0|0.00|
|efficiency|200|60.39|30/0|1.78|
|efficiency|225|131.42|30/0|4.32|
|efficiency|250|330.63|30/0|13.08|
|efficiency|275|未達|0/30|未達|
|efficiency|300|未達|0/30|未達|
|quality|100|18.09|30/0|0.05|
|quality|200|60.57|30/0|1.95|
|quality|225|133.63|30/0|4.63|
|quality|250|337.46|30/0|12.98|
|quality|275|未達|0/30|未達|
|quality|300|未達|0/30|未達|

Practical Soft Wall：移至約250附近，尚未延至300。Prepared兩能力250皆30/30達成，但約331／337分鐘、單級等待約13分鐘；275／300皆0/30。225等待由7.15／7.84降至4.32／4.63分鐘，下降約40%／41%。200以前同Seed到達與等待完全不變。不是硬上限，也不把未投資能力誤判為瓶頸。

Prestige Timing：PREPARED_BALANCED 的 120 分鐘在 Gross、Net after career spend 都優於 30／60／180，符合競爭力目標。跨策略沒有單一最佳：QUALITY_FIRST 的 Gross 最佳為60，ALL_ROUNDER與PROMOTE_ASAP_BALANCED為180，EFFICIENCY_FIRST為120。不同目標（未花現金／累積收入／永久投資）須分開看。

|Timing|Prepared Gross median|Net after upgrades|Net after career spend|
|---|---:|---:|---:|
|NEVER_PRESTIGE|10,343,463.00|132,638.50|119,718.50|
|AS_SOON_AS_ELIGIBLE|9,605,253.00|245,258.50|90,218.50|
|TARGET_30_MIN|9,605,253.00|245,258.50|90,218.50|
|TARGET_60_MIN|10,906,143.50|180,757.00|103,237.00|
|TARGET_120_MIN|11,315,306.50|169,611.50|130,851.50|
|TARGET_180_MIN|11,094,572.50|128,594.00|102,754.00|

TARGET120 配對追趕（Prepared）：

|能力|等級|Cycle0|Cycle1|paired observed/censored|縮短 median %|
|---|---:|---:|---:|---:|---:|
|efficiency|100|18.06|12.44|30/0|27.94|
|efficiency|200|60.39|45.59|30/0|23.88|
|efficiency|250|未達|未達|0/30|未達|
|quality|100|18.09|12.44|30/0|27.23|
|quality|200|60.57|46.56|30/0|23.48|
|quality|250|未達|未達|0/30|未達|

Permanent 診斷：可接受。已有同 Seed 的重跑縮短，且120分鐘時機具競爭力；不能只因高等級 censored 就判為太弱，也沒有證據要求本輪提高或降低1.10。此結論限於六小時、兩輪追趕，非無限次Prestige證明。

Flattery：UNPROTECTED 的0→200收入約4.78倍，超過純收入3倍，主要來自注意度與Severity提高Boss收入，不是本隔離實驗中的自動買升級雪球（所有能力固定）。遭遇率50級已到100%，Boss工作量與加班繼續增加，但E/Q200仍使睡眠損失很小。

COUNTERED 的0→200收入約3.06倍，接近純收入3倍；Life＋Slacking把200級加班中位數由310.65秒降到119.57秒（約61.5%），平均Sleep由99.63%升到99.84%。

**FLATTERY_DOMINANCE_RISK：YES（本隔離條件下）。** COUNTERED Lv200收入大增，120分鐘內加班占比僅1.66%，Sleep近完整，Overdue中位數0。加班仍有增加，因此並非零成本；但實際睡眠／期限代價不足以形成有效制衡。保留+1%及所有正式規則，不自動Tune。
