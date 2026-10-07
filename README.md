# 全自動打工人。 V2 / 2.0.0

## Product Framework Review V1

產品框架評級 CONFIG_READY。正式7個產品、4種已實作效果及所有Balance不變；中央Schema／Registry／Resolver／Presentation與Config validation支援既有效果的Config-only擴充。FOOD_OPTION需一併提供Food Config；SLEEP_MODIFIER僅保留未實作型別，不能使用。舊Save增量補inactive產品，不改已有Subscription。

報告在 `reports/product-framework-v1/`，含修改前Audit、Implementation Report、Inventory／Matrix／Branch CSV、Config deep-equal及119組完整State Before／After結果。`tests/product-framework.test.ts`驗證生命週期、疊加、相容與Test-only A／B；Browser以記憶體Config驗證UI／Expiry，不污染正式資料。`npx tsx scripts/verifyProductFrameworkConfig.ts`比對本輪已保存的正式基準。此輪沒有產品調值或Career 900。

## Promotion Assignment V1（本輪正式規則）

每個 WorkStart 使用穩定 E/Q、資金與未解決逾期數評估一次。達標安排當晚考核，取代該晚普通 Boss 判定，晚餐後才開始。考核使用唯一 SimulationLoop 與 effectiveWorkSpeed，但不進 Todo／Project／Follow-up，也不給普通工作報酬。完成時透過共用 promoteTransaction 再次確認資金與逾期條件並扣款升職；恰好下一個 WorkStart 完成算成功，未完成清除並等待 3 工作日。下列歷史手動升職描述由此規則取代。

低調摸魚 ON 只將升職判定 E/Q 乘以 0.8，不改實際工作；白天切換等下次 WorkStart，已安排考核不取消。特殊考核固定工作量 130／209／330／507，不乘 Rank 或 Age。舊存檔增量補值，Prestige 清空考核與低調。離線保留原本世界與一般工作結算，但不新建或完成考核；既有考核進度暫停，專屬期限按離線實際推進的世界秒數平移，回到線上繼續。

規格及測量見 [Promotion V1 報告](reports/promotion-v1/PROMOTION_V1_IMPLEMENTATION_REPORT.md)。`npx tsx scripts/promotionIsolation.ts` 執行 16 情境 ×30 次受控晚間隔離；`npx tsx scripts/verifyPromotionConfig.ts` 驗證既有 Excel 設定列完全相同。新增考核數值均為 PROVISIONAL，沒有重新校準 Career。

## 職級內容權重補強

保留最低職級累積解鎖，Work／Project 的 `rankWeights[currentRank]` 為有效權重；缺少整個 rankWeights 欄位才使用舊 weight，有欄位但指定職級為 0 則不生成。集中 helper 在 `src/game/work/templateWeights.ts`。新增 14 個 Normal Work、4 個各 8 步的 Project DAG；22 個普通工作、5 個專案的全部內容與權重維持 Excel 為 Runtime 單一來源。數值均 PROVISIONAL，不是最終平衡。

`scripts/update-rank-content.ts` 是一次性增量腳本，保留原內容與其他設定，Excel 原表備份在 `config/archive/game_config-pre-rank-content.xlsx`，不在日常 dev/build 自動重跑。既有工作量、品質、期限、進度保持，Reward 依完成時目前 Rank 動態更新是正式設計；沒有 Reward Snapshot。Project Parent 獎金仍沿用既有建立時快照，Project 子任務 Work Reward 動態依 Rank。

Debug 提供 Set Rank 0–4，列出可生成 Work／Project 與有效權重。`npx tsx scripts/test-ranks.ts` 沿用原 Runner，各 Rank 10,000 Work draws、10,000 成功 Project 選取與 30 seeds ×30 工作日；輸出於 `reports/rank-tests/`，上一輪報告保留 `reports/rank-tests-pre-content/`。`rank-work-group-share.csv` 比較 Template Rank 群組理論、抽樣與真實 Runtime 占比。完整交付見 `RANK_CONTENT_DELIVERY.md`。

老闆通知校正：晚餐前的找人／逃跑判定以一條完整結果即時呈現，優先於舊工作通知；詳細步驟仍保留在紀錄。讀檔不重播舊老闆浮動通知，避免吃飯或睡覺時才看到過期判定。通知維持最多兩條，不暫停世界鐘或改變判定機率。

