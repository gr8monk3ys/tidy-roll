import { defineConfig, devices } from '@playwright/test';

const port = 3100;

export default defineConfig({
  testDir: './e2e',
  use: { baseURL: `http://localhost:${port}` },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `npm run build && npm run start -- --port ${port}`,
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
