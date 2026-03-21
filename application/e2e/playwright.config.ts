import os from "node:os";

import { defineConfig, devices } from "@playwright/test";

import { CHROMIUM_LIGHT_LAUNCH_ARGS } from "./chromiumLightLaunch";

const BASE_URL = process.env["E2E_BASE_URL"] ?? "http://localhost:3000";

/**
 * 既定はシステムの Google Chrome（安定）。負荷優先で Playwright 同梱 Chromium + 軽量引数にする場合のみ 1。
 * 同梱 Chromium は環境によってはクラッシュしやすく、並列時に TypeError (reading 'project') 連鎖の原因になることがある。
 */
const USE_BUNDLED_CHROMIUM_LIGHT = process.env["E2E_LIGHT_BROWSER"] === "1";

/**
 * ブラウザ（Chromium レンダラ）の V8 ヒープ上限（MB）。例: 4096
 * 重いページでレンダラが落ちるときに試す。並列ワーカー数 × この値が RAM を圧迫しやすいので注意。
 */
function browserJsHeapArgs(): string[] {
  const raw = process.env["E2E_BROWSER_JS_HEAP_MB"];
  if (raw == null || raw === "") {
    return [];
  }
  const mb = Number.parseInt(raw, 10);
  if (!Number.isFinite(mb) || mb < 256) {
    return [];
  }
  return [`--js-flags=--max-old-space-size=${mb}`];
}

const BROWSER_JS_HEAP_ARGS = browserJsHeapArgs();

// --- 並列ワーカー（主にここを読み・環境変数で調整）---
// ・タイムアウトや VRT のブレが出る → E2E_WORKERS=1 で逐次実行にすると安定しやすい
// ・CPU に余裕があり短縮したい → E2E_WORKERS=4 など明示（未指定時は論理 CPU の半分、最低 1）
// ・並列を抑えたい（例: 14 → 7）→ E2E_WORKERS=7 または pnpm run test:7
// ・負荷を下げる（実験的）→ E2E_LIGHT_BROWSER=1 で同梱 Chromium + 軽量起動引数（不安定なら使わない）
// ・メモリ（アプリから触れる範囲）
//   - Node（Playwright 本体・テストランナー）: NODE_OPTIONS=--max-old-space-size=8192 など → pnpm run test:heap / test:7:heap
//   - ブラウザ各プロセス: E2E_BROWSER_JS_HEAP_MB=4096（レンダラ V8。ワーカー数ぶん乗る）
//   - Windows の「物理メモリに振る」配分は OS / 仮想メモリ設定。ここからは変更できない
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
      name: USE_BUNDLED_CHROMIUM_LIGHT ? "Chromium (light)" : "Desktop Chrome",
      testMatch: "**/src/**/*.test.ts",
      use: {
        ...devices["Desktop Chrome"],
        ...(USE_BUNDLED_CHROMIUM_LIGHT
          ? {
              launchOptions: {
                args: [...CHROMIUM_LIGHT_LAUNCH_ARGS, ...BROWSER_JS_HEAP_ARGS],
              },
            }
          : BROWSER_JS_HEAP_ARGS.length > 0
            ? {
                channel: "chrome" as const,
                launchOptions: {
                  args: BROWSER_JS_HEAP_ARGS,
                },
              }
            : { channel: "chrome" as const }),
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
