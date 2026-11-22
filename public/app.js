// Main page: pick a student, change skills, see matches.
// The small helper functions here are used by the other files too.

function byId(id) {
  return document.getElementById(id);
}

async function callApi(path, method = 'GET', body) {
  const options = { method: method, headers: { 'Content-Type': 'application/json' } };
  if (body) options.body = JSON.stringify(body);

  const response = await fetch('/api' + path, options);
  const result = await response.json();
  if (!result.success) throw new Error(result.message);
  return result.data;
}

// so that text typed by a user can't run as HTML
function escapeHtml(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function showMessage(text) {
  byId('message').textContent = text;
}

// "gen ai, python" becomes ["gen ai", "python"]
function splitByComma(text) {
  const list = [];
  for (const part of text.split(',')) {
    if (part.trim()) list.push(part.trim());
  }
  return list;
}

// "2026-12-05" becomes a small block with 5, Dec and 2026
function makeDate(date) {
  if (!date) return '<div class="date">Date not decided</div>';

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const [year, month, day] = date.split('-');
  return `<div class="date"><strong>${Number(day)}</strong>${months[month - 1]} ${year}</div>`;
}

// score and isBest are only used on the "My matches" page
function makeEvent(hackathon, skills, score, isBest) {
  let chips = '';
  for (const skill of skills) {
    chips += `<span class="chip">${escapeHtml(skill)}</span>`;
  }

  let side = '';
  if (isBest) side += '<span class="best-label">Best match</span>';
  if (score) {
    const word = score === 1 ? 'skill' : 'skills';
    side += `<span class="score">${score} matching ${word}</span>`;
  }

  return `
    <article class="event ${isBest ? 'best' : ''}">
      ${makeDate(hackathon.start_date)}
      <div>
        <h3>${escapeHtml(hackathon.title)}</h3>
        <div class="chips">${chips}</div>
      </div>
      <div class="event-side">
        ${side}
        <a href="${escapeHtml(hackathon.link)}" target="_blank" rel="noopener">View event</a>
      </div>
    </article>`;
}

async function loadUsers(selectedId) {
  const users = await callApi('/users');

  let options = '';
  for (const user of users) {
    options += `<option value="${escapeHtml(user.id)}">${escapeHtml(user.name)}</option>`;
  }
  byId('user').innerHTML = options;
  if (selectedId) byId('user').value = selectedId;
  await showStudent();
}

async function showStudent() {
  const id = byId('user').value;
  if (!id) {
    byId('feed').innerHTML = '<p class="empty">No students yet. Use Sign up to add the first one.</p>';
    return;
  }

  const user = await callApi(`/users/${id}`);
  const matches = await callApi(`/users/${id}/recommendations`);
  // another student was picked while we were waiting
  if (id !== byId('user').value) return;

  let skillsHtml = '';
  for (const skill of user.skills) {
    const name = escapeHtml(skill);
    skillsHtml += `<span class="chip">${name}<button data-skill="${name}" aria-label="Remove ${name}">×</button></span>`;
  }
  byId('college-name').textContent = user.college || '';
  byId('skills').innerHTML = skillsHtml || '<span class="empty">No skills yet.</span>';

  let eventsHtml = '';
  for (let i = 0; i < matches.length; i++) {
    const hackathon = matches[i];
    eventsHtml += makeEvent(hackathon, hackathon.matched_skills, hackathon.match_score, i === 0);
  }
  byId('feed').innerHTML = eventsHtml || '<p class="empty">No matches yet. Add a skill above.</p>';
}

byId('user').addEventListener('change', async () => {
  try {
    showMessage('');
    await showStudent();
  } catch (error) {
    showMessage(error.message);
  }
});

byId('skill-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const id = byId('user').value;
  const skill = byId('skill-input').value.trim();
  if (!id || !skill) return;

  try {
    await callApi(`/users/${id}/skills`, 'POST', { skill: skill });
    byId('skill-input').value = '';
    showMessage('');
    await showStudent();
  } catch (error) {
    showMessage(error.message);
  }
});

byId('skills').addEventListener('click', async (event) => {
  const skill = event.target.dataset.skill;
  if (!skill) return;

  try {
    await callApi(`/users/${byId('user').value}/skills/${encodeURIComponent(skill)}`, 'DELETE');
    showMessage('');
    await showStudent();
  } catch (error) {
    showMessage(error.message);
  }
});

loadUsers().catch((error) => showMessage(error.message));
