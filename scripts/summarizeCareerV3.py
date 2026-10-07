"""Compact measured results for the requested 36-item response."""
import json,statistics,collections
from pathlib import Path
R=Path(__file__).resolve().parent.parent/'reports/career-v3-full'
a=json.loads((R/'analysis.json').read_text(encoding='utf-8'));s=json.loads((R/'career-v3-sanity.json').read_text(encoding='utf-8'));st=json.loads((R/'stability.json').read_text(encoding='utf-8'));rc=json.loads((R/'recrawl-summary.json').read_text(encoding='utf-8'))
P=['PROMOTE_ASAP_BALANCED','PREPARED_BALANCED','EFFICIENCY_FIRST','QUALITY_FIRST','ALL_ROUNDER']
rows=[]
for p in sorted(R.glob('canonical-part-*/runs.jsonl')):rows.extend(json.loads(x) for x in p.read_text(encoding='utf-8').splitlines())
never=[r for r in rows if r['timing']=='NEVER'];events=[]
for p in sorted(R.glob('canonical-part-*/promotions.jsonl')):events.extend(json.loads(x) for x in p.read_text(encoding='utf-8').splitlines())
def mean(xs):
 xs=[x for x in xs if isinstance(x,(int,float))];return sum(xs)/len(xs) if xs else None
def q(xs,p=.5):
 xs=sorted(x for x in xs if isinstance(x,(int,float)))
 if not xs:return None
 i=(len(xs)-1)*p;k=int(i);return xs[k]+(xs[min(k+1,len(xs)-1)]-xs[k])*(i-k)
result={'firstTable':a['firstTable'],'r4':a['r4Stats'],'bottlenecks':a['transitions'],'failure':a['failure'],'stability':st,'neverBuilds':[r for r in a['summary'] if r['timing']=='NEVER'],'gaps':a['gaps'],'recrawlR4':[r for r in rc if r['milestone']=='R4'],'sanity':s}
result['delays']={metric:{'median':q([r.get(metric) for r in events]),'p90':q([r.get(metric) for r in events],.9),'max':max([r[metric] for r in events if r.get(metric) is not None],default=None)} for metric in ['startDelayOffWork','startDelayDinner']}
result['timingPrestige']=[{'timing':t,'countMin':min(r['prestigeCount'] for r in rows if r['timing']==t),'countMedian':q([r['prestigeCount'] for r in rows if r['timing']==t]),'countMax':max(r['prestigeCount'] for r in rows if r['timing']==t),'clarityEarnedMedian':q([r['clarityEarned'] for r in rows if r['timing']==t]),'clarityBalanceMedian':q([r['clarityTotal'] for r in rows if r['timing']==t])} for t in ['NEVER','AS_SOON_AS_ELIGIBLE','TARGET_30_MIN','TARGET_60_MIN','TARGET_120_MIN','TARGET_180_MIN']]
result['promoReplaced']=sum(r['promotionNightReplacedBossCheck'] for r in rows)
result['neverDetail']=[{'policy':p,**{k:mean([r[k] for r in never if r['policy']==p]) for k in ['grossPerMinute','completedWorkPerDay','bossWorkSecondsPerDay','meetingSecondsPerDay','sleepRatioMean','zeroSleepDays','entertainmentSkippedDays','entertainmentAttemptDays','finalTodo','finalOverdue']}} for p in P]
result['softwall']=[{'policy':p,'ability':ab,'from':fr,'to':to,'reached':sum(not r['censored'] for r in a['waits'] if r['policy']==p and r['timing']=='NEVER' and r['ability']==ab and r['from']==fr and r['to']==to),'medianMinutes':q([r['minutes'] for r in a['waits'] if r['policy']==p and r['timing']=='NEVER' and r['ability']==ab and r['from']==fr and r['to']==to])} for p in P for ab in ['efficiency','quality'] for fr,to in zip([100,150,175,200,225,250,275],[150,175,200,225,250,275,300])]
(R/'final-answer-data.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps({k:v for k,v in result.items() if k not in ['bottlenecks','gaps','recrawlR4','softwall','sanity']},ensure_ascii=False))
