// main.js

// Assure-toi que db.js est chargé avant ce fichier dans le HTML
// Le formulaire doit avoir l'ID "familleForm"

if (!navigator.onLine) {
  debugPendingStore();
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('#familleForm');

  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();

      const formData = new FormData(form); // récupère tous les champs du formulaire

      if (navigator.onLine) {
        fetch('/familles/', {
          method: 'POST',
          body: formData // pas besoin de headers, le navigateur les ajoute automatiquement
        })
        .then(res => {
          if (!res.ok || !res.headers.get('content-type')?.includes('application/json')) {
            throw new Error('Réponse non JSON');
          }
          return res.json();
        })
        .then(response => {
          alert('Famille enregistrée avec succès !');
          form.reset();
        })
        .catch(err => {
          console.error('Erreur réseau ou serveur :', err);
          alert("Erreur lors de l’enregistrement. Données non envoyées.");
        });
      } else {
        saveRecord(form); // enregistre le formulaire complet, y compris les fichiers
        alert("Données enregistrées localement. Elles seront synchronisées dès que la connexion sera rétablie.");
        form.reset();
      }
    });
  }
});
