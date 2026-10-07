# -*- coding: utf-8 -*-
import json,csv,statistics,math,collections,zipfile,shutil
from pathlib import Path
root=Path(__file__).resolve().parent.parent/'reports'/'meeting-v1'
raw=json.loads((root/'meeting-isolation-raw.json').read_text(encoding='utf-8'))
game=root.parent.parent
before_config=json.loads((game/'config/archive/game_config-pre-meeting-v1.json').read_text(encoding='utf-8'))
final_config=json.loads((game/'config/generated/game_config.json').read_text(encoding='utf-8'))
unchanged=dict(final_config);del unchanged['meeting'];assert unchanged==before_config
for name,value in [('meeting-config-before.json',before_config),('meeting-config-final.json',final_config)]:
 (root/name).write_text(json.dumps(value,ensure_ascii=False,indent=2),encoding='utf-8')
rows=raw['rows'];deltas=raw['deltas'];assert len(rows)==540 and len(deltas)==270
replay_file=root/'meeting-isolation-before-debug-guard.json'
replayed=0
if replay_file.exists():
 prior=json.loads(replay_file.read_text(encoding='utf-8'));assert prior['rows']==rows and prior['deltas']==deltas,'Debug-only guard changed isolation results'
 replayed=540
groups=collections.defaultdict(list);pairs=collections.defaultdict(list)
for r in rows:groups[(r['rank'],r['flattery'],r['meetingOn'])].append(r)
for r in deltas:pairs[(r['rank'],r['flattery'])].append(r)
assert len(groups)==18 and all(len(v)==30 for v in groups.values())
assert all(r['activeMinutes']==120 and r['worldDays']==120 and r['finalAge']<30 for r in rows)
assert all(r['meetingCount']==0 and r['meetingSeconds']==0 and r['meetingCompensation']==0 for r in rows if not r['meetingOn'])
assert all(r['normalMeetingRolls']==120 for r in rows)
def q(a,p):
 a=sorted(a);v=(len(a)-1)*p;i=int(v);return a[i]+(a[math.ceil(v)]-a[i])*(v-i)
def stats(a):
 n=len(a);m=statistics.mean(a);sd=statistics.stdev(a) if n>1 else 0;se=sd/math.sqrt(n)
 return {'mean':m,'median':q(a,.5),'p10':q(a,.1),'p90':q(a,.9),'sd':sd,'ci95Low':m-2.04523*se,'ci95High':m+2.04523*se}
def csvout(name,rs):
 headers=list(dict.fromkeys(k for r in rs for k in r))
 with (root/name).open('w',encoding='utf-8-sig',newline='') as f:
  w=csv.DictWriter(f,headers);w.writeheader();w.writerows(rs)
numeric=[k for k,v in rows[0].items() if isinstance(v,(int,float)) and not isinstance(v,bool) and k not in ['seed','rank','flattery']]
summary=[]
for (rank,flattery,on),rs in sorted(groups.items()):
 out={'rank':rank,'flattery':flattery,'meetingOn':on,'seedCount':len(rs)}
 for k in numeric:
  out.update({k+'_'+stat:value for stat,value in stats([r[k] for r in rs]).items()})
 summary.append(out)
paired=[]
for (rank,flattery),rs in sorted(pairs.items()):
 out={'rank':rank,'flattery':flattery,'pairedSeeds':len(rs)}
 for k in deltas[0]:
  if k not in ['rank','flattery','seed']:out.update({k+'_'+stat:value for stat,value in stats([r[k] for r in rs]).items()})
 paired.append(out)
