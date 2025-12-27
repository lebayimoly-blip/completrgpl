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
        }
      };
      reader.readAsDataURL(value);
    } else {
      record[key] = value;
    }
  }

  if (!hasFile) {
    storeRecord(record);
  }
}

function storeRecord(data) {
  openDatabase().then(db => {
    const tx = db.transaction(['pending'], 'readwrite');
    const store = tx.objectStore('pending');
    store.add(data);
    console.log("✅ Donnée enregistrée localement :", data);
  });
}
