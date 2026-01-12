import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display the hero section', async ({ page }) => {
    // Check headline
    await expect(
      page.getByRole('heading', { name: /Transform Your Dust Tokens/i })
    ).toBeVisible();

    // Check subheadline
    await expect(
      page.getByText(/Enterprise-grade DeFi infrastructure/i)
    ).toBeVisible();

    // Check CTA buttons
    await expect(page.getByRole('link', { name: /Start Scanning/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /How It Works/i })).toBeVisible();
  });

  test('should have working navigation', async ({ page }) => {
    // Check logo link
    const logo = page.getByRole('link', { name: /VORTEX/i }).first();
    await expect(logo).toBeVisible();

    // Check Launch App button
    const launchAppBtn = page.getByRole('link', { name: /Launch App/i });
    await expect(launchAppBtn).toBeVisible();
    
    // Click and verify navigation
    await launchAppBtn.click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('should display stats section', async ({ page }) => {
    // Check stats
    await expect(page.getByText(/Gas Saved/i)).toBeVisible();
    await expect(page.getByText(/Users/i)).toBeVisible();
    await expect(page.getByText(/Chains/i)).toBeVisible();
    await expect(page.getByText(/Uptime/i)).toBeVisible();
  });

  test('should display features section', async ({ page }) => {
    // Check features
    await expect(page.getByText(/Gasless Swaps/i)).toBeVisible();
    await expect(page.getByText(/12-Layer Security/i)).toBeVisible();
    await expect(page.getByText(/Best Rates/i)).toBeVisible();
    await expect(page.getByText(/Earn XP & Rewards/i)).toBeVisible();
  });

  test('should have correct meta tags', async ({ page }) => {
    // Check title
    await expect(page).toHaveTitle(/Vortex Protocol/);

    // Check description meta tag
    const description = await page
      .locator('meta[name="description"]')
      .getAttribute('content');
    expect(description).toContain('DeFi');
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Check mobile menu visibility
    await expect(
      page.getByRole('heading', { name: /Transform Your Dust Tokens/i })
    ).toBeVisible();

    // CTA buttons should stack vertically on mobile
    const ctaContainer = page.locator('.flex-col.sm\\:flex-row');
    await expect(ctaContainer).toBeVisible();
  });
});

test.describe('Accessibility', () => {
  test('should have no accessibility violations on home page', async ({ page }) => {
    await page.goto('/');

    // Basic accessibility checks
    // Check for main landmark
    await expect(page.locator('main')).toBeVisible();

    // Check for heading hierarchy
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();

    // Check all images have alt text
    const images = page.locator('img');
    const imageCount = await images.count();
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      expect(alt).toBeTruthy();
    }

    // Check all links have accessible names
    const links = page.locator('a');
    const linkCount = await links.count();
    for (let i = 0; i < linkCount; i++) {
      const link = links.nth(i);
      const accessibleName = await link.getAttribute('aria-label') || await link.textContent();
      expect(accessibleName?.trim()).toBeTruthy();
    }
  });

  test('should have keyboard navigation support', async ({ page }) => {
    await page.goto('/');

    // Tab through main interactive elements
    await page.keyboard.press('Tab');
    
    // Should be able to navigate with keyboard
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });
});
