
// Swap this component for image/sprite assets without touching the simulation.
export function CharacterScene({ phase, age }: { phase: string; age: number }) {
  const sleeping = phase === 'SLEEP' || phase === 'DAY_TRANSITION';
  const eating = phase === 'BREAKFAST' || phase === 'LUNCH' || phase === 'DINNER' || phase === 'EATING_WORK';
  const relaxing = phase === 'ENTERTAINMENT';
  return <div className={`scene ${sleeping ? 'night' : ''}`} data-animation={sleeping ? 'sleep' : eating ? 'eat' : relaxing ? 'play' : 'work'}>
    <div className="scene-label"><span className="live-dot" />{sleeping ? '休息，也是正事' : eating ? '補給時間' : relaxing ? '私人時間・請勿打擾' : '自動工作中'}</div>
    <svg viewBox="0 0 390 224" role="img" aria-label={sleeping ? '角色正在睡覺' : eating ? '角色正在吃飯' : relaxing ? '角色正在玩手機' : '角色正在辦公室打字'}>
      <defs><pattern id="tiles" width="40" height="24" patternUnits="userSpaceOnUse"><path d="M40 0H0V24" fill="none" stroke="currentColor" strokeWidth=".65" /></pattern></defs>
      <path d="M0 167H390V224H0Z" fill="var(--floor)" /><path d="M0 167H390V224H0Z" fill="url(#tiles)" opacity=".18" />
      <rect x="30" y="31" width="112" height="104" rx="5" fill="var(--window-frame)" />
      <rect x="37" y="38" width="98" height="90" rx="1" fill="var(--sky)" />
      <circle cx="113" cy="57" r="12" fill={sleeping ? '#e9e9c9' : '#ead49d'} />
      <path d="M37 106H49V84H67V98H81V77H104V95H122V87H135V128H37Z" fill="var(--city)" />
      <path d="M87 36V130M36 82H137" stroke="var(--window-frame)" strokeWidth="5" />
      <rect x="287" y="41" width="60" height="57" rx="2" fill="#f6f3df" stroke="#cabfaa" />
      <text x="317" y="61" textAnchor="middle" fontSize="8" fill="#837565" letterSpacing="2">OFFICE</text>
      <text x="317" y="83" textAnchor="middle" fontSize="16" fill="#487063">宜 下 班</text>
      <path d="M325 163C315 146 305 129 315 121C329 123 326 144 328 151C335 123 348 113 355 124C356 139 338 152 333 165" fill="#62846c" />
      <path d="M312 159H345L340 186H317Z" fill="#b98466" /><path d="M312 159H345V165H312Z" fill="#c6997d" />
      <ellipse cx="209" cy="202" rx="66" ry="9" fill="#284b3c" opacity=".12" />
      <path d="M208 143V191M188 199L208 191L228 199" stroke="#53756d" strokeWidth="7" strokeLinecap="round" />
      <rect x="187" y="116" width="56" height="45" rx="10" fill="#698f7d" /><rect x="192" y="159" width="51" height="9" rx="4" fill="#4f7165" />
      <g className="worker">
        <path d="M208 151V178L197 184M229 151V178L239 184" fill="none" stroke="#4f595b" strokeWidth="11" strokeLinecap="round" />
        <path d="M195 110Q216 97 235 110L239 149H190Z" fill="#f5efdc" /><path d="M209 107L217 116L225 107" fill="none" stroke="#c6bca6" strokeWidth="2" /><path d="M217 116V139" stroke="#507868" strokeWidth="5" />
        <g className="head"><rect x="205" y="96" width="23" height="16" rx="6" fill="#dba981" /><rect x="196" y="59" width="43" height="44" rx="17" fill="#efcba8" />
          <path d="M194 82V65Q193 48 216 50Q242 50 242 71L237 87L232 68Q217 76 203 68V84Z" fill={age >= 36 ? '#7b8176' : '#354840'} />
          {sleeping ? <path d="M205 85h5m12 0h5" stroke="#354840" strokeWidth="2" strokeLinecap="round" /> : <><circle cx="208" cy="84" r="2" fill="#354840" /><circle cx="225" cy="84" r="2" fill="#354840" /></>}
          <path d="M213 94Q217 96 221 94" stroke="#b2836c" fill="none" strokeLinecap="round" />
          <rect x="201" y="78" width="13" height="12" rx="4" stroke="#63776c" fill="none" /><rect x="220" y="78" width="13" height="12" rx="4" stroke="#63776c" fill="none" /><path d="M214 83H220" stroke="#63776c" />
        </g>
        <path className="arm" d={eating ? 'M198 117L184 129L207 96' : relaxing ? 'M198 117L193 133L219 123' : sleeping ? 'M198 117L185 131L170 126' : 'M198 117L189 133L165 133'} fill="none" stroke="#efcba8" strokeWidth="9" strokeLinecap="round" />
        <path d="M230 117L243 135L213 138" stroke="#efcba8" strokeWidth="9" fill="none" strokeLinecap="round" />
      </g>
      <path d="M105 151V197M274 151V197" stroke="#8e7861" strokeWidth="7" /><path d="M94 140H287L277 152H102Z" fill="#cbae83" /><path d="M102 152H278V160H102Z" fill="#b99a72" />
      {!eating && !relaxing && <><path d="M120 98H161L174 139H133Z" fill="#597669" /><path d="M125 102H157L166 131H134Z" fill="#b2c7b3" /><path d="M137 110H152M140 116H159M141 122H153" stroke="#628975" strokeWidth="2" /><path d="M133 139H202V143H133Z" fill="#466258" /></>}
      {eating && <><path d="M156 126H190Q187 143 174 143Q160 143 156 126Z" fill="#f7f3df" /><path d="M160 125Q173 115 187 125" fill="#9cab69" /></>}
      {relaxing && <rect x="214" y="104" width="16" height="28" rx="3" fill="#456b5c" transform="rotate(14 222 118)" />}
      <path d="M253 125H267V140H253Z" fill="#eee5ce" /><path d="M267 128Q277 127 273 135H267" fill="none" stroke="#eee5ce" strokeWidth="3" />
      {sleeping && <text className="zzz" x="248" y="74" fill="#d1dec3" fontSize="18" fontWeight="bold">z z Z</text>}
    </svg>
    <span className="scene-caption">{sleeping ? '明天的事，明天的我會處理。' : eating ? '人是鐵，補給不能省。' : relaxing ? '再一下，就去睡。' : '人可以放空，工作會自己做。'}</span>
  </div>;
}
