// Log in and log out.
// The token is kept in localStorage, so a page refresh does not log you out.

function saveLogin(token, user) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
  showAccount();
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  showAccount();
}

function showAccount() {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  byId('login-form').hidden = Boolean(user);
  byId('logged-in').hidden = !user;
  if (user) {
    byId('me-name').textContent = user.name;
    byId('me-role').textContent = user.role;
  }
}

byId('login-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const details = {
    email: byId('login-email').value,
    password: byId('login-password').value,
  };

  try {
    const result = await callApi('/auth/login', 'POST', details);
    saveLogin(result.token, result.user);
    byId('login-form').reset();
    showMessage(`Hi ${result.user.name}, you are logged in.`);
    // students see their own matches, the admin is not in the student list
    if (result.user.role === 'student') await loadUsers(result.user.id);
  } catch (error) {
    showMessage(error.message);
  }
});

byId('logout').addEventListener('click', () => {
  logout();
  showMessage('You are logged out.');
});

// check the saved token is still good (it expires after 1 day)
async function checkLogin() {
  if (!localStorage.getItem('token')) return showAccount();
  try {
    await callApi('/auth/me');
    showAccount();
  } catch (error) {
    logout();
  }
}

checkLogin();
