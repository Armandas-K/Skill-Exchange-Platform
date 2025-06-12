import { updateAuthUI, attachLoginFormHandler, attachRegisterFormHandler, logout } from './modules/auth.js';
import { loadProfiles, attachEditProfileFormHandler, loadProfileIntoForm, setupSearch } from './modules/profile.js';
import { attachExchangeFormHandler, attachRequestsModalHandlers, loadReceivedExchanges, loadSentExchanges, syncPending } from './modules/exchange.js';

let statusTimeout;

window.addEventListener('load', async () => {
  try {
    const res = await fetch('/api/session');
    const data = await res.json();

    updateAuthUI(data.loggedIn);

    if (!data.loggedIn) {
      openModal('loginTemplate');
    } else {
      console.log('Logged in as user:', data.userId);
      loadProfiles(openModal);
    }
  } catch (err) {
    updateAuthUI(false);
  } finally {
    updateOnlineStatus();
  }
});

const unifiedModal = document.getElementById('unifiedModal');
const modalBody = document.getElementById('modalBody');
const closeUnifiedBtn = document.getElementById('closeUnifiedModal');

// Render the requested template inside the unified modal
function openModal(templateId) {
  const template = document.getElementById(templateId);
  modalBody.innerHTML = template.innerHTML;
  unifiedModal.style.display = 'block';

  if (templateId === 'loginTemplate') {
    attachLoginFormHandler();
    const regBtn = document.getElementById('openRegisterModalFromLogin');
    if (regBtn) {
      regBtn.addEventListener('click', () => openModal('registerTemplate'));
    }
  }
  if (templateId === 'registerTemplate') {
    attachRegisterFormHandler();
  }
  if (templateId === 'editProfileTemplate') {
    attachEditProfileFormHandler(openModal);
    loadProfileIntoForm();
  }
  if (templateId === 'requestsTemplate') {
    attachRequestsModalHandlers(loadReceivedExchanges, loadSentExchanges);
    loadReceivedExchanges();
  }
  if (templateId === 'exchangeTemplate') {
    attachExchangeFormHandler();
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

document.getElementById('openLoginModal').addEventListener('click', () => openModal('loginTemplate'));
document.getElementById('openProfileModal').addEventListener('click', () => openModal('profileTemplate'));
document.getElementById('openRegisterModal').addEventListener('click', () => openModal('registerTemplate'));
document.getElementById('openRequestsModal').addEventListener('click', () => openModal('requestsTemplate'));
document.getElementById('logoutButton').addEventListener('click', logout);
document.addEventListener('click', function(e) {
  if (e.target && e.target.id === 'openEditProfileModal') {
    openModal('editProfileTemplate');
  }
});

setupSearch(openModal);

// Update UI and sync data when the network status changes
function updateOnlineStatus() {
  const statusEl = document.getElementById('status');
  if (!statusEl) return;
  if (navigator.onLine) {
    statusEl.classList.remove('offline');
    statusEl.textContent = 'Back online';
    syncPending();
    clearTimeout(statusTimeout);
    statusTimeout = setTimeout(() => {
      statusEl.textContent = '';
    }, 3000);
  } else {
    statusEl.classList.add('offline');
    statusEl.textContent = 'You are offline. Requests will sync when online.';
    clearTimeout(statusTimeout);
  }
}

window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);

// Register the service worker for offline support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .catch((err) => {
        console.error('Service Worker registration failed:', err);
      });
  });
}
