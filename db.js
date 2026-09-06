// db.js

let db = null;

/**
 * Initialise la base de données SQLite WASM et charge le LocalStorage si existant.
 */
export async function initialiserSQLite() {
    await demanderStockagePersistant();


  const initSqlJs = window.initSqlJs;
  const SQL = await initSqlJs({
    locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
  });

  const savedDb = localStorage.getItem("sqlite_recup_db");
  if (savedDb) {
    const uInt8Array = new Uint8Array(JSON.parse(savedDb));
    db = new SQL.Database(uInt8Array);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS timers (
      muscle_id TEXT PRIMARY KEY,
      fin_timer INTEGER NOT NULL
    );
  `);

  sauvegarderBDDEnLocal();
}

async function demanderStockagePersistant() {
  if (navigator.storage && navigator.storage.persist) {
    const estPersistant = await navigator.storage.persisted();
    if (!estPersistant) {
      const autorise = await navigator.storage.persist();
      console.log(`Stockage persistant accordé : ${autorise}`);
    }
  }
}

/**
 * Sauvegarde la base SQLite sous forme de chaîne JSON dans LocalStorage.
 */
function sauvegarderBDDEnLocal() {
  if (!db) return;
  const data = db.export();
  const array = Array.from(data);
  localStorage.setItem("sqlite_recup_db", JSON.stringify(array));
}

/**
 * Récupère l'ensemble des timers enregistrés en BDD.
 * @returns {Record<string, number>} Un objet { muscle_id: fin_timer }
 */
export function chargerTimersSQL() {
  const timers = {};
  if (!db) return timers;

  const res = db.exec("SELECT muscle_id, fin_timer FROM timers;");
  if (res.length > 0) {
    const rows = res[0].values;
    rows.forEach(([muscle_id, fin_timer]) => {
      timers[muscle_id] = fin_timer;
    });
  }
  return timers;
}

/**
 * Insère ou met à jour le timer d'un muscle.
 */
export function verrouillerMuscleSQL(id, finTimer) {
  if (!db) return;
  const stmt = db.prepare("INSERT OR REPLACE INTO timers (muscle_id, fin_timer) VALUES (?, ?);");
  stmt.run([id, finTimer]);
  stmt.free();
  sauvegarderBDDEnLocal();
}

/**
 * Supprime le timer d'un muscle.
 */
export function deverrouillerMuscleSQL(id) {
  if (!db) return;
  const stmt = db.prepare("DELETE FROM timers WHERE muscle_id = ?;");
  stmt.run([id]);
  stmt.free();
  sauvegarderBDDEnLocal();
}