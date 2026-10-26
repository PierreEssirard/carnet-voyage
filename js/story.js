/* Génère le récit (les cartes de texte) à partir des données. */

const esc = (s = "") => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

/** Nom du dossier Firebase « carnet/… » relié à une section (ex. « Québec » → « quebec »). */
export const cleCarnet = (nom) => nom.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function medias({ photos = [], video = "" }, nom, cle) {
  const items = photos.length
    ? photos.map((u, k) => `<figure><img src="${esc(u)}" alt="${esc(nom)} — photo ${k + 1}" loading="lazy" decoding="async"></figure>`)
    : [1, 2, 3].map(() => `<div class="ph"><span>Photo à ajouter</span></div>`);
  const vid = video
    ? `<div class="video"><video controls playsinline preload="none" src="${esc(video)}"></video></div>`
    : "";
  return `<div class="galerie n-${Math.min(items.length, 5)}" data-carnet="${esc(cle)}">${items.join("")}</div>${vid}`;
}

/* Un objet 3D par road trip (dans l'ordre des TRIPS) */
const OBJETS = ["frontenac", "cntower", "empire", "sapin"];

export function renderStory(root, { MONTREAL, TRIPS, TRANSPORTS, BASE }) {
  const sommaire = [
    { id: "montreal", titre: MONTREAL.titre, sous: MONTREAL.sousTitre, c: MONTREAL.couleur, img: MONTREAL.photos[0] },
    ...TRIPS.map((t, i) => ({ id: `trip-${i}`, titre: t.titre, sous: t.kicker, c: t.couleur,
      img: t.etapes.find((e) => e.photos?.length)?.photos[0] })),
  ];
  const mots = ["voyages.", "route.", "Montréal.", "fjords.", "souvenirs.", "lacs."];
  const nbEtapes = TRIPS.reduce((n, t) => n + t.etapes.length, 0);

  let h = `
  <section class="hero" id="accueil" data-view="mtl">
    <div class="card hero-card active" style="--c:${MONTREAL.couleur}">
      <div class="k">Pierre Essirard</div>
      <h1 class="h-hero" aria-label="Carnet de voyages.">
        <span class="ligne"><span>Carnet</span></span>
        <span class="ligne"><span>de <span class="rotateur" aria-hidden="true">${mots.map((m, k) =>
          `<span class="rot-mot${k === 0 ? " on" : ""}">${esc(m)}</span>`).join("")}</span></span></span>
      </h1>
      <div class="date-ligne"><span>Canada &amp; États-Unis</span><i></i><span>2026</span></div>
      <p class="lead"><b>Quatre mois en Amérique du Nord.</b> Montréal comme camp de base, et quatre road trips autour.</p>
      <ol class="sommaire">
        ${sommaire.map((s, n) => `
        <li style="--i:${n}"><a href="#${s.id}" style="--c:${s.c}" data-titre="${esc(s.titre)}"${s.img ? ` data-img="${esc(s.img)}"` : ""}>
          <span class="num">${n + 1}</span>
          <span class="txt"><strong>${esc(s.titre)}</strong><small>${esc(s.sous)}</small></span>
          <span class="fl"><svg width="8" height="14" viewBox="0 0 8 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 1l6 6-6 6"/></svg></span>
        </a></li>`).join("")}
      </ol>
    </div>
  </section>

  <section class="card" id="montreal" data-view="mtl-intro" style="--c:${MONTREAL.couleur}">
    <div class="k">Destination principale</div>
    <h2>${esc(MONTREAL.titre)}</h2>
    <p>${esc(MONTREAL.texte)}</p>
    <div class="objet3d" data-objet="biosphere" aria-hidden="true"></div>
    ${MONTREAL.parcours.length ? `<p class="m">${MONTREAL.parcours.length} trajets dans la ville</p>` : ""}
    ${medias(MONTREAL, MONTREAL.titre, cleCarnet(MONTREAL.titre))}
  </section>`;

  MONTREAL.parcours.forEach((s, k) => {
    const tr = TRANSPORTS[s.transport] || TRANSPORTS.pied;
    h += `
  <article class="card" data-view="mtl-step:${k}" style="--c:${MONTREAL.couleur}">
    <div class="k">Montréal · Trajet ${k + 1}</div>
    <h3>${esc(s.titre)}</h3>
    <p class="transport"><b>${tr.label}</b> · ${esc(s.de.nom)} → ${esc(s.a.nom)}</p>
    <p>${esc(s.texte)}</p>
    ${medias(s, s.titre, cleCarnet(`${MONTREAL.titre}-${s.titre}`))}
  </article>`;
  });

  h += `
  <section class="card chapitre" data-view="overview">
    <div class="k">Vue d’ensemble</div>
    <h2>Les road trips.</h2>
    <p>${TRIPS.length} boucles au départ de ${esc(BASE.nom)}, entre le Québec, l’Ontario et l’État de New York.</p>
    <div class="objet3d" data-objet="erable" aria-hidden="true"></div>
    <div class="chiffres">
      <div><b data-compte="4">0</b><span>mois sur place</span></div>
      <div><b data-compte="${TRIPS.length}">0</b><span>road trips</span></div>
      <div><b data-compte="${nbEtapes}">0</b><span>étapes</span></div>
      <div><b data-compte="${MONTREAL.parcours.length}">0</b><span>trajets en ville</span></div>
    </div>
  </section>`;

  TRIPS.forEach((t, i) => {
    const villes = [...(t.boucle ? [BASE.nom] : []), ...t.etapes.map((e) => e.nom), ...(t.boucle ? [BASE.nom] : [])];
    h += `
  <section class="card chapitre" id="trip-${i}" data-view="trip:${i}" style="--c:${t.couleur}">
    <div class="bande" aria-hidden="true">
      <div class="bande-l">${Array(6).fill(`<span>${esc(t.titre)}</span><i>✦</i>`).join("")}</div>
      <div class="bande-l inverse">${Array(6).fill(`<span>${esc(t.kicker)}</span><i>—</i>`).join("")}</div>
    </div>
    <div class="k">${esc(t.kicker)} · ${esc(t.dates)}</div>
    <h2>${esc(t.titre)}</h2>
    <p>${esc(t.intro)}</p>
    <div class="objet3d" data-objet="${OBJETS[i] || "erable"}" aria-hidden="true"></div>
    <div class="itineraire">${villes.map((v, k) => `<span style="--i:${k}">${esc(v)}</span>`).join("")}</div>
    <p class="m">${t.etapes.length} étape${t.etapes.length > 1 ? "s" : ""}</p>
  </section>`;
    t.etapes.forEach((e, j) => {
      h += `
  <article class="card" data-view="stop:${i}:${j}" style="--c:${t.couleur}">
    <div class="k">${esc(t.kicker)} · Étape ${j + 1} sur ${t.etapes.length}</div>
    <h3>${esc(e.nom)}</h3>
    <p>${esc(e.texte)}</p>
    ${medias(e, e.nom, cleCarnet(e.nom))}
  </article>`;
    });
  });

  h += `
  <section class="card chapitre" data-view="overview">
    <div class="k">Fin du carnet</div>
    <h2>Merci d’avoir suivi la route.</h2>
    <p>Quatre mois, quatre road trips, une ville de cœur.</p>
    <div class="defile" aria-hidden="true"><div class="defile-piste">${[0, 1].map(() =>
      `<span>${[...new Set([MONTREAL.titre, ...TRIPS.flatMap((t) => t.etapes.map((e) => e.nom))])].map(esc).join("<i>·</i>")}<i>·</i></span>`).join("")}</div></div>
    <p><a class="retour" href="#accueil">Revenir au début</a></p>
  </section>`;

  root.innerHTML = h;
}