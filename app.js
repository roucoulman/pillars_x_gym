const muscles = [
  { id: 'pecs', name: 'Pectoraux', icon: "public/pecs.png" },
  { id: 'epaules', name: 'Épaules', icon: "public/epaule.png" },
  { id: 'reardelts', name: "arrière d'épaule", icon: "public/reardelts.png" },
  { id: 'biceps', name: 'Biceps', icon: "public/biceps.png" },
  { id: 'dorsaux', name: 'dorsaux', icon: "public/dorsaux.png" },
  { id: 'trapeze', name: 'trapeze', icon: "public/trapeze.png" },
  { id: 'triceps', name: 'Triceps', icon: "public/triceps.png" },
  { id: 'quadriceps', name: 'Quadriceps', icon: "public/quadriceps.png" },
  { id: 'ischios', name: 'ischios', icon: "public/ischios.png" },
  { id: 'fessiers', name: 'fessiers', icon: "public/fessiers.png" },
  { id: 'mollets', name: 'mollets', icon: "public/mollets.png" },
  { id: 'adducteur', name: 'adducteur', icon: "public/adducteur.png" },
  { id: 'avant bras', name: 'avant bras', icon: "public/avant-bras.png" },
  { id: 'abs', name: 'Abdos', icon: "public/abdos.png" }
];

const ICONE_CADENAS = "public/cadenas.png";
const DUREE_RECUP_H = 72;

; // 72h
const TEMPS_APPUI_LONG = 300; 

const grid = document.getElementById('grid');

let timers = JSON.parse(localStorage.getItem('recup_timers')) || {};
let appuiTimer = null;
let estTactile = false; // Flag pour isoler le tactile du pointer/souris

function afficherGrille() {
  grid.innerHTML = '';

  muscles.forEach(muscle => {
    const card = document.createElement('div');
    card.classList.add('card');
    card.id = `card-${muscle.id}`;

    let appuiLongDeclenche = false; // Scope local par carte pour éviter les collisions

    const demarrerAppui = (e) => {
      // Ignorer la souris si l'événement provient du tactile
      if (e.type === 'mousedown' && estTactile) return;
      if (e.type === 'touchstart') estTactile = true;

      appuiLongDeclenche = false;
      const maintenant = Date.now();

      if (timers[muscle.id] && timers[muscle.id] > maintenant) {
        card.classList.add('delocking');

        clearTimeout(appuiTimer);
        appuiTimer = setTimeout(() => {
          deverrouillerMuscle(muscle.id, card);
          appuiLongDeclenche = true;
          card.classList.remove('delocking');
        }, TEMPS_APPUI_LONG);
      }
    };

    const annulerAppui = () => {
      clearTimeout(appuiTimer);
      card.classList.remove('delocking');
    };

    const gererClicSimple = (e) => {
      // Annule le clic court si l'appui long a été validé
      if (appuiLongDeclenche) {
        e.preventDefault();
        e.stopPropagation();
        appuiLongDeclenche = false;
        return;
      }

      const maintenant = Date.now();
      if (!timers[muscle.id] || timers[muscle.id] <= maintenant) {
        verrouillerMuscle(muscle.id);
      }
    };

    // Événements tactiles
    card.addEventListener('touchstart', demarrerAppui, { passive: true });
    card.addEventListener('touchend', annulerAppui);
    card.addEventListener('touchcancel', annulerAppui);

    // Événements souris
    card.addEventListener('mousedown', demarrerAppui);
    card.addEventListener('mouseup', annulerAppui);
    card.addEventListener('mouseleave', annulerAppui);

    // Clic simple
    card.onclick = gererClicSimple;

    grid.appendChild(card);
    mettreAJourCarte(muscle);
  });
}

function verrouillerMuscle(id) {
  timers[id] = Date.now() + DUREE_RECUP_H* 60 * 60 * 1000;
  sauvegarderEtRendre(id);
}

function deverrouillerMuscle(id, card) {
  delete timers[id];
  
  if (card) {
    card.classList.add('unlock-success');
    setTimeout(() => {
      card.classList.remove('unlock-success');
    }, 400);
  }

  sauvegarderEtRendre(id);
  if (navigator.vibrate) navigator.vibrate(50);
}

function sauvegarderEtRendre(id) {
  localStorage.setItem('recup_timers', JSON.stringify(timers));
  const muscle = muscles.find(m => m.id === id);
  if (muscle) mettreAJourCarte(muscle);
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
      <span class="status">Frais</span>
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

setInterval(() => {
  muscles.forEach(muscle => mettreAJourCarte(muscle));
}, 1000);

afficherGrille();