import csv,json,math,statistics,random,hashlib
from pathlib import Path
from collections import defaultdict
root=Path(__file__).resolve().parents[1];out=root/'FIRST_COMPANY_BALANCE_WALL_V2'
runs=json.loads((out/'runs.json').read_text());groups=defaultdict(list)
for r in runs:groups[r['version']].append(r)
def q(v,p=.5):
 if not v:return None
 a=sorted(v);i=(len(a)-1)*p;l,h=a[math.floor(i)],a[math.ceil(i)]
 return l if l==h else l+(h-l)*(i%1)
def cens(v,p=.5):
 z=q([x if x is not None else math.inf for x in v],p)
 return z if z is not None and math.isfinite(z) else None
def mean(v):return statistics.mean(v) if v else None
def csvread(name):return list(csv.DictReader((out/name).open(encoding='utf-8')))
def write(name,rows):
 keys=list(dict.fromkeys(k for r in rows for k in r))
 with (out/name).open('w',encoding='utf-8-sig',newline='') as f:
  w=csv.DictWriter(f,fieldnames=keys);w.writeheader();w.writerows(rows)
def val(x):return None if x=='' else float(x)
purchases=csvread('purchases.csv');etas=csvread('etas.csv');bursts=[];byburst=defaultdict(list)
for p in purchases:byburst[(p['version'],int(p['seed']),float(p['realSeconds']))].append(p)
runmap={(r['version'],r['seed']):r for r in runs};prev={}
for (candidate,seed,time),ps in sorted(byburst.items(),key=lambda x:(x[0][0],x[0][1],x[0][2])):
 rank=int(ps[0]['rank']);r=runmap[(candidate,seed)];start=r['rankTimes'][rank];end=r['rankTimes'][rank+1] if rank<4 and r['rankTimes'][rank+1] is not None else 3600
 fraction=(time-start)/(end-start) if end>start else 0;quartile='early25' if fraction<.25 else 'middle50' if fraction<.75 else 'late25'
 last=prev.get((candidate,seed));bursts.append(dict(candidate=candidate,seed=seed,rank=rank,realSeconds=time,purchases=len(ps),burstInterval=time-last if last is not None else None,rankPhase=quartile,rankExitCensored=rank==4 or r['rankTimes'][rank+1] is None));prev[(candidate,seed)]=time
