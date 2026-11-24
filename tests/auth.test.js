// Signup, login and permissions with the real database.
// The test student is deleted at the end.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');

const app = require('../src/app');
const db = require('../src/config/db');

const email = `login${Date.now()}@example.com`;
let server, base, token, userId;

before(async () => {
  server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await db.query('DELETE FROM users WHERE email = $1', [email]);
  await db.end();
  server.close();
});

function send(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = 'Bearer ' + token;
  return fetch(base + path, { method: method, headers: headers, body: body && JSON.stringify(body) });
}

test('signup gives a token and saves only a hash', async () => {
  const res = await send('POST', '/api/users', { name: 'Login Test', email: email, password: 'secret123' });
  assert.equal(res.status, 201);
  const data = (await res.json()).data;
  assert.ok(data.token);
  assert.equal(data.user.role, 'student');
  userId = data.user.id;

  const row = await db.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
  assert.notEqual(row.rows[0].password_hash, 'secret123');
  assert.ok(row.rows[0].password_hash.startsWith('$2'));
});

test('wrong password gives 401', async () => {
  const res = await send('POST', '/api/auth/login', { email: email, password: 'wrong-one' });
  assert.equal(res.status, 401);
});

test('right password logs in', async () => {
  const res = await send('POST', '/api/auth/login', { email: email, password: 'secret123' });
  assert.equal(res.status, 200);
  token = (await res.json()).data.token;

  const me = await send('GET', '/api/auth/me', null, token);
  assert.equal((await me.json()).data.name, 'Login Test');
});

test('a student can change their own skills', async () => {
  const res = await send('POST', `/api/users/${userId}/skills`, { skill: 'python' }, token);
  assert.equal(res.status, 201);
});

test('the API never sends the password hash', async () => {
  const res = await send('GET', `/api/users/${userId}`);
  assert.equal((await res.json()).data.password_hash, undefined);
});
