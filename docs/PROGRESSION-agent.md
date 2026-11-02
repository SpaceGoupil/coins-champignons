# Journal d'avancement : refonte du modèle et de l'ergonomie

- **Dernière mise à jour :** 2026-11-02 04:45 (heure de Paris)
- **Statut :** terminé (A1-A6 et B1-B6 ; A7 non fait, voir plus bas). Rien n'est publié : trois commits locaux, à pousser seulement sur ta demande.
- **Référence :** `docs/BRIEF-agent-modele-ergonomie.md` (contraintes, architecture, livrables)
- **Reprise automatique :** désactivée, le travail est terminé.

## Résumé pour toi

**Modèle (chantier A)**
- **Réglage sur des récoltes réelles.** Chaque espèce a été réglée sur 69 à 80 récoltes réelles (GBIF, 2018-2025). Chaque changement est vérifié sur des années mises de côté ; ceux qui n'apportaient presque rien ont été écartés.
- **Ce que donne le réglage, sur ces années mises de côté** : cèpe de Bordeaux 0,80 → 0,81 ; cèpe des pins 0,67 → 0,69 ; cèpe d'été 0,78 → 0,82 ; girolle 0,66 → 0,70 ; pied de mouton 0,61 → 0,65. Le cèpe bronzé est inchangé, car le réglage ne faisait pas mieux. Le gain est réel mais modeste ; les chiffres plus flatteurs mesurés sur les observations du réglage lui-même sont optimistes.
- **Changements principaux.**
  - La pluie récente devient indispensable pour quatre espèces.
  - Le « choc thermique » ne compte plus pour les trois cèpes : il ne prévoyait rien.
  - L'optimum du cèpe de Bordeaux passe à 14,7 °C.
  - La girolle sort environ 6 jours après la pluie.
  - L'humidité du sol est mesurée pendant la pousse, après la pluie.
- **Erreur de données corrigée.** L'app lisait l'humidité du sol dans d'autres couches que celles du réglage, très différentes par endroits. Elle lit maintenant les mêmes.
- **Repères affichés.**
  - Fiabilité par espèce : bonne pour les cèpes de Bordeaux, d'été et bronzé ; moyenne pour le cèpe des pins et la girolle ; faible pour le pied de mouton.
  - Sens de chaque niveau : un jour « Abondant » donne de 2 à 11 fois plus de chances qu'un jour ordinaire selon l'espèce.
  - Détail : `docs/modele-2026-11.md`.

**Ergonomie et accessibilité (chantier B)**
- **Parcours en trois étapes** : ① où chercher (avec « Autour de moi »), ② quel champignon et quand, ③ les meilleurs coins, avec une phrase claire et un conseil par niveau. Les réglages avancés, dont les hexagones, sont repliés.
- **Préparer ma sortie** : un bouton enregistre les cartes, le relief, les routes et la météo des 5 meilleurs coins. Vérifié réseau coupé : la fiche d'un coin s'ouvre complète.
- **Mode terrain** : gros boutons, fort contraste, guidage GPS vers les coins (distance, direction, flèche orientée par la boussole du téléphone), sans réseau.
- **Accessibilité** : Lighthouse 100/100 en accessibilité et en bonnes pratiques. Sont corrigés les contrastes (dont les boutons du thème sombre, 2,3:1 → 8:1), les noms des boutons, les onglets, les panneaux, les cibles de 44 px et un dégradé plus lisible pour les daltoniens. Détail : `docs/audit-accessibilite.md`.

**Non vérifié**
- Pas de test sur un vrai téléphone : boussole, GPS réel, mode avion, TalkBack, grande taille de texte.
- Pas de test sur le terrain.

**Non fait**
- **A7** (arbres hôtes réglés sur les observations françaises) : il n'y a que 4 à 15 observations françaises par espèce, trop peu pour régler quoi que ce soit.

**Pour publier**
- Rien n'a été poussé sur GitHub. Dis-le si tu veux que je publie.

## Règles rappelées
- Commits **locaux** seulement, jamais de `git push` sans demande explicite de l'utilisateur.
- Incrémenter `CACHE` dans `sw.js` à chaque version de l'app (dernière : `coins-v26`).
- Vérifier dans le navigateur (émulation 375 × 812) avant de commiter.
- Quota Open-Meteo : archive, 1 requête toutes les 1,3 s au plus, 10 000 appels pondérés par jour.

