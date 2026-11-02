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

## 2. Corrections apportées (2 novembre 2026, versions `coins-v24` à `coins-v26`)

| # | Constat | Correction | Vérification |
|---|---|---|---|
| 1 | Contraste du gris atténué | `--muted` passe de #85837c à #67655e : **5,7:1** sur les cartes. En plus, dans le thème sombre, le texte des boutons principaux, blanc sur l'accent clair #d4a373, n'avait que **2,3:1** : il devient brun très foncé (#1f1408), soit **8,0:1**. | Mesure dans le navigateur (thèmes clair et sombre). |
| 2 | Boutons-icônes | `aria-label` parlants : « Modifier *nom* », « Relief et versants de la zone *n* », « Masquer la zone *nom* » (avec `aria-pressed`), « Coin précédent / suivant ». Les emojis décoratifs des onglets sont masqués aux lecteurs d'écran. | Arbre d'accessibilité. |
| 3 | Champ de recherche | `aria-label` « Lieu à chercher (ville, forêt, lieu-dit) ». | Lighthouse. |
| 4 | Onglets | `role=tablist`, `role=tab`, `aria-selected` mis à jour, `aria-controls`. | Arbre d'accessibilité. |
| 5 | Panneaux | `role=dialog`, `aria-modal`, titre relié par `aria-labelledby` ; le focus entre dans le panneau à l'ouverture et revient au bouton à la fermeture ; Échap ferme. | Clavier. |
| 6 | Messages d'état | `aria-live="polite"` sur la recherche, l'analyse, la carte continue, la synthèse ③, la fiabilité ②, la préparation de sortie, le guidage et les étapes. | Arbre d'accessibilité. |
| 7 | Cibles tactiles | 44 px au moins pour les puces et les boutons ; **56 px en mode terrain**, texte agrandi à 17 px. | Mesure dans le navigateur. |
| 8 | Couleur seule | Le chiffre /100 et le niveau en mots (« ça vaut une sortie »…) figurent dans la liste des coins, la synthèse, la fiche et le guidage, et les coins sont numérotés sur la carte. Le dégradé gagne un palier crème entre le bleu et le jaune : le niveau « Limité » n'est plus un gris-vert terne. Le rouge final est plus sombre. Écart perçu (ΔE) entre niveaux voisins, simulé selon Machado 2009 : protanopie 68 / 46 / 44 ; deutéranopie 74 / 44 / 29 ; tritanopie 53 / 33 / 57. | Script de simulation (voir ci-dessous). |
| 9 | Animations | `prefers-reduced-motion` : animations de carte, défilements et transitions désactivés. | Code (constante `RM`). |
| 10 | Carte au clavier | La liste des coins et la fiche de chaque coin restent l'équivalent au clavier. | — |
| 11 | Langue claire | Le parcours suit trois étapes : ① où chercher, ② quel champignon et quand, ③ les meilleurs coins, avec une phrase de synthèse. Exemple : « Meilleure chance demain : à 2,1 km vers le sud, versant sud-ouest, sapin / épicéa, 593 m — 67/100 · à ne pas manquer ». <br>Les niveaux sont reliés à une action. L'app affiche la fiabilité par espèce et, pour chaque niveau, combien de fois plus de chances de trouver qu'un jour ordinaire. <br>« Zones chaudes » devient « meilleurs coins », les directions s'écrivent en toutes lettres et les nombres avec une virgule. « VPD », « carpophores » et « AUC » ont disparu. Les hexagones restent dans « Réglages avancés ». | Lecture des écrans. |

**Ajouts pour le terrain.**
- **Préparer ma sortie** : un bouton enregistre, pour les 5 meilleurs coins, les cartes (plan, photos, forêts), l'altitude, les routes et la météo. Vérifié en coupant tout accès réseau dans la page : la fiche « Relief et versants » d'un coin s'ouvre complète (relief, essences, routes, accès).
- **Mode terrain** : gros boutons, contraste maximal (les textes secondaires prennent la couleur du texte principal : 15,1:1 en thème sombre). Une carte de guidage donne la distance et la direction du coin, avec une flèche orientée par la boussole du téléphone quand elle est disponible, nord en haut sinon, et la précision du GPS. Elle fonctionne sans réseau.

### Audit final
- **Lighthouse 12.2.1** (émulation mobile) : **accessibilité 100/100, bonnes pratiques 100/100** (contre 96 au départ).
- **Contrastes mesurés dans le navigateur**, thème sombre :
  - textes de note : 5,1:1 ;
  - synthèse : 15,1:1 ;
  - boutons principaux : 8,0:1 ;
  - mode terrain : 15,1:1.
- **Émulation 375 × 812, thèmes clair et sombre** : aucune erreur JavaScript, aucun défilement horizontal (y compris le tableau des niveaux de l'onglet Méthode).

**Non vérifié.**
- **Lecteur d'écran** : pas de test avec TalkBack ni VoiceOver ; seul l'arbre d'accessibilité a été contrôlé.
- **Taille de texte agrandie** dans les réglages du téléphone : non testée.
- **Usage réel sur le terrain** : non testé, en particulier la boussole sur un vrai téléphone (le navigateur de test n'en a pas) et le GPS, simulé par une position fixe.
