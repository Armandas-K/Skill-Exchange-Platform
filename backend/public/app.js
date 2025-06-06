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
