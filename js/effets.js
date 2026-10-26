/* Effets visuels : apparition au défilement, barre de progression,
   visionneuse photo plein écran. */

const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Les cartes apparaissent en douceur quand elles entrent à l'écran. */
export function apparitions() {
  // Avec l'intro, l'accueil ne se dévoile qu'à l'atterrissage
  const accueil = document.querySelector(".hero-card");
  const attendre = accueil && document.getElementById("intro");
  if (attendre) document.addEventListener("atterrissage", () => accueil.classList.add("vu"), { once: true });
  const cartes = [...document.querySelectorAll(".card")].filter((c) => !(attendre && c === accueil));
  if (attendre && reduceMotion) accueil.classList.add("vu");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    cartes.forEach((c) => c.classList.add("vu"));
    return;
  }
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add("vu"); io.unobserve(e.target); }
  }), { rootMargin: "0px 0px -12% 0px", threshold: 0.05 });
  cartes.forEach((c) => io.observe(c));
}

/** Fine barre de progression en haut de l'écran. */
export function barreProgression() {
  const barre = document.getElementById("progress");
  if (!barre) return;
  let attente = false;
  const maj = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    barre.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
    attente = false;
  };
  addEventListener("scroll", () => { if (!attente) { attente = true; requestAnimationFrame(maj); } }, { passive: true });
  maj();
}

/* Ressort façon iOS (léger dépassement puis retour) */
const RESSORT = "linear(0, .06 2.4%, .22 5.3%, .45 9%, .68 13.5%, .85 18.5%, .95 24%, 1.01 30.5%, 1.025 37%, 1.02 45%, 1.005 60%, 1)";
const esc = (t) => t.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

/** Découpe les titres en mots pour les faire apparaître un par un. */
export function titresAnimes() {
  document.querySelectorAll("#story :is(h1, h2, h3):not(.h-hero)").forEach((h) => {
    const txt = h.textContent.trim();
    h.setAttribute("aria-label", txt);
    const liste = txt.split(/\s+/);
    const script = false;
    h.innerHTML = liste
      .map((m, i) => `<span class="mot${script && i === liste.length - 1 ? " mot-script" : ""}" aria-hidden="true" style="--i:${i}"><span>${esc(m)}</span></span>`).join(" ");
  });
}

/** Barre de navigation iOS : apparaît quand le grand titre sort de l'écran. */
export function barreNav() {
  const nav = document.createElement("header");
  nav.className = "navbar";
  nav.innerHTML = `<span class="navbar-titre"></span>`;
  document.body.prepend(nav);
  const titre = nav.firstElementChild;

  const h1 = document.querySelector(".hero h1");
  if (h1) new IntersectionObserver(([e]) => {
    nav.classList.toggle("visible", !e.isIntersecting && e.boundingClientRect.top < 0);
  }).observe(h1);

  const mobile = matchMedia("(max-width: 800px)").matches;
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    const h = e.target.querySelector("h1, h2, h3");
    const t = (h?.getAttribute("aria-label") || "").replace(/\.$/, "");
    if (!t || titre.textContent === t) return;
    document.dispatchEvent(new CustomEvent("section", { detail: sections.indexOf(e.target) }));
    titre.classList.remove("in");
    void titre.offsetWidth;            // relance l'animation
    titre.textContent = t;
    titre.classList.add("in");
  }), { rootMargin: mobile ? "-30% 0px -60% 0px" : "-45% 0px -45% 0px" });
  const sections = [...document.querySelectorAll("#story [data-view]")];
  sections.forEach((el) => io.observe(el));
}

