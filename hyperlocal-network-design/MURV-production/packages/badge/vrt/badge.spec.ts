import { test, expect } from '@playwright/test';
// import { loadStory } from '../../../vrt/utils';

test('Story Load', async ({ page }) => {
  await page.goto('http://localhost:6006/?path=/docs/components-badge--docs');
  await expect(page).toHaveTitle(/Badge/);
});