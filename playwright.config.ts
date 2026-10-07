import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser', timeout: 60000, workers: 1,
  use: { baseURL: 'http://127.0.0.1:5176', browserName: 'chromium', viewport: { width: 390, height: 844 }, launchOptions: { channel: 'msedge' } },
  webServer: { command: 'npm run dev -- --port 5176 --strictPort', url: 'http://127.0.0.1:5176', reuseExistingServer: !process.env.CI },
});
