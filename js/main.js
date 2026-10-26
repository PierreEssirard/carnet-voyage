/* Point d'entrée : relie le récit, la carte, le défilement et les effets. */

import { BASE, MONTREAL, TRIPS, TRANSPORTS } from "./data.js";
import { renderStory } from "./story.js";
import { createMap, Carte } from "./map.js";
import { itineraire } from "./routing.js";
import { suivreDefilement } from "./scroll.js";
import { apparitions, barreProgression, visionneuse } from "./effets.js";
import { ll } from "./geo.js";

/* 1. Le récit et les effets (avant la carte : le texte s'affiche tout de suite) */
renderStory(document.getElementById("story"), { MONTREAL, TRIPS, TRANSPORTS, BASE });
apparitions();
barreProgression();
visionneuse();

/* Bouton réduire / agrandir la carte */
const racine = document.documentElement;
const bouton = document.getElementById("map-toggle");
const MINI = "carte-mini";
try { if (localStorage.getItem(MINI) === "1") document.body.classList.add(MINI); } catch { /* */ }

let vueActuelle = null;
let pret = false;          // la carte est-elle chargée ?
let vueEnAttente = "mtl";
let map = null;
const etiquette = document.getElementById("maptag-txt");

const majBouton = () => {
  const mini = document.body.classList.contains(MINI);
  bouton.setAttribute("aria-label", mini ? "Agrandir la carte" : "Réduire la carte");
  bouton.title = bouton.getAttribute("aria-label");
};
majBouton();
bouton.addEventListener("click", () => {
  const mini = document.body.classList.toggle(MINI);
  try { localStorage.setItem(MINI, mini ? "1" : "0"); } catch { /* */ }
  majBouton();
  setTimeout(() => { if (pret) { map.resize(); afficher(vueActuelle, true); } }, 520);
});

/* Le défilement est suivi tout de suite, même si la carte charge encore */
suivreDefilement("[data-view]", (vue) => afficher(vue));

/* 2. La carte (démarre en 3D sur Montréal) */
map = await createMap("map", MONTREAL.camera);
const carte = new Carte(map);

/* Points de chaque road trip (avec départ/retour Montréal si boucle) */
const pointsTrip = TRIPS.map((t) => [
  ...(t.boucle ? [ll(BASE)] : []),
  ...t.etapes.map(ll),
  ...(t.boucle ? [ll(BASE)] : []),
]);
const tousLesPoints = [ll(BASE), ...TRIPS.flatMap((t) => t.etapes.map(ll))];

/* Lignes */
TRIPS.forEach((t, i) => {
  carte.ajouterLigne(`trip-${i}`, t.couleur, 3);
  carte.setLigne(`trip-${i}`, pointsTrip[i]); // provisoire (ligne droite)
});
MONTREAL.parcours.forEach((_, k) => carte.ajouterLigne(`mtl-${k}`, MONTREAL.couleur, 4));
/* Départ, arrêts intermédiaires (par) et arrivée d'un trajet en ville */
const lieuxParcours = (s) => [s.de, ...(s.par || []), s.a];

/* Repères */
const repBase = carte.repere(ll(BASE), BASE.nom, MONTREAL.couleur, { base: true });
const repTrips = TRIPS.map((t) => t.etapes.map((e) => carte.repere(ll(e), e.nom, t.couleur)));
const repMtl = new Map();
MONTREAL.parcours.forEach((s) => lieuxParcours(s).forEach((p) => {
  if (!repMtl.has(p.nom)) repMtl.set(p.nom, carte.repere(ll(p), p.nom, MONTREAL.couleur));
}));

/* 3. Vraies routes, chargées en arrière-plan */
TRIPS.forEach((t, i) => {
  itineraire(pointsTrip[i], "car").then((coords) => carte.setLigne(`trip-${i}`, coords));
});
const pretsMtl = MONTREAL.parcours.map((s, k) => {
  const profil = (TRANSPORTS[s.transport] || TRANSPORTS.pied).profil;
  return itineraire(lieuxParcours(s).map(ll), profil).then((coords) => carte.setLigne(`mtl-${k}`, coords));
});

/* 4. Ce que montre la carte pour chaque partie du récit */
const etat = (el, s) => { el.dataset.state = s; };
let tripTrace = -1;

