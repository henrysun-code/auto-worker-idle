import { useState } from 'react';
import type { State, Action } from '../game/types';
import { TargetCard } from '../components/TargetCard';
import { phaseLabels, scheduleStatus } from '../game/time/schedule';
import { gameConfig as c } from '../config/gameConfig';
import { canPrestige, calculateClarityReward } from '../game/prestige/prestigeManager';
import { OfflineSummaryCard } from '../components/OfflineSummaryCard';
import { decimal } from '../utils/format';
export function Home({ s, dispatch }: { s: State; dispatch: (a: Action) => boolean }) {
  const [confirm, setConfirm] = useState(false); const schedule = scheduleStatus(s);
  return <>
    <div className="dayline"><div><span className="eyebrow">世界 DAY {String(s.world.dayIndex + 1).padStart(2, '0')}</span><h2>{phaseLabels[s.needs.phase]} <span className="small-pill">{s.player.settings.speed}×</span></h2></div><div className="world-clock" aria-label="世界時鐘"><b>{decimal(s.world.timeOfDay)}<small> / {c.time.dayDuration}s</small></b><span>世界時間・準時換日</span></div></div>
    <p className={`schedule-caption ${schedule.delayed ? 'delayed' : ''}`} aria-label="目前作息時間">{schedule.delayed ? `${schedule.label}已延誤 ${decimal(schedule.seconds)} 秒` : `距${schedule.label} ${decimal(schedule.seconds)} 秒`}</p>
    <TargetCard s={s} />
    {s.offline.lastOfflineSummary && !s.offline.summaryDismissed && <OfflineSummaryCard summary={s.offline.lastOfflineSummary} dismiss={() => dispatch({ type: 'dismissOffline' })} />}
    <div className="buffs" aria-label="目前狀態">{[...s.debuffs.map(d => ({ id: d.id, name: d.name, negative: true })), ...s.buffs.map(b => ({ id: b.id, name: b.name, negative: false }))].slice(0, 3).map(b => <span key={b.id} className={`buff ${b.negative ? 'negative' : ''}`}>{b.negative ? '↘' : '↗'} {b.name}</span>)}</div>
    {canPrestige(s) && <section className="wake-card"><div><span className="eyebrow">夢，也可以在巔峰結束</span><span className="clarity-pill">✦ +{calculateClarityReward(s)}</span></div><button className="wake-button" onClick={() => setConfirm(true)}>該醒了，別做夢了 <span>↗</span></button><p>醒來後用清醒值投資多條永久倍率。</p></section>}
    {confirm && <div className="modal-backdrop"><section role="dialog" aria-modal="true" aria-label="確認醒來" className="modal"><h2>這場夢，做得夠久了。</h2><p>獲得 {calculateClarityReward(s)} 清醒值。重置當輪能力、待辦、專案與訂閱；永久能力保留。</p><div className="button-row"><button className="primary" onClick={() => { dispatch({ type: 'prestige' }); setConfirm(false); }}>確認醒來</button><button onClick={() => setConfirm(false)}>再做一下夢</button></div></section></div>}
  </>;
}
