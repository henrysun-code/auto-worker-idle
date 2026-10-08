import { useSyncExternalStore } from 'react';
import type { GameEngine } from '../game/engine/GameEngine';
export function useGame(engine: GameEngine) { useSyncExternalStore(engine.subscribe, engine.getSnapshot); return engine.state; }
