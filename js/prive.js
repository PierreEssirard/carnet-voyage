/* Espace privé : engrenage → code à 4 chiffres → galerie Firebase
   (voir, ajouter, légender, remplacer, supprimer photos et vidéos).
   Firebase n'est chargé qu'au clic sur l'engrenage : aucun poids
   en plus pour le reste du site. */

import { firebaseConfig, COMPTE, SUFFIXE, VERSION_SDK } from "./firebase-config.js?v=5";
import { MONTREAL, TRIPS } from "./data.js?v=5";
import { cleCarnet } from "./story.js?v=5";

/* Dossiers « carnet/… » : photos affichées dans les sections du site (visibles par tous).
   Dossiers « prive/… » : visibles uniquement après le code. */
const CARNET = [
  { id: `carnet/${cleCarnet(MONTREAL.titre)}`, nom: `${MONTREAL.titre} (accueil)` },
  ...MONTREAL.parcours.map((s) => ({ id: `carnet/${cleCarnet(`${MONTREAL.titre}-${s.titre}`)}`, nom: `${MONTREAL.titre} · ${s.titre}` })),
  ...TRIPS.flatMap((t) => t.etapes.map((e) => ({ id: `carnet/${cleCarnet(e.nom)}`, nom: `${t.kicker} · ${e.nom}` }))),
];
const PRIVE = [
  { id: "prive/montreal", nom: MONTREAL.titre },
  ...TRIPS.map((t, i) => ({ id: `prive/road-trip-${i + 1}`, nom: `${t.kicker} · ${t.titre}` })),
  { id: "prive/divers", nom: "Divers" },
];
const option = (d) => `<option value="${d.id}">${d.nom}</option>`;
const configure = !String(firebaseConfig.apiKey || "").startsWith("COLLE");
const estVideo = (nom) => /\.(mp4|mov|webm|m4v)$/i.test(nom);
const estHeic = (f) => /image\/hei[cf]/i.test(f.type) || /\.hei[cf]$/i.test(f.name);

/* ---------- Firebase (chargé à la demande) ---------- */
let fb = null;
let fbPromesse = null;
function firebase() {
  if (fb) return Promise.resolve(fb);
  if (fbPromesse) return fbPromesse;
  fbPromesse = (async () => {
    const base = `https://www.gstatic.com/firebasejs/${VERSION_SDK}/`;
    const [app, A, S] = await Promise.all([
      import(base + "firebase-app.js"),
      import(base + "firebase-auth.js"),
      import(base + "firebase-storage.js"),
    ]);
    const a = app.initializeApp(firebaseConfig);
    const auth = A.getAuth(a);
    await new Promise((ok) => { const stop = A.onAuthStateChanged(auth, () => { stop(); ok(); }); });
    fb = { auth, storage: S.getStorage(a), A, S };
    return fb;
  })();
  fbPromesse.catch(() => { fbPromesse = null; });
  return fbPromesse;
}

/** Message lisible + code technique (utile pour me dire ce qui bloque). */
function explication(e) {
  const code = e?.code || e?.message || String(e);
  const textes = {
    "storage/unauthorized": "Accès refusé : vérifie les règles de Storage et que tu es connecté.",
    "storage/unauthenticated": "Session expirée : verrouille puis rouvre l’espace.",
    "storage/bucket-not-found": "Espace de stockage introuvable : as-tu activé Storage dans Firebase ?",
    "storage/project-not-found": "Projet Firebase introuvable : vérifie firebase-config.js.",
    "storage/quota-exceeded": "Quota dépassé : l’espace de stockage est plein (ou le forfait Blaze n’est pas actif).",
    "storage/retry-limit-exceeded": "Connexion trop lente ou coupée. Réessaie.",
    "storage/canceled": "Envoi annulé.",
  };
  return `${textes[code] || "Une erreur est survenue."} (${code})`;
}