write('purchase-bursts.csv',bursts)
summary=[];rankrows=[];burstrows=[];promotionrows=[];levelrows=[];cirows=[]
for candidate,allruns in groups.items():
 for n,rs in [(10,sorted(allruns,key=lambda r:r['seed'])[:10])]+([(30,allruns)] if len(allruns)==30 else []):
  seeds={r['seed'] for r in rs};entry={'candidate':candidate,'samples':n,'r4Reached':sum(r['rankTimes'][4] is not None for r in rs),'r4Censored':sum(r['rankTimes'][4] is None for r in rs)}
  for rank in range(1,5):
   times=[r['rankTimes'][rank]/60 if r['rankTimes'][rank] is not None else None for r in rs]
   for p in [.1,.5,.9]:entry[f'R{rank}P{int(p*100)}Minutes']=cens(times,p)
   if n==30:
    rng=random.Random(1937+rank);boot=[cens([rng.choice(times) for _ in times]) for _ in range(2000)];cirows.append(dict(candidate=candidate,rank=rank,bootstrapResamples=2000,medianMinutes=cens(times),ci95Low=cens(boot,.025),ci95High=cens(boot,.975),censored=n-sum(t is not None for t in times)))
  for rank in range(5):
   selected=[r for r in rs if r['rankTimes'][rank] is not None];bs=[b for b in bursts if b['candidate']==candidate and b['seed'] in seeds and b['rank']==rank];intervals=[b['burstInterval'] for b in bs if b['burstInterval'] is not None]
   burst={'candidate':candidate,'samples':n,'rank':rank,'burstCount':len(bs),'intervalP10':q(intervals,.1),'intervalP50':q(intervals),'intervalP90':q(intervals,.9)}
   for phase in ['early25','middle50','late25']:burst[phase+'P50']=q([b['burstInterval'] for b in bs if b['rankPhase']==phase and b['burstInterval'] is not None])
   burstrows.append(burst);entry[f'R{rank}BurstP50']=burst['intervalP50'];entry[f'R{rank}LateBurstP50']=burst['late25P50']
   observed=[r['rankStats'][rank] for r in selected];ep=[val(e['medianNextUpgradeETA']) for e in etas if e['version']==candidate and int(e['seed']) in seeds and int(e['rank'])==rank and e['medianNextUpgradeETA']!='']
   row=dict(candidate=candidate,samples=n,rank=rank,entered=len(selected),completed=sum('end' in x for x in observed),dwellP10=q([r['rankDwellSeconds'][rank] for r in selected],.1),dwellP50=q([r['rankDwellSeconds'][rank] for r in selected]),dwellP90=q([r['rankDwellSeconds'][rank] for r in selected],.9),startEfficiencyP50=q([x['startEQ']['efficiency'] for x in observed]),startQualityP50=q([x['startEQ']['quality'] for x in observed]),exitEfficiencyP50=q([x['endEQ']['efficiency'] for x in observed if 'endEQ' in x]),exitQualityP50=q([x['endEQ']['quality'] for x in observed if 'endEQ' in x]),purchaseCount=sum(int(p['rank'])==rank and p['version']==candidate and int(p['seed']) in seeds for p in purchases),medianNextUpgradeETA=q(ep))
   rankrows.append(row)
   if rank<4:
    attempts=[a for r in rs for a in r['attempts'] if a['rank']==rank];first=[next((a for a in r['attempts'] if a['rank']==rank),None) for r in rs];first=[x for x in first if x];closed=[x for x in attempts if x['result']=='SUCCESS' or 'overtimeFinished' in x]
    promo=dict(candidate=candidate,samples=n,fromRank=rank,attempts=len(attempts),firstAttemptRuns=len(first),firstSuccessPercent=100*sum(x['result']=='SUCCESS' for x in first)/len(first) if first else None,firstFailedOvertimePercent=100*sum(x['result']=='FAILED_OVERTIME' for x in first)/len(first) if first else None,firstPendingPercent=100*sum(x['result'] is None for x in first)/len(first) if first else None,meanDinnerCompletionPercent=mean([x['dinnerCompletionPercent'] for x in attempts if x['dinnerCompletionPercent'] is not None]),meanRetries=mean([max(0,sum(x['rank']==rank for x in r['attempts'])-1) for r in rs]),meanCompletedOvertimeProcessing=mean([x['overtimeWorld'] for x in closed]),meanCompletedOvertimeElapsed=mean([x['overtimeElapsedReal'] for x in closed]),completedAttempts=len(closed));promotionrows.append(promo);entry[f'R{rank}FirstFailurePercent']=promo['firstFailedOvertimePercent']
  reached=[r for r in rs if r['rankTimes'][4] is not None]
  for id in ['efficiency','quality','flattery','lifeManagement','slacking']:
   levels=[r['rankStats'][4]['startLevels'][id] for r in reached];levelrows.append(dict(candidate=candidate,samples=n,ability=id,reached=len(levels),P10=q(levels,.1),P50=q(levels),P90=q(levels,.9)))
  for key in ['todo','dueToday','overdue']:
   entry[key+'Average']=mean([r['counts']['average'][key] for r in rs]);entry[key+'FinalP50']=q([r['counts']['final'][key] for r in rs]);entry[key+'PeakP90']=q([r['counts']['peak'][key] for r in rs])
  entry['bossOvertimeMeanSeconds']=mean([r['bossOvertime'] for r in rs]);entry['sleepRatioMean']=mean([mean(r['sleepRatios']) for r in rs if r['sleepRatios']]);entry['sleepRatioP10']=q([x for r in rs for x in r['sleepRatios']],.1);summary.append(entry)
write('candidate-summary.csv',[x for x in summary if x['samples']==10]);write('top3-30seed-summary.csv',[x for x in summary if x['samples']==30]);write('candidate-rank-times.csv',rankrows);write('candidate-burst-intervals.csv',burstrows);write('candidate-promotions.csv',promotionrows);write('candidate-levels-at-r4.csv',levelrows);write('top3-confidence-intervals.csv',cirows)
costs=[]
for growth in [1.040,1.042,1.045]:
 for level in [200,300,500,1000]:
  for ability,base in dict(efficiency=30,quality=34,flattery=47,lifeManagement=38,slacking=43).items():costs.append(dict(baseGrowth=growth,level=level,ability=ability,nextCost=math.ceil(base*growth**level*1.015**max(0,level-60)*1.005**max(0,level-120))))
write('candidate-softwall-costs.csv',costs)
(out/'analysis.json').write_text(json.dumps(dict(summary=summary,burst=burstrows,promotion=promotionrows,levels=levelrows,rank=rankrows,confidence=cirows),indent=2))
print(json.dumps([{'id':x['candidate'],'n':x['samples'],'R4P50':x['R4P50Minutes'],'R4P90':x['R4P90Minutes'],'reached':x['r4Reached'],'burst':[x[f'R{i}BurstP50'] for i in range(4)],'lateR3':x['R3LateBurstP50'],'fail':[x[f'R{i}FirstFailurePercent'] for i in range(4)]} for x in summary],indent=2))
