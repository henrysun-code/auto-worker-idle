import { defineConfig } from 'vite';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL('.', import.meta.url));
export default defineConfig({
  base: './',
  plugins: [{ name: 'game-excel-reload', configureServer(server) {
    const workbook = path.join(root, 'config/game_config.xlsx');
    server.watcher.add(workbook);
    server.watcher.on('change', file => {
      if (path.resolve(file) !== workbook) return;
      const result = spawnSync(process.execPath, ['--import', 'tsx', 'scripts/config.ts'], { cwd: root, encoding: 'utf8' });
      if (result.status !== 0) server.config.logger.error(result.stderr);
      else server.ws.send({ type: 'full-reload' });
    });
  }}],
  build: { outDir: 'dist' },
});
