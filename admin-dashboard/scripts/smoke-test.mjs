import assert from 'node:assert/strict';

const baseUrl = process.env.ADMIN_BASE_URL ?? 'http://localhost:3000';

const response = await fetch(baseUrl);
assert.equal(response.ok, true, 'Expected admin dashboard to return 2xx');

const html = await response.text();
assert.equal(html.includes('Operations Overview'), true);
assert.equal(html.includes('Connected Devices'), true);
assert.equal(html.includes('ESP32-001'), true);

console.log('Admin dashboard smoke test passed.');
