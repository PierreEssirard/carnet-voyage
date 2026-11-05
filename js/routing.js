/* Calcul des itinéraires sur les vraies routes.
   1. D'abord les routes pré-calculées (js/itineraires.js) : instantané,
      aucune requête réseau.
   2. Sinon le service gratuit OSRM d'OpenStreetMap, une requête à la fois
      (il répond « 429 trop de requêtes » si on en envoie plusieurs d'un coup),
      avec nouvel essai en cas de refus. Le résultat est gardé dans le navigateur.
   3. En dernier recours : ligne droite. */

import { densify } from "./geo.js?v=5";
import { ITINERAIRES } from "./itineraires.js?v=1";

const SERVEURS = {
  car:  "https://routing.openstreetmap.de/routed-car/route/v1/driving/",
  bike: "https://routing.openstreetmap.de/routed-bike/route/v1/driving/",
  foot: "https://routing.openstreetmap.de/routed-foot/route/v1/driving/",
};

const CLE_CACHE = "carnet-itineraires-v1";
const MAX_POINTS = 800;
const ESSAIS = 4;

let cache = {};
try { cache = JSON.parse(localStorage.getItem(CLE_CACHE)) || {}; } catch { cache = {}; }

function sauver() {
  try { localStorage.setItem(CLE_CACHE, JSON.stringify(cache)); } catch { /* stockage indisponible */ }
}

/** Décode une polyline (précision 5) en [[lon, lat], …]. */
function decoder(txt) {
  const out = [];
  let i = 0, lat = 0, lon = 0;
  const lire = () => {
    let res = 0, dec = 0, b;
    do { b = txt.charCodeAt(i++) - 63; res |= (b & 31) << dec; dec += 5; } while (b >= 32);
    return res & 1 ? ~(res >> 1) : res >> 1;
  };
  while (i < txt.length) {
    lat += lire(); lon += lire();
    out.push([lon / 1e5, lat / 1e5]);
  }
  return out;
}

/** Réduit le nombre de points et arrondit les coordonnées. */
function alleger(coords) {
  const pas = Math.max(1, Math.ceil(coords.length / MAX_POINTS));
  const out = coords.filter((_, i) => i % pas === 0);
  const dernier = coords[coords.length - 1];
  if (out[out.length - 1] !== dernier) out.push(dernier);
  return out.map(([x, y]) => [+x.toFixed(5), +y.toFixed(5)]);
}

const pause = (ms) => new Promise((r) => setTimeout(r, ms));

/* File d'attente : une seule requête OSRM à la fois */
let file = Promise.resolve();
const enFile = (tache) => {
  const p = file.then(tache, tache);
  file = p.catch(() => {}).then(() => pause(400));
  return p;
};

async function demander(url) {
  for (let essai = 0; essai < ESSAIS; essai++) {
    const ctrl = new AbortController();
    const delai = setTimeout(() => ctrl.abort(), 10000);
    try {
      const rep = await fetch(url, { signal: ctrl.signal });
      if (rep.status === 429 || rep.status >= 500) { await pause(1500 * (essai + 1)); continue; }
      if (!rep.ok) throw new Error(rep.status);
      const geom = (await rep.json()).routes?.[0]?.geometry?.coordinates;
      if (!geom || geom.length < 2) throw new Error("pas d'itinéraire");
      return geom;
    } finally {
      clearTimeout(delai);
    }
  }
  throw new Error("serveur saturé (429)");
}

/**
 * Itinéraire passant par une liste de points [lon, lat].
 * @param {number[][]} points
 * @param {"car"|"bike"|"foot"|null} profil
 */
export async function itineraire(points, profil) {
  const droit = densify(points);
  if (!profil || !SERVEURS[profil] || points.length < 2) return droit;

  const coords = points.map(([x, y]) => `${x.toFixed(5)},${y.toFixed(5)}`).join(";");
  const cle = `${profil}:${coords}`;
  if (ITINERAIRES[cle]) return decoder(ITINERAIRES[cle]);
  if (cache[cle]) return cache[cle];

  try {
    const geom = await enFile(() => demander(`${SERVEURS[profil]}${coords}?overview=full&geometries=geojson`));
    cache[cle] = alleger(geom);
    sauver();
    return cache[cle];
  } catch (e) {
    console.warn("Itinéraire indisponible, ligne droite utilisée :", e.message || e);
    return droit;
  }
}
