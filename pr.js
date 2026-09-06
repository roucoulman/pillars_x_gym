const modifBouton = document.getElementById('modifBouton');
const poidMax = document.getElementById('poidMax');


function modifierPoids() {
    modifBouton.addEventListener('click', () => {
        const poidEntre = prompt("Entre ton PR");
        const nouveauPoid = parseInt(poidEntre);
            poidMax.textContent = nouveauPoid;
    });
}
