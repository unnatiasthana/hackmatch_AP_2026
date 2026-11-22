// All hackathons with a filter, trending skills and top colleges.

async function showHackathons() {
  const tag = byId('filter').value;
  const path = tag ? `/hackathons?tag=${encodeURIComponent(tag)}` : '/hackathons';
  const hackathons = await callApi(path);

  let html = '';
  for (const hackathon of hackathons) {
    html += makeCard(hackathon, hackathon.tags, '');
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
  byId('filter').value = oldValue;
}

async function showTrending() {
  const skills = await callApi('/skills/trending');

  let html = '';
  for (const skill of skills) {
    html += `<li>${escapeHtml(skill.name)} (${skill.hackathon_count} events)</li>`;
  }
  byId('trending').innerHTML = html;
}

async function showColleges() {
  const colleges = await callApi('/users/leaderboard/colleges');

  let html = '';
  for (const college of colleges) {
    html += `<li>${escapeHtml(college.college)} (${college.user_count} students)</li>`;
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
