# Coins à champignons

App web mobile (un seul fichier HTML, sans build) : indice de pousse de six champignons comestibles, par hexagones sur carte IGN, utilisable en mode avion.

Les indices sont **indicatifs** : paramètres issus de repères de cueilleurs, pas d'une calibration.

## Fichiers

- `index.html` : l'app (Leaflet 1.9.4 intégré).
- `manifest.webmanifest`, `icon-192.png`, `icon-512.png` : installation sur l'écran d'accueil.
- `sw.js` : met l'app en cache. Les tuiles (IndexedDB) et la météo (localStorage) sont stockées par la page elle-même.

## Tester en local

```bash
python -m http.server 8765
```

puis ouvrir http://localhost:8765/.

## Services utilisés (vérifiés le 01/11/2026)

| Usage | Service | Notes |
|---|---|---|
| Recherche | `data.geopf.fr/geocodage/completion` et `/search`, puis Open-Meteo en secours | CORS ouvert ; formats conformes au code |
| Altitude | `data.geopf.fr/altimetrie/1.0/calcul/alti/rest/elevation.json`, ressource **`ign_rge_alti_wld`** | `ign_rgealti_world` n'existe pas (400). 200 points par requête au plus (au-delà : 414) ; `-99999` hors couverture |
| Météo | `api.open-meteo.com/v1/forecast` | 40 jours, variables de sol présentes sur les jours passés ; multi-points = tableau ; 50 points ≈ 1,6 Mo |
| Tuiles | WMTS `data.geopf.fr/wmts`, `TILEMATRIXSET=PM` | Plan et photos : zooms 0 à 19 ; BD Forêt V2 : zooms **6 à 16** (17 → 404). L'IGN renvoie parfois un 400 « Layer unknown » passager, mis en cache par le navigateur : nouvelle tentative avec `cache: "reload"` |
| Forêt | `LANDCOVER.FORESTINVENTORY.V2` | Fond transparent, mais lande, formation herbacée et « sans couvert arboré » sont opaques : elles sont exclues par couleur |
| Sols | WCS SoilGrids `maps.isric.org` (pH, argile, sable, 5–15 cm, 250 m) | CORS ouvert ; GeoTIFF 16 bits, tuiles 256, deflate + prédicteur horizontal, lu sans bibliothèque. L'API REST ponctuelle répondait 503 |
| Essences | WFS `LANDCOVER.FORESTINVENTORY.V2:formation_vegetale` | Sert seulement à vérifier la table couleur → formation des tuiles ; filtre « point dans le polygone » en Lambert-93 (`INTERSECTS(geom,POINT(x y))`) |

Le poids de chaque variable et les études qui l'appuient sont détaillés dans l'onglet Méthode de l'app et dans la constante `WEIGHTS` d'`index.html`.

Licences : IGN, licence ouverte Etalab 2.0 ; Open-Meteo, CC BY 4.0 ; SoilGrids (ISRIC), CC BY 4.0.
