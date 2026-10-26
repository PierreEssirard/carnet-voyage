/* Génère le récit (les cartes de texte) à partir des données. */

const esc = (s = "") => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

/** Nom du dossier Firebase « carnet/… » relié à une section (ex. « Québec » → « quebec »). */
export const cleCarnet = (nom) => nom.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function medias({ photos = [], video = "" }, nom, cle) {
  const items = photos.length
    ? photos.map((u, k) => `<figure><img src="${esc(u)}" alt="${esc(nom)} — photo ${k + 1}" loading="lazy" decoding="async"></figure>`)
    : [1, 2, 3].map(() => `<div class="ph"><span>📷 Photo à ajouter</span></div>`);
  const vid = video
    ? `<div class="video"><video controls playsinline preload="none" src="${esc(video)}"></video></div>`
    : "";
  return `<div class="galerie n-${Math.min(items.length, 5)}" data-carnet="${esc(cle)}">${items.join("")}</div>${vid}`;
}

export function renderStory(root, { MONTREAL, TRIPS, TRANSPORTS, BASE }) {
  const sommaire = [
    { id: "montreal", titre: MONTREAL.titre, sous: MONTREAL.sousTitre, c: MONTREAL.couleur },
    ...TRIPS.map((t, i) => ({ id: `trip-${i}`, titre: t.titre, sous: t.kicker, c: t.couleur })),
  ];

  let h = `
  <section class="hero" data-view="mtl">
    <div class="card hero-card active" style="--c:${MONTREAL.couleur}">
      <div class="k">Pierre Essirard · Canada &amp; États-Unis</div>
      <h1>Carnet <em>de voyages</em></h1>
      <p class="lead">Quatre mois en Amérique du Nord : Montréal comme camp de base, et quatre road trips autour.
         Fais défiler, la carte te suit.</p>
      <ol class="sommaire">
        ${sommaire.map((s, n) => `
        <li><a href="#${s.id}" style="--c:${s.c}">
          <span class="num">${String(n).padStart(2, "0")}</span>
          <span class="txt"><strong>${esc(s.titre)}</strong><small>${esc(s.sous)}</small></span>
          <span class="fl">→</span>
        </a></li>`).join("")}
      </ol>
      <div class="scroll-hint"><span></span>Défiler</div>
    </div>
  </section>

  <section class="card" id="montreal" data-view="mtl-intro" style="--c:${MONTREAL.couleur}">
    <div class="k">Destination principale</div>
    <h2>${esc(MONTREAL.titre)}</h2>
    <p>${esc(MONTREAL.texte)}</p>
    ${MONTREAL.parcours.length ? `<p class="m">${MONTREAL.parcours.length} trajets dans la ville</p>` : ""}
    ${medias(MONTREAL, MONTREAL.titre, cleCarnet(MONTREAL.titre))}
  </section>`;

  MONTREAL.parcours.forEach((s, k) => {
    const tr = TRANSPORTS[s.transport] || TRANSPORTS.pied;
    h += `
  <article class="card" data-view="mtl-step:${k}" style="--c:${MONTREAL.couleur}">
    <div class="k">Montréal · Trajet ${k + 1}</div>
    <h3>${esc(s.titre)}</h3>
    <div class="transport"><span>${tr.emoji}</span>${tr.label}<i></i>${esc(s.de.nom)} → ${esc(s.a.nom)}</div>
    <p>${esc(s.texte)}</p>
    ${medias(s, s.titre, cleCarnet(`${MONTREAL.titre}-${s.titre}`))}
  </article>`;
  });

  h += `
  <section class="card chapitre" data-view="overview">
    <div class="k">Vue d’ensemble</div>
    <h2>Les <em>road trips</em></h2>
    <p>${TRIPS.length} boucles au départ de ${esc(BASE.nom)}, entre le Québec, l’Ontario et l’État de New York.</p>
  </section>`;

  TRIPS.forEach((t, i) => {
    const villes = [...(t.boucle ? [BASE.nom] : []), ...t.etapes.map((e) => e.nom), ...(t.boucle ? [BASE.nom] : [])];
    h += `
  <section class="card chapitre" id="trip-${i}" data-view="trip:${i}" style="--c:${t.couleur}">
    <div class="k">${esc(t.kicker)} · ${esc(t.dates)}</div>
    <h2>${esc(t.titre)}</h2>
    <p>${esc(t.intro)}</p>
    <div class="itineraire">${villes.map((v) => `<span>${esc(v)}</span>`).join("")}</div>
    <p class="m">🚗 ${t.etapes.length} étape${t.etapes.length > 1 ? "s" : ""}</p>
  </section>`;
    t.etapes.forEach((e, j) => {
      h += `
  <article class="card" data-view="stop:${i}:${j}" style="--c:${t.couleur}">
    <div class="k">Étape ${j + 1}/${t.etapes.length} · ${esc(t.kicker)}</div>
    <h3>${esc(e.nom)}</h3>
    <p>${esc(e.texte)}</p>
    ${medias(e, e.nom, cleCarnet(e.nom))}
  </article>`;
    });
  });

  h += `
  <section class="card chapitre" data-view="overview">
    <div class="k">Fin du carnet</div>
    <h2>Merci d’avoir <em>suivi la route</em></h2>
    <p>Quatre mois, quatre road trips, une ville de cœur.</p>
    <p><a class="retour" href="#">↑ Revenir à Montréal</a></p>
  </section>`;

  root.innerHTML = h;
}