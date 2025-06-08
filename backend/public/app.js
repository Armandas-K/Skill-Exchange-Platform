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
// check login
window.addEventListener('load', async () => {
  const res = await fetch('/api/session');
  const data = await res.json();

  if (!data.loggedIn) {
    // Redirect to login page if not logged in
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
        <h3>${profile.name}</h3>
        <p><strong>Skills:</strong> ${profile.skills ? profile.skills.join(", ") : ''}</p>
        <p><strong>Languages:</strong> ${profile.languages ? profile.languages.join(", ") : ''}</p>
        <p><strong>Reputation:</strong> ${profile.reputation_points}</p>
      `;

      container.appendChild(card);
    });

  } catch (err) {
    console.error("Failed to load profiles:", err);
  }
}

//search profiles
const modal = document.getElementById('searchModal');
const closeModal = document.getElementById('closeModal');

document.getElementById('searchForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const query = document.getElementById('searchInput').value;
  if (!query) return;

  try {
    const res = await fetch(`/api/search?query=${encodeURIComponent(query)}`);
    const data = await res.json();

    const resultsContainer = document.getElementById('search-results');
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

    // show modal after search
    modal.style.display = "block";

  } catch (err) {
    console.error("Failed to load search results:", err);
  }
});

// close modal 
closeModal.addEventListener('click', () => {
  modal.style.display = "none";
});

// close modal on clicking outside
window.addEventListener('click', (event) => {
  if (event.target === modal) {
    modal.style.display = "none";
  }
});



// -------------------- Offline Handling (ready for write logic later) --------------------
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
      // placeholder for future sync logic
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