/** Curseur rond « Voir » au survol des photos (souris uniquement). */
export function curseurPhoto() {
  if (reduceMotion || !matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  const c = document.createElement("div");
  c.className = "curseur";
  c.setAttribute("aria-hidden", "true");
  c.textContent = "Voir";
  document.body.appendChild(c);
  document.documentElement.classList.add("curseur-actif");

  let x = -100, y = -100, cx = x, cy = y, raf = 0;
  const boucle = () => {
    cx += (x - cx) * 0.22;
    cy += (y - cy) * 0.22;
    c.style.transform = `translate(${cx}px, ${cy}px)`;
    raf = Math.abs(x - cx) + Math.abs(y - cy) > 0.2 ? requestAnimationFrame(boucle) : 0;
  };
  addEventListener("pointermove", (e) => {
    x = e.clientX; y = e.clientY;
    c.classList.toggle("on", !!e.target.closest?.(".galerie img"));
    if (!raf) raf = requestAnimationFrame(boucle);
  }, { passive: true });
  document.addEventListener("pointerleave", () => c.classList.remove("on"));
}

/** Clic sur une photo : elle s'agrandit depuis sa vignette. Flèches, Échap, glisser du doigt. */
export function visionneuse() {
  const lb = document.createElement("div");
  lb.className = "lightbox";
  lb.setAttribute("role", "dialog");
  lb.setAttribute("aria-modal", "true");
  lb.innerHTML = `
    <button class="lb-btn lb-close" aria-label="Fermer">✕</button>
    <button class="lb-btn lb-prev" aria-label="Photo précédente">‹</button>
    <figure><img alt=""><figcaption></figcaption></figure>
    <button class="lb-btn lb-next" aria-label="Photo suivante">›</button>`;
  document.body.appendChild(lb);

  const img = lb.querySelector("img"), cap = lb.querySelector("figcaption");
  let liste = [], idx = 0, source = null, occupe = false;

  /* Anime l'image entre la vignette et sa taille plein écran */
  const glisser = (versVignette) => {
    if (reduceMotion || !source) return Promise.resolve();
    const a = source.getBoundingClientRect(), b = img.getBoundingClientRect();
    if (!a.width || !b.width || a.bottom < 0 || a.top > innerHeight) return Promise.resolve();
    const dx = a.left + a.width / 2 - (b.left + b.width / 2);
    const dy = a.top + a.height / 2 - (b.top + b.height / 2);
    const s = Math.max(a.width / b.width, a.height / b.height);
    const vignette = { transform: `translate(${dx}px, ${dy}px) scale(${s})`, borderRadius: `${18 / s}px` };
    const plein = { transform: "none", borderRadius: "12px" };
    return img.animate(versVignette ? [plein, vignette] : [vignette, plein], {
      duration: versVignette ? 380 : 620,
      easing: versVignette ? "cubic-bezier(.4, 0, .2, 1)" : RESSORT,
      fill: versVignette ? "forwards" : "none",
    }).finished.catch(() => {});
  };

  const montrer = (k) => {
    idx = (k + liste.length) % liste.length;
    source = liste[idx];
    img.classList.remove("in");
    img.onload = () => img.classList.add("in");
    img.src = source.currentSrc || source.src;
    img.alt = source.alt;
    cap.textContent = `${source.alt}  ·  ${idx + 1} / ${liste.length}`;
    lb.classList.toggle("seule", liste.length < 2);
  };

  const ouvrir = async (el) => {
    if (occupe) return;
    occupe = true;
    liste = [...el.closest(".galerie").querySelectorAll("img")];
    montrer(liste.indexOf(el));
    img.classList.add("direct");
    lb.classList.add("ouvert");
    document.body.style.overflow = "hidden";
    try { await img.decode(); } catch { /* */ }
    img.classList.add("in");
    el.style.visibility = "hidden";
    await glisser(false);
    el.style.visibility = "";
    img.classList.remove("direct");
    lb.querySelector(".lb-close").focus({ preventScroll: true });
    occupe = false;
  };

  const fermer = async () => {
    if (occupe || !lb.classList.contains("ouvert")) return;
    occupe = true;
    const s = source;
    lb.classList.add("ferme");
    img.classList.add("direct");
    if (s) s.style.visibility = "hidden";
    await glisser(true);
    if (s) s.style.visibility = "";
    lb.classList.remove("ouvert", "ferme");
    img.getAnimations().forEach((a) => a.cancel());
    img.classList.remove("in", "direct");
    document.body.style.overflow = "";
    occupe = false;
  };

  document.addEventListener("click", (e) => {
    const el = e.target.closest(".galerie img");
    if (el) ouvrir(el);
  });
  lb.addEventListener("click", (e) => {
    if (e.target.closest(".lb-close") || e.target === lb || e.target.tagName === "FIGURE") fermer();
    else if (e.target.closest(".lb-prev")) montrer(idx - 1);
    else if (e.target.closest(".lb-next")) montrer(idx + 1);
  });
  addEventListener("keydown", (e) => {
    if (!lb.classList.contains("ouvert")) return;
    if (e.key === "Escape") fermer();
    if (e.key === "ArrowLeft") montrer(idx - 1);
    if (e.key === "ArrowRight") montrer(idx + 1);
  });
  let x0 = null, y0 = null;
  lb.addEventListener("touchstart", (e) => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
  lb.addEventListener("touchend", (e) => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) montrer(idx + (dx < 0 ? 1 : -1));
    else if (dy > 80) fermer();          // glisser vers le bas pour fermer, comme Photos
    x0 = y0 = null;
  });
}

