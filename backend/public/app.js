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
    openModal("loginTemplate");
  } else {
    console.log("Logged in as user:", data.userId);
    loadProfiles();

    if (navigator.onLine) {
      syncPending();
    }
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
          <p><strong>Skills:</strong> ${profile.skills?.join(", ") || 'N/A'}</p>
          <p><strong>Languages:</strong> ${profile.languages?.join(", ") || 'N/A'}</p>
          <button class="request-skill-btn"
            data-profile-id="${profile.profile_id}"
            data-skills='${JSON.stringify(profile.skills_ids)}'>Request Exchange</button>
        </div>
      `;
      container.appendChild(card);
    });

    document.querySelectorAll('.request-skill-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const toProfileId = e.target.dataset.profileId;

        try {
          const [targetRes, myRes] = await Promise.all([
            fetch(`/api/profile/skills/${toProfileId}`),
            fetch('/api/profile')
          ]);

          const targetSkills = await targetRes.json();
          const myProfile = await myRes.json();
          console.log('My profile:', myProfile);
          console.log('Skills:', myProfile.skills);

          const offeredSelect = document.getElementById('offeredSkill');
          const requestedSelect = document.getElementById('requestedSkill');
          offeredSelect.innerHTML = '';
          requestedSelect.innerHTML = '';

          myProfile.skills.forEach(skill => {
            const option = document.createElement('option');
            option.value = skill.skill_id;
            option.textContent = skill.skill;
            offeredSelect.appendChild(option);
          });

          targetSkills.forEach(skill => {
            const option = document.createElement('option');
            option.value = skill.skill_id;
            option.textContent = skill.skill;
            requestedSelect.appendChild(option);
          });

          offeredSelect.dataset.targetProfileId = toProfileId;

          openModal('exchangeTemplate');

        } catch (err) {
          console.error("Failed to load skills for exchange:", err);
          alert("Could not load exchange options.");
        }
      });
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
  if (templateId === "editProfileTemplate") {
    attachEditProfileFormHandler();
    loadProfileIntoForm(); 
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
document.addEventListener('click', function(e) {
  if (e.target && e.target.id === 'openEditProfileModal') {
    openModal('editProfileTemplate');
  }
});
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
          <div class="card-header">
            <img src="assets/default_profile.png" alt="Profile Picture" class="profile-card-img" />
            <h3>${profile.name}</h3>
          </div>
          <div class="card-body">
            <p><strong>Skills:</strong> ${profile.skills?.join(", ") || 'N/A'}</p>
            <p><strong>Languages:</strong> ${profile.languages?.join(", ") || 'N/A'}</p>
            <p><strong>Reputation:</strong> ${profile.reputation_points ?? 0}</p>
            <button onclick="requestExchange(${profile.profile_id})">Request Exchange</button>
          </div>
        `;
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

//edit profile
function attachEditProfileFormHandler() {
  document.getElementById('editProfileForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('editName').value;
    const skills = document.getElementById('editSkills').value.split(',').map(s => s.trim());
    const languages = document.getElementById('editLanguages').value.split(',').map(l => l.trim());

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, skills, languages })
      });

      const data = await res.json();
      const messageContainer = document.getElementById('editProfileMessage');

      if (res.ok) {
        messageContainer.textContent = "Profile updated!";
        loadProfiles(); // Refresh profiles list after update
      } else {
        messageContainer.textContent = data.error;
      }
    } catch (err) {
      console.error('Edit profile error:', err);
      document.getElementById('editProfileMessage').textContent = 'Server error';
    }
  });
}

async function loadProfileIntoForm() {
  try {
    const res = await fetch('/api/profile');
    const data = await res.json();

    document.getElementById('editName').value = data.name;
    document.getElementById('editSkills').value = data.skills.join(", ");
    document.getElementById('editLanguages').value = data.languages.join(", ");
  } catch (err) {
    console.error("Failed to load profile data", err);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const exchangeForm = document.getElementById('exchangeForm');
  if (exchangeForm) {
    exchangeForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const to_profile_id = document.getElementById('offeredSkill').dataset.targetProfileId;
      const skill_id_1 = document.getElementById('offeredSkill').value;
      const skill_id_2 = document.getElementById('requestedSkill').value;

      try {
        const res = await fetch('/api/exchange/request', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to_profile_id, skill_id_1, skill_id_2 })
        });

        const data = await res.json();
        const msg = document.getElementById('exchangeMessage');

        if (res.ok) {
          msg.textContent = "Exchange request sent!";
          setTimeout(() => unifiedModal.style.display = 'none', 1500);
        } else {
          msg.textContent = data.error || "Error sending exchange request.";
        }

      } catch (err) {
        console.error('Exchange request error:', err);
        document.getElementById('exchangeMessage').textContent = 'Server error';
      }
    });
  }
});
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
