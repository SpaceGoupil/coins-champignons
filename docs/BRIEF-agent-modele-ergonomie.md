# Brief : refonte du modèle prédictif et de l'ergonomie de « Coins à champignons »

Ce document s'adresse à un agent qui reprend le projet. Il décrit l'état réel de l'app au 2 novembre 2026, ce qui a été mesuré, et ce qu'il reste à repenser sur deux chantiers :

- **A.** le calcul des indices (modèle prédictif) ;
- **B.** l'ergonomie, pour rendre l'app accessible au plus grand nombre.

Les deux chantiers sont indépendants et peuvent être menés dans l'ordre que tu veux. Lis d'abord les sections 1 à 3, communes aux deux.

---

## 1. Le projet en bref

- **But** : indiquer où et quand chercher six champignons comestibles. L'app calcule un indice de pousse de 0 à 100 à partir de la météo passée et prévue, du relief, de la forêt et du sol. Elle l'affiche sur une carte IGN et doit fonctionner **sur le terrain, sans réseau**.
- **Utilisateur** : un cueilleur, sur Android (Samsung, Chrome). Il cherche surtout dans le **Couserans (Ariège, Pyrénées)**.
- **En ligne** : https://spacegoupil.github.io/coins-champignons/ (GitHub Pages, dépôt public `SpaceGoupil/coins-champignons`, branche `main`).
- **Espèces** (clés du code) :
  - `edulis` : cèpe de Bordeaux ;
  - `pino` : cèpe des pins ;
  - `aest` : cèpe d'été ;
  - `aereus` : cèpe bronzé ;
  - `girolle` : girolle ;
  - `pdm` : pied de mouton.
  - S'y ajoute `all`, la moyenne des six.

### Contraintes à respecter (fixées par l'utilisateur)

- **Format :** un **seul fichier** `index.html`, sans framework ni étape de build. Leaflet 1.9.4 est intégré dans le fichier. Le découper en `index.html` / `app.js` / `style.css` est permis si ça aide la maintenance, mais toujours sans build.
- **Interface** en **français**, pensée d'abord pour le mobile, en thème clair et sombre.
- **Services :** **aucune clé d'API, aucun serveur à soi**, seulement des services publics.
- **Vie privée :** on n'envoie rien d'autre que les coordonnées strictement nécessaires aux services.
- **Avertissement :** garder la mention que les indices sont **indicatifs**.
- **Publication :** ne pousser sur GitHub **que sur demande explicite** de l'utilisateur. Commiter en local est permis.

### Procédure de publication (quand elle est demandée)

- **Cache :** incrémenter `const CACHE = "coins-vNN"` dans `sw.js` à chaque version (dernière en date : `coins-v22`).
- **Envoi :** le gestionnaire d'identifiants Windows renvoie un autre compte (`Kabine1`, refusé en 403). Pousser avec :
  `git -c credential.helper= -c credential.helper='!gh auth git-credential' push origin main`
- **Vérification :** suivre la reconstruction avec `gh api repos/SpaceGoupil/coins-champignons/pages/builds/latest`, puis contrôler la page en ligne.

### Tester en local

- Lancer `python -m http.server 8765 --bind 127.0.0.1 --directory .` puis ouvrir http://localhost:8765/.
- Tester en émulation mobile (375 × 812).
- Le pare-feu Windows bloque les connexions entrantes : le téléphone ne peut pas joindre le PC. Pour tester sur le téléphone, il faut publier.

---

## 2. Sources de données (toutes vérifiées en réel)

