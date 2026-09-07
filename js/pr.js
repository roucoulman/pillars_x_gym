
const boutonModifCoucher = document.getElementById('boutonModifCoucher');
const poidMaxCoucher = document.getElementById('poidMaxCoucher');

const boutonModifSquat = document.getElementById('boutonModifSquat');
const poidMaxSquat = document.getElementById('poidMaxSquat');

const boutonModifDeadlift = document.getElementById('boutonModifDeadlift');
const poidMaxDeadlift = document.getElementById('poidMaxDeadlift');

const boutonModifTractions = document.getElementById('boutonModifTractions');
const nbMaxTractions = document.getElementById('nbMaxTractions');


function attacherModifPR(bouton, elementAffichage, messagePrompt) {
    bouton.addEventListener('click', () => {
        const valeurEntree = prompt(messagePrompt);
        if (valeurEntree === null || valeurEntree.trim() === "") return;

        const nouvelleValeur = parseInt(valeurEntree, 10);
        if (!isNaN(nouvelleValeur)) {
            elementAffichage.textContent = nouvelleValeur;
        } else {
            alert("Entre un nombre valide");
        }
    });
}


function initialiserPR() {
    attacherModifPR(boutonModifCoucher, poidMaxCoucher, "Entre ton PR au développe coucher");
    attacherModifPR(boutonModifSquat, poidMaxSquat, "Entre ton PR au squat");
    attacherModifPR(boutonModifDeadlift, poidMaxDeadlift, "Entre ton PR au deadlift");
    attacherModifPR(boutonModifTractions, nbMaxTractions, "Entre ton nombre max de tractions");
}

initialiserPR();