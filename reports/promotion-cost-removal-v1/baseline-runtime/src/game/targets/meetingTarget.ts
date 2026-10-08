import { gameConfig as c } from '../../config/gameConfig';
import type { State, MeetingTarget, MeetingStatistics } from '../state/gameState';
import { newId, random, scaledSeconds } from '../time/worldTime';
import { getDeadlineWorkdayIndex } from '../work/deadline';
import { earn } from '../work/workStats';
import { notify } from '../events/eventLog';

export function emptyMeetingStatistics(): MeetingStatistics {
  return { normalMeetingRolls: 0, normalMeetingsTriggered: 0, bossMeetingRolls: 0, bossMeetingsTriggered: 0,
    meetingCount: 0, normalMeetingCount: 0, bossMeetingCount: 0, meetingSeconds: 0, normalMeetingSeconds: 0,
    bossMeetingSeconds: 0, meetingCompensation: 0, meetingCrossLunchCount: 0, meetingCrossEntertainmentCount: 0,
    meetingCrossSleepCount: 0, meetingCrossWorkStartCount: 0, workInterruptedByMeetingCount: 0 };
}
export const emptyMeetings = (): State['meetings'] => ({ lastScheduledWorkday: null, scheduledNormal: null, pendingBoss: null, statistics: emptyMeetingStatistics() });
export const meetingDuration = () => scaledSeconds(c.meeting.referenceMeetingDurationSeconds);
export function createMeeting(s: State, source: MeetingTarget['source'], scheduledStartWorldTime: number | null = null): MeetingTarget {
  const id = newId(s, 'meeting'), duration = meetingDuration();
  return { id, meetingId: id, type: 'MEETING', name: source === 'BOSS' ? '老闆臨時會議' : '例行會議', source,
    createdAtWorldTime: s.world.totalWorldTime, scheduledStartWorldTime, startedAtWorldTime: null,
    remainingDuration: duration, totalDuration: duration, rankAtCreation: s.career.rank,
    compensation: c.meeting.compensationByRank[s.career.rank], isBossMeeting: source === 'BOSS', crossedAnchors: [] };
}
export function activeBossMeeting(s: State) {
  return s.meetings.pendingBoss ?? [s.currentTarget, ...s.suspendedTargets.map(x => x.target)]
    .find((t): t is MeetingTarget => t?.type === 'MEETING' && t.isBossMeeting);
}
// Uses the existing WorkStart boundary, not a second scheduler.
export function scheduleNormalMeeting(s: State) {
  const day = getDeadlineWorkdayIndex(s.world.totalWorldTime);
  if (day < 0 || s.meetings.lastScheduledWorkday === day) return;
  s.meetings.lastScheduledWorkday = day; s.meetings.scheduledNormal = null;
  s.meetings.statistics.normalMeetingRolls++;
  const chance = c.meeting.normalChanceByRank[s.career.rank];
  // Zero chance consumes no RNG, preserving the existing engine when OFF.
  if (chance <= 0 || random(s) >= chance) return;
  const start = Math.max(c.time.workStartAnchor, c.time.breakfastCutoff), morning = c.time.lunchStart - start;
  const afternoonStart = c.time.lunchStart + c.time.lunchDuration;
  const offset = random(s) * (morning + c.time.offWorkAnchor - afternoonStart);
  const reference = offset < morning ? start + offset : afternoonStart + offset - morning;
  s.meetings.scheduledNormal = createMeeting(s, 'NORMAL', day * c.time.dayDuration + scaledSeconds(reference));
}
export function startMeeting(s: State, t: MeetingTarget) {
  if (s.currentTarget) {
    if (s.currentTarget.type === 'WORK') s.meetings.statistics.workInterruptedByMeetingCount++;
    s.suspendedTargets.push({ target: s.currentTarget, phase: s.needs.phase });
  }
  if (t.startedAtWorldTime === null) {
    t.startedAtWorldTime = s.world.totalWorldTime;
    if (t.isBossMeeting) s.meetings.statistics.bossMeetingsTriggered++; else s.meetings.statistics.normalMeetingsTriggered++;
    notify(s, '開會', `${t.name}開始：固定 ${t.totalDuration.toFixed(1)} 秒，工作能力不縮短會議。`);
  }
  s.currentTarget = t;
}
export function startScheduledMeeting(s: State) {
  const t = s.meetings.scheduledNormal, now = s.world.totalWorldTime;
  if (!t || t.scheduledStartWorldTime === null || now < t.scheduledStartWorldTime - 1e-8) return false;
  const day = Math.floor(t.scheduledStartWorldTime / c.time.dayDuration), time = now - day * c.time.dayDuration;
  if (time >= scaledSeconds(c.time.offWorkAnchor) - 1e-8) { s.meetings.scheduledNormal = null; return false; }
  const workingWindow = time >= scaledSeconds(Math.max(c.time.workStartAnchor, c.time.breakfastCutoff)) - 1e-8 &&
    (time < scaledSeconds(c.time.lunchStart) - 1e-8 || time >= scaledSeconds(c.time.lunchStart + c.time.lunchDuration) - 1e-8);
  if (!workingWindow || !['MORNING', 'AFTERNOON'].includes(s.needs.phase) ||
    s.currentTarget && (s.currentTarget.type !== 'WORK' || s.currentTarget.todo.mandatoryOvertime)) return false;
  s.meetings.scheduledNormal = null; startMeeting(s, t); return true;
}
export function progressMeeting(s: State, t: MeetingTarget, seconds: number) {
  const duration = Math.min(seconds, t.remainingDuration), from = s.world.totalWorldTime, to = from + duration;
  t.remainingDuration = Math.max(0, t.remainingDuration - duration);
  const stats = s.meetings.statistics; stats.meetingSeconds += duration;
  if (t.isBossMeeting) stats.bossMeetingSeconds += duration; else stats.normalMeetingSeconds += duration;
  for (let day = Math.floor(from / c.time.dayDuration); day <= Math.floor(to / c.time.dayDuration); day++) {
    const anchors: [string, keyof MeetingStatistics, number][] = [
      ['lunch', 'meetingCrossLunchCount', c.time.lunchStart], ['entertainment', 'meetingCrossEntertainmentCount', c.time.offWorkAnchor],
      ['sleep', 'meetingCrossSleepCount', c.time.sleepAnchor], ['workstart', 'meetingCrossWorkStartCount', c.time.workStartAnchor],
    ];
    for (const [name, counter, reference] of anchors) {
      const at = day * c.time.dayDuration + scaledSeconds(reference), key = `${day}:${name}`;
      if (from <= at + 1e-8 && to > at + 1e-8 && !t.crossedAnchors.includes(key)) { t.crossedAnchors.push(key); stats[counter]++; }
    }
  }
}
export function finishMeeting(s: State, t: MeetingTarget) {
  const stats = s.meetings.statistics; stats.meetingCount++;
  if (t.isBossMeeting) stats.bossMeetingCount++; else stats.normalMeetingCount++;
  // Independent fixed compensation; never enter Work reward / completion / Follow-up.
  earn(s, t.compensation); stats.meetingCompensation += t.compensation;
  notify(s, '開會', `${t.name}結束，固定補貼 +$${t.compensation}。`);
}
