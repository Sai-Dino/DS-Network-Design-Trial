import { test, expect } from "@playwright/test";
import { loadStory } from "vrt/utils";

const DEFAULT_RATING = "components-rating--default";
const DEFAULT_WITH_NO_INITIAL_SELECT = "components-rating--default-with-no-initial-select";
const DISABLED_RATING = "components-rating--read-only";

const getRatingElement = async (...args: Parameters<typeof loadStory>) =>
  (await loadStory(...args)).getByTestId("rating-storybook-ui-container");

test("Story Load", async ({ page }) => {
  await loadStory(page, "components-rating--docs");
  await expect(page).toHaveTitle(/Rating/);
});

test("Default Rating", async ({ page }) => {
  const renderedUI = await getRatingElement(page, DEFAULT_RATING);
  await expect(renderedUI).toHaveScreenshot({ timeout: 10000 });
});
test("Rating with no initial count", async ({ page }) => {
  const renderedUI = await getRatingElement(page, DEFAULT_WITH_NO_INITIAL_SELECT);
  await expect(renderedUI).toHaveScreenshot({ timeout: 10000 });
});

test("Disabled Rating", async ({ page }) => {
  const renderedUI = await getRatingElement(page, DISABLED_RATING);
  await expect(renderedUI).toHaveScreenshot({ timeout: 10000 });
});
