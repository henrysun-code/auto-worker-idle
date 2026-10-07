# Product Framework Review V1 — 修改前 Audit

實際閱讀正式 Config、Product State／Manager／Billing、SimulationLoop、WorkStats、Age、Problem、Sleep、Promotion、Meeting、Save、Offline、Prestige、Products UI、Debug 與 Config converter。修改前完整 source／Config 快照保留於 baseline-runtime，並以 SHA256 manifest 固定基準。

## 現況

正式產品 7 個：quick、wound、eyes、sleep、itch、agecare、care；價格依序 80、95、85、90、75、120、100。皆 30 個完整 Game Days 共用訂閱週期。

實際使用 4 種 Effect Type：FOOD_OPTION、PROBLEM_RESOLVER、OFFLINE_AGE_PROTECTION、TAGGED_WORK_REWARD。SLEEP_MODIFIER 只有 Type 宣告，沒有正式產品或 runtime hook，不能宣稱已支援。sleep 產品實際是 PROBLEM_RESOLVER，不改固定 Sleep Window。

共用 Subscription 以 active、nextBillingWorldTime、pricePerBillingPeriod、billingPeriodDays 與 contributionStats 保存狀態。Toggle／Renew／processBilling 共用，不存在各產品自行續費或自行维护到期時鐘。Disable 不退費、不延長已付期限；期限內恢復不重複扣款；續費失敗 active=false 且 nextBillingWorldTime=null。收入完成先於同 timestamp Billing。離線走原 SimulationLoop；Prestige 回到 inactive 初始狀態。

沒有核心系統根據特定 Product ID 字面值計算效果。一般 id lookup 是 Target 或 UI 的資料關聯，不是商品特例。author Config 的 agecare ID map 是資料建立 shorthand；Debug 預選 eyes 也是 UI 預選值，不是效果規則。

## 缺口

1. 沒有統一 Effect Registry。年齡补償相加、離線年齡倍率相乘、Tagged Reward 相加、Problem 取 Config 第一個匹配與 Food 使用選定方案分散於不同檔案。
2. Config validator 缺 unique ID、完整欄位型別／未知欄位、有效效果、疊加政策與不相容組合檢查；甚至允許沒有實作的 SLEEP_MODIFIER。
3. UI 的效果／貢獻文案分散在 Products Component，應中央化並保持原文字。
4. 舊 Save 缺少新 Config 產品時會因完整 shape 驗證失敗，尚未具備增量補 inactive subscription 的能力。
5. 現有 flat schema 是一個 primary effectType 加參數，以及通用 ageEfficiencyCompensationRate；可保留並提供 normalized effect view，不必破壞舊 Config 改成另一份 effects[] 儲存格式。Food 效果由 food Config 關聯，新增同類飲食方案需要相應 Food Config 資料，仍不需核心程式修改。
6. Product 的 allowedTargetTypes／其他 context 欄位目前沒有參與 Problem Resolver 選擇；不能為了整理而突然啟用，否則改變既有結果。保留並標示 UNUSED_CURRENT_METADATA。實際 Problem scope 是 tags 與 Event Config。
7. active 等價於效果 enabled；目前不另存首次 activatedAt 或歷史 billing timestamp，正式生命周期只依 nextBillingWorldTime。這輪不增加會改變舊核心 State 的日期欄位。

## 修改前評級：MINOR_REFACTOR_REQUIRED

必要整理限於中央 effect registry／resolver／presentation、產品 Config validation、通用 Subscription 初始化與舊 Save 增量補值、現有通用 hook 改呼叫 resolver、測試及文件。所有正式數值保持 deep-equal，Before／After 每個產品生命週期與受影響系統須用保存的舊 Engine 實際比較。

不增加正式產品、不實作新 Effect Type、不改 Sleep／Meeting／Boss／Promotion 規則，不做 Career 900 或平衡校準。
