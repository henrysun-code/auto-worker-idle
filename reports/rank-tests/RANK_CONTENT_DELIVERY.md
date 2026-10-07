# V2 職級內容補強交付（2026-10-05）

1. 修改檔案：新增 `src/config/rankContent.ts`、`src/game/work/templateWeights.ts`、`scripts/update-rank-content.ts`、`scripts/verify-rank-content.ts`、`scripts/rankReport.ts`、`tests/rank-content.test.ts`、`tests/browser/rank-content.spec.ts`、本文件；修改 `src/config/v2Defaults.ts`、`scripts/config.ts`、`src/game/work/todoManager.ts`、`src/game/projects/projectManager.ts`、`src/components/DebugPanel.tsx`、原 `scripts/test-ranks.ts`、README、Excel 與 generated JSON。Excel 舊表備份 `config/archive/game_config-pre-rank-content.xlsx`，舊測試報告保留 `reports/rank-tests-pre-content`。輸出 `reports/rank-tests` 的 CSV／JSON／報告。
2. Runtime 以集中 `getWorkTemplateWeight()`／`getProjectTemplateWeight()` 決定有效權重；正常生成先保留最低職級／enabled 條件，再排除有效權重 ≤0，沿用原 seeded weighted random。沒有配額或特殊百分比邏輯。
3. 缺整個 rankWeights 欄位時 fallback weight；有陣列且指定 Rank 為 0 則排除，不 fallback。Config 驗證長度等於 5、有限非負、解鎖職級或更高至少有一個正值；亦檢查每 Rank 有可生成池。舊 Todo／Save 不要求新增權重欄位。
4. 新增 Normal Work：Rank0 無；Rank1 需求彙整／進度更新；Rank2 客戶提案／跨部門協調／專案風險整理；Rank3 團隊進度審查／人力分配／主管報告／客戶問題升級處理；Rank4 部門策略規劃／預算審核／跨部門決策／高層報告／重大問題處理。共新增 14 種，總 22 種，既有 ID 保留。
5–6. 群組理論→10,000 draws 實際（依 Template Rank 從低至高）：

| Current Rank | 理論群組 % | 實際群組 % |
|---|---|---|
| 0 | 100 | 100 |
| 1 | 40.38／59.62 | 41.00／59.00 |
| 2 | 14.22／31.75／54.03 | 14.68／31.40／53.92 |
| 3 | 4.53／12.45／37.74／45.28 | 4.54／12.59／37.77／45.10 |
| 4 | 1.48／4.28／17.13／30.97／46.13 | 1.35／4.82／17.53／30.67／45.63 |

7. 新增 Project：Rank1 客戶活動企劃、Rank2 跨部門整合案、Rank3 團隊流程改善、Rank4 年度策略規劃。每個 8 個 Subtasks，照附件指定平行與串行依賴建立；原 launch 的內容及 DAG 未改。parentReward 對應既有模板 reward 欄位；新 Project 的既有未啟用 parent deadlineDays 欄位沿用暫定 3，不引入期限新模型。
8–9. Project 理論→每 Rank 10,000 成功選取實際（依新品提案／客戶活動企劃／跨部門整合案／團隊流程改善／年度策略規劃排列，未解鎖不列）：

| Rank | 理論 % | 實際 % |
|---|---|---|
| 0 | 100 | 100 |
| 1 | 33.33／66.67 | 33.98／66.02 |
| 2 | 13.79／34.48／51.72 | 14.16／34.56／51.28 |
| 3 | 4.76／15.87／31.75／47.62 | 4.69／16.78／31.56／46.97 |
| 4 | 1.32／6.58／13.16／26.32／52.63 | 1.27／6.93／13.65／26.24／51.91 |

精確數值按指定權重計算，因此 Rank2／3 的 Project 比例與附件示意略異；沒有更改權重以追示意百分比。Project Chance 仍為 16／22／30／40／50%。

