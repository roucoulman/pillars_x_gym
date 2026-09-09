document.addEventListener('DOMContentLoaded', () => {
    const boutonModifCoucher = document.getElementById('boutonModifCoucher');
    const poidMaxCoucher = document.getElementById('poidMaxCoucher');

    const boutonModifSquat = document.getElementById('boutonModifSquat');
    const poidMaxSquat = document.getElementById('poidMaxSquat');

    const boutonModifDeadlift = document.getElementById('boutonModifDeadlift');
    const poidMaxDeadlift = document.getElementById('poidMaxDeadlift');

    const boutonModifTractions = document.getElementById('boutonModifTractions');
    const nbMaxTractions = document.getElementById('nbMaxTractions');

    function attacherModifPR(bouton, elementAffichage, messagePrompt) {      
        bouton.addEventListener('click', async () => {
            const { value: valeurEntree } = await Swal.fire({
                title: 'Mettre à jour le PR',
                input: 'number',
                showCancelButton: true,
                confirmButtonText: 'Valider',
                cancelButtonText: 'Annuler',
                confirmButtonColor: '#22DB18',
                cancelButtonColor: '#E00F09',
            });
            if (valeurEntree === null) return;
            const nouvelleValeur = parseInt(valeurEntree, 10);
            
            if (!isNaN(nouvelleValeur)) {
                elementAffichage.textContent = nouvelleValeur;
            } }); }
    function initialiserPR() {
        attacherModifPR(boutonModifCoucher, poidMaxCoucher, "Entre ton PR au développé couché");
        attacherModifPR(boutonModifSquat, poidMaxSquat, "Entre ton PR au squat");
        attacherModifPR(boutonModifDeadlift, poidMaxDeadlift, "Entre ton PR au deadlift");
        attacherModifPR(boutonModifTractions, nbMaxTractions, "Entre ton nombre max de tractions");
    }
    initialiserPR();
});