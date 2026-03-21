import os from "node:os";

import { defineConfig, devices } from "@playwright/test";

import { CHROMIUM_LIGHT_LAUNCH_ARGS } from "./chromiumLightLaunch";

const BASE_URL = process.env["E2E_BASE_URL"] ?? "http://localhost:3000";

/** 従来どおりシステムの Google Chrome を使う（スクリーンショットのピクセル差を避けたい場合など） */
const USE_SYSTEM_CHROME = process.env["E2E_USE_SYSTEM_CHROME"] === "1";

// --- 並列ワーカー（主にここを読み・環境変数で調整）---
// ・タイムアウトや VRT のブレが出る → E2E_WORKERS=1 で逐次実行にすると安定しやすい
// ・CPU に余裕があり短縮したい → E2E_WORKERS=4 など明示（未指定時は論理 CPU の半分、最低 1）
// ・並列を抑えたい（例: 14 → 7）→ E2E_WORKERS=7 または pnpm run test:7
// ・負荷を下げる → 既定は Playwright 同梱 Chromium + 軽量起動引数。システム Chrome に戻す: E2E_USE_SYSTEM_CHROME=1
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
      name: USE_SYSTEM_CHROME ? "Desktop Chrome (system)" : "Desktop Chrome (bundled Chromium)",
      testMatch: "**/src/**/*.test.ts",
      use: {
        ...devices["Desktop Chrome"],
        ...(USE_SYSTEM_CHROME ? { channel: "chrome" as const } : {}),
        launchOptions: {
          args: [...CHROMIUM_LIGHT_LAUNCH_ARGS],
        },
      },
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
