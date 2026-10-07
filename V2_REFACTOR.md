# V2 核心重構交付紀錄

日期：2026-10-05。版本：2.0.0。直接修改原 auto-worker，沒有另建 Vite 專案。

## 完成項目

1. 巢狀 V2 State、Config、單一世界鐘與事件驅動模擬。
2. Todo 低水位、集中 priority／weighted 選取、品質敏感低收益返工、立即／延遲多工作與 Root／深度限制。
3. Parent Project、依賴解鎖、主要步驟獎金、額外 Follow-up。
4. WORK／FOOD／LUNCH／ENTERTAINMENT／SLEEP／PROBLEM；固定午休窗口與 restOutput Tier。
5. 事件 Debuff、產品 Problem、優先級、多層中斷恢復與同類保護。
6. 七類產品、當輪金錢 30 日訂閱、續費失敗停用與貢獻統計。
7. Boss Catch／Escape 分離，逃跑失敗才新增 Boss Todo。
8. 八條永久總倍率路線、清醒值消費、獨立醒來獎勵與正確重置。
9. 離線 30 分鐘／日、餘數、16 小時／32 日、續費、Todo／專案／年齡／抗老保護；無自動重大決策。
10. 原 UI 接 V2；保留底部導航、美術、通知；補完整 Debug、存檔提示與驗收測試。

## 刪除／停用的舊邏輯

舊 simulation／life／buffs／modifiers／saveMigration／formulas 已移除；不再用效率×品質當工作攻擊力，不再完成工作後直接無限抽怪，不再零秒午間，不再摸魚抵銷 Boss Catch，不再清醒值買永久產品，不再 lifetimeClarity 通用產能，不再關頁無收益。舊設定遷移腳本已移除，舊 Excel 有獨立備份。

## 新增的重要檔案

- `src/config/v2Defaults.ts`、`projectConfig.ts`、`eventConfig.ts`、`prestigeConfig.ts`。
- `src/game/state/gameState.ts`、`initialState.ts`。
- `src/game/time/worldTime.ts`、`schedule.ts`、`offlineSimulation.ts`。
- `src/game/engine/SimulationLoop.ts`、`actions.ts`、`debugActions.ts`。
- `src/game/work/todoManager.ts`、`workSelector.ts`、`followUpManager.ts`、`workQuality.ts`、`workStats.ts`。
- `src/game/projects/projectManager.ts`。
- `src/game/targets/targetManager.ts`、`problemTarget.ts`。
- `src/game/events/eventManager.ts`、`eventLog.ts`、`src/game/buffs/buffManager.ts`。
- `src/game/products/productManager.ts`、`billingManager.ts`。
- `src/game/career/bossEvents.ts`。
- `src/game/prestige/prestigeManager.ts`、`permanentUpgrades.ts`。
- `src/game/save/saveGame.ts`。
- `config/archive/game_config-pre-core-v2.xlsx`。

## 修改的重要檔案

GameEngine、types 入口、gameConfig／workConfig／productConfig、scripts/config、Excel／generated JSON、App、Home／Upgrades／Products／History、TargetCard／TargetMonster、DebugPanel、target presentation／CSS、package version、核心與瀏覽器測試、README。CharacterScene 保留為素材；未新增大量美術。

## Debug 與首輪實玩

完整操作在 README 的 Debug／第一輪驗收段落。優先驗證：Todo 與品質 → 午休與快速食物 → 專案／Pending → 有無產品的事件差異 → 兩段老闆骰 → 離線／續費 → 永久倍率與醒來。

## 待平衡數值

dayDuration／作息窗口、工作池、品質敏感度、後續機率與鏈限制、升職要求／倍率、專案風險／獎金、午休 Tier、餐點需求／價格、生活速度、事件與 Protection、訂閱價格、抗老進度、永久表／成本、清醒值公式、daysPerYear。全部集中 Config，沒有硬腳本強制崩盤。

## 驗證結果

- `npm run build`：通過 TypeScript 與 Vite。
- `npm test`：42 項通過。
- `npm run test:browser`：11 項通過；無頁面 Console／page error。
- 固定種子 480 秒樣本：世界第 9 日，113 份工作、Todo 10、2 個專案、本輪收入 $10,220；這是驗證樣本，並非正式平衡承諾。
- 截圖：`tests/artifacts/v2-*.png`。

## 明確限制／設計選擇

- 專案主要步驟完成即發 Parent 獎金；額外後續仍可留在 Todo。
- 三餐為預設；工作中插入 FOOD 功能由 Config／Debug 驗證。
- 在線節流補算與離線都按重要事件邊界處理；不逐秒離線模擬。
- 產品是 Prototype 遊戲描述，正式名稱、圖片、功效文案尚未填入。
- 不相容舊測試存檔備份後重置，沒有複雜遷移。
- 保留既有啟動方式；不部署、不 Commit／Push。


# V2 Core 規則校正／邊界補強交付（2026-10-05）

