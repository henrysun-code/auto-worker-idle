import csv
import difflib
import hashlib
import json
import statistics
from collections import Counter
from pathlib import Path

game = Path(__file__).resolve().parents[1]
out = game / 'reports/promotion-cost-removal-v1'
result = json.loads((out / 'results.json').read_text(encoding='utf-8'))
workstarts = list(csv.DictReader((out / 'workstarts.csv').open(encoding='utf-8')))
purchases = list(csv.DictReader((out / 'purchases.csv').open(encoding='utf-8')))
old_purchases = list(csv.DictReader((game / 'reports/first-company-incremental-v1/buy-all-purchases.csv').open(encoding='utf-8')))
before_purchases = [p for p in purchases if p['version'] == 'BEFORE']
purchase_match = len(old_purchases) == len(before_purchases) and all(
    all(float(a[k]) == float(b[k]) for k in ['seed', 'rank', 'level', 'realSeconds', 'cost']) and a['id'] == b['id']
    for a, b in zip(old_purchases, before_purchases))
config_path = game / 'config/generated/game_config.json'
baseline_config = out / 'baseline-runtime/config/generated/game_config.json'
config_match = json.loads(config_path.read_text(encoding='utf-8')) == json.loads(baseline_config.read_text(encoding='utf-8'))
missed = [r for r in workstarts if r['version'] == 'AFTER' and not r['blockingReasons'] and r['assigned'] == 'false']
assert result['baselineVerified'] and purchase_match and config_match and not missed

def write_csv(name, rows):
    keys = list(dict.fromkeys(k for row in rows for k in row))
    with (out / name).open('w', encoding='utf-8-sig', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=keys)
        writer.writeheader()
        writer.writerows(rows)

def fmt(value, digits=2):
    if value is None:
        return '未達／無資料'
    return f'{value:.{digits}f}' if isinstance(value, (int, float)) else str(value)

def minutes(value):
    return fmt(value / 60) if value is not None else '>60／未達'

def table(headers, rows):
    return ['| ' + ' | '.join(headers) + ' |', '| ' + ' | '.join(['---'] * len(headers)) + ' |'] + [
        '| ' + ' | '.join(map(str, row)) + ' |' for row in rows]

paired_rows, differences, first_legal_checks = [], [], []
for before, after in zip(result['before'], result['after'][:3]):
    for run in [before, after]:
        for rank in range(5):
            paired_rows.append(dict(seed=run['seed'], version=run['version'], rank=rank,
                firstEQQualifiedTime=run['firstEQQualifiedTime'][rank] if rank < 4 else None,
                firstPromotionAssignedTime=run['firstPromotionAssignedTime'][rank] if rank < 4 else None,
                qualificationToAssignmentDelay=run['qualificationToAssignmentDelay'][rank] if rank < 4 else None,
                rankEntryRealSeconds=run['rankTimes'][rank], rankDwellSeconds=run['rankDwellSeconds'][rank],
                upgradeIntervalP50=run['upgradeIntervalP50ByRank'][rank], medianNextUpgradeETA=run['medianNextUpgradeETAByRank'][rank]))
    for rank in range(4):
        b, a = before['firstPromotionAssignedTime'][rank], after['firstPromotionAssignedTime'][rank]
        br, ar = before['rankTimes'][rank + 1], after['rankTimes'][rank + 1]
        differences.append(dict(seed=before['seed'], promotionFromRank=rank, beforeAssignment=b, afterAssignment=a,
            assignmentDifferenceAfterMinusBefore=a-b if a is not None and b is not None else None,
            beforeNextRankEntry=br, afterNextRankEntry=ar,
            nextRankDifferenceAfterMinusBefore=ar-br if ar is not None and br is not None else None,
            censoredComparison=b is None or a is None or br is None or ar is None))
