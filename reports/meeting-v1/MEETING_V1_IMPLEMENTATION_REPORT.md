# Meeting V1 Implementation + Isolation Report

只新增 Meeting 相關 Config／Type／State／UI／Logic。既有 Balance 全部 deep-equal；Boss 基礎工作量仍50。沒有 Auto Tune、Commit 或 Push。之前兩輪報告保留。

## 接入與規則

MEETING 直接加入正式 Target union、targetManager 與唯一 SimulationLoop；沒有 Workload、requirement、Deadline、Project、Follow-up 欄位。不进入Todo、completedWork。普通會議用既有 suspendedTargets 保存原工作與phase；Problem依法中斷也使用同一堆疊。完成後只移除當前Meeting，既有恢復流程接續原進度。

Duration = referenceMeetingDurationSeconds × dayDuration / referenceDayDuration。目前3×60/60=3世界秒；180秒日長時9秒。remainingDuration 每世界秒減1，全部能力、年齡、職級、永久與Severity均不乘進Duration。

WorkStart（目前8 reference seconds）每工作日只Roll一次普通會議。成功後在[8,20)與[28,40)按區間長度均勻選start time，全部anchor讀正式Config，排除固定Lunch Window。FOOD／LUNCH／PROBLEM中不主動覆蓋，等待下一個合法工作時間；若已到下班則取消當日未開始的普通會議。新工作日不補滾前一天事件。普通機率R0–R4=2%／4%／7%／12%／18%。

Escape Fail後獨立Outcome Roll：25%只建立pending Boss Meeting，75%走原Mandatory Boss Work。兩者互斥，現有Mandatory或Boss Meeting（含pending／suspended）阻止第二個Boss outcome。Dinner完成後才啟動pending Meeting，再依原晚間規則娛樂／睡眠。Severity保留Encounter測量，但不乘Meeting Duration或Compensation。

Boss Meeting跨Sleep／WorkStart仍保留剩餘時間。Sleep Window依原錨點結算實際睡眠，不等會議；持續會議沿用既有Mandatory處理分支，完成後再恢復早餐／日間流程。Deadline Workday Index照常切換。

獨立固定補貼R0–R4=5／10／20／40／80（PROVISIONAL），建立時快照職級。完成一次用通用金錢入帳，但不呼叫Work Reward／Follow-up／Project completion。Meeting compensation單列，不混入Work或Parent income。

Save保留current／suspended Meeting、scheduled normal、pending boss、剩餘秒數、來源與建立職級等metadata。舊Save補空Meeting State，記下目前工作日避免讀檔中途補Roll；其餘資料保留。新增Debug入口Force Normal Meeting／Force Boss Meeting；不額外抽Meeting RNG。

## 邊界補強與 Regression

新增RNG後暴露既有晚午餐問題：午餐超過午休窗口，LUNCH→AFTERNOON轉換原本可能空等下一個Tick。只補同時間點ensureTarget，沒有改餐點、Lunch priority／duration、anchor或Balance。正常ON 180／0.1／0.2／0.5／1秒批次結果一致。OFF對零機率基準使用同一項零時間轉換補強。

Debug入口另外避免呼叫可能順便處理未Roll WorkStart的ensureTarget；Force Normal只在工作階段、且沒有固定生活Target或Mandatory Work時直接使用既有堆疊。Force Boss直接安排Dinner／pending Meeting，不額外消耗正式RNG。最後同540情境完整重播，所有每Seed指標與配對差值exact equal；這是驗證重播，不增加獨立樣本數。

348核心、26瀏覽器、Build全部通過。覆蓋A–P、能力0／500不縮短、3→9 scaling、單次支付、固定生活Target優先、Problem多層中斷、Dinner first、跨Sleep／WorkStart、Save／Reload、Deadline不變、不進Todo、不產生Follow-up、既有Boss Work Severity／Reward／Workload。

P驗證以temporary engine copy完全關閉Meeting排程注入，再與正式Meeting chance=0比較九種Rank／Flattery各120分鐘；排除新增Meeting統計後，所有既有完整State＋RNG exact deep-equal。只讀Boss instrumentation另比對正式State／RNG，不影響抽樣。

## 隔離方法與指標

540完整Run：Rank0／2／4 × Flattery0／100／200 × ON／OFF ×30 Seeds，各120 actual active分鐘；Seed42+i×7919。E/Q/Life/Slacking固定200，不買能力、不升職、Products／Prestige／Offline OFF；Age沿用正式自然老化，22初始化後約22.329，仍在同一倍率帶。

所有每日指標分母120個完整60秒世界日，不以「有工作／有會議的日子」當分母。Meeting Count指完成次數，Triggered指真正開始；Seconds指实际處理世界秒，不把等待或被Problem暫停時間算開會。crossEntertainment以offWorkAnchor（晚間流程起點）量測；不存在新造的Entertainment固定時間。

