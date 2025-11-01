import { Builder, By, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';

// Make sure chromedriver is in our path
import 'chromedriver';

describe('TigerTix E2E Booking Flow', () => {
  let driver;

  // Create a new browser session before all tests
  beforeAll(async () => {
    // Set up Chrome options (optional, but good practice)
    const options = new chrome.Options();
    // options.addArguments('--headless'); // Uncomment to run without opening a browser window

    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();
  });

  // Close the browser session after all tests
  afterAll(async () => {
    await driver.quit();
  });

  // --- YOUR TEST CASE ---
  test('User can buy a ticket for a football game', async () => {
    // 1. Navigate to the frontend application
    await driver.get('http://localhost:3000');

    // 2. Wait until the event list is loaded
    // We'll wait for an element with the class 'event-list' to be present
    await driver.wait(until.elementLocated(By.css('.event-list')), 10000);

    // 3. Find the specific event
    // We find the <h2> that contains the football game text
    const eventName = 'Clemson VS USC Football';
    const eventTitleElement = await driver.findElement(
      By.xpath(`//h2[text()="${eventName}"]`)
    );

    // From the title, find the parent <li> (the event-item)
    const eventItemElement = await eventTitleElement.findElement(By.xpath('./ancestor::li[@class="event-item"]'));

    // 4. Find the "Buy Ticket" button *within* that event item
    const buyButton = await eventItemElement.findElement(By.css('.buy-ticket-button'));

    // 5. Click the button
    await buyButton.click();

    // 6. Wait for the JavaScript alert() to appear
    await driver.wait(until.alertIsPresent(), 5000);

    // 7. Switch to the alert, get its text, and accept it
    const alert = await driver.switchTo().alert();
    const alertText = await alert.getText();

    // Verify the alert text is correct
    expect(alertText).toBe(`Successfully purchased ticket for: ${eventName}!`);
    await alert.accept();

    // 8. Verify the success message in the app's status region
    const statusElement = await driver.findElement(By.css('.sr-only[role="status"]'));
    const statusText = await statusElement.getText();
    expect(statusText).toBe(`Successfully purchased ticket for: ${eventName}!`);
  });

  test('User can buy a ticket for a test event', async () => {
    // 1. Navigate to the frontend application
    await driver.get('http://localhost:3000');

    // 2. Wait until the event list is loaded
    // We'll wait for an element with the class 'event-list' to be present
    await driver.wait(until.elementLocated(By.css('.event-list')), 10000);

    // 3. Find the specific event
    // We find the <h2> that contains the football game text
    const eventName = 'Test Event 645';
    const eventTitleElement = await driver.findElement(
      By.xpath(`//h2[text()="${eventName}"]`)
    );

    // From the title, find the parent <li> (the event-item)
    const eventItemElement = await eventTitleElement.findElement(By.xpath('./ancestor::li[@class="event-item"]'));

    // 4. Find the "Buy Ticket" button *within* that event item
    const buyButton = await eventItemElement.findElement(By.css('.buy-ticket-button'));

    // 5. Click the button
    await buyButton.click();

    // 6. Wait for the JavaScript alert() to appear
    await driver.wait(until.alertIsPresent(), 5000);

    // 7. Switch to the alert, get its text, and accept it
    const alert = await driver.switchTo().alert();
    const alertText = await alert.getText();

    // Verify the alert text is correct
    expect(alertText).toBe(`Successfully purchased ticket for: ${eventName}!`);
    await alert.accept();

    // 8. Verify the success message in the app's status region
    const statusElement = await driver.findElement(By.css('.sr-only[role="status"]'));
    const statusText = await statusElement.getText();
    expect(statusText).toBe(`Successfully purchased ticket for: ${eventName}!`);
  });

});