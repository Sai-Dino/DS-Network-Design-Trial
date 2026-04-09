import { test, expect } from "@playwright/test";
import { loadStory } from "vrt/utils";

test("Story Load", async ({ page }) => {
  await loadStory(page, "components-searchsuggestions--docs");
  await expect(page).toHaveTitle(/SearchSuggestions/);
});

test("Story Load and snapshot matching", async ({ page }) => {
  const renderedUI = (await loadStory(page, "components-searchsuggestions--default")).getByTestId(
    "example-test-id",
  );
  await expect(renderedUI).toHaveScreenshot();
});