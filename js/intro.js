/* =========================================================
   Intro : la planète en points, l'avion qui vole de Paris
   à Montréal au fil du défilement, puis l'atterrissage sur
   la page d'accueil.
   Librairies (chargées dans index.html) : d3-geo, topojson.
   ========================================================= */

const PARIS = [2.35, 48.86];
const MTL = [-73.57, 45.5];
const VUE_DEPART = [-22, 34];             // centre du globe au début : l'Atlantique
const RAYON_TERRE = 6371;
const TERRES = "assets/vendor/land-110m.json";

const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lisse = (x) => x * x * x * (x * (x * 6 - 15) + 10);          // smootherstep
const entre = (p, a, b) => clamp((p - a) / (b - a));
const km = (n) => Math.round(n).toLocaleString("fr-FR").replace(/\s/g, " ");
/* Découpe un titre en mots masqués ; <em>…</em> est conservé (italique) */
const mots = (html) => {
  let ital = false;
  return html.split(/(<\/?em>|\s+)/).filter(Boolean).map((m) => {
    if (m === "<em>") { ital = true; return ""; }
    if (m === "</em>") { ital = false; return ""; }
    if (/^\s+$/.test(m)) return " ";
    return `<span class="im"><span>${ital ? `<em>${m}</em>` : m}</span></span>`;
  }).join("");
};

/* Silhouette d'avion vue du dessus, nez vers le haut (boîte 24×24) */
const AVION = new Path2D("M12 1.2c.95 0 1.55 1.05 1.55 2.4v5.2l8.2 4.75v2.2l-8.2-2.5v5.2l2.5 1.9v1.65L12 21.2l-4.05.8v-1.65l2.5-1.9v-5.2l-8.2 2.5v-2.2l8.2-4.75V3.6c0-1.35.6-2.4 1.55-2.4z");

const LEGENDES = [
  { de: 0.00, k: "Départ · Roissy-Charles-de-Gaulle", t: "Paris, <em>un aller simple.</em>" },
  { de: 0.24, k: "48°N · Océan Atlantique", t: "Au-dessus <em>de l’Atlantique.</em>" },
  { de: 0.52, k: "Terre-Neuve · Labrador", t: "Le Canada <em>se dessine.</em>" },
  { de: 0.78, k: "Approche · Montréal-Trudeau", t: "Descente <em>sur Montréal.</em>" },
];

