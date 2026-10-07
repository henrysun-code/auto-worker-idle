import { deadlineCounts } from './game/work/deadline';
import { useEffect, useState } from 'react';
import { gameConfig as c } from './config/gameConfig';
import type { GameEngine } from './game/engine/GameEngine';
import { useGame } from './hooks/useGame';
import { averageIncome } from './game/work/workStats';
import { money, decimal } from './utils/format';
import { Home } from './screens/Home';
import { Upgrades } from './screens/Upgrades';
import { Products } from './screens/Products';
import { History, noticeIcons } from './screens/History';
import { DebugPanel } from './components/DebugPanel';
const tabs = [{ id: 'home', icon: '⌂', label: '日常' }, { id: 'upgrades', icon: '↗', label: '升級' }, { id: 'products', icon: '✧', label: '產品' }, { id: 'history', icon: '▤', label: '紀錄' }];
export function App({ engine }: { engine: GameEngine }) {
  const s = useGame(engine); const counts = deadlineCounts(s.todoQueue, s.world.totalWorldTime);
  const [tab, setTab] = useState('home');
  const [debug, setDebug] = useState(false);
  useEffect(() => { engine.start(); return () => engine.stop(); }, [engine]);
  const changeTab = (id: string) => { setTab(id); setDebug(false); window.scrollTo({ top: 0, behavior: 'instant' }); };
  return <div className={`phone-shell ${s.player.settings.reducedMotion ? 'reduced-motion' : ''}`}>
    <header className="app-header"><a className="brand" href="#" onClick={e => { e.preventDefault(); changeTab('home'); }}><span className="brand-mark">工</span><div><h1>全自動打工人<span>。</span></h1><small>WORK. LIFE. REPEAT.</small></div></a><button className={`debug-toggle ${debug ? 'selected' : ''}`} aria-expanded={debug} onClick={() => setDebug(!debug)}>Debug</button></header>
    <div className="notification-stack" aria-label="事件通知" aria-live="polite" aria-relevant="additions" aria-atomic="false">{engine.toasts.map(n => <div className="toast" key={n.id}><span className="toast-icon">{noticeIcons[n.type]}</span><strong>{n.type === '老闆' ? '老闆' : n.type}</strong><p>{n.text}</p></div>)}</div>
    <div className="wallet"><div><span className="eyebrow">可用資產</span><strong><small>$</small>{money(s.player.money)}</strong><span className="income">↗ ${decimal(averageIncome(s))} <small>/ 秒</small></span></div><div className="wallet-todo" aria-label="待辦數量"><span>待辦工作</span><strong>{counts.total}</strong><small className="deadline-counts"><span>今日到期 {counts.dueToday}</span><span>已逾期 {counts.overdue}</span></small></div><div className="identity"><span>{c.ranks[s.career.rank].name}</span><small>{decimal(s.player.age)} 歲 · 持續營業中</small></div></div>
    {engine.saveError && <div className="save-error" role="alert">{engine.saveError}</div>}
    <main>{debug ? <DebugPanel engine={engine} close={() => setDebug(false)} /> : tab === 'home' ? <Home s={s} dispatch={engine.dispatch} /> : tab === 'upgrades' ? <Upgrades s={s} dispatch={engine.dispatch} /> : tab === 'products' ? <Products s={s} dispatch={engine.dispatch} /> : <History s={s} dispatch={engine.dispatch} />}</main>
    <nav className="bottom-nav" aria-label="主要導覽">{tabs.map(t => <button key={t.id} aria-current={!debug && tab === t.id ? 'page' : undefined} onClick={() => changeTab(t.id)}><span>{t.icon}</span>{t.label}<i /></button>)}</nav>
    <div className="desktop-note">012s LAB <span>全自動生活模擬 / PROTOTYPE {c.version}</span></div>
  </div>;
}
