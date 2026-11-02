# Calibration par les observations GBIF (1er novembre 2026)

> **Mise à jour du 2 novembre 2026** : les réglages ont depuis été ajustés espèce par espèce sur 69 à 80 observations, avec validation sur des années mises de côté. Voir `docs/modele-2026-11.md`. Les chiffres ci-dessous décrivent l'état précédent.

**Objectif** : remplacer les optimums de température et les saisons estimés par des valeurs observées, pour les espèces sans étude chiffrée.

**Méthode**
- Observations GBIF par espèce : Europe tempérée (FR, ES, IT, CH, BE, DE, AT, LU, NL, GB, PT), années 2018 à 2025, coordonnées précises à 1 km, présence attestée. Doublons même jour et même lieu (~1 km) retirés, puis 160 relevés tirés au hasard par espèce.
- Météo de chaque relevé : réanalyse ERA5 via l'API archive d'Open-Meteo, 35 jours précédant l'observation.
- Mesures : température moyenne de l'air sur les 5 jours précédents (médiane, quartiles, écart type), pluie sur 30 jours, répartition par mois.

**Contrôle** : pour le cèpe de Bordeaux, la médiane obtenue (13,3 °C, pic à 12,7 °C) retrouve l'optimum de 13,2 °C mesuré par Brejon Lamartinière & Hoffman (2025) sur dix ans de suivi en hêtraie. La méthode est donc reprise pour les autres espèces.

| Espèce | Optimum retenu (°C) | Écart type (°C) | Ancienne estimation (°C) | Pluie médiane sur 30 j (mm) |
|---|---|---|---|---|
| Cèpe de Bordeaux | 13,2 (étude) ; GBIF 13,3 | 3,3 | 13,2 | 117 |
| Cèpe des pins | 12,4 | 3,7 | 9,7 | 97 |
| Cèpe d'été | 17,7 | 3,4 | 16,7 | 112 |
| Cèpe bronzé | 16,8 | 3,2 | 17,7 | 98 |
| Girolle | 15,3 | 3,8 | 15,2 | 103 |
| Pied de mouton | 12,3 | 4,4 | 8,7 | 105 |

**Saisons** : moitié repères de cueilleurs (valeurs précédentes), moitié part des observations par mois, lissée sur ±1 mois et rapportée au mois le plus fréquent.

**Limites**
- Niche « réalisée » : on mesure quand les gens trouvent et signalent les champignons (promenades, week-ends, beau temps), pas une expérience contrôlée.
- Erreurs d'identification possibles, surtout entre cèpe d'été et cèpe bronzé.
- L'Europe du Nord (Allemagne, Grande-Bretagne) pèse lourd : saisons un peu plus précoces qu'en France, d'où le mélange avec les repères de cueilleurs.

Chiffres complets : `calibration-gbif.json`.

## Échelle de l'indice (calibration sur le modèle complet)

**Méthode** : le code `compute()` de l'app, extrait tel quel, tourne sur la météo ERA5 complète (140 jours, sol 0–7 et 7–28 cm) de 50 observations par espèce : le jour de l'observation (maximum sur les 3 derniers jours) et un jour témoin 45 jours plus tôt au même endroit. Milieu non pris en compte (arbres, pH, pente) : les observations sont par définition dans un milieu favorable.

**Constat avant calibration** : un vrai jour de récolte valait 0,23 à 0,40 ; l'échelle sous-estimait systématiquement.

**Période réfractaire** (repère de cueilleurs : −40 % après une forte poussée) : retirée, l'indice prédit mieux sans elle pour les six espèces (AUC cèpe de Bordeaux 0,79 → 0,86).

**Échelle** : `E = 1 − exp(−brut / k)`, avec `k` par espèce tel que la médiane des jours d'observation vaille 0,55.

| Espèce | k | Jour de récolte (q25 / médiane / q75) | Témoin J-45 (médiane) | AUC |
|---|---|---|---|---|
| Cèpe de Bordeaux | 0,619 | 0,39 / 0,55 / 0,67 | 0,17 | 0,86 |
| Cèpe des pins | 0,308 | 0,28 / 0,55 / 0,73 | 0,22 | 0,72 |
| Cèpe d'été | 0,642 | 0,37 / 0,55 / 0,67 | 0,14 | 0,86 |
| Cèpe bronzé | 0,581 | 0,42 / 0,55 / 0,69 | 0,16 | 0,84 |
| Girolle | 0,670 | 0,37 / 0,55 / 0,60 | 0,32 | 0,67 |
| Pied de mouton | 0,469 | 0,31 / 0,55 / 0,73 | 0,44 | 0,58 |

**Lecture** : pour les cèpes, l'indice distingue bien un jour de récolte d'un jour quelconque. Pour la girolle et le pied de mouton, il distingue mal : leur saison est longue (le témoin tombe souvent aussi en saison) et le modèle, construit autour des cèpes, les décrit moins bien.
