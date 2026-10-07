# Product Framework Review V1

## 結論

修改前 **MINOR_REFACTOR_REQUIRED**；完成最小整理後 **CONFIG_READY**。7個正式產品、4種實際使用的Effect Type、完整正式Config及Excel Balance rows完全不變。沒有新增正式產品、正式效果、Balance門檻或第二套離線引擎；沒有跑Career 900、Auto Tune、Commit或Push。

新產品使用既有且已實作的效果時，只新增Config definition、參數、價格與週期即可。FOOD_OPTION另需提供對應Food Config。全新Effect Type仍需Registry定義及真正受影響系統的通用Hook，不可加入特定Product ID分支。

## 正式產品

| ID | 價格／30完整遊戲日 | 主效果 |
|---|---:|---|
| quick | 80 | FOOD_OPTION：每餐另付8、需求20、進食速度30 |
| wound | 95 | PROBLEM_RESOLVER：wound問題與保護 |
| eyes | 85 | PROBLEM_RESOLVER：eyes問題與保護 |
| sleep | 90 | PROBLEM_RESOLVER：sleep問題，不修改Sleep Window |
| itch | 75 | PROBLEM_RESOLVER：itch問題與保護 |
| agecare | 120 | OFFLINE_AGE_PROTECTION：離線年齡倍率0.5，年齡壓力效率補償率0.5 |
| care | 100 | TAGGED_WORK_REWARD：形象／簡報工作額外收入+15% |

`SLEEP_MODIFIER`只有既有Type宣告，沒有正式產品或Runtime Hook；Registry標示unsupported，validator拒絕使用，不計為第五種支援效果。Meeting產品效果只列為FUTURE_EXTENSION_POINT，未實作新效果。詳細關聯Event／Food、Save欄位、作用系統與分支分類見三份CSV及product-source-scan.txt。

## 最小修改範圍

- 新增`src/game/products/productSchema.ts`：保留flat schema，選填每產品billingPeriodDays、enabled、stackingPolicy。
- 新增`productEffectRegistry.ts`：效果／參數型別、預設值、疊加政策、上下界、Hook與Config validation。
- 新增`productEffects.ts`：通用啟用判斷、Food、Problem、離線年齡、年齡補償、Tagged Reward與貢獻統計。
- 新增`productPresentation.tsx`：集中既有效果與貢獻文字，正式產品UI static markup exact equal。
- `productManager.ts`、`initialState.ts`：共用Subscription初始化及Config週期；正式仍為30日。
- `saveGame.ts`：舊Save缺少新Config產品時只補inactive subscription，已有產品保持原資料。
- `ageWorkload.ts`、`workStats.ts`、`SimulationLoop.ts`、`targetManager.ts`、`problemTarget.ts`：原效果計算改呼叫中央resolver，原流程保持。
- `Products.tsx`：中央presentation與通用效果可用性；資料驅動顯示。
- `v2Defaults.ts`：移除authoring的agecare ID shorthand；原0.5直接在產品definition表達，generated Config exact equal。
- `scripts/config.ts`：正式Config／Build接入完整產品驗證。
- 新增tests fixture／regression／browser／verification／報告；其他遊戲及Legacy未改動。

Boss、Meeting、Promotion、Sleep Window、Prestige與Billing獨立算法沒有改寫。受保護Source與修改前SHA256結果記錄於sanity JSON。沒有重建GameState。

## Schema、Stacking與Validation

沿用一個primary effectType加flat參數與通用ageEfficiencyCompensationRate；`productEffectView`提供等價normalized view，不另存effects[]或新增GameState欄位。Config enabled是定義層開關，Subscription active是執行期enabled等價狀態。

| 效果／參數 | 中央政策 | 邊界 |
|---|---|---|
| FOOD_OPTION | SELECTED_OPTION | 一餐一方案；無效或不足fallback普通食物 |
| PROBLEM_RESOLVER | FIRST_MATCH | 同tag取Config順序第一個active產品 |
| offlineAgeProgressMultiplier | MULTIPLY | 單產品0至1；保留順序及邊際歸因 |
| ageEfficiencyCompensationRate | ADD | 單產品0至小於1；總和不另設cap |
| rewardTagBonus | ADD | 非負、無新cap；原matching tag與rounding保留 |

年齡補償仍可來自任何active產品的通用參數，正式只有agecare非零。沒有自行改變疊加規則，也沒有發現需自行決策的UNSPECIFIED_CURRENT_BEHAVIOR。

