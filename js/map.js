/* Carte 3D (MapLibre) en mode nuit : fond recoloré, bâtiments 3D,
   itinéraires lumineux, repères, caméra et trajet animé.
   Pensée pour rester légère : pas de relief 3D par défaut, résolution
   plafonnée, animations qui ne recalculent pas la géométrie. */

import { cumul, along, bearing, angleDiff, lineFeature } from "./geo.js?v=5";

/* ---------- Réglages ---------- */
const STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";
/* Relief 3D des montagnes : joli mais gourmand. Passe à true pour l'activer. */
const RELIEF = false;
const DEM_URL = "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png";

/* Palette de nuit */
const NUIT = {
  fond:      "#1c1c1e",
  sol:       "#1f1f21",
  vert:      "#1e2a21",
  eau:       "#14273a",
  eauLigne:  "#1c3550",
  route:     "#2e2e31",
  routeMaj:  "#3d3d41",
  frontiere: "#4a4a4e",
  bati:      "#2a2a2d",
  texte:     "#8e8e93",
  halo:      "#1c1c1e",
};

export const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const estMobile = matchMedia("(max-width: 800px)").matches;

/** Crée la carte et attend qu'elle soit prête. */
export function createMap(containerId, camera) {
  const map = new maplibregl.Map({
    container: containerId,
    style: STYLE_URL,
    center: camera.center,
    zoom: camera.zoom,
    pitch: camera.pitch,
    bearing: camera.bearing,
    maxPitch: 75,
    pixelRatio: Math.min(window.devicePixelRatio || 1, 1.5), // allège les écrans Retina
    fadeDuration: 150,
    attributionControl: { compact: true },
    // Sur téléphone : un doigt fait défiler la page, deux doigts bougent la carte
    cooperativeGestures: estMobile,
    locale: {
      "CooperativeGesturesHandler.MobileHelpText": "Utilise deux doigts pour déplacer la carte",
      "CooperativeGesturesHandler.WindowsHelpText": "Ctrl + molette pour zoomer",
      "CooperativeGesturesHandler.MacHelpText": "⌘ + molette pour zoomer",
    },
  });
  map.addControl(new maplibregl.NavigationControl({ visualizePitch: true, showCompass: true }), "top-left");
  map.scrollZoom.disable(); // la molette sert à faire défiler le récit

  return new Promise((resolve) => {
    map.on("load", () => {
      habillerNuit(map);
      batiments3D(map);
      if (RELIEF) relief(map);
      ciel(map);
      resolve(map);
    });
  });
}

/* ---------- Habillage ---------- */

function habillerNuit(map) {
  for (const l of map.getStyle().layers) {
    const id = l.id.toLowerCase();
    const set = (p, v) => { try { map.setPaintProperty(l.id, p, v); } catch { /* propriété absente */ } };
    const cacher = () => map.setLayoutProperty(l.id, "visibility", "none");

    // on retire ce qui encombre : points d'intérêt, numéros, rails, icônes…
    if (l.type !== "fill" && l.type !== "background" &&
        /poi|housenumber|aeroway|ferry|oneway|shield|peak|transit|rail|aerialway|bridge_pattern/.test(id)) { cacher(); continue; }

    switch (l.type) {
      case "background":
        set("background-color", NUIT.fond); break;
      case "fill":
        if (l.paint?.["fill-pattern"]) { cacher(); break; }
        if (/water|ocean|lake|river/.test(id)) set("fill-color", NUIT.eau);
        else if (/park|wood|forest|grass|landcover|wetland|scrub|farm/.test(id)) set("fill-color", NUIT.vert);
        else if (/building/.test(id)) set("fill-color", NUIT.bati);
        else set("fill-color", NUIT.sol);
        set("fill-outline-color", "rgba(0,0,0,0)");
        break;
      case "line":
        if (/water|river|stream|canal/.test(id)) set("line-color", NUIT.eauLigne);
        else if (/boundary|admin/.test(id)) set("line-color", NUIT.frontiere);
        else if (/motorway|trunk|primary/.test(id)) set("line-color", NUIT.routeMaj);
        else set("line-color", NUIT.route);
        break;
      case "symbol":
        set("text-color", NUIT.texte);
        set("text-halo-color", NUIT.halo);
        set("text-halo-width", 1.2);
        set("icon-opacity", 0);
        break;
      case "hillshade":
        cacher(); break;
    }
  }
}

