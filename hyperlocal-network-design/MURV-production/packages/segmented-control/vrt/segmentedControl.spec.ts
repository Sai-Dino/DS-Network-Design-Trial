import { test, expect } from "@playwright/test";
import { loadStory } from "vrt/utils";

test("Story Load", async ({ page }) => {
  await loadStory(page, "components-segmentedcontrol--docs");
  await expect(page).toHaveTitle(/SegmentedControl/);
});

test("Story Load and snapshot matching", async ({ page }) => {
  const renderedUI = (await loadStory(page, "components-segmentedcontrol--default")).getByTestId(
    "example-test-id",
  );
  await expect(renderedUI).toHaveScreenshot();
});

test("Story Load and snapshot matching with default selection", async ({ page }) => {
  const renderedUI = (await loadStory(page, "components-segmentedcontrol--docs")).getByTestId(
    "example-test-id-default-selection",
  );
  await expect(renderedUI).toHaveScreenshot();
});

test("Story Load and snapshot matching with disabled selection", async ({ page }) => {
  const renderedUI = (await loadStory(page, "components-segmentedcontrol--docs")).getByTestId(
    "example-test-id-disabled-option",
  );
  await expect(renderedUI).toHaveScreenshot();
});

test("Story Load and snapshot matching with more options button", async ({ page }) => {
  const renderedUI = (await loadStory(page, "components-segmentedcontrol--docs")).getByTestId(
    "example-test-id-select-option",
  );
  await expect(renderedUI).toHaveScreenshot();
});