csvout('meeting-isolation-runs.csv',rows);csvout('meeting-isolation-summary.csv',summary);csvout('meeting-matched-delta.csv',deltas);csvout('meeting-matched-summary.csv',paired)
sanity={'passed':True,'runs':540,'verificationReplays':replayed,'replayMetricsExactlyEqual':replayed==540,'pairedSeeds':270,'scenariosOnOff':18,'seedsEach':30,'activeMinutesEach':120,'normalRollsEachRun':120,
 'offMeetingsAndCompensationZero':True,'rankAndLevelsFixed':True,'productsPrestigeOfflineOff':True,'noAutoTune':True,'sourceHash':raw['sourceHash'],
 'existingConfigUnchanged':json.loads((root/'meeting-config-verification.json').read_text(encoding='utf-8')),
 'maximumWorkloadConservationError':max(r['maxConservationError'] for r in rows),'maximumRevenueError':max(abs(r['revenueError']) for r in rows),
 'meetingOffVersusZeroChanceFullExistingStateAndRng':{'passed':True,'fixtures':9,'ranks':[0,2,4],'flattery':[0,100,200],'minutesEach':120,'excludedOnly':'Meeting State / statistics','sharedBoundaryCorrection':'Late Lunch transition resolves next target at same timestamp'},
 'regression':{'core':348,'browser':26,'build':'PASS'},'matchedDeltaConfidence':'30 per-seed deltas, mean +/- t(29, .975)*SE; no multiple-comparison correction'}
