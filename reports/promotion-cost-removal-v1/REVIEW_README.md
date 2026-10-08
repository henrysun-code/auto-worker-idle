# Promotion Cost Removal V1 Review Package

本包為本輪審查快照，不是整個 Workspace 或所有歷史測試的備份。

先閱讀 reports/promotion-cost-removal-v1/REPORT.md，再對照 results.json、verification.json、各 CSV。

包含：目前完整 src、public、assets、正式 Excel／generated Config、可重跑配對測試的舊 runtime（加相同唯讀 hook）、上一輪配對摘要及購買原始資料、兩個測量／報告腳本、本輪正式升職測試與 browser test、完整 Repository 核心446／browser32測試及 build logs。

所有路径為專案相對路徑，無本機綁定。沒有 node_modules、.git、個人 Save、環境秘密或歷史大型模擬資料。

重跑：npm ci；npx tsx scripts/promotionCostRetest.ts；python scripts/reportPromotionCostRetest.py。
本包 npm test 僅包含正式 Promotion 測試44項；完整 Repository 446項及32 browser測試結果見 logs。
本包 browser測試：npx playwright test tests/browser/promotion-v1.spec.ts（需要本機 Edge，或自行調整browser channel）。

baseline-runtime只供BEFORE模擬，保留舊Money Gate；正式遊戲只使用根目錄src。舊Career工具與歷史Balance測試未全部包含，不能把這個精簡包當作完整歷史Repository。

沒有其他Balance修改、沒有AutoTune／升職預留金，也沒有Commit、Push、部署。公開網頁尚未更新。
