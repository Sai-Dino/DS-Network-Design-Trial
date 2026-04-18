import fs from "fs/promises";
import path from "path";
import { chromium } from "playwright-core";

const APP_URL = "http://127.0.0.1:5050";
const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const ARTIFACT_DIR = "/Users/thota/Downloads/DS-Network-Design-Trial-main/ui-test-harness/artifacts/solver-workbench";
const POLL_MS = 2000;
const RUN_TIMEOUT_MS = 15 * 60 * 1000;

const SCENARIOS = [
  {
    name: "exploratory-anchor-live",
    mode: "exploratory",
    standardMinOrders: null,
    standardRadius: 3.0,
    superMinOrders: 300,
    superRadius: 5.5,
    miniMinOrders: 1212,
    miniServiceRadius: 1.0,
    preferFixedSuperUpgrades: true,
    expectFeasible: true,
  },
  {
    name: "constrained-exact-200",
    mode: "constrained",
    standardMinOrders: null,
    standardRadius: 3.0,
    superMinOrders: 300,
    superRadius: 5.5,
    miniMinOrders: 1212,
    miniServiceRadius: 1.0,
    preferFixedSuperUpgrades: true,
    exactTotal: 200,
    expectFeasible: true,
  },
  {
    name: "constrained-band-150-200",
    mode: "constrained",
    standardMinOrders: null,
    standardRadius: 3.0,
    superMinOrders: 300,
    superRadius: 5.5,
    miniMinOrders: 1212,
    miniServiceRadius: 1.0,
    preferFixedSuperUpgrades: true,
    bandMin: 150,
    bandMax: 200,
    expectFeasible: true,
  },
  {
    name: "constrained-cost-cap-35",
    mode: "constrained",
    standardMinOrders: null,
    standardRadius: 3.0,
    superMinOrders: 300,
    superRadius: 5.5,
    miniMinOrders: 1212,
    miniServiceRadius: 1.0,
    preferFixedSuperUpgrades: true,
    costCap: 35.0,
    expectFeasible: false,
  },
  {
    name: "exploratory-super-min-450",
    mode: "exploratory",
    standardMinOrders: null,
    standardRadius: 3.0,
    superMinOrders: 450,
    superRadius: 5.5,
    miniMinOrders: 1212,
    miniServiceRadius: 1.25,
    preferFixedSuperUpgrades: true,
    expectFeasible: true,
  },
  {
    name: "exploratory-standard-min-400",
    mode: "exploratory",
    standardMinOrders: 400,
    standardRadius: 3.0,
    superMinOrders: 300,
    superRadius: 5.5,
    miniMinOrders: 1212,
    miniServiceRadius: 1.0,
    preferFixedSuperUpgrades: true,
    expectFeasible: true,
  },
  {
    name: "exploratory-mini-min-1400",
    mode: "exploratory",
    standardMinOrders: null,
    standardRadius: 3.5,
    superMinOrders: 300,
    superRadius: 5.5,
    miniMinOrders: 1400,
    miniServiceRadius: 1.0,
    preferFixedSuperUpgrades: true,
    expectFeasible: true,
  },
  {
    name: "exploratory-prefer-fixed-off",
    mode: "exploratory",
    standardMinOrders: null,
    standardRadius: 3.0,
    superMinOrders: 300,
    superRadius: 5.5,
    miniMinOrders: 1212,
    miniServiceRadius: 1.0,
    preferFixedSuperUpgrades: false,
    expectFeasible: true,
  },
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson(url, init) {
  const resp = await fetch(url, init);
  const data = await resp.json();
  if (!resp.ok) {
    throw new Error(data?.error || `HTTP ${resp.status} for ${url}`);
  }
  return data;
}

async function waitFor(predicate, timeoutMs, label) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const value = await predicate();
    if (value) return value;
    await sleep(POLL_MS);
  }
  throw new Error(`Timed out waiting for ${label}`);
}

async function ensureReady(page) {
  await page.goto(`${APP_URL}/`, { waitUntil: "networkidle" });
  await page.waitForSelector("#solverWorkbenchSection", { state: "visible" });
  await waitFor(async () => {
    const status = await fetchJson(`${APP_URL}/api/solver-workbench-status`);
    return status?.result_available;
  }, 60_000, "solver workbench result availability");
}