在原有 Vite + React + TypeScript 專案內完成核心重構。保留手機版外殼、配色、需求怪與角色美術、通知動畫、日常／升級／產品／紀錄四頁導航。遊戲完全自動，玩家只投資能力、選擇升職、管理訂閱與 Prestige。

## 啟動與驗證

Node.js 22.12+（Node 24 測試）：

```sh
npm install
npm run dev -- --port 5176
npm test
npm run build
npm run test:browser
```

Build 輸出 `dist/`，`base: './'` 支援網站子目錄。遊戲成品不依賴 Workspace、shared、其他遊戲或本機絕對路徑。瀏覽器測試使用本機 Microsoft Edge；截圖位於 `tests/artifacts/`。

## 核心循環

目前正式規則見 [V2_CORE_MODEL_UPDATE.md](V2_CORE_MODEL_UPDATE.md)。後面歷史校正段落的睡過頭、舊永久倍率表已被本輪規格取代。歷史 Rank Balance 報告保留，不適用於目前版本的平衡結論。

早餐 → 上午工作 → 午餐／午休窗口 → 下午工作 → 老闆注意／逃跑判定 → 晚餐 → 強制老闆加班（若有）→ 娛樂（時間不足略過）→ 固定睡眠窗口 → 隔日上班。

**世界時間不等角色。** 唯一權威時間是 `world.totalWorldTime`。`dayIndex` 從 0 起算，畫面 Day 從 1 起算；`timeOfDay` 每日固定歸零。任何工作、食物、Problem、睡眠都能跨日；只有 LUNCH 是固定世界時間窗口，到結束錨點就不再產生休息值。

Prototype 一天 60 秒，早餐可開始窗口為 0～8 秒（8 秒起不能開始），午休 20～28 秒，下班 40 秒，就寢 50 秒。`time.dayDuration` 可改成 180；其餘時間欄位以 `referenceDayDuration` 的刻度設定，執行時按比例換算。因此只改一天長度也能正確移動作息錨點；需要不同作息時再修改各欄位。食物需求量與工作池數值可以另外平衡。

工作 24 秒才完成，仍須吃午餐；普通餐點處理 4 秒，28 秒時已無午休可休息。快速餐點需求較少，會留下較多休息時間。午休累積輸出由生活管理、午休永久路線及狀態決定，再按 Config Tier 給下午 Buff；未休息只是不獲得 Buff，不另外堆疊午休懲罰。

睡眠固定窗口為50秒至隔日WorkStart（8秒），共18秒。只累積實際睡眠輸出，隔日上班錨點一定終止睡眠，沒有睡過頭。Boss強制加班可跨整個窗口，該段睡眠輸出為0；工作不因此中止。現有早餐截止也是8秒，因此睡到窗口終點會錯過早餐，本輪沒有移動早餐窗口。

三餐為作息流程，早餐有截止。`food.allowWorkInterruption` 預設 true：工作時飽足到期可插入 EXTRA FOOD，處理完恢復原進度；錯過早餐不更新飽足、不另加早餐懲罰。預設食物仍由產品頁設定。

## Todo、品質與專案

日常工作只在 Todo 低於 `todoLowWatermark` 時補至 `todoRefillTarget`。角色只從 Todo 選取，集中在 `selectNextWork()`，先比 Deadline urgency，再比 priority，最後加權隨機，不固定 FIFO。普通工作仍檢查是否能在下一作息節點前完成；已接取工作一定完成，專案與老闆工作可跨節點。未處理的 Todo 保留到下一工作時段，待辦多不另外扣效率。

效率只決定工作速度。品質影響 REWORK／CORRECTION／MISSING_INFO 的機率及觸發後件數，低品質留下低收入或零收入待辦；CLIENT_REPLY／NEW_REQUEST／PROJECT_NEXT_STEP 不受品質直接抑制。各工作有品質要求，高階要求會提高能力不足時的返工風險。當輪能力是 base + level × increment 的線性數值，費用才採成長曲線。

Follow-up 可一次新增多個、立即出現或先進 `pendingFollowUps`。延遲時間到才加入 Todo。深度與 Root Work 額外數量上限涵蓋已預約的延遲任務，防止無限延伸；專案另有總額外任務上限。

