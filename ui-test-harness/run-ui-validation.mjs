import fs from "fs/promises";
import path from "path";
import { chromium } from "playwright-core";

const APP_URL = "http://127.0.0.1:5050";
const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const ARTIFACT_DIR = "/Users/thota/Downloads/DS-Network-Design-Trial-main/ui-test-harness/artifacts";
const POLL_MS = 2000;
const CORE_TIMEOUT_MS = 12 * 60 * 1000;
const FINAL_TIMEOUT_MS = 15 * 60 * 1000;
const DOM_SETTLE_MS = 5000;

const SCENARIOS = [
  {
    name: "world-103-baseline",
    world: "benchmark_103",
    radius: 3.0,
    trigger: "run",
    waitForFinal: false,
  },
  {
    name: "world-144-baseline",
    world: "uploaded_current",
    radius: 3.0,
    trigger: "run",
    waitForFinal: false,
  },
  {
    name: "world-0-baseline",
    world: "clean_slate",
    radius: 3.0,
    trigger: "run",
    waitForFinal: false,
  },
  {
    name: "world-103-target-count",
    world: "benchmark_103",
    radius: 3.0,
    trigger: "target",
    targetMode: "target_total_standard_stores",
    targetValue: 205,
    waitForFinal: false,
  },
  {
    name: "world-103-target-cost",
    world: "benchmark_103",
    radius: 3.0,
    trigger: "target",
    targetMode: "target_avg_cost",
    targetValue: 42.5,
    waitForFinal: false,
  },
];