此節取代上方初版 V2 中與新規則衝突的描述。仍為同一個 V2 專案、State與Save，不是V3。沒有重建／刪除專案，沒有修改其他遊戲、Commit或Push。

## A. 本次檔案

修改：

- `src/config/v2Defaults.ts`
- `src/game/state/gameState.ts`
- `src/game/state/initialState.ts`
- `src/game/engine/SimulationLoop.ts`
- `src/game/engine/actions.ts`
- `src/game/engine/debugActions.ts`
- `src/game/targets/targetManager.ts`
- `src/game/targets/problemTarget.ts`
- `src/game/work/workQuality.ts`
- `src/game/work/workStats.ts`
- `src/game/work/followUpManager.ts`
- `src/game/projects/projectManager.ts`
- `src/game/events/eventManager.ts`
- `src/game/buffs/buffManager.ts`
- `src/game/products/productManager.ts`
- `src/game/products/billingManager.ts`
- `src/game/time/offlineSimulation.ts`
- `src/game/save/saveGame.ts`
- `src/App.tsx`
- `src/screens/Home.tsx`
- `src/screens/History.tsx`
- `src/screens/Products.tsx`
- `src/components/DebugPanel.tsx`
- `src/game/presentation/target.ts`
- `src/target-style.css`
- `scripts/config.ts`
- `tests/simulation.test.ts`
- `tests/browser/targets.spec.ts`
- `config/game_config.xlsx`
- `config/generated/game_config.json`
- `README.md`
- `V2_REFACTOR.md`

新增：

- `src/components/OfflineSummaryCard.tsx`
- `scripts/correct-core-config.ts`
- `tests/boundaries.test.ts`
- `tests/browser/corrections.spec.ts`
- `config/archive/game_config-pre-boundary-correction.xlsx`


Build、test-results及tests/artifacts由驗證更新。Boss公式、Prestige公式／永久表／重置函式、Todo選取函式與DAG解鎖規則保持原有設計。

## B. 逐項規則結果

| 文件項目 | 結果 |
|---|---|
| 1 保留核心 | 延伸既有GameState，不另建新State；Todo、DAG、Boss、Prestige、離線換算保留 |
| 2 早餐窗口 | Config暫定0～8 reference秒；截止尚未開始則MISSED，已開始可繼續完成；不補Satiety、不加人工早餐懲罰；工作飢餓插入預設true |
| 3 Routine Project Roll | projectRollProcessedRoutineId控制首次上午工作判定，早餐完成／錯過都可生成 |
| 4 模板選擇 | enabled、rankRequirement過濾，weight抽選；不固定第一個 |
| 5 Boundary順序 | Target完成／入帳先於expiry、Pending、billing、schedule、events，最後恢復／選取 |
| 6 Derived time | load先用totalWorldTime重建dayIndex/timeOfDay，不信任舊值 |
| 7 Anchor比例 | 新早餐與既有作息皆用scaledSeconds/routineAnchor；睡眠錨點也納入boundary |
| 8 Stack有效性 | while持續pop；檢查LUNCH窗口、PROBLEM原Debuff／產品／Resolver、WORK有效專案步驟；已付FOOD保持有效 |
| 9 Quality件數 | qualityCountBands影響qualitySensitive件數，業務後續件數／機率不讀品質；Root/Depth限制保留 |
| 10 Project狀態 | ACTIVE→DELIVERED發一次Parent Reward；所有排隊／延遲／當前／暫停工作消失才CLOSED |
| 11 精確訂閱 | nextBillingWorldTime =付款時刻＋30日長，納入boundary；續費失敗inactive/null；有錢不自動恢復 |
| 12 精確抗老 | 每段elapsed/dayDuration乘有效offlineAgeProgressMultiplier；產品失效前後不同倍率 |
| 13 Age | daysPerYear暫定365待平衡；Debug Set Age及40/50/60/70快捷獨立；無60歲終止 |
| 14 Event Context | 目標允許／排除、tag、rank、reference時段、Protection、contextModifiers；eyes只WORK、wound排除SLEEP、itch支持三情境；tired不Random |
| 15 Product型別 | FOOD_OPTION、PROBLEM_RESOLVER、OFFLINE_AGE_PROTECTION、TAGGED_WORK_REWARD及保留SLEEP_MODIFIER，功能依effectType |
| 16 產品統計 | Common啟用／總支出／訂閱支出；各類型food／problem／age／bonusIncome分列，UI不混單位 |
| 17 離線摘要 | Snapshot/Diff含現實時間、日數、Gross、產品支出、Net、Age、Todo、專案及各產品；可關閉非阻擋卡，History保留 |
| 18 Todo醒目 | 資產旁同區域顯示大數字，不增加額外Dashboard／Debuff；可選趨勢本次未加 |
| 19 Todo分類 | 普通／後續／返工／專案／老闆Icon及短標籤，顯示實際Reward／來源 |
| 20 Lunch預估 | 即時使用當前累積Rest查Tier，顯示預估下午速度；100%以上封頂 |
| 21 Problem預估 | 顯示原Debuff秒數、剩餘處理秒數、預計提前解除，產品名／Icon保持可見 |
| 22 Buff範圍 | 保留expiresAt，沒有新增WORK_COUNT等duration模型 |
| 23 Priority範圍 | 保留工作priority、Problem priority、Routine分支，未建全Target總排序 |
| 24 Boss | 公式不變；新增同Timestamp收入→續費測試 |
| 25 Prestige | 核心不變；新早餐／專案／續費／摘要資料透過原Initial重置；永久保留 |
| 26 直接測試 | 指定24項皆有直接測試，另外補12項相關邊界 |
| 27 最終驗證 | 下列D/E記錄 |