每個 Routine 首次準備進上午工作判定一次專案，不依附早餐完成，錯過早餐也會判定；與 Todo 水位無關。模板依 enabled／rankRequirement 篩選，再以 weight 選取。Parent Project 由資料化 Subtask DAG 組成，只有依賴已完成的步驟入隊。主要 Subtask 完成解鎖下一步，還可能額外生成 Follow-up；主要步驟全完成即發 Parent 獎金並轉 DELIVERED；Todo／Pending／Current／Suspended 都無該專案工作後才 CLOSED。

拍馬屁提高工作收入與老闆找到率；摸魚只提高被找到後的逃跑率。兩次獨立判定，逃跑失敗才把 Boss Task 加入 Todo。老闆基礎需求保留 1 遊戲小時，再套用職級、年齡難度；Buff／Debuff 改變處理速度。

## 產品與事件

七種產品類型：快速食物、傷口、用眼、睡眠、搔癢、抗老、保養／形象。全部是遊戲事件描述，沒有聲稱真實醫療效果。正式名稱與美術可日後替換。

產品以當輪金錢啟用，首次扣款獲得 `billingPeriodDays`（預設 30）個遊戲日。使用 nextBillingWorldTime，從付款時刻精確取得 30 個完整日長；時間到自動續費；不足就停用，不負債。可同時維持所有產品。手動停用保留已付到期時刻，世界時間仍消耗期限；期限內恢復不重複收費。續費失敗清除到期時刻，不自動恢復；手動重啟付款取得新的完整期限。

事件先建立 Debuff。沒有有效對應產品，Debuff 自然倒數；有產品可生成 PROBLEM Target。插隊與優先級由事件 Config 決定，必要時將原 Target 放入 `suspendedTargets`，處理完恢復原進度。非立即問題等現有 Target 完成後再處理。

Problem 完成提前移除原 Debuff，建立專屬 Protection Buff，限制同類事件或降低機率，不是通用效率大加成。處理中訂閱失效或 Debuff 已自然結束，取消問題並恢復原 Target。產品頁按用途分列啟用／觸發／處理／用餐次數、提前解除秒數、進食節省、額外工作收入、離線年齡保護與本輪支出，避免混合單位。

## Prestige

「該醒了，別做夢了」達到 Config 的職級／收入條件即可選擇，不等崩盤。醒來清除當輪金錢、五項能力、職級、Todo、Pending、專案、Buff／Debuff、訂閱、年齡與當輪統計。保留清醒值、永久升級、永久統計。

八條永久路線：工作效率、工作品質、工作收入、生活管理、午休輸出、專案獎金、老闆任務報酬、起始資金。升級頁切到「永久升級」使用清醒值購買。公式總倍率為multiplierBase^Level，目前PROVISIONAL base=1.10，Lv3總倍率1.331；費用ceil(baseCost×costGrowth^Level)，沒有有限陣列長度上限。

獎勵獨立由 `calculateClarityReward()` 計算，參考本輪收入巔峰、最高職級、最高專案層級、完成工作進度與嚴重狀態。

## 離線

`offline.minutesPerGameDay = 30`：每 30 現實分鐘結算一遊戲日，16 小時結算 32 日，沒有 2／4 小時之類低上限。不滿 30 分鐘累積到 `offlineCarryMinutes`；例如 20 + 15 分鐘得到一日與 5 分鐘餘數。

離線以完整遊戲日換算進入事件驅動模擬，跳到工作完成、Pending、午休、事件／Buff 到期、世界換日等重要節點；不逐秒或每 0.05 秒重播。這樣能共享核心規則，按續費邊界正確停止效果，處理已有專案與合理後續，也依 elapsedWorldSeconds / dayDuration 同步增加人生進度。抗老產品只在真正有效時間區間按 Config 的 `offlineAgeProgressMultiplier` 降低年齡進度。離線不升職、不購買能力、不花清醒值、不自動 Prestige。

存檔包含 lastSeenAt；引擎載入後立即保存已結算結果，避免重新整理重領同一段離線。開著頁面屬在線模擬，關閉再回來才按離線換算。

## 設定與架構

`src/config/gameConfig.ts` 是 Runtime 入口，完整作者預設在 `v2Defaults.ts`；work／project／product／prestige／event Config 提供各系統入口。Runtime 只讀 `config/generated/game_config.json`。

`config/game_config.xlsx` 的 Balance 表使用 key／value／description；陣列以 JSON 編輯。`npm run config` 驗證並生成 Runtime JSON，Dev／Build 自動先轉換。Dev 監看 Excel 更新。`config:seed` 明確還原作者預設，會先備份現有表。