function premierCalqueTexte(map) {
  return map.getStyle().layers.find((l) => l.type === "symbol")?.id;
}

function batiments3D(map) {
  const paint = {
    // plus c'est haut, plus ça s'illumine
    "fill-extrusion-color": ["interpolate", ["linear"], ["coalesce", ["get", "render_height"], 0],
      0, "#2a2a2d", 40, "#313134", 120, "#38383c", 250, "#424246"],
    "fill-extrusion-height": ["coalesce", ["get", "render_height"], 8],
    "fill-extrusion-base": ["coalesce", ["get", "render_min_height"], 0],
    "fill-extrusion-opacity": 0.92,
    "fill-extrusion-vertical-gradient": true,
  };
  let id = "building-3d";
  if (!map.getLayer(id)) {
    id = "batiments-3d";
    map.addLayer({ id, type: "fill-extrusion", source: "openmaptiles", "source-layer": "building", paint },
      premierCalqueTexte(map));
  } else {
    for (const [k, v] of Object.entries(paint)) map.setPaintProperty(id, k, v);
  }
  map.setLayerZoomRange(id, 14, 24); // bâtiments seulement de près : bien plus léger
}

function relief(map) {
  map.addSource("relief", { type: "raster-dem", tiles: [DEM_URL], encoding: "terrarium", tileSize: 256, maxzoom: 13 });
  map.setTerrain({ source: "relief", exaggeration: 1.3 });
}

function ciel(map) {
  try {
    map.setSky({
      "sky-color": "#0e0e10",
      "horizon-color": "#1c1c1e",
      "fog-color": "#1c1c1e",
      "sky-horizon-blend": 0.6,
      "horizon-fog-blend": 0.7,
      "fog-ground-blend": 0.4,
    });
  } catch { /* ciel non supporté : pas grave */ }
}

/* ---------- Dégradé lumineux qui « dessine » une ligne ---------- */

const VIDE = "rgba(0,0,0,0)";

function degrade(couleur, p) {
  if (p >= 0.999) return ["interpolate", ["linear"], ["line-progress"], 0, couleur, 1, couleur];
  if (p <= 0) return ["interpolate", ["linear"], ["line-progress"], 0, VIDE, 1, VIDE];
  const stops = [0, couleur];
  if (p > 0.06) stops.push(p - 0.04, couleur);
  stops.push(p, couleur, Math.min(0.9999, p + 0.0005), VIDE);
  if (p + 0.0005 < 0.9999) stops.push(1, VIDE);
  return ["interpolate", ["linear"], ["line-progress"], ...stops];
}

/* ======================================================= */

export class Carte {
  constructor(map) {
    this.map = map;
    this.lignes = {};      // id → { coords, couleur }
    this.anim = {};        // id → requestAnimationFrame du tracé
    this.jeton = 0;        // invalide les animations obsolètes
    this.orbiteRaf = 0;
    this.trajetRaf = 0;
    this.camLibre = false; // l'utilisateur a pris la main sur la caméra
    this.mobile = null;

    const reprendreMain = () => { this.stopOrbite(); this.camLibre = true; };
    ["mousedown", "touchstart", "dragstart"].forEach((e) => map.on(e, reprendreMain));
  }

  /* ---------- Lignes néon ---------- */