同時刻固定順序：區間Target/年齡推進 → 移動時計與派生Day → 完成Target（工作獎勵、後續、Subtask/Parent、FOOD、Problem、Sleep）→ expire → Pending → billing → 日界統計／早餐截止／午休 → Timed Events → ensure/resume/select → Project closure/Stats。

## C. 新增測試名稱

核心 `tests/boundaries.test.ts`：

- `01 WORK exact lunchStart completes before schedule with no delay`
- `02 SLEEP exact next day start has zero oversleep`
- `03 one advance crosses pending billing lunch and day boundaries deterministically`
- `04 same timestamp income pays renewal before billing fails`
- `05 WORK crosses entire lunch window then still eats lunch`
- `06 lunch FOOD crosses lunchEnd and finishes without replacement rest`
- `07 WORK FOOD PROBLEM FOOD WORK preserves every progress`
- `08 resume discards all invalid problem layers until paid FOOD then WORK`
- `09 breakfast starts before cutoff and completes after cutoff`
- `10 oversleep past breakfast cutoff skips without artificial meal penalty`
- `11 previous target delays unstarted breakfast beyond cutoff`
- `12 missed breakfast still rolls one project per routine independent of queue`
- `13 A B/C D/E share a whole root tree reservation limit`
- `14 quality changes rework chance and conditional count but not business count`
- `15 project delivers once with pending current suspended extras then closes`
- `16 activation Day10/59 renews after exactly thirty complete days`
- `17 dayDuration180 scales breakfast lunch offwork sleep anchors`
- `18 boss game hour workload scales automatically sixty to one-eighty`
- `19 sixteen real offline hours advances thirty-two world days`
- `20 fractional offline anti-age expiry protects only the effective segment`
- `21 context blocks eye and wound during sleep and tired is not random`
- `22 breakfast project boss are not repeated by repeated ensure in one routine`
- `23 load recomputes incorrect derived day and time from authority`
- `24 offline summary income spending money age todo projects product diffs reconcile`
- `25 problem exact expiry and failed renewal still completes before cancellation`
- `26 started quick FOOD survives product expiry while suspended`
- `27 prestige resets correction state and retains permanent levels`
- `28 template random selection respects enabled rank and weight`
- `29 boss completion at billing timestamp pays income before renewal`
- `30 exact debuff expiry permits already-completed problem first`
- `31 additive V2 migration preserves run and permanent data`
- `32 event context overrides and rank time tag restrictions are data-driven`
- `33 offline billing spending stays correct for meal already paid before offline`
- `34 routine sleep imbalance resolves with sleep product without extra random tired debuff`

- `35 legacy suspended breakfast stays started after cutoff on load`
- `36 resolver losing matching tag invalidates pending problem without progress loss`

瀏覽器 `tests/browser/corrections.spec.ts`：

- `offline summary dismisses without blocking and remains in History after reload`
- `late breakfast is missed and Todo list shows zero reward rework source`

原42項測試保留，僅對日界扣款／舊統計欄位等被新規格取代的部分調整fixture與斷言。原大型目標UI fixture改為真正Project/QUEUED Subtask，不用不存在的project id。

## D. Test結果

- npm test：78 passed，0 failed/cancelled/skipped。
- npm run test:browser：13 passed。含320/390/460/1280px、四頁導航、八類Target、中央卡不碰導航、訂閱／永久／離線／Prestige／重整、早餐錯過／零收益返工、摘要關閉與History保留。
- 午休與Problem截圖已視覺確認。最初午休新hint多出4px，縮短文字後布局測試通過；未刪除預估資訊。
- Node NO_COLOR/FORCE_COLOR環境警告不影響遊戲。測試內Console error/pageerror斷言通過。
- 固定種子480秒樣本：135工作、Todo5、專案1、本輪收入13778；是驗證樣本，不是平衡目標。

## E. Build結果

npm run build通過：Config124列、7產品，TypeScript無錯誤，Vite70模組。JS 307.35 KB（gzip 95.35 KB），CSS 29.58 KB（gzip 7.13 KB）；沒有新增runtime套件。

## F. 仍屬數值平衡的Config

