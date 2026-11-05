/* =========================================================
   Scènes photo façon « film » : une vraie photo par chapitre,
   étalonnée dans les tons du site et fondue dans le noir.
   Au défilement, la caméra voyage dans l'image (on monte le long
   de la tour CN, on s'approche du Château…). Entre deux chapitres,
   on traverse l'image dans la lumière et la fumée.
   Fumée et poussière : three.js (importmap de index.html).
   ========================================================= */

const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const borne = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lisse = (x) => x * x * (3 - 2 * x);
const doux = (x) => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;   // easeInOutCubic
const alea = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

/* ---------- Photos (Wikimedia Commons, licences libres — crédits en bas du carnet) ---------- */
const W_UP = "https://upload.wikimedia.org/wikipedia/commons/thumb/";
export const PHOTOS = {
  biosphere: { src: W_UP + "0/0f/Montreal_Biosphere_at_night.jpg/1920px-Montreal_Biosphere_at_night.jpg",
    titre: "Biosphère de Montréal", auteur: "Hamidreza", licence: "CC BY-SA 3.0",
    page: "https://commons.wikimedia.org/wiki/File:Montreal_Biosphere_at_night.jpg" },
  erable: { src: W_UP + "0/05/Maple_leaf_held_up_in_autumn%2C_Vieux-Limoilou.jpg/1920px-Maple_leaf_held_up_in_autumn%2C_Vieux-Limoilou.jpg",
    titre: "Feuille d’érable", auteur: "Wilfredor", licence: "CC BY-SA 4.0",
    page: "https://commons.wikimedia.org/wiki/File:Maple_leaf_held_up_in_autumn,_Vieux-Limoilou.jpg" },
  frontenac: { src: W_UP + "5/5e/Ch%C3%A2teau_Frontenac_at_night%2C_Quebec_City%2C_Canada.jpg/1920px-Ch%C3%A2teau_Frontenac_at_night%2C_Quebec_City%2C_Canada.jpg",
    titre: "Château Frontenac", auteur: "Wilfredor", licence: "CC0",
    page: "https://commons.wikimedia.org/wiki/File:Ch%C3%A2teau_Frontenac_at_night,_Quebec_City,_Canada.jpg" },
  cntower: { src: W_UP + "8/85/Cn_Tower_At_Night_%28222616031%29.jpeg/1920px-Cn_Tower_At_Night_%28222616031%29.jpeg",
    titre: "Tour CN", auteur: "Javier Ortega Araiza", licence: "CC BY 3.0",
    page: "https://commons.wikimedia.org/wiki/File:Cn_Tower_At_Night_(222616031).jpeg" },
  empire: { src: W_UP + "f/ff/Empire_State_Building_at_Night%2C_May_2024.jpg/1920px-Empire_State_Building_at_Night%2C_May_2024.jpg",
    titre: "Empire State Building", auteur: "Wikipatbos", licence: "CC0",
    page: "https://commons.wikimedia.org/wiki/File:Empire_State_Building_at_Night,_May_2024.jpg" },
  sapin: { src: W_UP + "f/f9/RED_SPRUCE_SILHOUETTED_AGAINST_SUNSET_SKY_AT_TWITCHELL_LAKE_NORTHEAST_OF_OLD_FORGE_VILLAGE_-_NARA_-_554397.tif/lossy-page1-1920px-RED_SPRUCE_SILHOUETTED_AGAINST_SUNSET_SKY_AT_TWITCHELL_LAKE_NORTHEAST_OF_OLD_FORGE_VILLAGE_-_NARA_-_554397.tif.jpg",
    titre: "Épinettes au coucher du soleil", auteur: "Anne LaBastille (NARA)", licence: "Domaine public",
    page: "https://commons.wikimedia.org/wiki/File:RED_SPRUCE_SILHOUETTED_AGAINST_SUNSET_SKY_AT_TWITCHELL_LAKE_NORTHEAST_OF_OLD_FORGE_VILLAGE_-_NARA_-_554397.tif" },
  phare: { src: W_UP + "f/f2/Portland_Head_Light%2C_Near_Portland%2C_Maine_%2865628467%29.jpg/1920px-Portland_Head_Light%2C_Near_Portland%2C_Maine_%2865628467%29.jpg",
    titre: "Portland Head Light", auteur: "Ken Lund", licence: "CC BY-SA 2.0",
    page: "https://commons.wikimedia.org/wiki/File:Portland_Head_Light,_Near_Portland,_Maine_(65628467).jpg" },
};


