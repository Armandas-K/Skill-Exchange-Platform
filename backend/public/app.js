// -------------------- API ENDPOINT --------------------
const PROFILES_API_URL = '/api/profiles';

// -------------------- IndexedDB Setup --------------------
const dbPromise = idb.openDB('offline-db', 1, {
  upgrade(db) {
    db.createObjectStore('pending', { autoIncrement: true });
  }
});

// -------------------- Utility --------------------
function showMessage(msg) {
  const status = document.getElementById('status');
  if (status) {
    status.textContent = msg;
    setTimeout(() => { status.textContent = ""; }, 3000);
  }
}

// -------------------- Load Profiles --------------------
window.addEventListener('load', async () => {
  const res = await fetch('/api/session');
  const data = await res.json();

  if (!data.loggedIn) {
    window.location.href = 'login.html';
  } else {
    console.log("Logged in as user:", data.userId);
  }
});

async function loadProfiles() {
  try {
    const res = await fetch(PROFILES_API_URL);
    const data = await res.json();

    const container = document.getElementById("profiles-container");
    container.innerHTML = '';

    data.forEach(profile => {
      const card = document.createElement("div");
      card.className = "profile-card";

      card.innerHTML = `
        <div class="card-header">
          <img src="assets/default_profile.png" alt="Profile Picture" class="profile-card-img" />
          <h3>${profile.name}</h3>
        </div>
        <div class="card-body">
          <p><strong>Skills:</strong> ${profile.skills?.join(", ") || 'N/A'}</p>
          <p><strong>Languages:</strong> ${profile.languages?.join(", ") || 'N/A'}</p>
          <p><strong>Reputation:</strong> ${profile.reputation_points ?? 0}</p>
        </div>
      `;

      container.appendChild(card);
    });

  } catch (err) {
    console.error("Failed to load profiles:", err);
  }
}

// -------------------- Unified Modal Logic --------------------
const unifiedModal = document.getElementById("unifiedModal");
const modalBody = document.getElementById("modalBody");
const closeUnifiedBtn = document.getElementById("closeUnifiedModal");

function openModal(templateId) {
  const template = document.getElementById(templateId);
  modalBody.innerHTML = template.innerHTML;
  unifiedModal.style.display = "block";

  if (templateId === "loginTemplate") {
    attachLoginFormHandler();
  }

  if (templateId === "registerTemplate") {
    attachRegisterFormHandler();
  }
}

closeUnifiedBtn.addEventListener('click', () => {
  unifiedModal.style.display = 'none';
});

window.addEventListener('click', (event) => {
  if (event.target === unifiedModal) {
    unifiedModal.style.display = 'none';
  }
});

// -------------------- Openers --------------------
document.getElementById("openLoginModal").addEventListener('click', () => openModal("loginTemplate"));
document.getElementById("openProfileModal").addEventListener('click', () => openModal("profileTemplate"));
document.getElementById("openRegisterModal").addEventListener('click', () => openModal("registerTemplate"));

// -------------------- Search --------------------
document.getElementById('searchForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const query = document.getElementById('searchInput').value;
  if (!query) return;

  try {
    const res = await fetch(`/api/search?query=${encodeURIComponent(query)}`);
    const data = await res.json();

    const resultsContainer = document.querySelector('#searchTemplate #search-results');
    resultsContainer.innerHTML = '';

    if (data.length === 0) {
      resultsContainer.innerHTML = '<p>No results found.</p>';
    } else {
      data.forEach(profile => {
        const card = document.createElement("div");
        card.className = "profile-card";
        card.innerHTML = `
          <h3>${profile.name}</h3>
          <p><strong>Skills:</strong> ${profile.skills ? profile.skills.join(", ") : ''}</p>
          <p><strong>Languages:</strong> ${profile.languages ? profile.languages.join(", ") : ''}</p>
        `;
        resultsContainer.appendChild(card);
      });
    }

    openModal("searchTemplate");

  } catch (err) {
    console.error("Failed to load search results:", err);
  }
});

document.querySelectorAll('.search-tag').forEach(tag => {
  tag.addEventListener('click', async () => {
    const query = tag.textContent;

    try {
      const res = await fetch(`/api/search?query=${encodeURIComponent(query)}`);
      const data = await res.json();

      const resultsContainer = document.querySelector('#searchTemplate #search-results');
      resultsContainer.innerHTML = '';

      if (data.length === 0) {
        resultsContainer.innerHTML = '<p>No results found.</p>';
      } else {
        data.forEach(profile => {
          const card = document.createElement("div");
          card.className = "profile-card";
          card.innerHTML = `
            <h3>${profile.name}</h3>
            <p><strong>Skills:</strong> ${profile.skills ? profile.skills.join(", ") : ''}</p>
            <p><strong>Languages:</strong> ${profile.languages ? profile.languages.join(", ") : ''}</p>
          `;
          resultsContainer.appendChild(card);
        });
      }

      openModal("searchTemplate");

    } catch (err) {
      console.error("Failed to load search results:", err);
    }
  });
});


// -------------------- Login --------------------
function attachLoginFormHandler() {
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
        setTimeout(() => { window.location.href = 'index.html'; }, 1000);
      } else {
        document.getElementById('loginMessage').textContent = data.error;
      }
    } catch (err) {
      console.error('Login error:', err);
      document.getElementById('loginMessage').textContent = 'Server error';
    }
  });
}

// -------------------- register -------------------
function attachRegisterFormHandler() {
  document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const language = document.getElementById('registerLanguage').value;

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, language })
      });

      const data = await res.json();
      const messageContainer = document.getElementById('registerMessage');

      if (res.ok) {
        messageContainer.textContent = "Registration successful! You can now log in.";
      } else {
        messageContainer.textContent = data.error;
      }
    } catch (err) {
      console.error('Registration error:', err);
      document.getElementById('registerMessage').textContent = 'Server error';
    }
  });
}

// -------------------- Offline Handling --------------------
async function saveOffline(data) {
  const db = await dbPromise;
  await db.add('pending', data);
  console.log('Saved offline:', data);
}

async function syncPending() {
  const db = await dbPromise;
  const all = await db.getAll('pending');
  if (all.length === 0) return;

  let synced = 0;
  for (const item of all) {
    try {
      console.log('Pending item found:', item);
      synced++;
    } catch {
      console.warn('Failed to sync item:', item);
    }
  }

  if (synced > 0) {
    showMessage(`Synced ${synced} pending items.`);
  }
  await db.clear('pending');
}

// -------------------- Events --------------------
window.addEventListener('online', syncPending);
window.addEventListener('load', () => {
  loadProfiles();
  if (navigator.onLine) {
    syncPending();
  }
});
