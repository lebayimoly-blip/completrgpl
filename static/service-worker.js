const CACHE_NAME = 'rgpl-cache-v2'; // ⚡ incrémente la version pour forcer le refresh

const OFFLINE_URLS = [
  '/', '/home', '/login', '/page-famille-edit', '/page-familles',
  '/page-utilisateurs', '/page-stats', '/doublons', '/synchronisation',
  '/zone-travail', '/zones-attribuees', '/unauthorized', '/offline.html',

  // fichiers statiques
  '/static/style.css', '/static/js/db.js', '/static/js/main.js',
  '/static/icons/icons.svg', '/static/images/rgpl.png',

  // templates accessibles directement (si routés)
  '/add_membre.html', '/admin_dashboard.html', '/base.html',
  '/doublons.html', '/edit_famille.html', '/familles.html',
  '/famille_detail.html', '/famille_edit.html', '/index.html',
  '/login.html', '/stats.html', '/synchronisation.html',
  '/unauthorized.html', '/utilisateurs.html',
  '/zones_attribuees.html', '/zone_travail.html'
];

// INSTALLATION : mise en cache des ressources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      for (const url of OFFLINE_URLS) {
        try {
          await cache.add(url);
        } catch (err) {
          console.warn(`Échec du cache pour ${url}`, err);
        }
      }
    })
  );
  self.skipWaiting(); // ⚡ active immédiatement le nouveau SW
});

// ACTIVATION : suppression des anciens caches et prise de contrôle
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key); // 🧹 supprime les anciens caches
          }
        })
      )
    )
  );
  clients.claim(); // ⚡ prend le contrôle des pages ouvertes
});

// FETCH : laisser la stratégie normale (réseau par défaut)
self.addEventListener('fetch', event => {
  // Ne rien intercepter → le navigateur gère normalement
});

// SYNC : synchronisation des données en attente
self.addEventListener('sync', event => {
  if (event.tag === 'sync-pending') {
    event.waitUntil(syncPendingData());
  }
});

// FONCTION DE SYNCHRONISATION
async function syncPendingData() {
  const db = await openDB('rgpl-db', 1);
  const tx = db.transaction('pending', 'readonly');
  const store = tx.objectStore('pending');
  const allData = await store.getAll();

  for (const item of allData) {
    try {
      await fetch('/api/sync', {
        method: 'POST',
        body: JSON.stringify(item),
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } catch (err) {
      console.error('Sync échoué pour un élément', err);
    }
  }

  const clearTx = db.transaction('pending', 'readwrite');
  clearTx.objectStore('pending').clear();
}