/* Compteur affiché dans le viseur pendant le trajet (ex. on monte la tour CN : 0 → 553 m) */
const COMPTEURS = {
  cntower: ["ALT", 553, "m"], empire: ["ALT", 443, "m"], frontenac: ["ALT", 80, "m"],
  biosphere: ["Ø", 76, "m"], erable: ["ZOOM", 170, "%"], sapin: ["DIST", 1200, "m"],
  phare: ["ALT", 24, "m"],
};

/* Trajet de la caméra dans chaque photo : [progression, zoom, X %, Y %, rotation°]
   X/Y = point de l'image placé au centre du cadre. */
const CHEMINS = {
  cntower:   [[0, 1.08, 50, 96, 0], [.45, 1.3, 50, 62, 0], [1, 2.15, 50, 10, 0]],          // on monte jusqu'à l'antenne
  empire:    [[0, 1.08, 50, 98, 0], [.5, 1.35, 50, 52, 0], [1, 2.1, 52, 10, 0]],           // de la rue jusqu'à la flèche
  frontenac: [[0, 1.02, 50, 70, 0], [.5, 1.3, 50, 55, 0], [1, 1.95, 51, 34, 0]],          // on s'approche de la grande tour
  biosphere: [[0, 1.02, 46, 62, 0], [1, 1.75, 52, 46, 0]],                                // on entre dans la sphère
  erable:    [[0, 1.06, 50, 50, -2], [1, 1.7, 47, 42, 3]],                                // la feuille tourne doucement
  sapin:     [[0, 1.12, 18, 55, 0], [1, 1.32, 80, 50, 0]],                                // travelling le long du lac
  phare:     [[0, 1.04, 50, 62, 0], [.5, 1.25, 50, 50, 0], [1, 1.7, 50, 38, 0]],          // on s'approche du phare
};
const chemin = (pts, u) => {
  if (u <= pts[0][0]) return pts[0].slice(1);
  for (let i = 1; i < pts.length; i++) if (u <= pts[i][0]) {
    const a = pts[i - 1], b = pts[i], k = doux((u - a[0]) / (b[0] - a[0]));
    return a.slice(1).map((v, j) => v + (b[j + 1] - v) * k);
  }
  return pts[pts.length - 1].slice(1);
};

