// TigerTix/frontend/tests/e2e.spec.js

const { test, expect } = require('@playwright/test');

const TEST_EMAIL = `test-user-${Date.now()}@example.com`;
const TEST_PASSWORD = '123456789';

test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/register');
});

test('Full E2E Flow: Register, Login, Book Ticket, and Logout', async ({ page }) => {
    console.log('Starting Registration...');
    await expect(page.locator('h2')).toHaveText('Create an Account');

    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button:has-text("Register")');

    await page.waitForURL('**/login');
    await expect(page.locator('h2')).toHaveText('Login to TigerTix');

    console.log('Starting Login...');
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button:has-text("Log In")');

    await page.waitForURL('http://localhost:3000/');
    await expect(page.getByRole('heading', { name: 'Current Available Events:' })).toBeVisible();
    await expect(page.locator('.logged-in-user')).toContainText(TEST_EMAIL);

    // --- 3. Book a Ticket ---
    console.log('Starting Ticket Booking...');
    
    // Playwright will wait for the events to load, then find the button for the first event.
    // Assuming the first event listed has a visible "Buy Ticket" button.
    const firstBuyButton = page.locator('.event-list button:has-text("Buy Ticket")').first();
    await expect(firstBuyButton).toBeVisible();

    // Mock the alert since it halts the browser in testing (MainPage.js uses global.alert)
    page.on('dialog', async (dialog) => {
        if (dialog.type() === 'alert') {
            console.log(`Alert received: ${dialog.message()}`);
            await dialog.accept(); // Dismiss the alert
        }
    });

    await firstBuyButton.click();
    
    // Check for the status message change to confirm purchase success
    // The purchase success message is set in the "sr-only" div in MainPage.js
    await expect(page.locator('.sr-only[role="status"]')).toContainText('Successfully purchased ticket for:');
    console.log('Ticket successfully booked.');


    // --- 4. Log Out ---
    console.log('Starting Logout...');
    await page.click('button.logout-button');

    // Wait for navigation back to the Login page
    await page.waitForURL('**/login');
    await expect(page.locator('h2')).toHaveText('Login to TigerTix');
    
    console.log('Test completed successfully!');
});