// All hackathons with a filter, trending skills and top colleges.

async function showHackathons() {
  const tag = byId('filter').value;
  const path = tag ? `/hackathons?tag=${encodeURIComponent(tag)}` : '/hackathons';
  const hackathons = await callApi(path);

  let html = '';
  for (const hackathon of hackathons) {
    html += makeEvent(hackathon, hackathon.tags);
  }
  byId('all-hackathons').innerHTML = html || '<p class="empty">No hackathons for this skill.</p>';
}

async function showFilter() {
  const skills = await callApi('/skills');
  const oldValue = byId('filter').value;

  let html = '<option value="">All skills</option>';
  for (const skill of skills) {
    html += `<option value="${escapeHtml(skill.name)}">${escapeHtml(skill.name)}</option>`;
  }
  byId('filter').innerHTML = html;

  // the same skills are suggested while typing a skill
  let suggestions = '';
  for (const skill of skills) {
    suggestions += `<option value="${escapeHtml(skill.name)}"></option>`;
  }
  byId('skill-list').innerHTML = suggestions;
  byId('filter').value = oldValue;
}

function makeBar(name, count, biggest) {
  const safeName = escapeHtml(name);
  return `
    <li>
      <div class="bar-text"><span>${safeName}</span><strong>${count}</strong></div>
      <progress value="${count}" max="${biggest || 1}" aria-label="${safeName}"></progress>
    </li>`;
}

async function showTrending() {
  const skills = await callApi('/skills/trending');

  let html = '';
  for (const skill of skills) {
    // the list is sorted, so the first one is the biggest
    html += makeBar(skill.name, skill.hackathon_count, skills[0].hackathon_count);
  }
  byId('trending').innerHTML = html;
}

async function showColleges() {
  const colleges = await callApi('/users/leaderboard/colleges');

  let html = '';
  for (const college of colleges) {
    html += makeBar(college.college, college.user_count, colleges[0].user_count);
  }
  byId('colleges').innerHTML = html;
}

async function loadExplore() {
  await showFilter();
  await showHackathons();
  await showTrending();
  await showColleges();
}

byId('filter').addEventListener('change', async () => {
  try {
    await showHackathons();
  } catch (error) {
    showMessage(error.message);
  }
});

loadExplore().catch((error) => showMessage(error.message));
