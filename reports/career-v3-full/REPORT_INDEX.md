# Career V3 Canonical 900 Report Index

目前執行狀態與最終驗收以 `career-v3-sanity.json` 為準。

- `CAREER_V3_FULL_REPORT.md`：30 個 Policy × Timing 組別的完整結果、方法與限制。
- `FIRST_COMPANY_PACING.md`：NEVER 的 150 條第一家公司 pacing。
- `CAREER_V3_VS_PREVIOUS.md`：同 Policy／Timing／Seed 與旧 manual promotion 資料配對。
- 八份 `career-v3-*.csv`：摘要、900 明細、Rank、Promotion、Bottleneck、Ability Threshold、Prestige、Time Budget。
- `canonical-part-0/` 到 `canonical-part-2/`：三個互斥運算分區原始觀測與完整 manifest，各 300 條。
- `batch-preflight-after.json`、`observer-verification.json`：最新 deterministic preflight 與觀測完整 State／RNG 比對。
- `career-v3-config-verification.json`、`prior-gate-verification.json`：正式設定／Source／Excel 保護與前置 Gate。
- `canonical-core-tests.log`、`canonical-browser-tests.log`、`canonical-build.log`：本輪最終 Regression。
- `snapshot-level-lookup.json`：原始快照欄位解讀的正式 API 精確對照。

`blocked-before-boundary-fix/` 和既有 `CAREER_V3_BLOCKING_BUG.md` 是已修正的上一輪證據，保留原樣。它們不是本輪結果；新 review ZIP 不混入旧阻擋結論。

CSV 空白為未達成／缺失，censored 欄位保留原因。不要把空白解讀成 0。

本輪不修改任何正式玩法或 Balance，不新增功能，不 Commit／Push。
