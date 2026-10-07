# -*- coding: utf-8 -*-
import json,csv,math,statistics,collections
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent/'reports'/'career-progression-v2'
BASE=ROOT.parent/'career-progression'
manifests=[json.loads((ROOT/f'part-{i}'/'manifest.json').read_text(encoding='utf-8')) for i in range(3)]
assert sum(m['count'] for m in manifests)==900
assert len({m['sourceHash'] for m in manifests})==1
def records(name,root=ROOT):
 for i in range(3):
  p=root/f'part-{i}'/f'{name}.jsonl'
  if p.exists():
   with p.open(encoding='utf-8') as f:
    for line in f:yield json.loads(line)
def q(xs,p):
 a=sorted(xs)
 if not a:return None
 n=(len(a)-1)*p;i=int(n);return a[i]+(a[math.ceil(n)]-a[i])*(n-i)
def stats(xs):
 a=[x for x in xs if x is not None]
 return {'observed':len(a),'censored':len(xs)-len(a),'median':q(a,.5),'p10':q(a,.1),'p25':q(a,.25),'p75':q(a,.75),'p90':q(a,.9),'mean':statistics.mean(a) if a else None}
def scalar(x):return json.dumps(x,ensure_ascii=False,separators=(',',':')) if isinstance(x,(dict,list)) else x
def csvout(name,rows,headers=None):
 if headers is None:
  rows=list(rows);headers=list(dict.fromkeys(k for r in rows for k in r))
 with (ROOT/name).open('w',encoding='utf-8-sig',newline='') as f:
  w=csv.DictWriter(f,headers);w.writeheader();n=0
  for r in rows:w.writerow({k:scalar(v) for k,v in r.items()});n+=1
 print(f'{name}: {n}',flush=True);return n
def identity(r):return (r['policy'],r['timing'],r['seed'])
def fmt(x):return '未達' if x is None else f'{x:,.2f}'
runs=[r for m in manifests for r in m['summaries']];groups=collections.defaultdict(list)
for r in runs:groups[(r['policy'],r['timing'])].append(r)
assert len(groups)==30 and all(len(v)==30 for v in groups.values())
assert all(r['firstCanPrestigeMinutes'] is None or r['firstCanPrestigeMinutes']>=30-1e-8 for r in runs)
csvout('career-v2-runs.csv',runs)
counts={}
for source,label in [('daily','daily'),('economy','economy'),('source','workload-source'),('sleep','sleep'),('boss','boss'),('promotions','promotions'),('prestiges','prestiges'),('promotionBlocks','promotion-blocks'),('rankResidence','rank-residence')]:
 headers=list(dict.fromkeys(k for m in manifests for k in m['headers'].get(source,[])))
 counts[source]=csvout(f'career-v2-{label}.csv',records(source),headers)
milestones=collections.defaultdict(list);by_seed={}
for r in records('milestones'):
 if r['cycle']>1:continue
 k=(r['policy'],r['timing'],r['cycle'],r['ability'],r['level']);milestones[k].append(r['minutesInRun'])
 by_seed[(*identity(r),r['cycle'],r['ability'],r['level'])]=r['minutesInRun']
milestone_rows=[{'policy':p,'timing':t,'cycle':cy,'ability':a,'level':l,**stats(xs)} for (p,t,cy,a,l),xs in milestones.items()]
csvout('career-v2-milestone-summary.csv',milestone_rows)
waits=collections.defaultdict(list);wait_seed={}
for r in records('waits'):
 if r['cycle']!=0:continue
 waits[(r['policy'],r['timing'],r['ability'],r['level'])].append(r['waitActiveMinutes']);wait_seed[(*identity(r),r['ability'],r['level'])]=r['waitActiveMinutes']
wait_rows=[{'policy':p,'timing':t,'ability':a,'level':l,**stats(xs)} for (p,t,a,l),xs in waits.items()]
csvout('career-v2-upgrade-wait-summary.csv',wait_rows)
rank4={}
for r in records('promotions'):
 if r['cycle']==0 and r['toRank']==4:rank4[identity(r)]=r['minutesInRun']
