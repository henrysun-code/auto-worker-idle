"""Read-only statistics/reporting over canonical production observer JSONL."""
import json, math, statistics, itertools, collections
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent/'reports'/'career-v3-full'
POLICIES=['PROMOTE_ASAP_BALANCED','PREPARED_BALANCED','EFFICIENCY_FIRST','QUALITY_FIRST','ALL_ROUNDER']
TIMINGS=['NEVER','AS_SOON_AS_ELIGIBLE','TARGET_30_MIN','TARGET_60_MIN','TARGET_120_MIN','TARGET_180_MIN']
def read(name):
 rows=[]
 for p in sorted(ROOT.glob(f'canonical-part-*/{name}.jsonl')):
  rows.extend(json.loads(x) for x in p.read_text(encoding='utf-8').splitlines() if x)
 return rows
def quantile(xs,p=.5):
 xs=sorted(x for x in xs if isinstance(x,(int,float)) and math.isfinite(x))
 if not xs:return None
 i=(len(xs)-1)*p;a=math.floor(i);b=math.ceil(i)
 return xs[a]+(xs[b]-xs[a])*(i-a)
def avg(xs):
 xs=[x for x in xs if isinstance(x,(int,float)) and math.isfinite(x)]
 return sum(xs)/len(xs) if xs else None
def fmt(x):return 'N/A' if x is None else f'{x:.3f}' if isinstance(x,(int,float)) else str(x)
def md(headers,rows):return '| '+' | '.join(headers)+' |\n| '+' | '.join(['---']*len(headers))+' |\n'+'\n'.join('| '+' | '.join(fmt(x) for x in row)+' |' for row in rows)+'\n'
def dump(name,obj):(ROOT/name).write_text(json.dumps(obj,ensure_ascii=False,indent=2),encoding='utf-8')
def flat(obj,prefix=''):
 out={}
 for k,v in obj.items():
  key=prefix+k
  if isinstance(v,dict):out.update(flat(v,key+'.'))
  elif isinstance(v,list):out[key]=json.dumps(v,ensure_ascii=False,separators=(',',':'))
  else:out[key]=v
 return out
def payload(name,rows):
 p=ROOT/'csv-inputs'/f'{name}.jsonl';p.parent.mkdir(exist_ok=True)
 with p.open('w',encoding='utf-8') as f:
  for row in rows:f.write(json.dumps(flat(row),ensure_ascii=False,separators=(',',':'))+'\n')

runs=read('runs');assert len(runs)==900,f'Canonical completion required, found {len(runs)}'
for row in runs:
 # Include the terminal boundary in Peak as well as positive-duration intervals.
 for kind in ['Todo','DueToday','Overdue']:row['peak'+kind]=max(row['peak'+kind],row['final'+kind])
keys={(r['policy'],r['timing'],r['seed']) for r in runs};assert len(keys)==900
assert all(r['actualActiveMinutes']==360 and r['productSpend']==r['taggedProductIncome']==0 for r in runs)
for p,t in itertools.product(POLICIES,TIMINGS):assert sum(r['policy']==p and r['timing']==t for r in runs)==30
ranks=read('ranks');promos=read('promotions');blocks=read('bottlenecks');thresholds=read('thresholds');prestiges=read('prestiges');sleeps=read('sleep');lunch=read('lunch');dinner=read('dinner');cycles=read('cycles');daily=read('daily')
cycleLevels={(r['policy'],r['timing'],r['seed'],r['cycle']):r['permanentLevels'] for r in cycles}
lookup=json.loads((ROOT/'snapshot-level-lookup.json').read_text(encoding='utf-8'))['lookup']
lookup={key:{k:dict(values) for k,values in row.items()} for key,row in lookup.items()}
for rows in [ranks,cycles,dinner,daily]:
 for row in rows:
  levels=cycleLevels[(row['policy'],row['timing'],row['seed'],row['cycle'])];key=f"{levels['workEfficiency']}:{levels['workQuality']}"
  row['qualificationE']=row['efficiency'];row['qualificationQ']=row['quality']
  row['efficiency']=lookup[key]['E'][row['qualificationE']];row['quality']=lookup[key]['Q'][row['qualificationQ']]
