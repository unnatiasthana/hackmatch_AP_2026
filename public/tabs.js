// Show one page at a time when a tab is clicked.

function showPage(pageId) {
  for (const page of document.querySelectorAll('.page')) {
    page.hidden = page.id !== pageId;
  }
  for (const tab of document.querySelectorAll('.tab')) {
    tab.setAttribute('aria-pressed', tab.dataset.page === pageId);
  }
  window.scrollTo(0, 0);
}

for (const tab of document.querySelectorAll('.tab')) {
  tab.addEventListener('click', () => {
    document.getElementById('message').textContent = '';
    showPage(tab.dataset.page);
  });
}
