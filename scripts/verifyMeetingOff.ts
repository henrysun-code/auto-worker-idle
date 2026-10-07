import assert from 'node:assert/strict';
import { cp,mkdtemp,mkdir,writeFile,readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath,pathToFileURL } from 'node:url';
import { gameConfig as c } from '../src/config/gameConfig';
import { initialState } from '../src/game/state/initialState';
import { advance } from '../src/game/engine/SimulationLoop';
// This baseline disables Meeting injection completely in a temporary copy.
// Both engines retain the same zero-time Lunch boundary correction.
export async function verifyMeetingOff(){
 const dir=await mkdtemp(join(tmpdir(),'auto-worker-meeting-off-'));
 await cp(fileURLToPath(new URL('../src/',import.meta.url)),join(dir,'src'),{recursive:true});await mkdir(join(dir,'config/generated'),{recursive:true});
 const config=structuredClone(c);config.meeting.normalChanceByRank=[0,0,0,0,0];config.meeting.bossMeetingChanceOnEscapeFail=0;
 await writeFile(join(dir,'config/generated/game_config.json'),JSON.stringify(config));await writeFile(join(dir,'package.json'),'{"type":"module"}');
 const file=join(dir,'src/game/targets/targetManager.ts'),text=await readFile(file,'utf8');assert.equal(text.split('  scheduleNormalMeeting(s);').length,2);
 await writeFile(file,text.replace('  scheduleNormalMeeting(s);','  // Meeting injection disabled in test-only baseline.'));
 const baseline=(await import(pathToFileURL(join(dir,'src/game/engine/SimulationLoop.ts')).href)) as typeof import('../src/game/engine/SimulationLoop');
 const saved=structuredClone(c.meeting),results=[];
 try{
  Object.assign(c.meeting,config.meeting);
  for(const rank of [0,2,4])for(const flattery of [0,100,200]){
   const a=initialState(42,0);a.career.rank=a.career.highestRank=rank;a.player.upgrades={efficiency:200,quality:200,lifeManagement:200,slacking:200,flattery};
   const b=structuredClone(a);baseline.advance(a,7200,{activeSeconds:7200});advance(b,7200,{activeSeconds:7200});
   const existing=(s:typeof a)=>{const out=structuredClone(s) as Partial<typeof s>;delete out.meetings;return out;};
   assert.deepEqual(existing(a),existing(b),'Meeting chance=0 changed existing full State / RNG');
   assert.equal(b.meetings.statistics.meetingCount,0);assert.equal(b.meetings.statistics.meetingCompensation,0);
   results.push({rank,flattery,minutes:120,fullExistingStateAndRngEqual:true});
  }
 }finally{Object.assign(c.meeting,saved);}
 return {passed:true,fixtures:results,baseline:'Meeting injection disabled in temporary engine copy; shared zero-time Lunch boundary correction retained.'};
}