const HANDOFF_TEST = {
  name: "handoff-103-to-144",
  first: SCENARIOS[0],
  second: SCENARIOS[1],
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson(url) {
  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(`HTTP ${resp.status} for ${url}`);
  }
  return resp.json();
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

async function ensureAppReady() {
  await waitFor(async () => {
    const status = await fetchJson(`${APP_URL}/api/status`);
    return status?.data_loaded && status?.meeting_prewarm_ready;
  }, 60_000, "app readiness");
}

async function setRange(page, selector, value, valueLabelSelector) {
  await page.locator(selector).evaluate((el, val) => {
    el.value = String(val);
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }, value);
  if (valueLabelSelector) {
    await page.waitForFunction(
      ([sel, expected]) => {
        const el = document.querySelector(sel);
        return !!el && el.textContent.trim() === String(expected);
      },
      [valueLabelSelector, Number(value).toFixed(1)]
    );
  }
}

async function setFixedWorld(page, world) {
  await page.evaluate((value) => {
    const radio = document.querySelector(`input[name="fixedStoreWorld"][value="${value}"]`);
    const select = document.getElementById("fixedStoreMode");
    if (!radio || !select) throw new Error(`Missing fixed-store control for ${value}`);
    radio.checked = true;
    select.value = value;
    radio.dispatchEvent(new Event("change", { bubbles: true }));
    select.dispatchEvent(new Event("change", { bubbles: true }));
  }, world);
  await page.waitForFunction(
    (expected) => {
      const select = document.getElementById("fixedStoreMode");
      return !!select && select.value === expected;
    },
    world
  );
  await sleep(1200);
}

async function setTargetMode(page, mode, value) {
  await page.evaluate((targetMode) => {
    const radio = document.querySelector(`input[name="targetMode"][value="${targetMode}"]`);
    if (!radio) throw new Error(`Missing target mode ${targetMode}`);
    radio.checked = true;
    radio.dispatchEvent(new Event("change", { bubbles: true }));
  }, mode);
  if (mode === "target_total_standard_stores") {
    await page.locator("#targetMaxHubs").fill(String(value));
  } else {
    await page.locator("#targetAvgCost").fill(String(value));
  }
  await sleep(300);
}

async function smokeControlPass(page) {
  const checks = [];
  await setFixedWorld(page, "benchmark_103");
  checks.push({ control: "fixed_world", state: "103" });
  await setFixedWorld(page, "uploaded_current");
  checks.push({ control: "fixed_world", state: "144" });
  await setFixedWorld(page, "clean_slate");
  checks.push({ control: "fixed_world", state: "0" });
  await setFixedWorld(page, "benchmark_103");
  checks.push({ control: "fixed_world", state: "103-reset" });

  await setRange(page, "#stdRad", 3.2, "#stdRadVal");
  checks.push({ control: "std_radius", state: "3.2" });
  await setRange(page, "#stdRad", 2.8, "#stdRadVal");
  checks.push({ control: "std_radius", state: "2.8" });
  await setRange(page, "#stdRad", 3.0, "#stdRadVal");
  checks.push({ control: "std_radius", state: "3.0-reset" });

  await setTargetMode(page, "target_total_standard_stores", 205);
  const countBtnLabel = await page.locator("#runTargetBtn").textContent();
  checks.push({ control: "target_mode", state: "count", label: countBtnLabel?.trim() });
  await setTargetMode(page, "target_avg_cost", 42.5);
  const costBtnLabel = await page.locator("#runTargetBtn").textContent();
  checks.push({ control: "target_mode", state: "cost", label: costBtnLabel?.trim() });
  await setTargetMode(page, "target_total_standard_stores", 205);
  checks.push({ control: "target_mode", state: "count-reset" });

  return checks;
}

async function startScenarioRun(page, scenario) {
  await setFixedWorld(page, scenario.world);
  await setRange(page, "#stdRad", scenario.radius, "#stdRadVal");
  if (scenario.trigger === "target") {
    await setTargetMode(page, scenario.targetMode, scenario.targetValue);
    await page.locator("#runTargetBtn").click();
  } else {
    await page.locator("#runBtn").click();
  }

  await waitFor(async () => {
    const status = await fetchJson(`${APP_URL}/api/status`);
    return status?.optimization_running;
  }, 15_000, `run start for ${scenario.name}`);
}

function matchesScenario(result, scenario) {
  const params = result?.params || {};
  const worldMatch = params.fixed_store_mode === scenario.world;
  const radiusMatch = Number(params.standard_ds_radius || 0).toFixed(1) === Number(scenario.radius).toFixed(1);
  const targetModeMatch = scenario.trigger !== "target" || params.target_mode === scenario.targetMode;
  return worldMatch && radiusMatch && targetModeMatch;
}

async function waitForCoreResult(scenario) {
  return waitFor(async () => {
    const status = await fetchJson(`${APP_URL}/api/status`);
    if (!status?.optimization_core_ready) return false;
    const result = await fetchJson(`${APP_URL}/api/result`);
    if (!result?.success || !matchesScenario(result, scenario)) return false;
    return { status, result };
  }, CORE_TIMEOUT_MS, `core result for ${scenario.name}`);
}

async function waitForFinalResult(scenario) {
  return waitFor(async () => {
    const status = await fetchJson(`${APP_URL}/api/status`);
    if (status?.optimization_running) return false;
    const result = await fetchJson(`${APP_URL}/api/result`);
    if (!result?.success || !matchesScenario(result, scenario)) return false;
    return { status, result };
  }, FINAL_TIMEOUT_MS, `final result for ${scenario.name}`);
}

async function collectUiState(page) {
  return page.evaluate(() => {
    const text = (sel) => document.querySelector(sel)?.textContent?.trim() || "";
    const rows = (sel) => Array.from(document.querySelectorAll(`${sel} tr`)).filter((tr) => !tr.querySelector(".table-empty")).length;
    const mapSvgNodes = Array.from(document.querySelectorAll(".leaflet-overlay-pane svg path, .leaflet-overlay-pane svg circle"));
    const markerIcons = Array.from(document.querySelectorAll(".leaflet-marker-pane .leaflet-marker-icon"));
    const palette = {};
    for (const node of mapSvgNodes) {
      const fill = node.getAttribute("fill") || "";
      const stroke = node.getAttribute("stroke") || "";
      const key = `${fill}|${stroke}`;
      palette[key] = (palette[key] || 0) + 1;
    }
    return {
      banner: {
        text: text("#targetSearchBanner"),
        visible: !!document.querySelector("#targetSearchBanner") && getComputedStyle(document.querySelector("#targetSearchBanner")).display !== "none",
      },
      dashboard: {
        fixed: text("#dashFixedStandard"),
        new: text("#dashNewStandard"),
        rescue: text("#dashRescueStandard"),
        exception: text("#dashExceptionStandard"),
        relaxed: text("#dashRelaxedNewStandard"),
        note: text("#decisionDashboardNote"),
      },
      metrics: {
        propHard: text("#mPropHard"),
        propCost: text("#mPropCost"),
        propDist: text("#mPropDist"),
      },
      tables: {
        fixedRows: rows("#fixedStandardTableBody"),
        newRows: rows("#newStandardTableBody"),
        rescueRows: rows("#rescueStandardTableBody"),
        exceptionRows: rows("#exceptionStandardTableBody"),
      },
      map: {
        svgNodeCount: mapSvgNodes.length,
        markerIconCount: markerIcons.length,
        palette,
        legendText: text(".map-legend"),
      },
    };
  });
}

async function runScenario(page, scenario) {
  console.log(`SCENARIO_START ${scenario.name}`);
  const startedAt = Date.now();
  await startScenarioRun(page, scenario);
  const { result } = await waitForCoreResult(scenario);
  const coreDurationMs = Date.now() - startedAt;
  await sleep(DOM_SETTLE_MS);

  const uiState = await collectUiState(page);
  const decision = result.decision_grade_result || {};
  const comparison = {
    fixedMatch: Number(uiState.dashboard.fixed.replace(/,/g, "")) === Number(decision.fixed_standard_count || 0),
    newMatch: Number(uiState.dashboard.new.replace(/,/g, "")) === Number(decision.new_standard_count || 0),
    rescueMatch: Number(uiState.dashboard.rescue.replace(/,/g, "")) === Number(decision.rescue_standard_count || 0),
    exceptionMatch: Number(uiState.dashboard.exception.replace(/,/g, "")) === Number(decision.exception_hub_count || 0),
  };

  const scenarioDir = path.join(ARTIFACT_DIR, scenario.name);
  await fs.mkdir(scenarioDir, { recursive: true });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: path.join(scenarioDir, "full.png"), fullPage: true });
  await page.locator("#map").screenshot({ path: path.join(scenarioDir, "map.png") });
  await page.locator("#decisionDashboard").scrollIntoViewIfNeeded();
  await page.locator("#decisionDashboard").screenshot({ path: path.join(scenarioDir, "dashboard.png") });
  await page.locator("#hubTableSection").scrollIntoViewIfNeeded();
  await page.locator("#hubTableSection").screenshot({ path: path.join(scenarioDir, "tables.png") });

  let finalResult = null;
  let fullDurationMs = null;
  let finalUiState = null;
  if (scenario.waitForFinal) {
    ({ result: finalResult } = await waitForFinalResult(scenario));
    fullDurationMs = Date.now() - startedAt;
    await sleep(DOM_SETTLE_MS);
    finalUiState = await collectUiState(page);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: path.join(scenarioDir, "final-full.png"), fullPage: true });
    await page.locator("#map").screenshot({ path: path.join(scenarioDir, "final-map.png") });
  }

  const payload = {
    scenario,
    coreDurationMs,
    fullDurationMs,
    decision_grade_result: decision,
    final_decision_grade_result: finalResult?.decision_grade_result || {},
    params: result.params,
    final_params: finalResult?.params || null,
    pipeline: result.pipeline,
    final_pipeline: finalResult?.pipeline || null,
    uiState,
    finalUiState,
    comparison,
    timestamp: new Date().toISOString(),
  };
  await fs.writeFile(path.join(scenarioDir, "summary.json"), JSON.stringify(payload, null, 2));
  console.log(`SCENARIO_DONE ${scenario.name} coverage=${decision.proposed_hard_coverage_pct} cost=${decision.proposed_avg_cost}`);
  return payload;
}

