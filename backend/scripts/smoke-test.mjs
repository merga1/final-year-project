import assert from 'node:assert/strict';

const baseUrl = process.env.BACKEND_BASE_URL ?? 'http://localhost:4000';

async function getJson(path) {
  const response = await fetch(`${baseUrl}${path}`);
  assert.equal(response.ok, true, `Expected ${path} to return 2xx`);
  return response.json();
}

async function postJson(path, body) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  assert.equal(response.ok, true, `Expected ${path} to return 2xx`);
  return response.json();
}

async function getAuthed(path, token) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.equal(response.ok, true, `Expected authenticated ${path} to return 2xx`);
  return response.json();
}

const health = await getJson('/health');
assert.equal(health.status, 'ok');
assert.equal(health.service, 'smart-water-backend');

const adminLogin = await postJson('/auth/login', { email: 'admin2@gmail.com', password: 'admin123' });
const adminOverview = await getAuthed('/api/admin/overview', adminLogin.accessToken);
assert.equal(Array.isArray(adminOverview.summaryCards), true);
assert.equal(Array.isArray(adminOverview.recentDevices), true);
assert.equal(Array.isArray(adminOverview.ticketQueue), true);
assert.equal(adminOverview.summaryCards.length > 0, true);

const customerLogin = await postJson('/auth/login', {
  email: 'mikiasylmer7362@gmail.com',
  password: 'customer123',
});
const mobileHome = await getAuthed('/api/mobile/home', customerLogin.accessToken);
assert.equal(typeof mobileHome.customerName, 'string');
assert.equal(Array.isArray(mobileHome.cards), true);
assert.equal(mobileHome.cards.length > 0, true);

const technicianLogin = await postJson('/auth/login', {
  email: 'john.smith@tech.water',
  password: 'technician123',
});
const technicianHome = await getAuthed('/api/technician/home', technicianLogin.accessToken);
assert.equal(typeof technicianHome.assigned, 'number');

console.log('Backend smoke test passed.');
