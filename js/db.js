// db.js

let db = null;

// Données initiales pour remplir la table la première fois
const MUSCLES_PAR_DEFAUT = [
  { id: 'pecs', name: 'Pectoraux', icon: "public/muscles/pecs.png" },
  { id: 'epaules', name: 'Épaules', icon: "public/muscles/epaule.png" },
  { id: 'reardelts', name: "Arrière épaule", icon: "public/muscles/reardelts.png" },
  { id: 'biceps', name: 'Biceps', icon: "public/muscles/biceps.png" },
  { id: 'dorsaux', name: 'Dorsaux', icon: "public/muscles/dorsaux.png" },
  { id: 'trapeze', name: 'Trapèze', icon: "public/muscles/trapeze.png" },
  { id: 'triceps', name: 'Triceps', icon: "public/muscles/triceps.png" },
  { id: 'quadriceps', name: 'Quadriceps', icon: "public/muscles/quadriceps.png" },
  { id: 'ischios', name: 'Ischios', icon: "public/muscles/ischios.png" },
  { id: 'fessiers', name: 'Fessiers', icon: "public/muscles/fessiers.png" },
  { id: 'mollets', name: 'Mollets', icon: "public/muscles/mollets.png" },
  { id: 'adducteur', name: 'Adducteur', icon: "public/muscles/adducteur.png" },
  { id: 'avant bras', name: 'Avant bras', icon: "public/muscles/avant-bras.png" },
  { id: 'abs', name: 'Abdos', icon: "public/muscles/abdos.png" }
];

export async function initialiserSQLite() {
  await demanderStockagePersistant();

  const initSqlJs = window.initSqlJs;
  const SQL = await initSqlJs({
    locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
  });

  const savedDb = localStorage.getItem("sqlite_recup_db");
  if (savedDb) {
    try {
      const uInt8Array = new Uint8Array(JSON.parse(savedDb));
      db = new SQL.Database(uInt8Array);
    } catch (e) {
      console.error("Erreur de chargement LocalStorage, nouvelle BDD.", e);
      db = new SQL.Database();
    }
  } else {
    db = new SQL.Database();
  }

  // 1. Table des muscles
  db.run(`
    CREATE TABLE IF NOT EXISTS muscles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      icon TEXT NOT NULL
    );
  `);

  // 2. Table des timers (simplifiée sans doublons de colonnes)
  db.run(`
    CREATE TABLE IF NOT EXISTS timers (
      muscle_id TEXT PRIMARY KEY,
      fin_timer INTEGER NOT NULL,
      FOREIGN KEY(muscle_id) REFERENCES muscles(id)
    );
  `);

  // 3. Insertion des muscles par défaut si la table est vide
  const res = db.exec("SELECT COUNT(*) FROM muscles;");
  const count = res[0].values[0][0];

  if (count === 0) {
    const stmt = db.prepare("INSERT INTO muscles (id, name, icon) VALUES (?, ?, ?);");
    MUSCLES_PAR_DEFAUT.forEach(m => {
      stmt.run([m.id, m.name, m.icon]);
    });
    stmt.free();
  }

  sauvegarderBDDEnLocal();
}

async function demanderStockagePersistant() {
  if (navigator.storage && navigator.storage.persist) {
    const estPersistant = await navigator.storage.persisted();
    if (!estPersistant) {
      await navigator.storage.persist();
    }
  }
}

function sauvegarderBDDEnLocal() {
  if (!db) return;
  const data = db.export();
  const array = Array.from(data);
  localStorage.setItem("sqlite_recup_db", JSON.stringify(array));
}

/**
 * Récupère la liste globale des muscles enrichie avec la fin du timer si actif.
 * @returns {Array<{id: string, name: string, icon: string, finTimer: number|null}>}
 */
export function chargerMusclesEtTimersSQL() {
  if (!db) return [];

  // Jointure pour récupérer le muscle et la date de fin du timer
  const query = `
    SELECT m.id, m.name, m.icon, t.fin_timer
    FROM muscles m
    LEFT JOIN timers t ON m.id = t.muscle_id;
  `;

  const res = db.exec(query);
  if (res.length === 0) return [];

  return res[0].values.map(([id, name, icon, finTimer]) => ({
    id,
    name,
    icon,
    finTimer: finTimer || null
  }));
}

/**
 * Verrouille un muscle (sauvegarde du timer).
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