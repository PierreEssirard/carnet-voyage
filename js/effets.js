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
    h.innerHTML = txt.split(/\s+/)
      .map((m, i) => `<span class="mot" aria-hidden="true" style="--i:${i}"><span>${esc(m)}</span></span>`).join(" ");
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
  const racine = document.documentElement;
  const bandes = [...document.querySelectorAll(".bande")];
  let dernierY = scrollY, vitesse = 0, raf = 0;

  const image = () => {
    const y = scrollY;
    vitesse += ((y - dernierY) - vitesse) * 0.12;   // vitesse lissée
    dernierY = y;
    const penche = Math.max(-5, Math.min(5, vitesse * 0.12));
    racine.style.setProperty("--penche", `${penche.toFixed(2)}deg`);
    racine.style.setProperty("--tour", `${(y * 0.18).toFixed(1)}deg`);
    for (const el of bandes) {
      const r = el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > innerHeight + 200) continue;
      const p = 1 - (r.top + r.height) / (innerHeight + r.height); // 0 → 1 pendant la traversée
      el.style.setProperty("--p", p.toFixed(4));
    }
    raf = Math.abs(vitesse) > 0.05 ? requestAnimationFrame(image) : 0;
  };
  addEventListener("scroll", () => { if (!raf) raf = requestAnimationFrame(image); }, { passive: true });
  image();
}

/* =========================================================
   Effets d'agence : mot qui change, aperçu au survol,
   compteurs, sur-titres brouillés, boutons aimantés
   ========================================================= */

const fin = (fn) => new Promise((r) => setTimeout(r, fn));

/** « Carnet de … » : le dernier mot change toutes les 2,6 s. */
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
    setTimeout(() => avant.classList.remove("part"), 900);
  }, 2600);
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
  addEventListener("pointermove", (e) => {
    els().forEach((el) => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      const portee = Math.max(r.width, r.height) * 0.9 + 30;
      const d = Math.hypot(dx, dy);
      el.style.translate = d < portee ? `${dx * 0.3}px ${dy * 0.3}px` : "0 0";
    });
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
