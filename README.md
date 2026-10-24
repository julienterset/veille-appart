# Veille appartement

Page de suivi : https://julienterset.github.io/veille-appart/

## Où se trouve quoi

- **`regles.md`** : les critères de recherche et les règles de la veille. C'est la seule source : pour changer un critère, modifiez ce fichier.
- **`annonces.json`** : les annonces retenues (`annonces`) et l'historique des annonces retirées (`retirees`). Ce fichier est tenu à jour automatiquement, ne le modifiez pas à la main.
- **`index.html`** : la page affichée. Elle ne fait que présenter `annonces.json`, sans aucun filtrage métier.

Une tâche planifiée Claude passe toutes les heures de 7 h à 23 h. À chaque passage, elle relit `regles.md`, vérifie les annonces déjà listées, cherche les nouvelles (alertes Gmail et web), met à jour `annonces.json` et envoie une notification s'il y a du nouveau.

Les boutons « À suivre » et « Écarter » sont mémorisés dans le navigateur de chacun.