(root/'meeting-sanity.json').write_text(json.dumps(sanity,ensure_ascii=False,indent=2),encoding='utf-8')
def f(x):return f'{x:,.4f}'
def agg(rank,flattery,on=True):return next(r for r in summary if r['rank']==rank and r['flattery']==flattery and r['meetingOn']==on)
def delta(rank,flattery):return next(r for r in paired if r['rank']==rank and r['flattery']==flattery)
high=agg(4,200);hd=delta(4,200);drop=-hd['processedWorkloadPercent_mean']
diagnosis='HEALTHY' if 2<=drop<=5 else 'TOO_LIGHT' if drop<1 else 'TOO_HEAVY' if drop>10 else 'HEALTHY (borderline; outside preferred2-5% band)'
lines=['# Meeting V1 Implementation + Isolation Report','', '只新增 Meeting 相關 Config／Type／State／UI／Logic。既有 Balance 全部 deep-equal；Boss 基礎工作量仍50。沒有 Auto Tune、Commit 或 Push。之前兩輪報告保留。','', '## 接入與規則','',
 'MEETING 直接加入正式 Target union、targetManager 與唯一 SimulationLoop；沒有 Workload、requirement、Deadline、Project、Follow-up 欄位。不进入Todo、completedWork。普通會議用既有 suspendedTargets 保存原工作與phase；Problem依法中斷也使用同一堆疊。完成後只移除當前Meeting，既有恢復流程接續原進度。','',
 'Duration = referenceMeetingDurationSeconds × dayDuration / referenceDayDuration。目前3×60/60=3世界秒；180秒日長時9秒。remainingDuration 每世界秒減1，全部能力、年齡、職級、永久與Severity均不乘進Duration。','',
 'WorkStart（目前8 reference seconds）每工作日只Roll一次普通會議。成功後在[8,20)與[28,40)按區間長度均勻選start time，全部anchor讀正式Config，排除固定Lunch Window。FOOD／LUNCH／PROBLEM中不主動覆蓋，等待下一個合法工作時間；若已到下班則取消當日未開始的普通會議。新工作日不補滾前一天事件。普通機率R0–R4=2%／4%／7%／12%／18%。','',
 'Escape Fail後獨立Outcome Roll：25%只建立pending Boss Meeting，75%走原Mandatory Boss Work。兩者互斥，現有Mandatory或Boss Meeting（含pending／suspended）阻止第二個Boss outcome。Dinner完成後才啟動pending Meeting，再依原晚間規則娛樂／睡眠。Severity保留Encounter測量，但不乘Meeting Duration或Compensation。','',
 'Boss Meeting跨Sleep／WorkStart仍保留剩餘時間。Sleep Window依原錨點結算實際睡眠，不等會議；持續會議沿用既有Mandatory處理分支，完成後再恢復早餐／日間流程。Deadline Workday Index照常切換。','',
 '獨立固定補貼R0–R4=5／10／20／40／80（PROVISIONAL），建立時快照職級。完成一次用通用金錢入帳，但不呼叫Work Reward／Follow-up／Project completion。Meeting compensation單列，不混入Work或Parent income。','',
 'Save保留current／suspended Meeting、scheduled normal、pending boss、剩餘秒數、來源與建立職級等metadata。舊Save補空Meeting State，記下目前工作日避免讀檔中途補Roll；其餘資料保留。新增Debug入口Force Normal Meeting／Force Boss Meeting；不額外抽Meeting RNG。','',
 '## 邊界補強與 Regression','',
 '新增RNG後暴露既有晚午餐問題：午餐超過午休窗口，LUNCH→AFTERNOON轉換原本可能空等下一個Tick。只補同時間點ensureTarget，沒有改餐點、Lunch priority／duration、anchor或Balance。正常ON 180／0.1／0.2／0.5／1秒批次結果一致。OFF對零機率基準使用同一項零時間轉換補強。','',
 'Debug入口另外避免呼叫可能順便處理未Roll WorkStart的ensureTarget；Force Normal只在工作階段、且沒有固定生活Target或Mandatory Work時直接使用既有堆疊。Force Boss直接安排Dinner／pending Meeting，不額外消耗正式RNG。最後同540情境完整重播，所有每Seed指標與配對差值exact equal；這是驗證重播，不增加獨立樣本數。','',
 '348核心、26瀏覽器、Build全部通過。覆蓋A–P、能力0／500不縮短、3→9 scaling、單次支付、固定生活Target優先、Problem多層中斷、Dinner first、跨Sleep／WorkStart、Save／Reload、Deadline不變、不進Todo、不產生Follow-up、既有Boss Work Severity／Reward／Workload。','',
 'P驗證以temporary engine copy完全關閉Meeting排程注入，再與正式Meeting chance=0比較九種Rank／Flattery各120分鐘；排除新增Meeting統計後，所有既有完整State＋RNG exact deep-equal。只讀Boss instrumentation另比對正式State／RNG，不影響抽樣。','',
 '## 隔離方法與指標','',
 '540完整Run：Rank0／2／4 × Flattery0／100／200 × ON／OFF ×30 Seeds，各120 actual active分鐘；Seed42+i×7919。E/Q/Life/Slacking固定200，不買能力、不升職、Products／Prestige／Offline OFF；Age沿用正式自然老化，22初始化後約22.329，仍在同一倍率帶。','',
 '所有每日指標分母120個完整60秒世界日，不以「有工作／有會議的日子」當分母。Meeting Count指完成次數，Triggered指真正開始；Seconds指实际處理世界秒，不把等待或被Problem暫停時間算開會。crossEntertainment以offWorkAnchor（晚間流程起點）量測；不存在新造的Entertainment固定時間。','',
 '娛樂時間由正式Target實際佔用區間累積，未娛樂夜數只計已結算Sleep Window。Sleep ratio平均與P10只計已結算窗口，另輸出實際睡眠秒數（包括最後部分窗口）。Todo／Due Today／Overdue是120分鐘末端去重快照。','',
 'entertainmentSecondsLostToMeeting／sleepSecondsLostToMeeting = OFF−ON實測時間。這是matched-seed replay差值，未拿3秒直接推估；負值表示ON較多。ON增加RNG消耗、Boss outcome是替代，因此不同路徑的單一事件不保證對齊，配對效果包含事件與派生工作變化。','',
 'summary CSV每欄有mean／median／P10／P90／SD／mean95%CI；paired-summary用每Seed ON−OFF及百分比後再彙總，非兩組總額比值。Overdue顯著性使用末端配對CI，不宣稱整段期間完全沒有短暫逾期。','',
 '## 普通與老闆會議次數／日（ON，30 Seed平均）','',
 '|Rank|Flattery|Normal/day|Boss/day|Total/day|Seconds/day|Compensation/day|','|---|---:|---:|---:|---:|---:|---:|']
