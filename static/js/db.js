// static/js/db.js
const DB_NAME = 'rgpl-db';
const DB_VERSION = 1;
const STORE_NAME = 'pending';

let db;

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = event => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { autoIncrement: true });
      }
    };

    request.onsuccess = event => {
      db = event.target.result;
      resolve(db);
    };

    request.onerror = event => {
      reject('Erreur ouverture IndexedDB', event.target.errorCode);
    };
  });
}

function saveRecord(formElement) {
  const formData = new FormData(formElement);
  const record = {};

  const entries = Array.from(formData.entries());
  let pendingFiles = 0;
  let hasFile = false;

  for (const [key, value] of entries) {
    if (value instanceof File && value.name) {
      hasFile = true;
      pendingFiles++;
      const reader = new FileReader();
      reader.onload = function () {
        record[key] = {
          name: value.name,
          type: value.type,
          data: reader.result // base64
        };
        pendingFiles--;
        if (pendingFiles === 0) {
          storeRecord(record);
          sendToServer(record); // 🚀 envoi vers Render
        }
      };
      reader.readAsDataURL(value);
    } else {
      record[key] = value;
    }
  }

  if (!hasFile) {
    storeRecord(record);
    sendToServer(record); // 🚀 envoi vers Render
  }
}

function storeRecord(data) {
  openDatabase().then(db => {
    const tx = db.transaction([STORE_NAME], 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.add(data);
    console.log("✅ Donnée enregistrée localement :", data);
  });
}

// 🚀 Nouvelle fonction : envoi vers ton API FastAPI (Render)
async function sendToServer(data) {
  try {
    const response = await fetch("/api/force-sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    if (!response.ok) throw new Error("Erreur serveur");
    const result = await response.json();
    console.log("✅ Donnée envoyée au serveur :", result);
  } catch (err) {
    console.warn("❌ Impossible d'envoyer au serveur, donnée gardée en local :", err);
  }
}