- breakfastStart/cutoff、午休／下班／睡眠錨點、dayDuration。
- 食物requirement、processingRate、satietyDuration、每餐價格。
- 工作池workload/reward/quality/weight、能力increment與升級費用。
- Follow-up機率、qualityCountBands、工作量／報酬比例、delay、Root/Depth/Project上限。
- 職級工作量／報酬／品質倍率、Project chance與模板weight/rank、Parent/Subtask獎金。
- fullRestTarget、Rest增量及Tier；娛樂／睡眠需求、遲到／睡過頭比例與封頂。
- Boss原有Catch/Escape參數與Boss基礎小時／報酬。
- Event頻率、context、modifier、duration、Problem處理量與Protection。
- 產品價格、billingPeriodDays、抗老倍率、標籤收入比例。
- daysPerYear=365為暫定待平衡；年齡壓力參數。
- 永久倍率／費用、Clarity獎勵公式參數；本次未重新設計。

## G. 衝突與相容處理

沒有需要另建第三套規則的架構衝突。三個資料相容細節明確如下：

1. 舊V2只有剩餘日數，沒有歷史購買時間：載入以「現在＋舊剩餘日長」轉成deadline，從此只跑精確Timestamp。無法復原未保存的原購買Timestamp。
2. 舊統計未區分觸發／處理等用途：保留可推導值，舊Problem觸發數以已知處理數起算，新增期間精確獨立累計。新Snapshot摘要不偽造舊離線細節。
3. 舊V2年長速度改成365時，為保留既有角色顯示年齡，增量遷移將既有年齡轉為新尺度ageProgressDays；新輪及未來推進使用新Config。永久、金錢、Todo、DAG等不清除。

手動停用後在原付費期限內恢復仍保留舊可用期限，這是原行為；續費失敗則null，重新手動啟用一定重新付款取得完整期限。改日長時，新建／續費期間按新dayDuration計算；既有已保存的絕對到期時刻維持原時間，未偷偷重算已付期限。

本次只修改auto-worker；Workspace中其他既有變更保留。沒有Commit、Push或部署。
# Todo Deadline — 2026-10-05

1. 修改檔案：Config defaults／Excel／generated JSON／validator；新增 `scripts/add-deadline-config.ts` 及原 Excel 備份。核心涉及 `state/gameState.ts`、`work/deadline.ts`（新增）、`todoManager`、`followUpManager`、`workSelector`、`workStats`、`projectManager`、`targetManager`、`saveGame`、`debugActions`。UI 涉及 App、History、target presentation、TargetCard、DebugPanel、style.css。新增核心及瀏覽器 deadline tests、手機截圖；更新 README。本次沒有修改 GameEngine、SimulationLoop 或升職規則。
2. Todo 新增 `createdAtWorldTime: number|null`、`dueAtWorldTime: number|null`、`deadlineGameHours: number`，保留 createdAt。Pending 兩個時間欄為 null，正式釋出後才起算。DeadlineStatus 是 runtime derived，不存檔。
3. Config：`deadlines.defaultGameHours`、`dueSoonRatio`、`overdueRewardMultiplier`、`sourceGameHours.{NORMAL,FOLLOW_UP,REWORK,PROJECT,BOSS,EVENT}`。Excel 的 work.templates、followUps.types、projects.templates 中子任務 JSON 可加 `deadlineGameHours` 覆蓋。依序採個別值、來源值、全域 fallback。秒数 = gameHours × dayDuration ÷ hoursPerDay；範圍經 validator 檢查，runtime 只讀 JSON。
4. 共用 getDeadlineStatus：now >= due 為 OVERDUE；否則 now >= due − (due − created) × dueSoonRatio 為 DUE_SOON；否則 NORMAL。精確到期不加 epsilon。
5. Selector：原 eligible filter → OVERDUE > DUE_SOON > NORMAL → 原 priority URGENT60/BOSS50/PROJECT30/FOLLOW_UP20/NORMAL10 → 原 random 權重 1/(1+followUpDepth)。不打斷目前工作。既有作息 eligibility 保留，包括下班流程只執行已產生的臨時 Boss 任務；Selector 本身沒有 Boss 特判。
6. Reward：原 baseReward × 職級 × 拍馬屁 × 永久收入 × 適用的 Boss 永久倍率 × 標籤產品倍率，乘完成瞬間 deadline multiplier，最後沿用 Math.round。未逾期1、逾期0.7；折扣前不先 round。零報酬仍零。Log 顯示原報酬／損失／實收；產品 bonusIncome 同樣計算折後差額。
7. Homepage 原待辦區顯示總數、即將逾期數、已逾期數，兩者為互斥子集合。只統計 todoQueue，排除 current／suspended／pending。小字置於原欄位，不增加頁面高度。
8. List 保留名稱、類型、來源、品質要求，顯示剩餘或已逾期遊戲小時，逾期顯示原報酬 → 實收。Current WORK 在既有提示區即時顯示期限，DUE_SOON 琥珀色、OVERDUE 紅色；完成效果顯示當下折後報酬。Pending 只顯示釋出倒數。
9. 新增26核心測試：建立期限、60→180縮放、NORMAL、DUE_SOON、exact due、overdue normal 勝正常Boss、dueSoon normal 勝正常Boss、同逾期Boss優先、保留深度權重、不打斷活動、28開始33完成折扣、29.9完成全額、warning全額、零返工、pending release起算、子任務、Boss期限、離線狀態、離線折扣、14/4/2統計、current/suspended排除、pending排除、eligible先行、舊V2加欄且不存status、模板覆蓋、followup類型覆蓋。新增兩個瀏覽器測試：手機數字／期限／原與折後報酬／卡片完整可見，以及三種Debug生成。
10. npm test：104/104 通過（原78 + 新26）。
11. npm run test:browser：15/15 通過（原13 + 新2）。首次發現數字增加高度造成卡片碰到底部導航，已修正並全量重跑；既有 layout assertion 未放寬。390×844 截圖已檢視。
12. npm run build：TypeScript、Vite 成功，71 modules；JS311.02KB/gzip96.43KB，CSS29.90KB/gzip7.22KB。未Commit或Push。
13. 暫定設定：全域24遊戲小時；NORMAL24、FOLLOW_UP16、REWORK12、PROJECT24、BOSS8、EVENT16。現有普通模板（含URGENT）皆採NORMAL24，專案子任務皆24。REWORK12；CORRECTION/MISSING_INFO/CLIENT_REPLY/NEW_REQUEST/PROJECT_NEXT_STEP皆16。60秒一天、24小時制分別換算60/40/30/60/20/40世界秒。最後25%為DUE_SOON，逾期收入70%、損失30%。沒有累積額外懲罰或工作失敗。

