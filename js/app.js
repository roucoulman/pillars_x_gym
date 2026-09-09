// app.js
import { 
  initialiserSQLite, 
  chargerMusclesEtTimersSQL, 
  verrouillerMuscleSQL, 
  deverrouillerMuscleSQL 
} from './db.js';

const ICONE_CADENAS = "public/icons/cadenas.png";
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
  const muscle = listeMuscles.find(m => m.id === id);
  if (!muscle) return;

  // Calcul dynamique selon le temps_recup propre au muscle (en heures)
  const dureeMs = (muscle.temps_recup || 48) * 60 * 60 * 1000;
  const finTimer = Date.now() + dureeMs;
  
  verrouillerMuscleSQL(id, finTimer);
  
  rafraichirDonnees();
  const muscleAjour = listeMuscles.find(m => m.id === id);
  if (muscleAjour) mettreAJourCarte(muscleAjour);
}

function deverrouillerMuscle(id, card) {
  deverrouillerMuscleSQL(id);
  
  if (card) {
    card.classList.add('unlock-success');
    setTimeout(() => card.classList.remove('unlock-success'), 400);
  }

  rafraichirDonnees();
  const muscleAjour = listeMuscles.find(m => m.id === id);
  if (muscleAjour) mettreAJourCarte(muscleAjour);
  
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

    // Structure interne fixe pour éviter de re-générer le HTML et perdre les événements
    card.innerHTML = `
      <img src="${muscle.icon}" class="icon-img" alt="${muscle.name}" />
      <span class="name">${muscle.name}</span>
      <span class="status"></span>
    `;

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

    const gererClic = () => {
      if (appuiLongValide) {
        appuiLongValide = false;
        return;
      }

      const maintenant = Date.now();
      if (!muscle.finTimer || muscle.finTimer <= maintenant) {
        verrouillerMuscle(muscle.id);
      }
    };

    // Événements de pointage
    card.addEventListener('pointerdown', demarrerAppui);
    card.addEventListener('pointerup', annulerAppui);
    card.addEventListener('pointercancel', annulerAppui);
    card.addEventListener('pointerleave', annulerAppui);
    card.addEventListener('contextmenu', (e) => e.preventDefault());
    card.addEventListener('click', gererClic);

    grid.appendChild(card);
    mettreAJourCarte(muscle);
  });
}

// --- MISE À JOUR D'UNE CARTE ---
function mettreAJourCarte(muscle) {
  const card = document.getElementById(`card-${muscle.id}`);
  if (!card) return;

  const imgElem = card.querySelector('.icon-img');
  const statusElem = card.querySelector('.status');
  const maintenant = Date.now();

  if (muscle.finTimer && muscle.finTimer > maintenant) {
    const tempsRestantMs = muscle.finTimer - maintenant;
    card.classList.add('locked');
    
    if (imgElem) imgElem.src = ICONE_CADENAS;
    if (statusElem) statusElem.textContent = formaterTemps(tempsRestantMs);
  } else {
    // Si le timer est expiré mais toujours présent en mémoire
    if (muscle.finTimer && muscle.finTimer <= maintenant) {
      deverrouillerMuscle(muscle.id);
      return;
    }

    card.classList.remove('locked');
    if (imgElem) imgElem.src = muscle.icon;
    if (statusElem) statusElem.textContent = '';
  }
}

// --- FORMATAGE DU TEMPS ---
function formaterTemps(ms) {
  if (ms <= 0) return "0h 00m 00s";
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