// app.js
import { 
  initialiserSQLite, 
  chargerTimersSQL, 
  verrouillerMuscleSQL, 
  deverrouillerMuscleSQL 
} from './db.js';

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
let timers = {};

// Initialisation au démarrage
async function init() {
  await initialiserSQLite();
  timers = chargerTimersSQL();
  afficherGrille();
}

function verrouillerMuscle(id) {
  const finTimer = Date.now() + DUREE_RECUP_MS;
  timers[id] = finTimer;
  verrouillerMuscleSQL(id, finTimer);
  
  const muscle = muscles.find(m => m.id === id);
  if (muscle) mettreAJourCarte(muscle);
}

function deverrouillerMuscle(id, card) {
  delete timers[id];
  deverrouillerMuscleSQL(id);
  
  if (card) {
    card.classList.add('unlock-success');
    setTimeout(() => card.classList.remove('unlock-success'), 400);
  }

  const muscle = muscles.find(m => m.id === id);
  if (muscle) mettreAJourCarte(muscle);
  
  if (navigator.vibrate) navigator.vibrate(50);
}

// --- AFFICHAGE DE LA GRILLE ---
function afficherGrille() {
  if (!grid) return;
  grid.innerHTML = '';

  muscles.forEach(muscle => {
    const card = document.createElement('div');
    card.classList.add('card');
    card.id = `card-${muscle.id}`;

    let appuiTimer = null;
    let appuiLongValide = false;

    const demarrerAppui = () => {
      appuiLongValide = false;
      const maintenant = Date.now();

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

    const gererClic = () => {
      if (appuiLongValide) {
        appuiLongValide = false;
        return;
      }

      const maintenant = Date.now();
      if (!timers[muscle.id] || timers[muscle.id] <= maintenant) {
        verrouillerMuscle(muscle.id);
      }
    };

    // Événements tactiles et pointeur
    card.addEventListener('pointerdown', demarrerAppui);
    card.addEventListener('pointerup', annulerAppui);
    card.addEventListener('pointercancel', annulerAppui);
    card.addEventListener('pointerleave', annulerAppui);

    // Empêcher le menu contextuel natif lors d'un appui long
    card.addEventListener('contextmenu', (e) => e.preventDefault());

    card.onclick = gererClic;

    grid.appendChild(card);
    mettreAJourCarte(muscle);
  });
}

// --- MISE À JOUR D'UNE CARTE ---
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

// --- FORMATAGE DU TEMPS ---
function formaterTemps(ms) {
  const totalSecondes = Math.floor(ms / 1000);
  const heures = Math.floor(totalSecondes / 3600);
  const minutes = Math.floor((totalSecondes % 3600) / 60);
  const secondes = totalSecondes % 60;

  return `${heures}h ${minutes.toString().padStart(2, '0')}m ${secondes.toString().padStart(2, '0')}s`;
}

// Rafraîchissement automatique chaque seconde
setInterval(() => {
  muscles.forEach(muscle => mettreAJourCarte(muscle));
}, 1000);

// Démarrage de l'application
init();