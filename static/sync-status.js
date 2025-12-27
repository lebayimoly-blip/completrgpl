document.addEventListener('DOMContentLoaded', () => {
  const tableBody = document.getElementById('pending-table');
  const status = document.getElementById('status-connexion').querySelector('strong');
  const syncBtn = document.getElementById('forceSyncBtn');

  // Affiche l'état de la connexion
  function updateConnectionStatus() {
    status.textContent = navigator.onLine ? '🟢 En ligne' : '🔴 Hors ligne';
  }

  // Charge les données en attente
  async function loadPendingData() {
    const data = await getAllRecords();
    tableBody.innerHTML = '';

    if (data.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="4">Aucune donnée en attente</td></tr>';
      return;
    }

    data.forEach((item, index) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${index + 1}</td>
        <td>${item.nom || '-'}</td>
        <td>${item.quartier || '-'}</td>
        <td>${new Date().toLocaleString()}</td>
      `;
      tableBody.appendChild(row);
    });
  }

  // Forcer la synchronisation
  syncBtn.addEventListener('click', () => {
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      navigator.serviceWorker.ready.then(sw => {
        sw.sync.register('sync-pending').then(() => {
          alert('Synchronisation déclenchée ✅');
        }).catch(err => {
          console.error('Erreur de synchronisation', err);
          alert('Impossible de déclencher la synchronisation.');
        });
      });
    } else {
      alert("La synchronisation en arrière-plan n'est pas supportée.");
    }
  });

  // Initialisation
  updateConnectionStatus();
  loadPendingData();

  window.addEventListener('online', updateConnectionStatus);
  window.addEventListener('offline', updateConnectionStatus);
});
