# Dental Localizer — Phase 2

Prototype 3D interactif de pré-localisation des gênes bucco-dentaires.

## Ce prototype ajoute

- Modèle 3D interactif de la cavité buccale
- 32 dents avec numérotation FDI
- Gencive marginale
- Crêtes alvéolaires / zones édentées
- Palais dur, voile du palais et rugae
- Langue
- Muqueuses labiales et jugales
- Plancher buccal
- Triangles rétromolaires
- Sélection multiple par toucher/clic
- Modes Patient denté / PPA / PAC
- Vues bouche complète / maxillaire / mandibule / tissus mous
- Résumé structuré des zones sélectionnées

## À savoir

Il s'agit d'un prototype procédural en Three.js, pas encore d'un modèle anatomique clinique haute résolution. Une prochaine itération pourra utiliser un modèle 3D anatomique dédié avec des surfaces distinctes pour chaque structure et chaque face dentaire.

## Installation

Aucune installation npm requise. Ouvrir `index.html` ou publier les fichiers sur GitHub Pages. Une connexion Internet est nécessaire pour charger Three.js et les polices depuis leurs CDN.


FIXED: this build corrects the 3D camera alignment and adds a fallback if the Three.js CDN is temporarily unavailable.
