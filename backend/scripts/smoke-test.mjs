import assert from 'node:assert/strict';

const baseUrl = process.env.BACKEND_BASE_URL ?? 'http://localhost:4000';

async function getJson(path) {
  const response = await fetch(`${baseUrl}${path}`);
  assert.equal(response.ok, true, `Expected ${path} to return 2xx`);
  return response.json();
}

const health = await getJson('/health');
assert.equal(health.status, 'ok');
assert.equal(health.service, 'smart-water-backend');

const adminOverview = await getJson('/api/admin/overview');
assert.equal(Array.isArray(adminOverview.summaryCards), true);
assert.equal(Array.isArray(adminOverview.recentDevices), true);
assert.equal(Array.isArray(adminOverview.ticketQueue), true);
assert.equal(adminOverview.summaryCards.length > 0, true);

const mobileHome = await getJson('/api/mobile/home');
assert.equal(typeof mobileHome.customerName, 'string');
assert.equal(Array.isArray(mobileHome.cards), true);
assert.equal(mobileHome.cards.length > 0, true);

console.log('Backend smoke test passed.');
