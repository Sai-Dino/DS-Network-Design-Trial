import { test, expect } from '@playwright/test';
import { loadStory } from "vrt/utils";

const DEFAULT_CONTAINER_STORY_ID = "components-emptystatecontainer--default-empty-state-container";
const WITHOUT_BUTTONS_CONTAINER_STORY_ID = "components-emptystatecontainer--empty-container-without-buttons";
const ONLY_ICON_CONTAINER_STORY_ID = "components-emptystatecontainer--empty-state-container-only-icon";
const WITH_IMAGE_CONTAINER_STORY_ID = "components-emptystatecontainer--empty-state-container-with-image";

const getEmptyStateContainerStoryElement = async (...args: Parameters<typeof loadStory>) =>
  (await loadStory(...args,)).getByTestId("emptystatecontainer-storybook-ui-container");

test('Empty state container story load', async ({ page }) => {
  await loadStory(page, "components-emptystatecontainer--docs");
  await expect(page).toHaveTitle(/EmptyStateContainer/);
});

test('Default style container', async ({ page }) => {
  const renderedUI = await getEmptyStateContainerStoryElement(page, DEFAULT_CONTAINER_STORY_ID);
  await expect(renderedUI).toHaveScreenshot({ timeout: 10000 });
});
test('Empty Container without buttons', async ({ page }) => {
  const renderedUI = await getEmptyStateContainerStoryElement(page, WITHOUT_BUTTONS_CONTAINER_STORY_ID);
  await expect(renderedUI).toHaveScreenshot({ timeout: 10000 });
});
test('Empty Container only Icon', async ({ page }) => {
  const renderedUI = await getEmptyStateContainerStoryElement(page, ONLY_ICON_CONTAINER_STORY_ID);
  await expect(renderedUI).toHaveScreenshot({ timeout: 10000 });
});
test('Empty Container with Image', async ({ page }) => {
  const renderedUI = await getEmptyStateContainerStoryElement(page, WITH_IMAGE_CONTAINER_STORY_ID);
  await expect(renderedUI).toHaveScreenshot({ timeout: 10000 });
});
