const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');

const app = require('../src/app');
const { normalizeSkills, isUuid } = require('../src/middleware/validate');
const { validateHackathon } = require('../src/controllers/hackathon.controller');
const { clean } = require('../src/services/ingest.service');
const { makeToken } = require('../src/middleware/auth');

// fake logged in users, only the token is needed for these tests
const student = makeToken({ id: '123e4567-e89b-12d3-a456-426614174000', role: 'student' });
const admin = makeToken({ id: '223e4567-e89b-12d3-a456-426614174000', role: 'admin' });
const otherId = '323e4567-e89b-12d3-a456-426614174000';

let server, base;
before(async () => {
  server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => server.close());

const post = (path, body, token) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = 'Bearer ' + token;
  return fetch(base + path, { method: 'POST', headers: headers, body: JSON.stringify(body) });
};

test('GET /api/health', async () => {
  const res = await fetch(`${base}/api/health`);
  assert.equal(res.status, 200);
  assert.equal((await res.json()).service, 'HackMatch');
});

test('unknown routes return 404 JSON', async () => {
  const res = await fetch(`${base}/api/nope`);
  assert.equal(res.status, 404);
  assert.equal((await res.json()).success, false);
});

test('malformed JSON returns 400', async () => {
  const res = await fetch(`${base}/api/users`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{bad',
  });
  assert.equal(res.status, 400);
});

test('non-UUID ids are rejected before touching the database', async () => {
  for (const p of ['/api/users/123', '/api/users/abc/recommendations', '/api/hackathons/xyz']) {
    assert.equal((await fetch(base + p)).status, 400, p);
  }
});

test('POST /api/users validates input', async () => {
  assert.equal((await post('/api/users', { email: 'a@b.co' })).status, 400);
  assert.equal((await post('/api/users', { name: 'A', email: 'bad' })).status, 400);
  assert.equal((await post('/api/users', { name: 'A', email: 'a@b.co', password: '123' })).status, 400);
});

test('POST /api/hackathons validates input', async () => {
  assert.equal((await post('/api/hackathons', { title: 'X', link: 'nope' }, admin)).status, 400);
  assert.equal((await post('/api/hackathons', { link: 'https://a.com' }, admin)).status, 400);
});

test('no token gives 401', async () => {
  assert.equal((await post('/api/hackathons', { title: 'X', link: 'https://a.com' })).status, 401);
  assert.equal((await post(`/api/users/${otherId}/skills`, { skill: 'go' })).status, 401);
  assert.equal((await fetch(`${base}/api/auth/me`)).status, 401);
});

test('a fake or changed token gives 401', async () => {
  const changed = student.slice(0, -2) + 'xx';
  assert.equal((await post('/api/hackathons', { title: 'X' }, changed)).status, 401);
  assert.equal((await post('/api/hackathons', { title: 'X' }, 'not-a-token')).status, 401);
});

test('a student cannot add hackathons (403)', async () => {
  assert.equal((await post('/api/hackathons', { title: 'X', link: 'https://a.com' }, student)).status, 403);
});

test("a student cannot change another student's skills (403)", async () => {
  assert.equal((await post(`/api/users/${otherId}/skills`, { skill: 'go' }, student)).status, 403);
});

test('login needs email and password', async () => {
  assert.equal((await post('/api/auth/login', { email: 'a@b.co' })).status, 400);
});

test('skill normalisation lowercases, trims and dedupes', () => {
  assert.deepEqual(normalizeSkills([' Gen AI ', 'gen ai', '', 'Python', 5]), ['gen ai', 'python']);
});

test('isUuid', () => {
  assert.ok(isUuid('123e4567-e89b-12d3-a456-426614174000'));
  assert.ok(!isUuid('123'));
});

test('validateHackathon rejects bad dates and non-http links', () => {
  assert.throws(() => validateHackathon({ title: 'T', link: 'https://a.com', start_date: '12/05/2026' }));
  assert.throws(() => validateHackathon({ title: 'T', link: 'ftp://a.com' }));
  assert.equal(validateHackathon({ title: ' T ', link: 'https://a.com', tags: ['AI'] }).tags[0], 'ai');
});

test('ingest clean() drops invalid items and normalises tags', () => {
  assert.equal(clean({ title: 'x' }), null);
  assert.equal(clean({ title: 'x', link: 'not a url' }), null);
  const c = clean({ title: ' x ', link: 'https://a.com', start_date: 'soon', tags: ['Web3 '] });
  assert.deepEqual([c.title, c.start_date, c.tags], ['x', null, ['web3']]);
});