for run in result['after']:
    for rank in range(4):
        qualified = run['firstEQQualifiedTime'][rank]
        legal = [x for x in workstarts if x['version'] == 'AFTER' and int(x['seed']) == run['seed'] and int(x['rank']) == rank
                 and qualified is not None and float(x['realSeconds']) >= qualified-1e-8 and not x['blockingReasons']]
        first = legal[0] if legal else None
        first_legal_checks.append(dict(seed=run['seed'], rank=rank, firstEQQualifiedTime=qualified,
            firstLegalWorkStart=float(first['realSeconds']) if first else None,
            firstPromotionAssignedTime=run['firstPromotionAssignedTime'][rank],
            assignedAtFirstLegalWorkStart=first['assigned'] == 'true' if first else None))
assert all(row['assignedAtFirstLegalWorkStart'] is not False for row in first_legal_checks)
write_csv('paired-summary.csv', paired_rows)
write_csv('paired-differences.csv', differences)
write_csv('first-legal-workstart-verification.csv', first_legal_checks)

# Pending assessments and incomplete overtime are censored rather than zero-duration completions.
aggregate_rows = []
for row in result['aggregate']['byRank']:
    rank = row['rank']
    attempts = [x for r in result['after'] for x in r['attempts'] if x['rank'] == rank]
    closed = [x for x in attempts if x['result'] == 'SUCCESS' or x.get('overtimeFinished') is not None]
    failed_closed = [x for x in closed if x['result'] == 'FAILED_OVERTIME']
    row = dict(row, completedAttemptCount=len(closed),
        meanCompletedAttemptOvertimeProcessingSeconds=statistics.mean(x['overtimeWorld'] for x in closed) if closed else None,
        meanCompletedAttemptOvertimeElapsedRealSeconds=statistics.mean(x['overtimeElapsedReal'] for x in closed) if closed else None,
        meanCompletedFailedOvertimeProcessingSeconds=statistics.mean(x['overtimeWorld'] for x in failed_closed) if failed_closed else None,
        censoredAttemptCount=sum(x['result'] is None for x in attempts))
    aggregate_rows.append(row)
write_csv('rank-aggregates.csv', aggregate_rows)
write_csv('rank-time-quantiles.csv', result['aggregate']['rankTimesMinutes'])
write_csv('rank-retries.csv', [dict(seed=r['seed'], rank=rank, attempts=sum(x['rank'] == rank for x in r['attempts']),
    retries=max(0, sum(x['rank'] == rank for x in r['attempts'])-1)) for r in result['after'] for rank in range(4)])
blocks = Counter(x['blockingReasons'] or 'ASSIGNED' for x in workstarts if x['version'] == 'AFTER' and x['rank'] == '3')
qual_r3 = [r['firstEQQualifiedTime'][3]/60 for r in result['after'] if r['firstEQQualifiedTime'][3] is not None]
sanity = dict(baselineExactSummaryMatch=result['baselineVerified'], baselineExactPurchaseMatch=purchase_match,
    baselinePurchaseCount=len(old_purchases), configNumericallyIdentical=config_match,
    generatedConfigSHA256=hashlib.sha256(config_path.read_bytes()).hexdigest(),
    unblockedWorkStartMissedAssignments=len(missed), firstLegalWorkStartChecks=first_legal_checks,
    beforeRuns=3, afterRuns=len(result['after']), uniqueAfterSeeds=len(set(r['seed'] for r in result['after'])),
    canonicalSeedFormula='42 + replicate * 7919', horizonRealSeconds=3600, reserves=0, autoTune=False,
    products='OFF', prestige='OFF', lowProfile='OFF', speed=1, rank3WorkStartBlockCounts=dict(blocks),
    rank3EQQualifiedRuns=len(qual_r3), rank3FirstEQQualifiedMedianMinutes=statistics.median(qual_r3),
    coreTests=446, browserTests=32, noCommit=True, noPush=True)
