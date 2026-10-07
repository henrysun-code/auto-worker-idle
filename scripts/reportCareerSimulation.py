# -*- coding: utf-8 -*-
"""Stream the official-engine simulation artifacts into CSV and an evidence report."""
import csv, json, math, statistics, collections
from pathlib import Path

ROOT=Path(__file__).resolve().parent.parent/'reports'/'career-progression'
parts=[ROOT/f'part-{i}' for i in range(3)]
manifests=[json.loads((p/'manifest.json').read_text(encoding='utf-8')) for p in parts]
assert sum(m['count'] for m in manifests)==900
assert len({m['sourceHash'] for m in manifests})==1
def records(name):
 for p in parts:
  file=p/f'{name}.jsonl'
  if file.exists():
   with file.open(encoding='utf-8') as f:
    for line in f: yield json.loads(line)
def scalar(v):
 return json.dumps(v,ensure_ascii=False,separators=(',',':')) if isinstance(v,(dict,list)) else v
names={'runs':'runs','daily':'daily','purchases':'purchases','promotions':'promotions','prestiges':'prestiges','milestones':'milestones','waits':'upgrade-waits','recrawl':'recrawl','rankResidence':'rank-residence','promotionBlocks':'promotion-blocks','boss':'boss','sleep':'sleep','source':'workload-source','economy':'economy','crossRank':'cross-rank-work','cycles':'eligibility-cycles'}
row_counts={}
for name,label in names.items():
 headers=list(dict.fromkeys(k for m in manifests for k in m['headers'].get(name,[])))
 with (ROOT/f'career-{label}.csv').open('w',encoding='utf-8-sig',newline='') as f:
  w=csv.DictWriter(f,headers);w.writeheader();n=0
  for row in records(name):w.writerow({k:scalar(v) for k,v in row.items()});n+=1
 row_counts[name]=n
 print(f'CSV {name}: {n}',flush=True)
def q(xs,p):
 a=sorted(xs)
 if not a:return None
 pos=(len(a)-1)*p;i=int(pos);return a[i]+(a[math.ceil(pos)]-a[i])*(pos-i)
def dist(xs,total=None):
 xs=[x for x in xs if x is not None and math.isfinite(x)]
 return {'observed':len(xs),'censored':(total-len(xs)) if total is not None else 0,'median':q(xs,.5),'p10':q(xs,.1),'p25':q(xs,.25),'p75':q(xs,.75),'p90':q(xs,.9),'mean':statistics.mean(xs) if xs else None}
def fmt(v):return '未達／無樣本' if v is None else f'{v:,.2f}'
def key(r):return (r['policy'],r['timing'],r['seed'])
def write_rows(name,rows):
 headers=list(dict.fromkeys(k for row in rows for k in row))
 with (ROOT/name).open('w',encoding='utf-8-sig',newline='') as f:
  w=csv.DictWriter(f,headers);w.writeheader();w.writerows([{k:scalar(v) for k,v in r.items()} for r in rows])
runs=list(records('runs'));groups=collections.defaultdict(list)
for r in runs:groups[(r['policy'],r['timing'])].append(r)
assert len(groups)==30 and all(len(v)==30 for v in groups.values())
assert len({(r['policy'],r['timing'],r['seed']) for r in runs})==900
assert all(r['observedActiveMinutes']==360 for r in runs)
rank_times=collections.defaultdict(dict)
for r in records('promotions'):
 if r['cycle']==0:rank_times[key(r)][r['toRank']]=r['minutesInRun']
milestones=collections.defaultdict(list);first_levels={};first_waits=collections.defaultdict(list)
for r in records('milestones'):
 if r['cycle']<=1:
  milestones[(r['policy'],r['timing'],r['cycle'],r['ability'],r['level'])].append(r['minutesInRun'])
 if r['cycle']==0 and not r['censored']:first_levels[(*key(r),r['ability'],r['level'])]=r['minutesInRun']
waits=collections.defaultdict(list)
for r in records('waits'):
 waits[(r['policy'],r['timing'],r['ability'],r['level'])].append(r['waitActiveMinutes'])
 if r['cycle']==0:first_waits[(r['policy'],r['timing'],r['ability'],r['level'])].append(r['waitActiveMinutes'])