Product context欄位標為 **UNUSED_CURRENT_METADATA**：原Problem resolver並未拿它們篩選產品，本輪不啟用；實際scope仍由tags與Event Config決定。

Validator拒絕重複ID、缺必要欄位、未知欄位、非有限或負價格、無效週期、未知／未實作Type、錯誤型別或超界效果、不相容主效果參數、錯誤stacking policy、重複／空scope、錯誤context／目標型別及無效Food關聯。合法0價格可用。flat schema每產品只有一個主Type；重複ID／tag與不相容參數被拒絕，不禁止不同產品合法疊加同類效果。

## Lifecycle與資料相容

維持products[id]的id、active、pricePerBillingPeriod、billingPeriodDays、nextBillingWorldTime、effectType、contributionStats。停用不退費、不延長期限；已付期間恢復不扣款。到期依原Billing續费；失敗active=false且nextBillingWorldTime=null。同timestamp工作收入先入帳、再續費。Resolver不自行按到期時間搶先關效果，以免改變順序。

舊State **不保存首次啟用時間或歷史扣款時間**。nextBillingWorldTime是付費期限權威欄位，當前付費區間可從期限和週期推得，但停用／恢復歷史無法還原。本輪保留此限制，未增加改變完整State的日期欄位。

新增同類Config產品時，舊Save只補inactive Subscription；已有產品不消失、不重啟、不延長／提早到期、不重複扣款或疊效果。離線走同一正式SimulationLoop，Promotion offline暫停／deadline位移保持；Prestige清除Run Product State與貢獻統計，Permanent等規則不變。

已付FOOD在Subscription失效後依原規則完成；新FOOD不能再用失效產品。Problem保留原Target validity／恢復規則。Agecare停用／續費失敗立即移除補償，current Work progress保留，已有workload不改。

## Exact Regression與測試

修改前完整Source、Config、Excel與SHA256 manifest已保存。Regression匯入兩套實際Engine，不以修改後resolver作為修改前oracle。固定Date.now與RNG排除Fixture初始化時間差，沒有刪除State欄位规避比較。

7產品×17情境= **119／119 full State + Result exact equal**：ACTIVATE、WORK、REWARD（Normal／FU／Project／Boss）、FOOD、SLEEP、ONLINE_AGE、PROBLEM、DISABLE、REENABLE、BILLING、EXPIRY_FAILURE、SAVE_RELOAD、SAVE_OFFLINE、OFFLINE_BILLING、PRESTIGE、BOSS、UI。各正式產品UI static markup亦exact equal。

Test-only A使用TAGGED_WORK_REWARD，B使用OFFLINE_AGE_PROTECTION，只存在tests及memory override。Config-only可取得UI／State／Activation／Effect／獨立週期／Expiry／Save。Browser以route提供測試Config，不寫正式generated JSON；舊7產品Save在9產品Config只補新增inactive狀態。

額外驗證：兩產品疊加、Problem第一匹配、Food Config關聯、19項非法Config、同時點收入續費、Agecare失效progress保留、Promotion穩定資格排除短期產品、ACTIVE Promotion沿正式effectiveWorkSpeed、Meeting固定3 reference秒。Age50、E26的考核速度依正式補償×1.225，Qualification不變；沒有Promotion專用產品分支。

最終 **Core 419／419、Browser 31／31、Build PASS**；產品專項38個Core tests與2個Browser tests。這驗證架構與既有deterministic行為，並不宣稱產品經濟平衡已完成。

Config verification確認正式產品數量、ID、價格、效果、週期及完整Config／Excel Balance rows全部deep-equal；test pollution=false，Boss Base Workload仍50，所有受保護Balance不變。

## 未來Balance Budget報告框架（不執行、不定門檻）

以同Seed、同Config hash、同初始State與測試長度作ON／OFF配對，記錄產品Type／價格／扣款／有效時間／續費失敗。輸出欄位：Work Output%、Gross Income%、Sleep%、Todo Average／Final／Peak、Overdue Average／Final／Peak、Boss遭遇／失敗／工作量、Meeting次數／時長、Promotion資格／考核、Age進度／倍率。百分比以OFF為分母；OFF=0標unavailable，不能換成0。

本輪僅建立欄位與量測語意，未設定弱／中／強或正式Balance門檻，未執行Career 900。

## 交付

Audit、Implementation Report、三份CSV、sanity、Before／After Config、verification、119情境結果與log、完整Core／Browser／Build log及不可變baseline均在本資料夾。需要其他AI檢查時，先提供報告與CSV／JSON；逐程式核對再提供products目錄、相關Hook、tests及baseline-runtime。