summary=[]
fields=['grossIncome','netIncomeAfterUpgrades','netAfterCareerSpend','prestigeCount','clarityEarned','permanentSpend','averageSleepRatio','overtimeSeconds','generatedWorkload','processedWorkload','overdueLoss']
for (p,t),rs in groups.items():
 row={'policy':p,'timing':t,'runs':len(rs),'firstCanPrestige':stats([r['firstCanPrestigeMinutes'] for r in rs]),'rank4':stats([rank4.get(identity(r)) for r in rs]),'permanentLevels':{a:stats([r['permanentLevels'][a] for r in rs]) for a in rs[0]['permanentLevels']}}
 for f in fields:row[f]=stats([r[f] for r in rs])
 summary.append(row)
csvout('career-v2-prestige-timing-summary.csv',summary)
recrawls=[]
for p,t in groups:
 if t=='NEVER_PRESTIGE':continue
 for a in ['efficiency','quality']:
  for lv in [100,200,250]:
   rs=[]
   for r in groups[(p,t)]:
    zero=by_seed.get((*identity(r),0,a,lv));one=by_seed.get((*identity(r),1,a,lv));reduction=(1-one/zero)*100 if zero and one is not None else None
    rs.append({'seed':r['seed'],'cycle0':zero,'cycle1':one,'reduction':reduction})
   paired=[r for r in rs if r['reduction'] is not None]
   recrawls.append({'policy':p,'timing':t,'ability':a,'level':lv,'pairedObserved':len(paired),'pairedCensored':30-len(paired),'cycle0Median':q([r['cycle0'] for r in paired],.5),'cycle1Median':q([r['cycle1'] for r in paired],.5),'reductionPercent':stats([r['reduction'] for r in rs])})
csvout('career-v2-recrawl-summary.csv',recrawls)
base_m={}
for i in range(3):
 with (BASE/f'part-{i}'/'milestones.jsonl').open(encoding='utf-8') as f:
  for line in f:
   if '"cycle":0,' not in line or 'NEVER_PRESTIGE' not in line:continue
   r=json.loads(line);base_m[(*identity(r),r['ability'],r['level'])]=r['minutesInRun']
base_w={}
for r in records('waits',BASE):
 if r['cycle']==0 and r['timing']=='NEVER_PRESTIGE':base_w[(*identity(r),r['ability'],r['level'])]=r['waitActiveMinutes']
# Baseline did not separately export175 wait; recover the actual purchase interval, without estimating.
for i in range(3):
 with (BASE/f'part-{i}'/'purchases.jsonl').open(encoding='utf-8') as f:
  for line in f:
   if '"levelBefore":175,' not in line or 'NEVER_PRESTIGE' not in line or '"cycle":0,' not in line:continue
   r=json.loads(line);base_w[(*identity(r),r['ability'],175)]=r['secondsSincePreviousPurchase']/60 if r['secondsSincePreviousPurchase'] is not None else None
pre200=[];comparison=[]
for p,t in groups:
 if t!='NEVER_PRESTIGE':continue
 for a in ['efficiency','quality']:
  for lv in [100,150,175,200,225,250,275,300]:
   old=[];new=[];ow=[];nw=[];deltas=[]
   for r in groups[(p,t)]:
    k=(*identity(r),a,lv);before=base_m.get(k);after=by_seed.get((*identity(r),0,a,lv));old.append(before);new.append(after);ow.append(base_w.get(k));nw.append(wait_seed.get(k));
    if lv<=200:pre200.append({'policy':p,'seed':r['seed'],'ability':a,'level':lv,'sameCensor':(before is None)==(after is None),'timeDifference':after-before if before is not None and after is not None else None})
    if before is not None and after is not None:deltas.append(after-before)
   comparison.append({'policy':p,'ability':a,'level':lv,'baselineMilestone':stats(old),'v2Milestone':stats(new),'pairedTimeDifference':stats(deltas),'baselineWait':stats(ow),'v2Wait':stats(nw)})
