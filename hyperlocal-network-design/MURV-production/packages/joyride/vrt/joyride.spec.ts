import { test } from "@playwright/test";
import { loadStory } from "vrt/utils";

const joyrideStoryId = "components-joyride-joyridetooltip--docs";

test("Joyride Storybook Load", async ({ page }) => {
  await loadStory(page, joyrideStoryId);
  await page
    .frameLocator('iframe[title="storybook-preview-iframe"]')
    .getByRole("heading", { name: "JoyrideTooltip" })
    .click();
});