(out / 'verification.json').write_text(json.dumps(sanity, ensure_ascii=False, indent=2), encoding='utf-8')
(out / 'aggregates.json').write_text(json.dumps(dict(rankTimes=result['aggregate']['rankTimesMinutes'], byRank=aggregate_rows), ensure_ascii=False, indent=2), encoding='utf-8')
patch = []
for relative in ['src/game/career/promotion.ts', 'src/game/career/promotionAssignment.ts', 'src/screens/Upgrades.tsx', 'src/config/v2Defaults.ts']:
    old = (out / 'baseline-runtime' / relative).read_text(encoding='utf-8').splitlines(True)
    new = (game / relative).read_text(encoding='utf-8').splitlines(True)
    patch.extend(difflib.unified_diff(old, new, fromfile='baseline/'+relative, tofile='current/'+relative))
(out / 'production-money-removal.patch').write_text(''.join(patch), encoding='utf-8')

lines = ['# FIRST COMPANY PROMOTION COST REMOVAL + PAIRED RETEST', '',
    '升職正式不收費：派發與成功交易均不讀取 Money / promotionCost，不扣款；逾期、E/Q、冷卻、強制 Boss / Boss Meeting 規則維持。Money Gate 確認為上一輪首次考核延到 40～46 分鐘的主因，已完成 3 Seed 完全配對與 30 Seed 擴充。**平衡驗收並非全 PASS：R4 30～40 分鐘與後期升級節奏均未達標。**', '',
    '## 正式修改與範圍', '',
    '- `promotion.ts`：派發使用的 canPromote 與完成交易共用資格移除 Money Gate；交易移除扣款。',
    '- `promotionAssignment.ts`：FAILED_REQUIREMENT 文字僅保留職級／逾期；加入唯讀 WorkStart snapshot。',
    '- `SimulationLoop.ts`：既有檢查點透過 optional onPromotionWorkStart 提供 snapshot，無新增 GameState、RNG 抽取或日程變更。',
    '- `Upgrades.tsx`：移除資金條件，改為升職不收費。`v2Defaults.ts` 舊 promotionCost 欄位註明 deprecated metadata。',
    '- promotionCost 220/900/2800/9000 仍保留於舊 Excel / generated config，正式派發、交易、UI 均不讀取。四職級 poison getter regression 證明讀取會拋錯時仍可零資金派發與升職。',
    '- 升級價格、Rank Reward、一般 Workload、考核 factor 1.20、E/Q、Overdue、Cooldown、Low Profile、Prestige、Permanent、Products 全數未調整。generated Config 與基準逐值一致。', '',
    '## 完全配對方法', '',
    '基準為上一輪實際現有程式，先複製到 baseline-runtime，再加入與正式版相同的唯讀測量 hook。基準保留舊 Money Gate／扣款，僅供 BEFORE 測量，不被遊戲匯入。三次重現上一輪首次派發、世界時間、期末金錢與能力等級，並逐筆重現 1,785 筆購買（Seed、能力、等級、Rank、時間、成本完全相同）。', '',
    '每組 3,600 actual online 秒；每 0.25 秒用正式 upgrade action 反覆買當下最便宜且可負擔能力，成本相同時沿用 Config ID 順序。沒有升職預留金、手動升職、強制成功、Prestige、產品、Low Profile、AutoTune 或固定能力。1x 沿用已正式實作的睡眠 ×60 世界時間，因此睡眠期間真人秒不等於世界秒。每個 run 獨立同 Seed 初始化；策略差異後不假設 RNG 事件仍逐一相同。', '',
    '3 Seed 改善且各有 29／30／30 個「所有非金錢條件通過、僅舊金錢不合格」WorkStart，符合擴充條件。30 Seed 沿用 42+i×7919，重用已完成的 AFTER 三組，再跑其餘 27 組；共 33 次完整模擬（3 BEFORE + 30 AFTER），不是將 3 組複製成 30 組。', '',
    '## 首次考核前後配對', '',
    '以下時間為真人分鐘；資格→派發延遲欄為真人秒。第一次 E/Q 達標時間在前後完全相同。', '']