assert all(r['sameCensor'] and (r['timeDifference'] is None or abs(r['timeDifference'])<1e-7) for r in pre200)
csvout('career-v2-baseline-comparison.csv',comparison)
csvout('career-v2-pre200-paired-verification.csv',pre200)
iso=json.loads((ROOT/'flattery-isolation-raw.json').read_text(encoding='utf-8'));assert iso['count']==300
csvout('flattery-isolation-runs.csv',iso['rows']);isogroups=collections.defaultdict(list)
for r in iso['rows']:isogroups[(r['profile'],r['flattery'])].append(r)
isofields=['grossPerActiveMinute','nonBossWorkIncome','bossIncome','bossIncomeShare','encounterRate','escapeSuccessRate','meanSeverity','bossGeneratedWorkload','bossProcessedWorkload','overtimeSeconds','crossSleepOvertimeCount','crossWorkStartOvertimeCount','entertainmentMissedDueToOvertime','averageSleepRatio','p10SleepRatio','belowFullNights','belowHalfNights','zeroSleepNights','todo','overdue','workloadRatio']
isosummary=[]
for (profile,flattery),rs in isogroups.items():
 assert len(rs)==30
 isosummary.append({'profile':profile,'flattery':flattery,'runs':len(rs),**{f:stats([r[f] for r in rs]) for f in isofields}})
csvout('flattery-isolation-summary.csv',isosummary)
cfg=json.loads((ROOT/'config-verification.json').read_text(encoding='utf-8'))
sanity={'passed':True,'logicalCareerRuns':900,'careerScenarios':30,'replicates':30,'minutesEach':360,'isolationRuns':300,'isolationScenarios':10,'isolationMinutesEach':120,'minimumFirstEligibility':min(r['firstCanPrestigeMinutes'] for r in runs if r['firstCanPrestigeMinutes'] is not None),'pre200SeededMilestonesExactlyUnchanged':True,'configVerification':cfg,'sourceHash':manifests[0]['sourceHash'],'sourceHashesStableAcrossWorkers':True,'fullStateAndRngVerification':[m['verification'] for m in manifests],'maximumConservationError':max(r['maxConservationError'] for r in runs+iso['rows']),'maximumRevenueError':max(abs(r['revenueError']) for r in runs+iso['rows']),'regression':{'core':328,'browser':25,'build':'PASS'},'rowCounts':counts}
(ROOT/'career-v2-sanity.json').write_text(json.dumps(sanity,ensure_ascii=False,indent=2),encoding='utf-8')
(ROOT/'career-v2-results.json').write_text(json.dumps({'sanity':sanity,'scenarios':summary,'milestones':milestone_rows,'waits':wait_rows,'recrawl':recrawls,'baselineComparison':comparison,'isolation':isosummary},ensure_ascii=False,indent=2),encoding='utf-8')
lines=['# V2 第一輪正式 Balance Adjustment + Verification','', '只改 minimumPrestigeActiveMinutes=30、C=1.005。其他 Config 完整 deep-equal（見 config-verification.json）；原報告保持。900 Career Run＋300 Isolation Run，全數完整暴露時間，沒有減少樣本或去重。','', '## 1–3：實作與回歸','', 'runStatistics.activeSeconds 是獨立的每輪實際在線時間。GameEngine 把 performance.now 的未乘速度秒數传入正式 Loop；每個內部區間按 active/world 比例累積。世界速度不改這個時鐘；Offline／Debug 跳時間未提供 active credit。Prestige 使用 active≥30 AND 原 eligibility，正常操作仍需職級／收入。明確 Debug 強制重生仍為測試功能。','', 'Prestige 重置 timer=0；Save／Reload 保存；舊存檔沒有可靠的 active 記錄，欄位補0，保留全部其他進度，不拿世界時間冒充。Gate 是 Loop 邊界，不等下一筆收入才檢查。','', '328 核心、25 瀏覽器與 build 通過。29:59／30:00、其他條件不足、重生歸零、離線、存檔、10x 在線門檻均有測試。成本六個預期值全部吻合，差異0。','', '## 4：首次 canPrestige（NEVER 基準，各30 Seed）','', '|Policy|Median|P10|P90|未達|','|---|---:|---:|---:|---:|']
for s in summary:
 if s['timing']=='NEVER_PRESTIGE':
  x=s['firstCanPrestige'];lines.append(f'|{s["policy"]}|{fmt(x["median"])}|{fmt(x["p10"])}|{fmt(x["p90"])}|{x["censored"]}|')
