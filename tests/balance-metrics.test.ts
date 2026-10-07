import test from 'node:test';
import assert from 'node:assert/strict';
import { quantile,slope,longest,stats } from '../scripts/balanceMetrics';
test('balance quantiles use explicit linear interpolation',()=>{assert.equal(quantile([0,10,20],.5),10);assert.equal(quantile([0,10,20],.9),18);});
test('balance OLS trend and streak handles flat and growing series',()=>{assert.equal(slope([1,2,3,4]),1);assert.equal(slope([5,5,5]),0);assert.equal(longest([true,true,false,true]),2);});
test('balance seed summary reports median percentiles and finite confidence interval',()=>{const s=stats([1,2,3]);assert.equal(s.mean,2);assert.equal(s.seedCount,3);assert.ok(Number.isFinite(s.ci95Low));});
