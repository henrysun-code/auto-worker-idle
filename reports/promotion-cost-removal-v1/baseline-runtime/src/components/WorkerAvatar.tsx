import type { TargetKind } from '../game/presentation/target';

// The executor stays small; replace this sprite independently of the target card.
export function WorkerAvatar({ kind, age }: { kind: TargetKind; age: number }) {
  const sleeping = kind === 'sleep' || kind === 'waiting';
  return <svg className="worker-avatar" viewBox="0 0 88 120" role="img" aria-label={sleeping ? '小人正在恢復精神' : '小人正在自動處理需求'}>
    <ellipse cx="42" cy="111" rx="30" ry="5" fill="#466a52" opacity=".12" />
    <path d="M31 86L28 105H18M49 86L54 105H66" stroke="#4f595b" strokeWidth="10" fill="none" strokeLinecap="round" />
    <g className="avatar-body">
      <path d="M22 60Q40 50 59 60L63 88H18Z" fill="#f5efdc" stroke="#c6bca6" strokeWidth="1.5" />
      <path d="M34 56L41 67L48 56M41 67V82" fill="none" stroke="#507868" strokeWidth="4" />
      <rect x="32" y="43" width="19" height="16" rx="5" fill="#dba981" />
      <rect x="21" y="11" width="41" height="40" rx="16" fill="#efcba8" />
      <path d="M19 32V18Q20 1 41 3Q64 3 65 25L60 34L57 19Q41 27 27 19V33Z" fill={age >= 36 ? '#7b8176' : '#354840'} />
      <rect x="24" y="27" width="13" height="11" rx="4" stroke="#63776c" fill="none" /><rect x="44" y="27" width="13" height="11" rx="4" stroke="#63776c" fill="none" /><path d="M37 32H44" stroke="#63776c" />
      {sleeping ? <path d="M28 33H32M48 33H52" stroke="#354840" strokeWidth="2" /> : <><circle cx="30" cy="33" r="1.7" fill="#354840" /><circle cx="50" cy="33" r="1.7" fill="#354840" /></>}
      <path d="M36 43Q40 46 45 43" stroke="#b2836c" fill="none" strokeLinecap="round" />
      <path d="M24 65L14 78L36 81" stroke="#efcba8" strokeWidth="8" fill="none" strokeLinecap="round" />
      <path className="avatar-arm" d="M57 63L68 72L78 65" stroke="#efcba8" strokeWidth="8" fill="none" strokeLinecap="round" />
      {kind === 'entertainment' ? <rect x="68" y="52" width="13" height="24" rx="3" fill="#456b5c" /> : kind === 'food' ? <path d="M62 73H82Q79 87 72 87Q64 87 62 73Z" fill="#e4cf9c" /> : !sleeping ? <><path d="M62 61H81V76H62Z" fill="#8fab91" stroke="#456b5c" strokeWidth="1.5" /><path d="M60 77H85" stroke="#456b5c" strokeWidth="3" strokeLinecap="round" /></> : <text x="65" y="26" fontSize="15" fill="#7889a0">z</text>}
    </g>
  </svg>;
}