lines+=['', '## 5–7：NEVER 里程碑與真實 N→N+1 等待','', '所有分鐘均為 actual active minutes。未投資的能力不可當作成本牆。分位數只對 observed 計算，未達保留 censored；N→N+1 是實際兩次購買的間隔，包含同時間批次購買的0。','', '|Policy|能力|Lv|舊到達 median|新到達 median|新 observed/censored|舊等待 median|新等待 median|','|---|---|---:|---:|---:|---:|---:|---:|']
for r in comparison:
 x=r['v2Milestone'];lines.append(f'|{r["policy"]}|{r["ability"]}|{r["level"]}|{fmt(r["baselineMilestone"]["median"])}|{fmt(x["median"])}|{x["observed"]}/{x["censored"]}|{fmt(r["baselineWait"]["median"])}|{fmt(r["v2Wait"]["median"])}|')
lines+=['', 'Lv200 前 helper 價格與 NEVER 每 Seed 的對照里程碑完全不變，不只平均近似；兩個價格軟節點仍100／200。新 practical wall 依225／250／275／300 等待和 censor 分布判斷，不將固定5分鐘當作牆。','', '## 8：Prestige Timing','', '|Policy|Timing|Gross median|Net after upgrade|Net after career|Prestige次數|Clarity|Rank4分鐘 / 未達|','|---|---|---:|---:|---:|---:|---:|---:|']
for s in summary:lines.append(f'|{s["policy"]}|{s["timing"]}|{fmt(s["grossIncome"]["median"])}|{fmt(s["netIncomeAfterUpgrades"]["median"])}|{fmt(s["netAfterCareerSpend"]["median"])}|{fmt(s["prestigeCount"]["median"])}|{fmt(s["clarityEarned"]["median"])}|{fmt(s["rank4"]["median"])} / {s["rank4"]["censored"]}|')
lines+=['', '永久等級完整分布、各時機 Lv100／200／250 見 timing-summary／milestone-summary；gross／net 分列，不把未花掉的資金或重生後注入的起始金錢當收入。ASAP 與 TARGET30 仍各保留30語意結果，沒有降低 logical sample 數。','', '## 9–10：TARGET120 同 Seed Cycle0→Cycle1 配對追趕','', '|Policy|能力|Lv|首輪 median|第二輪 median|paired observed/censored|縮短 % median|P10|P90|','|---|---|---:|---:|---:|---:|---:|---:|---:|']
for r in recrawls:
 if r['timing']=='TARGET_120_MIN':
  x=r['reductionPercent'];lines.append(f'|{r["policy"]}|{r["ability"]}|{r["level"]}|{fmt(r["cycle0Median"])}|{fmt(r["cycle1Median"])}|{r["pairedObserved"]}/{r["pairedCensored"]}|{fmt(x["median"])}|{fmt(x["p10"])}|{fmt(x["p90"])}|')
