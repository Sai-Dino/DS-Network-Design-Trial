import { test, expect } from "@playwright/test";
import { loadStory } from "vrt/utils";

const DEFAULT_UPLOAD = "components-upload--docs";
const DEFAULT_UPLOAD_SUCCESS = "components-upload--upload-success";
const AUTO_UPLOAD_SUCCESS = "components-upload--auto-upload-success";
const DEFAULT_UPLOAD_FAILED = "components-upload--upload-failed";

const getUploadElement = async (...args: Parameters<typeof loadStory>) =>
  (await loadStory(...args)).getByTestId("upload-storybook-ui-container");

test("Story Load", async ({ page }) => {
  await loadStory(page, DEFAULT_UPLOAD);
  await expect(page).toHaveTitle(/Upload/);
});

test("Default Upload with Success", async ({ page }) => {
  const renderedUI = await getUploadElement(page, DEFAULT_UPLOAD_SUCCESS);
  await expect(renderedUI).toHaveScreenshot({ timeout: 10000 });
});

test("Auto Upload with Success", async ({ page }) => {
  const renderedUI = await getUploadElement(page, AUTO_UPLOAD_SUCCESS);
  await expect(renderedUI).toHaveScreenshot({ timeout: 10000 });
});

test("Default Upload with failed", async ({ page }) => {
  const renderedUI = await getUploadElement(page, DEFAULT_UPLOAD_FAILED);
  await expect(renderedUI).toHaveScreenshot({ timeout: 10000 });
});
