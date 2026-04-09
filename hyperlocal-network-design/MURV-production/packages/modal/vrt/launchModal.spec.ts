import { test, expect } from "@playwright/test";
import { loadStory } from "vrt/utils";

const LAUNCH_MODAL_STORY_ID = "components-modal-launchmodal--docs";

test("LaunchModal Storybook Load", async ({ page }) => {
  await loadStory(page, LAUNCH_MODAL_STORY_ID);
  await expect(page).toHaveTitle(/LaunchModal/);
});

/**
 * Snapshot tests for LaunchModal
 */

test("LaunchModal with simple image content renders as expected", async ({ page }) => {
  const storybook = await loadStory(page, LAUNCH_MODAL_STORY_ID);
  const showModalButton = storybook
    .getByTestId("simple-image-content-story-test-id-show-modal-button")
    .first();
  const dialogElement = storybook.getByTestId("simple-image-content-story-test-id").first();
  await showModalButton.click();
  await expect(dialogElement).toHaveScreenshot();
});

/**
 * Commenting the below test as it is causing intermittent failures in the flow VRT pipeline.
 */
// test("LaunchModal with simple video content renders as expected", async ({ page }) => {
//   const storybook = await loadStory(page, LAUNCH_MODAL_STORY_ID);
//   const showModalButton = storybook
//     .getByTestId("simple-video-content-story-test-id-show-modal-button")
//     .first();
//   const dialogElement = storybook.getByTestId("simple-video-content-story-test-id").first();
//   await showModalButton.click();
//   await expect(dialogElement).toHaveScreenshot();
// });

// test("LaunchModal with multimedia carousel content renders as expected", async ({ page }) => {
//   const storybook = await loadStory(page, LAUNCH_MODAL_STORY_ID);
//   const showModalButton = storybook
//     .getByTestId("carousel-content-story-test-id-show-modal-button")
//     .first();
//   const dialogElement = storybook.getByTestId("carousel-content-story-test-id").first();
//   await showModalButton.click();
//   await expect(dialogElement).toHaveScreenshot();
// });

test("LaunchModal with textlist content renders as expected", async ({ page }) => {
  const storybook = await loadStory(page, LAUNCH_MODAL_STORY_ID);
  const showModalButton = storybook
    .getByTestId("simple-textlist-content-story-test-id-show-modal-button")
    .first();
  const dialogElement = storybook.getByTestId("simple-textlist-content-story-test-id").first();
  await showModalButton.click();
  await expect(dialogElement).toHaveScreenshot();
});