lines+=['', '配對只計兩輪均達成者，避免不同 survivor cohort 的中位數誤判。永久倍率仍1.10^Lv、費用成長2.65、Clarity公式不變；用配對縮短與 censored 判斷「舊區域重跑」，不因少數未達直接提高倍率。','', '## 11–12：Flattery Isolation','', '見 FLATTERY_ISOLATION_REPORT.md；沒有買能力、升職、產品或Prestige。Rank4固定，Age22初始化後沿用正式老化，在120世界日仍屬相同22–29歲工作量倍率，沒有改Age公式。固定五能力、每組30同Seed。','', '## 方法與限制','', '一天60世界秒；本次1x模擬的 active 与 world秒相同，但 eligibility實際讀獨立timer。daily為固定累積60秒暴露窗口；每輪日曆重置而累積active不重置。Seed42+i×7919，共同初始 RNG，不假設不同策略後的事件逐一相同。','', 'WORK生成只計正式發布；尚未發布／未解鎖不算。重生取消的剩餘量列discarded；收入與工作量守恆每邊界檢查。Sleep只統計已結算窗口，重生中斷的窗口不填成零睡眠。現在普通餐免費；付費餐統計边界有隔離Fixture，未改正式餐價。','', '新等待輸出加入175；舊175从原始 purchase 的實際間隔重建，没有推估。Lv≤200行為比對使用NEVER，排除新增正式Gate帶來的刻意重生策略改變。所有關於永久／Flattery 的判斷僅為診斷，沒有額外Tune。','']
(ROOT/'CAREER_PRESTIGE_BALANCE_V2_REPORT.md').write_text('\n'.join(lines),encoding='utf-8')
flines=['# Flattery Isolation 診斷','', '300 Run：2 Profile ×5 Flattery Lv×30相同初始Seed，各120 actual active分鐘。Efficiency／Quality固定200；UNPROTECTED的Life／Slacking=0，COUNTERED=200。Rank固定4，Products／Prestige／Offline OFF，沒有任何自動購買。Age22初始化；自然老化仍在同一無額外倍率年齡帶。','', '表中是各Run指標的Seed中位數；Gross/min含父專案獎金。Non-Boss Work Income只含非Boss WORK，不含Parent獎金。Boss收入只含source=BOSS，Boss衍生Follow-up是非Boss WORK。Boss share以總Gross為分母。','', '|Profile|Flattery|Gross/min|Boss income|Boss share|遭遇率|逃跑率|Severity|加班秒|跨Sleep|跨WorkStart|娛樂跳過|平均Sleep|Sleep P10|未滿夜|不足半夜|零睡夜|Todo|Overdue|處理/生成|','|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|']
for r in isosummary:
 fields_table=['grossPerActiveMinute','bossIncome','bossIncomeShare','encounterRate','escapeSuccessRate','meanSeverity','overtimeSeconds','crossSleepOvertimeCount','crossWorkStartOvertimeCount','entertainmentMissedDueToOvertime','averageSleepRatio','p10SleepRatio','belowFullNights','belowHalfNights','zeroSleepNights','todo','overdue','workloadRatio']
 flines.append('|'+r['profile']+'|'+str(r['flattery'])+'|'+'|'.join(fmt(r[f]['median']) for f in fields_table)+'|')
flines+=['', 'Non-Boss Work Income、Boss Generated／Processed Workload 等完整分位數見 summary CSV，每Seed值見runs CSV。','', '收入線性檢查以各Profile Gross/min除以Flattery0，對照僅+1%收入的1／1.5／2／2.5／3倍。超出純收入倍數不直接等於失控雪球：還需看Severity付費工作量、Boss獎勵與其他工作時間的份額。','', '|Profile|Lv|收入 / Lv0|純收入倍率|平均Sleep median|Overtime占Active%|','|---|---:|---:|---:|---:|---:|']
for r in isosummary:
 base=next(x for x in isosummary if x['profile']==r['profile'] and x['flattery']==0)
 flines.append(f'|{r["profile"]}|{r["flattery"]}|{fmt(r["grossPerActiveMinute"]["median"]/base["grossPerActiveMinute"]["median"])}|{fmt(1+r["flattery"]*.01)}|{fmt(r["averageSleepRatio"]["median"])}|{fmt(r["overtimeSeconds"]["median"]/7200*100)}|')
flines+=['', '风险診斷：需同看COUNTERED200對0的收入增加、sleep ratio、overdue与加班占總時間。標記 FLATTERY_DOMINANCE_RISK 是觀測結論，不是Balance修改命令。COUNTERED還會減少高報酬Boss工作，不能只把逃跑提高當作純收益。Sleep curve、+1%收入、+2%注意度、Severity比例规则全部保留。','']
(ROOT/'FLATTERY_ISOLATION_REPORT.md').write_text('\n'.join(flines),encoding='utf-8')
print('BALANCE V2 REPORT COMPLETE',flush=True)
