from pathlib import Path
import json,hashlib,zipfile,csv,math
ROOT=Path(__file__).resolve().parent.parent/'reports'/'career-v3-full'
sanity=json.loads((ROOT/'career-v3-sanity.json').read_text(encoding='utf-8'));assert sanity['runs']==900 and sanity['status']=='COMPLETE_CANONICAL_900_RUNS'
verification=json.loads((ROOT/'csv-export-verification.json').read_text(encoding='utf-8'))
csvChecks=[]
for item in verification['files']:
 with (ROOT/item['file']).open(encoding='utf-8-sig',newline='') as f:
  reader=csv.reader(f);headers=next(reader);count=0
  assert len(headers)==len(set(headers))==item['columns']
  for row in reader:assert len(row)==len(headers);count+=1
 assert count==item['rows'];csvChecks.append({'file':item['file'],'rows':count,'columns':len(headers),'savedCsvShapePass':True})
oldEvidence={'career-v3-preflight-traces.json','career-v3-preflight.json','CAREER_V3_BLOCKING_BUG.md','core-tests.log','browser-tests.log','build.log','preflight.log','reproduction.log','package-verification.json','package.log'}
files=[p for p in ROOT.iterdir() if p.is_file() and p.suffix in ['.md','.csv','.json','.log'] and not p.name.startswith('career-v3-reproduction') and p.name not in oldEvidence]
for directory in ROOT.glob('canonical-part-*'):
 if directory.is_dir():files.extend(p for p in directory.iterdir() if p.is_file())
manifest=[{'file':p.relative_to(ROOT).as_posix(),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in sorted(files)]
(ROOT/'package-verification.json').write_text(json.dumps({'passed':True,'csvChecks':csvChecks,'files':manifest},ensure_ascii=False,indent=2),encoding='utf-8')
archive=ROOT/'CAREER_V3_CANONICAL_900_AI_REVIEW.zip'
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for p in files:z.write(p,p.relative_to(ROOT))
 z.write(ROOT/'package-verification.json','package-verification.json')
with zipfile.ZipFile(archive) as z:assert z.testzip() is None
print(json.dumps({'archive':str(archive),'bytes':archive.stat().st_size,'files':len(files)+1,'csvChecks':csvChecks}))