lines += table(['Seed', '首次 E/Q 達標', 'BEFORE 派發', 'AFTER 派發', 'BEFORE 延遲秒', 'AFTER 延遲秒', '首次結果（前→後）'], [
    [b['seed'], minutes(b['firstEQQualifiedTime'][0]), minutes(b['firstPromotionAssignedTime'][0]), minutes(a['firstPromotionAssignedTime'][0]),
     fmt(b['qualificationToAssignmentDelay'][0]), fmt(a['qualificationToAssignmentDelay'][0]), b['attempts'][0]['result']+' → '+a['attempts'][0]['result']]
    for b, a in zip(result['before'], result['after'][:3])])
lines += ['', '首次派發均在第一次無正式阻塞的 WorkStart。所有 AFTER WorkStart 中，非金錢条件全通過卻未派發：**0 次**。完整逐 Rank 首次資格、派發與延遲見 paired-summary.csv；每個 run 的首次合法上班驗證見 first-legal-workstart-verification.csv。', '',
    '## R1–R4 與停留', '', '以下為真人分鐘；未達者為右設限 >60，不填 0，也不拿僅成功者計整體 quantile。', '']
lines += table(['Seed', '版本', 'R1', 'R2', 'R3', 'R4'], [[r['seed'], r['version']] + [minutes(t) for t in r['rankTimes'][1:]] for pair in zip(result['before'], result['after'][:3]) for r in pair])
lines += ['', '每 Rank 停留秒、upgrade interval P50、median next-upgrade ETA 已輸出 paired-summary.csv；未離開的最後 Rank 停留只計觀測到 60 分鐘，標準時段之外不外推。paired-differences.csv 提供 AFTER−BEFORE；只有兩邊皆觀測到時才計差值，未達標不虛構差值。', '',
    '## 每次 Promotion 開始值與結果', '',
    '下表列三個配對 Seed 的全部 AFTER 考核。穩定 E/Q 為資格用數值；實際 E 已包含當時處理 Buff/Debuff，實際 E 超標比=(實際E／門檻E−1)×100%。能力購買及後續 Buff 可在考核途中改變，開始值不是整段常數。未結算不填失敗或 0%。', '']
lines += table(['Seed', '升職', '開始分鐘', '穩定 E/Q', '實際 E／門檻', '超標%', 'Dinner 完成%', '結果', '加班處理秒'], [
    [r['seed'], f"R{x['rank']}→R{x['rank']+1}", minutes(x['start']), f"{fmt(x['efficiency'])}/{fmt(x['quality'])}",
     f"{fmt(x['actualEfficiency'])}/{x['thresholdEfficiency']}", fmt(x['efficiencyOvershootPercent']), fmt(x['dinnerCompletionPercent']),
     x['result'] or '60 分鐘仍未結算', fmt(x['overtimeWorld'])] for r in result['after'][:3] for x in r['attempts']])
lines += ['', 'BEFORE 三次均成功且无加班，其开始實際 E 遠超門檻；全部 BEFORE／AFTER 每次開始 E/Q、資格 E/Q、deadline、Dinner%、加班處理及 elapsed 均在 promotions.csv / results.json。', '',
    '## 30 Seed 分布', '']
lines += table(['達到', '達成人數', 'P10 分鐘', 'P50 分鐘', 'P90 分鐘'], [[f"R{x['rank']}", f"{x['reached']}/30", fmt(x['P10']), fmt(x['P50']), fmt(x['P90'])] for x in result['aggregate']['rankTimesMinutes']])
lines += ['', '首次率分母為該 Rank 確實派發過至少一次的 run；R3 有 28 組曾派發，24 組首次失敗、4 組首次尚未結算。平均 Dinner% 僅含已到 Dinner 的考核；重試平均分母為 30 組。未達 Rank 不是 0% 成功。', '']
lines += table(['升職', '考核次數', '首次成功%', '首次失敗%', '首次未結算%', '平均 Dinner%', '平均已結算考核加班處理秒', '平均已結算加班 elapsed 秒', '每 run 平均重試'], [
    [f"R{x['rank']}→R{x['rank']+1}", x['attempts'], fmt(x['firstSuccessRate']*100) if x['firstSuccessRate'] is not None else '—',
     fmt(x['firstFailureRate']*100) if x['firstFailureRate'] is not None else '—', fmt(x['firstCensoredRate']*100) if x['firstCensoredRate'] is not None else '—',
     fmt(x['meanDinnerCompletionPercent']), fmt(x['meanCompletedAttemptOvertimeProcessingSeconds']), fmt(x['meanCompletedAttemptOvertimeElapsedRealSeconds']), fmt(x['meanRetries'])] for x in aggregate_rows if x['rank'] < 4])