  ajouterLigne(id, couleur, largeur = 3) {
    this.lignes[id] = { coords: [], couleur };
    this.map.addSource(id, { type: "geojson", data: lineFeature([]), lineMetrics: true });
    const layout = { "line-cap": "round", "line-join": "round" };
    const g = degrade(couleur, 1);
    this.map.addLayer({ id: `${id}-halo`, type: "line", source: id, layout,
      paint: { "line-gradient": g, "line-width": largeur + 4, "line-blur": 0, "line-opacity": 0,
               "line-opacity-transition": { duration: 600 } } });
    this.map.addLayer({ id, type: "line", source: id, layout,
      paint: { "line-gradient": g, "line-width": largeur, "line-opacity": 0,
               "line-opacity-transition": { duration: 600 } } });
  }

  setLigne(id, coords) {
    this.lignes[id].coords = coords;
    this.map.getSource(id)?.setData(lineFeature(coords));
  }

  progression(id, p) {
    const g = degrade(this.lignes[id].couleur, p);
    this.map.setPaintProperty(id, "line-gradient", g);
    this.map.setPaintProperty(`${id}-halo`, "line-gradient", g);
  }

  opacite(id, v) {
    this.map.setPaintProperty(id, "line-opacity", v);
    this.map.setPaintProperty(`${id}-halo`, "line-opacity", v * 0.25);
  }

  /** Dessine progressivement une ligne (sans toucher à la géométrie : léger). */
  tracer(id, duree = 2400) {
    cancelAnimationFrame(this.anim[id]);
    if (reduceMotion) { this.progression(id, 1); return; }
    const t0 = performance.now();
    const etape = (now) => {
      const p = Math.min(1, (now - t0) / duree);
      this.progression(id, 1 - Math.pow(1 - p, 3));
      if (p < 1) this.anim[id] = requestAnimationFrame(etape);
    };
    this.anim[id] = requestAnimationFrame(etape);
  }

  /* ---------- Caméra ---------- */

  stopTout() {
    this.stopOrbite();
    cancelAnimationFrame(this.trajetRaf);
    this.trajetRaf = 0;
    this.map.stop();
    this.camLibre = false;
  }

  stopOrbite() {
    cancelAnimationFrame(this.orbiteRaf);
    this.orbiteRaf = 0;
  }

  /** Rotation lente (degrés/seconde), limitée dans le temps pour économiser la batterie. */
  orbite(vitesse, dureeMax = 25000) {
    if (reduceMotion || !vitesse) return;
    this.stopOrbite();
    const debut = performance.now();
    let avant = debut;
    const etape = (now) => {
      const dt = Math.min(64, now - avant);
      avant = now;
      const fin = Math.min(1, (now - debut) / dureeMax);
      const v = vitesse * (1 - fin * fin);           // ralentit doucement jusqu'à l'arrêt
      this.map.setBearing(this.map.getBearing() + (v * dt) / 1000);
      this.orbiteRaf = fin < 1 ? requestAnimationFrame(etape) : 0;
    };
    this.orbiteRaf = requestAnimationFrame(etape);
  }

  /** Vol de caméra, puis orbite optionnelle. */
  voler(cam, { orbite = 0, duree = 2600 } = {}) {
    this.stopTout();
    const jeton = ++this.jeton;
    const lancerOrbite = () => {
      if (jeton === this.jeton && !this.camLibre && !this.orbiteRaf) this.orbite(orbite);
    };
    this.map.once("moveend", lancerOrbite);
    this.map.flyTo({ ...cam, duration: reduceMotion ? 0 : duree, curve: 1.42, essential: true });
    setTimeout(() => { if (!this.map.isMoving()) lancerOrbite(); }, duree + 300);
  }

