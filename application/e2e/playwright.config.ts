import os from "node:os";

import { defineConfig, devices } from "@playwright/test";

const BASE_URL = process.env["E2E_BASE_URL"] ?? "http://localhost:3000";

// --- 並列ワーカー（主にここを読み・環境変数で調整）---
// ・タイムアウトや VRT のブレが出る → E2E_WORKERS=1 で逐次実行にすると安定しやすい
// ・CPU に余裕があり短縮したい → E2E_WORKERS=4 など明示（未指定時は論理 CPU の半分、最低 1）
// ・並列を抑えたい（例: 14 → 7）→ E2E_WORKERS=7 または pnpm run test:7
const DEFAULT_PARALLEL_WORKERS = Math.max(1, Math.floor(os.cpus().length / 2));
const envWorkerOverride = process.env["E2E_WORKERS"];
const parsedWorkers = envWorkerOverride !== undefined ? Number(envWorkerOverride) : NaN;
const WORKERS =
  Number.isFinite(parsedWorkers) && parsedWorkers >= 1
    ? Math.floor(parsedWorkers)
    : DEFAULT_PARALLEL_WORKERS;

export default defineConfig({
  globalSetup: "./globalSetup.ts",
  expect: {
    timeout: 60_000,
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.03,
    },
  },
  fullyParallel: true,
  workers: WORKERS,
  projects: [
    {
      name: "Desktop Chrome",
      testMatch: "**/src/**/*.test.ts",
      use: { ...devices["Desktop Chrome"], channel: "chrome" },
    },
  ],
  reporter: "list",
  retries: 1,
  testDir: "./src",
  timeout: 300_000,
  use: {
    baseURL: BASE_URL,
    headless: true,
    trace: "off",
    navigationTimeout: 30_000,
    actionTimeout: 30_000,
  },
});
