// Historical regression fixtures intentionally retain the pre-rework balance.
// New official rules are exercised separately by promotion-v1 and incremental-v1 tests.
import fs from 'node:fs';
import {gameConfig as c} from '../src/config/gameConfig';
const baseline=JSON.parse(fs.readFileSync(new URL('../reports/first-company-incremental-v1/config-before.json',import.meta.url),'utf8'));
Object.assign(c,baseline);
