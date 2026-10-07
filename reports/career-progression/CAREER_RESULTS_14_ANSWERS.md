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