/** Badge rond qui tourne avec le défilement et affiche le numéro de la section. */
export function badgeRotatif() {
  const b = document.createElement("button");
  b.className = "badge";
  b.type = "button";
  b.setAttribute("aria-label", "Revenir en haut");
  const txt = "Carnet de voyages · Canada · États-Unis · 2026 · ";
  b.innerHTML = `
    <svg viewBox="0 0 120 120" aria-hidden="true">
      <defs><path id="cercle-badge" d="M60,60 m-46,0 a46,46 0 1,1 92,0 a46,46 0 1,1 -92,0"/></defs>
      <g class="badge-tour"><text><textPath href="#cercle-badge" textLength="289">${esc(txt.toUpperCase())}</textPath></text></g>
    </svg>
    <span class="badge-num">01</span>`;
  document.body.appendChild(b);
  const num = b.querySelector(".badge-num");
  b.addEventListener("click", () => document.getElementById("accueil")?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" }));
  document.addEventListener("section", (e) => {
    const n = String(Math.max(0, e.detail) + 1).padStart(2, "0");
    if (num.textContent === n) return;
    num.classList.remove("in"); void num.offsetWidth;
    num.textContent = n; num.classList.add("in");
  });
}

/** Tout ce qui « suit la page » : bandes de texte qui glissent, badge qui tourne,
    photos qui se penchent selon la vitesse du défilement. */
export function suiviDefilement() {
  if (reduceMotion) return;
  const bandes = [...document.querySelectorAll(".bande")].map((el) => ({ el, l: [...el.children] }));
  const galeries = [...document.querySelectorAll(".galerie")];
  const visibles = new Set();
  const io = new IntersectionObserver((es) => es.forEach((e) => visibles[e.isIntersecting ? "add" : "delete"](e.target)),
    { rootMargin: "200px 0px" });
  galeries.forEach((g) => io.observe(g));
  bandes.forEach((b) => io.observe(b.el));
  let dernierY = scrollY, vitesse = 0, raf = 0, tPrec = 0, pencheAff = 99;

  const image = (t = performance.now()) => {
    const dt = Math.min(50, tPrec ? t - tPrec : 16.7); tPrec = t;
    const y = scrollY;
    const k = 1 - Math.pow(1 - 0.12, dt / 16.7);
    vitesse += ((y - dernierY) * (16.7 / dt) - vitesse) * k;   // vitesse lissée (px par image à 60 Hz)
    dernierY = y;
    const penche = Math.max(-4, Math.min(4, vitesse * 0.1));
    if (Math.abs(penche - pencheAff) > 0.01) {
      pencheAff = penche;
      const tr = `skewY(${penche.toFixed(2)}deg)`;
      for (const g of galeries) if (visibles.has(g)) g.style.transform = tr;
    }
    const tour = document.querySelector(".badge-tour");
    if (tour) tour.style.transform = `rotate(${(y * 0.18).toFixed(1)}deg)`;
    for (const b of bandes) {
      if (!visibles.has(b.el)) continue;
      const r = b.el.getBoundingClientRect();
      const p = 1 - (r.top + r.height) / (innerHeight + r.height); // 0 → 1 pendant la traversée
      b.l[0].style.transform = `translate3d(${(-p * 28).toFixed(3)}%,0,0)`;
      if (b.l[1]) b.l[1].style.transform = `translate3d(${(-28 + p * 28).toFixed(3)}%,0,0)`;
    }
    if (Math.abs(vitesse) > 0.05) raf = requestAnimationFrame(image);
    else {
      raf = 0; tPrec = 0; pencheAff = 0;
      for (const g of galeries) g.style.transform = "";        // retour au repos partout
    }
  };
  addEventListener("scroll", () => { if (!raf) raf = requestAnimationFrame(image); }, { passive: true });
  image();
}

/* =========================================================
   Effets d'agence : mot qui change, aperçu au survol,
   compteurs, sur-titres brouillés, boutons aimantés
   ========================================================= */

const fin = (fn) => new Promise((r) => setTimeout(r, fn));

/** « Carnet de … » : le dernier mot change toutes les 1,5 s. */
export function rotateurHero() {
  const mots = [...document.querySelectorAll(".rot-mot")];
  if (mots.length < 2 || reduceMotion) return;
  let i = 0;
  setInterval(() => {
    if (document.hidden) return;
    const avant = mots[i];
    i = (i + 1) % mots.length;
    avant.classList.remove("on");
    avant.classList.add("part");
    mots[i].classList.add("on");
    setTimeout(() => avant.classList.remove("part"), 650);
  }, 1500);
}

/** Survol d'une ligne du sommaire : un aperçu suit la souris. */
export function apercuSommaire() {
  if (reduceMotion || !matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  const liens = document.querySelectorAll(".sommaire a");
  if (!liens.length) return;
  const ap = document.createElement("div");
  ap.className = "apercu";
  ap.setAttribute("aria-hidden", "true");
  ap.innerHTML = `<div class="apercu-in"><img alt=""><span></span></div>`;
  document.body.appendChild(ap);
  const img = ap.querySelector("img"), lbl = ap.querySelector("span");

  let x = 0, y = 0, cx = 0, cy = 0, raf = 0, actif = false;
  const boucle = () => {
    const dx = x - cx;
    cx += dx * 0.14; cy += (y - cy) * 0.14;
    ap.style.transform = `translate(${cx}px, ${cy}px) rotate(${Math.max(-8, Math.min(8, dx * 0.06))}deg)`;
    raf = actif || Math.abs(dx) > 0.3 ? requestAnimationFrame(boucle) : 0;
  };
  liens.forEach((a) => {
    a.addEventListener("pointerenter", (e) => {
      if (!actif) { cx = e.clientX; cy = e.clientY; }
      actif = true;
      ap.style.setProperty("--c", a.style.getPropertyValue("--c"));
      lbl.textContent = a.dataset.titre || "";
      if (a.dataset.img) { img.src = a.dataset.img; ap.classList.add("photo"); }
      else ap.classList.remove("photo");
      ap.classList.add("on");
      if (!raf) raf = requestAnimationFrame(boucle);
    });
    a.addEventListener("pointerleave", () => { actif = false; ap.classList.remove("on"); });
  });
  addEventListener("pointermove", (e) => { x = e.clientX; y = e.clientY; }, { passive: true });
}

/** Les chiffres comptent jusqu'à leur valeur quand ils arrivent à l'écran. */
export function compteurs() {
  const els = document.querySelectorAll("[data-compte]");
  const lancer = (el) => {
    const cible = +el.dataset.compte;
    if (reduceMotion) { el.textContent = cible; return; }
    const t0 = performance.now(), d = 1400 + cible * 40;
    const pas = (t) => {
      const k = Math.min(1, (t - t0) / d);
      el.textContent = Math.round(cible * (1 - Math.pow(1 - k, 4)));
      if (k < 1) requestAnimationFrame(pas);
    };
    requestAnimationFrame(pas);
  };
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) { lancer(e.target); io.unobserve(e.target); }
  }), { threshold: 0.6 });
  els.forEach((el) => io.observe(el));
}