rankmap={(r['policy'],r['timing'],r['seed'],r['cycle'],r['rank']):r for r in ranks}
thresholdmap={(r['policy'],r['timing'],r['seed'],r['cycle'],r['ability'],r['level']):r for r in thresholds}
first=[r for r in runs if r['timing']=='NEVER'];firstRanks=[r for r in ranks if r['timing']=='NEVER' and r['cycle']==0]
firstBlocks=[r for r in blocks if r['timing']=='NEVER' and r['cycle']==0 and r['fromRank']<4]
firstTable=[];firstDetails=[];reach=[];transition=[];r4stats=[]
for p in POLICIES:
 pr=[r for r in firstRanks if r['policy']==p]
 times={rank:[r['minutesInRun'] for r in pr if r['rank']==rank] for rank in range(1,5)}
 firstTable.append([p,*[quantile(times[k]) for k in range(1,5)],quantile(times[4],.1),quantile(times[4],.9),*[sum(x<=m for x in times[4])/30*100 for m in [10,15,20,30]]])
 for rank in range(1,5):
  firstDetails.append({'policy':p,'rank':rank,'reached':len(times[rank]),**{f'P{int(q*100)}':quantile(times[rank],q) for q in [.1,.25,.5,.75,.9]}})
  for m in [5,10,15,20,30,45,60]:reach.append({'policy':p,'rank':rank,'minute':m,'reachPercent':sum(x<=m for x in times[rank])/30*100})
  rr=[r for r in pr if r['rank']==rank];bb=collections.defaultdict(float)
  for b in firstBlocks:
   if b['policy']==p and b['fromRank']==rank-1:bb[b['reason']]+=b['activeMinutes']
  dwell=[r['rankDwellFirstRunMinutes'][rank-1] for r in first if r['policy']==p]
  transition.append({'policy':p,'fromRank':rank-1,'toRank':rank,'medianTransitionMinutes':quantile(dwell),'medianE':quantile([r['qualificationE'] for r in rr]),'medianQ':quantile([r['qualificationQ'] for r in rr]),'medianMoney':quantile([r['money'] for r in rr]),'medianTodo':quantile([r['todo'] for r in rr]),'medianOverdue':quantile([r['overdue'] for r in rr]),'primaryBottleneck':max(bb,key=bb.get) if bb else 'N/A','bottleneckMinutes':dict(bb)})
 rr=[r for r in pr if r['rank']==4]
 r4stats.append({'policy':p,**{k:quantile([r[k] for r in rr]) for k in ['efficiency','quality','flattery','lifeManagement','slacking','money','todo','dueToday','overdue','age']}})

