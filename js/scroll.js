/* Détecte la carte de texte au centre de l'écran et prévient la carte. */

export function suivreDefilement(selector, onView) {
  const mobile = matchMedia("(max-width: 800px)").matches;
  let actuelle = null;
  let minuterie = 0;

  const io = new IntersectionObserver((entrees) => {
    for (const e of entrees) {
      if (!e.isIntersecting) continue;
      const el = e.target;
      if (el === actuelle) continue;
      actuelle = el;
      document.querySelectorAll(".card.active").forEach((c) => c.classList.remove("active"));
      (el.classList.contains("card") ? el : el.querySelector(".card"))?.classList.add("active");
      // petit délai : évite de lancer dix vols de caméra si on défile vite
      clearTimeout(minuterie);
      minuterie = setTimeout(() => onView(el.dataset.view), 180);
    }
  }, { rootMargin: mobile ? "-30% 0px -60% 0px" : "-45% 0px -45% 0px" });

  document.querySelectorAll(selector).forEach((el) => io.observe(el));
}
