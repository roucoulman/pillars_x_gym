const muscles = [
  { id: 'pecs', name: 'Pectoraux', icon: "public/pecs.png" },
  { id: 'epaules', name: 'Épaules', icon: "public/epaule.png" },
  { id: 'reardelts', name: "Arrière épaule", icon: "public/reardelts.png" },
  { id: 'biceps', name: 'Biceps', icon: "public/biceps.png" },
  { id: 'dorsaux', name: 'Dorsaux', icon: "public/dorsaux.png" },
  { id: 'trapeze', name: 'Trapèze', icon: "public/trapeze.png" },
  { id: 'triceps', name: 'Triceps', icon: "public/triceps.png" },
  { id: 'quadriceps', name: 'Quadriceps', icon: "public/quadriceps.png" },
  { id: 'ischios', name: 'Ischios', icon: "public/ischios.png" },
  { id: 'fessiers', name: 'Fessiers', icon: "public/fessiers.png" },
  { id: 'mollets', name: 'Mollets', icon: "public/mollets.png" },
  { id: 'adducteur', name: 'Adducteur', icon: "public/adducteur.png" },
  { id: 'avant bras', name: 'Avant bras', icon: "public/avant-bras.png" },
  { id: 'abs', name: 'Abdos', icon: "public/abdos.png" }
];

const ICONE_CADENAS = "public/cadenas.png";
const DUREE_RECUP_MS = 72 * 60 * 60 * 1000; // 72h
const TEMPS_APPUI_LONG = 500; 

const grid = document.getElementById('grid');

let db = null; // Base SQLite WASM
let timers = {};

// --- 1. INITIALISATION DE SQLITE WASM ---
async function initialiserSQLite() {
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
  chargerDonneesEtAfficher();
}

function sauvegarderBDDEnLocal() {
  if (!db) return;
  const data = db.export();
  const array = Array.from(data);
  localStorage.setItem("sqlite_recup_db", JSON.stringify(array));
}

function chargerDonneesEtAfficher() {
  timers = {};
  const res = db.exec("SELECT muscle_id, fin_timer FROM timers;");
  
  if (res.length > 0) {
    const rows = res[0].values;
    rows.forEach(row => {
      const [muscle_id, fin_timer] = row;
      timers[muscle_id] = fin_timer;
    });
  }

  afficherGrille();
}

function verrouillerMuscleSQL(id, finTimer) {
  timers[id] = finTimer;
  const stmt = db.prepare("INSERT OR REPLACE INTO timers (muscle_id, fin_timer) VALUES (?, ?);");
  stmt.run([id, finTimer]);
  stmt.free();
  sauvegarderBDDEnLocal();
}

function deverrouillerMuscleSQL(id) {
  delete timers[id];
  const stmt = db.prepare("DELETE FROM timers WHERE muscle_id = ?;");
  stmt.run([id]);
  stmt.free();
  sauvegarderBDDEnLocal();
}

// --- 2. GESTION ROBUSTE DES ÉVÉNEMENTS (POINTER EVENTS) ---
function afficherGrille() {
  grid.innerHTML = '';

  muscles.forEach(muscle => {
    const card = document.createElement('div');
    card.classList.add('card');
    card.id = `card-${muscle.id}`;

    let appuiTimer = null;
    let appuiLongValide = false;

    const demarrerAppui = (e) => {
      // Empêche le menu contextuel natif du téléphone lors de l'appui long
      appuiLongValide = false;
      const maintenant = Date.now();

      // Si le muscle est verrouillé, préparer le déverrouillage
      if (timers[muscle.id] && timers[muscle.id] > maintenant) {
        card.classList.add('delocking');

        clearTimeout(appuiTimer);
        appuiTimer = setTimeout(() => {
          deverrouillerMuscle(muscle.id, card);
          appuiLongValide = true;
          card.classList.remove('delocking');
        }, TEMPS_APPUI_LONG);
      }
    };

    const annulerAppui = () => {
      clearTimeout(appuiTimer);
      card.classList.remove('delocking');
    };

    const gererClic = (e) => {
      // Si l'appui long a déclenché le déverrouillage, ignorer le clic simple
      if (appuiLongValide) {
        appuiLongValide = false;
        return;
      }

      const maintenant = Date.now();
      if (!timers[muscle.id] || timers[muscle.id] <= maintenant) {
        verrouillerMuscle(muscle.id);
      }
    };

    // Utilisation des Pointer Events (Unified Mouse & Touch API)
    card.addEventListener('pointerdown', demarrerAppui);
    card.addEventListener('pointerup', annulerAppui);
    card.addEventListener('pointercancel', annulerAppui);
    card.addEventListener('pointerleave', annulerAppui);

    // Empêcher la sélection/menu contextuel au clic long sur mobile
    card.addEventListener('contextmenu', (e) => e.preventDefault());

    // Clic simple pour verrouiller
    card.onclick = gererClic;

    grid.appendChild(card);
    mettreAJourCarte(muscle);
  });
}

// --- 3. ACTIONS & TIMERS ---
function verrouillerMuscle(id) {
  const finTimer = Date.now() + DUREE_RECUP_MS;
  verrouillerMuscleSQL(id, finTimer);
  
  const muscle = muscles.find(m => m.id === id);
  if (muscle) mettreAJourCarte(muscle);
}

function deverrouillerMuscle(id, card) {
  deverrouillerMuscleSQL(id);
  
  if (card) {
    card.classList.add('unlock-success');
    setTimeout(() => {
      card.classList.remove('unlock-success');
    }, 400);
  }

  const muscle = muscles.find(m => m.id === id);
  if (muscle) mettreAJourCarte(muscle);
  
  if (navigator.vibrate) navigator.vibrate(50);
}

function mettreAJourCarte(muscle) {
  const card = document.getElementById(`card-${muscle.id}`);
  if (!card) return;

  const finTimer = timers[muscle.id];
  const maintenant = Date.now();

  if (finTimer && finTimer > maintenant) {
    const tempsRestantMs = finTimer - maintenant;
    card.classList.add('locked');
    card.innerHTML = `
      <img src="${ICONE_CADENAS}" class="icon-img" alt="Verrouillé" />
      <span class="name">${muscle.name}</span>
      <span class="status">${formaterTemps(tempsRestantMs)}</span>
    `;
  } else {
    card.classList.remove('locked');
    card.innerHTML = `
      <img src="${muscle.icon}" class="icon-img" alt="${muscle.name}" />
      <span class="name">${muscle.name}</span>
    `;
  }
}

function formaterTemps(ms) {
  const totalSecondes = Math.floor(ms / 1000);
  const heures = Math.floor(totalSecondes / 3600);
  const minutes = Math.floor((totalSecondes % 3600) / 60);
  const secondes = totalSecondes % 60;

  return `${heures}h ${minutes.toString().padStart(2, '0')}m ${secondes.toString().padStart(2, '0')}s`;
}

// Rafraîchissement automatique
setInterval(() => {
  muscles.forEach(muscle => mettreAJourCarte(muscle));
}, 1000);

// Lancement
initialiserSQLite();