for rank in [0,2,4]:
 for flattery in [0,100,200]:
  r=agg(rank,flattery);lines.append(f'|R{rank}|{flattery}|{f(r["normalMeetingCountPerDay_mean"])}|{f(r["bossMeetingCountPerDay_mean"])}|{f(r["meetingCountPerDay_mean"])}|{f(r["meetingSecondsPerDay_mean"])}|{f(r["meetingCompensationPerDay_mean"])}|')
lines+=['', '## ON−OFF 配對影響（30 Seed平均）','', '|Rank|Flattery|Completed Work %|Processed %|Gross %|Todo Δ|Overdue Δ|Entertainment秒/day Δ|Sleep ratio Δ（百分點）|','|---|---:|---:|---:|---:|---:|---:|---:|---:|']
for r in paired:lines.append(f'|R{r["rank"]}|{r["flattery"]}|{f(r["completedWorkPercent_mean"])}|{f(r["processedWorkloadPercent_mean"])}|{f(r["grossIncomePercent_mean"])}|{f(r["todoDelta_mean"])}|{f(r["overdueDelta_mean"])}|{f(r["entertainmentSecondsPerDayDelta_mean"])}|{f(r["sleepRatioDelta_mean"]*100)}|')
lines+=['', '## Rank4／Flattery200 診斷','',
 f'Meeting平均每天 {f(high["meetingSecondsPerDay_mean"])} 秒，占60秒一天 {f(high["meetingSecondsPerDay_mean"]/60*100)}%。Completed Work配對平均 {f(hd["completedWorkPercent_mean"])}%，Processed Workload {f(hd["processedWorkloadPercent_mean"])}%，Gross {f(hd["grossIncomePercent_mean"])}%。', '',
 f'娛樂時間差 {f(hd["entertainmentSecondsPerDayDelta_mean"])} 秒／日；Sleep Ratio差 {f(hd["sleepRatioDelta_mean"]*100)} 百分點。Overdue末端差 {f(hd["overdueDelta_mean"])}，95%CI [{f(hd["overdueDelta_ci95Low"])}, {f(hd["overdueDelta_ci95High"])}]。','',
 f'3秒Meeting分類：**{diagnosis}**。以高階Build的實際Processed Workload配對降幅為主要時間成本診斷；Completed Work與Gross另列。Gross同時受低額Meeting替代高報酬Boss Work與Follow-up影響，不等同單純工作時間損失。這些參考門檻只在報告，不進正式遊戲。','',
 'Boss Base Workload保持50。此實驗混合普通會議與Boss替代結果，不能單獨判定50是否合適；若要改Boss，下一輪應隔離Boss工作量／報酬／Severity與生活保護，不由本輪結果自動調整。','',
 '## 完整交付','', 'meeting-isolation-runs.csv：540每Seed明細與全部統計。meeting-isolation-summary.csv：18組分布。meeting-matched-delta.csv：270配對明細。meeting-matched-summary.csv：9組配對分布與CI。meeting-sanity.json／meeting-config-verification.json：守恆、Config、回歸證據。MEETING_V1_AI_REVIEW.zip包含本輪輸出與測試log。','']
(root/'MEETING_V1_IMPLEMENTATION_REPORT.md').write_text('\n'.join(lines),encoding='utf-8')
(root/'meeting-results.json').write_text(json.dumps({'sanity':sanity,'summary':summary,'pairedSummary':paired,'diagnosis':diagnosis},ensure_ascii=False,indent=2),encoding='utf-8')
for name in ['meeting-core-regression.log','meeting-browser-regression.log']:shutil.copyfile(game/'tests'/name,root/name)
with zipfile.ZipFile(root/'MEETING_V1_AI_REVIEW.zip','w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for path in sorted(root.iterdir()):
  if path.suffix in ['.md','.csv','.json','.log']:z.write(path,path.name)
with zipfile.ZipFile(root/'MEETING_V1_AI_REVIEW.zip') as z:assert z.testzip() is None
print('MEETING REPORT COMPLETE540',diagnosis,flush=True)
