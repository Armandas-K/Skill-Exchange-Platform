// Toggle UI elements based on login state
export function updateAuthUI(loggedIn) {
  const loginBtn = document.getElementById('openLoginModal');
  const registerBtn = document.getElementById('openRegisterModal');
  const logoutBtn = document.getElementById('logoutButton');
  const requestsBtn = document.getElementById('openRequestsModal');
  if (!loginBtn || !registerBtn || !logoutBtn || !requestsBtn) return;
  if (loggedIn) {
    loginBtn.style.display = 'none';
    registerBtn.style.display = 'none';
    logoutBtn.style.display = 'inline-block';
    requestsBtn.style.display = 'inline-block';
    requestsBtn.disabled = false;
  } else {
    loginBtn.style.display = 'inline-block';
    registerBtn.style.display = 'inline-block';
    logoutBtn.style.display = 'none';
    requestsBtn.style.display = 'none';
    requestsBtn.disabled = true;
  }
}

// Attach handler to submit the login form
export function attachLoginFormHandler() {
  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (!navigator.onLine) {
      document.getElementById('loginMessage').textContent = 'You are offline. Please connect to login.';
      return;
    }

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (res.ok) {
        document.getElementById('loginMessage').textContent = 'Login successful!';
        setTimeout(() => { window.location.href = 'index.html'; }, 1000);
      } else {
        document.getElementById('loginMessage').textContent = data.error;
      }
    } catch (err) {
      console.error('Login error:', err);
      document.getElementById('loginMessage').textContent = navigator.onLine ? 'Server error' : 'You are offline.';
    }
  });
}

// Attach handler to submit the registration form
export function attachRegisterFormHandler() {
  document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const language = document.getElementById('registerLanguage').value;

    if (!navigator.onLine) {
      document.getElementById('registerMessage').textContent = 'You are offline. Please connect to register.';
      return;
    }

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, language })
      });

      const data = await res.json();
      const messageContainer = document.getElementById('registerMessage');

      if (res.ok) {
        messageContainer.textContent = 'Registration successful! You can now log in.';
      } else {
        messageContainer.textContent = data.error;
      }
    } catch (err) {
      console.error('Registration error:', err);
      document.getElementById('registerMessage').textContent = navigator.onLine ? 'Server error' : 'You are offline.';
    }
  });
}

// Terminate the current session and reload the page
export async function logout() {
  await fetch('/api/logout', { method: 'POST' });
  window.location.href = 'index.html';
}
