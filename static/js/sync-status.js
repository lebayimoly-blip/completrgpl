document.addEventListener('DOMContentLoaded', () => {
  const tableBody = document.getElementById('pending-table');
  const status = document.getElementById('status-connexion').querySelector('strong');
  const syncBtn = document.getElementById('forceSyncBtn');

  // 🔎 Affiche l'état de la connexion navigateur
  function updateConnectionStatus() {
    status.textContent = navigator.onLine ? '🟢 En ligne' : '🔴 Hors ligne';
  }

  // 🔎 Charge et fusionne données locales + serveur
  async function loadData() {
    tableBody.innerHTML = '';

    // --- Données locales ---
    try {
      const localData = await getAllRecords();
      if (localData.length === 0) {
        tableBody.innerHTML += '<tr><td colspan="4">Aucune donnée locale en attente</td></tr>';
      } else {
        localData.forEach((item, index) => {
          const row = document.createElement('tr');
          row.innerHTML = `
            <td>L${index + 1}</td>
            <td>${item.nom || '-'}</td>
            <td>${item.quartier || '-'}</td>
            <td>${new Date().toLocaleString()}</td>
          `;
          tableBody.appendChild(row);
        });
      }
    } catch (err) {
      console.warn("Impossible de charger les données locales :", err);
    }

    // --- Données serveur ---
    try {
      const response = await fetch("/api/sync-status");
      if (!response.ok) throw new Error("Non authentifié ou erreur serveur");

      const data = await response.json();
      status.textContent = data.status;

      if (data.pending.length === 0) {
        tableBody.innerHTML += '<tr><td colspan="4">Aucune donnée serveur en attente</td></tr>';
      } else {
        data.pending.forEach((item, index) => {
          const row = document.createElement('tr');
          row.innerHTML = `
            <td>S${index + 1}</td>
            <td>${item.nom}</td>
            <td>${item.quartier}</td>
            <td>${item.date}</td>
          `;
          tableBody.appendChild(row);
        });
      }
    } catch (err) {
      console.warn("Impossible de charger les données serveur :", err);
    }
  }

  // 🔁 Forcer la synchronisation
  syncBtn.addEventListener('click', async () => {
    try {
      const response = await fetch("/api/force-sync", { method: "POST" });
      if (!response.ok) throw new Error("Erreur lors de la synchronisation");

      const data = await response.json();
      alert(data.message);

      // Recharger après synchro
      loadData();
    } catch (err) {
      alert("Échec de la synchronisation ❌");
    }
  });

  // Initialisation
  updateConnectionStatus();
  loadData();

  window.addEventListener('online', updateConnectionStatus);
  window.addEventListener('offline', updateConnectionStatus);
});
