import { test, expect } from "@playwright/test";
import { loadStory } from "vrt/utils";
// import { IVisibilityToggleHelperProps } from "../src";

const STORY_ID = "components-visibilitytogglehelper--docs";

test("Storybook Load", async ({ page }) => {
  await loadStory(page, STORY_ID);
  await expect(page).toHaveTitle(/VisibilityToggleHelper/);
});

test("Default tooltip position", async ({ page }) => {
  const frameLocator = await loadStory(page, STORY_ID);
  const targetLocator = await frameLocator.getByTestId("trigger-default").first();
  const screenshotFrame = frameLocator
    .locator("#story--components-visibilitytogglehelper--default--primary")
    .first();

  await targetLocator.hover();
  await expect(screenshotFrame).toHaveScreenshot(`hover.png`);

  await frameLocator.locator("label").filter({ hasText: "click" }).click();
  await targetLocator.click();
  await expect(screenshotFrame).toHaveScreenshot(`click.png`);
});

// test("Visibility Toggle", async ({ page }) => {
// const frameLocator = await loadStory(page, STORY_ID);
// const targetLocator = await frameLocator.getByTestId("trigger-default").first();
// const screenshotFrame = frameLocator
//   .locator("#story--components-visibilitytogglehelper--default--primary")
//   .first();

// const testForPosition = async (position: IVisibilityToggleHelperProps["position"]) => {
//   await frameLocator.getByText(position!).click();
//   await frameLocator.locator("label").filter({ hasText: "hover" }).click();
//   await targetLocator.hover();
//   await expect(screenshotFrame).toHaveScreenshot(`${position}-hover.png`);

//   await frameLocator.locator("label").filter({ hasText: "click" }).click();
//   await targetLocator.click();
//   await expect(screenshotFrame).toHaveScreenshot(`${position}-click.png`);
// };

// await testForPosition("right-center");
// await testForPosition("right-top");
// await testForPosition("right-bottom");
// await testForPosition("left-center");
// await testForPosition("left-top");
// await testForPosition("left-bottom");
// await testForPosition("top-center");
// await testForPosition("top-right");
// await testForPosition("top-left");
// await testForPosition("bottom-center");
// await testForPosition("bottom-right");
// await testForPosition("bottom-left");
// });

test("Close on click outside", async ({ page }) => {
  const frameLocator = await loadStory(page, STORY_ID);
  const targetLocator = await frameLocator.getByTestId("trigger-default").first();
  const screenshotFrame = frameLocator
    .locator("#story--components-visibilitytogglehelper--default--primary")
    .first();

  await frameLocator.getByRole("switch", { name: "closeOnClickOutside" }).check();
  await frameLocator.locator("label").filter({ hasText: "click" }).click();
  await targetLocator.click();
  await expect(screenshotFrame).toHaveScreenshot(`close-on-click-outside-target-click.png`);

  // Click outside
  await screenshotFrame?.click();
  await expect(screenshotFrame).toHaveScreenshot(`close-on-click-outside-outer-click.png`);
});

test("Interactive child", async ({ page }) => {
  const frameLocator = await loadStory(page, STORY_ID);
  const targetLocator = await frameLocator.getByTestId("trigger-default").first();
  const screenshotFrame = frameLocator
    .locator("#story--components-visibilitytogglehelper--default--primary")
    .first();

  await frameLocator.getByRole("switch", { name: "isChildInteractive" }).check();
  await frameLocator.getByPlaceholder("Edit number...").click();

  await targetLocator.hover();
  await expect(screenshotFrame).toHaveScreenshot(`child-interactive-hover-view.png`);

  // hover  outside
  await page
    .frameLocator('iframe[title="storybook-preview-iframe"]')
    .getByRole("heading", { name: "VisibilityToggleHelper" })
    .hover();

  await expect(screenshotFrame).toHaveScreenshot(`child-interactive-hover-view.png`);

  await new Promise((r) => {
    setTimeout(r, 300);
  });
  await expect(screenshotFrame).toHaveScreenshot(`child-interactive-hover-hidden.png`);
});

test("Imperative close Click", async ({ page }) => {
  const frameLocator = await loadStory(page, STORY_ID);
  const screenshotFrame = frameLocator
    .locator("#story--components-visibilitytogglehelper--imperative-close-handle-click")
    .first();
  screenshotFrame.waitFor();

  await expect(screenshotFrame).toHaveScreenshot("imperative-close-click-closed.png.png");
  const targetLocator = await frameLocator.getByTestId("trigger-imperative-close-click");
  await targetLocator.click();
  await expect(screenshotFrame).toHaveScreenshot(`imperative-close-click-opened.png`);

  const closeBtnLocator = await frameLocator.getByTestId("imperative-close-click-close-btn");
  await closeBtnLocator.click();
  // Screenshot before popover open and after popover close should match
  await expect(screenshotFrame).toHaveScreenshot("imperative-close-click-closed.png.png");
});