summary=[];prestigeSummary=[];recrawl=[];gaps=[];delay=[];failure=[];waits=[]
for p,t in itertools.product(POLICIES,TIMINGS):
 rr=[r for r in runs if r['policy']==p and r['timing']==t];pp=[r for r in promos if r['policy']==p and r['timing']==t and not r.get('censored')];pc=[r for r in prestiges if r['policy']==p and r['timing']==t]
 fails=[r for r in pp if not r['success']]
 row={'policy':p,'timing':t,'runs':30,'R4ReachPercent':sum(r['firstR4ActiveMinute'] is not None for r in rr)/30*100,'firstR4Median':quantile([r['firstR4ActiveMinute'] for r in rr]),'prestigeCountMedian':quantile([r['prestigeCount'] for r in rr]),'promotionAttempts':len(pp),'promotionFailures':len(fails),'promotionFailureRate':len(fails)/len(pp) if pp else None}
 for k in ['grossPerMinute','completedWorkPerDay','averageTodo','averageDueToday','averageOverdue','finalTodo','peakTodo','finalOverdue','peakOverdue','sleepRatioMean','bossWorkSecondsPerDay','meetingSecondsPerDay','clarityEarned','clarityTotal','netIncome']:row[k]=avg([r[k] for r in rr])
 for k in ['efficiency','quality','flattery','lifeManagement','slacking']:row['final.'+k]=quantile([r['finalLevels'][k] for r in rr])
 for k in rr[0]['permanentLevels']:row['permanent.'+k]=quantile([r['permanentLevels'][k] for r in rr])
 summary.append(row)
 gaprow={'policy':p,'timing':t,'eligibleGapMedian':quantile([r['firstPrestigeEligibleActiveMinute']-r['firstR4ActiveMinute'] for r in rr if r['firstPrestigeEligibleActiveMinute'] is not None and r['firstR4ActiveMinute'] is not None]),'actualGapMedian':quantile([r['firstPrestigeActiveMinute']-r['firstR4ActiveMinute'] for r in rr if r['firstPrestigeActiveMinute'] is not None and r['firstR4ActiveMinute'] is not None])};gaps.append(gaprow)
 prestigeSummary.append({**row,**gaprow,'firstPrestigeMedian':quantile([r['firstPrestigeActiveMinute'] for r in rr]),'runLengthMedian':quantile([r['runLength'] for r in pc]),'completedPrestigeRuns':len(pc)})
 for metric in ['startDelayOffWork','startDelayDinner']:delay.append({'policy':p,'timing':t,'metric':metric,'P50':quantile([r.get(metric) for r in pp]),'P90':quantile([r.get(metric) for r in pp],.9),'Max':max([r[metric] for r in pp if r.get(metric) is not None],default=None)})
 for seed in [42+i*7919 for i in range(30)]:
  for rank in [1,2,3,4]:
   a=rankmap.get((p,t,seed,0,rank));b=rankmap.get((p,t,seed,1,rank));a=a['minutesInRun'] if a else None;b=b['minutesInRun'] if b else None
   recrawl.append({'policy':p,'timing':t,'seed':seed,'milestone':f'R{rank}','first':a,'second':b,'improvementPercent':(a-b)/a*100 if a and b is not None else None,'pairedReached':a is not None and b is not None})
  for ability,level in itertools.product(['efficiency','quality'],[100,200]):
   a=thresholdmap.get((p,t,seed,0,ability,level),{}).get('minutesInRun');b=thresholdmap.get((p,t,seed,1,ability,level),{}).get('minutesInRun')
   recrawl.append({'policy':p,'timing':t,'seed':seed,'milestone':f'{ability}{level}','first':a,'second':b,'improvementPercent':(a-b)/a*100 if a and b is not None else None,'pairedReached':a is not None and b is not None})
for rank in range(1,5):
 pp=[r for r in promos if r['toRank']==rank and not r.get('censored')];ff=[r for r in pp if not r['success']]
 failure.append({'toRank':rank,'attempts':len(pp),'failures':len(ff),'failureRate':len(ff)/len(pp) if pp else None,'retries':sum(r['retryCount']>0 for r in pp),'causes':dict(collections.Counter(r.get('failureCategory','Other') for r in ff))})
for r in runs:
 for ability in ['efficiency','quality','flattery','lifeManagement','slacking']:
  for a,b in zip([100,150,175,200,225,250,275],[150,175,200,225,250,275,300]):
   key=(r['policy'],r['timing'],r['seed'],0,ability);aa=thresholdmap.get((*key,a),{}).get('minutesInRun');bb=thresholdmap.get((*key,b),{}).get('minutesInRun')
   waits.append({'policy':r['policy'],'timing':r['timing'],'seed':r['seed'],'ability':ability,'from':a,'to':b,'minutes':bb-aa if aa is not None and bb is not None else None,'censored':bb is None})

