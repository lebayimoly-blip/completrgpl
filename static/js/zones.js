// static/js/zones.js

async function importZones() {
  const fileInput = document.getElementById("zoneFile");
  const file = fileInput.files[0];
  if (!file) {
    alert("Veuillez sélectionner un fichier CSV ou Excel.");
    return;
  }

  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await fetch("/api/import-zones", {
      method: "POST",
      body: formData
    });

    if (!response.ok) throw new Error("Erreur serveur");

    const data = await response.json();
    alert(data.message || "Zones importées avec succès ✅");

    // Optionnel : afficher les zones importées sur la carte
    if (data.zones) {
      data.zones.forEach(z => {
        L.geoJSON(z.geojson).addTo(map);
      });
    }
  } catch (err) {
    console.error("Erreur import :", err);
    alert("Échec de l'import des zones ❌");
  }
}
