const { test, expect } = require('@playwright/test');

const TEST_EMAIL = `test#${Date.now()}@gmail.com`;
const TEST_PASSWORD = '123456789';

test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/register');
});

test('Full run: Create account, log in, purchase ticket, log out', async ({ page }) => {
    await expect(page.locator('h2')).toHaveText('Create an Account');

    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button:has-text("Register")');

    await page.waitForURL('**/login');
    await expect(page.locator('h2')).toHaveText('Login to TigerTix');

    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button:has-text("Log In")');

    await page.waitForURL('http://localhost:3000/');
    await expect(page.getByRole('heading', { name: 'Current Available Events:' })).toBeVisible();
    await expect(page.locator('.logged-in-user')).toContainText(TEST_EMAIL);
    
    const firstBuyButton = page.locator('.event-list button:has-text("Buy Ticket")').first();
    await expect(firstBuyButton).toBeVisible();

    await firstBuyButton.click();

    await expect(page.locator('.sr-only[role="status"]')).toContainText('Successfully purchased ticket for:');

    await page.click('button.logout-button');

    await page.waitForURL('**/login');
    await expect(page.locator('h2')).toHaveText('Login to TigerTix');
    
});