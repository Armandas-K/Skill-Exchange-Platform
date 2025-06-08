document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (res.ok) {
      document.getElementById('loginMessage').textContent = "Login successful!";
      
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 1000); 
    } else {
      document.getElementById('loginMessage').textContent = data.error;
    }

  } catch (err) {
    console.error('Login error:', err);
    document.getElementById('loginMessage').textContent = 'Server error';
  }
});
