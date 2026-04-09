/**
 * The visual regression tests are meant to test the visual aspects of the component.
 * Just as in unit tests, where one writes tests for all possible scenarios,
 * In VRT tests, one must simulate all possible UI states of the component and snapshot them.
 * Snapshotting must happen with different browers & OSes, so that different environments are covered.
 * MACs only allow snopshots on the MAC OS broswer simulations (all browsers) and not other OSes.
 * So, to generate snapshot for other OSes, devs must run the following flow job when they raise the PR.
 *
 * Flow Job: http://flow.fkinternal.com/app/project/MURV/pipeline/24789/build/view
 * For more details, visit: https://github.fkinternal.com/Flipkart/MURV/wiki/Visual-Regression-Testing-(VRT)
 */

import { test, expect } from "@playwright/test";
import { loadStory } from "vrt/utils";
/**
 * The constants declared below are all related to the storybook created in the src folder.
 * In case of major changes to the storybook, please re-evaluate these constants.
 */

// const RANGE_SLIDER_STORY_ID = "components-slider--range-slider";
// const SINGLE_SLIDER_STORY_ID = "components-slider--simple-slider";

// const getSliderStoryElement = async (...args: Parameters<typeof loadStory>) =>
//   (await loadStory(...args)).getByTestId("slider-storybook-ui-container");

test("Storybook Load", async ({ page }) => {
  await loadStory(page, "components-slider--docs");
  await expect(page).toHaveTitle(/Slider/);
});

// test("Default Slider", async ({ page }) => {
//   const renderedUI = await getSliderStoryElement(page, SINGLE_SLIDER_STORY_ID);
//   await renderedUI.count();
//   await expect(renderedUI).toHaveScreenshot();
// });

// test("Move Slider", async ({ page }) => {
//   const renderedUI = await getSliderStoryElement(page, RANGE_SLIDER_STORY_ID);
//   await page.keyboard.press("Tab");
//   await page.keyboard.press("Tab");
//   await page.keyboard.press("Tab");
//   await page.keyboard.press("Tab");
//   await page.keyboard.press("ArrowRight");
//   await renderedUI.getByRole("slider").first().press("ArrowRight");
//   await renderedUI.getByRole("slider").first().press("ArrowRight");
//   await expect(renderedUI).toHaveScreenshot();
// });

// test("Move Slider With No Range", async ({ page }) => {
//   const renderedUI = await getSliderStoryElement(page, RANGE_SLIDER_STORY_ID);
//   await page.keyboard.press("Tab");
//   await page.keyboard.press("Tab");
//   await page.keyboard.press("Tab");
//   await page.keyboard.press("Tab");
//   await page.keyboard.press("ArrowRight");
//   await renderedUI.getByRole("slider").first().press("ArrowRight");
//   await renderedUI.getByRole("slider").first().press("ArrowRight");
//   await expect(renderedUI).toHaveScreenshot();
// });
