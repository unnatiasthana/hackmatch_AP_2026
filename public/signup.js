// Signup form for a new student.

byId('signup-form').addEventListener('submit', async (event) => {
  event.preventDefault();

  const student = {
    name: byId('student-name').value,
    email: byId('student-email').value,
    password: byId('student-password').value,
    college: byId('student-college').value,
  };
  const skills = splitByComma(byId('student-skills').value);

  try {
    // the server sends back the new user and a login token
    const result = await callApi('/users', 'POST', student);
    const user = result.user;
    saveLogin(result.token, user);

    for (const skill of skills) {
      await callApi(`/users/${user.id}/skills`, 'POST', { skill: skill });
    }

    byId('signup-form').reset();
    showPage('matches');
    await loadUsers(user.id);
    await loadExplore();
    showMessage(`Welcome ${user.name}! Your matches are below.`);
  } catch (error) {
    showMessage(error.message);
  }
});
