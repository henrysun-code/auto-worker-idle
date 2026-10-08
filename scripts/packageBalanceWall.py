import json,csv,hashlib,zipfile
from pathlib import Path
root=Path(__file__).resolve().parents[1];out=root/'FIRST_COMPANY_BALANCE_WALL_V2'
data=json.loads((out/'analysis.json').read_text());runs=json.loads((out/'runs.json').read_text())
def write(name,rows):
 keys=list(dict.fromkeys(k for r in rows for k in r))
 with (out/name).open('w',encoding='utf-8-sig',newline='') as f:
  w=csv.DictWriter(f,fieldnames=keys);w.writeheader();w.writerows(rows)
summaries={(x['candidate'],x['samples']):x for x in data['summary']}
rows=[]
for x in data['rank']:
 s=summaries[(x['candidate'],x['samples'])];r=x['rank'];rows.append(dict(x,**{f'rankEntryP{p}Minutes':0 if r==0 else s[f'R{r}P{p}Minutes'] for p in [10,50,90]},rankEntryCensored=x['samples']-x['entered']))
write('candidate-rank-times.csv',rows)
write('top3-sleep-ratios.csv',[dict(candidate=r['version'],seed=r['seed'],settlementIndex=i,ratio=ratio) for r in runs if sum(x['version']==r['version'] for x in runs)==30 for i,ratio in enumerate(r['sleepRatios'])])
write('final-levels-diagnostic.csv',[dict(candidate=r['version'],seed=r['seed'],**r['levels'],stableE=r['finalQualification']['efficiency'],stableQ=r['finalQualification']['quality'],rank=r['rank']) for r in runs])
readme='''# Balance Wall V2 review bundle

Read FIRST_COMPANY_BALANCE_WALL_V2/BALANCE_WALL_V2_REPORT.md first.
This is a focused review snapshot, not the entire historical workspace.
Includes all candidate data and current full production src/assets/public/config, new measurement scripts and 59 formal core tests (44 promotion + 15 overlays), four promotion browser tests, and full repository 461-core/32-browser/build evidence.
No candidate applied. No node_modules, Git internals, personal saves or environment secrets.

Reproduce from project root: npm ci; npx tsx scripts/balanceWallSweep.ts;
then npx tsx scripts/balanceWallSweep.ts A-G1.040-C3 A-G1.042-C3 A-G1.045-C3;
python scripts/reportBalanceWall.py; python scripts/finalizeBalanceWall.py; python scripts/packageBalanceWall.py.
Finalization expects the original full repository regression logs and protected hashes already supplied in this bundle.
Running npm test in this focused bundle runs the supplied59 tests, not all461 historical tests.
Browser reproduction: npx playwright test tests/browser/promotion-v1.spec.ts, with Edge as configured.
All paths are calculated from files; production Config is never written by the sweep.
Reproduction replaces this candidate output folder; preserve an existing copy first.
'''
(out/'REVIEW_README.md').write_text(readme,encoding='utf-8')
files=[p for folder in ['src','assets','public','config/generated'] for p in (root/folder).rglob('*') if p.is_file()]
files += [root/p for p in ['config/game_config.xlsx','package.json','package-lock.json','index.html','vite.config.ts','tsconfig.json','tsconfig.build.json','playwright.config.ts','scripts/config.ts','scripts/balanceWallCandidates.ts','scripts/balanceWallSweep.ts','scripts/reportBalanceWall.py','scripts/finalizeBalanceWall.py','scripts/packageBalanceWall.py','tests/promotion-v1.test.ts','tests/balance-wall-overlay.test.ts','tests/browser/promotion-v1.spec.ts']]
files += [p for p in out.rglob('*') if p.is_file() and p.suffix!='.zip' and p.name!='REVIEW_MANIFEST.json']
files=sorted(set(files));manifest=[dict(path=p.relative_to(root).as_posix(),bytes=p.stat().st_size,sha256=hashlib.sha256(p.read_bytes()).hexdigest()) for p in files]
(out/'REVIEW_MANIFEST.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8');files.append(out/'REVIEW_MANIFEST.json')
target=out/'FIRST_COMPANY_BALANCE_WALL_V2_REVIEW.zip'
with zipfile.ZipFile(target,'w',zipfile.ZIP_DEFLATED) as z:
 for p in files:z.write(p,p.relative_to(root).as_posix())
with zipfile.ZipFile(target) as z:
 assert z.testzip() is None
 for row in manifest:assert hashlib.sha256(z.read(row['path'])).hexdigest()==row['sha256']
print(json.dumps(dict(files=len(files),zipBytes=target.stat().st_size,verified=True)))
