import { sleepRatio, sleepEffect } from '../targets/sleepWindow';
import { deadlineLabel, getDeadlineStatus } from '../work/deadline';
import { gameConfig as c } from '../../config/gameConfig';
import type { State } from '../state/gameState';
import { lunchTier } from '../targets/targetManager';
import { targetRate } from '../targets/targetManager';
import { workReward, originalWorkReward } from '../work/workStats';
import { decimal, money } from '../../utils/format';
export type TargetKind = 'normal' | 'urgent' | 'large' | 'entertainment' | 'sleep' | 'food' | 'waiting' | 'lunch' | 'problem' | 'rework' | 'meeting' | 'promotion';
export interface TargetView { kind: TargetKind; key: string; name: string; label: string; icon: string; total: number; remaining: number; progress: number; rate: number; unit: string; effect: string; active: boolean; hint: string; timed?: boolean; rest?: number }
export function currentTarget(s: State): TargetView {
  const t = s.currentTarget; const key = `${s.permanentStatistics.runs}:${t?.id ?? 'waiting'}`;
  if (!t) return { kind: 'waiting', key, name: s.needs.phase === 'WAIT' ? '睡飽了，等天亮' : '等下一個作息節點', label: '自動等待', icon: '◷', total: 0, remaining: 0, progress: 0, rate: 0, unit: '', effect: '世界時間持續前進', active: false, hint: '待辦保留到下一個可工作時間。' };
  const base = { key, name: t.name, active: true, rate: targetRate(s, t) };
  if (t.type === 'MEETING') return { ...base, kind: 'meeting', label: t.isBossMeeting ? '老闆臨時會議' : '例行會議', icon: '👥', total: t.totalDuration, remaining: t.remainingDuration, progress: 1-t.remainingDuration/t.totalDuration, unit: '會議剩餘', effect: `結束固定補貼 +$${money(t.compensation)}`, hint: '固定世界時間；效率、品質與生活能力不會縮短會議。', timed: true };
  if (t.type === 'LUNCH') return { ...base, kind: 'lunch', label: '午休時間窗口', icon: '☕', total: t.windowEnd - t.windowStart, remaining: Math.max(0, t.windowEnd - s.world.totalWorldTime), progress: (s.world.totalWorldTime - t.windowStart) / (t.windowEnd - t.windowStart), unit: '午休剩餘', effect: `累積休息 ${decimal(t.accumulatedRestOutput)}`, hint: `目前：${lunchTier(s.needs.lunchRest).name} · 預估下午工作速度 +${Math.round(lunchTier(s.needs.lunchRest).speedBonus * 100)}%`, timed: true, rest: t.accumulatedRestOutput };
  if(t.type==='SLEEP'){const effect=sleepEffect(sleepRatio(s));return {...base,kind:'sleep',label:'固定睡眠窗口',icon:'☾',total:s.needs.sleep.windowEnd-s.needs.sleep.windowStart,remaining:Math.max(0,s.needs.sleep.windowEnd-s.world.totalWorldTime),progress:Math.min(1,sleepRatio(s)),unit:'睡眠剩餘',effect:`今晚睡眠 ${(sleepRatio(s)*100).toFixed(1)}% · 效率 ${(effect.speedModifier*100).toFixed(1)}% · 品質 ${(effect.qualityModifier*100).toFixed(1)}%`,hint:'上班錨點結束睡眠；依實際睡眠連續計算隔日效果。',timed:true};}
  const progress = t.progress / t.requirement; const common = { ...base, total: t.requirement, remaining: t.requirement - t.progress, progress };
  if(t.type==='PROMOTION')return {...common,kind:'promotion',label:'升職考核',icon:'🏅',unit:'考核工作量',effect:s.promotion.status==='FAILED_OVERTIME'?'考核已失敗，仍須完成剩餘工作':`準時完成且符合條件即可升職為 ${c.ranks[t.toRank].name}`,hint:`預估剩餘 ${decimal(common.remaining/base.rate)} 秒 · 期限：下班／晚餐錨點 · 剩餘 ${decimal(Math.max(0,t.deadlineWorldTime-s.world.totalWorldTime))} 秒`};
  if (t.type === 'WORK') {
    const bad = t.todo.followUpType && c.followUps.types.find(f => f.type === t.todo.followUpType)?.qualitySensitive;
    const kind = bad ? 'rework' : t.todo.sourceType === 'PROJECT' ? 'large' : t.todo.type === 'URGENT' || t.todo.sourceType === 'BOSS' ? 'urgent' : 'normal';
    const p = s.projects.find(p => p.id === t.todo.projectId);
    return { ...common, kind, label: bad ? '低收益返工' : t.todo.sourceType === 'BOSS' ? '老闆臨時任務' : p ? '專案工作' : t.todo.sourceType === 'FOLLOW_UP' ? '正常後續工作' : kind === 'urgent' ? '急件工作' : '日常待辦', icon: bad ? '🔁' : p ? '🗂️' : t.todo.sourceType === 'FOLLOW_UP' ? '↪' : '▤', unit: '工作量', effect: getDeadlineStatus(t.todo,s.world.totalWorldTime) === 'OVERDUE' ? `完成 +$${money(workReward(s,t.todo))}（原 $${money(originalWorkReward(s,t.todo))}）` : `完成 +$${money(workReward(s,t.todo))}`, hint: p ? `${deadlineLabel(t.todo,s.world.totalWorldTime)} · ${p.name} · ${p.completedSubtasks} / ${p.subtasks.length}｜品質要求 ${decimal(t.todo.qualityRequirement)}` : `${deadlineLabel(t.todo,s.world.totalWorldTime)} · 品質要求 ${decimal(t.todo.qualityRequirement)}` };
  }
  if (t.type === 'FOOD') return { ...common, kind: 'food', label: t.meal === 'BREAKFAST' ? '早餐食物怪' : t.meal === 'LUNCH' ? '午餐食物怪' : t.meal === 'DINNER' ? '晚餐食物怪' : '工作補給', icon: t.productId ? '🥤' : '🍚', unit: '進食需求', effect: '完成用餐，繼續作息', hint: t.meal === 'LUNCH' ? '吃飯也消耗固定午休窗口，快速食物可多留休息時間。' : '自動使用預設食物，產品無效或餘額不足改用普通餐點。' };
  if (t.type === 'PROBLEM') { const p = c.products.definitions.find(p => p.id === t.productId)!; const d = s.debuffs.find(d => d.id === t.debuffId); return { ...common, kind: 'problem', label: `${p.icon} ${p.name}介入`, icon: p.icon, unit: '問題需求', effect: `完成解除 ${d?.name ?? '原問題'}`, hint: `原 Debuff 剩餘 ${decimal(Math.max(0, (d?.expiresAt ?? s.world.totalWorldTime) - s.world.totalWorldTime))} 秒 · 處理預估 ${decimal(common.remaining / base.rate)} 秒 · 預計提前解除約 ${decimal(Math.max(0, (d?.expiresAt ?? s.world.totalWorldTime) - s.world.totalWorldTime - common.remaining / base.rate))} 秒。` }; }
  return { ...common, kind: 'entertainment', label: '娛樂需求怪', icon: '🎮', unit: '生活需求', effect: '完成獲得放鬆 Buff', hint: '生活管理提升處理效率；世界時間不會等角色。' };
}
