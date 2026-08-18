import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/app.js';
import Gym from '../src/models/Gym.js';

let mongo;
let server;
let base;
let gymId;
let eventId;
let coachToken;

before(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  base = `http://localhost:${server.address().port}/api/v1`;

  await api('/auth/register', {
    method: 'POST',
    body: {
      name: 'Coach Test',
      email: 'coach.test@arenax.app',
      phone: '+21370000123',
      password: 'Coach@12345',
      role: 'Coach_ClubOwner',
    },
  });
  const { body } = await api('/auth/login', {
    method: 'POST',
    body: { email: 'coach.test@arenax.app', password: 'Coach@12345' },
  });
  coachToken = body.data.accessToken;
});

after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  if (mongo) {
    await mongo.stop();
  }
});

const api = async (path, { method = 'GET', token, body } = {}) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${base}${path}`, {
    method,
    headers,
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return { status: res.status, body: await res.json() };
};

test('register rejects weak password (password strength)', async () => {
  const { status, body } = await api('/auth/register', {
    method: 'POST',
    body: { name: 'Weak User', email: 'weak@arenax.app', password: 'weakpass', role: 'User' },
  });
  assert.equal(status, 400);
  assert.ok(Array.isArray(body.details));
});

test('login returns user and tokens', async () => {
  const { status, body } = await api('/auth/login', {
    method: 'POST',
    body: { email: 'coach.test@arenax.app', password: 'Coach@12345' },
  });
  assert.equal(status, 200);
  assert.equal(body.data.user.email, 'coach.test@arenax.app');
  assert.ok(body.data.accessToken);
  assert.ok(body.data.refreshToken);
});

test('login wrong password returns 401', async () => {
  const { status } = await api('/auth/login', {
    method: 'POST',
    body: { email: 'coach.test@arenax.app', password: 'WrongPass123!' },
  });
  assert.equal(status, 401);
});

test('brute-force protection blocks after repeated failed logins', async () => {
  let saw429 = false;
  for (let i = 0; i < 7; i += 1) {
    const { status } = await api('/auth/login', {
      method: 'POST',
      body: { email: 'victim@arenax.app', password: 'WrongPass123!' },
    });
    if (status === 429) {
      saw429 = true;
      break;
    }
    assert.equal(status, 401);
  }
  assert.ok(saw429, 'Expected brute-force limiter to return 429 after repeated failures');
});

test('coach creates an Algerian gym (RBAC enforced)', async () => {
  const { status, body } = await api('/gyms', {
    method: 'POST',
    token: coachToken,
    body: {
      name: 'Test Gym Algiers',
      sportTypes: ['Football', 'Bodybuilding'],
      subscriptionPrices: { monthly: 50 },
      location: { type: 'Point', coordinates: [3.0588, 36.7538] },
      city: 'Algiers',
      country: 'DZ',
      address: 'Alger Centre',
    },
  });
  assert.equal(status, 201);
  assert.ok(body.data.gym._id);
  gymId = body.data.gym._id;

  await Gym.findByIdAndUpdate(gymId, { isVerified: true });
});

test('map markers filter by country returns Algerian gyms', async () => {
  const { status, body } = await api('/map/markers?country=DZ');
  assert.equal(status, 200);
  assert.ok(body.data.gyms.length >= 1);
  assert.equal(body.data.gyms[0].country, 'DZ');
});

test('nearby map search returns the created gym', async () => {
  const { status, body } = await api('/map/nearby?lat=36.7538&lng=3.0588&radius=50&country=DZ');
  assert.equal(status, 200);
  assert.ok(body.data.gyms.length >= 1);
});

test('news list returns an array', async () => {
  const { status, body } = await api('/news');
  assert.equal(status, 200);
  assert.ok(Array.isArray(body.data.news));
});

test('protected route blocks anonymous requests (JWT guard)', async () => {
  const { status } = await api('/subscriptions');
  assert.equal(status, 401);
});

test('coach creates a cash subscription', async () => {
  const { status, body } = await api('/subscriptions', {
    method: 'POST',
    token: coachToken,
    body: {
      gymId,
      memberName: 'Member One',
      memberPhone: '+21370000999',
      sportType: 'Bodybuilding',
      amountPaid: 50,
      paymentMethod: 'Cash',
      startDate: '2026-08-18',
      endDate: '2026-09-18',
    },
  });
  assert.equal(status, 201);
  assert.equal(body.data.subscription.memberName, 'Member One');
});

test('events CRUD: create, list, update, delete', async () => {
  const createRes = await api('/events', {
    method: 'POST',
    token: coachToken,
    body: {
      title: 'بطولة كمال الأجسام',
      sportType: 'Bodybuilding',
      location: 'قاعة سيدار - الجزائر العاصمة',
      gymId,
      eventDate: '2026-10-01T10:00:00.000Z',
      entryFee: 500,
      registrationUrl: 'https://arenax.app/register/test',
      description: 'بطولة تجريبية',
    },
  });
  assert.equal(createRes.status, 201);
  eventId = createRes.body.data.event._id;

  const listRes = await api('/events?upcoming=true');
  assert.equal(listRes.status, 200);
  assert.ok(listRes.body.data.events.some((e) => e._id === eventId));

  const updateRes = await api(`/events/${eventId}`, {
    method: 'PATCH',
    token: coachToken,
    body: { title: 'بطولة كمال الأجسام الوطنية', entryFee: 750 },
  });
  assert.equal(updateRes.status, 200);
  assert.equal(updateRes.body.data.event.title, 'بطولة كمال الأجسام الوطنية');

  const getRes = await api(`/events/${eventId}`);
  assert.equal(getRes.status, 200);
  assert.equal(getRes.body.data.event.entryFee, 750);

  const delRes = await api(`/events/${eventId}`, { method: 'DELETE', token: coachToken });
  assert.equal(delRes.status, 200);
  assert.equal(delRes.body.data.deleted, true);
});

test('event creation requires authentication', async () => {
  const { status } = await api('/events', {
    method: 'POST',
    body: { title: 'X', sportType: 'Football', location: 'Y', eventDate: '2026-10-01T10:00:00.000Z' },
  });
  assert.equal(status, 401);
});