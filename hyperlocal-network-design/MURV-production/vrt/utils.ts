import * as Playwright from "@playwright/test";

/** Load Storybook story for Playwright testing */
export async function loadStory(page: Playwright.Page, storyID: string) {
  // wait for page to finish rendering before starting test
  await page.goto(`/?path=/docs/${storyID}`);
  return page.frameLocator('iframe[title="storybook-preview-iframe"]');
}
