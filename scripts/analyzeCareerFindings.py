# -*- coding: utf-8 -*-
import json, statistics, csv
from pathlib import Path
root=Path(__file__).resolve().parent.parent/'reports'/'career-progression'
d=json.loads((root/'career-results.json').read_text(encoding='utf-8'))
scenarios=d['scenarios'];never=[r for r in scenarios if r['timing']=='NEVER_PRESTIGE']
baseline={(r['policy'],r['seed']):r for r in d['runs'] if r['timing']=='NEVER_PRESTIGE'}
paired=[]
for r in d['runs']:
 if r['timing']=='NEVER_PRESTIGE':continue
 b=baseline[(r['policy'],r['seed'])]
 row={'policy':r['policy'],'timing':r['timing'],'seed':r['seed']}
 for field in ['grossIncome','netIncomeAfterUpgrades','netAfterCareerSpend','processedWorkload','generatedWorkload','averageSleepRatio','overtimeSeconds','overdueLoss']:
  row[field+'DifferenceVsNever']=r[field]-b[field]
 for a in r['finalLevels']:row[a+'FinalDifferenceVsNever']=r['finalLevels'][a]-b['finalLevels'][a]
 paired.append(row)
with (root/'career-paired-differences.csv').open('w',encoding='utf-8-sig',newline='') as f:
 w=csv.DictWriter(f,list(paired[0]));w.writeheader();w.writerows(paired)
def fmt(v):return '未達／無完成樣本' if v is None else f'{v:,.2f}'
def md(v):return fmt(v['median'])
lines=['## 十四項正式回答（實測數據）','', '1. **早餐同 Anchor Bug**：Sleep Window 結算後給一次早餐資格，避免同時 cutoff 誤判 MISSED；資格在早餐開始時消耗。WorkStart／Deadline 不變，沒有新增強制中斷工作。','', '2. **Regression**：323 核心＋24 瀏覽器，全數通過；build 通過。含 Boss Follow-up 立即／延遲生成與完整 State＋RNG 對照。','', '3. **樣本**：30 Scenario、900 Run；每組 30 次、每次完整 360 active 分鐘。','', '4. **首次 canPrestige**（NEVER 同初始 seed 基準；分鐘）：','', '|Policy|Median|P10|P90|未達|','|---|---:|---:|---:|---:|']
for r in never:
 x=r['firstCanPrestige'];lines.append(f'|{r["policy"]}|{md(x)}|{fmt(x["p10"])}|{fmt(x["p90"])}|{x["censored"]}/30|')
lines+=['', '5. **首次 Rank4**（NEVER，分鐘）：','', '|Policy|Median|P10|P90|未達|','|---|---:|---:|---:|---:|']
for r in never:
 x=r['rank4'];lines.append(f'|{r["policy"]}|{md(x)}|{fmt(x["p10"])}|{fmt(x["p90"])}|{x["censored"]}/30|')
lines+=['', '6. **NEVER 到 Lv100／200／250／300**：','', '|Policy|能力|100|200|250|300|','|---|---|---:|---:|---:|---:|']
for r in never:
 for a in ['efficiency','quality']:
  values=[]
  for lv in [100,200,250,300]:
   x=next(x for x in d['milestones'] if x['policy']==r['policy'] and x['timing']=='NEVER_PRESTIGE' and x['cycle']==0 and x['ability']==a and x['level']==lv)
   values.append(f'{md(x)} ({x["observed"]}/30)')
  lines.append('|'+r['policy']+'|'+a+'|'+'|'.join(values)+'|')
lines+=['', '策略限制要另看：EFFICIENCY_FIRST 在最高職級主要投入效率，QUALITY_FIRST 主要投入品質；另一能力未到高等級是策略選擇。Balanced 沒買的生活管理／摸魚／拍馬屁也不能當成成本曲線的牆。','', '7. **Soft Wall**：下表是已測得的 N→N+1 等待中位數；Lv250／300 的 censored 是 360 分鐘視窗的實際限制，不是永久不可達。','', '|Policy|能力|100→101|200→201|225→226|250→251|','|---|---|---:|---:|---:|---:|']
for r in never:
 for a in ['efficiency','quality']:
  values=[]
  for lv in [100,200,225,250]:
   x=next((x for x in d['upgradeWaits'] if x['policy']==r['policy'] and x['timing']=='NEVER_PRESTIGE' and x['ability']==a and x['level']==lv),None)
   values.append(md(x) if x else '未到 N')
  lines.append('|'+r['policy']+'|'+a+'|'+'|'.join(values)+'|')
