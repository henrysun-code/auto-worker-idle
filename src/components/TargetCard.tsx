import { getDeadlineStatus } from '../game/work/deadline';
import { useEffect, useRef, useState } from 'react';
import type { State } from '../game/types';
import { currentTarget } from '../game/presentation/target';
import { decimal, money } from '../utils/format';
import { WorkerAvatar } from './WorkerAvatar';
import { TargetMonster } from './TargetMonster';

export function TargetCard({ s }: { s: State }) {
  const target = currentTarget(s);
  const progress = target.progress;
  const [completion, setCompletion] = useState('');
  const previous = useRef({ count: s.runStatistics.completedWork, earned: s.runStatistics.earned, runs: s.permanentStatistics.runs });
  useEffect(() => {
    const old = previous.current;
    previous.current = { count: s.runStatistics.completedWork, earned: s.runStatistics.earned, runs: s.permanentStatistics.runs };
    if (old.runs !== s.permanentStatistics.runs || s.runStatistics.completedWork <= old.count) { setCompletion(''); return; }
    setCompletion(`完成！+$${money(s.runStatistics.earned - old.earned)}`);
    const timeout = window.setTimeout(() => setCompletion(''), 1000);
    return () => window.clearTimeout(timeout);
  }, [s.runStatistics.completedWork, s.runStatistics.earned, s.permanentStatistics.runs]);
  return <section className={`target-card target-${target.kind}`} aria-label="中央目標" data-kind={target.kind} data-target-key={target.key}>
    <div className="target-top"><span className="target-type"><span>{target.icon}</span>{target.label}</span><span className="auto-label"><i className="live-dot" />{target.active ? '自動處理中' : '自動等待中'}</span></div>
    <h2 className="target-name">{target.name}</h2>
    <div className="target-arena" data-active={target.active}>
      <div className="executor"><WorkerAvatar kind={target.kind} age={s.player.age} /><span>打工人</span></div>
      {target.active && <div className="process-trail" aria-hidden="true"><i /><i /><i /></div>}
      <div className="target-spawn" key={target.key}><TargetMonster kind={target.kind} /></div>
      <div className="target-shadow" />
      {completion && <span className="completion-pop" key={s.runStatistics.completedWork}>{completion}</span>}
    </div>
    <div className="target-demand"><span>{target.active ? target.unit : '正在等待'}</span>{target.active && <strong>{decimal(target.timed ? target.remaining : Math.max(0, target.total - target.remaining))}<small>{target.timed ? " 秒" : ` / ${decimal(target.total)}`}</small></strong>}</div>
    {target.active && <><div className="progress target-progress" role="progressbar" aria-label="目前活動進度" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100}><i style={{ width: `${progress * 100}%` }} /></div><div className="target-speed"><span>{target.kind==='meeting' ? '固定時間流逝' : '目前處理速度'}</span><strong>{decimal(target.rate)} <small>{target.kind==='meeting' ? '秒 / 世界秒' : target.kind==='sleep' ? '睡眠輸出 / 秒' : target.timed ? '休息值 / 秒' : target.unit === '工作量' ? '工作量 / 秒' : '需求量 / 秒'}</small></strong></div></>}
    <div className="target-effect"><span>{target.kind === 'sleep' ? '☾' : target.kind === 'entertainment' ? '✧' : '↗'}</span><strong>{target.effect}</strong></div>
    <p className={`target-hint ${s.currentTarget?.type === 'WORK' ? `deadline-status ${getDeadlineStatus(s.currentTarget.todo,s.world.totalWorldTime).toLowerCase()}` : ''}`}>{target.hint}</p>
  </section>;
}
