document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const language = document.getElementById('language').value;

  try {
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, language })
    });

    const data = await res.json();

    if (res.ok) {
      document.getElementById('registerMessage').textContent = "Registration successful!";
      // Optional: Redirect to login after successful registration
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 1500);
    } else {
      document.getElementById('registerMessage').textContent = data.error;
    }

  } catch (err) {
    console.error('Registration error:', err);
    document.getElementById('registerMessage').textContent = 'Server error';
  }
});
