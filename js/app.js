// app.js
import { 
  initialiserSQLite, 
  chargerMusclesEtTimersSQL, 
  verrouillerMuscleSQL, 
  deverrouillerMuscleSQL 
} from './db.js';

const ICONE_CADENAS = "public/icons/cadenas.png";
const DUREE_RECUP_MS = 72 * 60 * 60 * 1000; // 72h
const TEMPS_APPUI_LONG = 500; 

const grid = document.getElementById('grid');

let listeMuscles = [];

async function init() {
  await initialiserSQLite();
  rafraichirDonnees();
  afficherGrille();
}

function rafraichirDonnees() {
  listeMuscles = chargerMusclesEtTimersSQL();
}

function verrouillerMuscle(id) {
  const finTimer = Date.now() + DUREE_RECUP_MS;
  verrouillerMuscleSQL(id, finTimer);
  
  rafraichirDonnees();
  const muscle = listeMuscles.find(m => m.id === id);
  if (muscle) mettreAJourCarte(muscle);
}

function deverrouillerMuscle(id, card) {
  deverrouillerMuscleSQL(id);
  
  if (card) {
    card.classList.add('unlock-success');
    setTimeout(() => card.classList.remove('unlock-success'), 400);
  }

  rafraichirDonnees();
  const muscle = listeMuscles.find(m => m.id === id);
  if (muscle) mettreAJourCarte(muscle);
  
  if (navigator.vibrate) navigator.vibrate(50);
}

// --- AFFICHAGE DE LA GRILLE ---
function afficherGrille() {
  if (!grid) return;
  grid.innerHTML = '';

  listeMuscles.forEach(muscle => {
    const card = document.createElement('div');
    card.classList.add('card');
    card.id = `card-${muscle.id}`;

    let appuiTimer = null;
    let appuiLongValide = false;

    const demarrerAppui = () => {
      appuiLongValide = false;
      const maintenant = Date.now();

      if (muscle.finTimer && muscle.finTimer > maintenant) {
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
      // Si un déverrouillage vient de s'exécuter sur l'appui long, on ne fait rien
      if (appuiLongValide) {
        appuiLongValide = false;
        return;
      }

      const maintenant = Date.now();
      if (!muscle.finTimer || muscle.finTimer <= maintenant) {
        verrouillerMuscle(muscle.id);
      }
    };

    // Événements de pointage (souris + tactile)
    card.addEventListener('pointerdown', demarrerAppui);
    card.addEventListener('pointerup', annulerAppui);
    card.addEventListener('pointercancel', annulerAppui);
    card.addEventListener('pointerleave', annulerAppui);

    // Empêche le menu contextuel natif lors d'un appui long
    card.addEventListener('contextmenu', (e) => e.preventDefault());
    
    // Événement de clic unique
    card.addEventListener('click', gererClic);

    grid.appendChild(card);
    mettreAJourCarte(muscle);
  });
}

// --- MISE À JOUR D'UNE CARTE ---
function mettreAJourCarte(muscle) {
  const card = document.getElementById(`card-${muscle.id}`);
  if (!card) return;

  const maintenant = Date.now();

  if (muscle.finTimer && muscle.finTimer > maintenant) {
    const tempsRestantMs = muscle.finTimer - maintenant;
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

// Rafraîchissement chaque seconde
setInterval(() => {
  listeMuscles.forEach(muscle => mettreAJourCarte(muscle));
}, 1000);

init();