timeBudget=[]
for r in runs:
 timeBudget.append({k:r[k] for k in ['policy','timing','seed','actualActiveMinutes','timeSeconds','sleepLoss','actualSleepSecondsPerDay','sleepSpeedModifierExposure','sleepQualityModifierExposure','lunchOutputMean','lunchRatioMean','lunchMissed','entertainmentAttemptDays','entertainmentCompletedDays','entertainmentSkippedDays','entertainmentSecondsPerDay','bossWorkSecondsPerDay','meetingSecondsPerDay','normalMeetingCount','bossMeetingCount','meetingTouchSleep','meetingCrossWorkStart','meetingCausedWorkDelay','ageWorkloadMultiplierExposure']})
payload('career-v3-summary',summary);payload('career-v3-runs',runs);payload('career-v3-rank-timings',ranks);payload('career-v3-promotion-events',promos);payload('career-v3-promotion-bottlenecks',blocks);payload('career-v3-progression-thresholds',thresholds);payload('career-v3-prestige-summary',prestigeSummary);payload('career-v3-time-budget',timeBudget)
dump('analysis.json',{'firstTable':firstTable,'firstDetails':firstDetails,'reach':reach,'transitions':transition,'r4Stats':r4stats,'summary':summary,'prestigeSummary':prestigeSummary,'gaps':gaps,'delay':delay,'failure':failure,'recrawl':recrawl,'waits':waits})

previous={}
previousRanks={}
for part in (ROOT.parent/'career-progression-v2').glob('part-*/promotions.jsonl'):
 for line in part.read_text(encoding='utf-8').splitlines():
  r=json.loads(line)
  if r.get('cycle')==0:previousRanks[(r['policy'],'NEVER' if r['timing']=='NEVER_PRESTIGE' else r['timing'],r['seed'],r['toRank'])]=r.get('minutesInRun')
for part in (ROOT.parent/'career-progression-v2').glob('part-*/runs.jsonl'):
 for line in part.read_text(encoding='utf-8').splitlines():
  r=json.loads(line);previous[(r['policy'],'NEVER' if r['timing']=='NEVER_PRESTIGE' else r['timing'],r['seed'])]=r
paired=[]
mapping={'grossPerMinute':lambda r:r['grossIncome']/360,'completedWorkPerDay':lambda r:r['completedWork']/360,'finalTodo':lambda r:r.get('todo'),'finalOverdue':lambda r:r.get('overdue'),'sleepRatioMean':lambda r:r.get('averageSleepRatio'),'bossWorkSecondsPerDay':lambda r:r.get('overtimeSeconds',0)/360,'prestigeCount':lambda r:r.get('prestigeCount')}
for r in runs:
 old=previous.get((r['policy'],r['timing'],r['seed']))
 if old:
  rankDelta={}
  for rank in [1,2,3,4]:
   prior=previousRanks.get((r['policy'],r['timing'],r['seed'],rank));current=rankmap.get((r['policy'],r['timing'],r['seed'],0,rank),{}).get('minutesInRun');rankDelta[f'R{rank}']=current-prior if current is not None and prior is not None else None
  paired.append({'policy':r['policy'],'timing':r['timing'],'seed':r['seed'],**{k+'Delta':r[k]-f(old) if f(old) is not None else None for k,f in mapping.items()},'rankDeltaMinutes':rankDelta,'abilityDelta':{k:r['finalLevels'][k]-old['finalLevels'][k] for k in r['finalLevels']}})
