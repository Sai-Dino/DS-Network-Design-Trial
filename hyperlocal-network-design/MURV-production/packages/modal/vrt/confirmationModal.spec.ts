import { test, expect } from "@playwright/test";
import { loadStory } from "vrt/utils";

const CONFIRMATION_MODAL_STORY_ID = "components-modal-confirmationmodal--docs";

test("ConfirmationModal Storybook Load", async ({ page }) => {
  await loadStory(page, CONFIRMATION_MODAL_STORY_ID);
  await expect(page).toHaveTitle(/ConfirmationModal/);
});

/**
 * Snapshot tests for ConfirmationModal
 */

test("Default ConfirmationModal renders as expected", async ({ page }) => {
  const storybook = await loadStory(page, CONFIRMATION_MODAL_STORY_ID);
  const showModalButton = storybook.getByTestId("default-story-test-id-show-modal-button").first();
  const dialogElement = storybook.getByTestId("default-story-test-id").first();
  await showModalButton.click();
  await expect(dialogElement).toHaveScreenshot();
});

test("ConfirmationModal with out extras renders as expected", async ({ page }) => {
  const storybook = await loadStory(page, CONFIRMATION_MODAL_STORY_ID);
  const showModalButton = storybook
    .getByTestId("modal-without-extras-story-test-id-show-modal-button")
    .first();
  const dialogElement = storybook.getByTestId("modal-without-extras-story-test-id").first();
  await showModalButton.click();
  await expect(dialogElement).toHaveScreenshot();
});

test("Warning ConfirmationModal renders as expected", async ({ page }) => {
  const storybook = await loadStory(page, CONFIRMATION_MODAL_STORY_ID);
  const showModalButton = storybook
    .getByTestId("warning-modal-story-test-id-show-modal-button")
    .first();
  const dialogElement = storybook.getByTestId("warning-modal-story-test-id").first();
  await showModalButton.click();
  await expect(dialogElement).toHaveScreenshot();
});

test("Success ConfirmationModal renders as expected", async ({ page }) => {
  const storybook = await loadStory(page, CONFIRMATION_MODAL_STORY_ID);
  const showModalButton = storybook
    .getByTestId("success-modal-story-test-id-show-modal-button")
    .first();
  const dialogElement = storybook.getByTestId("success-modal-story-test-id").first();
  await showModalButton.click();
  await expect(dialogElement).toHaveScreenshot();
});

test("Caution ConfirmationModal renders as expected", async ({ page }) => {
  const storybook = await loadStory(page, CONFIRMATION_MODAL_STORY_ID);
  const showModalButton = storybook
    .getByTestId("caution-modal-story-test-id-show-modal-button")
    .first();
  const dialogElement = storybook.getByTestId("caution-modal-story-test-id").first();
  await showModalButton.click();
  await expect(dialogElement).toHaveScreenshot();
});
