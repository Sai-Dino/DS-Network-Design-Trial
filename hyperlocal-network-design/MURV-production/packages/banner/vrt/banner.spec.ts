import { test, expect, Page } from "@playwright/test";
import { loadStory } from "vrt/utils";

const SUCCESS_BANNER = "components-banner--success-banner";
const WARNING_BANNER_WITHOUT_TERTIARY = "components-banner--warning-banner-without-tertiary";
const ERROR_BANNER_WITHOUT_SECONDARY_TEXT =
  "components-banner--error-banner-without-secondary-text";
const INFO_BANNER_WITHOUT_PRIMARY_TEXT = "components-banner--info-banner-without-primary-text";
const INFO_BANNER_WITH_CUSTOM_TAG = "components-banner--info-banner-with-custom-tag";
const BANNER_WITHOUT_BUTTON_GROUP_AND_CLOSE_BUTTON =
  "components-banner--without-button-group-and-close-button";
const BANNER_WITHOUT_STATUS_TAG = "components-banner--without-status-tag";

async function loadSingleStory(page: Page, storyID: string) {
  await page.goto(`/?path=/story/${storyID}`);
  return page.frameLocator('iframe[title="storybook-preview-iframe"]');
}

const getConnectorElement = async (...args: Parameters<typeof loadStory>) =>
  (await loadStory(...args)).getByTestId("banner-storybook-ui-container");

const getConnectorElementSingleStory = async (...args: Parameters<typeof loadSingleStory>) =>
  (await loadSingleStory(...args)).getByTestId("banner-storybook-ui-container");

test("Story Load", async ({ page }) => {
  await loadStory(page, "components-banner--docs");
  await expect(page).toHaveTitle(/Banner/);
});

test("Default success banner", async ({ page }) => {
  const renderedUI = await getConnectorElement(page, SUCCESS_BANNER);
  await expect(renderedUI).toHaveScreenshot({ timeout: 10000 });
});
test("Warning Banner without tertiary text", async ({ page }) => {
  const renderedUI = await getConnectorElement(page, WARNING_BANNER_WITHOUT_TERTIARY);
  await expect(renderedUI).toHaveScreenshot();
});

test("error banner without secondary text", async ({ page }) => {
  const renderedUI = await getConnectorElement(page, ERROR_BANNER_WITHOUT_SECONDARY_TEXT);
  await expect(renderedUI).toHaveScreenshot({ timeout: 10000 });
});

test("info banner without primary text", async ({ page }) => {
  const renderedUI = await getConnectorElement(page, INFO_BANNER_WITHOUT_PRIMARY_TEXT);
  await expect(renderedUI).toHaveScreenshot({ timeout: 10000 });
});

test("Info banner with Custom tag", async ({ page }) => {
  const renderedUI = await getConnectorElement(page, INFO_BANNER_WITH_CUSTOM_TAG);
  await expect(renderedUI).toHaveScreenshot({ timeout: 10000 });
});

test("Banner without button group and close button", async ({ page }) => {
  const renderedUI = await getConnectorElement(page, BANNER_WITHOUT_BUTTON_GROUP_AND_CLOSE_BUTTON);
  await expect(renderedUI).toHaveScreenshot({ timeout: 10000 });
});

test("banner without status tag", async ({ page }) => {
  const renderedUI = await getConnectorElement(page, BANNER_WITHOUT_STATUS_TAG);
  await expect(renderedUI).toHaveScreenshot({ timeout: 10000 });
});

test("Banner in Different devices", async ({ page }) => {
  let renderedUI = await getConnectorElementSingleStory(
    page,
    `${SUCCESS_BANNER}&globals=viewport:small`,
  );
  await expect(renderedUI).toHaveScreenshot({ timeout: 10000 });

  renderedUI = await getConnectorElementSingleStory(
    page,
    `${SUCCESS_BANNER}&globals=viewport:medium`,
  );
  await expect(renderedUI).toHaveScreenshot({ timeout: 10000 });

  renderedUI = await getConnectorElementSingleStory(
    page,
    `${SUCCESS_BANNER}&globals=viewport:mobile2`,
  );
  await expect(renderedUI).toHaveScreenshot({ timeout: 10000 });
});