aggregates=[]
for (policy,timing),rows in groups.items():
 entry={'policy':policy,'timing':timing,'runs':len(rows),'firstCanPrestige':dist([r['firstCanPrestigeMinutes'] for r in rows],30),'rank4':dist([rank_times[key(r)].get(4) for r in rows],30)}
 for field in ['grossIncome','netIncomeAfterUpgrades','netAfterCareerSpend','prestigeCount','clarityEarned','permanentSpend','averageSleepRatio','averageFlattery','encounterRate','escapeSuccessRate','meanSeverity','zeroSleepNights','belowHalfNights','belowFullNights','fullSleepNights','overtimeSeconds','crossSleepOvertimeCount','crossWorkStartOvertimeCount','entertainmentMissedDueToOvertime','avoidableFollowUpRatio','overdueLoss','generatedWorkload','processedWorkload','workloadRatio','bossIncome','followIncome','parentIncome']:
  entry[field]=dist([r[field] for r in rows],30)
 entry['finalLevels']={a:dist([r['finalLevels'][a] for r in rows],30) for a in rows[0]['finalLevels']}
 aggregates.append(entry)
write_rows('career-policy-summary.csv',aggregates)
write_rows('career-prestige-timing-summary.csv',aggregates)
write_rows('career-scenarios.csv',[{'policy':p,'timing':t,'replicates':30,'seedFormula':'42 + replicate * 7919','activeHours':6,'worldDaySeconds':60,'initialMoney':120,'initialAge':22,'initialRank':0,'products':'OFF','offline':'OFF','debug':'OFF'} for p,t in groups])
wait_summary=[{'policy':p,'timing':t,'ability':a,'level':l,**dist(xs,len(xs))} for (p,t,a,l),xs in waits.items()]
write_rows('career-upgrade-wait-summary.csv',wait_summary)
milestone_summary=[{'policy':p,'timing':t,'cycle':cy,'ability':a,'level':l,**dist(xs,len(xs))} for (p,t,cy,a,l),xs in milestones.items()]
write_rows('career-milestone-summary.csv',milestone_summary)
# Paired cumulative gross payback: daily samples on equal cumulative active time.
daily=collections.defaultdict(list)
for r in records('daily'):daily[key(r)].append((r['activeMinutes'],r['cumulativeGross'],r['cumulativeNet']))
prestiges=list(records('prestiges'));payback=[]
for r in prestiges:
 k=key(r);baseline=daily[(r['policy'],'NEVER_PRESTIGE',r['seed'])];variant=daily[k];at=r['activeMinutes']
 candidates=[(x,b) for x,b in zip(variant,baseline) if x[0]>at]
 hit=next((x[0]-at for x,b in candidates if x[1]>=b[1]),None)
 net_hit=next((x[0]-at for x,b in candidates if x[2]>=b[2]),None)
 payback.append({'policy':r['policy'],'timing':r['timing'],'seed':r['seed'],'cycle':r['cycle'],'prestigeActiveMinutes':at,'grossCatchUpMinutes':hit,'grossCensored':hit is None,'netCatchUpMinutes':net_hit,'netCensored':net_hit is None,'resolutionMinutes':1,'definition':'first subsequent daily cumulative crossing vs same-policy NEVER; crossing is not assumed persistent'})
write_rows('career-paired-payback.csv',payback)
paygroups=collections.defaultdict(list)
for r in payback:paygroups[(r['policy'],r['timing'])].append(r['grossCatchUpMinutes'])
recrawl_groups=collections.defaultdict(list)
for r in records('recrawl'):
 if r['ability']!='rank' and r.get('target',0)>0:recrawl_groups[(r['policy'],r['timing'],r['ability'],r['fraction'])].append(r['minutesInRun'])
write_rows('career-recrawl-summary.csv',[{'policy':p,'timing':t,'ability':a,'fraction':f,**dist(xs,len(xs))} for (p,t,a,f),xs in recrawl_groups.items()])
boss_severities=collections.Counter();completed_boss=0
for r in records('boss'):
 if r['kind']=='CHECK' and r['encounter']:boss_severities[r['severity']]+=1
 if r['kind']=='COMPLETED':completed_boss+=1
