# -*- coding: utf-8 -*-
import json,csv,hashlib,statistics,zipfile
from pathlib import Path
from collections import Counter
root=Path(__file__).resolve().parents[1];out=root/'FIRST_COMPANY_BALANCE_WALL_V2'
data=json.loads((out/'analysis.json').read_text());runs=json.loads((out/'runs.json').read_text())
hashes=json.loads((out/'protected-hashes.json').read_text());changed=[p for p,h in hashes.items() if hashlib.sha256((root/p).read_bytes()).hexdigest()!=h]
assert not changed,changed
assert '32 passed' in (out/'browser-tests.log').read_text(encoding='utf-8')
assert 'pass 461' in (out/'core-tests.log').read_text(encoding='utf-8')
assert 'built in' in (out/'build.log').read_text(encoding='utf-8')
assert len(runs)==180 and len({(r['version'],r['seed']) for r in runs})==180
assert all(r['sleepRatios'] for r in runs),'Sleep telemetry missing'
selection=['A-G1.040-C3','A-G1.042-C3','A-G1.045-C3']
ranking=selection+['B-G1.040-C3','A-G1.040-C2','A-G1.042-C2','B-G1.042-C3','A-G1.045-C2','B-G1.040-C2','B-G1.045-C3','B-G1.042-C2','B-G1.045-C2']
def f(v):return '>60／未觀測到' if v is None else f'{v:.2f}' if isinstance(v,(int,float)) else str(v)
def tab(head,rows):return ['| '+' | '.join(head)+' |','| '+' | '.join(['---']*len(head))+' |']+['| '+' | '.join(str(v) for v in row)+' |' for row in rows]
def write(name,rows):
 keys=list(dict.fromkeys(k for r in rows for k in r))
 with (out/name).open('w',encoding='utf-8-sig',newline='') as fp:
  w=csv.DictWriter(fp,fieldnames=keys);w.writeheader();w.writerows(rows)