V1→V2 核心的舊表備份在 `config/archive/game_config-pre-core-v2.xlsx`；避免讓新規則繼承不相容欄位。

模組：

- `game/state/`：乾淨巢狀 State 與初始值。
- `game/engine/`：單一在線 Loop、純模擬、玩家操作與 Debug。
- `game/time/`：世界時間、作息與離線。
- `game/work/`：Todo、選取、品質、Follow-up、能力／收入。
- `game/projects/`：依賴解鎖與專案完成。
- `game/targets/`：Target／作息管理、Problem 優先級與恢復。
- `game/events/`、`game/buffs/`：遊戲事件、限量紀錄與效果計時。
- `game/products/`：啟用狀態、貢獻資料與日界續費。
- `game/career/`：兩段老闆事件；升職操作在 actions。
- `game/prestige/`：永久能力與醒來獎勵／重置。
- `game/save/`：V2 保存、驗證與舊測試資料備份。

新增工作修改 `work.templates`；新增 Follow-up 修改 `followUps.types`。新增專案修改 `projects.templates` 與依賴，Config 會驗證缺失依賴／循環。新增產品／事件修改對應 definitions；新效果類型需要擴充對應獨立模組。新增永久路線可在永久 Config 添加倍率與費用，必要時擴充 State 的 PermanentId。

保留 `012s:gameStart` 與 `012s:gameComplete` Window 事件，醒來後正常開新輪。

## V2 Save

`saveVersion = 2`，以 `coreVersion = 'todo-v2'` 區別舊 Prototype 同樣叫 version 2 的扁平存檔。新 key 為 `012s:auto-worker:v2`。

不相容測試資料顯示「新版核心已更新，測試資料需要重置」，保留原始 legacy key 並複製到 `:legacy-backup`；損壞 V2 保存到 `:recovery`。不再維護複雜舊模型遷移。

## Debug 使用

右上角 Debug，不暫停時間。

- 角色：設定金錢、年齡、職級、五項能力；1x／2x／5x／10x。
- 時間：向前推進指定 Day，跳到午休／下班／睡眠錨點，途中仍照常模擬，不強制中止當前目標。
- 工作：生成日常／一次 +10／清空 Todo、立即／延遲 Follow-up、Pending 清單／立即觸發。
- 專案：建立 Project、完成當前可用 Subtask。
- 老闆：強制找到／逃跑成功／逃跑失敗。
- 事件：強制眼睛／傷口／搔癢／睡眠不足；測試 FOOD 暫停工作。
- 產品：選擇產品，啟用／停用，設定剩餘日數，強制續費。
- 永久：增加清醒值、設定任一路線的倍率表等級、開啟醒來條件／強制 Prestige。
- 離線：30 分鐘／16 小時。
- Reset V2 Save：二次確認，清除 V2 當輪與永久測試資料；舊備份保留。

清空 Todo 後，若角色正處於工作時段，下一個模擬步驟會依低水位規則補充，這是預期行為。

## 待平衡與驗收

數值不是正式平衡：工作量／收入、Follow-up 機率／數量／延遲／鏈上限、職級風險、專案獎金／生成率、午休 Tier、各餐處理量、生活需求、事件頻率、產品 30 日價格／保護／抗老、永久倍率與費用、Prestige 獎勵及 daysPerYear 全部已 Config 化。

daysPerYear 暫定 365，屬待平衡值。Debug 提供 Set Age 與 40／50／60／70 歲快捷，不再改正式 Runtime 年長測試。60 歲不死亡、不自動醒來。

測試：78 項核心與 13 項瀏覽器驗收。核心含 480 秒多日循環、加速一致性、180 秒日長、離線／續費／抗老、複層中斷、存檔與損壞恢復。瀏覽器覆蓋 320／390／460／1280px、八種 Target、Debug 操作、永久倍率、訂閱、離線 32 日、醒來與重整，檢查頁面錯誤與布局。

第一輪建議：先看 Todo 和返工 → 買效率與品質比較 → 看午餐侵蝕午休 → 啟用快速食物比較休息值 → Debug 建立專案／延遲後續 → 產品啟用前後強制相同事件 → 分開測老闆找到與逃跑 → 模擬離線 16 小時與續費失敗 → 醒來購買永久倍率並重整。

完整變更與本次 A～G 校正交付見 `V2_REFACTOR.md`。未 Commit／Push，未改其他遊戲。

