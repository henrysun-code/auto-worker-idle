# Career V3 Full Simulation — Blocked Preflight

**0／900 Canonical Runs；未啟動完整職涯模擬。** 批次一致性預檢未通過，獨立的零策略重播確認正式Sleep浮點尾差跨越Follow-up品質分段，改變工作件數與RNG。

依本輪規格第45節，保存 `CAREER_V3_BLOCKING_BUG.md` 與完整重現State後停止完整結論；未修正式gameplay／Config／Balance，也未新增Company或轉職。

FIRST_COMPANY_PACING、Rank median／reach rate、Promotion bottleneck／failure、Prestige gap／recrawl、經濟、Sleep穩定性等900Runs統計均 **NOT_RUN**，不填零、不由舊資料推估，不產生看似完整的CSV。

詳見 [Blocking Bug](CAREER_V3_BLOCKING_BUG.md)、`career-v3-sanity.json` 與 `career-v3-config-verification.json`。舊Career、Meeting、Promotion、Product Framework報告完整保留。

最後保護回歸：Core **419／419 PASS**、Browser **31／31 PASS**、Config／TypeScript／Vite Build **PASS**。完整正式Config deep-equal，Production Source與Excel合併SHA256仍相同。這些既有回歸通過不代表新發現的批次一致性預檢通過；該項仍為FAIL，且未修正。
