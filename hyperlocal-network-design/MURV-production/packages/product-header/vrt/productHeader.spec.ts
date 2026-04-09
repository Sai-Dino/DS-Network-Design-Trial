import { test, expect } from "@playwright/test";
import { loadStory } from "vrt/utils";

test("ProductHeader Storybook Load", async ({ page }) => {
  await loadStory(page, "components-product-header--docs");
  await expect(page).toHaveTitle(/Product Header/);
});

// Flow job not updating snapshots. Commenting the test cases for now.

// test("ProductHeader with search", async ({ page }) => {
//   const renderedUI = (
//     await loadStory(page, "components-product-header--product-header-with-search")
//   ).getByTestId("pillsbar-storybook-ui-container");
//   await expect(renderedUI).toHaveScreenshot({ timeout: 10000 });
// });

// test("ProductHeader without search", async ({ page }) => {
//   const renderedUI = (
//     await loadStory(page, "components-product-header--product-header-without-search")
//   ).getByTestId("pillsbar-storybook-ui-container");
//   await expect(renderedUI).toHaveScreenshot({ timeout: 10000 });
// });

// test("ProductHeader real example", async ({ page }) => {
//   const renderedUI = (
//     await loadStory(page, "components-product-header--product-header-used-in-flipkart-brands")
//   ).getByTestId("pillsbar-storybook-ui-container");
//   await expect(renderedUI).toHaveScreenshot({ timeout: 10000 });
// });
