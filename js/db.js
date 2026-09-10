// db.js

let db = null;

// Données initiales pour remplir la table la première fois
const MUSCLES_PAR_DEFAUT = [
  { id: 'epaules', name: 'Épaules', icon: "public/muscles/epaule.png", temps_recup_h: 48 },
  { id: 'pecs', name: 'Pectoraux', icon: "public/muscles/pecs.png", temps_recup: 72 },
  { id: 'reardelts', name: "Arrière épaule", icon: "public/muscles/reardelts.png", temps_recup: 48 },
  { id: 'dorsaux', name: 'Dorsaux', icon: "public/muscles/dorsaux.png", temps_recup: 72 },
  { id: 'abs', name: 'Abdos', icon: "public/muscles/abdos.png", temps_recup: 48 },
  { id: 'trapeze', name: 'Trapèze', icon: "public/muscles/trapeze.png", temps_recup: 48 },
  { id: 'biceps', name: 'Biceps', icon: "public/muscles/biceps.png", temps_recup: 48 },
  { id: 'triceps', name: 'Triceps', icon: "public/muscles/triceps.png", temps_recup: 48 },
  { id: 'avant bras', name: 'Avant bras', icon: "public/muscles/avant-bras.png", temps_recup: 48 },
  { id: 'quadriceps', name: 'Quadriceps', icon: "public/muscles/quadriceps.png", temps_recup: 72 },
  { id: 'ischios', name: 'Ischios', icon: "public/muscles/ischios.png", temps_recup: 72 },
  { id: 'adducteur', name: 'Adducteur', icon: "public/muscles/adducteur.png", temps_recup: 48 },
  { id: 'fessiers', name: 'Fessiers', icon: "public/muscles/fessiers.png", temps_recup: 72 },
  { id: 'mollets', name: 'Mollets', icon: "public/muscles/mollets.png", temps_recup: 48 }
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
  } 
  else {
    db = new SQL.Database();
  }

  // Création des tables (sans DROP TABLE)
  db.run(`
    CREATE TABLE IF NOT EXISTS muscles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      icon TEXT NOT NULL,
      temps_recup_h INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS timers (
      muscle_id TEXT PRIMARY KEY,
      fin_timer INTEGER NOT NULL,
      FOREIGN KEY(muscle_id) REFERENCES muscles(id)
    );

    CREATE TABLE IF NOT EXISTS PR ( 
      exercice TEXT PRIMARY KEY
    );

    CREATE TABLE IF NOT EXISTS Historique ( 
      exercice TEXT,
      dates DATE, 
      valeur INTEGER NOT NULL,
      PRIMARY KEY (exercice, dates),
      CONSTRAINT Historique_fk_exercice FOREIGN KEY (exercice) REFERENCES PR(exercice)
    );
  `);

  // Insertion des muscles par défaut si la table est vide
  const res = db.exec("SELECT COUNT(*) FROM muscles;");
  const count = res[0].values[0][0];

 if (count === 0) {
  const stmt = db.prepare("INSERT INTO muscles (id, name, icon, temps_recup_h) VALUES (?, ?, ?, ?);");
  MUSCLES_PAR_DEFAUT.forEach(m => {
    stmt.run([
      m.id ?? "", 
      m.name ?? "", 
      m.icon ?? "", 
      m.temps_recup ?? 48 // Valeur par défaut si undefined
    ]);
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
 * Récupère la liste globale des muscles avec leur temps de recup et la fin du timer si actif.
 */
export function chargerMusclesEtTimersSQL() {
  if (!db) return [];

  const query = `
    SELECT m.id, m.name, m.icon, m.temps_recup_h, t.fin_timer
    FROM muscles m
    LEFT JOIN timers t ON m.id = t.muscle_id;
  `;

  const res = db.exec(query);
  if (res.length === 0) return [];

  return res[0].values.map(([id, name, icon, temps_recup_h, finTimer]) => ({
    id,
    name,
    icon,
    temps_recup: temps_recup_h,
    finTimer: finTimer || null
  }));
}

/**
 * Verrouille un muscle (sauvegarde du timer).
 */
export function verrouillerMuscleSQL(id, finTimer) {
  if (!db || !id || finTimer === undefined) {
    console.error("Données invalides pour verrouillerMuscleSQL:", { id, finTimer });
    return;
  }
  
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