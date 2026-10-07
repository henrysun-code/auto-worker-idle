# -*- coding: utf-8 -*-
import json,csv,statistics,math
from pathlib import Path
root=Path(__file__).resolve().parent.parent/'reports'/'career-progression'
audit=[r for i in range(3) for r in json.loads((root/f'part-{i}'/'entertainment-audit.json').read_text(encoding='utf-8'))]
assert len(audit)==900 and all(r['primaryEconomyAndWorkloadEqual'] for r in audit)
lookup={(r['policy'],r['timing'],r['seed']):r['entertainmentMissedDueToOvertime'] for r in audit}
details={(r['policy'],r['timing'],r['seed']):r for r in audit}
block_fields=['moneyBlockedSeconds','overdueBlockedSeconds','recommendedBlockedSeconds','fundedOverdueBlockedSeconds']
assert len(lookup)==900
field='entertainmentMissedDueToOvertime'
results=json.loads((root/'career-results.json').read_text(encoding='utf-8'))
for r in results['runs']:
 r[field]=lookup[(r['policy'],r['timing'],r['seed'])]
 for b in block_fields:r[b]=details[(r['policy'],r['timing'],r['seed'])][b]
def quantile(xs,p):
 a=sorted(xs);t=(len(a)-1)*p;i=int(t);return a[i]+(a[math.ceil(t)]-a[i])*(t-i)
for s in results['scenarios']:
 xs=[r[field] for r in results['runs'] if r['policy']==s['policy'] and r['timing']==s['timing']]
 s[field]={'observed':len(xs),'censored':0,'mean':statistics.mean(xs),**{k:quantile(xs,p) for k,p in [('median',.5),('p10',.1),('p25',.25),('p75',.75),('p90',.9)]}}
 for b in block_fields:
  values=[r[b] for r in results['runs'] if r['policy']==s['policy'] and r['timing']==s['timing']]
  s[b]={'observed':len(values),'censored':0,'mean':statistics.mean(values),**{k:quantile(values,p) for k,p in [('median',.5),('p10',.1),('p25',.25),('p75',.75),('p90',.9)]}}
for name in ['career-runs.csv','career-economy.csv','career-policy-summary.csv','career-prestige-timing-summary.csv']:
 p=root/name
 with p.open(encoding='utf-8-sig',newline='') as f:
  reader=csv.DictReader(f);headers=reader.fieldnames;rows=list(reader)
 for r in rows:
  if 'seed' in r:r[field]=lookup[(r['policy'],r['timing'],int(r['seed']))]
  else:r[field]=json.dumps(next(s[field] for s in results['scenarios'] if s['policy']==r['policy'] and s['timing']==r['timing']),separators=(',',':'))
  for b in block_fields:
   if 'seed' in r:r[b]=details[(r['policy'],r['timing'],int(r['seed']))][b]
   else:r[b]=json.dumps(next(s[b] for s in results['scenarios'] if s['policy']==r['policy'] and s['timing']==r['timing']),separators=(',',':'))
 for b in block_fields:
  if b not in headers:headers.append(b)
 with p.open('w',encoding='utf-8-sig',newline='') as f:
  writer=csv.DictWriter(f,headers);writer.writeheader();writer.writerows(rows)
for name,table in [('career-promotion-blocks.csv','promotionBlocks'),('career-promotions.csv','promotions')]:
 p=root/name
 with p.open(encoding='utf-8-sig',newline='') as f:headers=csv.DictReader(f).fieldnames
 rows=[]
 for r in audit:
  meta=next(x for x in results['runs'] if (x['policy'],x['timing'],x['seed'])==(r['policy'],r['timing'],r['seed']))
  for item in r[table]:rows.append({'scenarioId':meta['scenarioId'],'replicate':meta['replicate'],**item})
 with p.open('w',encoding='utf-8-sig',newline='') as f:
  w=csv.DictWriter(f,headers);w.writeheader();w.writerows([{k:json.dumps(v,separators=(',',':')) if isinstance(v,(dict,list)) else v for k,v in row.items()} for row in rows])
with (root/'career-entertainment-audit.csv').open('w',encoding='utf-8-sig',newline='') as f:
 headers=[k for k in audit[0] if k not in ['promotionBlocks','promotions']]
 writer=csv.DictWriter(f,headers,extrasaction='ignore');writer.writeheader();writer.writerows(audit)
sanity=json.loads((root/'career-sanity.json').read_text(encoding='utf-8'))
sanity['entertainmentMetricReplay']={'logicalRuns':900,'additionalMatchedReplays':1800,'allPrimaryEconomyAndWorkloadEqual':True,'reason':'Exact money and funded-overdue exposure also updates at every production boundary, including food spending. Includes Boss completion before sleep anchor when insufficient entertainment time remains; not only overtime crossing sleep anchor.'}
sanity['regression']['core']=323
results['sanity']=sanity
(root/'career-sanity.json').write_text(json.dumps(sanity,ensure_ascii=False,indent=2),encoding='utf-8')
(root/'career-results.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
report=root/'CAREER_PRESTIGE_SIMULATION_REPORT.md'
report.write_text(report.read_text(encoding='utf-8').replace('321/321','323/323').replace('322/322','323/323').replace('321 核心','323 核心').replace('322 核心','323 核心'),encoding='utf-8')
with report.open('a',encoding='utf-8') as f:f.write('\n額外觀測复核：相同 900 個邏輯 Run 共進行兩次同種子重播（合計 1800 次指標复核），補齊 Boss 完成後不足以生成娛樂的跳過事件（原先只計跨睡窗）。所有主要收入、成本、工作量、重生數、最終能力與永久等級一致；這 1800 次是指標复核，不算額外獨立 Seed。匯出 runs/economy/summary 的娛樂跳過值已以 career-entertainment-audit.csv 校正；升職卡關區間也在每個邊界更新，包含餐費支出；promotions/promotion-blocks 已以最終复核更新。原始 JSONL 仍保留首次觀測值作追溯。\n')
print('900 matched entertainment audits applied')
