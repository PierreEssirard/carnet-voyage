# Carnet de voyages — Pierre Essirard

Site interactif de mes 4 mois au Canada et aux États-Unis : Montréal en 3D, puis 4 road trips sur une carte qui suit le défilement.

## Structure

```
carnet-voyages/
├── index.html          ← page principale
├── css/style.css       ← tout le design
├── js/
│   ├── data.js         ← ⭐ TON CONTENU (textes, lieux, photos, vidéos, trajets)
│   ├── main.js         ← relie le récit et la carte
│   ├── map.js          ← carte 3D, caméra, animations
│   ├── story.js        ← génère les cartes de texte
│   ├── scroll.js       ← détecte la section affichée
│   ├── effets.js       ← apparitions, barre de progression, visionneuse photo
│   ├── routing.js      ← calcule les itinéraires sur les vraies routes
│   └── geo.js          ← petits calculs géographiques
└── assets/
    ├── photos/         ← tes photos
    └── videos/         ← tes vidéos
```

Pour modifier le contenu, tu n’as normalement besoin de toucher **que `js/data.js`**.

## Voir le site sur ton ordinateur

Le site utilise des modules JavaScript : il ne marche pas en double-cliquant sur `index.html`. Lance un petit serveur dans le dossier :

```bash
python3 -m http.server 8000
```

puis ouvre http://localhost:8000. (Ou, dans VS Code, l’extension « Live Server ».)

## Mettre en ligne avec GitHub Pages

```bash
git init
git add .
git commit -m "Premier jet du carnet de voyages"
git branch -M main
git remote add origin https://github.com/TON-PSEUDO/carnet-voyages.git
git push -u origin main
```

Puis sur GitHub : **Settings → Pages → Source : Deploy from a branch → `main` / `(root)`**. Le site sera à `https://TON-PSEUDO.github.io/carnet-voyages/`.

## Ajouter photos et vidéos

1. Mets les fichiers dans `assets/photos/` et `assets/videos/`.
2. Référence-les dans `js/data.js` :
   ```js
   photos: ["assets/photos/tadoussac-1.webp", "assets/photos/tadoussac-2.webp"],
   video: "assets/videos/tadoussac.mp4",
   ```

Conseils :
- Photos en **.webp** ou .jpg, environ 1600 px de large (site rapide).
- GitHub refuse les fichiers de plus de **100 Mo** : compresse les vidéos (HandBrake) ou mets-les sur YouTube.
- Pas d’espaces ni d’accents dans les noms de fichiers : `lake-george-1.webp`.

## Ajouter un trajet à Montréal

Dans `MONTREAL.parcours` (fichier `js/data.js`) :

```js
{
  titre: "Du Plateau au Vieux-Port",
  de: { nom: "Parc La Fontaine", lon: -73.5698, lat: 45.5268 },
  a:  { nom: "Vieux-Port",       lon: -73.5530, lat: 45.5075 },
  transport: "velo",   // pied, velo, metro, bus, voiture, train, bateau
  texte: "Ce que j’ai fait…",
  photos: [],
  video: "",
},
```

Un emoji (🚶 🚲 🚇 …) se déplace sur le trajet, la caméra suit en 3D.

## Réglages utiles

- **Taille de la carte** : `--map-w` (ordinateur) et `--map-h` (mobile) en haut de `css/style.css`.
- **Mini-carte** : le bouton en bas à droite de la carte la réduit ; le choix est mémorisé.
- **Relief des montagnes** : `const RELIEF = false` en haut de `js/map.js`. Passe à `true` pour voir les montagnes en 3D (plus joli, mais plus lourd).
- **Couleurs de la carte** : objet `NUIT` en haut de `js/map.js`.

## Technologies

- [MapLibre GL JS](https://maplibre.org/) — carte vectorielle, relief et bâtiments 3D
- [OpenFreeMap](https://openfreemap.org/) — fond de carte gratuit, sans clé API
- Relief : tuiles d’élévation publiques (Mapzen / AWS)
- Itinéraires : [OSRM via routing.openstreetmap.de](https://routing.openstreetmap.de/)
