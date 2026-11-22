// Signup form for a new student.

byId('signup-form').addEventListener('submit', async (event) => {
  event.preventDefault();

  const student = {
    name: byId('student-name').value,
    email: byId('student-email').value,
    college: byId('student-college').value,
  };
  const skills = splitByComma(byId('student-skills').value);

  try {
    const user = await callApi('/users', 'POST', student);
    for (const skill of skills) {
      await callApi(`/users/${user.id}/skills`, 'POST', { skill: skill });
    }

    byId('signup-form').reset();
    byId('signup-box').open = false;
    await loadUsers(user.id);
    await loadExplore();
    showMessage(`Welcome ${user.name}! Your matches are below.`);
  } catch (error) {
    showMessage(error.message);
  }
});
