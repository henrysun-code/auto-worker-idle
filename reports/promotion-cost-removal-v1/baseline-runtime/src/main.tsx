import { createRoot } from 'react-dom/client';
import { App } from './App';
import { GameEngine } from './game/engine/GameEngine';
import './style.css';
import './target-style.css';
const engine = new GameEngine();
createRoot(document.getElementById('root')!).render(<App engine={engine} />);