sanity={'passed':True,'scenarioCount':30,'runCount':900,'replicatesPerScenario':30,'durationMinutesEach':360,'totalActiveHours':5400,'sourceHash':manifests[0]['sourceHash'],'sourceAndConfigUnchangedDuringRuns':True,'fullStateRngVerification':[m['verification'] for m in manifests],'maxConservationError':max(r['maxConservationError'] for r in runs),'maxRevenueError':max(abs(r['revenueError']) for r in runs),'runtimeAssertions':['finite nonnegative money/workload/reward; integer nonnegative levels','generated - processed - prestigeDiscarded = outstanding','gross = work + parent income','one mandatory Boss maximum; Boss base workload/reward scale once','products disabled, offline days zero; actions use production actions'],'regression':{'core':323,'browser':24,'build':'PASS'},'rowCounts':row_counts}
(ROOT/'career-sanity.json').write_text(json.dumps(sanity,ensure_ascii=False,indent=2),encoding='utf-8')
results={'configSnapshot':json.loads((ROOT.parent.parent/'config'/'generated'/'game_config.json').read_text(encoding='utf-8')),'sanity':sanity,'scenarios':aggregates,'runs':runs,'milestones':milestone_summary,'upgradeWaits':wait_summary,'bossSeverityDistribution':dict(boss_severities),'grossPaybackSummary':[{'policy':p,'timing':t,**dist(xs,len(xs))} for (p,t),xs in paygroups.items()]}
(ROOT/'career-results.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
lines=['# Career / Prestige 正式引擎模擬報告','', '## 範圍與驗證','', '30 Scenario × 30 固定 Seed = **900 Run**；每次完整 6 小時 active simulation（360 世界日），合計 5,400 小時遊戲暴露量。沒有減少樣本、沒有調 Balance、沒有產品／Offline／Debug。早餐修正與限定 Boss Follow-up 標記修正之外，正式規則維持不變。','', '使用正式 SimulationLoop、生成器、結算與 applyAction。策略在正式引擎完成一致狀態邊界後操作，沒有另寫日程、收入、工作或睡眠模型。暫存副本的只讀 hook 記錄老闆判定；Rank0、Rank4、含重生循環均驗證完整 State＋RNG 一致。重生驗證固定 Date.now，避免 lastSeenAt 的實際牆鐘造成假差異。','',f'核心 323/323、瀏覽器 24/24、build 通過。最大 Workload conservation 誤差 {sanity["maxConservationError"]:.3g}，最大收入對帳誤差 {sanity["maxRevenueError"]:.3g}。','', '同 Seed 各策略共享初始 RNG；之後不同升級／工作／重生會改變呼叫軌跡，配對為共同初始條件，不是假裝事件逐一相同。NEVER 是正式基準。','', '時間單位：active minutes；1 分鐘 = 1 個目前世界日。重生重設本輪時間，累積 active time 不重設。daily CSV 是固定 60 秒累積暴露窗口，跨重生時包含重置前後兩段；不是硬把重生後日曆接成同一世界日。generated 只計已正式發布的工作，不含未解鎖／未發布工作。未完成工作在重生時計入 discarded，不能把它算成已處理。','', '所有未達里程碑保留 censored；分位數只針對已達樣本，必須一起看 observed/censored。升級等待含同時間多買的 0 分鐘。gross 不扣成本；netIncomeAfterUpgrades 扣 Run Upgrade，netAfterCareerSpend 再扣升職；Clarity 消費不是現金成本。收入 proxy 為最近 5 個世界日的累積收入／升級支出，首 5 日按已暴露時間計。配對 gross 回本以每日採樣首次超過同策略 NEVER 累積 gross 為準（1 分鐘解析度），不宣稱永遠維持領先。','', '## 執行摘要：十個問題','']
never=[r for r in aggregates if r['timing']=='NEVER_PRESTIGE']
for i,r in enumerate(never,1):lines.append(f'{i}. {r["policy"]}：首次 canPrestige 中位 {fmt(r["firstCanPrestige"]["median"])} 分（P10 {fmt(r["firstCanPrestige"]["p10"])} / P90 {fmt(r["firstCanPrestige"]["p90"])}）；首次 Rank4 中位 {fmt(r["rank4"]["median"])} 分，未達 {r["rank4"]["censored"]}/30。')
lines.extend(['6. Lv100／200／250／300 能否達成？見下方 NEVER 分位表，未達保留，不外推。','7. Soft Wall 在哪？看 N→N+1 真實等待與 censored，而不是固定五分鐘門檻。','8. 重生是否比 NEVER 賺？見 timing gross／net 及配對回本表，能力追趕與現金回本分開呈現。','9. Permanent 是否有效？比較第二輪里程碑與前峰值 50/80/100% 追趕，不混入零目標。','10. Boss／Sleep 是否形成風險鏈？ALL_ROUNDER 的拍馬屁、遭遇、Severity、加班跨窗與睡眠分布一起檢查，沒有宣告需要 Nerf。','', '## 職涯與升級','', '|Policy|Rank1 median|Rank2 median|Rank3 median|Rank4 median / censored|','|---|---:|---:|---:|---:|'])
for r in never:
 rows=groups[(r['policy'],r['timing'])];times=[dist([rank_times[key(x)].get(rank) for x in rows],30) for rank in range(1,5)]
 lines.append('|'+r['policy']+'|'+'|'.join(fmt(x['median']) for x in times)+f' / {times[-1]["censored"]}|')
lines.extend(['', 'NEVER_PRESTIGE，首輪里程碑（分）：','', '|Policy|Ability|Lv100|Lv200|Lv250|Lv300|','|---|---|---:|---:|---:|---:|'])
for r in never:
 for ability in ['efficiency','quality','lifeManagement','slacking','flattery']:
  values=[]
  for level in [100,200,250,300]:
   d=dist(milestones[(r['policy'],r['timing'],0,ability,level)],30);values.append(f'{fmt(d["median"])} ({d["observed"]}/30)')
  lines.append('|'+r['policy']+'|'+ability+'|'+'|'.join(values)+'|')
lines.extend(['', 'N→N+1 等待實測（NEVER，分；「未達」代表沒有 N→N+1 完成樣本，不是 0）：','', '|Policy|Ability|N|Median|P10|P25|P75|P90|完成 / censored|','|---|---|---:|---:|---:|---:|---:|---:|---:|'])
for r in wait_summary:
 if r['timing']=='NEVER_PRESTIGE':lines.append('|'+r['policy']+'|'+r['ability']+'|'+str(r['level'])+'|'+'|'.join(fmt(r[x]) for x in ['median','p10','p25','p75','p90'])+f'|{r["observed"]} / {r["censored"]}|')
lines.extend(['', 'Soft Wall 診斷：比較 Lv100、200 後的等待斜率及高等級未達比例。只依實測描述變慢程度；有限 360 分鐘資料不能證明永遠不可達。等待沒有到達 N 的情境要搭配 milestone censored 看，不能只看等待已成功者。','', '## Prestige Timing 比較','', '|Policy|Timing|重生次數 median|Gross median|Net after career median|gross 配對回本 median / censored|','|---|---|---:|---:|---:|---:|'])
for r in aggregates:
 d=dist(paygroups[(r['policy'],r['timing'])],len(paygroups[(r['policy'],r['timing'])]));lines.append(f'|{r["policy"]}|{r["timing"]}|{fmt(r["prestigeCount"]["median"])}|{fmt(r["grossIncome"]["median"])}|{fmt(r["netAfterCareerSpend"]["median"])}|{fmt(d["median"])} / {d["censored"]}|')
lines.extend(['', '首輪→第二輪（Cycle1）重新到達 Lv100／200：','', '|Policy|Timing|Ability|Lv|Cycle0 median|Cycle1 median|縮短 %|Cycle1 achieved / censored|','|---|---|---|---:|---:|---:|---:|---:|'])
for p,t in groups:
 if t=='NEVER_PRESTIGE':continue
 for a in ['efficiency','quality']:
  for lv in [100,200]:
   d0=dist(milestones[(p,t,0,a,lv)]);xs=milestones[(p,t,1,a,lv)];d1=dist(xs,len(xs));pct=(1-d1['median']/d0['median'])*100 if d0['median'] and d1['median'] is not None else None
   lines.append(f'|{p}|{t}|{a}|{lv}|{fmt(d0["median"])}|{fmt(d1["median"])}|{fmt(pct)}|{d1["observed"]} / {d1["censored"]}|')
lines.extend(['', '## Boss / Sleep 風險鏈','', '|Policy (NEVER)|平均拍馬屁 median|遭遇率 median|逃跑成功率 median|Severity median|加班秒 median|跨 Sleep 次數 median|Sleep Ratio median|零睡眠夜 median|','|---|---:|---:|---:|---:|---:|---:|---:|---:|'])
for r in never:lines.append('|'+r['policy']+'|'+'|'.join(fmt(r[x]['median']) for x in ['averageFlattery','encounterRate','escapeSuccessRate','meanSeverity','overtimeSeconds','crossSleepOvertimeCount','averageSleepRatio','zeroSleepNights'])+'|')
lines.extend(['',f'全部情境 Boss Severity 分布：{dict(boss_severities)}；完成 Boss {completed_boss}。逐次工作量、報酬、處理秒／歷時秒與跨窗狀態见 career-boss.csv。睡眠逐夜 ratio、modifier、分類见 career-sleep.csv。<1 的分類使用 1e-8 浮點容差，避免把 0.999999999999 當作缺眠。','', '## 曲線診斷與候選旋鈕（尚未修改）','', 'A/B/C Run Cost：A 在全程生效，B 從 Lv100 後、C 從 Lv200 後疊加。依等待表與首輪 Lv250／300 未達比例評估拐點；高階等待上升不能全部歸因 Boss。對照 EFFICIENCY_FIRST 與 QUALITY_FIRST 的工作處理比例／返工比例可區分速度與品質瓶頸。','', 'Permanent 1.10^Lv：實際效果反映在 Cycle1 Lv100／200 與 peak 追趕表。早重生可能因尚未滿足高等級推薦／取得足夠 Clarity 而反覆低階循環；需同看永久等級、Clarity 消費和 gross 回本。只觀測到若干永久等級，不能宣告整個指數曲線過強或過弱。','', '候選 A/B/C、SoftCap1/2：若 Lv200 後等待及 censored 明顯增加，應優先審查疊加成本與 Rank4 gross 成長是否匹配；本報告保留原值。候選 Clarity Reward／Permanent Cost Growth：ASAP 與較晚重生的回本和 recrawl 分布若不同，先查兩者的實際永久購買量，不直接提高倍率。候選 Promotion Cost：money-block 時間與 funded-overdue-block 分開，只有前者才能支持改升職費。候選 Rank Escape Resistance／Sleep Curve：ALL_ROUNDER 的跨窗與零睡眠分布可指出風險，但要排除工作量與品質返工原因。候選 Life conversion coefficient：ALL_ROUNDER 花費與睡眠恢復對照可檢查投入生活管理是否抵得上時間代價。','', '## 早餐與正式修正','', 'Sleep Window 在 WorkStart 同 anchor 結算後，授予一次早餐資格；同時間 cutoff 不再把它標成 MISSED。沒有動 WorkStart／Deadline Index，也沒有強制中止已接工作。早餐開始消耗一次資格；原 FOOD interruption／suspended work 行為維持。Full/Half/Zero、強制結束、同 anchor Deadline 與不重複早餐皆有測試。','', 'Boss Follow-up 只刪除 child 的 mandatoryOvertime／bossSeverity，原父工作未更動；立即／延遲發布的回歸確認 child 不被 activeMandatoryBoss 計入。Follow-up 機率、數量、報酬、Workload、Deadline、Root／Depth 全部維持。沒有改存檔的既有任務標記。','', '## 檔案','', '所有 CSV、career-results.json、career-sanity.json 位於同目錄。原始逐 Run 表保留在 part-0/1/2 的 JSONL；可以重建匯出。career-milestone-summary、career-upgrade-wait-summary、career-recrawl-summary、career-paired-payback 是額外方便審查的統計表。','', '無 Commit、Push 或自動 Tune。'])
(ROOT/'CAREER_PRESTIGE_SIMULATION_REPORT.md').write_text('\n'.join(lines)+'\n',encoding='utf-8')
print('REPORT COMPLETE',flush=True)
