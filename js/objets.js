/* =========================================================
   Scènes photo façon « film » : une vraie photo par chapitre,
   étalonnée dans les tons du site et fondue dans le noir.
   Au défilement, la caméra voyage dans l'image (on monte le long
   de la tour CN, on s'approche du Château…). Entre deux chapitres,
   l'image s'efface en fondu.
   Version allégée : une seule image par chapitre, uniquement des
   transformations et de l'opacité (calculées par la carte graphique),
   et rien ne tourne quand on ne défile pas.
   ========================================================= */

const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const telephone = matchMedia("(max-width: 800px)").matches;
const borne = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lisse = (x) => x * x * (3 - 2 * x);
const doux = (x) => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;   // easeInOutCubic

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

/* ---------- Scènes ---------- */
export async function objets3D() {
  const reperes = [...document.querySelectorAll(".objet3d[data-objet]")];
  if (!reperes.length) return;

  /* Crédits des photos (bas du carnet) */
  const fin = [...document.querySelectorAll("#story .chapitre")].pop();
  if (fin && !document.querySelector(".credits")) {
    const vus = [...new Set(reperes.map((r) => r.dataset.objet))].map((k) => PHOTOS[k]).filter(Boolean);
    fin.insertAdjacentHTML("beforeend", `<p class="credits">Photos : ${vus.map((p) =>
      `<a href="${p.page}" target="_blank" rel="noopener">${p.titre}</a> © ${p.auteur} (${p.licence})`).join(" · ")} — via Wikimedia Commons.</p>`);
  }

  /* Téléphone : pas de panneau photo en fond. Ce grand calque fixe (avec ses masques
     de fondu) était redessiné en très haute résolution au zoom et faisait planter Safari. */
  if (telephone) return;


  /* Le panneau photo : fixe, à droite, fondu dans le noir */
  const scene = document.createElement("div");
  scene.className = "scene-film";
  scene.setAttribute("aria-hidden", "true");
  document.body.appendChild(scene);

  /* Viseur qui accroche la cible + compteur */
  scene.insertAdjacentHTML("beforeend", `
    <div class="fx-reticule">
      <i></i><i></i><i></i><i></i>
      <span class="fx-r-lbl"><em class="fx-r-k">ALT</em> <b class="fx-r-v">0</b> <em class="fx-r-u">m</em></span>
      <span class="fx-r-zoom">×1.00</span>
    </div>`);
  const fx = {
    ret: scene.querySelector(".fx-reticule"), k: scene.querySelector(".fx-r-k"),
    v: scene.querySelector(".fx-r-v"), unit: scene.querySelector(".fx-r-u"), zoom: scene.querySelector(".fx-r-zoom"),
  };

  const plans = reperes.map((rep, n) => {
    const cle = rep.dataset.objet;
    const def = PHOTOS[cle] || PHOTOS.erable;
    const el = document.createElement("div");
    el.className = "plan";
    el.innerHTML = `<img class="plan-net" alt="" decoding="async">`;
    const net = el.querySelector("img");
    net.src = def.src;
    scene.appendChild(el);
    return { rep, el, net, def, cle, chemin: CHEMINS[cle] || CHEMINS.erable, n, vu: false };
  });

  /* Étendue de chaque chapitre (remesurée seulement si la page change de taille) */
  let bornes = [];
  const mesurer = () => {
    const finDoc = document.documentElement.scrollHeight;
    bornes = plans.map((o, k) => {
      const debut = (o.rep.closest(".card")?.getBoundingClientRect().top ?? 0) + scrollY;
      const suivant = plans[k + 1]?.rep.closest(".card");
      return [debut, suivant ? suivant.getBoundingClientRect().top + scrollY : finDoc];
    });
  };
  /* Taille de chaque image « cover » : calculée ici une fois, pour que le cadrage
     ne passe ensuite que par des transformations (pas de redessin de l'image). */
  let W = 1, H = 1;
  const cadrer = () => {
    W = scene.clientWidth || 1; H = scene.clientHeight || 1;
    plans.forEach((o) => {
      const iw = o.net.naturalWidth, ih = o.net.naturalHeight;
      if (!iw || !ih) return;
      const k = Math.max(W / iw, H / ih);
      o.dW = iw * k; o.dH = ih * k;
      Object.assign(o.net.style, { width: `${o.dW}px`, height: `${o.dH}px`,
        left: `${(W - o.dW) / 2}px`, top: `${(H - o.dH) / 2}px` });
    });
  };
  plans.forEach((o) => o.net.addEventListener("load", () => { cadrer(); demander(); }));
  const mesurerTout = () => { mesurer(); cadrer(); };
  mesurerTout();
  let attente = 0;
  const remesurer = () => { clearTimeout(attente); attente = setTimeout(() => { mesurerTout(); demander(); }, 150); };
  addEventListener("resize", remesurer);
  new ResizeObserver(remesurer).observe(document.getElementById("story") || document.body);

  let actifPrec = -1, raf = 0;
  const image = () => {
    raf = 0;
    const y = scrollY + innerHeight * .5;
    let principal = -1, poidsMax = 0;

    plans.forEach((o, k) => {
      const [a, b] = bornes[k] || [0, 1];
      const u = (y - a) / Math.max(1, b - a);
      const visible = u > -.3 && u < 1.1;
      if (visible !== o.vu) { o.vu = visible; o.el.classList.toggle("on", visible); }
      if (!visible) return;

      // entrée et sortie en fondu, avec un léger zoom
      const ent = reduceMotion ? 1 : lisse(borne((u + .28) / .34));
      const sor = reduceMotion ? 0 : lisse(borne((u - .84) / .22));
      const op = ent * (1 - sor);
      if (op > poidsMax) { poidsMax = op; principal = k; }

      const [z, px, py, rot] = chemin(o.chemin, borne(u));
      const zoom = z * (1 + (1 - ent) * .12 + sor * .25);
      const f = borne((z - 1) / .9);
      const cxp = px + (50 - px) * f, cyp = py + (50 - py) * f;
      o.etat = { u, z, zoom, cxp, cyp, op };

      o.el.style.opacity = op.toFixed(3);
      if (!o.dW) return;                   // image pas encore chargée
      // équivalent de object-position (px %, py %) + recentrage, en pixels
      const sx = (W - o.dW) * (px - 50) / 100, sy = (H - o.dH) * (py - 50) / 100;
      const ox = (o.dW - W) / 2 + W * px / 100, oy = (o.dH - H) / 2 + H * py / 100;
      const tx = (50 - px) * f / 100 * W, ty = (50 - py) * f / 100 * H;
      const net = o.net.style;
      net.transformOrigin = `${ox.toFixed(1)}px ${oy.toFixed(1)}px`;
      net.transform = `translate3d(${tx.toFixed(1)}px, ${ty.toFixed(1)}px, 0) scale(${zoom.toFixed(4)}) rotate(${rot.toFixed(2)}deg) translate3d(${sx.toFixed(1)}px, ${sy.toFixed(1)}px, 0)`;
    });

    if (principal !== actifPrec) {
      actifPrec = principal;
      scene.classList.toggle("vide", principal < 0);
      if (principal >= 0) {
        const c = COMPTEURS[plans[principal].cle] || ["ZOOM", 100, "%"];
        fx.k.textContent = c[0]; fx.unit.textContent = c[2];
      }
    }
    const e = principal >= 0 ? plans[principal].etat : null;
    if (e) {
      const cible = borne((e.u - .1) / .75);
      const c = COMPTEURS[plans[principal].cle] || ["ZOOM", 100, "%"];
      const verrou = lisse(borne((cible - .15) / .5));
      fx.ret.style.left = `${e.cxp.toFixed(2)}%`;
      fx.ret.style.top = `${e.cyp.toFixed(2)}%`;
      fx.ret.style.setProperty("--taille", `${(260 - verrou * 150).toFixed(0)}px`);
      fx.ret.style.opacity = (e.op * Math.min(1, cible * 4)).toFixed(3);
      fx.ret.classList.toggle("verrou", verrou > .98);
      fx.v.textContent = Math.round(c[1] * (c[0] === "ZOOM" ? e.z / 1.7 : cible)).toLocaleString("fr-FR");
      fx.zoom.textContent = `×${e.zoom.toFixed(2)}`;
    } else {
      fx.ret.style.opacity = 0;
    }
  };
  const demander = () => { if (!raf) raf = requestAnimationFrame(image); };
  addEventListener("scroll", demander, { passive: true });
  demander();
}
