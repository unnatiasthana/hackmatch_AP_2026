// Form to add a new hackathon.

byId('event-form').addEventListener('submit', async (event) => {
  event.preventDefault();

  const hackathon = {
    title: byId('event-title').value,
    link: byId('event-link').value,
    start_date: byId('event-date').value,
    tags: splitByComma(byId('event-tags').value),
  };

  try {
    const saved = await callApi('/hackathons', 'POST', hackathon);
    byId('event-form').reset();
    byId('event-box').open = false;
    await showStudent();
    await loadExplore();
    showMessage(`${saved.title} is saved.`);
  } catch (error) {
    showMessage(error.message);
  }
});
