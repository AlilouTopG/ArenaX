import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';
import { connectDB, closeDB } from '../src/config/db.js';

let server;
let base;

const api = async (path, { method = 'GET', body } = {}) => {
  const headers = { 'Content-Type': 'application/json' };
  const res = await fetch(`${base}${path}`, {
    method,
    headers,
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return { status: res.status, body: await res.json() };
};

before(async () => {
  await connectDB();
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  base = `http://localhost:${server.address().port}/api/v1`;
});

after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await closeDB();
});

test('regression: /events?upcoming=true works (Mongo $gte must not be stripped)', async () => {
  const { status, body } = await api('/events?limit=30&upcoming=true');
  assert.equal(status, 200);
  assert.equal(body.success, true);
  assert.ok(Array.isArray(body.data.events));
});

test('regression: /map/nearby with maxMonthlyPrice works (Mongo $lte must not be stripped)', async () => {
  const { status, body } = await api('/map/nearby?lat=36.75&lng=3.05&radius=100&maxMonthlyPrice=5000');
  assert.equal(status, 200);
  assert.equal(body.success, true);
  assert.ok(Array.isArray(body.data.gyms));
});

test('regression: auth refresh works (Mongo $inc must not be stripped)', async () => {
  const reg = await api('/auth/register', {
    method: 'POST',
    body: {
      name: 'Refresh Test',
      email: 'refresh.test@arenax.app',
      phone: '+21370000199',
      password: 'Refresh@12345',
      role: 'User',
    },
  });
  assert.equal(reg.status, 201);

  const login = await api('/auth/login', {
    method: 'POST',
    body: { email: 'refresh.test@arenax.app', password: 'Refresh@12345' },
  });
  assert.equal(login.status, 200);
  const refreshToken = login.body.data.refreshToken;

  const refresh = await api('/auth/refresh', {
    method: 'POST',
    body: { refreshToken },
  });
  assert.equal(refresh.status, 200);
  assert.equal(refresh.body.success, true);
  assert.ok(refresh.body.data.accessToken);
});