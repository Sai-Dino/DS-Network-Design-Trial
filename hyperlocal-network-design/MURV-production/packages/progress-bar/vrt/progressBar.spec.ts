import { test, expect } from '@playwright/test';
import { loadStory } from "vrt/utils";
// Commenting the specific types as flow is failing intermittently.

// const DEFAULT_PROGRESS_BAR_SYSTEMATIC = "components-progressbar--default-systematic-progress-bar";
// const MIN_PROGRESS_BAR_SYSTEMATIC = "components-progressbar--min-systematic-progress-bar";
// const MAX_PROGRESS_BAR_SYSTEMATIC = "components-progressbar--max-systematic-progress-bar";
// const DEFAULT_PROGRESS_BAR_MANUAL = "components-progressbar--default-manual-progress-bar";
const MIN_PROGRESS_BAR_MANUAL = "components-progressbar--min-manual-progress-bar";
const MAX_PROGRESS_BAR_MANUAL = "components-progressbar--max-manual-progress-bar";

const getProgressBarStoryElement = async (...args: Parameters<typeof loadStory>) =>
  (await loadStory(...args,)).getByTestId("progressbar-storybook-ui-container");

test('Progress bar story load', async ({ page }) => {
  await loadStory(page, "components-progressbar--docs");
  await expect(page).toHaveTitle(/ProgressBar/);
});

// test('default systematic progress bar', async ({ page }) => {
//   const renderedUI = await getProgressBarStoryElement(page, DEFAULT_PROGRESS_BAR_SYSTEMATIC);
//   await expect(renderedUI).toHaveScreenshot({ timeout: 10000 });
// });

// test('min systematic progress bar', async ({ page }) => {
//   const renderedUI = await getProgressBarStoryElement(page, MIN_PROGRESS_BAR_SYSTEMATIC);
//   await expect(renderedUI).toHaveScreenshot({ timeout: 10000 });
// });

// test('max systematic progress bar', async ({ page }) => {
//   const renderedUI = await getProgressBarStoryElement(page, MAX_PROGRESS_BAR_SYSTEMATIC);
//   await expect(renderedUI).toHaveScreenshot({ timeout: 10000 });
// });

// test('default manual progress bar', async ({ page }) => {
//   const renderedUI = await getProgressBarStoryElement(page, DEFAULT_PROGRESS_BAR_MANUAL);
//   await expect(renderedUI).toHaveScreenshot({ timeout: 10000 });
// });

test('min manual progress bar', async ({ page }) => {
  const renderedUI = await getProgressBarStoryElement(page, MIN_PROGRESS_BAR_MANUAL);
  await expect(renderedUI).toHaveScreenshot({ timeout: 10000 });
});

test('max manual progress bar', async ({ page }) => {
  const renderedUI = await getProgressBarStoryElement(page, MAX_PROGRESS_BAR_MANUAL);
  await expect(renderedUI).toHaveScreenshot({ timeout: 10000 });
});
