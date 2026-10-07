import { gameConfig as c } from '../../config/gameConfig';
import type { State } from '../state/gameState';
import { random, scaledSeconds } from '../time/worldTime';
import { notify } from '../events/eventLog';
import { createTodo } from '../work/todoManager';
import { activeBossMeeting, createMeeting } from '../targets/meetingTarget';
export const catchChance = (s: State) => c.boss.baseAttention + s.player.upgrades.flattery*c.boss.flatteryAttentionPerLevel;
export const escapeSuccessValue = (s: State) => c.boss.baseEscapeValue+s.player.upgrades.slacking;
export const escapeChance = (s: State) => escapeSuccessValue(s)/(escapeSuccessValue(s)+c.boss.baseJobResistance+c.ranks[s.career.rank].rankEscapeResistance);
export const activeMandatoryBoss = (s: State) => [...s.todoQueue,...[s.currentTarget,...s.suspendedTargets.map(x=>x.target)].flatMap(t=>t?.type==='WORK'?[t.todo]:[])].find(t=>t.mandatoryOvertime);
export function bossSeverity(attention: number, roll: number) { return attention<1 ? (roll<attention?1:0) : Math.floor(attention)+(roll<attention-Math.floor(attention)?1:0); }
export function resolveBoss(s: State, forceCatch?: boolean, forceEscape?: boolean) {
  s.needs.bossChecked=true;
  if(activeMandatoryBoss(s) || activeBossMeeting(s))return {caught:false,escaped:false};
  notify(s,'老闆','老闆正在找人……',{},false);
  const attention=catchChance(s);
  const severity=forceCatch===false?0:forceCatch===true?Math.max(1,bossSeverity(attention,random(s))):bossSeverity(attention,random(s));
  if(!severity){notify(s,'老闆','下班前老闆找人：沒有找到你，正常下班。');return {caught:false,escaped:false};}
  notify(s,'老闆','老闆找到你了，準備逃跑判定。',{},false);
  const escaped=forceEscape??random(s)<escapeChance(s);
  if(escaped)notify(s,'老闆','下班前老闆找到你，但成功逃跑，正常下班。');
  else {
    s.meetings.statistics.bossMeetingRolls++;
    if(c.meeting.bossMeetingChanceOnEscapeFail>0 && random(s)<c.meeting.bossMeetingChanceOnEscapeFail){
      s.meetings.pendingBoss=createMeeting(s,'BOSS');
      notify(s,'老闆','下班前逃跑失敗；先吃晚餐，再參加老闆臨時會議。');
      return {caught:true,escaped,severity,outcome:'MEETING' as const};
    }
    const todo=createTodo(s,{id:'boss',name:`老闆急件 ×${severity}`,workload:c.work.bossWorkHours*c.time.referenceDayDuration/c.time.hoursPerDay*c.economy.baseWorkSpeed*scaledSeconds(1)*severity,reward:c.work.bossReward*severity,tags:['客戶','簡報'],weight:1,rank:0,quality:15},'BOSS');
    todo.bossSeverity=severity;todo.mandatoryOvertime=true;s.todoQueue.push(todo);s.needs.pendingBossId=todo.id;
    notify(s,'老闆',`下班前逃跑失敗；先吃晚餐，再完成老闆急件 ×${severity}。`,{workId:todo.id});
  }
  return {caught:true,escaped};
}
