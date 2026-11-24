// These tests use the real database and delete their own rows at the end.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');

const db = require('../src/config/db');
const User = require('../src/models/user.model');
const Hackathon = require('../src/models/hackathon.model');

const id = Date.now();
const email = `test${id}@example.com`;
const link = `https://example.com/test${id}/`;
const skillA = `test skill a ${id}`;
const skillB = `test skill b ${id}`;
const skillC = `test skill c ${id}`;
let userId;

before(async () => {
  const user = await User.create({ name: 'Test Student', email: email, college: null, passwordHash: 'x' });
  userId = user.id;
  await User.addSkill(userId, skillA);
  await User.addSkill(userId, skillB);

  await Hackathon.upsert({ title: 'One match', link: link + '1', start_date: '2099-01-01', tags: [skillA] });
  await Hackathon.upsert({ title: 'Two matches', link: link + '2', start_date: '2099-02-01', tags: [skillA, skillB] });
  await Hackathon.upsert({ title: 'No match', link: link + '3', start_date: '2099-01-01', tags: [skillC] });
  await Hackathon.upsert({ title: 'Old event', link: link + '4', start_date: '2000-01-01', tags: [skillA] });
});

after(async () => {
  await db.query('DELETE FROM users WHERE email = $1', [email]);
  await db.query('DELETE FROM hackathons WHERE link LIKE $1', [link + '%']);
  await db.query('DELETE FROM skills WHERE name IN ($1, $2, $3)', [skillA, skillB, skillC]);
  await db.end();
});

test('more matching skills comes first', async () => {
  const result = await Hackathon.recommendFor(userId);
  assert.equal(result[0].title, 'Two matches');
  assert.equal(result[0].match_score, 2);
  assert.equal(result[1].title, 'One match');
});

test('events with no match or an old date are not shown', async () => {
  const result = await Hackathon.recommendFor(userId);
  assert.equal(result.length, 2);
});

test('old events are shown when asked for', async () => {
  const result = await Hackathon.recommendFor(userId, { upcomingOnly: false });
  assert.equal(result.length, 3);
});

test('date does not move by one day', async () => {
  const result = await Hackathon.recommendFor(userId);
  assert.equal(result[0].start_date, '2099-02-01');
});

test('updating an event replaces its tags', async () => {
  const hackathon = { title: 'No match', link: link + '3', start_date: '2099-01-01', tags: [skillC] };
  await Hackathon.upsert({ ...hackathon, tags: [skillA] });
  const eventId = await Hackathon.upsert(hackathon);
  const saved = await Hackathon.findById(eventId);
  assert.deepEqual(saved.tags, [skillC]);
});
