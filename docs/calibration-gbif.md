# Calibration par les observations GBIF (1er novembre 2026)

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