/* ---------- Interface ---------- */
const ICONE_ENGRENAGE = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`;

const engrenage = document.createElement("button");
engrenage.className = "prive-gear";
engrenage.type = "button";
engrenage.title = "Espace privé";
engrenage.setAttribute("aria-label", "Espace privé");
engrenage.innerHTML = ICONE_ENGRENAGE;
document.body.appendChild(engrenage);

/* Fenêtre du code : un seul vrai champ (invisible) posé sur 4 cases
   décoratives. Toucher les cases = toucher le champ → le clavier s'ouvre. */
const modal = document.createElement("div");
modal.className = "prive-modal";
modal.setAttribute("role", "dialog");
modal.setAttribute("aria-modal", "true");
modal.innerHTML = `
  <form class="prive-box" autocomplete="off" novalidate>
    <div class="prive-cadenas">🔒</div>
    <h3>Espace privé</h3>
    <p class="prive-sous">Entre le code à 4 chiffres</p>
    <label class="pin">
      <input class="pin-saisie" type="text" inputmode="numeric" pattern="[0-9]*"
             autocomplete="one-time-code" maxlength="4" enterkeyhint="go" aria-label="Code à 4 chiffres">
      <span class="pin-case"></span><span class="pin-case"></span><span class="pin-case"></span><span class="pin-case"></span>
    </label>
    <p class="prive-msg" aria-live="polite"></p>
    <button type="button" class="prive-lien prive-annuler">Annuler</button>
  </form>`;
document.body.appendChild(modal);

/* Panneau galerie */
const panneau = document.createElement("section");
panneau.className = "prive-panel";
panneau.setAttribute("aria-label", "Espace privé");
panneau.innerHTML = `
  <header class="prive-tete">
    <div>
      <div class="k">Espace privé</div>
      <h2>Mes photos.</h2>
    </div>
    <div class="prive-actions">
      <select class="prive-dossier" aria-label="Dossier">
        <optgroup label="📖 Carnet — affiché sur le site">${CARNET.map(option).join("")}</optgroup>
        <optgroup label="🔒 Privé — toi seul">${PRIVE.map(option).join("")}</optgroup>
      </select>
      <label class="prive-btn prive-ajout">
        <input type="file" accept="image/*,video/*,.heic,.heif" multiple hidden>
        ＋ Ajouter
      </label>
      <button type="button" class="prive-btn prive-sortie" title="Se déconnecter">Verrouiller</button>
      <button type="button" class="prive-btn prive-fermer" aria-label="Fermer">✕</button>
    </div>
  </header>
  <p class="prive-portee"></p>
  <div class="prive-envois"></div>
  <div class="prive-vide">Aucune photo dans ce dossier pour l’instant.</div>
  <div class="galerie prive-grille"></div>
  <input type="file" class="prive-remplacer" accept="image/*,video/*,.heic,.heif" hidden>`;
document.body.appendChild(panneau);

const $ = (s, r = document) => r.querySelector(s);
const saisie = $(".pin-saisie", modal);
const casesPin = [...modal.querySelectorAll(".pin-case")];
const msg = $(".prive-msg", modal);
const boite = $(".prive-box", modal);
const selDossier = $(".prive-dossier", panneau);
const grille = $(".prive-grille", panneau);
const vide = $(".prive-vide", panneau);
const envois = $(".prive-envois", panneau);
const champRemplacer = $(".prive-remplacer", panneau);
const portee = $(".prive-portee", panneau);

/* ---------- Ouvrir / fermer ---------- */
function ouvrirModal() {
  modal.classList.add("ouvert");
  saisie.value = "";
  saisie.disabled = !configure;
  dessinerPin();
  msg.className = "prive-msg" + (configure ? "" : " info");
  msg.textContent = configure ? "" : "Firebase n’est pas encore configuré (voir js/firebase-config.js).";
  // focus immédiat (dans le geste du doigt) : indispensable pour que le clavier s'ouvre sur iPhone
  if (configure) saisie.focus({ preventScroll: true });
}
function fermerModal() {
  modal.classList.remove("ouvert");
  saisie.blur();
}

function ouvrirPanneau() {
  panneau.classList.add("ouvert");
  document.body.classList.add("prive-actif");
  engrenage.classList.add("deverrouille");
  chargerGalerie();
}
function fermerPanneau() {
  panneau.classList.remove("ouvert");
  document.body.classList.remove("prive-actif");
}

engrenage.addEventListener("click", () => {
  if (fb?.auth.currentUser) return ouvrirPanneau();
  ouvrirModal(); // tout de suite, sans attendre Firebase
  if (!configure) return;
  firebase().then(({ auth }) => {
    if (auth.currentUser && modal.classList.contains("ouvert")) { // déjà connecté
      fermerModal();
      ouvrirPanneau();
    }
  }).catch((e) => {
    console.error(e);
    msg.className = "prive-msg erreur";
    msg.textContent = "Impossible de joindre Firebase. Vérifie ta connexion.";
  });
});
$(".prive-annuler", modal).addEventListener("click", fermerModal);
modal.addEventListener("click", (e) => { if (e.target === modal) fermerModal(); });
$(".prive-fermer", panneau).addEventListener("click", fermerPanneau);
$(".prive-sortie", panneau).addEventListener("click", async () => {
  await fb.A.signOut(fb.auth);
  engrenage.classList.remove("deverrouille");
  fermerPanneau();
});
addEventListener("keydown", (e) => {
  if (e.key !== "Escape" || document.querySelector(".lightbox.ouvert")) return;
  fermerModal();
  fermerPanneau();
}, true); // « true » : passe avant la visionneuse, pour ne fermer qu'elle si elle est ouverte

/* ---------- Saisie du code ---------- */
function dessinerPin() {
  const v = saisie.value;
  const actif = document.activeElement === saisie;
  casesPin.forEach((c, k) => {
    c.textContent = v[k] ? "•" : "";
    c.classList.toggle("pleine", !!v[k]);
    c.classList.toggle("courante", actif && k === Math.min(v.length, 3));
  });
}
saisie.addEventListener("input", () => {
  saisie.value = saisie.value.replace(/\D/g, "").slice(0, 4);
  dessinerPin();
  if (saisie.value.length === 4) verifier(saisie.value);
});
saisie.addEventListener("focus", dessinerPin);
saisie.addEventListener("blur", dessinerPin);
boite.addEventListener("submit", (e) => {
  e.preventDefault();
  if (saisie.value.length === 4) verifier(saisie.value);
});

async function verifier(code) {
  saisie.disabled = true;
  msg.className = "prive-msg";
  msg.textContent = "Vérification…";
  try {
    const { auth, A } = await firebase();
    await A.signInWithEmailAndPassword(auth, COMPTE, code + SUFFIXE);
    msg.textContent = "";
    boite.classList.add("ok");
    saisie.blur();
    setTimeout(() => {
      fermerModal();
      boite.classList.remove("ok");
      ouvrirPanneau();
    }, 500);
  } catch (e) {
    boite.classList.remove("secoue");
    void boite.offsetWidth; // relance l'animation
    boite.classList.add("secoue");
    msg.className = "prive-msg erreur";
    msg.textContent = e.code === "auth/too-many-requests"
      ? "Trop d’essais. Réessaie dans quelques minutes."
      : e.code === "auth/network-request-failed" ? "Pas de connexion."
      : ["auth/invalid-credential", "auth/wrong-password", "auth/user-not-found", "auth/invalid-login-credentials"].includes(e.code)
        ? "Code incorrect." : `Connexion impossible (${e.code || e.message}).`;
    saisie.disabled = false;
    saisie.value = "";
    dessinerPin();
    saisie.focus();
  }
}

/* ---------- Galerie ---------- */
selDossier.addEventListener("change", chargerGalerie);

async function chargerGalerie() {
  const dossier = selDossier.value;
  const public_ = dossier.startsWith("carnet/");
  portee.className = "prive-portee " + (public_ ? "publique" : "secrete");
  portee.textContent = public_
    ? "📖 Ces photos s’affichent dans la section correspondante du carnet, visibles par tous."
    : "🔒 Ces photos ne sont visibles qu’ici, après le code.";
  grille.innerHTML = "";
  vide.className = "prive-vide";
  vide.textContent = "Chargement…";
  vide.hidden = false;
  try {
    const { storage, S } = await firebase();
    const res = await S.listAll(S.ref(storage, dossier));
    if (selDossier.value !== dossier) return; // dossier changé entre-temps
    const items = res.items.sort((a, b) => b.name.localeCompare(a.name)); // plus récentes d'abord
    const infos = await Promise.all(items.map(async (it) => {
      const [url, meta] = await Promise.all([S.getDownloadURL(it), S.getMetadata(it).catch(() => ({}))]);
      return { item: it, url, legende: meta.customMetadata?.legende || "" };
    }));
    infos.forEach((info) => grille.appendChild(vignette(info)));
    vide.textContent = "Aucune photo dans ce dossier pour l’instant.";
    vide.hidden = infos.length > 0;
  } catch (e) {
    console.error(e);
    vide.className = "prive-vide erreur";
    vide.textContent = explication(e);
  }
}

const nomLisible = (nom) => nom.replace(/^\d+-/, "").replace(/\.\w+$/, "");

function vignette(info) {
  const { item, url } = info;
  const fig = document.createElement("figure");
  fig.innerHTML = estVideo(item.name)
    ? `<video src="${url}" controls playsinline preload="metadata"></video>`
    : `<img src="${url}" loading="lazy" decoding="async">`;
  const media = fig.firstElementChild;
  if (media.tagName === "IMG") {
    media.alt = info.legende || nomLisible(item.name);
    media.addEventListener("error", () => {
      fig.classList.add("illisible");
      fig.insertAdjacentHTML("afterbegin", `<div class="prive-illisible">Aperçu impossible<br><small>format non lu par ce navigateur</small></div>`);
    }, { once: true });
  }

  const legende = document.createElement("figcaption");
  legende.textContent = info.legende;
  legende.hidden = !info.legende;
  fig.appendChild(legende);

  const barre = document.createElement("div");
  barre.className = "prive-outils";
  barre.innerHTML = `
    <button type="button" data-a="legende" title="Légende" aria-label="Modifier la légende">✎</button>
    <button type="button" data-a="remplacer" title="Remplacer" aria-label="Remplacer">⇄</button>
    <button type="button" data-a="supprimer" title="Supprimer" aria-label="Supprimer">🗑</button>`;
  fig.appendChild(barre);

  barre.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    e.stopPropagation();
    if (b.dataset.a === "supprimer") supprimer(info, fig);
    if (b.dataset.a === "remplacer") demanderRemplacement(info, fig);
    if (b.dataset.a === "legende") editerLegende(info, fig, legende);
  });
  return fig;
}

async function supprimer(info, fig) {
  if (!confirm("Supprimer définitivement ce fichier ?")) return;
  try {
    await fb.S.deleteObject(info.item);
    fig.classList.add("part");
    setTimeout(() => { fig.remove(); vide.hidden = grille.children.length > 0; }, 350);
    rafraichirSection(info.item.parent.fullPath);
  } catch (err) {
    console.error(err);
    alert("Suppression impossible. " + explication(err));
  }
}

/* Légende : petit champ directement sur la photo */
function editerLegende(info, fig, legende) {
  if (fig.querySelector(".prive-legende-saisie")) return;
  const champ = document.createElement("input");
  champ.className = "prive-legende-saisie";
  champ.type = "text";
  champ.maxLength = 140;
  champ.placeholder = "Écris une légende…";
  champ.enterKeyHint = "done";
  champ.value = info.legende;
  legende.hidden = true;
  fig.appendChild(champ);
  champ.focus();

  let fini = false;
  const valider = async (garder) => {
    if (fini) return;
    fini = true;
    const texte = champ.value.trim();
    champ.remove();
    if (!garder || texte === info.legende) { legende.hidden = !info.legende; return; }
    try {
      await fb.S.updateMetadata(info.item, { customMetadata: { legende: texte } });
      info.legende = texte;
      legende.textContent = texte;
      rafraichirSection(info.item.parent.fullPath);
      const img = fig.querySelector("img");
      if (img) img.alt = texte || nomLisible(info.item.name);
    } catch (err) {
      console.error(err);
      alert("Légende non enregistrée. " + explication(err));
    }
    legende.hidden = !info.legende;
  };
  champ.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); valider(true); }
    if (e.key === "Escape") { e.stopPropagation(); valider(false); }
  });
  champ.addEventListener("blur", () => valider(true));
}

/* Remplacer : nouvelle photo à la même place (même ordre, même légende) */
let aRemplacer = null;
function demanderRemplacement(info, fig) {
  aRemplacer = { info, fig };
  champRemplacer.click();
}
champRemplacer.addEventListener("change", async () => {
  const f = champRemplacer.files[0];
  champRemplacer.value = "";
  if (!f || !aRemplacer) return;
  const { info, fig } = aRemplacer;
  aRemplacer = null;
  fig.classList.add("occupe");
  const horodatage = (info.item.name.match(/^\d+/) || [Date.now()])[0];
  const ok = await envoyer(f, {
    dossier: info.item.parent.fullPath,
    horodatage,
    legende: info.legende,
  });
  if (ok && ok.fullPath !== info.item.fullPath) {
    await fb.S.deleteObject(info.item).catch((e) => console.error(e));
  }
  chargerGalerie();
  rafraichirSection(info.item.parent.fullPath);
});

/* ---------- Envoi de fichiers ---------- */
$(".prive-ajout input", panneau).addEventListener("change", async (e) => {
  const fichiers = [...e.target.files];
  e.target.value = "";
  const dossier = selDossier.value;
  for (const f of fichiers) await envoyer(f);
  chargerGalerie();
  rafraichirSection(dossier);
});

const propre = (nom) => nom.normalize("NFD").replace(/[̀-ͯ]/g, "")
  .replace(/[^\w.-]+/g, "-").replace(/-+/g, "-").toLowerCase();

/* Les photos d'iPhone (HEIC) ne s'affichent pas dans Chrome :
   on les convertit en JPEG avant l'envoi. */
let heicPret = null;
function chargerHeic() {
  if (window.heic2any) return Promise.resolve(window.heic2any);
  heicPret ??= new Promise((ok, ko) => {
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/heic2any@0.0.4/dist/heic2any.min.js";
    s.onload = () => ok(window.heic2any);
    s.onerror = ko;
    document.head.appendChild(s);
  });
  return heicPret;
}

/** Convertit / réduit les photos (max 2560 px) pour qu'elles s'affichent partout et prennent peu de place. */
async function preparer(f) {
  let source = f;
  let nom = f.name;
  if (estHeic(f)) {
    try {
      const heic2any = await chargerHeic();
      const res = await heic2any({ blob: f, toType: "image/jpeg", quality: 0.86 });
      source = Array.isArray(res) ? res[0] : res;
      nom = nom.replace(/\.\w+$/, "") + ".jpg";
    } catch (e) {
      console.warn("Conversion HEIC impossible", e);
      return { blob: f, nom };
    }
  }
  if (!/^image\/(jpeg|png|webp)$/.test(source.type)) return { blob: source, nom };
  try {
    const img = await createImageBitmap(source);
    const k = Math.min(1, 2560 / Math.max(img.width, img.height));
    if (k === 1 && source.size < 1.5e6) return { blob: source, nom };
    const c = document.createElement("canvas");
    c.width = Math.round(img.width * k);
    c.height = Math.round(img.height * k);
    c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
    const blob = await new Promise((ok) => c.toBlob(ok, "image/jpeg", 0.86));
    return blob ? { blob, nom: nom.replace(/\.\w+$/, "") + ".jpg" } : { blob: source, nom };
  } catch {
    return { blob: source, nom };
  }
}

/**
 * Envoie un fichier. Renvoie la référence créée, ou null en cas d'échec.
 * options : dossier (chemin complet), horodatage, legende
 */
async function envoyer(f, options = {}) {
  const ligne = document.createElement("div");
  ligne.className = "prive-envoi";
  ligne.innerHTML = `<span class="nom"></span><span class="barre"><i></i></span><span class="pct">…</span>`;
  ligne.querySelector(".nom").textContent = f.name;
  envois.appendChild(ligne);
  const echec = (err) => {
    console.error(err);
    ligne.classList.add("echec");
    ligne.querySelector(".pct").textContent = "Échec";
    ligne.querySelector(".nom").textContent = `${f.name} — ${explication(err)}`;
  };

  try {
    const { storage, S } = await firebase();
    const { blob, nom } = await preparer(f);
    const dossier = options.dossier || selDossier.value;
    const chemin = `${dossier}/${options.horodatage || Date.now()}-${propre(nom)}`;
    const meta = { contentType: blob.type || f.type || undefined };
    if (options.legende) meta.customMetadata = { legende: options.legende };
    const cible = S.ref(storage, chemin);

    return await new Promise((ok) => {
      const tache = S.uploadBytesResumable(cible, blob, meta);
      tache.on("state_changed",
        (s) => {
          const p = Math.round((s.bytesTransferred / s.totalBytes) * 100);
          ligne.querySelector("i").style.width = p + "%";
          ligne.querySelector(".pct").textContent = p + " %";
        },
        (err) => { echec(err); ok(null); },
        () => {
          ligne.classList.add("fini");
          setTimeout(() => ligne.remove(), 1500);
          ok(cible);
        });
    });
  } catch (err) {
    echec(err);
    return null;
  }
}

/* =========================================================
   PHOTOS DU CARNET : affichage public dans les sections du site
   ========================================================= */

/** Remplit la galerie d'une section avec les photos du dossier « carnet/… ». */
async function remplirSection(galerie) {
  const { storage, S } = await firebase();
  const dossier = `carnet/${galerie.dataset.carnet}`;
  const res = await S.listAll(S.ref(storage, dossier));
  const items = res.items.sort((a, b) => a.name.localeCompare(b.name)); // ordre d'envoi
  const infos = await Promise.all(items.map(async (it) => {
    const [url, meta] = await Promise.all([S.getDownloadURL(it), S.getMetadata(it).catch(() => ({}))]);
    return { nom: it.name, url, legende: meta.customMetadata?.legende || "" };
  }));

  // on enlève les anciennes photos Firebase et les emplacements vides
  galerie.querySelectorAll(".depuis-firebase, .ph").forEach((el) => el.remove());
  for (const info of infos) {
    const fig = document.createElement("figure");
    fig.className = "depuis-firebase";
    if (estVideo(info.nom)) {
      fig.innerHTML = `<video src="${info.url}" controls playsinline preload="metadata"></video>`;
    } else {
      const img = document.createElement("img");
      img.src = info.url;
      img.loading = "lazy";
      img.decoding = "async";
      img.alt = info.legende || nomLisible(info.nom);
      fig.appendChild(img);
    }
    if (info.legende) {
      const cap = document.createElement("figcaption");
      cap.textContent = info.legende;
      fig.appendChild(cap);
    }
    galerie.appendChild(fig);
  }
  // section sans aucune photo : on remet les emplacements vides
  if (!galerie.children.length) {
    galerie.innerHTML = [1, 2, 3].map(() => `<div class="ph"><span>Photo à ajouter</span></div>`).join("");
  }
  galerie.className = galerie.className.replace(/\bn-\d\b/, `n-${Math.min(galerie.children.length, 5)}`);
}

function rafraichirSection(dossier) {
  if (!dossier.startsWith("carnet/")) return;
  const g = document.querySelector(`.galerie[data-carnet="${dossier.slice(7)}"]`);
  if (g) remplirSection(g).catch((e) => console.warn("Section non rafraîchie", e));
}

/* Au chargement du site (sans ralentir l'affichage) */
if (configure) {
  const lancer = () => {
    document.querySelectorAll(".galerie[data-carnet]").forEach((g) => {
      remplirSection(g).catch((e) => console.warn(`Photos du carnet indisponibles (${g.dataset.carnet})`, e.code || e));
    });
  };
  "requestIdleCallback" in window ? requestIdleCallback(lancer, { timeout: 2500 }) : setTimeout(lancer, 1200);
}