舊V2首次載入時，缺期限的queue/current/suspended工作從載入世界時間給完整期限，避免憑空追溯逾期；保留原進度、金錢、專案與永久能力。之後沿用原期限。Pending始終在實際釋出時計時；離線沿用原conversion及同一advance/完成程式。

# Deadline Profiles — 2026-10-05（取代固定期限版）

1. 本次修改檔案：`src/config/v2Defaults.ts`、`config/game_config.xlsx`、`config/generated/game_config.json`、`scripts/config.ts`；新增一次性 `scripts/update-deadline-profiles.ts` 和 `config/archive/game_config-pre-deadline-profiles.xlsx`。核心修改 `src/game/state/gameState.ts`、`src/game/work/deadline.ts`、`todoManager.ts`、`followUpManager.ts`、`src/game/projects/projectManager.ts`（只改子任務期限建立）、`src/game/save/saveGame.ts`、`src/game/engine/debugActions.ts`。UI 修改 `src/components/DebugPanel.tsx`、`src/game/presentation/target.ts`；既有 History、TargetCard 和首頁共用 helper 自動採用新判定。新增 `tests/deadline-profiles.test.ts`；修改 `tests/deadline.test.ts` 和 `tests/browser/deadline.spec.ts`；更新 README 和本文件。
2. 完整 Profile 結構：`{ id: string, hasDeadline: boolean, deadlineMinGameHours: number, deadlineMaxGameHours: number, dueSoonLeadGameHours: number }`。集中於 `deadlines.profiles`。同區另有 `defaultProfileId`、`workTypeProfiles`、`overdueRewardMultiplier`、`longDisplayGameHours`。Todo 保存 `deadlineProfileId`、一次抽取的 `deadlineGameHours`、`dueSoonLeadGameHours`、`createdAtWorldTime` 和 `dueAtWorldTime`；Status 不保存。Lead 保存為建立時快照，更新 Config 不偷偷改已接任務的警戒量。模板可以加 `deadlineProfileId`；沒有指定時按 work type/followup type/source type 查表。
3–4. 以下全部 PROVISIONAL／待實玩平衡：

| Work Type | Profile | 期限 Game Hours | Due Soon 提前 Game Hours |
| --- | --- | --- | --- |
| BOSS、真正 URGENT | BOSS_URGENT | 2–4 | 1 |
| REWORK、CORRECTION、MISSING_INFO | REWORK_SAME_DAY | 6–12 | 3 |
| CLIENT_REPLY | CLIENT_SAME_DAY | 12–18 | 4 |
| NEW_REQUEST | NEW_REQUEST | 18–24 | 6 |
| NORMAL、未指定種類的 FOLLOW_UP／EVENT | NORMAL_SHORT | 24–48 | 8 |
| PROJECT Subtask、PROJECT_NEXT_STEP | PROJECT_MULTI_DAY | 48–96 | 12 |
| 個別模板明確覆寫 | NO_DEADLINE | 無 | 無 |