| Donnée | Service | Pièges connus |
|---|---|---|
| Recherche de lieux | IGN `data.geopf.fr/geocodage/completion` et `/search`, Open-Meteo en secours | — |
| Altitude ponctuelle | IGN `altimetrie/1.0/calcul/alti/rest/elevation.json`, ressource **`ign_rge_alti_wld`** | 200 points par requête au plus ; `-99999` hors couverture |
| Altitude raster (relief fin) | WMTS `ELEVATION.ELEVATIONGRIDCOVERAGE.HIGHRES`, `image/x-bil;bits=32`, grille **WGS84G_6_14**, niveau 11 (pixel ≈ 38 m) | Grille en degrés, pas la grille Web Mercator (PM) ; tuile = 256 × 256 flottants ; compression assurée par le serveur |
| Météo | Open-Meteo **`historical-forecast-api`** : 92 jours passés et 7 à venir en une requête, `temporal_resolution=hourly_6` ; secours : API de prévision, 32 jours | L'API de prévision ne remonte qu'à environ 50 jours. En France, les valeurs par défaut sont celles d'AROME / ARPEGE de Météo-France, sauf l'humidité du sol, qui vient d'un autre modèle. Quota gratuit : 10 000 appels par jour, 600 par minute ; une requête longue compte pour plusieurs appels |
| Météo ERA5 (calibration) | `archive-api.open-meteo.com` | Pas de temps horaire ; sol 0–7 et 7–28 cm |
| Plan IGN, photos aériennes | WMTS `PLANIGNV2`, `ORTHOPHOTOS`, grille `PM` | L'IGN renvoie parfois un 400 « Layer unknown » passager, que le navigateur met en cache : on réessaie avec `cache:"reload"` |
| Essences forestières | WMTS `LANDCOVER.FORESTINVENTORY.V2`, zooms 6 à 16 | **Les couleurs des tuiles ne sont pas celles de la légende officielle.** La table `TREES` (couleur → formation) a été vérifiée point par point avec le WFS `LANDCOVER.FORESTINVENTORY.V2:formation_vegetale` (filtre `INTERSECTS` en **Lambert-93**) |
| Forêts publiques | WMTS `FORETS.PUBLIQUES`, style `FORETS PUBLIQUES ONF` ; WFS `ONF.FORETS_PUBLIQUES:ONF_FORETS_PUBLIQUES` | Vert (16,116,16) = forêt domaniale, brun (144,84,24) = autre forêt publique. Le WFS renvoie ses contours en EPSG:3857 |
| Coupes récentes | WMTS `IGNF_MASQUE-FORET.2021-2023` (vert = forêt, jaune = forêt à usage agricole) | Les millésimes 2022 à 2024 de `MASQUE-CARTO-FORMATIONS-VEGETALES` répondent 404 sur l'Ariège |
| Sols | SoilGrids, WCS `maps.isric.org` : pH, argile, sable, couche 5–15 cm, maille 250 m | GeoTIFF 16 bits en tuiles, compression deflate et prédicteur, lu par `soilGrid()`. L'API REST ponctuelle répondait 503 |
| Routes | WFS `BDTOPO_V3:troncon_de_route`, avec `PROPERTYNAME=nature,acces_vehicule_leger,geometrie` | Environ 90 Ko pour 700 tronçons |
| Observations (calibration) | API GBIF `occurrence/search` | — |

---

## 3. Architecture actuelle (repères dans `index.html`)

### Pipeline météo
- `fetchMeteo()` récupère les séries journalières de chaque point de grille, enregistrées dans `hexStore.pts` (localStorage `hexes`).
- `fetchGrid()` gère le cache de 6 heures et les lots de 50 points ; `gridStep()` choisit le pas de la grille selon la taille d'hexagone : 0,1°, 0,05° ou 0,025°.
- `hexWeather(h)` combine les points voisins (inverse du carré de la distance) et corrige la température selon l'altitude (−0,65 °C par 100 m).

