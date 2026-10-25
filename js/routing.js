/* Calcul des itinéraires sur les vraies routes (OSRM, service gratuit
   d'OpenStreetMap). En cas d'échec : ligne droite. Les résultats sont
   gardés dans le navigateur pour ne pas refaire les requêtes. */

import { densify } from "./geo.js";

const SERVEURS = {
  car:  "https://routing.openstreetmap.de/routed-car/route/v1/driving/",
  bike: "https://routing.openstreetmap.de/routed-bike/route/v1/driving/",
  foot: "https://routing.openstreetmap.de/routed-foot/route/v1/driving/",
};

const CLE_CACHE = "carnet-itineraires-v1";
const MAX_POINTS = 800;

let cache = {};
try { cache = JSON.parse(localStorage.getItem(CLE_CACHE)) || {}; } catch { cache = {}; }

function sauver() {
  try { localStorage.setItem(CLE_CACHE, JSON.stringify(cache)); } catch { /* stockage indisponible */ }
}

/** Réduit le nombre de points et arrondit les coordonnées. */
function alleger(coords) {
  const pas = Math.max(1, Math.ceil(coords.length / MAX_POINTS));
  const out = coords.filter((_, i) => i % pas === 0);
  const dernier = coords[coords.length - 1];
  if (out[out.length - 1] !== dernier) out.push(dernier);
  return out.map(([x, y]) => [+x.toFixed(5), +y.toFixed(5)]);
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
  if (cache[cle]) return cache[cle];

  try {
    const ctrl = new AbortController();
    const delai = setTimeout(() => ctrl.abort(), 10000);
    const rep = await fetch(`${SERVEURS[profil]}${coords}?overview=full&geometries=geojson`, { signal: ctrl.signal });
    clearTimeout(delai);
    if (!rep.ok) throw new Error(rep.status);
    const json = await rep.json();
    const geom = json.routes?.[0]?.geometry?.coordinates;
    if (!geom || geom.length < 2) throw new Error("pas d'itinéraire");
    cache[cle] = alleger(geom);
    sauver();
    return cache[cle];
  } catch (e) {
    console.warn("Itinéraire indisponible, ligne droite utilisée :", e.message || e);
    return droit;
  }
}