5. NO_DEADLINE：建立時 createdAtWorldTime 正常保存，deadlineGameHours、dueAtWorldTime 為 null；狀態永遠 NORMAL、收入不打折。它計入總待辦，排除 dueSoon/overdue；與其他 NORMAL 按既有 priority、權重競爭。Save validator 接受 queued/current/suspended 的合法無期限資料，Pending 則所有期限時間與抽取量為 null。
6. 新公式：due=null → NORMAL；remaining=due−worldTime；remaining<=0 → OVERDUE；否則 remaining<=gameHoursToSeconds(savedLead) → DUE_SOON；其餘 NORMAL。Selector、History、Current、UI reward 仍共用單一 getDeadlineStatus。Label 短時間以遊戲小時顯示；24小時起以遊戲天顯示；無期限明示。Current逾期時同時顯示原收入和目前完成所得。
7. gameHoursToSeconds(hours)=hours×dayDuration/hoursPerDay；期限與 lead 都透過此入口縮放。相同seed在60與180秒日長抽出相同遊戲小時，世界秒數變三倍。期限只在建立/正式release抽一次，狀態與UI不耗RNG；重複初始化也不重抽。使用既有world seeded RNG，沒有Math.random。Pending的抽取延後到release，建立Pending不耗期限RNG。
8. Selector沒有修改：eligible → OVERDUE > DUE_SOON > NORMAL → 原 Work Priority → 原 weighted random。完成收入公式沒有修改，仍在完成瞬間查狀態，所有逾期統一既有倍率0.7，DUE_SOON全額。Boss Catch/Escape、DAG、Root Limit、產品、Prestige、離線換算、升職皆保留。
9. 新增25項核心Profile測試：六種範圍與非固定分布、無期限欄位、永遠正常且全額、fixed lead邊界、期限縮放、lead縮放、Pending釋出才抽、UI不重抽、無期限兩類urgency排除與總數納入、overdue排序、dueSoon排序、同狀態priority、正常開始逾期完成折扣、離線跨多日狀態、全部source/type預設、無期限current/suspended/queue存檔、舊固定期限保留due/RNG、小時天label、重複初始化不重抽。既有26個deadline測試依lead公式調整。瀏覽器新增無期限Current/重整/多日List測試，原Debug測試擴充七種生成按鈕，原layout/priority/收入assertions保留。
10. `npm test`：129/129 通過（原104 + 本次25）。
11. `npm run test:browser`：16/16 通過（原15 + 本次1），包含七種Debug生成、無期限重整、各中央目標完整手機顯示與頁面無錯誤。
12. `npm run build`：TypeScript及Vite成功；71 modules，JS314.31KB/gzip97.26KB，CSS29.90KB/gzip7.22KB。未Commit或Push。
13. 最小修正的衝突：舊固定source時長與全域25%改為Profile和lead；Pending過去先決定duration，現在release才抽；Save以前拒絕due=null，改為允許合法無期限；UI以前只有小時，改為小時/天/無期限；舊Save缺Profile時只補Profile/lead，保留原due、時長和進度，不重抽、不重置。更舊、連due都沒有的工作從載入世界時間建立。Parent原有未啟用deadline欄位維持不使用，没有新增Parent期限或重寫專案生命週期。既有可選deadlineGameHours覆寫留作舊模板相容，現行預設沒有使用，新配置採Profile。新增期限抽取會消耗同一RNG，因此更新後具體隨機事件序列會不同，但同seed、同操作與不同tick批次仍可重現。

# Workday Deadline — 2026-10-05（目前正式模型）

此小節取代下方歷史 Game Hours／Profile 規格。遊戲沒有同時執行兩套期限。