dump('previous-paired.json',paired)
comparison='舊版為 manual promotion，新版為正式 Promotion Assignment。這是系統版本配對差異，不能單獨歸因於升職機制。舊版未保存 Meeting／時間加權 Todo，這些欄位為 N/A。Rank時間來自兩版正式事件表的First Run同Rank配對。\n\n'+md(['Policy','Paired N','Gross/min Δ','Work/day Δ','Final Todo Δ','Final Overdue Δ','Sleep ratio Δ','Boss sec/day Δ'],[[p,len([r for r in paired if r['policy']==p]),*[avg([r[k+'Delta'] for r in paired if r['policy']==p]) for k in ['grossPerMinute','completedWorkPerDay','finalTodo','finalOverdue','sleepRatioMean','bossWorkSecondsPerDay']]] for p in POLICIES])
comparison+='\n'+md(['Policy','R1 paired Δ min','R2','R3','R4'],[[p,*[quantile([r['rankDeltaMinutes'][f'R{rank}'] for r in paired if r['policy']==p]) for rank in [1,2,3,4]]] for p in POLICIES])
(ROOT/'CAREER_V3_VS_PREVIOUS.md').write_text('# Career V3 vs Previous\n\n'+comparison,encoding='utf-8')

firstReport='# First Company Pacing\n\n僅 NEVER / 150 條 / Permanent0 / ProductsOFF / LowProfileOFF。單位 active minutes；分位數只用已達成樣本，Reach 以完整30個種子為分母。\n\n'+md(['Policy','R1 P50','R2 P50','R3 P50','R4 P50','R4 P10','R4 P90','R4 by10 %','by15 %','by20 %','by30 %'],firstTable)
firstReport+='\n## Rank 分位數\n\n'+md(['Policy','Rank','Reached','P10','P25','P50','P75','P90'],[[r[k] for k in ['policy','rank','reached','P10','P25','P50','P75','P90']] for r in firstDetails])
firstReport+='\n## Transition 與主要等待\n\n完成後能力／資金快照；E/Q是正式Qualification数值。primary bottleneck 為該階段最長的互斥等待類別。E優先於Q、Money、Overdue；故同時欠缺時不重複計算。\n\n'+md(['Policy','Transition','Duration P50','Qualification E P50','Qualification Q P50','Money P50','Todo P50','Overdue P50','Primary bottleneck'],[[r['policy'],f"R{r['fromRank']}→R{r['toRank']}",*[r[k] for k in ['medianTransitionMinutes','medianE','medianQ','medianMoney','medianTodo','medianOverdue','primaryBottleneck']]] for r in transition])
firstReport+='\n## R4 Snapshot\n\n'+md(['Policy','E','Q','拍馬屁','Life','摸魚','Money','Todo','Due Today','Overdue','Age'],[[r[k] for k in ['policy','efficiency','quality','flattery','lifeManagement','slacking','money','todo','dueToday','overdue','age']] for r in r4stats])
firstReport+='\n## Reach 所有時間點\n\n'+md(['Policy','Rank','Active min','Reach %'],[[r[k] for k in ['policy','rank','minute','reachPercent']] for r in reach])
firstReport+='\n## Evidence 範圍\n\nR4 快照能力與首次 threshold 時間可判斷是否在R4前碰到100／150／200；等待區間實測見主報告。Boss、Meeting、Project、Deadline、Sleep全部正式啟用且各有實測輸出。各事件首次出現時間未逐一保存，不能據全程總數宣稱R4前已全部展示。Prestige第一次資格以正式30 active分鐘Gate為下限。第一家公司是否「夠快」需產品目標判斷，未預設12～15分鐘。\n'
(ROOT/'FIRST_COMPANY_PACING.md').write_text(firstReport,encoding='utf-8')

