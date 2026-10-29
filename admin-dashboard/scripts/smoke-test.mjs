import assert from 'node:assert/strict';

const baseUrl = process.env.ADMIN_BASE_URL ?? 'http://localhost:3000';

const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'admin2@gmail.com', password: 'admin123' }),
});
assert.equal(loginResponse.ok, true, 'Expected admin login to return 2xx');
const loginData = await loginResponse.json();
const setCookie = loginResponse.headers.get('set-cookie') ?? '';
const cookie = setCookie.split(/,(?=\s*sw_)/).map((value) => value.split(';')[0]).join('; ');

const response = await fetch(baseUrl, { headers: { cookie } });
assert.equal(response.ok, true, 'Expected admin dashboard to return 2xx');

const html = await response.text();
assert.equal(html.includes('Admin Dashboard'), true);
assert.equal(html.includes('Total Customers'), true);
assert.equal(html.includes('Top Technicians'), true);

console.log('Admin dashboard smoke test passed.');