async function configureScenario(page, scenario) {
  await page.evaluate((payload) => {
    const setField = (selector, value) => {
      const el = document.querySelector(selector);
      if (!el) throw new Error(`Missing field ${selector}`);
      el.value = value === undefined || value === null ? "" : String(value);
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    };
    const radio = document.querySelector(`input[name="solverMode"][value="${payload.mode}"]`);
    if (!radio) throw new Error(`Missing solver mode ${payload.mode}`);
    radio.checked = true;
    radio.dispatchEvent(new Event("change", { bubbles: true }));
    setField("#solverStdMinOrders", payload.standardMinOrders);
    setField("#solverStdRadius", payload.standardRadius);
    setField("#solverSuperMinOrders", payload.superMinOrders);
    setField("#solverSuperRadius", payload.superRadius);
    setField("#solverMiniMinOrders", payload.miniMinOrders);
    setField("#solverMiniRadius", payload.miniServiceRadius);
    setField("#solverExactTotalStores", payload.exactTotal ?? "");
    setField("#solverBandMinStores", payload.bandMin ?? "");
    setField("#solverBandMaxStores", payload.bandMax ?? "");
    setField("#solverCostCap", payload.costCap ?? "");
    const requireSuper = document.querySelector("#solverRequireSuperCoreCoverage");
    if (requireSuper) {
      requireSuper.checked = !!payload.requireSuperCoreCoverage;
      requireSuper.dispatchEvent(new Event("change", { bubbles: true }));
    }
    const preferFixed = document.querySelector("#solverPreferFixedSuperUpgrades");
    if (preferFixed) {
      preferFixed.checked = payload.preferFixedSuperUpgrades !== false;
      preferFixed.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }, scenario);
  await sleep(300);
}

async function runScenario(page, scenario) {
  await configureScenario(page, scenario);
  const params = await page.evaluate(() => collectSolverWorkbenchParams());
  await fetchJson(`${APP_URL}/api/solver-workbench-run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  await waitFor(async () => {
    const status = await fetchJson(`${APP_URL}/api/solver-workbench-status`);
    return status?.running;
  }, 30_000, `start ${scenario.name}`);

  const status = await waitFor(async () => {
    const current = await fetchJson(`${APP_URL}/api/solver-workbench-status`);
    return current?.running ? false : current;
  }, RUN_TIMEOUT_MS, `finish ${scenario.name}`);

  const result = await fetchJson(`${APP_URL}/api/solver-workbench-result`);
  if (!!result?.feasible !== !!scenario.expectFeasible) {
    throw new Error(`Unexpected feasibility for ${scenario.name}: ${result?.feasible}`);
  }

  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector("#solverWorkbenchSection", { state: "visible" });

  const uiState = await page.evaluate(() => ({
    statusChip: document.querySelector("#solverStatusChip")?.textContent?.trim() || "",
    targetBanner: document.querySelector("#targetSearchBanner")?.textContent?.trim() || "",
    decisionNote: document.querySelector("#decisionDashboardNote")?.textContent?.trim() || "",
    pipelineNote: document.querySelector("#pipelineNote")?.textContent?.trim() || "",
    rescuePanel: document.querySelector("#rescuePanelContent")?.textContent?.trim() || "",
    lowDensityPanel: document.querySelector("#lowDensityPanelContent")?.textContent?.trim() || "",
    fixedRows: document.querySelectorAll("#fixedStandardTableBody tr").length,
    newRows: document.querySelectorAll("#newStandardTableBody tr").length,
    scenarioRows: document.querySelectorAll("#scenarioCompareContent tbody tr").length,
    mapHud: document.querySelector("#mapHudMeta")?.textContent?.trim() || "",
  }));

  const scenarioDir = path.join(ARTIFACT_DIR, scenario.name);
  await fs.mkdir(scenarioDir, { recursive: true });
  await page.screenshot({ path: path.join(scenarioDir, "full.png"), fullPage: true });
  await fs.writeFile(
    path.join(scenarioDir, "summary.json"),
    JSON.stringify({ scenario, status, result, uiState }, null, 2)
  );
  return { scenario, status, result, uiState };
}

async function saveScenario(page, name) {
  await page.locator("#scenarioName").fill(name);
  await page.getByRole("button", { name: "Save Current Scenario" }).click();
}

async function captureMobileView(browser) {
  const page = await browser.newPage({ viewport: { width: 430, height: 932 } });
  await ensureReady(page);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "mobile-sanity.png"), fullPage: true });
  const state = await page.evaluate(() => ({
    header: document.querySelector(".header")?.textContent?.trim() || "",
    workbenchVisible: !!document.querySelector("#solverWorkbenchSection"),
    mapVisible: !!document.querySelector("#map"),
  }));
  await fs.writeFile(path.join(ARTIFACT_DIR, "mobile-sanity.json"), JSON.stringify(state, null, 2));
  await page.close();
}

async function main() {
  await fs.mkdir(ARTIFACT_DIR, { recursive: true });
  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });

  try {
    await ensureReady(page);
    const results = [];

    for (const scenario of SCENARIOS) {
      const summary = await runScenario(page, scenario);
      results.push(summary);
      if (scenario.name === "exploratory-anchor-live") {
        await saveScenario(page, "solver-anchor-live");
      }
      if (scenario.name === "exploratory-standard-min-400") {
        await saveScenario(page, "solver-std-min-400");
      }
    }

    await captureMobileView(browser);
    await fs.writeFile(path.join(ARTIFACT_DIR, "summary.json"), JSON.stringify(results, null, 2));
    console.log(`Wrote solver workbench validation artifacts to ${ARTIFACT_DIR}`);
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
