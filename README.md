# Coins à champignons

App web mobile (un seul fichier HTML, sans build) : indice de pousse de six champignons comestibles sur carte IGN, meilleurs coins avec leur accès (route goudronnée la plus proche, temps de trajet), utilisable en mode avion.

Les indices sont **indicatifs** : poids de départ tirés d'études et de repères de cueilleurs, puis réglés sur des récoltes réelles (GBIF, voir `docs/modele-2026-11.md`).

## Fichiers

- `index.html` : l'app (Leaflet 1.9.4 intégré).
- `manifest.webmanifest`, `icon-192.png`, `icon-512.png` : installation sur l'écran d'accueil.
- `sw.js` : met l'app en cache. Les tuiles (IndexedDB) et la météo (localStorage) sont stockées par la page elle-même.

## Tester en local

```bash
python -m http.server 8765
```

puis ouvrir http://localhost:8765/.

## Services utilisés (vérifiés le 01/11/2026 ; routes et trajets le 02/11/2026)

| Usage | Service | Notes |
|---|---|---|
| Recherche | `data.geopf.fr/geocodage/completion` et `/search`, puis Open-Meteo en secours | CORS ouvert ; formats conformes au code |
| Altitude | `data.geopf.fr/altimetrie/1.0/calcul/alti/rest/elevation.json`, ressource **`ign_rge_alti_wld`** | `ign_rgealti_world` n'existe pas (400). 200 points par requête au plus (au-delà : 414) ; `-99999` hors couverture |
| Météo | `historical-forecast-api.open-meteo.com` (secours : `api.open-meteo.com/v1/forecast`, 32 jours) | 92 jours passés + 7 à venir en une requête, mêmes valeurs que la prévision pour les jours récents et futurs. L'API de prévision ne remonte qu'à ~50 jours (`past_days=92` renvoie des `null` au-delà). Sol 0–7 et 7–28 cm (couches d'ERA5, celles du réglage du modèle) ; `temporal_resolution=hourly_6` : 50 points ≈ 140 Ko compressés |
| Tuiles | WMTS `data.geopf.fr/wmts`, `TILEMATRIXSET=PM` | Plan et photos : zooms 0 à 19 ; BD Forêt V2 : zooms **6 à 16** (17 → 404). L'IGN renvoie parfois un 400 « Layer unknown » passager, mis en cache par le navigateur : nouvelle tentative avec `cache: "reload"` |
| Forêt | `LANDCOVER.FORESTINVENTORY.V2` | Fond transparent, mais lande, formation herbacée et « sans couvert arboré » sont opaques : elles sont exclues par couleur |
| Sols | WCS SoilGrids `maps.isric.org` (pH, argile, sable, 5–15 cm, 250 m) | CORS ouvert ; GeoTIFF 16 bits, tuiles 256, deflate + prédicteur horizontal, lu sans bibliothèque. L'API REST ponctuelle répondait 503 |
| Essences | WFS `LANDCOVER.FORESTINVENTORY.V2:formation_vegetale` | Sert seulement à vérifier la table couleur → formation des tuiles ; filtre « point dans le polygone » en Lambert-93 (`INTERSECTS(geom,POINT(x y))`) |
| Routes | WFS `BDTOPO_V3:troncon_de_route`, filtre `CQL_FILTER` | Route « goudronnée » = `nature` « Route à 1 chaussée », « Route à 2 chaussées » ou « Rond-point », `acces_vehicule_leger` « Libre », hors routes nommées « forestière » (les pistes forestières sont surtout des « Route empierrée »). Cherchées dans un carré de ± 1 à 2 km autour de chaque coin : la zone entière (rayon 15 km) pèse ~6 Mo pour 12 700 tronçons. Avec un `CQL_FILTER`, le `BBOX` va dans le filtre (lat, lon en `urn:ogc:def:crs:EPSG::4326`) ; coordonnées en 3D |
| Trajet | `data.geopf.fr/navigation/itineraire`, ressource **`bdtopo-valhalla`**, `profile=car` | `bdtopo-osrm` n'existe pas (400). CORS ouvert ; ~0,4 s par trajet ; durée en minutes, distance en km. Reçoit la position de l'utilisateur : la première fois à sa demande, puis à chaque nouvelle recherche si la localisation reste autorisée |

Le poids de chaque variable et les études qui l'appuient sont détaillés dans l'onglet Méthode de l'app et dans la constante `WEIGHTS` d'`index.html`.

Licences : IGN, licence ouverte Etalab 2.0 ; Open-Meteo, CC BY 4.0 ; SoilGrids (ISRIC), CC BY 4.0.