10. 30 日 Runtime 各 Rank 的 Normal Template、Project Template、六種 Follow-up Type 的逐一件數／百分比在 `reports/rank-tests/RANK_TEST_REPORT.md` 與 `rank-runtime-content.csv`。150 條獨立模擬，Age22 開始自然年長，無產品，不自動購買／升職／Prestige；效率／品質取該 Rank recommended 值最接近的整數 Lv。所有數據可追查 Seed、Workdays、Config hash。Normal 工作的 Template Rank 群組占比：

| Rank | Runtime 群組 %（從低至高） |
|---|---|
| 0 | 100 |
| 1 | 39.74／60.26 |
| 2 | 13.32／35.99／50.69 |
| 3 | 3.85／13.94／37.74／44.47 |
| 4 | 2.23／6.70／16.20／24.58／50.28 |

11. Rank4 Normal Work 是最大單一群組：純抽樣 45.63%，Runtime 50.28%。Rank0＋1 Runtime 合計 8.93%，仍少量存在。
12. Rank4 Project 以年度策略規劃為主：純抽樣 51.91%，Runtime 57.44%。各 Rank 主力 Project 均通過 Runtime 最大群組驗收。
13. 低階工作及 Project 在高階仍有正值；Rank4 回 Email 權重 0.1、新品提案權重 0.1。Debug 可看有效權重及切換 Rank0–4。
14. 沒有永遠無法正常生成的 Work Template；各模板至少在最低職級或以上有正權重，10,000 draws 覆蓋可生成模板。
15. 沒有永遠無法生成的 Project Template；5 個模板都在合法 Rank 的大量成功選取測試出現。
16. 新 Work／Project Subtask 都沿用原基礎量→Rank→Age 路徑；新增 14 個 Work 各測一次 Rank、Age、Quality，DAG 測試檢查依賴全部滿足才 unlock。沒有第二套難度倍率。
17. 舊 Todo 與已解鎖 Project Subtask 的 Workload／Quality／Deadline／Progress 保持；Project 本體未重建。四個相鄰升職完整比對通過。
18. 舊 Todo 與 Project Subtask 的 Work Reward 依目前 Rank 動態更新，沒有改 Reward 函式，沒有 rewardRankMultiplierAtCreation。**Project Parent Bonus 仍保留原建立時 p.reward 快照**，不是 Work Reward；依「不要改其他核心數值／流程」原則未改獎金系統。
19. 上一輪四個 Reward Stability Fail 已正式改為 Current Rank 動態報酬 assert，全數通過；新報告不再將此規則列為 Bug，歷史報告僅作留存。
20. `npm test`：240/240 通過（原174＋新增66）。
21. `npm run test:browser`：21/21 通過（原20＋新增1），包含五個 Rank 按鈕、Work／Project 有效權重、低階保留、手機無橫向溢出及既有流程。
22. `npm run build`：TypeScript／Vite 成功，75 modules，JS336.25KB／gzip102.19KB，CSS29.90KB／gzip7.22KB。之後只補報告與驗收脚本，最終 TypeScript 再次通過。
23. 原 Rank Test Runner：146 checks pass、0 fail；每 Rank 10,000 Work draws、10,000 成功 Project selections、10,000 Project Chance rolls、10,000 Boss rolls、30 seeds ×30 工作日。新增 `rank-work-group-share.csv`；輸出全包含正式 Config 快照、seed 與相關群組／內容分布。`verify-rank-content.ts` 通過：其他136列原設定完整保持，舊8 Work和 launch 原內容完整保持，僅加 rankWeights。
24. **A：內容差異明顯。** 各階新職級工作成最大 Normal 群組，各階新 Project 成 Runtime 主力；主管與經理不再相同池，且高階低職級內容占比顯著下降。這是內容驗收，沒有宣稱最終經濟平衡：主管／經理的逾期峰值与損失仍需之後獨立平衡。所有新量、品質、獎金、權重均 PROVISIONAL。沒有新增職級、能力、部屬、委派、Deadline、Follow-up、Age 或 Product 系統，未 Commit／Push。
