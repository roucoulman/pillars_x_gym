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
            const aujourdHui = new Date().toISOString().split('T')[0];
            const { value: valeurs } = await Swal.fire({
                title: 'Mettre à jour le PR',
                html: `
                    <div style="text-align: left; margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; color: #fff;">${messagePrompt}</label>
                        <input id="inp-valeur" type="number" class="swal2-input" placeholder="Valeur" style="margin: 0 auto; width: 80%; display: block;">
                    </div>
                    <div style="text-align: left;">
                        <label style="display: block; margin-bottom: 5px; color: #fff;">Date de réalisation</label>
                        <input id="inp-date" type="date" value="${aujourdHui}" style="margin: 0 auto; width: 80%; display: block; padding: 10px; background: #3a3a3a; color: #fff; border: 1px solid #555; border-radius: 4px; font-size: 1em; box-sizing: border-box;">
                    </div>
                `,
                showCancelButton: true,
                confirmButtonText: 'Valider',
                cancelButtonText: 'Annuler',
                confirmButtonColor: '#1D420B',
                cancelButtonColor: '#420B0B',
                color: '#fff',
                preConfirm: () => {
                    const valeurEntree = document.getElementById('inp-valeur').value;
                    const dateEntree = document.getElementById('inp-date').value;
                    if (!valeurEntree) {
                        Swal.showValidationMessage('Entrer une valeur valide');
                        return false;
                    }
                    if (!dateEntree) {
                        Swal.showValidationMessage('Sélectionner une date');
                        return false;
                    }
                    return {
                        valeur: parseInt(valeurEntree, 10),
                        date: dateEntree
                    };
                }
            });
            
            if (!valeurs) return;
            const nouvelleValeur = valeurs.valeur;
            const dateRealisation = valeurs.date;
            
            if (!isNaN(nouvelleValeur)) {
                elementAffichage.textContent = nouvelleValeur;
            }
        }); 
    }

    function initialiserPR() {
        attacherModifPR(boutonModifCoucher, poidMaxCoucher, "Entre ton PR au développé couché");
        attacherModifPR(boutonModifSquat, poidMaxSquat, "Entre ton PR au squat");
        attacherModifPR(boutonModifDeadlift, poidMaxDeadlift, "Entre ton PR au deadlift");
        attacherModifPR(boutonModifTractions, nbMaxTractions, "Entre ton nombre max de tractions");
    }
    
    initialiserPR();
});