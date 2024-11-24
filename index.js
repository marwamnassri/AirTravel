// Fonction pour rendre le menu de navigation responsive
const toggleMenu = () => {
    const toggleMenuButton = document.querySelector('.responsive-menu');
    const menu = document.querySelector('.menu');

    toggleMenuButton.addEventListener('click', () => {
        toggleMenuButton.classList.toggle('active');
        menu.classList.toggle('responsive');
    });
};

// Fonction pour gérer le formulaire de recherche de voyage
const handleSearchForm = () => {
    const searchForm = document.querySelector('.find_trip form');
    searchForm.addEventListener('submit', (e) => {
        e.preventDefault(); // Empêche l'actualisation de la page
        const country = searchForm.querySelector('input[placeholder="Entrez un Pays"]').value;
        const city = searchForm.querySelector('input[placeholder="Entrez une ville"]').value;
        const region = searchForm.querySelector('input[placeholder="Entrez une région"]').value;

        if (!country || !city || !region) {
            alert('Veuillez remplir tous les champs avant de chercher.');
        } else {
            alert(`Recherche en cours pour ${city}, ${region}, ${country}...`);
        }
    });
};

// Fonction pour gérer le formulaire de contact
const handleContactForm = () => {
    const contactForm = document.querySelector('#contact form');
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault(); // Empêche l'actualisation de la page
        alert('Votre message a été envoyé avec succès !');
        contactForm.reset(); // Réinitialise les champs du formulaire
    });
};

// Fonction principale pour initialiser toutes les interactions
const init = () => {
    toggleMenu();
    handleSearchForm();
    handleContactForm();
};

// Initialisation après le chargement du DOM
document.addEventListener('DOMContentLoaded', init);
