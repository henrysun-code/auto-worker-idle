# Career V3 Blocking Bug — Batch-dependent Sleep / Follow-up

狀態：**BLOCKED_BEFORE_CANONICAL_RUNS**。依使用者規格第45節「如果 Runner 發現正式 gameplay bug：不要順便修……建立 CAREER_V3_BLOCKING_BUG.md……然後停止完整結論」，本輪不修正式程式，不啟動900次Canonical Runs，不產生職涯／平衡結論。

## Reproduction

正式Engine、正式Config、Seed42、EFFICIENCY_FIRST，正式起始State，Products OFF、Offline OFF、Low Profile OFF。Runner僅使用正式upgrade action，沒有manual promote、promoteTransaction、Debug、set rank或set money。舊Build選擇保留，只有自動Promotion V1最低能力補足及考核資金Reserve适配。

1. `npx tsx scripts/careerV3Preflight.ts`：同一Policy／Seed比較0.25世界秒與60世界秒批次，各推進600 active秒。自然決策點為收入、WorkStart及正式Rank變化；activeSeconds按每次正式advance的實際推進累積。沒有用world jump。
2. `npx tsx scripts/careerV3Reproduction.ts`：讀取保存的自然Career Checkpoint（world54秒）並複製兩份完全相同State。此時Money、能力、待辦、RNG全部相同。
3. 小批次先推進由自然trace取得的0.14144230779999845秒（對齊記錄中的小批次窗口），再每次0.25秒；大批次直接推進到同一world90秒。所有呼叫均用正式advance並提供activeSeconds。
4. 重播期間 **policy actions=0**，沒有購買、升職或改State；差異仍然出現，排除runner投資時點的影響。

首個命令預檢失敗時回傳非零exit code，不能當作900Runs通行證。第二個命令是只讀診斷重現，打印結果並保存兩份State。

## Expected

相同初始State與相同在線實際時間，只改advance批次大小時，Career State／RNG／Active Time應一致。完整18秒睡眠應落在同一正式睡眠效果及品質分段；計算浮點尾差不應改變返工件數或後續抽樣。

## Actual（獨立、零策略重播）

| world90結果 | 小批次 | 大批次 |
|---|---:|---:|
| activeSeconds | 90 | 90 |
| 上次睡眠ratio | 0.9999999999999992 | 1 |
| Sleep speedModifier | -2.220446049250313e-16 | 0 |
| Sleep qualityModifier | -2.220446049250313e-16 | 0 |
| effective quality | 11.999999999999996 | 12 |
| todo-27額外任務數 | 6 | 5 |
| todo-74額外任務數 | 5 | 4 |
| RNG | 789733336 | 1269650146 |
| Current Target | 再改格式 · 回 Email | 整理資料 |
| sequence | 153 | 149 |

這不是只有JSON浮點尾差：實際件數、目前工作與RNG已不同。原600秒Career預檢中，EFFICIENCY_FIRST小批次出現1次Normal Meeting（3秒、補償10），大批次0次；後續收入／工作／升職資料不能視為同一deterministic baseline。

## Source / Cause

- `src/game/targets/targetManager.ts` 的progressTarget累加Sleep duration／output；不同批次可留下不同浮點尾差。
- `src/game/targets/sleepWindow.ts` 的sleepRatio直接相除；sleepEffect在ratio接近1但略小時插值得到極小負modifier。
- settleSleepWindow以modifier<0決定Debuff，沒有將完整窗口的浮點尾差視為相同結算點。
- `src/game/work/workQuality.ts` 的followUpCount直接比較effectiveWorkQuality／qualityRequirement與minimumRatio。正式品質件數分段為0、0.8、1.2；此重現的12與11.999999999999996除以品質需求10，分別落在1.2與略低於1.2，造成返工件數不同，之後影響選取與RNG。

本輪只定位並保存證據，沒有改這些檔案、容差、門檻、效果或Balance。

## Affected Runs / Scope

已確認：自然Career `EFFICIENCY_FIRST / Seed42` 的600秒批次對照，以及world54→90秒的同State零策略重播。其他四個Policy的同Seed預檢亦未full-State exact-equal，但當前差異只有年齡浮點尾數、RNG與activeSeconds相同，不據此聲稱它們都會出現件數分歧。

**Canonical 900 logical runs：0／900，未啟動。** 五個Policy、六個Timing、30 Seeds的其他組合未完整測量；不能猜受影響比例，也不能假設換Seed或固定大批次可掩蓋問題後繼續交付。

重用的30 Seeds公式是42 + replicate×7919，replicate=0..29，與舊runner相同。預定Timings仍為NEVER、AS_SOON_AS_ELIGIBLE、TARGET_30／60／120／180_MIN。尚未執行完整Prestige循環、Revenue Reconciliation或Workload Conservation，這些欄位標NOT_RUN，不宣稱通過。

## Evidence

- career-v3-preflight.json：五Policy完整State差異，RNG及Active Time比較。
- career-v3-preflight-traces.json：策略購買、RNG及分歧附近State的自然trace。
- career-v3-reproduction-checkpoint.json：兩份重播共用的自然State。
- career-v3-reproduction-result.json：零策略重播摘要。
- career-v3-reproduction-small-state.json／large-state.json：完整結果State。
- career-v3-config-before.json／after.json／verification.json：正式Config與Source保護證據。

現有回歸測試即使通過，也不代表上述未覆蓋的批次一致性問題已消失。完成此報告後停止Career完整結論，待另輪授權處理正式bug後再重新預檢並開始900 Runs。
