import { test, expect } from "@playwright/test";
import { loadStory } from "vrt/utils";

const CONFIRMATION_MODAL_STORY_ID = "components-modal-confirmationmodal--docs";

test("ConfirmationModal Storybook Load", async ({ page }) => {
  await loadStory(page, CONFIRMATION_MODAL_STORY_ID);
  await expect(page).toHaveTitle(/ConfirmationModal/);
});

/**
 * Functional test cases, to test behaviour & functionality.
 * Ideally these tests would have been written in jest in accordance with our testing conventions.
 * But unfortunaltely, jsdom which is internally used by jest doesn't have a proper implementation of the HTMLDialogElement.
 * Hence we're performing the functional testing here. Since the functionality is same for any of the Modal types, we're using ConfirmationModal to do the testing.
 *
 * Links related to the issues wit jsdom & jest:
 * https://github.com/jestjs/jest/issues/13010
 * https://github.com/jsdom/jsdom/issues/3294
 */

test("ConfirmationModal is hidden initially", async ({ page }) => {
  const storybook = await loadStory(page, CONFIRMATION_MODAL_STORY_ID);
  const dialogElement = storybook.getByTestId("default-story-test-id").first();
  await expect(dialogElement.first()).toHaveCSS("display", "none");
  await expect(dialogElement.first()).not.toBeVisible();
});

test("ConfirmationModal shows when the trigger is clicked", async ({ page }) => {
  const storybook = await loadStory(page, CONFIRMATION_MODAL_STORY_ID);
  const showModalButton = storybook.getByTestId("default-story-test-id-show-modal-button").first();
  const dialogElement = storybook.getByTestId("default-story-test-id").first();
  const closeIconButton = storybook
    .getByTestId("default-story-test-id-header-close-icon-button")
    .first();
  await expect(dialogElement).toHaveCSS("display", "none");
  await expect(dialogElement).not.toBeVisible();
  await showModalButton.click();
  await expect(dialogElement).not.toHaveCSS("display", "none");
  await expect(dialogElement).toBeVisible();
  await expect(closeIconButton).toBeFocused();
});

test("ConfirmationModal closes when the close icon button is clicked", async ({ page }) => {
  const storybook = await loadStory(page, CONFIRMATION_MODAL_STORY_ID);
  const showModalButton = storybook.getByTestId("default-story-test-id-show-modal-button").first();
  const dialogElement = storybook.getByTestId("default-story-test-id").first();
  const closeIconButton = storybook
    .getByTestId("default-story-test-id-header-close-icon-button")
    .first();
  await expect(dialogElement).toHaveCSS("display", "none");
  await expect(dialogElement).not.toBeVisible();
  await showModalButton.click();
  await expect(dialogElement).not.toHaveCSS("display", "none");
  await expect(dialogElement).toBeVisible();
  await expect(closeIconButton).toBeFocused();
  await closeIconButton.click();
  await expect(dialogElement).toHaveCSS("display", "none");
  await expect(dialogElement).not.toBeVisible();
});

test("ConfirmationModal closes when the escape button is pressed", async ({ page }) => {
  const storybook = await loadStory(page, CONFIRMATION_MODAL_STORY_ID);
  const showModalButton = storybook.getByTestId("default-story-test-id-show-modal-button").first();
  const dialogElement = storybook.getByTestId("default-story-test-id").first();
  const closeIconButton = storybook
    .getByTestId("default-story-test-id-header-close-icon-button")
    .first();
  await expect(dialogElement).toHaveCSS("display", "none");
  await expect(dialogElement).not.toBeVisible();
  await showModalButton.click();
  await expect(dialogElement).not.toHaveCSS("display", "none");
  await expect(dialogElement).toBeVisible();
  await expect(closeIconButton).toBeFocused();
  await closeIconButton.dispatchEvent("keydown", { key: "Escape" });
  await expect(dialogElement).toHaveCSS("display", "none");
  await expect(dialogElement).not.toBeVisible();
});
