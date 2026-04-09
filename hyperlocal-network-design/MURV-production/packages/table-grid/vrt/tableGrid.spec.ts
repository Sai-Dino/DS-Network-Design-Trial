import { test, expect } from "@playwright/test";
import { loadStory } from "vrt/utils";

const STORY_ID = "components-tablegrid--default";

test("Storybook Load", async ({ page }) => {
  await loadStory(page, STORY_ID);
  await expect(page).toHaveTitle(/TableGrid/);
});

test("load table data", async ({ page }) => {
  const frameLocator = await loadStory(page, STORY_ID);
  const renderedUI = frameLocator.getByTestId("table-grid-default");

  // Wait for the table to be attached to DOM
  await renderedUI.waitFor({ state: "attached", timeout: 10000 });

  // Give the table time to fully render
  await page.waitForTimeout(1000);

  await expect(renderedUI).toHaveScreenshot({ timeout: 10000 });
});
