import generated from '../../config/generated/game_config.json' with { type: 'json' };
import { defaultGameConfig } from './v2Defaults';
export { defaultGameConfig };
export type GameConfig = typeof defaultGameConfig;
export const gameConfig = generated as unknown as GameConfig;
