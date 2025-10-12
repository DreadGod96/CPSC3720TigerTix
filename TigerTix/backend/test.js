//import fetch from 'node-fetch';

// --- Configuration ---
const ADMIN_SERVICE_URL = 'http://localhost:5001/api/events';
const CLIENT_SERVICE_URL = 'http://localhost:6001/api/events';

const CREATE_REQUESTS = 20; // Number of concurrent event creation requests
const GET_REQUESTS = 50;    // Number of concurrent get all events requests
const PURCHASE_REQUESTS = 100; // Number of concurrent ticket purchase requests

/**
 * Generates a random event object for testing.
 */
const generateRandomEvent = () => {
    const randomId = Math.floor(Math.random() * 1000);
    return {
        event_name: `Test Event ${randomId}`,
        event_date: new Date(Date.now() + Math.random() * 1000 * 3600 * 24 * 30).toISOString().split('T')[0], // Random date in next 30 days
        number_of_tickets_available: Math.floor(Math.random() * 50) + 1, // 1 to 50 tickets
        price_of_a_ticket: (Math.random() * 100).toFixed(2),
    };
};

/**
 * Logs the results of a batch of promises.
 * @param {string} testName - The name of the test suite.
 * @param {PromiseSettledResult[]} results - The array of settled promise results.
 */
const logResults = (testName, results) => {
    const fulfilled = results.filter(r => r.status === 'fulfilled').length;
    const rejected = results.length - fulfilled;
    console.log(`\n--- ${testName} Results ---`);
    console.log(`Total Requests: ${results.length}`);
    console.log(`✅ Successes: ${fulfilled}`);
    console.log(`❌ Failures: ${rejected}`);
    if (rejected > 0) {
        console.log('Sample failure reasons:');
        results.filter(r => r.status === 'rejected').slice(0, 3).forEach(r => {
            console.error(`  - ${r.reason.message}`);
        });
    }
    console.log('-------------------------\n');
};

/**
 * Test Suite 1: Concurrently create events via the admin-service.
 */
const testCreateEvents = async () => {
    console.log(`🚀 Starting: Concurrently creating ${CREATE_REQUESTS} events...`);
    const promises = [];
    for (let i = 0; i < CREATE_REQUESTS; i++) {
        const promise = fetch(ADMIN_SERVICE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(generateRandomEvent()),
        }).then(res => res.ok ? res.json() : Promise.reject(new Error(`Failed with status ${res.status}`)));
        promises.push(promise);
    }
    const results = await Promise.allSettled(promises);
    logResults('Admin Service: Create Events', results);
};

/**
 * Test Suite 2: Concurrently fetch all events from the client-service.
 */
const testGetAllEvents = async () => {
    console.log(`🚀 Starting: Concurrently fetching all events ${GET_REQUESTS} times...`);
    const promises = [];
    for (let i = 0; i < GET_REQUESTS; i++) {
        const promise = fetch(CLIENT_SERVICE_URL)
            .then(res => res.ok ? res.json() : Promise.reject(new Error(`Failed with status ${res.status}`)));
        promises.push(promise);
    }
    const results = await Promise.allSettled(promises);
    logResults('Client Service: Get All Events', results);
};

/**
 * Test Suite 3: Concurrently purchase tickets for random events.
 */
const testPurchaseTickets = async () => {
    console.log(`🚀 Starting: Concurrently purchasing ${PURCHASE_REQUESTS} tickets...`);
    
    // First, get a list of available events
    const response = await fetch(CLIENT_SERVICE_URL);
    const events = await response.json();

    if (!events || events.length === 0) {
        console.error('❌ Cannot run purchase test: No events found. Please create some events first.');
        return;
    }

    const promises = [];
    for (let i = 0; i < PURCHASE_REQUESTS; i++) {
        // Pick a random event to attempt to purchase
        const randomEvent = events[Math.floor(Math.random() * events.length)];
        const purchaseUrl = `${CLIENT_SERVICE_URL}/${randomEvent.event_id}/purchase`;

        const promise = fetch(purchaseUrl, { method: 'POST' })
            .then(async res => {
                if (!res.ok) {
                    const errorBody = await res.json();
                    return Promise.reject(new Error(errorBody.message || `Failed with status ${res.status}`));
                }
                return res.json();
            });
        promises.push(promise);
    }

    const results = await Promise.allSettled(promises);
    logResults('Client Service: Purchase Tickets', results);
};

/**
 * Main function to run all test suites.
 */
const runTests = async () => {
    console.log('=============== LOAD TEST STARTED ===============');
    await testCreateEvents();
    await testGetAllEvents();
    await testPurchaseTickets();
    console.log('=============== LOAD TEST FINISHED ==============');
};

runTests().catch(err => console.error('A critical error occurred during testing:', err));