## Où reprendre (à lire en premier)
**Tout est fait (voir le résumé).** Les points 1 à 4 ci-dessous sont gardés pour mémoire.
1. **A1, collecte en cours** : `node calibwx2.mjs` (dans `tools/calibration/`) tournait à 01:05. Il écrit `data/calibwx2.json` après chaque espèce. Si le fichier manque ou ne contient pas les 6 espèces, **relance-le** : il reprend où il s'est arrêté (≈ 2 requêtes par observation, 1,3 s d'écart, ~15 min en tout).
2. **A2-A3** : quand `data/calibwx2.json` est complet, lance `node banc2.mjs ../../index.html data/banc2-reference.json` (référence du modèle actuel). Les scripts `banc2.mjs` et `optim.mjs` sont écrits mais **pas encore testés** : corrige-les si besoin.
3. **A4** : `node optim.mjs ../../index.html` → `data/optim.json`. Les réglages ne sont « adoptés » que si la validation croisée par année progresse de plus de 0,005.
4. **A5-A6** : reporter les réglages adoptés dans `SP` d'`index.html` (`sp.wt` = poids propres à l'espèce, `sp.mp` = constantes `rw`, `choc`, `pet`, `lagT`), recaler `k` (médiane des jours d'observation ≈ 0,55), mettre à jour `docs/calibration-gbif.md`, l'onglet Méthode et les multiplicateurs par niveau donnés par `banc2.mjs`.

## Chantier A : modèle prédictif
- [x] **A1** Météo ERA5 élargie (d−200 → d+75) des 50 observations par espèce : `calibwx2.mjs` → `data/calibwx2.json` (6 × 50 observations, 276 jours, sans trou)
- [x] **A2** Banc v2 écrit et testé (`lib.mjs`, `banc2.mjs`) : témoins = jours de d−100 à d+75 hors ±10 j ; AUC « saison » et « proche » (±45 j) par observation ; groupes d'années ; multiplicateur par niveau. À tester.
- [x] **A3** Référence du modèle actuel (banc v2, 50 obs/espèce) : AUC saison / proche = cèpe de Bordeaux 0,834/0,827 ; cèpe des pins 0,665/0,602 ; cèpe d'été 0,828/0,764 ; cèpe bronzé 0,856/0,816 ; girolle 0,713/0,667 ; pied de mouton 0,575/0,511 → `data/banc2-reference.json`
- [x] **A4** Optimisation (`optim.mjs`) puis élagage (`ablation.mjs`, `variantes.mjs`) : réglages adoptés pour 5 espèces sur 6 (cèpe bronzé inchangé). Années mises de côté : 0,797 → 0,807 ; 0,669 → 0,691 ; 0,783 → 0,822 ; 0,659 → 0,698 ; 0,614 → 0,654. Détail : `docs/modele-2026-11.md`
- [x] **A5** Échelle : `k` recalé (médiane des trouvailles = 0,55) ; multiplicateurs par niveau (`sp.lift`) dans l'onglet Méthode et la légende ; fiabilité par espèce (`sp.rel`) à l'étape ②
- [x] **A6** Intégré dans `index.html` ; humidité du sol mesurée après la pluie ; couches de sol ERA5 (0-7, 7-28 cm) dans l'app comme dans le réglage ; onglet Méthode réécrit ; vérifié dans le navigateur ; commit
- [ ] **A7** Non fait : 4 à 15 observations françaises par espèce, trop peu pour régler les arbres hôtes

## Chantier B : ergonomie et accessibilité
- [x] **B1** Audit d'accessibilité initial → `docs/audit-accessibilite.md` (Lighthouse 100/100, mais 11 constats manuels)
- [x] **B2** Parcours guidé en 3 étapes (① où, ② quel champignon et quand, ③ meilleurs coins + phrase de synthèse), « Autour de moi », réglages avancés repliés
- [x] **B3** Accessibilité : contraste (gris 3,7 → 5,7:1 ; boutons du thème sombre 2,3 → 8:1), noms des boutons-icônes, étiquette de recherche, onglets ARIA, panneaux en dialogue (focus, Échap), messages annoncés, cibles 44 px, focus visible, « réduire les animations », dégradé plus lisible pour les daltoniens (palier crème, rouge final plus sombre), chiffres et mots en plus de la couleur
- [x] **B4** Accueil au premier lancement, niveaux reliés à une action (« ça vaut une sortie »…), fiabilité en clair, « meilleurs coins » au lieu de « zones chaudes », directions en toutes lettres, virgule décimale, niveau calculé sur la valeur affichée, carte enregistrée avec un ancien modèle signalée
- [x] **B5** « Préparer ma sortie » (cartes, altitude, routes, météo des 5 meilleurs coins ; vérifié réseau coupé) et mode terrain (gros boutons, contraste, guidage GPS et boussole)
- [x] **B6** Vérifié en 375 × 812, clair et sombre ; Lighthouse 100 / 100 ; audit final dans `docs/audit-accessibilite.md` ; commit

## Journal
- 00:55 Démarrage. Brief relu. Plan ci-dessus. Tâche de reprise programmée à 4 h 00.
- 00:58 `compute()` rendu paramétrable par espèce sans changer son comportement : constantes `MODEL` (`rw`, `choc`, `pet`, `lagT`) et réglages `sp.wt` / `sp.mp`. Ancien banc relancé : résultats identiques (AUC 0,86 / 0,72 / 0,86 / 0,84 / 0,67 / 0,58).
- 01:00 `lib.mjs` (chargement du modèle depuis index.html, évaluation, groupes d'années), `banc2.mjs`, `optim.mjs` écrits ; collecte `calibwx2.mjs` lancée.
- 01:05 Limite d'utilisation atteinte : pause. Commit local de l'état.
- 01:10 Collecte arrêtée par une réponse tronquée d'Open-Meteo après 4 espèces sur 6 (`edulis`, `pino`, `aest`, `aereus` dans `data/calibwx2.json`). Script rendu tolérant (nouvel essai) et relancé : il reprend à `girolle`. À 4 h, vérifier que `data/calibwx2.json` contient les 6 espèces, sinon relancer `node calibwx2.mjs`.
- 03:51 Reprise de la session d'origine (limite levée). A1 terminé : 300 observations complètes.
- 03:58 Échantillon trop concentré dans le temps (cèpe de Bordeaux : 50 obs. toutes de 2025). `gbifyears.mjs` ajoute 5 obs./an de 2018 à 2023 par espèce : 69 à 80 obs./espèce sur 2018-2025 (l'ancien fichier est gardé en `data/calibwx2-50.json`).
- 04:10 `compute()` accéléré dans l'app (facteurs du jour calculés une fois par jour, humidité minimale au fil de l'eau, sommes cumulées) : 5,5 ms par série de 276 jours, résultats strictement identiques sur les deux bancs.
- 04:05 Optimisation lancée en parallèle (une espèce par processus) → `data/optim-<espèce>.json`.
- 04:09 B1 et B3 (première partie) faits, vérifiés dans le navigateur (aucune erreur), commit local. Optimisation encore en cours.
- 04:13 Optimisation terminée. Pied de mouton : 0,614 → 0,654 sur les années mises de côté (adopté).
- 04:20 Plausibilité : `ablation.mjs` mesure l'apport de chaque changement ; ceux qui apportent moins de 0,003 sont écartés. Plancher de 0,2 pour le bilan hydrique (l'eau du sol pèse sur l'abondance, que des données de présence ne mesurent pas). Girolle : fenêtre de sortie gardée à 12 jours (elle reste en place longtemps).
- 04:24 Humidité du sol mesurée après le jour de la pluie (un sol sec avant l'orage ne pénalise plus la poussée) : +0,01 pour la girolle, neutre ailleurs. Réglages intégrés, `k` recalé, fiabilité et multiplicateurs par niveau ajoutés.
- 04:30 Constat : l'app lisait l'humidité du sol en couches 3-9 / 9-27 cm, très différentes par endroits de l'ERA5 du réglage (Limousin 0,45 contre 0,72). Elle lit maintenant les couches 0-7 / 7-28 cm, identiques à ERA5 (vérifié sur 3 lieux, prévision comprise). Points de grille météo anciens rechargés automatiquement.
- 04:36 Onglet Méthode réécrit, `docs/modele-2026-11.md`, vérification dans le navigateur (mobile, aucune erreur nouvelle ; les 429 vus au chargement venaient d'une session précédente). Commit local (A4-A6 + parcours guidé B2/B4). `CACHE` = `coins-v25`.
- 04:40 B3 : dégradé de la carte revu pour les daltoniens (simulation de Machado 2009) ; B4 : langue courante, virgule décimale, niveaux cohérents avec le chiffre affiché ; cartes calculées avec l'ancien modèle signalées.
- 04:42 B5 : « Préparer ma sortie » (362 tuiles, relief, routes, météo des 5 meilleurs coins en 11 s ; fiche d'un coin vérifiée réseau coupé) et mode terrain (guidage GPS, boussole, 56 px, contraste 15:1).
- 04:44 B6 : Lighthouse 100 / 100 (accessibilité, bonnes pratiques) ; thème sombre : boutons principaux corrigés (2,3 → 8:1) ; aucune erreur. Audit final rédigé. Commit local, `CACHE` = `coins-v26`. Statut : terminé.