1. 修改檔案：`src/config/v2Defaults.ts`、`config/game_config.xlsx`、`config/generated/game_config.json`、`scripts/config.ts`、`scripts/update-deadline-profiles.ts`；新增備份 `config/archive/game_config-pre-workday-deadline.xlsx`。核心修改 `src/game/state/gameState.ts`、`src/game/work/deadline.ts`、`todoManager.ts`、`followUpManager.ts`、`workStats.ts`、`src/game/projects/projectManager.ts`（只改子任務期限）、`src/game/targets/targetManager.ts`、`src/game/save/saveGame.ts`、`src/game/engine/debugActions.ts`。`SimulationLoop.ts` 只增加下一工作日起點boundary、通知及初始化通知日，不重寫迴圈或同時刻處理順序。UI修改 App、DebugPanel、style.css；History/Current透過共用helper得到新label。改寫舊小時測試為工作天測試，更新README、本文件及瀏覽器fixtures。
2. Todo 欄位：`createdAtWorldTime:number|null`、`assignmentWorkdayIndex:number|null`、`deadlineProfileId:string`、`deadlineWorkdays:number|null`、`dueWorkdayIndex:number|null`。保留原createdAt，Status不存檔。Pending的created/assignment/due為null，正式釋出才建立。due=assignment+deadlineWorkdays；deadlineWorkdays=null代表無期限。
3. `getDeadlineWorkdayIndex(t)=floor((t−scaled(workStartAnchor))/dayDuration)`。index從0開始；第一天錨點前為-1。`time.workStartAnchor`沿用現有referenceDayDuration刻度，暫定8；60秒日長的日內8秒、180秒日長的24秒切工作日。這是期限日界設定，沒有重寫角色早餐或睡眠流程；不是硬編碼08:00或午夜。
4. `getAssignmentWorkdayIndex(t)`取calendar index；日內時刻小於scaled(offWorkAnchor)歸屬當天，包含清晨、上班前；等於或晚於下班錨點歸屬下一天。夜間Pending釋出採同一工具，不被算成已經用掉一整個工作日。
5. PROVISIONAL Profiles：BOSS_URGENT=0；REWORK_SHORT=1（含CORRECTION/MISSING_INFO）；CLIENT_REPLY=1；NEW_REQUEST=2；NORMAL=2（普通/未分類FOLLOW_UP/EVENT）；PROJECT=3（子任務與PROJECT_NEXT_STEP）；NO_DEADLINE=null。URGENT亦用BOSS_URGENT。普通與Follow-up模板可指定profile或deadlineWorkdays；Project Template和Subtask可指定profile或整數/null工作天，子任務優先，測試覆蓋5與4工作天。Project Parent狀態/DAG/獎金/原未啟用deadline欄位未改，沒有增加Parent期限。
6. 移除Runtime Todo的dueAtWorldTime、deadlineGameHours、dueSoonLeadGameHours；移除min/max hour profiles、ratio、hours RNG和hour/day倒數格式。舊存檔只在load相容層讀到舊欄位後刪除：缺dueWorkdayIndex的Todo以有效Profile或source預設、目前assignment day重建，保留錢、工作進度、專案、產品、永久能力。舊欄位不控制任何新期限，不寫回Save。
7. Selector維持原weighted random與priority，urgency改為OVERDUE > DUE_TODAY > NORMAL/NO_DEADLINE。已逾期和今日到期工作新增作息估時豁免，因此不再被fit filter排除而讓普通未到期Project搶先。正常普通工作仍需能在午休/下班前完成。已開始工作繼續做完，原下班Boss流程保留。
8. Status：due=null→NO_DEADLINE；currentDeadlineWorkday>due→OVERDUE；相等→DUE_TODAY；小於→NORMAL。未逾期全部全額；OVERDUE完成乘既有Config0.7，沿用原完整報酬與最終round。完成瞬間恰好是(due+1)的workStartBoundary，使用共用completion判定視為DUE_TODAY、全額；真正超過才逾期。Product bonus差額與Log使用同一completion結果，沒有隱藏第二層懲罰。
9–10. 午夜只改Calendar Day，Deadline Workday不變，正常睡眠不誤逾期。睡過新workStart時，世界時鐘照常前進，Deadline日界仍切換，故睡眠中的待辦正確逾期。Offline依原minutes/day換算與advance，沒有平行deadline模擬；工作日起點已列為boundary。非阻擋LINE通知每工作日最多一次；初始化在工作日途中不假裝午夜剛上班。
11. 39項直接工作天測試涵蓋使用者要求的30項：午夜與workStart、workday9/10/11、睡眠跨日/睡過錨點、精確準時與真正超時、各Profile、Project override、無期限、晚間/清晨assignment、夜間pending、三層排序與權重、不打斷current、完成報酬、Offline、14/4/2統計、current/pending排除。另測普通urgent跨作息優先於新專案、正常工作fit保留、每日單次通知、180秒缩放、label、舊Save移除雙欄位、無RNG、無期限競爭、Offline精確完成邊界。Profile測試檔另3項測Config無舊欄位、0/null模板覆寫與中途初始化不發午夜通知。瀏覽器新增睡眠午夜→workStart驗證；其餘Deadline UI/Debug/無期限/原收益loss/layout驗收同步更新，非Deadline核心78項保留。
12. `npm test`：120/120通過（原非Deadline78 + 工作天42；舊小時模型測試被替換，所以總數不是在129之上加總）。
13. `npm run test:browser`：17/17通過，含中央卡未被底部導航遮住、睡眠跨午夜與錨點及頁面無錯誤。
14. `npm run build`：TypeScript/Vite成功；71 modules，JS315.38KB/gzip97.64KB，CSS29.90KB/gzip7.22KB。未Commit或Push。
15. 待平衡：全部Profile的0/1/1/2/2/3/null工作天、workStartAnchor8與收入倍率0.7。日長60及reference60沿用原Config；工作天相同意義在180秒日長自動縮放，沒有期限隨機範圍。沒有新增升職限制、壓力、額外返工、自動失敗或刪除。

Debug提供Add Due Today/Overdue/Normal/No Deadline、Due In1/3 Workdays、Set Deadline Workday（第一個queued，否則current）、Jump To Next Work Start、Jump Before Work Start，並可檢查Profile/assignment/duration/due。時間跳轉走原advance，不重置world或中斷當前活動。首頁/列表/中央工作顯示「今日到期／已逾期／明天／幾個工作天後／無期限」，沒有精確小時期限倒數。

# 年齡工作量、產品補償與升職逾期門檻（2026-10-05）

