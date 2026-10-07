# -*- coding: utf-8 -*-
import csv,json,statistics,math,collections
from pathlib import Path
root=Path(__file__).resolve().parent.parent/'reports'/'career-progression'
rows={}
with (root/'career-milestones.csv').open(encoding='utf-8-sig',newline='') as f:
 for r in csv.DictReader(f):
  if r['cycle'] not in ['0','1'] or r['ability'] not in ['efficiency','quality'] or r['level'] not in ['100','200'] or r['timing']=='NEVER_PRESTIGE':continue
  key=(r['policy'],r['timing'],r['ability'],int(r['level']),int(r['seed']))
  rows.setdefault(key,{})[int(r['cycle'])]=float(r['minutesInRun']) if r['minutesInRun'] else None
out=[];groups=collections.defaultdict(list)
for (p,t,a,lv,seed),times in rows.items():
 first=times.get(0);second=times.get(1);pct=(1-second/first)*100 if first and second is not None else None
 r={'policy':p,'timing':t,'ability':a,'level':lv,'seed':seed,'cycle0Minutes':first,'cycle1Minutes':second,'pairedReductionPercent':pct,'pairedCensored':pct is None};out.append(r);groups[(p,t,a,lv)].append(r)
def q(xs,p):
 xs=sorted(xs)
 if not xs:return None
 pos=(len(xs)-1)*p;i=int(pos);return xs[i]+(xs[math.ceil(pos)]-xs[i])*(pos-i)
summary=[]
for (p,t,a,lv),rs in groups.items():
 observed=[r for r in rs if not r['pairedCensored']];xs=[r['pairedReductionPercent'] for r in observed]
 summary.append({'policy':p,'timing':t,'ability':a,'level':lv,'pairedObserved':len(xs),'pairedCensored':len(rs)-len(xs),'medianReductionPercent':q(xs,.5),'p10ReductionPercent':q(xs,.1),'p90ReductionPercent':q(xs,.9),'cycle0PairedMedian':q([r['cycle0Minutes'] for r in observed],.5),'cycle1PairedMedian':q([r['cycle1Minutes'] for r in observed],.5)})
for name,data in [('career-cycle-paired-recovery.csv',out),('career-cycle-paired-recovery-summary.csv',summary)]:
 with (root/name).open('w',encoding='utf-8-sig',newline='') as f:
  w=csv.DictWriter(f,list(data[0]));w.writeheader();w.writerows(data)
(root/'career-cycle-paired-recovery-summary.json').write_text(json.dumps(summary,indent=2),encoding='utf-8')
print('PAIRED RECOVERY COMPLETE')
