import { test, expect } from "@playwright/test";
import { loadStory } from "vrt/utils";

const NAVIGATION_RAIL_STORY_ID = "components-navigationrail--docs";

test("Navigation Rail Storybook Load", async ({ page }) => {
  await loadStory(page, NAVIGATION_RAIL_STORY_ID);
  await expect(page).toHaveTitle(/NavigationRail/);
});

test("Default Navigation Rail renders as expected", async ({ page }) => {
  const renderedUI = (
    await loadStory(page, "components-navigationrail--navigation-rail-item-default")
  ).getByTestId("navigation-rail-test-id-default-selection");
  await expect(renderedUI).toHaveScreenshot({ timeout: 20000 });
});

test("Navigation Rail with badge on icon renders as expected", async ({ page }) => {
  const renderedUI = (await loadStory(page, NAVIGATION_RAIL_STORY_ID)).getByTestId(
    "navigation-rail-test-id-icon-badge-selection",
  );
  await expect(renderedUI).toHaveScreenshot({ timeout: 20000 });
});

test("Navigation Rail with badge on label renders as expected", async ({ page }) => {
  const renderedUI = (await loadStory(page, NAVIGATION_RAIL_STORY_ID)).getByTestId(
    "navigation-rail-test-id-label-badge-selection",
  );
  await expect(renderedUI).toHaveScreenshot({ timeout: 20000 });
});

test("Navigation Rail with disabled items renders as expected", async ({ page }) => {
  const renderedUI = (await loadStory(page, NAVIGATION_RAIL_STORY_ID)).getByTestId(
    "navigation-rail-test-id-disable-item-selection",
  );
  await expect(renderedUI).toHaveScreenshot({ timeout: 20000 });
});

test("Navigation Rail with More items renders as expected", async ({ page }) => {
  const renderedUI = (await loadStory(page, NAVIGATION_RAIL_STORY_ID)).getByTestId(
    "navigation-rail-test-id-more-item-selection",
  );
  await expect(renderedUI).toHaveScreenshot({ timeout: 20000 });
});

test("Navigation Rail rendered horizontal as expected", async ({ page }) => {
  const renderedUI = (await loadStory(page, NAVIGATION_RAIL_STORY_ID)).getByTestId(
    "navigation-rail-test-id-horizontal",
  );
  await expect(renderedUI).toHaveScreenshot({ timeout: 20000 });
});