1. 修改檔案：`src/config/v2Defaults.ts`、`scripts/config.ts`、`config/game_config.xlsx`、`config/generated/game_config.json`；新增 `scripts/update-age-promotion.ts` 與原表備份 `config/archive/game_config-pre-age-promotion.xlsx`。核心：新增 `src/game/work/ageWorkload.ts`、`src/game/career/promotion.ts`；修改 `state/gameState.ts`、`work/workStats.ts`、`work/todoManager.ts`、`work/followUpManager.ts`、`projects/projectManager.ts`、`events/bossEvents.ts`、`engine/SimulationLoop.ts`、`engine/actions.ts`、`engine/debugActions.ts`、`save/saveGame.ts`（上述路徑皆在 src/game）。UI：`src/components/Upgrades.tsx`、`Products.tsx`、`DebugPanel.tsx`。測試：新增 `tests/age-promotion.test.ts`、`tests/browser/age-promotion.spec.ts`。文件：README 與本文件。
2. 年齡倍率統一由 `getAgeWorkloadMultiplier(age)` 讀取 `age.workloadCurve`；`createWorkloadSnapshot()` 保存基礎量、職級倍率、年齡倍率與最終 workload。公式：baseWorkload × rankWorkloadMultiplierAtCreation × ageWorkloadMultiplierAtCreation。
3. 普通、急件、老闆、事件工作在 createTodo 套用；六種 Follow-up 先還原來源基礎量，再乘 Follow-up factor、來源職級快照及本次年齡。Project 子任務在真正 unlock 時套年齡；Pending 在正式 release 時套年齡。已接下來的 queue/current/suspended 工作不隨生日重算。老闆基礎維持一遊戲小時，日長縮放在基礎量階段完成。老闆修改檔案正確路徑是 `src/game/career/bossEvents.ts`。
4. 已確認年齡不扣工作效率、品質、收入倍率或生活效率；不改事件機率、生成數量及期限。工作處理速度只因啟用的產品補償增加。
5. 產品效率補償：max(0, currentAgeWorkloadMultiplier − 1) × compensationRate；最終工作速度乘 (1 + bonus)。停用、到期續費失敗或 Prestige 清除產品後立即失去補償，保留目前工作量與進度。離線年齡保護維持原有 ×0.50。
6. PROVISIONAL 年齡曲線：22–29 歲 ×1.00；30–39 ×1.10；40–49 ×1.25；50–59 ×1.45；60+ ×1.70。集中於 Excel 的 age.workloadCurve，生成 JSON 使用相同資料。
7. agecare 的 ageEfficiencyCompensationRate 暫定 0.50；其他產品為 0。40 歲 +12.5%、50 歲 +22.5%、60 歲 +35%。部分抵銷後工作時間仍比年輕時長。
8. `getUnresolvedOverdueWorkCount()` 包含 Todo Queue、Current WORK、Suspended WORK，按 ID 去重並使用共用 getDeadlineStatus 判定 OVERDUE。排除已完成、Pending、Project Parent、DUE_TODAY、NORMAL、NO_DEADLINE 及非工作需求。按下升職時重新檢查，沒有只看 UI 快照。
9. 目標職級門檻依序：一般員工最多 3 件、資深員工 2 件、主管 1 件、經理 0 件。新人欄位 0 不用作第一次升職門檻；判定一律取下一職級。金錢與逾期門檻必須同時符合。升職保留 Todo、進度及期限。
10. 新增 49 項核心測試：年齡五段、各工作類型與六種 Follow-up、多代不重乘、Project unlock、Pending release、生日快照、產品啟停/續費失敗/Prestige、補償數值、離線跨生日與 tick 一致性、品質/收入/期限/生成機率不變、升職金錢與逾期雙門檻、Current/Suspended 防漏算、ID 去重與排除項目、完成逾期後解鎖、舊存檔兩次載入。22→61 歲長模擬使用測試限定一年一天，測後恢復 Config 的一年 365 天；續以離線模擬檢查有限數值與工作量快照。新增 2 項手機瀏覽器測試，檢查升職鎖定理由、產品實際效果、Debug 與橫向溢出。
11. `npm test`：172/172 通過（原 123 + 新增 49）。
12. `npm run test:browser`：20/20 通過（原 18 + 新增 2）；截圖存於 tests/artifacts/age-promotion-lock.png 與 age-product-effects.png。
13. `npm run build`：TypeScript/Vite 成功，73 modules；JS 321.79 KB / gzip 98.87 KB，CSS 29.90 KB / gzip 7.22 KB。未 Commit 或 Push。
14. 待平衡：年齡曲線五段、產品補償率 0.50、升職逾期限制 3/2/1/0，以及既有職級 workloadMultiplier、產品價格/期限/離線年齡倍率與一年 365 天。全部沿用 Config 架構；沒有新增壓力條、懲罰或生產機率。
15. 已處理重複乘算風險：Follow-up 不直接以父任務已放大的 workload 再乘年齡/職級；Project 建立時不預乘年齡；Pending release 從基礎快照重算；生日不改正式工作。舊存檔缺快照時以既有 workload 作基礎、兩個歷史倍率補 1，保留原需求與進度，不臆測歷史倍率。正常新任務的 base × rank × age 與 workload 一致性有測試；舊 Debug 手動改 workload 也有還原相容處理。