lines+=['', '8. **30／60／120／180 比較**（PREPARED_BALANCED 的 360 分鐘總 gross 中位）：','', '|Timing|Gross|相對 NEVER %|','|---|---:|---:|']
base=next(r for r in never if r['policy']=='PREPARED_BALANCED')['grossIncome']['median']
for r in scenarios:
 if r['policy']=='PREPARED_BALANCED':lines.append(f'|{r["timing"]}|{md(r["grossIncome"])}|{fmt((r["grossIncome"]["median"]/base-1)*100)}|')
lines+=['', '這只回答 gross；net 與各種子配對首次回本另見 timing-summary／paired-payback，不用 gross 排序冒充全面最優。','', '9. **第二輪 Lv100／200 追趕**（PREPARED_BALANCED；同 Seed 兩輪均達成的配對，縮短率為逐 Seed 中位）：','', '|Timing|能力|Lv|首輪分|第二輪分|縮短 %|第二輪完成 / censored|','|---|---|---:|---:|---:|---:|---:|']
for timing in ['AS_SOON_AS_ELIGIBLE','TARGET_30_MIN','TARGET_60_MIN','TARGET_120_MIN','TARGET_180_MIN']:
 for a in ['efficiency','quality']:
  for lv in [100,200]:
   paired_summary=json.loads((root/'career-cycle-paired-recovery-summary.json').read_text(encoding='utf-8'))
   x=next(x for x in paired_summary if x['policy']=='PREPARED_BALANCED' and x['timing']==timing and x['ability']==a and x['level']==lv)
   lines.append(f"|{timing}|{a}|{lv}|{fmt(x['cycle0PairedMedian'])}|{fmt(x['cycle1PairedMedian'])}|{fmt(x['medianReductionPercent'])}|{x['pairedObserved']} / {x['pairedCensored']}|")
lines+=['', '10. **A/B/C 診斷**：100 與 200 後疊加成本的效應，可由上方實際等待拐點與 250／300 達成率辨識；沒有把未完成樣本填成 360 分鐘假事件。有限暴露量支持「高階增長明顯變慢」，不支持宣稱永遠無法突破。','', '11. **Permanent 1.10^Lv**：PREPARED 的 ASAP 永久工作效率中位 Lv5（倍率 1.61051），30／60 分鐘中位 Lv4（1.4641），120／180 分鐘中位 Lv3（1.331）。ASAP 的總 gross 遠低於 NEVER，說明較多永久升級不等於較快回本；現階段要一起審查重生門檻、Clarity 來源與高職級停留時間，不能單独歸因 1.10 過弱。','', '12. **Boss／Sleep 風險鏈**：','', '|NEVER Policy|平均拍馬屁|遭遇率|逃跑成功率|Severity|加班總秒|跨睡窗次數|平均 Sleep Ratio|','|---|---:|---:|---:|---:|---:|---:|---:|']
for r in never:lines.append('|'+r['policy']+'|'+'|'.join(md(r[x]) for x in ['averageFlattery','encounterRate','escapeSuccessRate','meanSeverity','overtimeSeconds','crossSleepOvertimeCount','averageSleepRatio'])+'|')
lines+=['', 'ALL_ROUNDER 的遭遇、Severity、加班量確實提高，但睡眠平均仍接近完整；所有 NEVER 樣本沒有零睡眠夜。現有投入效率／摸魚／生活管理同時抵消風險，因此 **沒有出現強烈的睡眠惡性循環證據**，不能宣稱預期鏈條已完整成立。QUALITY_FIRST 的睡眠損失反而較大，顯示速度瓶頸必須一併檢查。','', '13. **下輪候選旋鈕**：優先討論 Lv200 後 Run Cost C／SoftCap2（高階等待與未達樣本）、重生 eligibility／Clarity reward／Permanent cost growth（ASAP 低階反覆循環與收入落後）、Flattery 收入係數與 Rank escape resistance／Life conversion（ALL_ROUNDER 高收入但睡眠風險未形成）。这些是有數據依據的候選，尚未修改任何數值。','', '14. **位置**：本報告、所有 CSV、career-results.json、career-sanity.json 同在 reports/career-progression。壓縮包只包含匯出結果，不重複收錄大型原始 JSONL；原始資料仍保留在 part-0/1/2。','']
text='\n'.join(lines)
(root/'CAREER_RESULTS_14_ANSWERS.md').write_text(text,encoding='utf-8')
main=root/'CAREER_PRESTIGE_SIMULATION_REPORT.md'
old=main.read_text(encoding='utf-8').split('## 十四項正式回答（實測數據）')[0]
main.write_text(old+text,encoding='utf-8')
print('14 ANSWERS COMPLETE')
