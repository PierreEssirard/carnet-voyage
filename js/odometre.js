/* Compteur de kilomètres du voyage.
   Estimation : distance à vol d'oiseau × un coefficient « route »
   (les routes ne sont jamais droites), vol Paris → Montréal compris. */

import { BASE, MONTREAL, TRIPS } from "./data.js?v=5";
import { dist, ll } from "./geo.js?v=5";

const VOL = 5525;                                     // Paris → Montréal (km)
const FACTEUR_ROUTE = 1.25;                           // routes vs ligne droite
const FACTEUR_VILLE = { pied: 1.3, velo: 1.3, bus: 1.35, metro: 1.2, voiture: 1.35, train: 1.15, bateau: 1.1 };
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const fmt = (n) => Math.round(n).toLocaleString("fr-FR").replace(/\s/g, " ");

/** Kilomètres cumulés à chaque étape du récit (clé = data-view). */
function calculer() {
  const km = { mtl: VOL, "mtl-intro": VOL };
  let total = VOL;

  // Trajets dans Montréal : aller-retour depuis la maison
  MONTREAL.parcours.forEach((s, k) => {
    const pts = [s.de, ...(s.par || []), s.a].map(ll);
    let d = 0;
    for (let i = 1; i < pts.length; i++) d += dist(pts[i - 1], pts[i]);
    total += d * 2 * (FACTEUR_VILLE[s.transport] || 1.3);
    km[`mtl-step:${k}`] = total;
  });
  const apresMontreal = total;

  // Road trips : départ de Montréal, étape par étape, retour à Montréal
  TRIPS.forEach((t, i) => {
    km[`trip:${i}`] = total;
    let prec = t.boucle ? ll(BASE) : ll(t.etapes[0]);
    t.etapes.forEach((e, j) => {
      total += dist(prec, ll(e)) * FACTEUR_ROUTE;
      prec = ll(e);
      km[`stop:${i}:${j}`] = total;
    });
    if (t.boucle) total += dist(prec, ll(BASE)) * FACTEUR_ROUTE;     // retour
  });
  return { km, apresMontreal, total };
}

export function odometre() {
  const { km, apresMontreal, total } = calculer();

  const el = document.createElement("div");
  el.className = "odo";
  el.setAttribute("aria-live", "polite");
  el.innerHTML = `
    <span class="odo-k">Kilomètres parcourus</span>
    <span class="odo-n"><b>${fmt(VOL)}</b><i>km</i></span>
    <span class="odo-plus" aria-hidden="true"></span>`;
  document.body.appendChild(el);
  const n = el.querySelector("b"), plus = el.querySelector(".odo-plus");

  let affiche = VOL, cible = VOL, raf = 0, dernierStop = false;
  const animer = () => {
    affiche += (cible - affiche) * 0.08;
    if (Math.abs(cible - affiche) < 0.5) affiche = cible;
    n.textContent = fmt(affiche);
    raf = affiche !== cible ? requestAnimationFrame(animer) : 0;
  };

  return (vue) => {
    let v = km[vue];
    if (vue === "overview") v = dernierStop ? total : apresMontreal;   // vue d'ensemble / fin du carnet
    dernierStop = vue.startsWith("stop:") || vue.startsWith("trip:") || (vue === "overview" && dernierStop);
    if (v == null) return;
    const ecart = Math.round(v - cible);
    cible = v;
    if (ecart > 0) {
      plus.textContent = `+${fmt(ecart)} km`;
      plus.classList.remove("on"); void plus.offsetWidth; plus.classList.add("on");
    }
    if (reduceMotion) { affiche = cible; n.textContent = fmt(cible); return; }
    if (!raf) raf = requestAnimationFrame(animer);
  };
}