## Core 規則校正／邊界順序（2026-10-05）

同 Timestamp：以區間起點效果推進 Target 與年齡 → 移動世界鐘／重算派生時間 → 完成 Target（收入、Follow-up、專案獎金、FOOD、Problem、Sleep）→ 效果到期 → Pending 到期 → 精確產品續費 → 換日統計／早餐截止／午休結算 → Timed Event → 恢復／選取下一目標與專案結案。已完成的 Problem 可在同一時刻續費失敗前成功結算。

早餐前、截止、午休、下班、睡眠與次日錨點均經共用 scaledSeconds／routineAnchor 縮放。resumeSuspended 持續 pop 失效 LUNCH／PROBLEM／WORK，保留已付費 FOOD 即使訂閱失效。午休 Tier 與 Problem 提前解除秒數都有即時預估；首頁 Todo 提升至資產旁，列表增加類型／報酬／來源。

事件 Config 支援目標允許／排除、工作標籤、職級、世界時段、Protection 與 contextModifiers。眼睛只在適合工作發生；傷口不在睡眠；搔癢可工作／娛樂／睡眠。tired 不參與 Random Roll，既有熬夜／睡過頭 Debuff 使用睡眠事件的 Resolver 定義，不額外疊一個隨機疲勞懲罰。產品 EffectType 有 TypeScript union，保留未實作的 SLEEP_MODIFIER 擴充位。

lastOfflineSummary 保存現實分鐘、結算日數、工作／專案總收入、產品總支出、金錢淨變化、年齡、Todo、專案步驟及分類產品統計差值；另保存實際訂閱支出，避免跨離線邊界的已付款食物干擾計算。首頁摘要可關閉，不阻擋遊玩；History 保留上次摘要。20＋15分鐘結算1日的案例仍保留5分鐘餘數，摘要分列本次現實15分鐘與結算1日。

V2 Save key／saveVersion／coreVersion不變。讀檔先重算dayIndex／timeOfDay，再進行增量欄位轉換：舊剩餘日數轉成載入時刻加剩餘日長；舊DONE轉DELIVERED再判斷結案；保留舊輪顯示年齡並換算到新的年長尺度。舊統計沒有保存的觸發次數無法精確還原，暫以已知處理數為起點；校正後獨立累計。

Config 原表備份 `config/archive/game_config-pre-boundary-correction.xlsx`。`scripts/correct-core-config.ts` 為一次性升級腳本，保留既有參數，只補本次新欄位／明確指定的預設更改，日常啟動不會再次執行它。新增模板需配置weight／rankRequirement／enabled；qualityCountBands按有效品質／要求比例配置件數。

## Workday Deadline（取代 Game Hours 期限）

單一來源改為 assignmentWorkdayIndex + deadlineWorkdays = dueWorkdayIndex。所有狀態都是 derived：NORMAL／DUE_TODAY／OVERDUE／NO_DEADLINE。首頁為待辦、今日到期、已逾期；List與Current只顯示今天、明天、幾個工作天後到期或無期限，不顯示精確小時倒數。

`time.workStartAnchor` 採現有 referenceDayDuration 刻度，暫定8（60秒日長對應世界8秒；180秒日長對應24秒），與早餐截止相同；Deadline只在這個錨點切工作日，不在午夜切換。此錨點是期限日界，不改角色早餐或睡眠行為。工作日index从0起；第一天錨點前為-1。建立於下班錨點及之後，歸屬下一工作日；清晨歸屬即將開始的當天。Pending正式釋出才決定歸屬日。

PROVISIONAL／待平衡：BOSS_URGENT 0工作天、REWORK_SHORT 1、CLIENT_REPLY 1、NEW_REQUEST 2、NORMAL 2、PROJECT 3、NO_DEADLINE null。Template可填deadlineProfileId或deadlineWorkdays（含0/null）；Project Template與Subtask都可覆寫，Subtask優先。數值配置於Excel Balance的deadlines；收入折扣仍為70%。

選取先比已逾期、今日到期、正常／無期限，再比原工作優先級，最後原深度權重抽選。已逾期或今日到期工作可跨作息錨點接取，避免被不受估時限制的專案搶先；正常普通工作仍保留估時限制。已開始工作不為期限切換而中斷，晚餐／睡眠與下班臨時Boss流程保留。

