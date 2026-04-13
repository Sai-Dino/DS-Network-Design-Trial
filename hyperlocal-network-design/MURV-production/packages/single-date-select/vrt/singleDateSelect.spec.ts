import { test, expect } from "@playwright/test";
import { loadStory } from "vrt/utils";

const DAY_RANGE_SELECT = "components-singledateselect--single-date-select-story";
const DAY_RANGE_SELECT_TIME = "components-singledateselect--single-date-select-with-time";
test("Story Load", async ({ page }) => {
  await loadStory(page, "components-singledateselect--docs");
  await expect(page).toHaveTitle(/SingleDateSelect/);
});

test("Single Date Select snapshot", async ({ page }) => {
  const storybook = await loadStory(page, DAY_RANGE_SELECT);
  const trigger = storybook.getByTestId("trigger-single-date-select").first();
  await trigger.click();
  const dayRangePicker = storybook.getByTestId("single-date-select");
  // await dayRangePicker.getByRole("gridcell", { name: "2", exact: true }).first().click();
  await expect(dayRangePicker).toHaveScreenshot();
});

test("Single Date Select with time snapshot", async ({ page }) => {
  const storybook = await loadStory(page, DAY_RANGE_SELECT_TIME);
  const trigger = storybook.getByTestId("trigger-single-date-select-with-time").first();
  await trigger.click();
  const dayRangePicker = storybook.getByTestId("single-date-select-with-time");
  await expect(dayRangePicker).toHaveScreenshot();
});
