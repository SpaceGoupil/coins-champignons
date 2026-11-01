# Journal d'avancement : refonte du modèle et de l'ergonomie

- **Dernière mise à jour :** 2026-11-02 01:05 (heure de Paris)
- **Statut :** en pause (limite d'utilisation atteinte à 01:05), reprise prévue à 4 h 00
- **Référence :** `docs/BRIEF-agent-modele-ergonomie.md` (contraintes, architecture, livrables)
- **Reprise automatique :** tâche planifiée « reprise-coins-champignons » à 4 h 00. Elle n'agit pas si ce journal ou un fichier du projet a été modifié dans les 25 dernières minutes.

## Règles rappelées
- Commits **locaux** seulement, jamais de `git push` sans demande explicite de l'utilisateur.
- Incrémenter `CACHE` dans `sw.js` à chaque version de l'app (dernière : `coins-v23`).
- Vérifier dans le navigateur (émulation 375 × 812) avant de commiter.
- Quota Open-Meteo : archive, 1 requête toutes les 1,3 s au plus, 10 000 appels pondérés par jour.

## Où reprendre (à lire en premier)
1. **A1, collecte en cours** : `node calibwx2.mjs` (dans `tools/calibration/`) tournait à 01:05. Il écrit `data/calibwx2.json` après chaque espèce. Si le fichier manque ou ne contient pas les 6 espèces, **relance-le** : il reprend où il s'est arrêté (≈ 2 requêtes par observation, 1,3 s d'écart, ~15 min en tout).
2. **A2-A3** : quand `data/calibwx2.json` est complet, lance `node banc2.mjs ../../index.html data/banc2-reference.json` (référence du modèle actuel). Les scripts `banc2.mjs` et `optim.mjs` sont écrits mais **pas encore testés** : corrige-les si besoin.
3. **A4** : `node optim.mjs ../../index.html` → `data/optim.json`. Les réglages ne sont « adoptés » que si la validation croisée par année progresse de plus de 0,005.
4. **A5-A6** : reporter les réglages adoptés dans `SP` d'`index.html` (`sp.wt` = poids propres à l'espèce, `sp.mp` = constantes `rw`, `choc`, `pet`, `lagT`), recaler `k` (médiane des jours d'observation ≈ 0,55), mettre à jour `docs/calibration-gbif.md`, l'onglet Méthode et les multiplicateurs par niveau donnés par `banc2.mjs`.

## Chantier A : modèle prédictif
- [~] **A1** Météo ERA5 élargie (d−200 → d+75) des 50 observations par espèce : `calibwx2.mjs` → `data/calibwx2.json` (en cours)
- [~] **A2** Banc v2 écrit (`lib.mjs`, `banc2.mjs`) : témoins = jours de d−100 à d+75 hors ±10 j ; AUC « saison » et « proche » (±45 j) par observation ; groupes d'années ; multiplicateur par niveau. À tester.
- [ ] **A3** Mesure de référence du modèle actuel avec le banc v2
- [~] **A4** Optimiseur écrit (`optim.mjs`, descente de coordonnées sur 17 paramètres, validation croisée en 3 groupes d'années). À lancer.
- [ ] **A5** Échelle de l'indice au sens explicite (proposition : garder 55 = jour de trouvaille typique et afficher, par niveau, « × N plus souvent qu'un jour moyen de saison » d'après `banc2.mjs`)
- [ ] **A6** Intégration dans `index.html`, vérification dans le navigateur, docs, onglet Méthode, commit
- [ ] **A7** (si le temps le permet) Arbres hôtes calibrés sur les observations françaises

## Chantier B : ergonomie et accessibilité
- [ ] **B1** Audit d'accessibilité initial → `docs/audit-accessibilite.md`
- [ ] **B2** Parcours guidé en 3 étapes et mode « Expert »
- [ ] **B3** Accessibilité : ARIA, libellés, contraste, cibles de 44 px, focus, daltonisme
- [ ] **B4** Premier lancement, phrases claires, niveaux reliés à une action
- [ ] **B5** Mode terrain et préparation de sortie hors ligne
- [ ] **B6** Vérification mobile en clair et en sombre, audit final, commit

## Journal
- 00:55 Démarrage. Brief relu. Plan ci-dessus. Tâche de reprise programmée à 4 h 00.
- 00:58 `compute()` rendu paramétrable par espèce sans changer son comportement : constantes `MODEL` (`rw`, `choc`, `pet`, `lagT`) et réglages `sp.wt` / `sp.mp`. Ancien banc relancé : résultats identiques (AUC 0,86 / 0,72 / 0,86 / 0,84 / 0,67 / 0,58).
- 01:00 `lib.mjs` (chargement du modèle depuis index.html, évaluation, groupes d'années), `banc2.mjs`, `optim.mjs` écrits ; collecte `calibwx2.mjs` lancée.
- 01:05 Limite d'utilisation atteinte : pause. Commit local de l'état.
