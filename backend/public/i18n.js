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
      language: "Language"
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
      language: "Langue"
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

function updateContent() {
  document.querySelector('h1').innerText = i18next.t('headerTitle');
  document.querySelector('a.active').innerText = i18next.t('home');
  document.querySelectorAll('.nav-left a')[1].innerText = i18next.t('upload');
  document.querySelectorAll('.nav-left a')[2].innerText = i18next.t('viewListings');
  document.querySelectorAll('.nav-left a')[3].innerText = i18next.t('profile');
  document.getElementById('openLoginModal').innerText = i18next.t('login');
  document.getElementById('openRegisterModal').innerText = i18next.t('register');
  document.getElementById('searchInput').placeholder = i18next.t('searchPlaceholder');
  document.querySelector('.search-wrapper button').innerText = i18next.t('go');
  document.querySelector('.top-reps-box h2').innerText = i18next.t('topRatedMembers');
  document.querySelector('.popular-searches h2').innerText = i18next.t('popularSearches');
  document.querySelector('.content h2').innerText = i18next.t('connectTitle');
  document.querySelector('.content p').innerText = i18next.t('connectDescription');
}

document.getElementById('languageSelector').addEventListener('change', (e) => {
  const selectedLang = e.target.value;
  i18next.changeLanguage(selectedLang, () => {
    updateContent();
  });
});