initial={r['candidate']:r for r in data['summary'] if r['samples']==10};expanded={r['candidate']:r for r in data['summary'] if r['samples']==30}
write('candidate-ranking.csv',[dict(position=i+1,**initial[id],selectedFor30Seeds=id in selection) for i,id in enumerate(ranking)])
write('rank-run-details.csv',[dict(candidate=r['version'],seed=r['seed'],rank=x['rank'],start=x['start'],end=x.get('end'),observedEnd=x.get('end',x.get('observedEnd')),startE=x['startEQ']['efficiency'],startQ=x['startEQ']['quality'],exitE=x.get('endEQ',{}).get('efficiency'),exitQ=x.get('endEQ',{}).get('quality'),censored='end' not in x) for r in runs for x in r['rankStats']])
write('pressure-run-details.csv',[dict(candidate=r['version'],seed=r['seed'],bossOvertimeSeconds=r['bossOvertime'],sleepWindows=len(r['sleepRatios']),sleepRatioMean=statistics.mean(r['sleepRatios']),sleepRatioMinimum=min(r['sleepRatios']),**{f'{k}_{s}':v for s,vals in r['counts'].items() for k,v in vals.items()}) for r in runs])
work=list(csv.DictReader((out/'workstarts.csv').open(encoding='utf-8')))
missed=[r for r in work if not r['blockingReasons'] and r['assigned']=='false'];assert not missed
permutation=Counter(r['version'] for r in runs)
verification=dict(protectedFiles=len(hashes),protectedChanges=changed,uniqueRuns=180,logicalSweepRuns=120,logicalTop3Runs=90,reusedTop3First10Runs=30,runCounts=dict(permutation),samplesPerCandidateValidated=True,unblockedMissedAssignments=0,noAutomaticWinner=True,noConfigWrites=True,noAutoTune=True,noCommit=True,noPush=True,sleepTelemetry='unique existing sleep-window settlement notices at production boundaries',coreTests=461,browserTests=32)
(out/'verification.json').write_text(json.dumps(verification,indent=2),encoding='utf-8')
lines=['# FIRST COMPANY BALANCE WALL REWORK V2','',
 '**沒有候選通過第一公司目標。** 12組×10 Seed與人工選出的3組×30 Seed全部未在60真人分鐘到R4。正式Config／GameState／SimulationLoop／Target／UI未修改；升職仍零費用。這輪完成候選測量與驗證，沒有套用Winner。','',
 '## 方法與保護','',
 '使用既有正式 advanceOnline／upgrade action／Promotion 路徑。12組候選記憶體 overlay：Threshold A或B、growth1.040/1.042/1.045、retry2/3。推薦E/Q依Threshold映射，普通中央Tier為推薦E×7；只有指定的門檻、推薦數值、Tier、Run baseCost、curve及retry改動。baseCosts=30/34/47/38/43（E/Q/拍馬屁/Life/摸魚）；softCap1=60、softCap2=120，post100/200Growth保留1.015/1.005。Rank Reward=1/2.2/5/11/25及其餘禁止項目完全保留。','',
 '每組固定42+i×7919，10 Seed i0–9；擴充到30 i0–29。每run3600真人秒，1x含既有SLEEP×60世界時間，每0.25真人秒買盡最便宜可負擔Run能力，沒有升職reserve、manual promote、Products、Prestige、Permanent、Low Profile或Offline。10組前段共120個run；Top3重用各10個已完成run、各補20個，總計180個獨立candidate/seed，非900Career。所有run跑滿60分鐘，不以到R4早停。','',
 '候選overlay與正式Config分離。protected-hashes.json涵蓋Excel、generatedJSON、v2Defaults及全部game來源與升職UI，前後SHA256完全相同。npm run build照既有規則生成Config後也保持原hash；沒有偷偷寫候選。正式成本公式已使用Config softCap1/2，無需修改Production。12組overlay allowlist regression同時驗證所有禁止數值不变、普通workload不double Rank scaling、建立後固定快照、四職級零錢派發、Dinner=120以及LowProfile僅影響評估。','',
 '## Purchase Burst 定義','',
 '同candidate、seed、realSeconds的購買合為一次Burst。interval是本run相鄰Burst時間差；首Burst無interval，跨Rank的interval歸到後一次Burst所屬Rank。所有有效interval均>0，不再將同Tick多買產生的0秒當體感；原purchases.csv逐筆保留。','',
 'Rank前25%／中50%／後25%依該Rank的**觀測停留真人時間**切段，再以Burst發生時間分類，interval仍為相鄰Burst完整間隔。右設限Rank以60分鐘作觀測尾端，其後25%不是假想已完成Rank最後四分之一。分位數為同Rank所有實際Burst pooled distribution，不先平均各run。ETA沿用最近60真人秒gross income、保持當下錢包推估五能力的median，每真人整秒採樣；不是預留資金或購買保證。','',
 'Career quantile分母包括全部10／30組，未到達視為>60右設限，不排除失敗樣本或填0。Promotion首次率分母為有派發過的run，尚未到Dinner者另列pending；平均Dinner%只含已結算Dinner。平均加班僅含已完成考核（成功=0），不將未完成加班當完整時間。elapsed包含晚餐／中斷，processing僅實際處理原失敗考核。CI為2000次固定測量seed1937+rank的bootstrap median 95% percentile區間，保留右設限；全未到R4時區間不可辨識，標>60而非偽造35分鐘。','',
 '## 12組排名與初測','',
 '這是人工選擇的「相對可繼續檢查」順序，沒有程式Score或Auto Tune。R4 P50/P90與完整快→中→慢→Wall均未達標，故沒有合格Winner；平手時優先A較低最後門檻、R4考核派發覆蓋、較早進R3、較長後段Burst與較少逾期。前3組A/C3兼顧接近最後考核與三種成本曲線，C2更早重試未必更早成功，B有更多run連最後考核都未觸及。排序不是宣稱R4可達35分鐘。','']