lines += ['', '加班處理秒只計 FAILED_OVERTIME 後實際處理同一 Promotion 的時間；elapsed 則从 Dinner 失敗到同一任務完成，包含晚餐等阻塞。表中平均含成功者 0 秒、排除未完成的考核；results.json 另保留所有已觀測加班量（含被 60 分鐘截斷者），不可當作完整時長。每 Seed／Rank 重試數見 rank-retries.csv。', '',
    '## 升級節奏', '']
lines += table(['目前 Rank', '任意升級 interval P50 秒', 'median next-upgrade ETA 秒'], [[f"R{x['rank']}", fmt(x['upgradeIntervalP50']), fmt(x['medianNextUpgradeETA'])] for x in aggregate_rows])
lines += ['', 'interval 為任兩次能力購買之真人秒差，跨 Rank 的間隔歸入後一次購買的 Rank；同一 0.25 秒檢查買多項時真實間隔為 0，故 R2 P50=0 是批次購買結果，不是計算遺漏。ETA 每整真人秒採樣，以最近 60 真人秒 gross income 推估維持當下錢包到各能力所需時間，取五能力 median，再對該 Rank 的採樣取 median；不是保留資金策略或實際下一次購買保證。收入 0 時 ETA=null。逐筆見 purchases.csv / etas.csv。', '',
    '## 嚴格驗收 A–F', '',
    '- **A PASS**：首次派發已由 40～46 分鐘提前為 4.37～6.66 分鐘；Money 主因有明確的非金錢全通過阻塞紀錄。',
    '- **B PASS**：3 配對與 30 組全部已資格的考核，在首次無其他阻塞的合法 WorkStart 派發；未派發違例 0。當天稍晚上才買到門檻，必須等下一 WorkStart，此為既有正式規則。',
    '- **C PASS（有壓力，不等於已完美平衡）**：三配對首次為一失敗、兩成功；30 組首次 R0→R1 失敗 56.67%。沒有三次都輕鬆成功的情況。R1→R2 首次失敗 96.67%，R2→R3 首次失敗 100%，R3→R4 所有已結算首次都失敗。factor 保持 1.20。',
    '- **D PASS**：30/30 都到 R2、R3；不再只有 R1。',
    '- **E FAIL**：R4 沒有落在 30～40 分鐘，0/30 在 60 分鐘達成。下一個可證實瓶頸為達到 R3→R4 的 E=160 資格過晚，之後必須處理固定 18,432 workload 的考核及失敗冷卻；未調值。',
    '- **F FAIL**：R0 間隔 P50 5.75 秒落前期目標；後續 2.25／0／1.75 秒沒有形成 6～10、10～20、20～30 秒的牆。應標記「**經濟曲線尚未形成牆**」，沒有修改 Upgrade Cost。', '',
    '## 下一個真正瓶頸', '',
    f"R3 階段，29/30 達到下一階資格，達標時間 P50={statistics.median(qual_r3):.2f} 真人分鐘（此值條件於達標者；另 1 組到 60 分鐘仍 E=151 未達）。R3 的 WorkStart 紀錄：" + '；'.join(f'{k}={v}' for k, v in blocks.items()) + '。', '',
    '到門檻 E=160 時，無干擾且處理速度不變，96 秒可處理 15,360／18,432=83.33%，固定考核需平均有效 E≥192 才準時完成。這只是可解釋的下限，不把開始 E 當整段速度；睡眠／會議／事件 Debuff 可進一步影響。29 組達標後多次失敗與三工作日冷卻，導致 60 分鐘末仍無 R4。期末 E 範圍 151～174，仍未自然跨過上述穩定處理下限。這輪只提出實證瓶頸，沒有選擇新 E 成長、workload、Cooldown 或成本數值。', '',
    '## 五個正式回答', '',
    '1. **第一公司 30～40 分鐘？否。** R3 P50 37.33 分鐘，但 R4 全部 >60；不能把 R3 誤稱公司完成。',
    '2. **第一次 Promotion 是否真的有壓力？是。** 第一階首次失敗 56.67%，而非 Money Gate 後的超額能力碾壓；後續首次更難，仍需後續平衡決策。',
    '3. **Low Profile 有存在價值？機制上是，完整 Career 收益尚未量測。** 額外隔離 regression 證明：OFF E20/Q12 考核失敗；ON 在同值不派發；ON E25/Q15 以 0.8 評估剛達20/12，實際處理效率仍25，可在乾淨無干擾考核準時成功。30組正式策略全OFF，不能聲稱已證明ON能更快到R4；1.25倍資格緩衝亦不保證抵禦所有Debuff。',
    '4. **哪一 Rank 是第一個明顯數值牆？** 升級經濟牆尚未形成。考核壓力從 R0 已存在，R1/R2 多次重試仍全員通過；第一個使 60 分鐘觀測整體停住的 Career 牆是 **R3→R4**。',
    '5. **是否仍有非使用者要求的人為 Gate？** 在本輪正式派發／交易路徑與 BUY_ALL 策略未發現新的 Gate：只剩已指定 E/Q、Overdue、Cooldown、未完成考核、強制 Boss／Boss Meeting 與 WorkStart 時點；Money已移除、 reserve=0。舊 Career 模擬工具仍有歷史 reserve／Money分類，這輪沒有使用它們作現行結論，亦不被遊戲匯入；後續若重新使用那些歷史工具必須另做版本遷移。沒有以此檢查宣稱整個 Repository 所有歷史工具已更新。', '',
    '## 驗證與檔案', '',
    '- 正式核心：446/446；包含舊系統回歸、四職級 poison cost getter、零資金派發與完成、逾期仍拒絕、hook 全 State/RNG 不變、合法 WorkStart 與 Low Profile 邊界。',
    '- 瀏覽器：32/32；包含行動版不顯示資金條件與零資金考核成功存檔。',
    '- npm run build：PASS；Config 生成、TypeScript、Vite。',
    '- 歷史兩項測試的期望按正式移除成本更新：直接升職政策不再等待金錢；Prestige observer parity 改為明確 ready fixture，避免把特定舊 Career 平衡路程當作 observer 正確性條件。未修改 Prestige 生產規則。',
    '- 詳細證据：results.json、verification.json、workstarts.csv、promotions.csv、paired-summary.csv、paired-differences.csv、rank-time-quantiles.csv、rank-aggregates.csv、rank-retries.csv、purchases.csv、etas.csv、測試／建置 logs。',
    '- 每次 WorkStart telemetry含當前Rank、穩定E/Q、Low Profile評估E/Q、E/Q達標、逾期數與合格、冷卻、未完成考核、強制Boss／BossMeeting、派發結果及非金錢阻塞列表。firstEQQualifiedTime 於每次正式能力購買及邊界更新，首派發在引擎邊界記錄，真人時鐘不靠人工換算。',
    '- BEFORE 專屬 legacyMoneyQualified 只為因果對照，AFTER 阻塞原因沒有 Money。任何已結算與右設限條件均保留於原始輸出。',
    '- 原有 UI／美術、GameState、Target、工作／產品系統及之前報告保留。未 Commit、Push 或部署；公開網頁仍是先前已部署版本。', '']
(out / 'REPORT.md').write_text('\n'.join(lines), encoding='utf-8')
print(json.dumps({'exactBaseline': purchase_match, 'configMatch': config_match, 'missedAssignments': len(missed), 'rank3Blocks': blocks}, ensure_ascii=False))