export function intro() {
  const section = document.getElementById("intro");
  if (!section || !window.d3?.geoOrthographic) {      // librairie absente : on saute l'intro
    section?.remove();
    document.body.classList.remove("en-vol");
    return;
  }
  const d3 = window.d3;
  const scene = section.querySelector(".intro-scene");
  const canvas = section.querySelector("canvas");
  const ctx = canvas.getContext("2d");

  /* ---------- Textes ---------- */
  const leg = section.querySelector(".intro-legendes");
  leg.innerHTML = LEGENDES.map((l) =>
    `<div class="legende"><div class="legende-k">${l.k}</div><p class="legende-t">${mots(l.t)}</p></div>`).join("");
  const legendes = [...leg.children];
  const compteur = section.querySelector(".intro-km b");
  const repere = section.querySelector(".intro-piste i");
  const remplissage = section.querySelector(".intro-piste b");
  const bienvenue = section.querySelector(".intro-bienvenue");

  /* ---------- Géométrie ---------- */
  const proj = d3.geoOrthographic().clipAngle(90).precision(0.4);
  const chemin = d3.geoPath(proj, ctx);
  const graticule = d3.geoGraticule10();
  const vol = d3.geoInterpolate(PARIS, MTL);
  const camera = d3.geoInterpolate(VUE_DEPART, MTL);
  const distance = d3.geoDistance(PARIS, MTL) * RAYON_TERRE;
  const trace = d3.range(0, 1.0001, 1 / 160).map(vol);

  let points = [];          // [lon, lat] des points posés sur les terres
  let w = 0, h = 0, dpr = 1;

  const redimensionner = () => {
    dpr = Math.min(2, devicePixelRatio || 1);
    w = scene.clientWidth; h = scene.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    canvas.style.width = `${w}px`; canvas.style.height = `${h}px`;
    besoin = true;
  };

  /* Points des continents : on peint les terres sur une petite carte plate,
     puis on garde les cases peintes (très rapide, pas de calcul géométrique). */
  fetch(TERRES).then((r) => r.json()).then((topo) => {
    const terres = window.topojson.feature(topo, topo.objects.land);
    const W = 1080, H = 540;
    const c = document.createElement("canvas");
    c.width = W; c.height = H;
    const cc = c.getContext("2d", { willReadFrequently: true });
    const plat = d3.geoEquirectangular().scale(W / (2 * Math.PI)).translate([W / 2, H / 2]);
    cc.fillStyle = "#fff";
    cc.beginPath(); d3.geoPath(plat, cc)(terres); cc.fill();
    const px = cc.getImageData(0, 0, W, H).data;
    const pas = 1.25;                                    // écart entre les points, en degrés
    for (let lat = -84; lat <= 84; lat += pas) {
      const pasLon = pas / Math.cos(lat * Math.PI / 180);
      for (let lon = -180; lon < 180; lon += pasLon) {
        const [x, y] = plat([lon, lat]);
        if (px[((y | 0) * W + (x | 0)) * 4 + 3] > 128) points.push([lon, lat]);
      }
    }
    section.classList.add("terres-pretes");
    besoin = true;
  }).catch(() => section.classList.add("terres-pretes"));

  /* ---------- Défilement → progression (avec inertie) ---------- */
  let cible = 0, p = 0, besoin = true, horloge = 0;
  const lireDefilement = () => {
    const r = section.getBoundingClientRect();
    cible = clamp(-r.top / Math.max(1, section.offsetHeight - innerHeight));
  };

  let legendeActive = -1, atterri = false, enVol = true;

  const dessiner = (t) => {
    const f = lisse(entre(p, 0.07, 0.78));             // vol
    const a = entre(p, 0.78, 1);                        // atterrissage
    const az = Math.pow(a, 2.2);

    /* Caméra : suit l'avion, puis plonge sur Montréal */
    const derive = reduceMotion ? 0 : Math.sin(t / 4000) * 2.5 * (1 - f);
    const [cl, cp] = camera(lisse(clamp(f * 1.05)));
    const base = Math.min(w, h) * (w < 700 ? 0.46 : 0.38);
    const r = base * (1 + 0.18 * Math.sin(f * Math.PI)) * (1 + az * 26);
    const cy = h * (0.5 + 0.06 * (1 - f) - 0.02 * a);
    proj.rotate([-(cl + derive), -cp]).scale(r).translate([w / 2, cy]);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    /* Sphère + bord */
    ctx.beginPath(); chemin({ type: "Sphere" });
    const g = ctx.createRadialGradient(w / 2 - r * 0.3, cy - r * 0.35, r * 0.1, w / 2, cy, r);
    g.addColorStop(0, "#151517"); g.addColorStop(1, "#050506");
    ctx.fillStyle = g; ctx.fill();
    ctx.lineWidth = 1; ctx.strokeStyle = "rgba(255,255,255,.14)"; ctx.stroke();

    /* Méridiens et parallèles */
    ctx.beginPath(); chemin(graticule);
    ctx.strokeStyle = `rgba(255,255,255,${0.05 * (1 - a)})`; ctx.lineWidth = 0.6; ctx.stroke();

    /* Continents en points (ombrés vers le bord) */
    const [rl, rp] = proj.rotate();
    const l0 = -rl * Math.PI / 180, p0 = -rp * Math.PI / 180;
    const sp0 = Math.sin(p0), cp0 = Math.cos(p0);
    const taille = Math.max(0.9, Math.min(2.2, r / 260));
    for (const [lon, lat] of points) {
      const la = lat * Math.PI / 180;
      const cosc = sp0 * Math.sin(la) + cp0 * Math.cos(la) * Math.cos(lon * Math.PI / 180 - l0);
      if (cosc <= 0.02) continue;
      const [x, y] = proj([lon, lat]);
      if (x < -4 || y < -4 || x > w + 4 || y > h + 4) continue;
      ctx.fillStyle = `rgba(245,245,247,${(0.12 + 0.5 * cosc) * (1 - a * 0.6) * apparition})`;
      ctx.fillRect(x - taille / 2, y - taille / 2, taille, taille);
    }

    /* Route : pointillés à venir, trait plein déjà parcouru */
    const n = Math.round(f * (trace.length - 1));
    ctx.lineCap = "round";
    ctx.setLineDash([2, 5]); ctx.lineWidth = 1.2; ctx.strokeStyle = "rgba(255,255,255,.35)";
    ctx.beginPath(); chemin({ type: "LineString", coordinates: trace.slice(Math.max(0, n)) }); ctx.stroke();
    ctx.setLineDash([]);
    if (n > 0) {
      ctx.lineWidth = 2; ctx.strokeStyle = "#fff";
      ctx.beginPath(); chemin({ type: "LineString", coordinates: [...trace.slice(0, n + 1), vol(f)] }); ctx.stroke();
    }

    /* Villes */
    const ville = (ll, nom, cote, visible) => {
      if (d3.geoDistance(ll, [cl + derive, cp]) > Math.PI / 2 - 0.05) return;
      const [x, y] = proj(ll);
      ctx.globalAlpha = visible * Math.max(0, 1 - a * 3);
      ctx.fillStyle = "#fff";
      ctx.beginPath(); ctx.arc(x, y, 3.2, 0, 7); ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,.35)"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(x, y, 8 + 3 * Math.sin(t / 500), 0, 7); ctx.stroke();
      ctx.font = `italic 400 ${Math.round(Math.min(34, Math.max(20, r / 14)))}px "Instrument Serif", serif`;
      ctx.textAlign = cote > 0 ? "left" : "right";
      ctx.fillText(nom, x + cote * 16, y - 10);
      ctx.globalAlpha = 1;
    };
    ville(PARIS, "Paris", 1, 1);
    ville(MTL, "Montréal", -1, 1);

    /* Avion + ombre portée (l'ombre s'éloigne avec l'altitude) */
    const pos = vol(f), devant = vol(Math.min(1, f + 0.004)), derriere = vol(Math.max(0, f - 0.004));
    const [ax, ay] = proj(pos);
    const [bx, by] = proj(f < 0.996 ? devant : pos), [zx, zy] = proj(f < 0.996 ? pos : derriere);
    const cap = Math.atan2(bx - zx, -(by - zy));
    const altitude = Math.sin(f * Math.PI);
    const echelle = (1 + 0.55 * altitude) * (w < 700 ? 1 : 1.25) * (1 - a * 0.7);
    if (a < 1) {
      const dessinAvion = (x, y, couleur) => {
        ctx.save(); ctx.translate(x, y); ctx.rotate(cap); ctx.scale(echelle, echelle); ctx.translate(-12, -12);
        ctx.fillStyle = couleur; ctx.fill(AVION); ctx.restore();
      };
      dessinAvion(ax + 10 * altitude, ay + 16 * altitude, `rgba(0,0,0,${0.55 * (1 - a)})`);
      ctx.globalAlpha = 1 - a;
      dessinAvion(ax, ay, "#fff");
      ctx.globalAlpha = 1;
    }

    /* ---------- Textes ---------- */
    compteur.textContent = km(distance * f);
    const pct = `${(f * 100).toFixed(2)}%`;
    remplissage.style.width = pct;
    repere.style.left = pct;
    section.style.setProperty("--depart", entre(p, 0.005, 0.06).toFixed(3));
    section.style.setProperty("--atterrissage", a.toFixed(3));

    let i = -1;
    if (p > 0.05 && a < 0.06) LEGENDES.forEach((l, k) => { if (f >= l.de) i = k; });
    if (i !== legendeActive) {
      legendes.forEach((el, k) => {
        el.classList.toggle("on", k === i);
        el.classList.toggle("passee", k < i || (i === -1 && legendeActive > -1 && k <= legendeActive && p > 0.05));
      });
      legendeActive = i;
    }
    bienvenue.classList.toggle("on", a > 0.2 && a < 0.62);

    /* Fin du vol : on rend la main au site */
    const vole = p < 0.985;
    if (vole !== enVol) { enVol = vole; document.body.classList.toggle("en-vol", vole); }
    if (!atterri && a > 0.82) {
      atterri = true;
      document.dispatchEvent(new CustomEvent("atterrissage"));
    }
  };

  let apparition = 0;                      // les continents apparaissent en fondu
  const boucle = (t) => {
    if (points.length && apparition < 1) { apparition = Math.min(1, apparition + 0.025); besoin = true; }
    lireDefilement();
    const avant = p;
    p += (cible - p) * (reduceMotion ? 1 : 0.11);
    if (Math.abs(cible - p) < 0.0004) p = cible;
    const visible = section.getBoundingClientRect().bottom > 0;
    if (!visible || cible >= 0.999) {          // intro dépassée (même d'un coup) : le site est rendu
      if (enVol) { enVol = false; document.body.classList.remove("en-vol"); }
      if (!atterri) { atterri = true; document.dispatchEvent(new CustomEvent("atterrissage")); }
    }
    // on redessine tant que ça bouge, et doucement au repos (le globe dérive, les villes pulsent)
    if (visible && (besoin || p !== avant || t - horloge > 33)) {
      try { dessiner(t); } catch (err) { console.error("intro", err); }
      besoin = false; horloge = t;
    }
    requestAnimationFrame(boucle);
  };

  addEventListener("resize", redimensionner);
  redimensionner();
  lireDefilement(); p = cible;
  requestAnimationFrame(boucle);
}