lines+=tab(['順序','候選','R1 P50分','R2 P50分','R3 P50分','R4達成','R4 P50/P90','Burst R0/R1/R2/R3秒','R3後25%秒'],[[i+1,id,f(initial[id]['R1P50Minutes']),f(initial[id]['R2P50Minutes']),f(initial[id]['R3P50Minutes']),f"{initial[id]['r4Reached']}/10",'>60 / >60',' / '.join(f(initial[id][f'R{k}BurstP50']) for k in range(4)),f(initial[id]['R3LateBurstP50'])] for i,id in enumerate(ranking)])
lines+=['','每組R1/R2/R3 P10/P50/P90、R4 reached/censored及所有壓力指標完整見candidate-summary.csv；Rank停留、起終E/Q、購買數、ETA見candidate-rank-times.csv與rank-run-details.csv。每Rank Burst count、P10/P50/P90與三時段P50見candidate-burst-intervals.csv；不可只看此表的P50。','','## Top3 30 Seed','']
for id in selection:
 row=expanded[id];lines+=['',f'### {id}','']
 lines+=tab(['Rank','P10真人分','P50真人分','P90真人分'],[[f'R{k}',f(row[f'R{k}P10Minutes']),f(row[f'R{k}P50Minutes']),f(row[f'R{k}P90Minutes'])] for k in range(1,5)])
 lines+=['',f"R4 {row['r4Reached']}/30，censored {row['r4Censored']}/30；Burst R0→R3 P50："+' / '.join(f(row[f'R{k}BurstP50']) for k in range(4))+f"秒；R3後25% {f(row['R3LateBurstP50'])}秒。",'']
 promos=[p for p in data['promotion'] if p['samples']==30 and p['candidate']==id];lines+=tab(['升職','首次成功%','首次超時失敗%','首次pending%','Dinner平均%','平均重試','加班processing秒','加班elapsed秒'],[[f"R{p['fromRank']}→R{p['fromRank']+1}",f(p['firstSuccessPercent']),f(p['firstFailedOvertimePercent']),f(p['firstPendingPercent']),f(p['meanDinnerCompletionPercent']),f(p['meanRetries']),f(p['meanCompletedOvertimeProcessing']),f(p['meanCompletedOvertimeElapsed'])] for p in promos])
 lines+=['',f"Todo 時間加權平均 {f(row['todoAverage'])}／期末P50 {f(row['todoFinalP50'])}／Peak P90 {f(row['todoPeakP90'])}；DueToday平均 {f(row['dueTodayAverage'])}／期末 {f(row['dueTodayFinalP50'])}／Peak P90 {f(row['dueTodayPeakP90'])}；Overdue平均 {f(row['overdueAverage'])}／期末 {f(row['overdueFinalP50'])}／Peak P90 {f(row['overduePeakP90'])}。Boss加班processing平均 {f(row['bossOvertimeMeanSeconds'])}世界秒；每run睡眠ratio平均再平均 {f(row['sleepRatioMean'])}，窗口pooled P10 {f(row['sleepRatioP10'])}。"]
