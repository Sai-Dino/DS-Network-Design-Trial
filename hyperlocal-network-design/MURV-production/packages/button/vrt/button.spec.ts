import { test, expect } from '@playwright/test';
// import { loadStory } from '../../../vrt/utils';

test('Story Load', async ({ page }) => {
  await page.goto('http://localhost:6006/?path=/docs/components-button--docs');
  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Button/);
});

test('Primary Button', async ({ page }) => {
  await page.goto('http://localhost:6006/?path=/docs/components-button--docs');
  await page.frameLocator('iframe[title="storybook-preview-iframe"]').locator('#story--components-button--primary--primary-inner').getByRole('button', { name: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit' }).click();
});

// Commenting this as screenshot assertions only work with Playwright test runner.
// Refer: https://playwright.dev/docs/api/class-pageassertions#page-assertions-to-have-screenshot-2

// test('Primary Button', async ({ page }) => {
//   await loadStory(page, 'example-button--primary');
//   const buttonLocator = await page.frameLocator('iframe[title="storybook-preview-iframe"]').getByRole('button', { name: 'Button' });
//   await expect(buttonLocator).toHaveScreenshot();
// });
// test('Secondary Button', async ({page}) => {
//   await loadStory(page, 'example-button--secondary');
//   const buttonLocator = await page.frameLocator('iframe[title="storybook-preview-iframe"]').getByRole('button', { name: 'Button' });
//   await expect(buttonLocator).toBeVisible();
//   // Check classes
//   await expect(buttonLocator).toHaveClass('styles__StyledButton-sc-5pc2aq-1 laHBbz storybook-button storybook-button--ascent');

//   // Check Text
//   await expect(buttonLocator).toContainText('Button');

//   // Take a Screenshot
//   await expect(buttonLocator).toHaveScreenshot();
// })
