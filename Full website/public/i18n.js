const resources = {
  en: {
    translation: {
      headerTitle: "MakersLink - Skills Exchange",
      home: "Home",
      upload: "Upload",
      viewListings: "View Listings",
      profile: "Profile",
      login: "Login",
      register: "Register",
      logout: "Logout",
      searchPlaceholder: "Search...",
      go: "Go",
      topRatedMembers: "Top Rated Members",
      popularSearches: "Popular Searches",
      connectTitle: "Connect with the people of MakersValley",
      connectDescription: "Helping individuals in Makers Valley find jobs to sustain their needs",
      yourProfile: "Your Profile",
      skills: "Skills",
      rating: "Rating",
      editProfile: "Edit Profile",
      language: "Language",
      myRequests: "My Exchange Requests",
      exchangeRequests: "Exchange Requests",
      received: "Received",
      sent: "Sent"
    }
  },
  fr: {
    translation: {
      headerTitle: "MakersLink - Échange de Compétences",
      home: "Accueil",
      upload: "Téléverser",
      viewListings: "Voir les Annonces",
      profile: "Profil",
      login: "Connexion",
      register: "S'inscrire",
      logout: "D\u00e9connexion",
      searchPlaceholder: "Rechercher...",
      go: "Aller",
      topRatedMembers: "Membres les Mieux Notés",
      popularSearches: "Recherches Populaires",
      connectTitle: "Connectez-vous avec les habitants de MakersValley",
      connectDescription: "Aider les individus de Makers Valley à trouver du travail pour subvenir à leurs besoins",
      yourProfile: "Votre Profil",
      skills: "Compétences",
      rating: "Note",
      editProfile: "Modifier le Profil",
      language: "Langue",
      myRequests: "Mes demandes d'échange",
      exchangeRequests: "Demandes d'échange",
      received: "Reçues",
      sent: "Envoyées"
    }
  }
};

i18next.init({
  lng: 'en', 
  debug: true,
  resources
}, function(err, t) {
  updateContent();
});

// Update all translatable text on the page
function updateContent() {
  document.querySelector('h1').innerText = i18next.t('headerTitle');
  document.querySelector('a.active').innerText = i18next.t('home');
  document.getElementById('openRequestsModal').innerText = i18next.t('myRequests');

  const reqTemplate = document.getElementById('requestsTemplate');
  if (reqTemplate) {
    const tplContent = reqTemplate.content;
    const h2 = tplContent.querySelector('h2');
    if (h2) h2.innerText = i18next.t('exchangeRequests');
    const recBtn = tplContent.getElementById('showReceived');
    if (recBtn) recBtn.innerText = i18next.t('received');
    const sentBtn = tplContent.getElementById('showSent');
    if (sentBtn) sentBtn.innerText = i18next.t('sent');
  }
  document.getElementById('openLoginModal').innerText = i18next.t('login');
  document.getElementById('openRegisterModal').innerText = i18next.t('register');
  const regLoginBtn = document.getElementById('openRegisterModalFromLogin');
  if (regLoginBtn) regLoginBtn.innerText = i18next.t('register');
  document.getElementById('logoutButton').innerText = i18next.t('logout');
  document.getElementById('searchInput').placeholder = i18next.t('searchPlaceholder');
  document.querySelector('.search-wrapper button').innerText = i18next.t('go');
  document.querySelector('.top-reps-box h2').innerText = i18next.t('topRatedMembers');
  document.querySelector('.popular-searches h2').innerText = i18next.t('popularSearches');
  document.querySelector('.content h2').innerText = i18next.t('connectTitle');
  document.querySelector('.content p').innerText = i18next.t('connectDescription');
}

// Re-render text when the user changes language
document.getElementById('languageSelector').addEventListener('change', (e) => {
  const selectedLang = e.target.value;
  i18next.changeLanguage(selectedLang, () => {
    updateContent();
  });
});
