# Deterministic Boundary Fix V1

## 結論

Root cause與原Career V3 blocking report一致：Sleep output累加尾差使完整睡眠落在ratio1之下，插值得到極小負modifier，effective quality跨過Follow-up離散分段，改變件數並使後續RNG分岔。

本輪修正式Production Source，不固定runner batch、不全域round State、不調Balance。原world54→90零策略重播的Follow-up／RNG／Current Target／sequence已exact equal。Seed42、五Policy、0.05／0.25／1／5／60 batch各600 actual active秒的25組比較全部通過。

## Production修改範圍

1. `src/game/numeric/semanticBoundary.ts`：小型共用canonicalizeBreakpoint與semanticGte，absolute epsilon固定1e-12。
2. `src/game/targets/sleepWindow.ts`：sleepRatio及sleepEffect只在距離正式Config breakpoint≤1e-12時對齊；到達breakpoint直接回傳Config點的精確modifier，完整睡眠得到ratio1與speed／quality exact0。
3. `src/game/work/workQuality.ts`：離散count bucket以semanticGte比較ratio與原minimumRatio；chance、count、threshold、reward公式均保持。
4. `src/game/engine/SimulationLoop.ts`：處理新增batch驗證發現的時間區間精度不一致；next先套用世界鐘原有10位小數精度，再計算next−now，讓進度區間與實際世界推進一致。activeSeconds由同一次advance的起始active time＋實際已推進区間計算，避免每個內部分段累加取整少算1e-10秒。observer提前中斷時只計已推進部分，offline仍不增加active time。

沒有改GameState schema、processing rate、dayDuration、Sleep Window／curve、Quality requirement／bands、Promotion／Boss／Meeting／Product規則。新增／調整僅scripts、tests、reports及上述4個Production檔案。

## 為何有SimulationLoop補強

0.25與60已一致後，0.05暴露原Loop以未取整next−now計算進度、但以取整next更新world。例如full Lunch累積量119.99999999989086與120、final Target progress9.999999999990905與10。部分sleep連續modifier也受此區間差異影響，並留下1e-10 creation time差異。

只對齊既有世界鐘的同一段時間，不對workload／money／quality／所有State取整。補強後實際Target、建立工作量、Creation timestamp及系統狀態均可嚴格比較。完整回歸另捕捉速度倍率下activeSeconds9.9999999999而非10，改用每次advance起點的權威累積後恢復exact10；沒有用世界時間假冒未乘倍率的active time。

## Epsilon與真實數值保護

- Production semantic epsilon：**absolute1e-12**，不按大數值放大，不更改Config。
- Sleep breakpoints直接讀取正式curve（0、0.5、1、1.1），沒有另寫新的曲線。
- `0.9999999999999992 → 1`；neutral modifier exact0。
- `0.99`、`0.9999`、`1.01`保持原值與插值效果，不snap到1。
- Quality `12/10`與`11.999999999999996/10`同1.2 bucket；`11.99/10`與`1.199`仍低於門檻。
- Sleep完整／一半／零睡眠，五種batch得到相同語意結果；完整睡眠exact0 modifier。

## State比較與浮點尾差

正式Source修正先完成，reporter仍對RNG、IDs、counts、money、rank、workload、Todo、Current Target（含progress）、Promotion、Meeting、Boss、Deadline、Sleep effect、actual activeSeconds做exact比較。

只允許兩類明確白名單：

1. `.player.age`／`.player.ageProgressDays`，absolute≤1e-12，標NON_SEMANTIC_FLOAT_TAIL。25組實際最大Age尾差約2.345e-13。沒有round Age或改Age curve。
2. 歷史`eventLog[n].time`／`notifications[n].time`的相對顯示時間，≤2e-10（原世界鐘1e-10刻度與二進位相減尾差）。它們不參與排程分支；文字、順序、ID及其他欄位仍exact。實際world time、Target creation time、Deadline／Billing timestamp沒有此容差。

Sleep duration／output不使用reporter tolerance。比較器回歸確認不能掩蓋money、target progress、workload、rank、ID、RNG或count尾差；明顯歷史時間差也會fail。

## Age breakpoint驗證

對30／40／50／60建立跨門檻的同State fixture；每組五batch於相同世界時間0.5／1／1.5／2秒透過正式createWorkloadSnapshot取得新工作量。四組的所有multiplier／workload snapshot及RNG exact equal。既有`getAgeWorkloadMultiplier`的10位小數分類與boundary scheduler不變，沒有重設Age或調曲線；測試中的年齡初始化只用於隔離fixture，沒有新增玩家Debug操作。

本輪未重現Age門檻的正式玩法分歧。原World54 checkpoint是既有自然Career State，測試期間沒有policy action或手動修改。

## Targeted boundary audit

完整分類見`boundary-audit.csv`（13列）。Promotion exact WorkStart保留完成先於失敗；Deadline完成例外、Billing收入先於續費、Meeting remaining duration、Lunch／Breakfast時間窗口皆沿用現有安全處理與回歸。

Boss fractional random比較是潛在擴充風險：目前attention取決於穩定能力，不依batch連續累加，未重現分歧，故不修改。Lunch原ratio+1e-8為既有較寬容差，本輪保留，避免改正式語意。任意外部輸入超出時間精度合約的風險沒有被擴大處理。本輪不是全面numeric重構，也不是宣稱未測的所有Seed／任意極端時間都已證明一致。

## Regression／Config

新增16項邊界測試：Sleep點與真實附近值、0／9／18秒睡眠、品質等價／真實不足、原checkpoint、五Policy600秒五batch、四Age門檻及嚴格比較器。Core總數435。既有Product119 Before／After、Promotion exact WorkStart、Deadline、Meeting、Prestige actual-time／offline、Source instrumentation回歸均保留。

最終Core、Browser與Build實際結果見`core-tests.log`、`browser-tests.log`、`build.log`及`verification-summary.json`。ConfigBefore／After完整deep equal，Excel檔案SHA256亦相同；全部既有Balance及rows不變。

## 交付與下一步

包含本報告、batch-reproduction-before.json／after.json、batch-preflight-after.json、boundary-audit.csv、config-verification.json、Config快照、測試log。舊Career blocking evidence仍保留，沒有覆蓋；`careerV3Preflight.ts`現在輸出至本輪資料夾。

本輪已消除已確認阻擋點，通過規定預檢後可在下一輪授權下恢復Career V3。**本輪沒有啟動900 Runs**，沒有Career平衡結論、Auto Tune、Commit或Push。
