import type * as playwright from "playwright";
import type * as puppeteer from "puppeteer";

import { consola } from "../consola";
import { goTo } from "../utils/go_to";
import { startFlow } from "../utils/start_flow";

import { calculateHackathonScore } from "./utils/calculate_hackathon_score";

type Params = {
  baseUrl: string;
  playwrightPage: playwright.Page;
  puppeteerPage: puppeteer.Page;
};

export async function calculateHomePage({ baseUrl, playwrightPage, puppeteerPage }: Params) {
  const flow = await startFlow(puppeteerPage);

  consola.debug("Home - navigate");
  await flow.startNavigation();
  try {
    await goTo({
      playwrightPage,
      puppeteerPage,
      timeout: 120 * 1000,
      url: new URL("/", baseUrl).href,
    });
  } catch (err) {
    throw new Error("ページの読み込みに失敗したか、タイムアウトしました", { cause: err });
  }
  await flow.endNavigation();

  consola.debug("Home - navigate end");
  const {
    steps: [result],
  } = await flow.createFlowResult();

  const audits = result!.lhr.audits;
  const lcpAudit = audits["largest-contentful-paint"];
  const tbtAudit = audits["total-blocking-time"];
  // eslint-disable-next-line no-console -- 開発用: Lighthouse の LCP/TBT numericValue（ms）
  console.log("[dev:ホーム] largest-contentful-paint / total-blocking-time", {
    lcpMs: lcpAudit?.numericValue,
    lcpDisplay: lcpAudit?.displayValue,
    tbtMs: tbtAudit?.numericValue,
    tbtDisplay: tbtAudit?.displayValue,
  });

  const { breakdown, scoreX100 } = calculateHackathonScore(audits, {
    isUserflow: false,
  });

  return {
    audits: result!.lhr.audits,
    breakdown,
    scoreX100,
  };
}
