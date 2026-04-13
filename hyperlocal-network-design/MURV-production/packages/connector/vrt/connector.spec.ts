import { test, expect } from "@playwright/test";
import { loadStory } from "vrt/utils";

const CONNECTOR_WITHOUT_DEFAULT_PROPS =
  "components-connector--connector-story-without-default-props";
const CONNECTOR_WITH_PROPS = "components-connector--connector-story-with-props";
const CONNECTOR_WITH_ORIENTATION = "components-connector--connector-story-with-orientation";
const CONNECTOR_WITH_MULTIPLE_CHILD = "components-connector--connector-story-with-multiple-child";

const getConnectorElement = async (...args: Parameters<typeof loadStory>) =>
  (await loadStory(...args)).getByTestId("connector-storybook-ui-container");

test("Story Load", async ({ page }) => {
  await loadStory(page, "components-connector--docs");
  await expect(page).toHaveTitle(/Connector/);
});

test("Default Connector", async ({ page }) => {
  const renderedUI = await getConnectorElement(page, CONNECTOR_WITHOUT_DEFAULT_PROPS);
  await expect(renderedUI).toHaveScreenshot({ timeout: 10000 });
});
test("Connector With Props", async ({ page }) => {
  const renderedUI = await getConnectorElement(page, CONNECTOR_WITH_PROPS);
  await expect(renderedUI).toHaveScreenshot({ timeout: 10000 });
});

test("Connector With Orientation", async ({ page }) => {
  const renderedUI = await getConnectorElement(page, CONNECTOR_WITH_ORIENTATION);
  await expect(renderedUI).toHaveScreenshot({ timeout: 10000 });
});

test("Connector With Multiple Child", async ({ page }) => {
  const renderedUI = await getConnectorElement(page, CONNECTOR_WITH_MULTIPLE_CHILD);
  await expect(renderedUI).toHaveScreenshot({ timeout: 10000 });
});
