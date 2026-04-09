import { test, expect } from "@playwright/test";
import { loadStory } from "vrt/utils";

const BOTTOMSHEET_STORY_ID = "components-bottomsheet--docs";

test("BottomSheet Storybook Load", async ({ page }) => {
  await loadStory(page, BOTTOMSHEET_STORY_ID);
  await expect(page).toHaveTitle(/BottomSheet/);
});

/**
 * Snapshot tests for BottomSheet
//  */

test("bottomsheet shows when the trigger is clicked", async ({ page }) => {
  const storybook = await loadStory(page, BOTTOMSHEET_STORY_ID);
  const showBottomSheet = storybook.getByTestId("bottomsheet-button").first();
  await showBottomSheet.click();
  const dialogElement = storybook.getByTestId("bottom-sheet-component").first();
  await expect(dialogElement).toHaveScreenshot();
});