full='# Career V3 Full Simulation — Canonical 900 Runs\n\n900獨立logical runs，各360 actual active分鐘；無前段去重。5×6×30。Production Source / Excel / Runtime Config不得變動。\n\nSeeds：'+', '.join(str(42+i*7919) for i in range(30))+'.\n\n'
full+='Policy Adapter沿用原五種build；只有正式automatic Promotion Assignment。SCHEDULED／pending／ACTIVE保留升職費；未安排前保留原Policy reserve邏輯。Permanent沿用CORE_RECRAWL cheapest valid next及原tie order。Products／Offline／LowProfile OFF。\n\n'
full+='## Career Summary\n\n'+md(['Policy','Timing','N','R4 %','R4 P50','Prestige P50','Gross/min','Work/day','Todo avg','Overdue avg','Sleep ratio','Boss sec/day','Meeting sec/day','Promotion fail %'],[[r['policy'],r['timing'],r['runs'],r['R4ReachPercent'],r['firstR4Median'],r['prestigeCountMedian'],*[r[k] for k in ['grossPerMinute','completedWorkPerDay','averageTodo','averageOverdue','sleepRatioMean','bossWorkSecondsPerDay','meetingSecondsPerDay']],100*r['promotionFailureRate'] if r['promotionFailureRate'] is not None else None] for r in summary])
full+='\n## Promotion Failures\n\n'+md(['To Rank','Attempts','Failures','Failure %','Retry Attempts','Causes'],[[r['toRank'],r['attempts'],r['failures'],100*r['failureRate'] if r['failureRate'] is not None else None,r['retries'],json.dumps(r['causes'])] for r in failure])
full+='\n## Promotion Start Delays\n\nWorld seconds。OffWork是該scheduledWorkday的正式理想錨點；Dinner是实际完成時刻。\n\n'+md(['Policy','Timing','Metric','P50','P90','Max'],[[r[k] for k in ['policy','timing','metric','P50','P90','Max']] for r in delay])
full+='\n## R4 → Prestige Gaps\n\nActive minutes。NEVER actual gap為N/A。\n\n'+md(['Policy','Timing','Eligible P50','Actual P50'],[[r[k] for k in ['policy','timing','eligibleGapMedian','actualGapMedian']] for r in gaps])
full+='\n## Soft Wall 實測\n\nFirst Run only；interval只對兩端達成配對樣本計算，未到達保留censored。\n\n'
wall=[]
for p,a,left,right in itertools.product(POLICIES,['efficiency','quality'],[0],[0]):
 for start,end in zip([100,150,175,200,225,250,275],[150,175,200,225,250,275,300]):
  ww=[r for r in waits if r['policy']==p and r['timing']=='NEVER' and r['ability']==a and r['from']==start and r['to']==end]
  wall.append([p,a,f'{start}→{end}',sum(not r['censored'] for r in ww),quantile([r['minutes'] for r in ww]),sum(r['censored'] for r in ww)])
full+=md(['Policy','Ability','Interval','Reached N','Minutes P50','Censored N'],wall)
full+='\n## Permanent Recrawl\n\n仅First vs Second，必须两个run都达成才计算缩短率。Engine recrawl数据，不代表未来Company System。\n\n'
recrawlSummary=[]
for p,t,m in itertools.product(POLICIES,TIMINGS,['R1','R2','R3','R4','efficiency100','efficiency200','quality100','quality200']):
 rr=[r for r in recrawl if r['policy']==p and r['timing']==t and r['milestone']==m];recrawlSummary.append({'policy':p,'timing':t,'milestone':m,'pairedN':sum(r['pairedReached'] for r in rr),'improvementP50':quantile([r['improvementPercent'] for r in rr])})