function textureDouce(THREE, nuage) {
  const c = document.createElement("canvas");
  c.width = c.height = nuage ? 256 : 64;
  const g = c.getContext("2d");
  const W = c.width;
  if (!nuage) {
    const r = g.createRadialGradient(W / 2, W / 2, 0, W / 2, W / 2, W / 2);
    r.addColorStop(0, "rgba(255,240,210,1)"); r.addColorStop(.35, "rgba(255,225,170,.5)"); r.addColorStop(1, "rgba(255,210,150,0)");
    g.fillStyle = r; g.fillRect(0, 0, W, W);
  } else {
    // fumée : beaucoup de taches douces superposées
    for (let i = 0; i < 70; i++) {
      const x = W / 2 + (alea(i) - .5) * W * .55, y = W / 2 + (alea(i + 50) - .5) * W * .45, rr = W * (.08 + alea(i + 99) * .22);
      const r = g.createRadialGradient(x, y, 0, x, y, rr);
      r.addColorStop(0, `rgba(255,240,220,${.05 + alea(i + 7) * .07})`); r.addColorStop(1, "rgba(255,240,220,0)");
      g.fillStyle = r; g.fillRect(0, 0, W, W);
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* ---------- Scènes ---------- */
export async function objets3D() {
  const reperes = [...document.querySelectorAll(".objet3d[data-objet]")];
  if (!reperes.length) return;

  /* Le panneau photo : fixe, à droite, fondu dans le noir */
  const scene = document.createElement("div");
  scene.className = "scene-film";
  scene.setAttribute("aria-hidden", "true");
  document.body.appendChild(scene);

  /* Effets de cinéma par-dessus les photos */
  scene.insertAdjacentHTML("beforeend", `
    <div class="fx-rayons"></div>
    <div class="fx-dof"></div>
    <div class="fx-fuite"></div>
    <div class="fx-balayage"></div>
    <div class="fx-flare"><i></i><b></b></div>
    <div class="fx-reticule">
      <i></i><i></i><i></i><i></i>
      <span class="fx-r-lbl"><em class="fx-r-k">ALT</em> <b class="fx-r-v">0</b> <em class="fx-r-u">m</em></span>
      <span class="fx-r-zoom">×1.00</span>
    </div>`);
  const fx = {
    rayons: scene.querySelector(".fx-rayons"), fuite: scene.querySelector(".fx-fuite"),
    balayage: scene.querySelector(".fx-balayage"), flare: scene.querySelector(".fx-flare"),
    ret: scene.querySelector(".fx-reticule"), k: scene.querySelector(".fx-r-k"),
    v: scene.querySelector(".fx-r-v"), unit: scene.querySelector(".fx-r-u"), zoom: scene.querySelector(".fx-r-zoom"),
  };

  const plans = reperes.map((rep, n) => {
    const cle = rep.dataset.objet;
    const def = PHOTOS[cle] || PHOTOS.erable;
    const el = document.createElement("div");
    el.className = "plan";
    el.innerHTML = `<img class="plan-fond" alt="" decoding="async"><img class="plan-net" alt="" decoding="async">`;
    const [fond, net] = el.querySelectorAll("img");
    fond.src = net.src = def.src;
    scene.appendChild(el);
    return { rep, el, fond, net, def, cle, chemin: CHEMINS[cle] || CHEMINS.erable, n, vu: false };
  });

  /* Crédits des photos (bas du carnet) */
  const fin = [...document.querySelectorAll("#story .chapitre")].pop();
  if (fin && !document.querySelector(".credits")) {
    const vus = [...new Set(reperes.map((r) => r.dataset.objet))].map((k) => PHOTOS[k]).filter(Boolean);
    fin.insertAdjacentHTML("beforeend", `<p class="credits">Photos : ${vus.map((p) =>
      `<a href="${p.page}" target="_blank" rel="noopener">${p.titre}</a> © ${p.auteur} (${p.licence})`).join(" · ")} — via Wikimedia Commons.</p>`);
  }

  /* Étendue de chaque chapitre */
  let bornes = [];
  const mesurer = () => {
    const finDoc = document.documentElement.scrollHeight;
    bornes = plans.map((o, k) => {
      const debut = (o.rep.closest(".card")?.getBoundingClientRect().top ?? 0) + scrollY;
      const suivant = plans[k + 1]?.rep.closest(".card");
      return [debut, suivant ? suivant.getBoundingClientRect().top + scrollY : finDoc];
    });
  };
  mesurer();
  addEventListener("resize", mesurer);
  setInterval(mesurer, 2000);

  /* Souris : légère parallaxe entre le fond flou et l'image nette */
  let mx = 0, my = 0, smx = 0, smy = 0;
  addEventListener("pointermove", (e) => { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; }, { passive: true });

  /* Fumée + poussière (WebGL), par-dessus la photo, sous le texte */
  const fumee = await fumeeWebGL().catch(() => null);

  let actifPrec = -1;
  const image = (t) => {
    requestAnimationFrame(image);
    if (document.hidden) return;
    const H = innerHeight;
    const y = scrollY + H * .5;
    smx += (mx - smx) * .05; smy += (my - smy) * .05;
    let transition = 0, principal = -1, poidsMax = 0;

    plans.forEach((o, k) => {
      const [a, b] = bornes[k] || [0, 1];
      const u = (y - a) / Math.max(1, b - a);
      const visible = u > -.3 && u < 1.1;
      if (visible !== o.vu) { o.vu = visible; o.el.classList.toggle("on", visible); }
      if (!visible) return;

      // entrée : l'image sort de la lumière et de la fumée ; sortie : on la traverse
      const ent = reduceMotion ? 1 : lisse(borne((u + .28) / .34));
      const sor = reduceMotion ? 0 : lisse(borne((u - .84) / .22));
      const op = ent * (1 - sor);
      if (op > poidsMax) { poidsMax = op; principal = k; }
      transition = Math.max(transition, Math.sin(Math.PI * Math.min(ent, 1)) * (ent < 1 ? 1 : 0), Math.sin(Math.PI * sor));

      const [z, px, py, rot] = chemin(o.chemin, borne(u));
      const zoom = z * (1 + (1 - ent) * .35 + sor * sor * .9);
      const flou = (1 - ent) * 16 + sor * 18;
      const lum = 1 + (1 - ent) * .9 + sor * 1.1;
      const dx = smx * -14, dy = smy * -10;

      // le point visé glisse vers le centre du cadre à mesure qu'on zoome
      const f = borne((z - 1) / .9);
      const cxp = px + (50 - px) * f, cyp = py + (50 - py) * f;
      o.etat = { u, z, zoom, cxp, cyp, ent, sor, op };

      const net = o.net.style, fond = o.fond.style;
      o.el.style.opacity = op.toFixed(3);
      net.objectPosition = `${px.toFixed(2)}% ${py.toFixed(2)}%`;
      net.transformOrigin = `${px.toFixed(2)}% ${py.toFixed(2)}%`;
      net.transform = `translate3d(calc(${((50 - px) * f).toFixed(2)}% + ${dx.toFixed(1)}px), calc(${((50 - py) * f).toFixed(2)}% + ${dy.toFixed(1)}px), 0) scale(${zoom.toFixed(4)}) rotate(${rot.toFixed(2)}deg)`;
      // étalonnage chaud + flou / surexposition pendant les transitions
      net.filter = `saturate(.88) sepia(.16) contrast(1.06) brightness(${(.86 * lum).toFixed(3)})` + (flou > .3 ? ` blur(${flou.toFixed(1)}px)` : "");
      // le fond flou bouge moins vite : profondeur
      fond.objectPosition = net.objectPosition;
      fond.transformOrigin = net.transformOrigin;
      fond.transform = `translate3d(calc(${((50 - px) * f * .5).toFixed(2)}% + ${(dx * .4).toFixed(1)}px), calc(${((50 - py) * f * .5).toFixed(2)}% + ${(dy * .4).toFixed(1)}px), 0) scale(${(1.15 + (zoom - 1) * .55).toFixed(4)})`;
    });

    if (principal !== actifPrec) {
      actifPrec = principal;
      scene.classList.toggle("vide", principal < 0);
      if (principal >= 0 && !reduceMotion) {            // éclat de lumière qui balaie la nouvelle photo
        fx.balayage.classList.remove("on"); void fx.balayage.offsetWidth; fx.balayage.classList.add("on");
        const c = COMPTEURS[plans[principal].cle] || ["ZOOM", 100, "%"];
        fx.k.textContent = c[0]; fx.unit.textContent = c[2];
      }
    }
    const e = principal >= 0 ? plans[principal].etat : null;
    if (e) {
      const cible = borne((e.u - .1) / .75);                       // avancée dans le trajet
      // rayons de lumière : tournent doucement, plus forts au milieu du chapitre
      fx.rayons.style.opacity = (e.op * (.35 + .4 * Math.sin(Math.PI * cible))).toFixed(3);
      fx.rayons.style.transform = `rotate(${(t * .002 % 360 - 20 + smx * 8).toFixed(2)}deg)`;
      // reflet d'objectif sur le point visé, qui s'allume en fin de trajet
      const fl = e.op * lisse(borne((cible - .45) / .45));
      fx.flare.style.opacity = (fl * (.85 + .15 * Math.sin(t * .004))).toFixed(3);
      fx.flare.style.left = `${e.cxp.toFixed(2)}%`;
      fx.flare.style.top = `${e.cyp.toFixed(2)}%`;
      // viseur qui accroche la cible + compteur
      const c = COMPTEURS[plans[principal].cle] || ["ZOOM", 100, "%"];
      const verrou = lisse(borne((cible - .15) / .5));
      fx.ret.style.left = `${e.cxp.toFixed(2)}%`;
      fx.ret.style.top = `${e.cyp.toFixed(2)}%`;
      fx.ret.style.opacity = (e.op * Math.min(1, cible * 4)).toFixed(3);
      fx.ret.style.setProperty("--taille", `${(260 - verrou * 150).toFixed(1)}px`);
      fx.ret.classList.toggle("verrou", verrou > .98);
      fx.v.textContent = Math.round(c[1] * (c[0] === "ZOOM" ? e.z / 1.7 : cible)).toLocaleString("fr-FR");
      fx.zoom.textContent = `×${e.zoom.toFixed(2)}`;
    } else {
      fx.rayons.style.opacity = fx.flare.style.opacity = fx.ret.style.opacity = 0;
    }
    // voile de lumière orangée pendant les transitions (fuite de lumière de pellicule)
    fx.fuite.style.opacity = (transition * .85).toFixed(3);
    fx.fuite.style.transform = `translateX(${(-30 + transition * 40 + Math.sin(t * .0007) * 6).toFixed(1)}%)`;
    fumee?.(t, transition, smx, smy, principal >= 0);
  };
  requestAnimationFrame(image);
}

/* ---------- Fumée et poussière (three.js) ---------- */
async function fumeeWebGL() {
  const THREE = await import("three");
  const canvas = document.createElement("canvas");
  canvas.className = "fumee-canvas";
  canvas.setAttribute("aria-hidden", "true");
  document.body.appendChild(canvas);
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.25));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const sc = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(40, 1, .1, 500);
  cam.position.set(0, 0, 60);
  const taille = () => { renderer.setSize(innerWidth, innerHeight, false); cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix(); };
  taille();
  addEventListener("resize", taille);

  const texPoint = textureDouce(THREE, false), texFumee = textureDouce(THREE, true);
  // nappes de fumée, surtout à droite et en bas (là où est la photo)
  const nappes = Array.from({ length: 14 }, (_, i) => {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: texFumee, color: i % 3 ? 0x6e583f : 0x8d714f, transparent: true, opacity: 0, depthWrite: false }));
    const bas = i < 8;
    s.userData = {
      x: 8 + (alea(i * 3) - .2) * 60, y: bas ? -22 + alea(i * 5) * 12 : (alea(i * 5) - .5) * 40,
      z: (alea(i * 7) - .5) * 30, t: 30 + alea(i * 9) * 30, o: bas ? .3 : .12, v: (alea(i * 13) - .5) * .0002,
    };
    s.scale.setScalar(s.userData.t);
    sc.add(s);
    return s;
  });
  // poussière d'or en trois profondeurs
  const couches = [[520, .35, .5, 1], [140, .9, .35, .6], [18, 4.5, .12, .25]].map(([n, taille, op, vit], k) => {
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (alea(i * 31 + k) - .3) * 140; pos[i * 3 + 1] = (alea(i * 37 + k) - .5) * 90; pos[i * 3 + 2] = (alea(i * 41 + k) - .5) * 60 + k * 18;
    }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const p = new THREE.Points(g, new THREE.PointsMaterial({ map: texPoint, size: taille, color: 0xf3d7a0, transparent: true, opacity: op, depthWrite: false, blending: THREE.AdditiveBlending }));
    p.userData.vit = vit;
    sc.add(p);
    return p;
  });

  return (t, transition, smx, smy, actif) => {
    canvas.style.opacity = actif ? 1 : .35;
    cam.position.x = smx * 4; cam.position.y = -smy * 3;
    nappes.forEach((s, i) => {
      const d = s.userData;
      s.material.rotation += d.v * 16;
      s.position.set(d.x + Math.sin(t * .00005 * (i + 1)) * 5, d.y + Math.sin(t * .00007 + i) * 2, d.z);
      s.material.opacity = d.o * (.6 + transition * 1.1);
    });
    couches.forEach((p, k) => {
      p.rotation.y = t * .00001 * (k + 1);
      p.position.y = ((-scrollY * .012 * p.userData.vit) % 45) + Math.sin(t * .0002 + k) * .5;
    });
    renderer.render(sc, cam);
  };
}