/** Les sur-titres se « décodent » lettre par lettre en arrivant. */
export function brouillage() {
  if (reduceMotion) return;
  const signes = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#/·";
  const decoder = (el) => {
    const final = el.textContent;
    let image = 0;
    const total = 22;
    const pas = () => {
      image++;
      const revele = Math.floor((image / total) * final.length);
      el.textContent = [...final].map((ch, k) =>
        k < revele || ch === " " ? ch : signes[(Math.random() * signes.length) | 0]).join("");
      if (image < total) requestAnimationFrame(pas);
      else el.textContent = final;
    };
    pas();
  };
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) { decoder(e.target); io.unobserve(e.target); }
  }), { rootMargin: "0px 0px -15% 0px" });
  document.querySelectorAll("#story .card:not(.hero-card) > .k").forEach((el) => io.observe(el));
}

/** Boutons aimantés : ils glissent vers la souris quand elle approche. */
export function aimants() {
  if (reduceMotion || !matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  const els = () => document.querySelectorAll(".badge, .retour, .map-toggle");
  let px = 0, py = 0, raf = 0;
  const maj = () => {
    raf = 0;
    els().forEach((el) => {
      const r = el.getBoundingClientRect();
      const dx = px - (r.left + r.width / 2), dy = py - (r.top + r.height / 2);
      const portee = Math.max(r.width, r.height) * 0.9 + 30;
      const v = Math.hypot(dx, dy) < portee ? `${(dx * 0.3).toFixed(1)}px ${(dy * 0.3).toFixed(1)}px` : "0px 0px";
      if (el.style.translate !== v) el.style.translate = v;
    });
  };
  addEventListener("pointermove", (e) => {
    px = e.clientX; py = e.clientY;
    if (!raf) raf = requestAnimationFrame(maj);
  }, { passive: true });
}

/** Début de paragraphe en italique, jusqu'à la première virgule (style magazine). */
export function attaques() {
  document.querySelectorAll("#story .card > p:not(.m):not(.transport):not(.lead)").forEach((p) => {
    if (p.children.length) return;
    const t = p.textContent;
    const m = t.match(/^(.{6,60}?)([,:])\s/);
    if (!m) return;
    p.innerHTML = `<em class="attaque">${esc(m[1])}${m[2]}</em> ${esc(t.slice(m[0].length))}`;
  });
}

/* =========================================================
   STYLE « ARCHIVE 3D »
   Photos construites en blocs 3D qui s'assemblent au défilement
   puis explosent vers la caméra, interface façon HUD, grain,
   brume de sable entre les chapitres, chargement 0 → 100.
   ========================================================= */

const lisse = (x) => x * x * (3 - 2 * x);
const borne = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
/* aléa déterministe (les blocs gardent leur trajectoire) */
const alea = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

/** Photos en blocs 3D, pilotées par le défilement. */
export function blocs3D() {
  if (reduceMotion) return;
  const galeries = [...document.querySelectorAll("#story .galerie[data-carnet]")];
  if (!galeries.length) return;
  const COLS = 6, RANGS = 4;
  let graine = 1;
  const etats = new Map();          // figure → { tuiles, seeds }

  const construire = (fig) => {
    if (!fig.isConnected) return;
    fig.querySelector(".blocs")?.remove();
    const img = fig.querySelector("img");
    const W = fig.clientWidth, H = fig.clientHeight;
    if (!W || !H) return;
    const tw = W / COLS, th = H / RANGS;
    const box = document.createElement("div");
    box.className = "blocs";
    box.setAttribute("aria-hidden", "true");
    let bgW = W, bgH = H, ox = 0, oy = 0;
    if (img && img.naturalWidth) {
      const k = Math.max(W / img.naturalWidth, H / img.naturalHeight);
      bgW = img.naturalWidth * k; bgH = img.naturalHeight * k;
      ox = (W - bgW) / 2; oy = (H - bgH) / 2;
    }
    const src = img ? (img.currentSrc || img.src) : "";
    const seeds = [];
    for (let r = 0; r < RANGS; r++) for (let c = 0; c < COLS; c++) {
      const t = document.createElement("i");
      t.style.cssText = `left:${c * tw}px;top:${r * th}px;width:${tw + .5}px;height:${th + .5}px;` +
        (src ? `background-image:url("${src.replace(/"/g, "%22")}");background-size:${bgW}px ${bgH}px;background-position:${ox - c * tw}px ${oy - r * th}px;` : "");
      box.appendChild(t);
      const g = graine++;
      // les blocs du centre arrivent en premier, ceux des bords après
      const centre = Math.hypot((c + .5) / COLS - .5, (r + .5) / RANGS - .5);
      seeds.push({
        x: (alea(g) - .5) * 2.4, y: (alea(g + 1) - .5) * 2.2,
        z: 500 + alea(g + 2) * 1300,
        rx: (alea(g + 3) - .5) * 220, ry: (alea(g + 4) - .5) * 260, rz: (alea(g + 5) - .5) * 120,
        d: borne(centre * .55 + alea(g + 6) * .25, 0, .6),
        W, H,
      });
    }
    fig.appendChild(box);
    etats.set(fig, { tuiles: [...box.children], seeds, img, fini: -1 });
    fig.classList.add("bloc-fig");
  };

  const preparer = (g) => {
    g.classList.add("blocs-galerie");
    [...g.children].forEach((fig) => {
      const img = fig.querySelector("img");
      if (img && !img.complete) img.addEventListener("load", () => { construire(fig); maj(); }, { once: true });
      construire(fig);
    });
  };
  galeries.forEach(preparer);

  // photos ajoutées plus tard (espace privé Firebase)
  const mo = new MutationObserver((ms) => {
    const touchees = new Set(ms.map((m) => m.target.closest?.(".galerie")).filter(Boolean));
    touchees.forEach((g) => { [...etats.keys()].forEach((f) => { if (!f.isConnected) etats.delete(f); }); preparer(g); });
    maj();
  });
  galeries.forEach((g) => mo.observe(g, { childList: true }));

  const visibles = new Set();
  const io = new IntersectionObserver((es) => es.forEach((e) => visibles[e.isIntersecting ? "add" : "delete"](e.target)),
    { rootMargin: "30% 0px" });
  galeries.forEach((g) => io.observe(g));

  let raf = 0;
  const maj = () => {
    raf = 0;
    const vh = innerHeight;
    for (const g of visibles) {
      for (const fig of g.children) {
        const st = etats.get(fig);
        if (!st) continue;
        const r = fig.getBoundingClientRect();
        // assemblage : le haut de la photo passe de 100 % à 30 % de l'écran
        const a = borne((vh - r.top) / (vh * 0.7));
        // explosion : le bas de la photo passe de 35 % à -15 % de l'écran
        const e = borne((vh * 0.35 - r.bottom) / (vh * 0.5));
        const etat = a >= 1 && e <= 0 ? 1 : 0;
        if (etat === 1) {
          if (st.fini !== 1) { st.fini = 1; fig.classList.add("bloc-ok"); }
          continue;
        }
        if (st.fini !== 0) { st.fini = 0; fig.classList.remove("bloc-ok"); }
        st.tuiles.forEach((t, k) => {
          const s = st.seeds[k];
          const la = lisse(borne((a - s.d) / (1 - s.d)));
          const le = lisse(borne((e - s.d * .5) / (1 - s.d * .5)));
          const m = 1 - la;                               // reste à parcourir
          const x = s.x * s.W * (m + le * 1.2);
          const y = s.y * s.H * (m + le * 1.2);
          const z = -s.z * m + (s.z + 400) * le;          // arrive du fond, repart vers la caméra
          const rx = s.rx * (m + le), ry = s.ry * (m + le), rz = s.rz * (m + le);
          t.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,${z.toFixed(1)}px) rotateX(${rx.toFixed(1)}deg) rotateY(${ry.toFixed(1)}deg) rotateZ(${rz.toFixed(1)}deg)`;
          t.style.opacity = (Math.min(1, la * 1.6) * (1 - le)).toFixed(3);
          t.style.setProperty("--lueur", (m * (1 - le) * la * 4).toFixed(2));
        });
      }
    }
  };
  const demander = () => { if (!raf) raf = requestAnimationFrame(maj); };
  addEventListener("scroll", demander, { passive: true });
  let attente = 0;
  addEventListener("resize", () => {
    clearTimeout(attente);
    attente = setTimeout(() => { [...etats.keys()].forEach(construire); maj(); }, 200);
  });
  maj();
}

/** Interface façon viseur : coins, croix centrale, coordonnées du lieu, index de section. */
export function hud() {
  const el = document.createElement("div");
  el.className = "hud";
  el.setAttribute("aria-hidden", "true");
  el.innerHTML = `
    <i class="hud-coin"></i><i class="hud-coin"></i><i class="hud-coin"></i><i class="hud-coin"></i>
    <div class="hud-croix"></div>
    <div class="hud-hd"><span>Carnet · Archive</span><span class="hud-idx">01 / 01</span></div>
    <div class="hud-bg"><span class="hud-fl">▸</span> Défiler pour explorer</div>
    <div class="hud-bd"><span class="hud-lat">45.5017° N</span><span class="hud-lon">73.5673° W</span></div>`;
  document.body.appendChild(el);
  const idx = el.querySelector(".hud-idx");
  const total = document.querySelectorAll("#story [data-view]").length;
  document.addEventListener("section", (e) => {
    idx.textContent = `${String(e.detail + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;
  });
}

/** Coordonnées du HUD qui défilent jusqu'au nouveau lieu. */
let coordAnim = 0, coordAct = [-73.5673, 45.5017];
export function hudCoord(lon, lat) {
  const la = document.querySelector(".hud-lat"), lo = document.querySelector(".hud-lon");
  if (!la || !lo || !isFinite(lon) || !isFinite(lat)) return;
  const [l0, p0] = coordAct, t0 = performance.now();
  cancelAnimationFrame(coordAnim);
  const pas = (t) => {
    const k = reduceMotion ? 1 : lisse(Math.min(1, (t - t0) / 900));
    const x = l0 + (lon - l0) * k, y = p0 + (lat - p0) * k;
    la.textContent = `${Math.abs(y).toFixed(4)}° ${y >= 0 ? "N" : "S"}`;
    lo.textContent = `${Math.abs(x).toFixed(4)}° ${x >= 0 ? "E" : "W"}`;
    if (k < 1) coordAnim = requestAnimationFrame(pas); else coordAct = [lon, lat];
  };
  coordAnim = requestAnimationFrame(pas);
}

/** Grain de pellicule + vignette chaude sur tout le site. */
export function grain() {
  const g = document.createElement("div");
  g.className = "grain";
  g.setAttribute("aria-hidden", "true");
  document.body.appendChild(g);
}

/** Nuage de sable qui balaie l'écran à l'entrée d'un chapitre. */
let brumeEl = null, brumeT = 0;
export function brume() {
  if (reduceMotion) return;
  const t = performance.now();
  if (t - brumeT < 1500) return;
  brumeT = t;
  if (!brumeEl) {
    brumeEl = document.createElement("div");
    brumeEl.className = "brume";
    brumeEl.setAttribute("aria-hidden", "true");
    brumeEl.innerHTML = "<i></i><i></i><i></i>";
    document.body.appendChild(brumeEl);
  }
  brumeEl.classList.remove("on"); void brumeEl.offsetWidth; brumeEl.classList.add("on");
}

/** Écran de chargement : grille de plan, compteur 0 → 100. */
export function chargement() {
  const intro = document.getElementById("intro");
  const el = document.createElement("div");
  el.className = "chargement";
  el.setAttribute("aria-hidden", "true");
  el.innerHTML = `
    <div class="ch-sol"></div>
    <svg class="ch-globe" viewBox="-100 -100 200 200">
      <circle r="80"/><ellipse rx="80" ry="28"/><ellipse rx="80" ry="58"/><line x1="-80" x2="80"/>
      <g class="ch-mer"><ellipse rx="28" ry="80"/><ellipse rx="58" ry="80"/><line y1="-80" y2="80"/></g>
    </svg>
    <div class="ch-hd"><span>Carnet · Archive n° 01</span><span>Amérique du Nord</span></div>
    <div class="ch-bg"><small>Chargement de l’archive</small><b class="ch-n">0</b></div>
    <div class="ch-bd"><span>45.5017° N</span><span>73.5673° W</span></div>
    <div class="ch-barre"><i></i></div>`;
  document.body.appendChild(el);
  const n = el.querySelector(".ch-n"), barre = el.querySelector(".ch-barre i");
  const duree = reduceMotion ? 200 : 2200, t0 = performance.now();
  let pret = !intro;
  const verifier = () => { if (intro?.classList.contains("terres-pretes") || !document.getElementById("intro")) pret = true; };
  const pas = (t) => {
    verifier();
    let k = Math.min(1, (t - t0) / duree);
    if (!pret) k = Math.min(k, .92);                 // on attend la planète
    const v = Math.round(100 * (1 - Math.pow(1 - k, 2.2)));
    n.textContent = v;
    barre.style.transform = `scaleX(${v / 100})`;
    if (v >= 100) {
      el.classList.add("fin");
      setTimeout(() => el.remove(), 1400);
      return;
    }
    requestAnimationFrame(pas);
  };
  requestAnimationFrame(pas);
}
