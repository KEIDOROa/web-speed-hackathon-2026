/**
 * 並列ワーカーで複数ブラウザを動かすときの負荷を抑える Chromium 起動引数。
 * `E2E_LIGHT_BROWSER=1` のときだけ playwright.config で適用する（既定はシステム Chrome）。
 *
 * Playwright が既に付与する引数と重複しても Chrome は無視するかマージする。
 * 主な狙い: GPU・音声・不要なバックグラウンド・拡張機能のオーバーヘッド削減。
 */
export const CHROMIUM_LIGHT_LAUNCH_ARGS: readonly string[] = [
  "--disable-gpu",
  "--mute-audio",
  "--disable-dev-shm-usage",
  "--disable-extensions",
  "--disable-background-networking",
  "--disable-sync",
  "--disable-translate",
  "--disable-default-apps",
  "--disable-breakpad",
  "--disable-component-extensions-with-background-pages",
  "--disable-component-update",
  "--disable-hang-monitor",
  "--disable-ipc-flooding-protection",
  "--disable-popup-blocking",
  "--disable-prompt-on-repost",
  "--disable-renderer-backgrounding",
  "--metrics-recording-only",
  "--no-first-run",
  "--password-store=basic",
  "--use-mock-keychain",
];
