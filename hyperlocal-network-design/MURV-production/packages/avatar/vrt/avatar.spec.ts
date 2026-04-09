import { test, expect } from '@playwright/test';

test('Avatar Group Story Load', async ({ page }) => {
  await page.goto('http://localhost:6006/?path=/docs/components-avatar--docs');
  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Avatar/);
});