  /** Cadre un ensemble de points [lon, lat]. */
  cadrer(points, { pitch = 0, bearing: cap = 0, orbite = 0, maxZoom = 16 } = {}) {
    const b = new maplibregl.LngLatBounds();
    points.forEach((p) => b.extend(p));
    const el = this.map.getContainer();
    const marge = Math.round(Math.min(el.clientWidth, el.clientHeight) * 0.14);
    const cam = this.map.cameraForBounds(b, { padding: marge, maxZoom });
    if (!cam) return;
    this.voler({ center: cam.center, zoom: cam.zoom, pitch, bearing: cap }, { orbite });
  }

  /* ---------- Trajet animé (Montréal) ---------- */

  suivre(idLigne, emoji, { zoom = 15.6, pitch = 62 } = {}) {
    const coords = this.lignes[idLigne]?.coords;
    if (!coords || coords.length < 2) return;
    this.stopTout();
    const jeton = ++this.jeton;
    const d = cumul(coords);
    const total = d[d.length - 1];

    if (!this.mobile) {
      const el = document.createElement("div");
      el.className = "mover";
      el.innerHTML = `<span></span>`;
      this.mobile = new maplibregl.Marker({ element: el });
    }
    const el = this.mobile.getElement();
    el.querySelector("span").textContent = emoji;
    el.style.setProperty("--c", this.lignes[idLigne].couleur);
    this.mobile.setLngLat(coords[0]).addTo(this.map);

    if (reduceMotion) {
      this.progression(idLigne, 1);
      this.mobile.setLngLat(coords[coords.length - 1]);
      this.cadrer([coords[0], coords[coords.length - 1]], { pitch: 50 });
      return;
    }

    this.progression(idLigne, 0);
    const regard = (x) => bearing(along(coords, d, x).pos,
      along(coords, d, Math.min(total, x + Math.max(0.12, total * 0.05))).pos);
    let cap = regard(0);

    this.map.flyTo({ center: coords[0], zoom, pitch, bearing: cap, duration: 2000, essential: true });
    this.map.once("moveend", () => {
      if (jeton !== this.jeton) return;
      const duree = Math.min(12000, Math.max(4500, 2500 + total * 1500));
      const t0 = performance.now();
      const etape = (now) => {
        if (jeton !== this.jeton) return;
        const p = Math.min(1, (now - t0) / duree);
        const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
        const x = e * total;
        const { pos } = along(coords, d, x);
        this.mobile.setLngLat(pos);
        this.progression(idLigne, total ? x / total : 1);
        if (!this.camLibre) {
          cap += angleDiff(cap, regard(x)) * 0.04;
          this.map.jumpTo({ center: pos, bearing: cap });
        }
        if (p < 1) this.trajetRaf = requestAnimationFrame(etape);
        else {
          this.progression(idLigne, 1);
          if (!this.camLibre) this.orbite(3, 15000);
        }
      };
      this.trajetRaf = requestAnimationFrame(etape);
    });
  }

  cacherMobile() {
    this.mobile?.remove();
  }

  /* ---------- Repères ----------
     Dessinés directement dans la carte (WebGL) et non plus en éléments HTML :
     ils restent collés à leur lieu pendant les vols de caméra, l'inclinaison
     et le redimensionnement — plus aucun point qui flotte ou saute. */

  repere(lonlat, nom, couleur, { base = false } = {}) {
    if (!this.reperes) this.initReperes();
    const id = this.reperes.length;
    this.reperes.push({
      id, cible: "hidden",
      v: { dot: 0, lbl: 0, taille: 1 },          // valeurs affichées (animées)
      feature: { type: "Feature", id, geometry: { type: "Point", coordinates: lonlat },
        properties: { nom, couleur, base: base ? 1 : 0 } },
    });
    clearTimeout(this.repTimer);
    this.repTimer = setTimeout(() => this.majSourceReperes(), 0);   // une seule mise à jour groupée
    return id;
  }