娛樂時間由正式Target實際佔用區間累積，未娛樂夜數只計已結算Sleep Window。Sleep ratio平均與P10只計已結算窗口，另輸出實際睡眠秒數（包括最後部分窗口）。Todo／Due Today／Overdue是120分鐘末端去重快照。

entertainmentSecondsLostToMeeting／sleepSecondsLostToMeeting = OFF−ON實測時間。這是matched-seed replay差值，未拿3秒直接推估；負值表示ON較多。ON增加RNG消耗、Boss outcome是替代，因此不同路徑的單一事件不保證對齊，配對效果包含事件與派生工作變化。

summary CSV每欄有mean／median／P10／P90／SD／mean95%CI；paired-summary用每Seed ON−OFF及百分比後再彙總，非兩組總額比值。Overdue顯著性使用末端配對CI，不宣稱整段期間完全沒有短暫逾期。

## 普通與老闆會議次數／日（ON，30 Seed平均）

|Rank|Flattery|Normal/day|Boss/day|Total/day|Seconds/day|Compensation/day|
|---|---:|---:|---:|---:|---:|---:|
|R0|0|0.0203|0.0061|0.0264|0.0792|0.1319|
|R0|100|0.0203|0.0744|0.0947|0.2842|0.4736|
|R0|200|0.0172|0.0714|0.0886|0.2658|0.4431|
|R2|0|0.0717|0.0064|0.0781|0.2342|1.5611|
|R2|100|0.0683|0.0725|0.1408|0.4225|2.8167|
|R2|200|0.0706|0.0747|0.1453|0.4358|2.9056|
|R4|0|0.1850|0.0083|0.1933|0.5800|15.4667|
|R4|100|0.1864|0.0789|0.2653|0.7958|21.2222|
|R4|200|0.1817|0.0811|0.2628|0.7883|21.0222|

## ON−OFF 配對影響（30 Seed平均）

|Rank|Flattery|Completed Work %|Processed %|Gross %|Todo Δ|Overdue Δ|Entertainment秒/day Δ|Sleep ratio Δ（百分點）|
|---|---:|---:|---:|---:|---:|---:|---:|---:|
|R0|0|-0.2038|-0.3213|-0.4178|-0.2667|0.0000|0.0015|-0.0026|
|R0|100|-0.8185|-0.2836|-2.3486|1.0667|0.0000|-0.0000|-0.0087|
|R0|200|-0.2374|-0.3725|-2.2968|1.2000|0.0000|-0.0008|-0.0072|
|R2|0|-0.5735|-0.9616|-1.6576|0.4333|0.0000|-0.0007|-0.0127|
|R2|100|-1.4170|-1.0955|-3.3321|-0.5667|0.0000|-0.0021|-0.0176|
|R2|200|-1.3097|-1.3816|-5.2764|-0.8333|0.0000|-0.0023|-0.0188|
|R4|0|-2.2214|-2.1546|-2.0815|0.6000|0.0000|-0.0017|-0.0546|
|R4|100|-3.0439|-2.5217|-6.4164|1.6667|0.0000|-0.0076|-0.1001|
|R4|200|-2.6900|-3.1403|-10.3978|2.2667|0.0000|0.0053|-0.0800|

## Rank4／Flattery200 診斷

Meeting平均每天 0.7883 秒，占60秒一天 1.3139%。Completed Work配對平均 -2.6900%，Processed Workload -3.1403%，Gross -10.3978%。

娛樂時間差 0.0053 秒／日；Sleep Ratio差 -0.0800 百分點。Overdue末端差 0.0000，95%CI [0.0000, 0.0000]。

3秒Meeting分類：**HEALTHY**。以高階Build的實際Processed Workload配對降幅為主要時間成本診斷；Completed Work與Gross另列。Gross同時受低額Meeting替代高報酬Boss Work與Follow-up影響，不等同單純工作時間損失。這些參考門檻只在報告，不進正式遊戲。

Boss Base Workload保持50。此實驗混合普通會議與Boss替代結果，不能單獨判定50是否合適；若要改Boss，下一輪應隔離Boss工作量／報酬／Severity與生活保護，不由本輪結果自動調整。

## 完整交付

meeting-isolation-runs.csv：540每Seed明細與全部統計。meeting-isolation-summary.csv：18組分布。meeting-matched-delta.csv：270配對明細。meeting-matched-summary.csv：9組配對分布與CI。meeting-sanity.json／meeting-config-verification.json：守恆、Config、回歸證據。MEETING_V1_AI_REVIEW.zip包含本輪輸出與測試log。
