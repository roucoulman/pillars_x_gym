const modifBouton = document.getElementById('modifBouton');
const poidMax = document.getElementById('poidMax');

function modifPR() {
    modifBouton.addEventListener('click', () => {
        const poidEntre = prompt("Entre ton PR");
        if (poidEntre===null) return;
        const nouveauPoid = parseInt(poidEntre);
        poidMax.textContent = nouveauPoid;
    });
}

modifPR();