  initReperes() {
    this.reperes = [];
    this.repRaf = 0;
    const map = this.map;
    map.addSource("reperes", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
    const etat = (k, def) => ["coalesce", ["feature-state", k], def];
    let police = map.getStyle().layers.find((l) => l.type === "symbol" && l.layout?.["text-font"])?.layout["text-font"];
    if (!Array.isArray(police) || !police.every((f) => typeof f === "string")) police = ["Noto Sans Regular"];
    const gras = police.map((f) => f.replace(/Regular|Italic/, "Bold"));
    map.addLayer({ id: "reperes-halo", type: "circle", source: "reperes",
      paint: {
        "circle-radius": ["*", etat("taille", 1), ["case", ["==", ["get", "base"], 1], 13, 11]],
        "circle-color": ["get", "couleur"],
        "circle-opacity": ["*", etat("dot", 0), 0.22],
        "circle-blur": 0.6,
        "circle-pitch-alignment": "viewport",
      } });
    map.addLayer({ id: "reperes-point", type: "circle", source: "reperes",
      paint: {
        "circle-radius": ["*", etat("taille", 1), ["case", ["==", ["get", "base"], 1], 6, 5]],
        "circle-color": ["get", "couleur"],
        "circle-stroke-color": "#ffffff",
        "circle-stroke-width": 2,
        "circle-opacity": etat("dot", 0),
        "circle-stroke-opacity": etat("dot", 0),
        "circle-pitch-alignment": "viewport",
      } });
    map.addLayer({ id: "reperes-nom", type: "symbol", source: "reperes",
      layout: {
        "text-field": ["get", "nom"],
        "text-font": gras,
        "text-size": 12.5,
        "text-anchor": "left",
        "text-offset": [0.95, 0],
        "text-allow-overlap": true,        // pas de noms qui disparaissent / réapparaissent
        "text-ignore-placement": true,
        "text-pitch-alignment": "viewport",
        "text-rotation-alignment": "viewport",
      },
      paint: {
        "text-color": "#f5f5f7",
        "text-halo-color": "rgba(0,0,0,.85)",
        "text-halo-width": 1.6,
        "text-halo-blur": 0.5,
        "text-opacity": etat("lbl", 0),
      } });
  }

  majSourceReperes() {
    this.map.getSource("reperes")?.setData({ type: "FeatureCollection", features: this.reperes.map((r) => r.feature) });
    this.reperes.forEach((r) => this.ecrireEtat(r));
  }

  ecrireEtat(r) {
    this.map.setFeatureState({ source: "reperes", id: r.id }, r.v);
  }

  /** hidden · dot (point seul) · on (point + nom) · cur (étape en cours, plus gros) */
  etatRepere(id, etat) {
    const r = this.reperes?.[id];
    if (!r || r.cible === etat) return;
    r.cible = etat;
    r.de = { ...r.v };
    r.t0 = performance.now();
    if (!this.repRaf) this.repRaf = requestAnimationFrame((t) => this.animerReperes(t));
  }

  animerReperes(now) {
    const CIBLES = {
      hidden: { dot: 0, lbl: 0, taille: 0.6 },
      dot:    { dot: 0.9, lbl: 0, taille: 0.85 },
      on:     { dot: 1, lbl: 1, taille: 1 },
      cur:    { dot: 1, lbl: 1, taille: 1.35 },
    };
    const DUREE = reduceMotion ? 1 : 520;
    let encore = false;
    for (const r of this.reperes) {
      if (!r.de) continue;
      const k = Math.min(1, (now - r.t0) / DUREE);
      const e = 1 - Math.pow(1 - k, 3);                   // easeOutCubic
      const c = CIBLES[r.cible] || CIBLES.on;
      for (const p of ["dot", "lbl", "taille"]) r.v[p] = r.de[p] + (c[p] - r.de[p]) * e;
      this.ecrireEtat(r);
      if (k < 1) encore = true; else r.de = null;
    }
    this.repRaf = encore ? requestAnimationFrame((t) => this.animerReperes(t)) : 0;
  }
}