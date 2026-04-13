import { test, expect } from "@playwright/test";
import { loadStory } from "vrt/utils";

const DEFAULT_DRAWER_STORY_ID = "components-drawer--default-drawer";
const WITH_MANDATORY_ELEMENTS_STORY_ID = "components-drawer--drawer-with-mandate-controls";

test("Drawer Storybook Load", async ({ page }) => {
  await loadStory(page, "components-drawer--docs");
  await expect(page).toHaveTitle(/Drawer/);
});

test("Drawer with all the elements", async ({ page }) => {
  const dataTestId = "default-drawer-story-test-id";
  const storybook = await loadStory(page, DEFAULT_DRAWER_STORY_ID);
  const showDrawerButton = storybook.getByTestId(`${dataTestId}-show-modal-button`).first();
  const drawerElement = storybook.getByTestId(dataTestId).first();
  await showDrawerButton.click();
  await expect(drawerElement).toHaveScreenshot({ timeout: 10000 });
});

test("Drawer with mandatory elements", async ({ page }) => {
  const dataTestId = "drawer-without-bottom-actions-test-id";
  const storybook = await loadStory(page, WITH_MANDATORY_ELEMENTS_STORY_ID);
  const showDrawerButton = storybook.getByTestId(`${dataTestId}-show-modal-button`).first();
  const drawerElement = storybook.getByTestId(dataTestId).first();
  await showDrawerButton.click();
  await expect(drawerElement).toHaveScreenshot({ timeout: 10000 });
});
