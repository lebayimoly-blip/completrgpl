document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.querySelector('#loginForm');

  if (!loginForm) return;

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.querySelector('#username').value.trim();
    const password = document.querySelector('#password').value.trim();

    if (!username || !password) {
      alert("Veuillez remplir tous les champs.");
      return;
    }

    const credentials = { username, password };

    if (navigator.onLine) {
      // Connexion en ligne
      try {
        const res = await fetch('/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(credentials)
        });

        if (res.ok) {
          // Stocker les identifiants localement (⚠️ version simple)
          localStorage.setItem('authUser', JSON.stringify(credentials));
          window.location.href = '/home';
        } else {
          alert("Identifiants incorrects. Veuillez réessayer.");
        }
      } catch (err) {
        console.error("Erreur réseau :", err);
        alert("Erreur de connexion au serveur.");
      }
    } else {
      // Connexion hors ligne
      const saved = JSON.parse(localStorage.getItem('authUser'));

      if (
        saved &&
        saved.username === credentials.username &&
        saved.password === credentials.password
      ) {
        alert("Connexion hors ligne réussie ✅");
        window.location.href = '/home';
      } else {
        alert("Connexion impossible hors ligne. Veuillez vous connecter une fois en ligne.");
      }
    }
  });
});