完成瞬間恰好等於下一workStartBoundary視為準時；真正超過才套逾期折扣。午夜睡眠不變狀態，睡過新的workStart才逾期。SimulationLoop只加工作日起點boundary與一次通知，不重寫Loop。離線沿用原advance與換算。

舊V2 Todo缺dueWorkdayIndex時，以目前世界時間、Profile重建；刪除舊dueAtWorldTime／deadlineGameHours／dueSoonLeadGameHours等欄位，不保留雙模型。保留錢、進度、Project、產品與永久資料。已更新Excel並備份至config/archive/game_config-pre-workday-deadline.xlsx；一次性scripts/update-deadline-profiles.ts不在日常dev/build自動重跑。

完整15項交付與測試見V2_REFACTOR.md最新Workday Deadline小節。未Commit/Push。

## 年齡工作量／效率補償／升職交付條件

PROVISIONAL：年齡採階梯，22–29歲×1、30–39×1.10、40–49×1.25、50–59×1.45、60+×1.70。集中於age.workloadCurve及getAgeWorkloadMultiplier；不直接扣速度、品質、收益，不改Deadline或事件機率。Work Item保存baseWorkload、職級與年齡倍率快照；workload就是finalWorkload。已存在的工作生日後不變；Project子任務解鎖、Pending正式釋出時才依當下年齡建立正式Todo。Follow-up從未乘年齡的base派生，再套一次新年齡；沿用父工作的職級快照，避免再次疊職級。旧存檔補快照但保留既有數值與進度。

時光緩衝組保留離線年齡×0.50，新增ageEfficiencyCompensationRate=0.50：工作速度額外倍率=1+max(0,當下年齡工作量倍率−1)×補償率。50歲+22.5%、60歲+35%；不直接改小既有工作需求。停用、續費失敗或Prestige後立即失效。產品頁與Debug顯示當下實際數值，沒有新增首頁狀態條。

升職採資金與未完成逾期Work數共同驗證；可允許件數依下一職級maxOverdueAllowed：新人→一般3、一般→資深2、資深→主管1、主管→經理0。計數去重涵蓋queued/current/suspended，排除Pending/Parent/今日到期/正常/無期限。Action也會重算，不只UI disabled；升職不清工作或刷新期限。

Config原表已備份config/archive/game_config-pre-age-promotion.xlsx；scripts/update-age-promotion.ts只補新欄位，保留既有價格、機率與其他數值，不在dev/build自动重跑。長跑測試使用暫時daysPerYear=1加速22→61歲，正式365不變；額外年齡斷點boundary確保Offline或大Tick使用正確新速度與生成倍率。
## 批次情境模擬

### Meeting V1

`MEETING` 接入原 Target／SimulationLoop 與 `suspendedTargets`，是固定世界時間事件，沒有工作量、Deadline、Todo 或 Follow-up。時間為 `meeting.referenceMeetingDurationSeconds × dayDuration / referenceDayDuration`，暫定 3 reference 秒，不受能力、年齡、職級或 Severity 縮短。普通會議於 WorkStart 每工作日判定一次，依職級 2／4／7／12／18%，隨機排在上午或下午的工作區間，排除午休；不主動覆蓋 FOOD／LUNCH。

逃跑失敗後 25% 改為老闆會議、75% 維持原強制工作，兩者互斥。仍先吃晚餐；會議可跨 Sleep／WorkStart，保留剩餘秒數，睡眠依原窗口結算。固定補貼 5／10／20／40／80（PROVISIONAL）獨立於 Work Reward。Meeting State／排程／統計可保存；舊存檔增量補空狀態，當天不補 Roll。Debug 提供 Force Normal Meeting（工作階段）與 Force Boss Meeting，不額外消耗 RNG。

`npx tsx scripts/meetingIsolation.ts` 執行 Rank0／2／4 × Flattery0／100／200 × ON／OFF ×30 Seed，各120 active分鐘；不買能力、不升職，Products／Prestige／Offline OFF。`python scripts/reportMeetingV1.py` 匯出 `reports/meeting-v1/`，娛樂／睡眠損失由配對實測計算。報告保留既有兩輪 Career 資料，不會調整 Balance。

同時間點補強：午餐若已超過午休窗口，轉入下午後立即選取目標，避免等待下一個 Tick；餐點、午休優先與窗口不變。

### 第一輪 Balance V2 驗證

