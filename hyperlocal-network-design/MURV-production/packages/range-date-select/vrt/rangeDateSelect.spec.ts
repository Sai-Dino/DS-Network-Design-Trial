import { test, expect } from "@playwright/test";
import { loadStory } from "vrt/utils";

const DAY_RANGE_SELECT = "components-rangedateselect--day-range-date-select";
const DAY_TIME_RANGE_SELECT = "components-rangedateselect--day-range-date-time-select";
const MONTH_RANGE_SELECT = "components-rangedateselect--month-range-date-select";
const YEAR_RANGE_SELECT = "components-rangedateselect--year-range-date-select";
test("Story Load", async ({ page }) => {
  await loadStory(page, "components-rangedateselect--docs");
  await expect(page).toHaveTitle(/RangeDateSelect/);
});

test("Day Range Select", async ({ page }) => {
  const storybook = await loadStory(page, DAY_RANGE_SELECT);
  const trigger = storybook.getByTestId("trigger-day-range-select").first();
  await trigger.click();
  const dayRangePicker = storybook.getByTestId("day-range-select");
  // await dayRangePicker.getByRole("gridcell", { name: "2", exact: true }).first().click();
  // await dayRangePicker.getByRole("gridcell", { name: "19" }).first().click();
  await expect(dayRangePicker).toHaveScreenshot();
});

test("Day and Time Range Select", async ({ page }) => {
  const storybook = await loadStory(page, DAY_TIME_RANGE_SELECT);
  const trigger = storybook.getByTestId("trigger-day-range-time-select").first();
  await trigger.click();
  const dayTimeRangePicker = storybook.getByTestId("day-range-time-select");
  await expect(dayTimeRangePicker).toHaveScreenshot();
});

test("Month Range Select", async ({ page }) => {
  const storybook = await loadStory(page, MONTH_RANGE_SELECT);
  const trigger = storybook.getByTestId("trigger-month-range-select").first();
  await trigger.click();
  const monthRangePicker = storybook.getByTestId("month-range-select");
  // await monthRangePicker.getByRole("gridcell", { name: "Jan" }).first().click();
  // await monthRangePicker.getByRole("gridcell", { name: "Mar" }).first().click();
  await expect(monthRangePicker).toHaveScreenshot();
});
test("Year Range Select", async ({ page }) => {
  const storybook = await loadStory(page, YEAR_RANGE_SELECT);
  const trigger = storybook.getByTestId("trigger-year-range-select").first();
  await trigger.click();
  const yearRangePicker = storybook.getByTestId("year-range-select");
  // await yearRangePicker.getByRole("gridcell", { name: "2024" }).click();
  // await yearRangePicker.getByRole("gridcell", { name: "2027" }).click();
  await expect(yearRangePicker).toHaveScreenshot();
});
