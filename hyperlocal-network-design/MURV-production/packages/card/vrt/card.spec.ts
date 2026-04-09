import { test, expect } from "@playwright/test";
import { loadStory } from "vrt/utils";

const STORY_ID = "components-card--docs";

test("Storybook Load", async ({ page }) => {
  await loadStory(page, STORY_ID);
  await expect(page).toHaveTitle(/Card/);
});

test("Default Metric card ", async ({ page }) => {
  const frameLocator = await loadStory(page, STORY_ID);
  const screenshotFrame = frameLocator
    .locator("#story--components-card--single-metric-card--primary")
    .first();

  await expect(screenshotFrame).toHaveScreenshot(`metricCard.png`);
});

test("Multiple Metric card ", async ({ page }) => {
  const frameLocator = await loadStory(page, STORY_ID);
  const screenshotFrame = frameLocator
    .locator("#story--components-card--multiple-metric-card")
    .first();

  await expect(screenshotFrame).toHaveScreenshot(`multipleMetricCard.png`);
});

test("Metric card w/o header", async ({ page }) => {
  const frameLocator = await loadStory(page, STORY_ID);
  const screenshotFrame = frameLocator
    .locator("#story--components-card--metric-card-without-header")
    .first();

  await expect(screenshotFrame).toHaveScreenshot(`metricCardWithoutHeader.png`);
});

test("Image with text card", async ({ page }) => {
  const frameLocator = await loadStory(page, STORY_ID);
  const screenshotFrame = frameLocator
    .locator("#story--components-card--image-with-text-card")
    .first();

  await expect(screenshotFrame).toHaveScreenshot(`imageWithTextCard.png`);
});

test("Icon with text card", async ({ page }) => {
  const frameLocator = await loadStory(page, STORY_ID);
  const screenshotFrame = frameLocator
    .locator("#story--components-card--icon-with-text-card")
    .first();

  await expect(screenshotFrame).toHaveScreenshot(`iconWithTextCard.png`);
});

test("Image with text list", async ({ page }) => {
  const frameLocator = await loadStory(page, STORY_ID);
  const screenshotFrame = frameLocator
    .locator("#story--components-card--image-with-text-list")
    .first();

  await expect(screenshotFrame).toHaveScreenshot(`imageWithTextListCard.png`);
});

test("Image with text list right aligned", async ({ page }) => {
  const frameLocator = await loadStory(page, STORY_ID);
  const screenshotFrame = frameLocator
    .locator("#story--components-card--image-with-text-list-right-aligned")
    .first();

  await expect(screenshotFrame).toHaveScreenshot(`imageWithTextListCardRA.png`);
});
test("Link with icon list", async ({ page }) => {
  const frameLocator = await loadStory(page, STORY_ID);
  const screenshotFrame = frameLocator
    .locator("#story--components-card--link-with-icon-list")
    .first();

  await expect(screenshotFrame).toHaveScreenshot(`linkWithIconList.png`);
});
test("Non interactable card", async ({ page }) => {
  const frameLocator = await loadStory(page, STORY_ID);
  const screenshotFrame = frameLocator.locator("#story--components-card--non-interactable").first();

  await expect(screenshotFrame).toHaveScreenshot(`nonInteractable.png`);
});
test("Disabled card", async ({ page }) => {
  const frameLocator = await loadStory(page, STORY_ID);
  const screenshotFrame = frameLocator.locator("#story--components-card--disabled").first();

  await expect(screenshotFrame).toHaveScreenshot(`disabledCard.png`);
});
test("Hover and click on card", async ({ page }) => {
  const frameLocator = await loadStory(page, STORY_ID);
  const screenshotFrame = frameLocator
    .locator("#story--components-card--single-metric-card--primary")
    .first();
  await screenshotFrame.hover();
  await expect(screenshotFrame).toHaveScreenshot(`hover.png`);
  await screenshotFrame.click();
  await expect(screenshotFrame).toHaveScreenshot(`pressed.png`);
});

test("Cutom CTA and Tooltip", async ({ page }) => {
  const frameLocator = await loadStory(page, STORY_ID);
  const screenshotFrame = frameLocator
    .locator("#story--components-card--single-metric-card-with-custom-cta-and-tooltip")
    .first();
  await expect(screenshotFrame).toHaveScreenshot(`SingleMetricCardWithCustomCTAAndTooltip.png`);
  await page
    .frameLocator('iframe[title="storybook-preview-iframe"]')
    .getByRole("img", { name: "Info" })
    .first()
    .hover();
  await expect(screenshotFrame).toHaveScreenshot(
    `SingleMetricCardWithCustomCTAAndTooltip-tooltip-hover.png`,
  );
});
