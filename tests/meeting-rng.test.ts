import './legacyBalanceFixture';
import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyMeetingOff } from '../scripts/verifyMeetingOff';
test('P Meeting OFF injection vs ON chance0 preserves full existing State plus RNG across9 fixtures',async()=>{
 const result=await verifyMeetingOff();assert.equal(result.passed,true);assert.equal(result.fixtures.length,9);
});
