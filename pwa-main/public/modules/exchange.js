const dbPromise = idb.openDB('offline-db', 1, {
  upgrade(db) {
    db.createObjectStore('pending', { autoIncrement: true });
  }
});

// Handle submission of the exchange request form
export function attachExchangeFormHandler() {
  const exchangeForm = document.getElementById('exchangeForm');
  if (exchangeForm) {
    exchangeForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const to_profile_id = document.getElementById('offeredSkill').dataset.targetProfileId;
      const skill_id_1 = document.getElementById('offeredSkill').value;
      const skill_id_2 = document.getElementById('requestedSkill').value;

      // If offline, immediately store the request
      if (!navigator.onLine) {
        await saveOffline({ to_profile_id, skill_id_1, skill_id_2 });
        document.getElementById('exchangeMessage').textContent = 'Saved offline';
        return;
      }

      try {
        const res = await fetch('/api/exchange/request', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to_profile_id, skill_id_1, skill_id_2 })
        });

        const msg = document.getElementById('exchangeMessage');

        if (res.ok) {
          const data = await res.json();
          msg.textContent = 'Exchange request sent!';
          setTimeout(() => document.getElementById('unifiedModal').style.display = 'none', 1500);
        } else {
          const data = await res.json().catch(() => ({}));
          msg.textContent = (data && data.error) || 'Error sending exchange request.';
        }
      } catch (err) {
        console.error('Exchange request error:', err);
        await saveOffline({ to_profile_id, skill_id_1, skill_id_2 });
        document.getElementById('exchangeMessage').textContent = 'Saved offline';
      }
    });
  }
}

// Wire up buttons in the requests modal to load data
export function attachRequestsModalHandlers(loadReceived, loadSent) {
  const showReceived = document.getElementById('showReceived');
  const showSent = document.getElementById('showSent');
  if (showReceived && showSent) {
    showReceived.addEventListener('click', () => {
      document.getElementById('receivedRequests').style.display = 'block';
      document.getElementById('sentRequests').style.display = 'none';
      loadReceived();
    });

    showSent.addEventListener('click', () => {
      document.getElementById('receivedRequests').style.display = 'none';
      document.getElementById('sentRequests').style.display = 'block';
      loadSent();
    });
  }
}

// Load exchanges the user has sent
export async function loadSentExchanges() {
  try {
    const res = await fetch('/api/exchange/sent');

    if (!res.ok) {
      console.warn('Failed to fetch sent exchanges:', res.status);
      const container = document.getElementById('sentRequests');
      if (container) {
        container.innerHTML = '<p>Failed to load sent exchanges.</p>';
      }
      return;
    }

    const exchanges = await res.json();

    const container = document.getElementById('sentRequests');
    container.innerHTML = '';

    exchanges.forEach(exchange => {
      const div = document.createElement('div');
      div.innerHTML = `
        <p><strong>To:</strong> ${exchange.profile_2_name}</p>
        <p><strong>Offered:</strong> ${exchange.offered_skill}</p>
        <p><strong>Requested:</strong> ${exchange.requested_skill}</p>
        <p><strong>Status:</strong> ${exchange.status}</p>
        <button class="btn cancel-exchange" data-id="${exchange.exchange_id}">Cancel</button>
      `;
      container.appendChild(div);
    });

    container.querySelectorAll('.cancel-exchange').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.dataset.id;
        await updateExchangeStatus(id, 'Cancelled');
      });
    });
  } catch (err) {
    console.error('Failed to load sent exchanges:', err);
  }
}

// Load exchanges sent to the user
export async function loadReceivedExchanges() {
  try {
    const res = await fetch('/api/exchange/received');

    if (!res.ok) {
      console.warn('Failed to fetch received exchanges:', res.status);
      const container = document.getElementById('receivedRequests');
      if (container) {
        container.innerHTML = '<p>Failed to load received exchanges.</p>';
      }
      return;
    }

    const exchanges = await res.json();

    const container = document.getElementById('receivedRequests');
    container.innerHTML = '';

    exchanges.forEach(exchange => {
      const div = document.createElement('div');
      div.innerHTML = `
        <p><strong>From:</strong> ${exchange.profile_1_name}</p>
        <p><strong>Offered:</strong> ${exchange.offered_skill}</p>
        <p><strong>Requested:</strong> ${exchange.requested_skill}</p>
        <p><strong>Status:</strong> ${exchange.status}</p>
        <button class="btn cancel-exchange" data-id="${exchange.exchange_id}">Cancel</button>
        <button class="btn decline-exchange" data-id="${exchange.exchange_id}">Decline</button>
        <button class="btn accept-exchange" data-id="${exchange.exchange_id}">Accept</button>
      `;
      container.appendChild(div);
    });

    container.querySelectorAll('.cancel-exchange').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.dataset.id;
        await updateExchangeStatus(id, 'Cancelled');
      });
    });

    container.querySelectorAll('.decline-exchange').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.dataset.id;
        await updateExchangeStatus(id, 'Declined');
      });
    });

    container.querySelectorAll('.accept-exchange').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.dataset.id;
        await updateExchangeStatus(id, 'Active');
      });
    });
  } catch (err) {
    console.error('Failed to load received exchanges:', err);
  }
}

// Helper to update the exchange status on the server
async function updateExchangeStatus(id, status) {
  try {
    const res = await fetch(`/api/exchange/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (res.ok) {
      await loadSentExchanges();
      await loadReceivedExchanges();
    } else {
      const data = await res.json().catch(() => ({}));
      alert((data && data.error) || 'Failed to update exchange');
    }
  } catch (err) {
    console.error('Status update failed:', err);
  }
}

// Store a pending exchange request in IndexedDB when offline
export async function saveOffline(data) {
  const db = await dbPromise;
  await db.add('pending', data);
  console.log('Saved offline:', data);
}

// Sync any offline requests when back online
export async function syncPending() {
  const db = await dbPromise;
  const tx = db.transaction('pending', 'readonly');
  const store = tx.objectStore('pending');
  const [items, keys] = await Promise.all([
    store.getAll(),
    store.getAllKeys()
  ]);
  await tx.done;

  if (items.length === 0) {
    return;
  }

  let synced = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    const payload = {
      to_profile_id: Number(item.to_profile_id),
      skill_id_1: Number(item.skill_id_1),
      skill_id_2: Number(item.skill_id_2)
    };

    try {
      const res = await fetch('/api/exchange/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const delTx = db.transaction('pending', 'readwrite');
        await delTx.objectStore('pending').delete(keys[i]);
        await delTx.done;
        synced++;
      } else {
        const errText = await res.text().catch(() => '');
        console.warn('Server rejected item:', payload, errText);
      }
    } catch (err) {
      console.warn('Failed to sync item:', item, err);
    }
  }

  if (synced > 0) {
    const status = document.getElementById('status');
    if (status) {
      status.textContent = `Synced ${synced} pending items.`;
      setTimeout(() => { status.textContent = ''; }, 3000);
    }
  }
}
