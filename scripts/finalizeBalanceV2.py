# -*- coding: utf-8 -*-
import json,zipfile
from pathlib import Path
root=Path(__file__).resolve().parent.parent/'reports'/'career-progression-v2'
d=json.loads((root/'career-v2-results.json').read_text(encoding='utf-8'))
def med(x):return x['median']
def f(x):return '未達' if x is None else f'{x:,.2f}'
p='PREPARED_BALANCED'
rows=[r for r in d['baselineComparison'] if r['policy']==p and r['level'] in [100,200,225,250,275,300]]
lines=['# 本輪數據判讀','', '所有到達／等待時間為 active 分鐘；分位數只使用達成樣本，未達另列。','', '|能力|等級|到達 median|observed/censored|N→N+1 median|','|---|---:|---:|---:|---:|']
for r in rows:
 x=r['v2Milestone'];lines.append(f'|{r["ability"]}|{r["level"]}|{f(med(x))}|{x["observed"]}/{x["censored"]}|{f(med(r["v2Wait"]))}|')
lines+=['', 'Practical Soft Wall：移至約250附近，尚未延至300。Prepared兩能力250皆30/30達成，但約331／337分鐘、單級等待約13分鐘；275／300皆0/30。225等待由7.15／7.84降至4.32／4.63分鐘，下降約40%／41%。200以前同Seed到達與等待完全不變。不是硬上限，也不把未投資能力誤判為瓶頸。','', 'Prestige Timing：PREPARED_BALANCED 的 120 分鐘在 Gross、Net after career spend 都優於 30／60／180，符合競爭力目標。跨策略沒有單一最佳：QUALITY_FIRST 的 Gross 最佳為60，ALL_ROUNDER與PROMOTE_ASAP_BALANCED為180，EFFICIENCY_FIRST為120。不同目標（未花現金／累積收入／永久投資）須分開看。','', '|Timing|Prepared Gross median|Net after upgrades|Net after career spend|','|---|---:|---:|---:|']
for r in d['scenarios']:
 if r['policy']==p:lines.append(f'|{r["timing"]}|{f(med(r["grossIncome"]))}|{f(med(r["netIncomeAfterUpgrades"]))}|{f(med(r["netAfterCareerSpend"]))}|')
lines+=['', 'TARGET120 配對追趕（Prepared）：','', '|能力|等級|Cycle0|Cycle1|paired observed/censored|縮短 median %|','|---|---:|---:|---:|---:|---:|']
for r in d['recrawl']:
 if r['policy']==p and r['timing']=='TARGET_120_MIN':lines.append(f'|{r["ability"]}|{r["level"]}|{f(r["cycle0Median"])}|{f(r["cycle1Median"])}|{r["pairedObserved"]}/{r["pairedCensored"]}|{f(med(r["reductionPercent"]))}|')
lines+=['', 'Permanent 診斷：可接受。已有同 Seed 的重跑縮短，且120分鐘時機具競爭力；不能只因高等級 censored 就判為太弱，也沒有證據要求本輪提高或降低1.10。此結論限於六小時、兩輪追趕，非無限次Prestige證明。','', 'Flattery：UNPROTECTED 的0→200收入約4.78倍，超過純收入3倍，主要來自注意度與Severity提高Boss收入，不是本隔離實驗中的自動買升級雪球（所有能力固定）。遭遇率50級已到100%，Boss工作量與加班繼續增加，但E/Q200仍使睡眠損失很小。','', 'COUNTERED 的0→200收入約3.06倍，接近純收入3倍；Life＋Slacking把200級加班中位數由310.65秒降到119.57秒（約61.5%），平均Sleep由99.63%升到99.84%。','', '**FLATTERY_DOMINANCE_RISK：YES（本隔離條件下）。** COUNTERED Lv200收入大增，120分鐘內加班占比僅1.66%，Sleep近完整，Overdue中位數0。加班仍有增加，因此並非零成本；但實際睡眠／期限代價不足以形成有效制衡。保留+1%及所有正式規則，不自動Tune。','']
(root/'BALANCE_V2_FINDINGS.md').write_text('\n'.join(lines),encoding='utf-8')
for name in ['CAREER_PRESTIGE_BALANCE_V2_REPORT.md','FLATTERY_ISOLATION_REPORT.md']:
 with (root/name).open('a',encoding='utf-8') as out:out.write('\n## 正式診斷\n\n'+ '\n'.join(lines[1:]))
required=['CAREER_PRESTIGE_BALANCE_V2_REPORT.md','career-v2-milestone-summary.csv','career-v2-upgrade-wait-summary.csv','career-v2-prestige-timing-summary.csv','career-v2-recrawl-summary.csv','career-v2-economy.csv','career-v2-workload-source.csv','career-v2-sleep.csv','career-v2-sanity.json','FLATTERY_ISOLATION_REPORT.md','flattery-isolation-summary.csv','flattery-isolation-runs.csv']
assert all((root/n).is_file() and (root/n).stat().st_size for n in required)
files=sorted(p for p in root.iterdir() if p.suffix in ['.md','.csv','.json'])
archive=root/'BALANCE_V2_AI_REVIEW.zip'
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for path in files:z.write(path,path.name)
with zipfile.ZipFile(archive) as z:assert z.testzip() is None
print('FINALIZED',len(files),'files;',archive.stat().st_size,'bytes',flush=True)