lines+=['','## Gate、Wall與未達標原因','',
 '所有180個run，無正式阻塞卻未派Promotion的WorkStart為0。Money不在正式阻塞原因。剩下E/Q、逾期、冷卻、未完成考核、強制Boss／BossMeeting與WorkStart時點，皆為既有正式條件；沒有Level cap、Random Success、升職reserve、新公司或人工停升職。未發現runaway Todo／Overdue，逐run平均／期末／peak完整保留，不用期末正常掩蓋中途壓力。','',
 '固定workload=門檻E×96×1.20且派發剛達門檻時，一開始沒有20% headroom；考核不給一般工作收入，BUY_ALL也不能穩定靠考核途中繼續買效率。提高成本成長减少了等下一個合法WorkStart期間的能力超額，結果更常首次必敗；多次失敗又消耗Career時間與一般賺錢時間。該解釋只連結正式路徑與已觀測結果，不是新增成功機率或改factor。','',
 '**NEXT BOTTLENECK: RANK REWARD MULTIPLIER**。候選仍呈現R0較慢、升R1/R2反而Burst變快，提前成本成長未抵銷Rank收入跳躍。這是下一輪應隔離檢查的參數，但本輪一律保留1/2.2/5/11/25；它也不是唯一原因，Promotion頭部壓力與賺錢時間被重試占用同時存在，不能承諾只調Reward便能到35分鐘。','',
 '## Level爆炸與數學表','',
 '180個run沒有到R4，故candidate-levels-at-r4.csv的R4樣本數全0，P10/P50/P90留空；不可用60分鐘的期末能力冒充到R4時能力。runs.json另外保存真實期末能力；未達R4無法驗證「R4時主要能力100上下」。Lv200/300/500/1000下一級Cost用現有正式函數形狀推算，見candidate-softwall-costs.csv（五能力×三curve×四levels）。此表是數學延伸，沒有執行Prestige或將1～2周目沒有Lv1000宣稱為已模擬證據。','',
 '## Regression與交付','',
 'npm test 461/461；browser tests 32/32；npm run build PASS。原正式Cost Removal、Dinner deadline、Lunch bypass、SLEEP×60、180日長、普通workload快照、Save／Offline／Products／Prestige均保留，全部protected source/config hash相同。瀏覽器首輪31/32，產品framework測試在並行長模擬時遇60秒timeout；停止長運算後完整重跑通過，保留browser-tests-initial.log。没有為過測試放寬timeout或修改產品。','',
 '睡眠結算旗標在observer前已重設，首次測量漏記；已改為每個正式邊界讀取既有「睡眠窗口結算」通知並以id去重，再重播相同180情境。此修正不讀取通知排隊時間、不影響引擎/RNG；報告使用重播後資料。12組10Seed與Top3擴充原始CSV保留購買/Burst/Promotion/WorkStart，每項指標可追到candidate+seed。前10Seed重用而非擴充為偽獨立樣本。','',
 '檔案：BALANCE_WALL_V2_REPORT.md、candidate-ranking.csv、candidate-summary.csv、candidate-rank-times.csv、candidate-burst-intervals.csv、candidate-promotions.csv、candidate-levels-at-r4.csv、candidate-softwall-costs.csv、top3-30seed-summary.csv、top3-confidence-intervals.csv、runs.json、candidate JSON、原始CSV、verification.json與三種驗證logs。未Commit／Push／部署。','',
 '## 最後11個回答','',
 '1. **哪3組最好？** 相對選出A-G1.040-C3、A-G1.042-C3、A-G1.045-C3；三組均未合格，不存在正式Winner。',
 '2. **哪組最接近35分鐘R4？** 無法證明。三組30Seed的R4全部>60；A-G1.040-C3較早到R3只是候選比較代理，不是R4=35。',
 '3. **哪組最接近目標升級節奏？** 高growth候選後段Burst稍長，A-G1.045-C3／B-G1.045-C3在10Seed接近後段相對上緣，但所有候選都仍升職後變快，沒有任何完整3～6→6～10→10～20→20～30秒節奏達標。',
 '4. **Cooldown2或3？** 此組固定配對中3較適合作為進一步檢查基準；2較快再次考核但常在不足能力時再次失敗，不保證縮短到R3/R4。這不是所有策略都應選3的普遍結論。',
 '5. **ThresholdA或B？** A較合適；B最後E110/Q66更晚觸及，R4完成目標未見改善。',
 '6. **baseGrowth哪個最好？** 1.040在Career推進上相對較好；1.045後段等待稍長但仍沒有SoftWall。沒有一個同時滿足Career和升級體感，不指定正式值。',
 '7. **Promotion仍過難？** 是。各候選後續首次超時比例多接近100%，超出40～80%；pending不是成功，不能將未結算導致的較低失敗百分比當改善。',
 '8. **真正SoftWall形成？** 否。後段等待增加一些，但遠未達20～30秒，且Rank升級後還會變快。',
 '9. **R4時能力多少？** 無R4樣本，不能回答實際分布。沒有用期末能力冒充，亦未用數學表宣稱長期Prestige已驗證。',
 '10. **非使用者要求的人為Gate？** 本輪正式升職與BUY_ALL路徑未發現；未加入新Gate，零Money、零reserve，沒有Level cap或隨機成功。',
 '11. **下一個參數是否Rank Reward multiplier？** 是，至少對升職後Burst反而縮短而言應列下一個隔離檢查；同時必須保留Promotion過難與收入時間被重試占用的證據。本輪完全未改Reward，也不宣稱單調它必能解全部問題。','']
(out/'BALANCE_WALL_V2_REPORT.md').write_text('\n'.join(lines),encoding='utf-8')
print('Report finalized; protected files unchanged; unique runs180.')
