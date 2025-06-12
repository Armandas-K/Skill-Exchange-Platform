const PROFILES_API_URL = '/api/profiles';

// Populate the exchange modal with skills for both users
async function openExchangeForProfile(toProfileId, myProfile, openModal) {
  openModal('exchangeTemplate');
  try {
    const targetRes = await fetch(`/api/profile/skills/${toProfileId}`);
    const targetSkills = await targetRes.json();

    const offeredSelect = document.querySelector('#unifiedModal #offeredSkill');
    const requestedSelect = document.querySelector('#unifiedModal #requestedSkill');
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
  } catch (err) {
    console.error('Failed to load skills for exchange:', err);
    alert('Could not load exchange options.');
  }
}

// Load all profiles and render profile cards
export async function loadProfiles(openModal) {
  try {
    const [profilesRes, myRes] = await Promise.all([
      fetch(`${PROFILES_API_URL}?ts=${Date.now()}`),
      fetch(`/api/profile?ts=${Date.now()}`)
    ]);
    const data = await profilesRes.json();
    const myProfile = await myRes.json();

    const myId = myProfile.profile_id;

    const container = document.getElementById('profiles-container');
    container.innerHTML = '';

    data.forEach(profile => {
      if (profile.profile_id === myId) return;
      const card = document.createElement('div');
      card.className = 'profile-card';
      card.innerHTML = `
        <div class="card-header">
          <img src="assets/default_profile.png" alt="Profile Picture" class="profile-card-img" />
          <h3>${profile.name}</h3>
        </div>
        <div class="card-body">
          <p><strong>Skills:</strong> ${
            Array.isArray(profile.skills)
              ? profile.skills.map(s => `<span class="tag">${s}</span>`).join(' ')
              : 'N/A'
          }</p>
          <p><strong>Languages:</strong> ${
            Array.isArray(profile.languages)
              ? profile.languages.map(l => `<span class="tag">${l}</span>`).join(' ')
              : 'N/A'
          }</p>
          <p><strong>Reputation:</strong> ${profile.reputation_points ?? 0}</p>
          <button class="btn request-skill-btn" data-profile-id="${profile.profile_id}">Request Exchange</button>
        </div>
      `;
      container.appendChild(card);
    });

    document.querySelectorAll('.request-skill-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const toProfileId = e.currentTarget.dataset.profileId;
        openExchangeForProfile(toProfileId, myProfile, openModal);
      });
    });

  } catch (err) {
    console.error('Failed to load profiles:', err);
  }
}

// Attach handler for the edit profile form
export function attachEditProfileFormHandler(openModal) {
  document.getElementById('editProfileForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('editName').value;
    const skills = document.getElementById('editSkills')
      .value.split(/[,\n]+/)
      .map(s => s.trim())
      .filter(Boolean);
    const languages = document.getElementById('editLanguages')
      .value.split(/[,\n]+/)
      .map(l => l.trim())
      .filter(Boolean);

    if (!navigator.onLine) {
      document.getElementById('editProfileMessage').textContent = 'You are offline. Cannot update profile.';
      return;
    }

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, skills, languages })
      });

      const data = await res.json();
      const messageContainer = document.getElementById('editProfileMessage');

      if (res.ok) {
        messageContainer.textContent = 'Profile updated!';
        loadProfiles(openModal);
      } else {
        messageContainer.textContent = data.error;
      }
    } catch (err) {
      console.error('Edit profile error:', err);
      document.getElementById('editProfileMessage').textContent = navigator.onLine ? 'Server error' : 'You are offline.';
    }
  });
}

// Load the current user's profile into the edit form
export async function loadProfileIntoForm() {
  try {
    const res = await fetch(`/api/profile?ts=${Date.now()}`);
    const data = await res.json();
    document.getElementById('editName').value = data.name;
    document.getElementById('editSkills').value = Array.isArray(data.skills)
      ? data.skills.map(s => s.skill).join(', ')
      : '';
    document.getElementById('editLanguages').value = Array.isArray(data.languages)
      ? data.languages.join(', ')
      : '';
  } catch (err) {
    console.error('Failed to load profile data', err);
  }
}

// Attach search handlers for the profile list
export function setupSearch(openModal) {
  document.getElementById('searchForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const query = document.getElementById('searchInput').value;
    if (!query) return;
    await performSearch(query, openModal);
  });

  document.querySelectorAll('.search-tag').forEach(tag => {
    tag.addEventListener('click', () => performSearch(tag.textContent, openModal));
  });
}

// Perform a profile search and display results
async function performSearch(query, openModal) {
  try {
    openModal('searchTemplate');
    const [res, myRes] = await Promise.all([
      fetch(`/api/search?query=${encodeURIComponent(query)}`),
      fetch(`/api/profile?ts=${Date.now()}`)
    ]);
    const data = await res.json();
    const myProfile = await myRes.json();

    const resultsContainer = document.querySelector('#unifiedModal #search-results');
    resultsContainer.innerHTML = '';
    if (data.length === 0) {
      resultsContainer.innerHTML = '<p>No results found.</p>';
    } else {
      data.forEach(profile => {
        const card = document.createElement('div');
        card.className = 'profile-card';
        card.innerHTML = `
          <div class="card-header">
            <img src="assets/default_profile.png" alt="Profile Picture" class="profile-card-img" />
            <h3>${profile.name}</h3>
          </div>
          <div class="card-body">
            <p><strong>Skills:</strong> ${
              Array.isArray(profile.skills)
                ? profile.skills.map(s => `<span class="tag">${s}</span>`).join(' ')
                : 'N/A'
            }</p>
            <p><strong>Languages:</strong> ${
              Array.isArray(profile.languages)
                ? profile.languages.map(l => `<span class="tag">${l}</span>`).join(' ')
                : 'N/A'
            }</p>
            <p><strong>Reputation:</strong> ${profile.reputation_points ?? 0}</p>
            <button class="btn request-skill-btn" data-profile-id="${profile.profile_id}">Request Exchange</button>
          </div>`;
        resultsContainer.appendChild(card);
      });

    }
    document.querySelectorAll('#unifiedModal .request-skill-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.profileId;
        openExchangeForProfile(id, myProfile, openModal);
      });
    });
  } catch (err) {
    console.error('Failed to load search results:', err);
  }
}
