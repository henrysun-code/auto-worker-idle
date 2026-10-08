import { gameConfig as c } from '../../config/gameConfig';
import type { State, Target } from '../types';
// One-time coordinate conversion; workload, money, levels and real active time are untouched.
export function migrateDayDuration(s:State){
 const old=s.world.dayDurationAtSave??c.time.referenceDayDuration,ratio=c.time.dayDuration/old;
 if(!(old>0))throw Error('Invalid saved day duration');
 s.world.dayDurationAtSave=c.time.dayDuration;
 if(ratio===1)return;
 const scale=(obj:object|undefined,keys:string[])=>{if(!obj)return;const v=obj as Record<string,unknown>;for(const k of keys)if(typeof v[k]==='number')v[k]=(v[k] as number)*ratio;};
 scale(s.world,['totalWorldTime','nextEventAt']);scale(s.needs,['satietyUntil','lunchRest']);
 scale(s.needs.sleep,['windowStart','windowEnd','duration','output']);
 scale(s.promotion,['createdAt','startedAt','deadlineWorldTime']);
 const target=(t:Target|null)=>{if(!t)return;scale(t,['createdAt','createdAtWorldTime','startedAt','startedAtWorldTime','deadlineWorldTime','scheduledStartWorldTime','windowStart','windowEnd','remainingDuration','totalDuration','accumulatedRestOutput']);if(t.type==='SLEEP')scale(t,['requirement','progress']);if(t.type==='WORK')scale(t.todo,['createdAt','createdAtWorldTime']);};
 target(s.currentTarget);for(const entry of s.suspendedTargets??[])target(entry.target);
 for(const todo of s.todoQueue??[])scale(todo,['createdAt','createdAtWorldTime']);
 for(const p of s.pendingFollowUps??[]){scale(p,['triggerAtWorldTime']);for(const t of p.tasksToCreate)scale(t,['createdAt','createdAtWorldTime']);}
 for(const p of s.projects??[])scale(p,['createdAt','deadline']);
 for(const p of Object.values(s.products??{}))scale(p,['nextBillingWorldTime']);
 for(const b of s.buffs??[])scale(b,['expiresAt']);
 for(const d of s.debuffs??[])scale(d,['duration','remainingDuration','expiresAt','createdAt']);
 for(const n of [...(s.eventLog??[]),...(s.notifications??[])])scale(n,['time']);
 for(const sample of s.runStatistics?.incomeSamples??[])scale(sample,['time']);
 if(s.meetings){target(s.meetings.scheduledNormal);target(s.meetings.pendingBoss);}
}