async function runHandoffValidation(page) {
  console.log(`HANDOFF_START ${HANDOFF_TEST.name}`);
  const handoffDir = path.join(ARTIFACT_DIR, HANDOFF_TEST.name);
  await fs.mkdir(handoffDir, { recursive: true });

  const firstStartedAt = Date.now();
  await startScenarioRun(page, HANDOFF_TEST.first);
  const { result: firstResult } = await waitForCoreResult(HANDOFF_TEST.first);
  const firstCoreDurationMs = Date.now() - firstStartedAt;
  const firstRunId = firstResult.run_id;
  await sleep(DOM_SETTLE_MS);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: path.join(handoffDir, "first-core-full.png"), fullPage: true });
  await page.locator("#map").screenshot({ path: path.join(handoffDir, "first-core-map.png") });

  const secondStartedAt = Date.now();
  await startScenarioRun(page, HANDOFF_TEST.second);
  const { result: secondResult } = await waitForCoreResult(HANDOFF_TEST.second);
  const secondCoreDurationMs = Date.now() - secondStartedAt;
  const secondRunId = secondResult.run_id;
  const handoffAccepted = Boolean(firstRunId && secondRunId && firstRunId !== secondRunId);
  await sleep(DOM_SETTLE_MS);
  const secondUiState = await collectUiState(page);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: path.join(handoffDir, "second-core-full.png"), fullPage: true });
  await page.locator("#map").screenshot({ path: path.join(handoffDir, "second-core-map.png") });

  const payload = {
    name: HANDOFF_TEST.name,
    first: {
      scenario: HANDOFF_TEST.first,
      runId: firstRunId,
      coreDurationMs: firstCoreDurationMs,
      decision_grade_result: firstResult.decision_grade_result || {},
    },
    second: {
      scenario: HANDOFF_TEST.second,
      runId: secondRunId,
      coreDurationMs: secondCoreDurationMs,
      decision_grade_result: secondResult.decision_grade_result || {},
      uiState: secondUiState,
    },
    handoffAccepted,
    timestamp: new Date().toISOString(),
  };
  await fs.writeFile(path.join(handoffDir, "summary.json"), JSON.stringify(payload, null, 2));
  console.log(`HANDOFF_DONE ${HANDOFF_TEST.name} accepted=${handoffAccepted}`);
  return payload;
}

async function main() {
  await fs.mkdir(ARTIFACT_DIR, { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    executablePath: CHROME_PATH,
  });
  const page = await browser.newPage({ viewport: { width: 1600, height: 1200 } });
  page.setDefaultTimeout(90_000);

  await page.goto(APP_URL, { waitUntil: "networkidle" });
  await ensureAppReady();
  await page.waitForSelector("#runBtn");
  await page.waitForFunction(() => !document.getElementById("runBtn")?.disabled);
  const smokeChecks = await smokeControlPass(page);
  const handoff = await runHandoffValidation(page);

  const results = [];
  for (const scenario of SCENARIOS.slice(2)) {
    const summary = await runScenario(page, scenario);
    results.push(summary);
  }

  const report = {
    generated_at: new Date().toISOString(),
    app_url: APP_URL,
    smokeChecks,
    handoff,
    results,
  };
  await fs.writeFile(path.join(ARTIFACT_DIR, "report.json"), JSON.stringify(report, null, 2));
  await browser.close();
}

main().catch((err) => {
  console.error("UI_VALIDATION_FAILED", err);
  process.exit(1);
});
