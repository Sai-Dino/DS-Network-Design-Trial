import { test, expect } from '@playwright/test';
import { loadStory } from "vrt/utils";

const DEFAULT_PILL_BAR = "components-pillsbar--default";
const PREFIX_ICON_PILL_BAR = "components-pillsbar--pill-bar-with-prefix-icon";
const ACTION_ICON_PILL_BAR = "components-pillsbar--pill-bar-with-action-icon"
const WRAPPED_PILL_BAR = "components-pillsbar--wrapper-pill-bar"


const getProgressBarStoryElement = async (...args: Parameters<typeof loadStory>) =>
    (await loadStory(...args,)).getByTestId("pillsbar-storybook-ui-container");

test('Pills bar story load', async ({ page }) => {
    await loadStory(page, "components-pillsbar--docs");
    await expect(page).toHaveTitle(/PillsBar/);
});

test('default pill bar', async ({ page }) => {
    const renderedUI = await getProgressBarStoryElement(page, DEFAULT_PILL_BAR);
    await expect(renderedUI).toHaveScreenshot({ timeout: 10000 });
});

test('pill bar with prefix icon', async ({ page }) => {
    const renderedUI = await getProgressBarStoryElement(page, PREFIX_ICON_PILL_BAR);
    await expect(renderedUI).toHaveScreenshot({ timeout: 10000 });
});

test('pill bar with Action icon', async ({ page }) => {
    const renderedUI = await getProgressBarStoryElement(page, ACTION_ICON_PILL_BAR);
    await expect(renderedUI).toHaveScreenshot({ timeout: 10000 });
});
test('pill bar wrapped', async ({ page }) => {
    const renderedUI = await getProgressBarStoryElement(page, WRAPPED_PILL_BAR);
    await expect(renderedUI).toHaveScreenshot({ timeout: 10000 });
});