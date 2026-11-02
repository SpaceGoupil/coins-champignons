# Audit d'accessibilité de « Coins à champignons »

## 1. Audit initial (2 novembre 2026, version `coins-v23`)

### Outil automatique
Lighthouse 12.2.1 (Chrome, émulation mobile, page d'accueil sans données) :
- **Accessibilité : 100/100.**
- **Bonnes pratiques : 96/100.** Le seul point relevé concerne la résolution des tuiles de la carte IGN, qui ne dépend pas de l'app.

Ce score ne suffit pas : les contrôles automatiques ne couvrent qu'une partie des critères WCAG. Ils ne voient ni les panneaux fermés au moment de l'audit, ni le sens des noms donnés aux boutons, ni l'usage réel au doigt ou au lecteur d'écran.

### Vérification manuelle

| # | Critère | Constat | Gravité |
|---|---|---|---|
| 1 | Contraste du texte (WCAG 1.4.3, 4,5:1) | Thème clair : le gris atténué `--muted` (#85837c) n'a que **3,7:1** sur les cartes et **3,5:1** sur le fond. Il sert aux notes, aux sous-titres et aux **onglets inactifs** (12 px). Le thème sombre passe (5,1:1). Les autres couleurs passent (texte secondaire 7,7:1, bouton principal 7,4:1, pastilles de niveau 5,6 à 14,6:1). | Élevée |
| 2 | Nom des boutons-icônes (4.1.2) | ✎, ⛰, 👁 / 🚫 : le lecteur d'écran lit le nom de l'emoji (« crayon », « montagne », « œil »), qui ne dit pas l'action. | Élevée |
| 3 | Champ de recherche (1.3.1, 3.3.2) | Aucune étiquette, seulement un texte indicatif qui disparaît à la saisie. | Moyenne |
| 4 | Onglets du bas (4.1.2) | Simples boutons, sans rôle d'onglet ni état « sélectionné ». | Moyenne |
| 5 | Panneaux (« Relief et versants », fiche d'un coin) (2.4.3, 4.1.2) | Pas de rôle de dialogue ; le focus reste derrière le panneau ; la touche Échap ne ferme pas. | Moyenne |
| 6 | Messages d'état (4.1.3) | Recherche, analyse, carte continue : le texte de progression change sans être annoncé au lecteur d'écran. | Moyenne |
| 7 | Taille des cibles tactiles (2.5.8 ; recommandation 44 px) | Puces ≈ 33 px de haut, boutons ≈ 38 px, boutons de liste (⛰, ✎) ≈ 34 px : difficiles à viser avec des gants ou en marchant. | Moyenne |
| 8 | Couleur seule (1.4.1) | Carte continue et hexagones : l'indice n'est porté que par la couleur, et le dégradé bleu → rouge distingue mal les niveaux intermédiaires pour certaines formes de daltonisme. La liste des zones chaudes et les fiches donnent l'équivalent en texte. | Moyenne |
| 9 | Animations (2.3.3) | Défilements « en douceur » et animations de carte sans tenir compte du réglage « réduire les animations ». | Faible |
| 10 | Carte au clavier (2.1.1) | Toucher un point de la carte n'a pas d'équivalent au clavier ; la liste des zones chaudes en tient lieu. | Faible |
| 11 | Langue claire (3.1.5) | Termes techniques visibles : « hexagones », « affiner », « indice », « AUC » et « VPD » (onglet Méthode), « zone chaude ». | Moyenne |

## 2. Corrections apportées
_(complété au fil du chantier B, avec l'audit final)_
