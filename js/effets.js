/* Effets visuels : apparition au défilement, barre de progression,
   visionneuse photo plein écran. */

const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Les cartes apparaissent en douceur quand elles entrent à l'écran. */
export function apparitions() {
  const cartes = document.querySelectorAll(".card");
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

/** Clic sur une photo : affichage plein écran, flèches, Échap, glisser du doigt. */
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
  let liste = [], idx = 0;

  const montrer = (k) => {
    idx = (k + liste.length) % liste.length;
    const src = liste[idx];
    img.classList.remove("in");
    img.onload = () => img.classList.add("in");
    img.src = src.currentSrc || src.src;
    img.alt = src.alt;
    cap.textContent = `${src.alt}  ·  ${idx + 1} / ${liste.length}`;
    lb.classList.toggle("seule", liste.length < 2);
  };
  const ouvrir = (el) => {
    liste = [...el.closest(".galerie").querySelectorAll("img")];
    montrer(liste.indexOf(el));
    lb.classList.add("ouvert");
    document.body.style.overflow = "hidden";
    lb.querySelector(".lb-close").focus();
  };
  const fermer = () => {
    lb.classList.remove("ouvert");
    document.body.style.overflow = "";
  };

  document.addEventListener("click", (e) => {
    const el = e.target.closest(".galerie img");
    if (el) ouvrir(el);
  });
  lb.addEventListener("click", (e) => {
    if (e.target.closest(".lb-close") || e.target === lb) fermer();
    else if (e.target.closest(".lb-prev")) montrer(idx - 1);
    else if (e.target.closest(".lb-next")) montrer(idx + 1);
  });
  addEventListener("keydown", (e) => {
    if (!lb.classList.contains("ouvert")) return;
    if (e.key === "Escape") fermer();
    if (e.key === "ArrowLeft") montrer(idx - 1);
    if (e.key === "ArrowRight") montrer(idx + 1);
  });
  let x0 = null;
  lb.addEventListener("touchstart", (e) => { x0 = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener("touchend", (e) => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 50) montrer(idx + (dx < 0 ? 1 : -1));
    x0 = null;
  });
}