### Le modèle : `compute(D, cfg)`
- **Données d'entrée :** 100 jours de série. Pour l'affichage, il n'en rend que les 40 derniers ; `dateOf()` replace les indices dans la série complète.
- **Déclenchement :** pluie des 7 derniers jours rapportée au besoin `need` de l'espèce, multipliée par un choc thermique (pondéré par `w`) et par la réserve de chaleur entre J-30 et J-8.
- **Forme temporelle :** délai de sortie `lag`, ajusté par la température du sol, puis fenêtre de cueillette `win`.
- **Facteurs, combinés en produit pondéré `Π fᵢ^poidsᵢ`** (poids dans `WEIGHTS`) :
  - bilan pluie − évaporation sur 30 jours (poids 1, ou 0,4 quand l'humidité du sol est connue) ;
  - humidité du sol, moyenne des couches 3–9 et 9–27 cm (1) ;
  - « mémoire de l'été », bilan entre J-90 et J-31, plancher 0,5 (0,5) ;
  - température de l'air sur 5 jours, en cloche `topt` ± `tsd` (0,8) ;
  - pluie déclenchante (0,6) ;
  - air sec, mesuré par le déficit de pression de vapeur (0,5) ;
  - redoux (0,5) ;
  - gel (1) ;
  - saison, lissée jour par jour (0,3).
- **Échelle calibrée :** `E = 1 − exp(−brut / k)`, avec `k` par espèce (voir 4.1).
- **Règle « Cépio » :** calculée à part, affichée seulement en comparaison.

### Facteurs du lieu, appliqués après le modèle
- **Arbres hôtes :** `habitat()` / `hostAff()`, à partir de la table `HOST` (affinité de 0 à 1 par essence). Poids plein dès que 50 % de l'hexagone est favorable.
- **pH :** `phF()` (table `PH`, poids 0,4).
- **Pente :** `slopeF()` (poids 0,3).
- **Versant :** `hexExpo()`, en °C et en humidité, proportionnel à la pente.
- **Exclusions :** `excluded()` écarte les zones sans forêt, au-dessus de 2 000 m, ou en bord de mer et hors de France.

### Deux affichages
- **Carte continue** (défaut, `setViewMode("heat")`) :
  - `heatBuild()` calcule le milieu par cellule (75 m, ou plus pour un grand rayon) : altitude, pente, versant, essence, coupe récente, forêt publique, pH, voisins météo. Il est gardé en mémoire dans `heatEnv`.
  - `heatScore()` calcule l'indice et les zones chaudes (lissage 3 × 3, seuil, taches connexes).
  - `heatRender()` / `heatShow()` affichent l'image et l'enregistrent (localStorage `heat`).
  - `heatPopup()` donne le détail d'une cellule ; `openReliefAt()` ouvre la fiche relief en un point.
- **Hexagones :**
  - `analyseHex()` gère les tailles de 0,5 à 10 km² : choix automatique de la taille, remplacement des grands hexagones par les petits, pas plus de 600 hexagones par analyse.
  - `bestHexes()` classe les meilleurs hexagones ; `autoRefineTop()` affine automatiquement le top 10.
- **Fiche « Relief et versants » :**
  - `openRelief()` calcule des cellules de 40 m (rose des versants, tableau par versant, répartition des pentes, carte Leaflet IGN, meilleur endroit).
  - `relRoads()` gère les routes BD TOPO et l'accès le plus proche ; `relLocate()` la géolocalisation en direct.

### Stockage
- **localStorage :** `spots`, `wx`, `hexes`, `view`, `hSize`, `hMode`, `best`, `place`, `bAuto`, `viewMode`, `heat`.
- **IndexedDB `tuiles-ign` :** toutes les tuiles. Le service worker `sw.js` met seulement l'application en cache.

---

## 4. Chantier A : reconsidérer le calcul des indices

### 4.1 Ce qui a été mesuré
Le banc `tools/calibration/banc.mjs` extrait `compute()` d'`index.html` et le fait tourner sur la météo ERA5 de 50 observations GBIF par espèce (Europe tempérée, 2018-2025). Il compare le jour de l'observation à un jour témoin 45 jours plus tôt, au même endroit (voir `docs/calibration-gbif.md`).

| Espèce | Pouvoir prédictif (AUC jour d'observation vs témoin) | Médiane le jour d'observation | Médiane du témoin |
|---|---|---|---|
| Cèpe de Bordeaux | 0,86 | 0,55 | 0,17 |
| Cèpe d'été | 0,86 | 0,55 | 0,14 |
| Cèpe bronzé | 0,84 | 0,55 | 0,16 |
| Cèpe des pins | 0,72 | 0,55 | 0,22 |
| Girolle | 0,67 | 0,55 | 0,32 |
| Pied de mouton | **0,58** | 0,55 | 0,44 |

Autres résultats :
- **Optimum de température :** les observations GBIF retrouvent 13,3 °C pour le cèpe de Bordeaux, l'optimum mesuré par Brejon Lamartinière & Hoffman 2025. Les optimums des autres espèces en sont tirés.
- **Une règle retirée :** la « période réfractaire » (−40 % après une forte poussée) dégradait l'AUC des six espèces.

### 4.2 Faiblesses connues (à traiter en priorité)

**Méthode d'évaluation**
1. **Témoin biaisé.** Le témoin J-45 tombe souvent en saison pour la girolle et le pied de mouton, d'où leur AUC faible. Il faut un échantillonnage de fond (« background ») sur toute l'année et sur d'autres lieux, et une validation croisée **par année et par région**.
2. **Calibration sur la météo seule.** Les facteurs du lieu (arbres, pH, pente, versant) n'entrent pas dans le banc, et leurs poids n'ont jamais été ajustés.
3. **Données de présence seulement.** GBIF ne donne que des présences, avec un biais d'observation (week-ends, promenades, beau temps) et des erreurs d'identification, surtout entre cèpe d'été et cèpe bronzé. Aucune donnée d'absence.

**Construction du modèle**

4. **Structure ad hoc.** Déclenchement × forme temporelle × produit de facteurs pondérés : les poids viennent d'un ordre d'importance tiré des études, pas d'un ajustement statistique. Les paramètres `lag`, `need`, `win`, `w`, `humMin` et le seuil de choc thermique n'ont jamais été optimisés.
5. **Eau comptée plusieurs fois.** La pluie déclenchante, le bilan sur 30 jours, l'humidité du sol et la mémoire de l'été se recouvrent. L'évapotranspiration est grossière (`0,05·(T+5)` mm/j), et l'humidité du sol est normalisée par `(v−0,08)/0,3`, sans lien avec la texture.

**Paramètres d'habitat**

6. **Arbres hôtes et pH à dire d'expert.** Les tables `HOST` et `PH` sont des repères de cueilleurs. SoilGrids lisse le pH à 250 m : environ 6 partout au Couserans, alors que l'humus forestier est sans doute plus acide.
7. **Effet du versant fixe.** Il vaut ±1 °C, avec +12 % d'humidité au nord. Il n'est ni calibré, ni dépendant de la saison ou de la latitude.

**Données manquantes ou approximatives**

8. **Rien sur le peuplement.** Ni surface terrière, ni âge, ni densité, alors qu'il existe un optimum vers 20 m²/ha (Bonet et al. 2008, Pyrénées). Piste : la hauteur de canopée du LiDAR HD IGN, pas encore disponible sur les Pyrénées.
9. **Coupes récentes approximatives.** Elles sont déduites de l'écart entre BD Forêt et masque forestier 2021-2023, avec des faux positifs en lisière.
10. **Neige ignorée.** Seule l'exclusion au-dessus de 2 000 m en tient lieu ; Open-Meteo fournit pourtant l'épaisseur de neige.
11. **Aucune incertitude affichée.** On pourrait utiliser les prévisions d'ensemble d'Open-Meteo.

### 4.3 Pistes de méthode suggérées (à juger)
- **Reformuler en modèle statistique :** régression logistique pénalisée ou GAM, présence contre fond, avec covariables météo à plusieurs fenêtres (5, 7, 14, 30, 60 jours) et covariables de milieu. On pourrait ensuite garder la structure phénologique (déclenchement, délai, fenêtre) comme covariables dérivées, ou la remplacer si elle n'apporte rien.
- **Ou garder la structure actuelle** et optimiser ses paramètres (recherche en grille ou optimisation bayésienne) sur l'AUC, ou mieux sur la log-vraisemblance, avec validation croisée.
- **Élargir les données :** plus d'observations GBIF (le quota GBIF ne pose pas de problème ; c'est l'archive Open-Meteo qui limite : environ 10 appels pondérés par observation de 140 jours, 10 000 par jour) ; Mushroom Observer et iNaturalist via GBIF ; données françaises (MycoFrance, inventaires) si elles sont accessibles sans clé.
- **Carnet de cueillettes dans l'app :** position, espèce, quantité, et **absences**. C'est la seule source d'absences ; il permettrait une calibration locale.
- **Évaluer aussi le milieu :** relancer le banc avec les essences et le relief au point d'observation (tuiles BD Forêt et altitude déjà gérées).

### 4.4 Livrables attendus pour A
- Un modèle dont l'AUC en validation croisée (témoins par fond annuel) est **meilleure que celle mesurée en 4.1** pour chaque espèce, et qui ne régresse pas sur les cèpes.
- Un banc d'essai reproductible dans `tools/calibration/` : données d'entrée, procédure, métriques, graphique de calibration (fiabilité).
- Un onglet Méthode et un `docs/calibration-*.md` à jour, avec les sources et les limites, en français clair.
- Une échelle d'indice qui garde un sens explicite. Aujourd'hui : un jour d'observation typique vaut 55. On peut viser une probabilité calibrée.

---

## 5. Chantier B : repenser l'ergonomie et l'accessibilité

### 5.1 L'interface actuelle (onglets en bas : Carte, Prévision, Méthode)
L'onglet **Carte** est une longue page qui empile :
- la recherche de lieu et la taille de zone ;
- le sélecteur Carte continue / Hexagones ;
- les couches (plan, photos, forêts, forêts publiques) ;
- la carte ;
- « Ajouter un coin » et « Ma position » ;
- la carte « Hexagones » (espèce, taille, période, analyse) ;
- « Zones chaudes / Meilleurs hexagones autour d'un point » (champignon, centre, rayon) ;
- « Mes coins » (zones et coins, œil, « Seule ») ;
- le téléchargement de cartes hors ligne.

La fiche d'un point ou d'un hexagone mène à « Relief et versants », un panneau qui monte du bas avec une carte, les routes et la localisation. L'onglet **Prévision** sert au détail d'un coin, d'un hexagone ou du simulateur, avec courbes et facteurs. L'onglet **Méthode** est un long texte avec le tableau des poids et les sources.

### 5.2 Problèmes constatés
- **Trop de réglages en double et trop de jargon.** L'espèce se choisit à deux endroits (synchronisés). Les termes « hexagone », « affiner », « zone chaude », « indice », « AUC », « VPD » restent techniques. Les deux modes d'affichage obligent à comprendre deux modèles mentaux.
- **Pas de parcours guidé.** L'enchaînement « je choisis un lieu → une espèce → quand → je vois où aller → j'y vais » n'est pas évident ; beaucoup de boutons ont le même poids visuel.
- **Usage sur le terrain** : lumière vive, une seule main, parfois des gants, batterie, absence de réseau. Il manque une **préparation de sortie hors ligne** (tuiles, routes, relief et météo des meilleurs coins).
- **Accessibilité** :
  - la couleur porte seule l'information (dégradé bleu → rouge) : aucun motif ni chiffre sur la carte continue, et un risque pour les personnes daltoniennes ;
  - certaines cibles tactiles sont petites (chips, boutons de la liste) ;
  - le contraste des textes secondaires n'a pas été vérifié ;
  - pas de rôles ARIA sur les onglets, pas de libellés sur les boutons-icônes (⛰, ✎, 👁) ;
  - l'app n'a pas été testée avec TalkBack ni avec une taille de texte agrandie.
- **Lisibilité des résultats.** Un chiffre sur 100 sans repère ; les niveaux (Rare, Limité, Modéré, Abondant) ne sont pas reliés à une action (« ça vaut le déplacement ? »).
- **Performance perçue.** Un calcul de 10 à 25 s sans barre de progression claire sur la carte continue (seulement un texte) ; le premier téléchargement pèse plusieurs mégaoctets.

### 5.3 Pistes suggérées (à juger)
- **Un parcours principal en 3 écrans :** « Où ? » (lieu, position, coins enregistrés) → « Quoi et quand ? » (espèce, aujourd'hui / demain / semaine) → « Résultat » (carte et top 5 en cartes lisibles, avec une phrase claire, par exemple « Bonnes chances jeudi sur ce versant nord en hêtraie, à 400 m de la piste »).
- **Réglages avancés** (taille d'hexagone, rayon, couches, simulateur, méthode) regroupés dans un écran « Expert ».
- **Phrases d'aide** en langage courant ; glossaire au toucher ; niveaux reliés à une recommandation.
- **Mode terrain :** gros boutons, fort contraste, navigation vers le coin (direction et distance, déjà en partie dans `relLocate()`), préparation hors ligne en un bouton.
- **Accessibilité :**
  - viser WCAG 2.1 niveau AA (contraste, cibles d'au moins 44 px, focus visible, ARIA sur onglets, panneaux et boutons-icônes) ;
  - palette sûre pour les daltoniens (redondance par motifs ou étiquettes) ;
  - textes alternatifs ;
  - respect de « réduire les animations » ;
  - test avec TalkBack.
- **Premier lancement :** expliquer en trois lignes ce que fait l'app et ce qu'elle ne garantit pas.

### 5.4 Livrables attendus pour B
- Une maquette ou un prototype du nouveau parcours, testé en émulation 375 × 812, en clair et en sombre.
- Un audit d'accessibilité avant / après (Lighthouse et vérification manuelle) avec la liste des corrections.
- Aucune fonction perdue. Les fonctions existantes peuvent aller dans « Expert » :
  - recherche, carte continue, hexagones, relief et versants, routes, géolocalisation ;
  - forêts publiques, coupes, mes coins, hors ligne, simulateur, méthode.

---

## 6. Outils fournis (`tools/calibration/`)

| Fichier | Rôle |
|---|---|
| `gbif.mjs` | Observations GBIF par espèce, puis température (5 j) et pluie (30 j) ERA5 → `data/gbif.json` |
| `analyse.mjs` | Statistiques par espèce : optimum, écart type, saison → `data/gbif-stats.json` |
| `calibwx.mjs` | Météo ERA5 complète (140 jours) de 50 observations par espèce → `data/calibwx.json` (2 Mo, non versionné, à régénérer). Limite à 1 requête toutes les 1,3 s à cause du quota par minute |
| `banc.mjs` | Fait tourner le vrai `compute()` d'`index.html` le jour d'observation et à J-45 ; calcule médianes et AUC → `data/banc.json`. Usage : `node banc.mjs ../../index.html` |
| `calib2.js` + `l93.js` | Vérifie la table couleur → formation de la BD Forêt avec le WFS (point dans le polygone, Lambert-93) |
| `icon.js` | Génère les icônes PWA 192 et 512 |

Installer avec `npm install` dans `tools/calibration/` (seule dépendance : `pngjs`). Node 18 ou plus.

---

## 7. Comment travailler avec l'utilisateur
- Échanges en **français**. Il teste sur son téléphone par le lien publié.
- **Publication :** il demande souvent « publie » ou « envoie le lien » : c'est l'autorisation de publier. Sans demande, on commite en local et on propose.
- **Une décision à la fois :** il préfère avancer étape par étape, avec un compte rendu clair de ce qui a été vérifié et de ce qui ne l'a pas été.
- **Honnêteté sur les limites :** il apprécie qu'on dise quand un modèle est peu fiable (AUC faible) plutôt que de l'enjoliver.