本輪正式平衡只改 `prestige.minimumPrestigeActiveMinutes=30` 與 `runUpgradeCurve.post200Growth=1.005`。`runStatistics.activeSeconds` 保存目前 Run 的實際在線秒數，速度倍率不加速此欄位，Offline／Debug 跳時間不增加；正常 Prestige 同時保留原職級與收入條件，重生歸零。舊存檔缺少此欄位時補 0，不由世界時間推算。

新報告在 `reports/career-progression-v2/`，保留原基準。職涯指令為 `npx tsx scripts/runCareerSimulation.ts <0|1|2> 3 --v2`，隔離指令為 `npx tsx scripts/flatteryIsolation.ts`，報告指令為 `python scripts/reportBalanceV2.py`。每組 30 Seed，職涯 900 Run 各 360 active 分鐘；拍馬屁隔離 300 Run 各 120 active 分鐘。既有輸出不得追加重跑；重現前另行保存輸出。隔離固定 Rank4 與能力等級，Age22 初始化後保留正式自然老化，整段仍在同一 22–29 年齡倍率帶。

### Career / Prestige（本次早餐修正後基準）

`scripts/runCareerSimulation.ts` 使用正式引擎與 actions，5 個升級／升職策略 × 6 個重生時機 × 30 固定 Seed，各跑完整 6 小時 active time。可用 `npx tsx scripts/runCareerSimulation.ts 0 3`（另兩個分區為 1、2）執行三個互斥運算分區；完成後 `python scripts/reportCareerSimulation.py` 匯出 CSV／JSON／報告到 `reports/career-progression/`。重新執行前應使用新的輸出目錄或人工保存既有報告；JSONL 採追加方式，不會默默覆蓋歷史資料。

策略是測試工具，不接入玩家自動操作。日表為固定累積 active 60 秒窗口；重生會重置當輪日曆但不重置測試總時間。未達里程碑保留 censored。只讀 instrumentation 對照完整 State／RNG，含 Rank0、Rank4 和重生循環。產品、Offline、Debug 均關閉，沒有自動修改 Balance。

本次另有兩次同種子指標復核，共 1800 次重播，不增加獨立樣本數；分別補齊娛樂跳過與餐費支出的升職資金區間。最終復核指令為 `npx tsx scripts/auditCareerEntertainment.ts <分區>`；匯出後依序執行 `python scripts/pairCareerRecovery.py`、`python scripts/analyzeCareerFindings.py`、`python scripts/applyEntertainmentAudit.py`、`python scripts/packageCareerReports.py`。最後兩步校正觀測／測試數與封裝檢查；同 Seed 兩輪都達成才計配對縮短率，未達樣本仍保留。

Sleep Window 在 WorkStart 結算後授予一次早餐資格，避免同 anchor cutoff 先判 MISSED；WorkStart 與 Deadline 日界保持原值。既有工作不被新增邏輯強制中止。Boss Follow-up 不繼承父工作的 `mandatoryOvertime`／`bossSeverity`，其餘生成規則維持。

進階配對版：`npm run simulate:paired`，每 Scenario 30 個種子，產品 ON/OFF 使用同一初始 seed，合計 960 條模擬，各跑 30 工作日並在 10／20／30 日輸出。`reports/paired-scenarios/` 包含各種子明細、每日結果、Scenario 平均、配對差值及配對 95% 區間；指標涵蓋時間加權 Average／Final／Peak Todo、期限狀態、生成／處理工作量、逾期完成與收入損失、產品成本／淨收入、返工與升職合格日比例／最長不合格連續天數。模擬觀測 hook 不保存到 GameState，不修改玩法或玩家存檔。完整定義見該資料夾 REPORT.md。

執行 `npm run simulate:scenarios`，以現有引擎跑 22／40／50／60 歲、有／無時光緩衝組、效率 Lv0／Lv5、品質 Lv0／Lv5 的 32 組條件，每組三個固定 seed，在第 10／20／30 個工作日取樣，共 288 筆。初始資金 $1,000、固定新人職級，不自動升職或買升級；產品正常付費續約。玩家存檔不受影響。

輸出 `reports/scenarios/REPORT.md`、`results.csv`、`results.json`；報告包含平均值與逾期範圍，CSV 含個別種子、queue/current/suspended 去重待辦、期限狀態、毛收入／金錢淨變化、已完成與尚未完成返工、升職資格和被擋原因；JSON 保留本次完整 Config 快照。此為初步比較，三個種子不能代替正式平衡驗證。

