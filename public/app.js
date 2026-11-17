const $ = (id) => document.getElementById(id);
const api = async (path, opts) => {
  const r = await fetch('/api' + path, { headers: { 'Content-Type': 'application/json' }, ...opts });
  const j = await r.json();
  if (!j.success) throw new Error(j.message);
  return j.data;
};
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));

async function loadUsers() {
  const users = await api('/users');
  $('user').innerHTML = users.map((u) => `<option value="${esc(u.id)}">${esc(u.name)}</option>`).join('');
  if (users.length) refresh();
}

async function refresh() {
  const id = $('user').value;
  const [user, recs] = await Promise.all([api(`/users/${id}`), api(`/users/${id}/recommendations`)]);
  $('skills').innerHTML = user.skills
    .map((s) => `<span class="chip">${esc(s)}<button data-skill="${esc(s)}" aria-label="Remove ${esc(s)}">×</button></span>`)
    .join('') || '<span class="empty">No skills yet.</span>';
  $('feed').innerHTML = recs.map((h) => `
    <article class="card">
      <h3>${esc(h.title)}</h3>
      <div class="meta">${h.start_date ? esc(String(h.start_date).slice(0, 10)) : 'Date TBA'} · ${h.match_score} matching skill${h.match_score > 1 ? 's' : ''}</div>
      <div class="chips">${h.matched_skills.map((s) => `<span class="chip">${esc(s)}</span>`).join('')}</div>
      <a href="${esc(h.link)}" target="_blank" rel="noopener">View event →</a>
    </article>`).join('') || '<p class="empty">No matches yet. Add some skills.</p>';
}

$('user').addEventListener('change', refresh);
$('skill-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const skill = $('skill-input').value;
  if (!skill.trim()) return;
  await api(`/users/${$('user').value}/skills`, { method: 'POST', body: JSON.stringify({ skill }) });
  $('skill-input').value = '';
  refresh();
});
$('skills').addEventListener('click', async (e) => {
  const s = e.target.dataset.skill;
  if (!s) return;
  await api(`/users/${$('user').value}/skills/${encodeURIComponent(s)}`, { method: 'DELETE' });
  refresh();
});

loadUsers().catch((e) => { $('feed').innerHTML = `<p class="empty">${esc(e.message)}</p>`; });
