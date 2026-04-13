/**
 * The visual regression tests are meant to test the visual aspects of the component.
 * Just as in unit tests, where one writes tests for all possible scenarios,
 * In VRT tests, one must simulate all possible UI states of the component and snapshot them.
 * Snapshotting must happen with different browers & OSes, so that different environments are covered.
 * MACs only allow snopshots on the MAC OS broswer simulations (all browsers) and not other OSes.
 * So, to generate snapshot for other OSes, devs must run the following flow job when they raise the PR.
 *
 * Flow Job: http://flow.fkinternal.com/app/project/MURV/pipeline/24789/build/view
 * For more details, visit: https://github.fkinternal.com/Flipkart/MURV/wiki/Visual-Regression-Testing-(VRT)
 */

import { test, expect } from "@playwright/test";
import { loadStory } from "vrt/utils";
import { createTabItemTestId } from "../src/utils";

/**
 * The constants declared below are all related to the storybook created in the src folder.
 * In case of major changes to the storybook, please re-evaluate these constants.
 */
const DEFAULT_TABS_STORY_ID = "components-tabs--default-style-tabs";
const DYNAMIC_TABS_STORY_ID = "components-tabs--dynamic-style-tabs";
const TABS_META = [
  {
    title: "Tab 1",
    value: "tab_one",
  },
  {
    title: "Tab 2",
    value: "tab_two",
  },
  {
    title: "Tab 3",
    value: "tab_three",
  },
  {
    title: "Tab 4",
    value: "tab_four",
  },
  {
    title: "Tab 5",
    value: "tab_five",
  },
];
const DEFAULT_TABS_STORY_DATA_TESTID = "example_one";
const DYNAMIC_TABS_STORY_DATA_TESTID = "example_two";

const getTabsStoryElement = async (...args: Parameters<typeof loadStory>) =>
  (await loadStory(...args)).getByTestId("tabs-storybook-ui-container");

test("Storybook Load", async ({ page }) => {
  await loadStory(page, "components-tabs--docs");
  await expect(page).toHaveTitle(/Tabs/);
});

test("Default style tabs", async ({ page }) => {
  const renderedUI = await getTabsStoryElement(page, DEFAULT_TABS_STORY_ID);
  await expect(renderedUI).toHaveScreenshot();
});

test("Default style tabs with focus on selected tab", async ({ page }) => {
  const renderedUI = await getTabsStoryElement(page, DEFAULT_TABS_STORY_ID);
  const tabElement = renderedUI.getByTestId(
    createTabItemTestId(DEFAULT_TABS_STORY_DATA_TESTID, TABS_META[1].value),
  );
  await tabElement.focus();
  await expect(renderedUI).toHaveScreenshot();
});

test("Default style tabs with focus on non selected tab", async ({ page }) => {
  const renderedUI = await getTabsStoryElement(page, DEFAULT_TABS_STORY_ID);
  const tabElement = renderedUI.getByTestId(
    createTabItemTestId(DEFAULT_TABS_STORY_DATA_TESTID, TABS_META[0].value),
  );
  await tabElement.focus();
  await expect(renderedUI).toHaveScreenshot();
});

test("Default style tabs keyboard selection", async ({ page }) => {
  const renderedUI = await getTabsStoryElement(page, DEFAULT_TABS_STORY_ID);
  const tabElement = renderedUI.getByTestId(
    createTabItemTestId(DEFAULT_TABS_STORY_DATA_TESTID, TABS_META[2].value),
  );
  await tabElement.dispatchEvent("keydown", { key: "Enter" });
  await expect(renderedUI).toHaveScreenshot();
});

test("Dynamic style tabs", async ({ page }) => {
  const renderedUI = await getTabsStoryElement(page, DYNAMIC_TABS_STORY_ID);
  await expect(renderedUI).toHaveScreenshot();
});

test("Dynamic style tabs with focus on selected tab", async ({ page }) => {
  const renderedUI = await getTabsStoryElement(page, DYNAMIC_TABS_STORY_ID);
  const tabElement = renderedUI.getByTestId(
    createTabItemTestId(DYNAMIC_TABS_STORY_DATA_TESTID, TABS_META[0].value),
  );
  await tabElement.focus();
  await expect(renderedUI).toHaveScreenshot();
});

test("Dynamic style tabs with focus on non selected tab", async ({ page }) => {
  const renderedUI = await getTabsStoryElement(page, DYNAMIC_TABS_STORY_ID);
  const tabElement = renderedUI.getByTestId(
    createTabItemTestId(DYNAMIC_TABS_STORY_DATA_TESTID, TABS_META[2].value),
  );
  await tabElement.focus();
  await expect(renderedUI).toHaveScreenshot();
});

test("Dynamic style tabs with hover on tab with suffix icon", async ({ page }) => {
  const renderedUI = await getTabsStoryElement(page, DYNAMIC_TABS_STORY_ID);
  const tabElement = renderedUI.getByTestId(
    createTabItemTestId(DYNAMIC_TABS_STORY_DATA_TESTID, TABS_META[1].value),
  );
  await tabElement.hover();
  await expect(renderedUI).toHaveScreenshot();
});

test("Dynamic style tabs with focus on tab with suffix icon", async ({ page }) => {
  const renderedUI = await getTabsStoryElement(page, DYNAMIC_TABS_STORY_ID);
  const tabElement = renderedUI.getByTestId(
    createTabItemTestId(DYNAMIC_TABS_STORY_DATA_TESTID, TABS_META[1].value),
  );
  await tabElement.focus();
  await expect(renderedUI).toHaveScreenshot();
});

test("Dynamic style tabs with selection on tab with suffix icon", async ({ page }) => {
  const renderedUI = await getTabsStoryElement(page, DYNAMIC_TABS_STORY_ID);
  const tabElement = renderedUI.getByTestId(
    createTabItemTestId(DYNAMIC_TABS_STORY_DATA_TESTID, TABS_META[3].value),
  );
  await tabElement.click();
  await expect(renderedUI).toHaveScreenshot();
});

test("Dynamic style tabs keyboard selection", async ({ page }) => {
  const renderedUI = await getTabsStoryElement(page, DYNAMIC_TABS_STORY_ID);
  const tabElement = renderedUI.getByTestId(
    createTabItemTestId(DYNAMIC_TABS_STORY_DATA_TESTID, TABS_META[2].value),
  );
  await tabElement.dispatchEvent("keydown", { key: "Enter" });
  await expect(renderedUI).toHaveScreenshot();
});
