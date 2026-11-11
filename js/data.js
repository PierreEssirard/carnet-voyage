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
  couleur: "#ff453a",
  texte: "Ma ville pendant quatre mois. Tous les trajets partent de chez moi, rue Prince-Arthur.",
  photos: [],
  video: "",

  /* Vue 3D de départ (zoom ~15 = bâtiments en relief) */
  camera: { center: [-73.5700, 45.5020], zoom: 15.4, pitch: 63, bearing: -35 },

  /* Chaque élément = un trajet animé dans la ville.
     par (optionnel) = arrêts intermédiaires entre de et a. */
  parcours: [
    {
      titre: "Prince-Arthur → Vieux-Port",
      de: { nom: "Chez moi — 130 rue Prince-Arthur O.", lon: -73.5738, lat: 45.5133 },
      a:  { nom: "Vieux-Port", lon: -73.5530, lat: 45.5075 },
      transport: "pied",
      texte: "Balade jusqu’au fleuve : les rues pavées du Vieux-Montréal, puis les quais du Vieux-Port.",
      photos: [],
      video: "",
    },
    {
      titre: "Prince-Arthur → Mont-Royal",
      de: { nom: "Chez moi — 130 rue Prince-Arthur O.", lon: -73.5738, lat: 45.5133 },
      /* Arrêts en chemin, dans l'ordre */
      par: [
        { nom: "Belvédère Kondiaronk", lon: -73.5871, lat: 45.5040 },
        { nom: "Croix du mont Royal", lon: -73.5874, lat: 45.5088 },
      ],
      a:  { nom: "Lac aux Castors", lon: -73.5960, lat: 45.4980 },
      transport: "pied",
      texte: "Montée sur la montagne : la vue sur la ville depuis le belvédère, la croix, puis le lac aux Castors.",
      photos: [],
      video: "",
    },
    {
      titre: "Prince-Arthur → Jardin botanique & Parc olympique",
      de: { nom: "Chez moi — 130 rue Prince-Arthur O.", lon: -73.5738, lat: 45.5133 },
      par: [
        { nom: "Jardin botanique", lon: -73.5560, lat: 45.5600 },
      ],
      a:  { nom: "Parc olympique", lon: -73.5517, lat: 45.5580 },
      transport: "velo",
      texte: "À vélo jusqu’à l’est de la ville : le Jardin botanique, puis le Stade olympique juste à côté.",
      photos: [],
      video: "",
    },
    {
      titre: "Prince-Arthur → La Banquise",
      de: { nom: "Chez moi — 130 rue Prince-Arthur O.", lon: -73.5738, lat: 45.5133 },
      a:  { nom: "La Banquise", lon: -73.5747, lat: 45.5254 },
      transport: "pied",
      texte: "La poutine incontournable, à quelques rues de chez moi.",
      photos: [],
      video: "",
    },
    {
      titre: "Prince-Arthur → Centre-ville",
      de: { nom: "Chez moi — 130 rue Prince-Arthur O.", lon: -73.5738, lat: 45.5133 },
      a:  { nom: "Centre-ville", lon: -73.5713, lat: 45.5005 },
      transport: "velo",
      texte: "À vélo au centre-ville, entre les tours et la rue Sainte-Catherine.",
      photos: [],
      video: "",
    },
    {
      titre: "Prince-Arthur → McGill",
      de: { nom: "Chez moi — 130 rue Prince-Arthur O.", lon: -73.5738, lat: 45.5133 },
      a:  { nom: "Université McGill", lon: -73.5772, lat: 45.5048 },
      transport: "pied",
      texte: "Quelques minutes à pied jusqu’au campus de McGill, au pied du mont Royal.",
      photos: [],
      video: "",
    },
    {
      titre: "Prince-Arthur → Parc Jean-Drapeau",
      de: { nom: "Chez moi — 130 rue Prince-Arthur O.", lon: -73.5738, lat: 45.5133 },
      a:  { nom: "Parc Jean-Drapeau", lon: -73.5330, lat: 45.5122 },
      transport: "velo",
      texte: "À vélo sur l’île Sainte-Hélène, avec la ville de l’autre côté du fleuve.",
      photos: [],
      video: "",
    },
    {
      titre: "Prince-Arthur → Observatoire de Montréal",
      de: { nom: "Chez moi — 130 rue Prince-Arthur O.", lon: -73.5738, lat: 45.5133 },
      a:  { nom: "Observatoire de Montréal", lon: -73.5693, lat: 45.5017 },
      transport: "velo",
      texte: "Tout en haut de la Place Ville Marie, pour voir Montréal d’en haut.",
      photos: [],
      video: "",
    },
    {
      titre: "Prince-Arthur → Westmount",
      de: { nom: "Chez moi — 130 rue Prince-Arthur O.", lon: -73.5738, lat: 45.5133 },
      a:  { nom: "Westmount", lon: -73.5970, lat: 45.4840 },
      transport: "bus",
      texte: "En bus jusqu’à Westmount, un quartier calme et vert à l’ouest du centre.",
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
    dates: "",
    couleur: "#0a84ff",
    boucle: true,
    intro: "Cap au nord-est : la Vieille Capitale, la vallée de la Jacques-Cartier puis le fjord à Tadoussac.",
    etapes: [
      { nom: "Québec", lon: -71.2075, lat: 46.8123, zoom: 14.5, pitch: 60,
        texte: "Le Vieux-Québec, ses remparts et le Château Frontenac.", photos: [], video: "" },
      { nom: "Parc de la Jacques-Cartier", lon: -71.3800, lat: 47.3200, zoom: 12, pitch: 68, bearing: 20,
        texte: "Une vallée profonde au milieu de la forêt, avec la rivière tout au fond.", photos: [], video: "" },
      { nom: "Tadoussac", lon: -69.7166, lat: 48.1440, zoom: 12.5, pitch: 60, bearing: -40,
        texte: "Le fjord du Saguenay, là où il rejoint le Saint-Laurent.", photos: [], video: "" },
    ],
  },
  {
    titre: "Toronto, Niagara, Sandbanks & Ottawa",
    kicker: "Road trip 2",
    dates: "",
    couleur: "#ff9f0a",
    boucle: true,
    intro: "Tour de l’Ontario : la grande ville, les chutes, les dunes du lac Ontario et la capitale fédérale.",
    etapes: [
      { nom: "Toronto", lon: -79.3871, lat: 43.6426, zoom: 14.5, pitch: 62,
        texte: "La plus grande ville du Canada, et la CN Tower au-dessus de tout.", photos: [], video: "" },
      { nom: "Chutes du Niagara", lon: -79.0747, lat: 43.0799, zoom: 14.5, pitch: 60, bearing: 30,
        texte: "Les chutes, de tout près.", photos: [], video: "" },
      { nom: "Sandbanks", lon: -77.2600, lat: 43.9100, zoom: 12, pitch: 55,
        texte: "Des dunes de sable et des plages au bord du lac Ontario.", photos: [], video: "" },
      { nom: "Ottawa", lon: -75.7009, lat: 45.4236, zoom: 14.5, pitch: 60,
        texte: "La capitale, avec le Parlement sur sa colline.", photos: [], video: "" },
    ],
  },
  {
    titre: "New York, Long Island, Lake George & Whiteface",
    kicker: "Road trip 3",
    dates: "",
    couleur: "#bf5af2",
    boucle: true,
    intro: "Descente vers New York, la côte de Long Island, puis remontée par les Adirondacks.",
    etapes: [
      { nom: "New York", lon: -73.9855, lat: 40.7580, zoom: 14.5, pitch: 62,
        texte: "Manhattan, de Times Square aux gratte-ciel.", photos: [], video: "" },
      /* Long Island est grande : remplace par l'endroit précis où tu es allé */
      { nom: "Long Island", lon: -73.1000, lat: 40.8500, zoom: 9.5, pitch: 45,
        texte: "Les plages de l’Atlantique, à l’est de New York.", photos: [], video: "" },
      { nom: "Lake George", lon: -73.7123, lat: 43.4262, zoom: 11.5, pitch: 60, bearing: 20,
        texte: "Un long lac entouré de montagnes, dans les Adirondacks.", photos: [], video: "" },
      { nom: "Whiteface Mountain", lon: -73.9026, lat: 44.3659, zoom: 12.5, pitch: 70, bearing: -30,
        texte: "La route jusqu’au sommet, avec la vue sur les Adirondacks.", photos: [], video: "" },
    ],
  },
  {
    titre: "La Mauricie",
    kicker: "Road trip 4",
    dates: "",
    couleur: "#30d158",
    boucle: true,
    intro: "Forêts, lacs et nature au parc national de la Mauricie.",
    etapes: [
      { nom: "Parc national de la Mauricie", lon: -72.9800, lat: 46.7400, zoom: 11.5, pitch: 62,
        texte: "Des forêts et des lacs à perte de vue.", photos: [], video: "" },
      { nom: "La Tuque — hydravion", lon: -72.7830, lat: 47.4380, zoom: 12, pitch: 60, bearing: 15,
        texte: "Un vol en hydravion au-dessus des lacs et des forêts.", photos: [], video: "" },
    ],
  },
  {
    titre: "Mont Washington, Maine & Boston",
    kicker: "Road trip 5",
    dates: "",
    couleur: "#64d2ff",
    boucle: true,
    intro: "Le sommet du mont Washington dans les White Mountains, puis la côte de la Nouvelle-Angleterre : Portland, Kennebunkport, Ogunquit, Portsmouth, jusqu’à Boston.",
    etapes: [
      { nom: "Sommet du mont Washington", lon: -71.3033, lat: 44.2706, zoom: 12.5, pitch: 72, bearing: -25,
        texte: "Le plus haut sommet du nord-est des États-Unis.", photos: [], video: "" },
      { nom: "Portland", lon: -70.2530, lat: 43.6567, zoom: 14, pitch: 60, bearing: 20,
        texte: "Le port, ses vieilles rues et les phares tout près.", photos: [], video: "" },
      { nom: "Kennebunkport", lon: -70.4767, lat: 43.3615, zoom: 14, pitch: 58,
        texte: "Un petit port de la côte du Maine.", photos: [], video: "" },
      { nom: "Ogunquit", lon: -70.5935, lat: 43.2479, zoom: 14, pitch: 58, bearing: -20,
        texte: "Le chemin qui longe la mer sur les rochers.", photos: [], video: "" },
      { nom: "Portsmouth", lon: -70.7570, lat: 43.0766, zoom: 14.5, pitch: 60,
        texte: "Une petite ville portuaire du New Hampshire.", photos: [], video: "" },
      { nom: "Boston", lon: -71.0568, lat: 42.3600, zoom: 14.5, pitch: 62, bearing: -30,
        texte: "La plus vieille grande ville des États-Unis, pour finir le road trip.", photos: [], video: "" },
    ],
  },
];
