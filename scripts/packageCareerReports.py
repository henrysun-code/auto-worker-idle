# -*- coding: utf-8 -*-
from pathlib import Path
import json,zipfile
root=Path(__file__).resolve().parent.parent/'reports'/'career-progression'
sanity=json.loads((root/'career-sanity.json').read_text(encoding='utf-8'))
assert sanity['passed'] and sanity['runCount']==900 and sanity['scenarioCount']==30
assert sanity['entertainmentMetricReplay']['additionalMatchedReplays']>=900
required=['scenarios','runs','daily','purchases','promotions','prestiges','milestones','upgrade-waits','policy-summary','prestige-timing-summary','recrawl','rank-residence','promotion-blocks','boss','sleep','workload-source','economy','cross-rank-work']
assert all((root/f'career-{name}.csv').is_file() for name in required)
files=sorted(p for p in root.iterdir() if p.is_file() and p.suffix in ['.md','.csv','.json'])
archive=root/'career-progression-results.zip'
with zipfile.ZipFile(archive,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for p in files:z.write(p,p.name)
with zipfile.ZipFile(archive) as z:assert z.testzip() is None
print(json.dumps({'archiveBytes':archive.stat().st_size,'fileCount':len(files),'zipCrcVerified':True}))