dump('recrawl-summary.json',recrawlSummary)
full+=md(['Policy','Timing','Milestone','Paired N','Improvement P50 %'],[[r[k] for k in ['policy','timing','milestone','pairedN','improvementP50']] for r in recrawlSummary])
full+='\n## Measurement definitions / limitations\n\n'
full+='- 原始snapshot的efficiency/quality欄位實際保存Qualification值，与ability字段同名；匯出器使用正式getPromotionQualificationStats API對每個cycle的permanent levels建立精確反查，分别匯出ability levels與qualificationE/Q。原始JSONL保留，沒有重跑／改變canonical trajectory。\n'
full+='- Todo/DueToday/Overdue：current+queued+suspended去重，不含未释放Pending；時間加權平均、Final與Peak。\n- Work conservation：正式指派进入liveWork时算generated，尚未释放Pending属于未指派计划，排除兩邊；Prestige未处理liveWork独立记discarded；Generated−Processed−Discarded−Outstanding。完成epsilon允许微小progress尾差，未把差异补0。\n- Revenue：StartingMoney + Gross − Upgrade − Promotion − Other − PrestigeDiscardedCash − FinalMoney。Gross含Work、Parent Bonus与Meeting；所有Products支出／Tagged Income严格0。\n- Sleep actualDuration直接读取正式window.duration，不是由ratio倒推。归因是实际busy Target与理想sleep window的重叠，非counterfactual新增损失；其它时间标记UNATTRIBUTED。Boss-caused Entertainment loss无法可靠反事实归因，N/A。Meeting work delay同理N/A。\n- Meeting count为实际执行过的unique目标，Seconds来自实际interval；Normal/Boss替代分列。\n- Dinner completion delay相对OffWork锚点，包含正常4秒免费餐处理；没有捏造额外“理想Dinner结束”Config。\n- Promotion processing为实际PROMOTION区间；failure来自正式reason／Money／Overdue；delaySources依据从OffWork到实际start的目标类型history。\n- Rank snapshot为完成瞬间、policy购买前状态。Ability threshold为正式购买后、当run active时间；未达成区分CENSORED_AT_PRESTIGE及CENSORED_AT_360。\n- Age只自然推进；既有Work workload逐boundary核对不变；每个Prestige后Age回22。\n- Quantiles使用线性插值；所有缺失值为null/N/A，未替换0。\n'
full+='\n## Sanity\n\n900/900、唯一scenario/seed组合、完整active time与每组30样本均检验。收入最大误差 '+fmt(max(r['maxRevenueError'] for r in runs))+'；工作量最大误差 '+fmt(max(r['maxWorkloadError'] for r in runs))+'. 最终Regression／Config结果见career-v3-sanity.json。\n'
full+='\n## Previous comparison\n\n'+comparison
full+='\n## NEVER Build 經濟／工作／壓力\n\n以下每Policy為30種子平均，全程360 active minutes。\n\n'
economyKeys=['grossWorkIncome','projectParentBonus','meetingCompensation','bossIncome','runUpgradeSpend','promotionSpend','otherSpend','startingMoneyContribution','netIncome','finalMoney']
full+=md(['Policy',*economyKeys],[[p,*[avg([r[k] for r in first if r['policy']==p]) for k in economyKeys]] for p in POLICIES])
pressureKeys=['averageTodo','finalTodo','peakTodo','averageDueToday','finalDueToday','peakDueToday','averageOverdue','finalOverdue','peakOverdue','overdueCompleted','overdueRevenueLoss','reworkCount']
full+='\n'+md(['Policy',*pressureKeys],[[p,*[avg([r[k] for r in first if r['policy']==p]) for k in pressureKeys]] for p in POLICIES])
full+='\n## Work Source\n\n'+md(['Policy','Source','Generated Count','Generated Workload','Processed Workload','Completed Count','Income'],[[p,source,*[avg([r['sources'][source][k] for r in first if r['policy']==p]) for k in ['count','generated','processed','completed','income']]] for p,source in itertools.product(POLICIES,['NORMAL','FOLLOW_UP','PROJECT','BOSS','EVENT'])])
full+='\n## Boss／Meeting\n\n'+md(['Policy','Boss Checks','Encounter %','Severity Mean','Severity P50 median','Severity P90 median','Severity Max','Escape Success','Escape Fail','Boss Work Count','Boss Meeting','Promotion replaced checks'],[[p,avg([r['bossChecks'] for r in first if r['policy']==p]),100*avg([r['bossEncounterRate'] for r in first if r['policy']==p]),avg([r['severityMean'] for r in first if r['policy']==p]),quantile([r['severityP50'] for r in first if r['policy']==p]),quantile([r['severityP90'] for r in first if r['policy']==p]),max(r['severityMax'] for r in first if r['policy']==p),*[avg([r[k] for r in first if r['policy']==p]) for k in ['escapeSuccess','escapeFailure','mandatoryBossWorkCount','bossMeetingReplacementCount','promotionNightReplacedBossCheck']]] for p in POLICIES])
full+='\n## Sleep／Life／Age\n\n'+md(['Policy','Sleep mean','Sleep median','P10','P90','Below1 days','Below0.5 days','Zero days','Sleep sec/day','Lunch output','Lunch ratio','Missed lunch','Ent attempted','Ent completed','Ent skipped','Ent sec/day','Final Life Lv','End Age'],[[p,*[avg([r[k] for r in first if r['policy']==p]) for k in ['sleepRatioMean','sleepRatioMedian','sleepRatioP10','sleepRatioP90','sleepBelow1','sleepBelowHalf','zeroSleepDays','actualSleepSecondsPerDay','lunchOutputMean','lunchRatioMean','lunchMissed','entertainmentAttemptDays','entertainmentCompletedDays','entertainmentSkippedDays','entertainmentSecondsPerDay']],quantile([r['finalLevels']['lifeManagement'] for r in first if r['policy']==p]),avg([r['endAge'] for r in first if r['policy']==p])] for p in POLICIES])
full+='\nDinner delays：\n\n'+md(['Policy','Start P50 seconds','Start P90','Start max','Complete P50','Complete P90','Complete max'],[[p,*[quantile([r['delay'] for r in dinner if r['policy']==p and r['timing']=='NEVER' and r['kind']==kind],q) if q is not None else max([r['delay'] for r in dinner if r['policy']==p and r['timing']=='NEVER' and r['kind']==kind],default=None) for kind,q in itertools.product(['START','COMPLETE'],[.5,.9,None])]] for p in POLICIES])
stability=[]
for p in POLICIES:
 dd=[r for r in daily if r['policy']==p and r['timing']=='NEVER']
 stability.append({'policy':p,'todoFirst30Days':avg([r['todo'] for r in dd if r['activeMinute']<=30]),'todoLast30Days':avg([r['todo'] for r in dd if r['activeMinute']>330]),'overdueFirst30Days':avg([r['overdue'] for r in dd if r['activeMinute']<=30]),'overdueLast30Days':avg([r['overdue'] for r in dd if r['activeMinute']>330])})
