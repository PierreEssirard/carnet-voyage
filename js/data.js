/* =========================================================
   TES DONNÉES — c'est le seul fichier à modifier pour le contenu.
   - Coordonnées : lon (longitude), lat (latitude). Clic droit sur
     Google Maps → la première ligne donne "lat, lon" (attention à l'ordre).
   - Photos : mets les fichiers dans assets/photos/ puis
       photos: ["assets/photos/quebec-1.webp", "assets/photos/quebec-2.webp"]
   - Vidéo : mets le fichier dans assets/videos/ puis
       video: "assets/videos/tadoussac.mp4"
   ========================================================= */

/* Modes de transport utilisés pour animer les trajets.
   profil = type d'itinéraire calculé sur les vraies routes
   (null = ligne droite, ex. métro). */
export const TRANSPORTS = {
  pied:    { emoji: "🚶", label: "À pied",  profil: "foot" },
  velo:    { emoji: "🚲", label: "À vélo",  profil: "bike" },
  metro:   { emoji: "🚇", label: "Métro",   profil: null },
  bus:     { emoji: "🚌", label: "Bus",     profil: "car" },
  voiture: { emoji: "🚗", label: "Voiture", profil: "car" },
  train:   { emoji: "🚆", label: "Train",   profil: null },
  bateau:  { emoji: "⛴️", label: "Bateau",  profil: null },
};

/* Point de départ des road trips */
export const BASE = { nom: "Montréal", lon: -73.5673, lat: 45.5017 };

/* ---------------------------------------------------------
   MONTRÉAL — destination principale, vue 3D
   --------------------------------------------------------- */
export const MONTREAL = {
  titre: "Montréal",
  sousTitre: "Mon camp de base pendant 4 mois",
  couleur: "#c8472b",
  texte: "La ville où j’ai vécu pendant mon séjour. Texte à compléter.",
  photos: [],
  video: "",

  /* Vue 3D de départ (zoom ~15 = bâtiments en relief) */
  camera: { center: [-73.5700, 45.5020], zoom: 15.4, pitch: 63, bearing: -35 },

  /* Chaque élément = un trajet animé dans la ville.
     ⚠️ Ce sont des EXEMPLES : remplace-les par tes vrais lieux. */
  parcours: [
    {
      titre: "Exemple — Vieux-Port → Mont-Royal",
      de: { nom: "Vieux-Port", lon: -73.5530, lat: 45.5075 },
      a:  { nom: "Belvédère Kondiaronk", lon: -73.5871, lat: 45.5040 },
      transport: "pied",
      texte: "Exemple à remplacer par ce que tu as fait.",
      photos: [],
      video: "",
    },
    {
      titre: "Exemple — Berri-UQAM → Jean-Talon",
      de: { nom: "Berri-UQAM", lon: -73.5610, lat: 45.5153 },
      a:  { nom: "Marché Jean-Talon", lon: -73.6146, lat: 45.5363 },
      transport: "metro",
      texte: "Exemple à remplacer par ce que tu as fait.",
      photos: [],
      video: "",
    },
  ],
};

/* ---------------------------------------------------------
   ROAD TRIPS
   boucle: true  → l'itinéraire part de Montréal et y revient
   zoom / pitch / bearing (optionnels) → réglage de la caméra
   sur chaque étape (pitch = inclinaison, bearing = orientation)
   --------------------------------------------------------- */
export const TRIPS = [
  {
    titre: "Québec, Jacques-Cartier & Tadoussac",
    kicker: "Road trip 1",
    dates: "Dates à ajouter",
    couleur: "#2f6fb0",
    boucle: true,
    intro: "Cap au nord-est : la Vieille Capitale, la vallée de la Jacques-Cartier puis le fjord à Tadoussac.",
    etapes: [
      { nom: "Québec", lon: -71.2075, lat: 46.8123, zoom: 14.5, pitch: 60,
        texte: "Texte à compléter.", photos: [], video: "" },
      { nom: "Parc de la Jacques-Cartier", lon: -71.3800, lat: 47.3200, zoom: 12, pitch: 68, bearing: 20,
        texte: "Texte à compléter.", photos: [], video: "" },
      { nom: "Tadoussac", lon: -69.7166, lat: 48.1440, zoom: 12.5, pitch: 60, bearing: -40,
        texte: "Texte à compléter.", photos: [], video: "" },
    ],
  },
  {
    titre: "Toronto, Niagara, Sandbanks & Ottawa",
    kicker: "Road trip 2",
    dates: "Dates à ajouter",
    couleur: "#d0761f",
    boucle: true,
    intro: "Tour de l’Ontario : la grande ville, les chutes, les dunes du lac Ontario et la capitale fédérale.",
    etapes: [
      { nom: "Toronto", lon: -79.3871, lat: 43.6426, zoom: 14.5, pitch: 62,
        texte: "Texte à compléter.", photos: [], video: "" },
      { nom: "Chutes du Niagara", lon: -79.0747, lat: 43.0799, zoom: 14.5, pitch: 60, bearing: 30,
        texte: "Texte à compléter.", photos: [], video: "" },
      { nom: "Sandbanks", lon: -77.2600, lat: 43.9100, zoom: 12, pitch: 55,
        texte: "Texte à compléter.", photos: [], video: "" },
      { nom: "Ottawa", lon: -75.7009, lat: 45.4236, zoom: 14.5, pitch: 60,
        texte: "Texte à compléter.", photos: [], video: "" },
    ],
  },
  {
    titre: "New York, Long Island, Lake George & Whiteface",
    kicker: "Road trip 3",
    dates: "Dates à ajouter",
    couleur: "#7a4fb3",
    boucle: true,
    intro: "Descente vers New York, la côte de Long Island, puis remontée par les Adirondacks.",
    etapes: [
      { nom: "New York", lon: -73.9855, lat: 40.7580, zoom: 14.5, pitch: 62,
        texte: "Texte à compléter.", photos: [], video: "" },
      /* Long Island est grande : remplace par l'endroit précis où tu es allé */
      { nom: "Long Island", lon: -73.1000, lat: 40.8500, zoom: 9.5, pitch: 45,
        texte: "Texte à compléter.", photos: [], video: "" },
      { nom: "Lake George", lon: -73.7123, lat: 43.4262, zoom: 11.5, pitch: 60, bearing: 20,
        texte: "Texte à compléter.", photos: [], video: "" },
      { nom: "Whiteface Mountain", lon: -73.9026, lat: 44.3659, zoom: 12.5, pitch: 70, bearing: -30,
        texte: "Texte à compléter.", photos: [], video: "" },
    ],
  },
  {
    titre: "La Mauricie",
    kicker: "Road trip 4",
    dates: "Dates à ajouter",
    couleur: "#2e8b57",
    boucle: true,
    intro: "Forêts, lacs et nature au parc national de la Mauricie.",
    etapes: [
      { nom: "Parc national de la Mauricie", lon: -72.9800, lat: 46.7400, zoom: 11.5, pitch: 62,
        texte: "Texte à compléter.", photos: [], video: "" },
    ],
  },
];
