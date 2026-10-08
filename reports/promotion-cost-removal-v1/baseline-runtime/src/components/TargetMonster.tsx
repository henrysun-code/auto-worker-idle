import type { TargetKind } from '../game/presentation/target';

export function TargetMonster({ kind }: { kind: TargetKind }) {
  return <div className={`monster monster-${kind}`} aria-hidden="true">
    {kind === 'large' && <><i className="stack-page back" /><i className="stack-page front" /></>}
    {kind === 'sleep' && <><span className="sleep-spark one">✦</span><span className="sleep-spark two">z</span></>}
    {kind === 'urgent' && <span className="urgent-bolt">ϟ</span>}
    <div className="monster-body">
      {kind === 'rework' && <span className="monster-mark">🔁</span>}
      {kind === 'promotion' && <span className="monster-mark">🏅</span>}
      {kind === 'meeting' && <span className="monster-mark">👥</span>}
      {kind === 'problem' && <span className="monster-mark">✚</span>}
      {kind === 'lunch' && <span className="monster-mark">☕</span>}
      {kind === 'normal' || kind === 'large' ? <><i className="paper-fold" /><span className="monster-mark">{kind === 'large' ? '!!!' : '≡'}</span></> : kind === 'urgent' ? <span className="monster-mark">!</span> : kind === 'entertainment' ? <><span className="controller-cross">✚</span><span className="controller-buttons">●<br />●</span></> : kind === 'sleep' ? <span className="pillow-seam" /> : kind === 'food' ? <span className="rice-grains">◡ ◡ ◡</span> : kind === 'waiting' ? <span className="monster-mark">◷</span> : null}
      <div className="monster-face"><i className="eye left" /><i className="eye right" /><i className="mouth" /></div>
      <i className="monster-cheek left" /><i className="monster-cheek right" />
    </div>
    <i className="monster-foot left" /><i className="monster-foot right" />
  </div>;
}
