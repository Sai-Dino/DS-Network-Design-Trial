import { test, expect } from '@playwright/test';

test('Button Group Story Load', async ({ page }) => {
  await page.goto('http://localhost:6006/?path=/docs/components-buttongroup--docs');
  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/ButtonGroup/);
});

test('Button Group', async ({ page }) => {
  await page.goto('http://localhost:6006/?path=/docs/components-buttongroup--docs');
  await page.frameLocator('iframe[title="storybook-preview-iframe"]').locator('#story--components-buttongroup--right-alignment--primary-inner').getByRole('button').first().click();
  await page.frameLocator('iframe[title="storybook-preview-iframe"]').locator('#story--components-buttongroup--right-alignment--primary-inner').getByRole('button', { name: 'Lorem ipsum' }).first().click();
  await page.frameLocator('iframe[title="storybook-preview-iframe"]').locator('#story--components-buttongroup--right-alignment--primary-inner').getByRole('button', { name: 'Lorem ipsum' }).nth(1).click();
  await page.frameLocator('iframe[title="storybook-preview-iframe"]').locator('#story--components-buttongroup--right-alignment--primary-inner').getByRole('button', { name: 'Lorem ipsum' }).nth(2).click();
});