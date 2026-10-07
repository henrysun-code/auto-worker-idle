# 本輪數據判讀

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
