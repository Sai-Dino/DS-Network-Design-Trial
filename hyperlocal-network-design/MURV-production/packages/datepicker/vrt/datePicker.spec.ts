import { test, expect } from "@playwright/test";
import { loadStory } from "vrt/utils";

test("Story Load", async ({ page }) => {
  await loadStory(page, "components-datepicker--docs");
  await expect(page).toHaveTitle(/DatePicker/);
});

test("should open the date range picker when clicked", async ({ page }) => {
  const dateRangePickerUI = (await loadStory(page, "components-datepicker--docs")).getByTestId(
    "date-range-picker",
  );
  await dateRangePickerUI.scrollIntoViewIfNeeded();
  await dateRangePickerUI.focus();
  await expect(dateRangePickerUI).toHaveScreenshot();
});

test("Month Range ", async ({ page }) => {
  const dateRangePickerUI = (await loadStory(page, "components-datepicker--docs")).getByTestId(
    "month-range-picker",
  );
  await dateRangePickerUI.scrollIntoViewIfNeeded();
  await dateRangePickerUI.focus();
  await expect(dateRangePickerUI).toHaveScreenshot();
});

test("Year Range ", async ({ page }) => {
  const dateRangePickerUI = (await loadStory(page, "components-datepicker--docs")).getByTestId(
    "year-range-picker",
  );
  await dateRangePickerUI.scrollIntoViewIfNeeded();
  await dateRangePickerUI.focus();
  await expect(dateRangePickerUI).toHaveScreenshot();
});

test("Range Options", async ({ page }) => {
  const dateRangePickerUI = (await loadStory(page, "components-datepicker--docs")).getByTestId(
    "date-range-picker-with-range-options",
  );
  await dateRangePickerUI.scrollIntoViewIfNeeded();
  await dateRangePickerUI.focus();
  await expect(dateRangePickerUI).toHaveScreenshot();
});