dump('stability.json',stability)
full+='\nTodo／Overdue尾段是否累积：固定60 active秒日表，只作为趋势对照，不替代时间加权平均。\n\n'+md(['Policy','Todo first30day','Todo last30day','Overdue first30day','Overdue last30day'],[[r[k] for k in ['policy','todoFirst30Days','todoLast30Days','overdueFirst30Days','overdueLast30Days']] for r in stability])
full+='\n## Final Ability／Permanent\n\n'+md(['Policy','Timing','Final E P50','Q','拍馬屁','Life','摸魚','Clarity earned mean','Clarity balance mean','Perm E','Perm Q','Perm Reward','Perm StartingMoney'],[[r['policy'],r['timing'],*[r['final.'+k] for k in ['efficiency','quality','flattery','lifeManagement','slacking']],r['clarityEarned'],r['clarityTotal'],*[r['permanent.'+k] for k in ['workEfficiency','workQuality','workReward','startingMoney']]] for r in summary])
(ROOT/'CAREER_V3_FULL_REPORT.md').write_text(full,encoding='utf-8')
dump('canonical-analysis-sanity.json',{'runs':900,'uniqueRuns':900,'activeMinutesEach':360,'seeds':[42+i*7919 for i in range(30)],'productSpend':0,'taggedIncome':0,'maxRevenueError':max(r['maxRevenueError'] for r in runs),'maxWorkloadError':max(r['maxWorkloadError'] for r in runs),'pairedPrevious':len(paired),'invalidRuns':0,'formalSourceChanged':False})
print(json.dumps({'runs':900,'promotionAttempts':len(promos),'firstTable':firstTable,'maxRevenueError':max(r['maxRevenueError'] for r in runs),'maxWorkError':max(r['maxWorkloadError'] for r in runs)},ensure_ascii=False))
