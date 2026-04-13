import { test, expect } from "@playwright/test";
import { loadStory } from "vrt/utils";

const DEFAULT_ACCORDION = "components-accordion--default-accordion-story";
const DEFAULT_ACCORDION_WITH_SECONDARY_TITLE = "components-accordion--with-secondary-title";
const DEFAULT_ACCORDION_WITH_TERTIARY_TITLE = "components-accordion--with-tertiary-title";
const DEFAULT_ACCORDION_WITH_LONG_TEXT = "components-accordion--with-long-text";
const DEFAULT_ACCORDION_DISABLED = "components-accordion--disabled-accordion";
const DEFAULT_ACCORDION_WITH_BADGE = "components-accordion--with-badge";
const DEFAULT_ACCORDION_WITH_ICON = "components-accordion--with-icon";
const DEFAULT_ACCORDION_WITH_EXCLUSIVE_GROUP = "components-accordion--with-exclusive-group";
const DEFAULT_ACCORDION_WITHOUT_EXCLUSIVE_GROUP = "components-accordion--without-exclusive-group";

const getAccordionElement = async (dataTestId: string, ...args: Parameters<typeof loadStory>) =>
  (await loadStory(...args)).getByTestId(dataTestId);

test("Story Load", async ({ page }) => {
  await loadStory(page, "components-accordion--docs");
  await expect(page).toHaveTitle(/Accordion/);
});

test("Default Accordion", async ({ page }) => {
  const renderedUI = await getAccordionElement(
    "accordion-component-default-test",
    page,
    DEFAULT_ACCORDION,
  );
  await expect(renderedUI).toHaveScreenshot({ timeout: 10000 });
});

test("Accordion with secondary title", async ({ page }) => {
  const renderedUI = await getAccordionElement(
    "accordion-component-secondary-title",
    page,
    DEFAULT_ACCORDION_WITH_SECONDARY_TITLE,
  );
  await expect(renderedUI).toHaveScreenshot({ timeout: 10000 });
});

test("Accordion with tertiary title", async ({ page }) => {
  const renderedUI = await getAccordionElement(
    "accordion-component-tertiary-title",
    page,
    DEFAULT_ACCORDION_WITH_TERTIARY_TITLE,
  );
  await expect(renderedUI).toHaveScreenshot({ timeout: 10000 });
});

test("Accordion with long text", async ({ page }) => {
  const renderedUI = await getAccordionElement(
    "accordion-component-long-text",
    page,
    DEFAULT_ACCORDION_WITH_LONG_TEXT,
  );
  await expect(renderedUI).toHaveScreenshot({ timeout: 10000 });
});

test("Disabled Accordion", async ({ page }) => {
  const renderedUI = await getAccordionElement(
    "accordion-component-disabled-accordion",
    page,
    DEFAULT_ACCORDION_DISABLED,
  );
  await expect(renderedUI).toHaveScreenshot({ timeout: 10000 });
});

test("Accordion With Badge", async ({ page }) => {
  const renderedUI = await getAccordionElement(
    "accordion-component-with-badge",
    page,
    DEFAULT_ACCORDION_WITH_BADGE,
  );
  await expect(renderedUI).toHaveScreenshot({ timeout: 10000 });
});

test("Accordion with Icon", async ({ page }) => {
  const renderedUI = await getAccordionElement(
    "accordion-component-with-icon",
    page,
    DEFAULT_ACCORDION_WITH_ICON,
  );
  await expect(renderedUI).toHaveScreenshot({ timeout: 10000 });
});

test("Accordion with exclusive group", async ({ page }) => {
  const renderedUI = await getAccordionElement(
    "accordion-component-exclu-group",
    page,
    DEFAULT_ACCORDION_WITH_EXCLUSIVE_GROUP,
  );
  await expect(renderedUI).toHaveScreenshot({ timeout: 10000 });
});

test("Accordion without exclusive group", async ({ page }) => {
  const renderedUI = await getAccordionElement(
    "accordion-component-without-exclu-group",
    page,
    DEFAULT_ACCORDION_WITHOUT_EXCLUSIVE_GROUP,
  );
  await expect(renderedUI).toHaveScreenshot({ timeout: 10000 });
});