function legende(type, i, j) {
  switch (type) {
    case "mtl": return { txt: "Montréal · vue 3D", c: MONTREAL.couleur };
    case "mtl-intro": return { txt: "Montréal", c: MONTREAL.couleur };
    case "mtl-step": {
      const s = MONTREAL.parcours[i];
      return { txt: `${(TRANSPORTS[s.transport] || TRANSPORTS.pied).emoji} ${s.de.nom} → ${s.a.nom}`, c: MONTREAL.couleur };
    }
    case "trip": return { txt: `${TRIPS[i].kicker} · ${TRIPS[i].titre}`, c: TRIPS[i].couleur };
    case "stop": return { txt: `${TRIPS[i].etapes[j].nom} · ${TRIPS[i].kicker}`, c: TRIPS[i].couleur };
    default: return { txt: "Vue d’ensemble", c: "#8fa3b8" };
  }
}

function afficher(vue, forcer = false) {
  if (vue === vueActuelle && !forcer) return;
  const [type, a, b] = vue.split(":");
  const i = +a, j = +b;
  const enVille = type.startsWith("mtl");

  /* Ambiance : couleur active + étiquette sur la carte */
  const { txt, c } = legende(type, i, j);
  racine.style.setProperty("--c-active", c);
  etiquette.textContent = txt;

  if (!pret) { vueEnAttente = vue; return; }   // la carte rattrapera au chargement
  vueActuelle = vue;

  /* Lignes */
  TRIPS.forEach((_, n) => {
    let o = 0.9;
    if (enVille) o = 0.15;
    else if (type === "trip" || type === "stop") o = n === i ? 1 : 0.1;
    carte.opacite(`trip-${n}`, o);
  });
  MONTREAL.parcours.forEach((_, k) => {
    carte.opacite(`mtl-${k}`, !enVille ? 0 : type === "mtl-step" ? (k === i ? 1 : 0.25) : 0.8);
  });

  /* Repères */
  etat(repBase, enVille ? "hidden" : "on");
  repTrips.forEach((liste, n) => liste.forEach((el, m) => {
    if (enVille) etat(el, "hidden");
    else if (type === "overview") etat(el, "dot");
    else if (n !== i) etat(el, "hidden");
    else etat(el, type === "stop" && m === j ? "cur" : "on");
  }));
  repMtl.forEach((el) => etat(el, enVille ? "on" : "hidden"));
  if (type === "mtl-step") {
    const s = MONTREAL.parcours[i];
    const noms = lieuxParcours(s).map((p) => p.nom);
    repMtl.forEach((el, nom) => etat(el, noms.includes(nom) ? "on" : "dot"));
  }
  if (type !== "mtl-step") carte.cacherMobile();

  /* Tracé lumineux quand on entre dans un road trip */
  if ((type === "trip" || type === "stop") && tripTrace !== i) {
    tripTrace = i;
    carte.tracer(`trip-${i}`);
  }
  if (type !== "trip" && type !== "stop") tripTrace = -1;

  /* Caméra */
  switch (type) {
    case "mtl":
      carte.voler(MONTREAL.camera, { orbite: 3 });
      break;
    case "mtl-intro": {
      const pts = MONTREAL.parcours.flatMap((s) => lieuxParcours(s).map(ll));
      if (pts.length) carte.cadrer(pts, { pitch: 55, bearing: -25, maxZoom: 15 });
      else carte.voler(MONTREAL.camera);
      break;
    }
    case "mtl-step": {
      const s = MONTREAL.parcours[i];
      const tr = TRANSPORTS[s.transport] || TRANSPORTS.pied;
      pretsMtl[i].then(() => { if (vueActuelle === vue) carte.suivre(`mtl-${i}`, tr.emoji); });
      break;
    }
    case "overview":
      carte.cadrer(tousLesPoints, { pitch: 20, bearing: 0 });
      break;
    case "trip":
      carte.cadrer(pointsTrip[i], { pitch: 35, bearing: -10, maxZoom: 9 });
      break;
    case "stop": {
      const e = TRIPS[i].etapes[j];
      carte.voler({ center: ll(e), zoom: e.zoom ?? 11, pitch: e.pitch ?? 55, bearing: e.bearing ?? -20 });
      break;
    }
  }
}

/* 5. C'est parti */
pret = true;
document.body.classList.add("carte-prete");
afficher(vueEnAttente, true);
