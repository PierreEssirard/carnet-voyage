/* Espace privé : engrenage → code à 4 chiffres → galerie Firebase
   (voir, ajouter, supprimer des photos et vidéos).
   Firebase n'est chargé qu'au clic sur l'engrenage : aucun poids
   en plus pour le reste du site. */

import { firebaseConfig, COMPTE, SUFFIXE, VERSION_SDK } from "./firebase-config.js";
import { MONTREAL, TRIPS } from "./data.js";

const DOSSIERS = [
  { id: "montreal", nom: MONTREAL.titre },
  ...TRIPS.map((t, i) => ({ id: `road-trip-${i + 1}`, nom: `${t.kicker} · ${t.titre}` })),
  { id: "divers", nom: "Divers" },
];
const configure = !String(firebaseConfig.apiKey || "").startsWith("COLLE");
const estVideo = (nom) => /\.(mp4|mov|webm|m4v)$/i.test(nom);

/* ---------- Firebase (chargé à la demande) ---------- */
let fb = null;
async function firebase() {
  if (fb) return fb;
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

/* Fenêtre du code */
const modal = document.createElement("div");
modal.className = "prive-modal";
modal.setAttribute("role", "dialog");
modal.setAttribute("aria-modal", "true");
modal.innerHTML = `
  <form class="prive-box" autocomplete="off">
    <div class="prive-cadenas">🔒</div>
    <h3>Espace privé</h3>
    <p class="prive-sous">Entre le code à 4 chiffres</p>
    <div class="pin">${[0, 1, 2, 3].map((k) => `<input inputmode="numeric" pattern="[0-9]*" maxlength="1" aria-label="Chiffre ${k + 1}">`).join("")}</div>
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
      <h2>Mes <em>photos</em></h2>
    </div>
    <div class="prive-actions">
      <select class="prive-dossier" aria-label="Dossier">
        ${DOSSIERS.map((d) => `<option value="${d.id}">${d.nom}</option>`).join("")}
      </select>
      <label class="prive-btn prive-ajout">
        <input type="file" accept="image/*,video/*" multiple hidden>
        ＋ Ajouter
      </label>
      <button type="button" class="prive-btn prive-sortie" title="Se déconnecter">Verrouiller</button>
      <button type="button" class="prive-btn prive-fermer" aria-label="Fermer">✕</button>
    </div>
  </header>
  <div class="prive-envois"></div>
  <div class="prive-vide">Aucune photo dans ce dossier pour l’instant.</div>
  <div class="galerie prive-grille"></div>`;
document.body.appendChild(panneau);

const $ = (s, r = document) => r.querySelector(s);
const cases = [...modal.querySelectorAll(".pin input")];
const msg = $(".prive-msg", modal);
const selDossier = $(".prive-dossier", panneau);
const grille = $(".prive-grille", panneau);
const vide = $(".prive-vide", panneau);
const envois = $(".prive-envois", panneau);

/* ---------- Ouvrir / fermer ---------- */
function ouvrirModal() {
  modal.classList.add("ouvert");
  cases.forEach((c) => { c.value = ""; c.disabled = !configure; });
  msg.textContent = configure ? "" : "Firebase n’est pas encore configuré (voir js/firebase-config.js).";
  msg.className = "prive-msg" + (configure ? "" : " info");
  if (configure) setTimeout(() => cases[0].focus(), 50);
}
const fermerModal = () => modal.classList.remove("ouvert");

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

engrenage.addEventListener("click", async () => {
  if (!configure) return ouvrirModal();
  engrenage.classList.add("charge");
  try {
    const { auth } = await firebase();
    auth.currentUser ? ouvrirPanneau() : ouvrirModal();
  } catch (e) {
    console.error(e);
    ouvrirModal();
    msg.textContent = "Impossible de joindre Firebase. Vérifie ta connexion.";
  } finally {
    engrenage.classList.remove("charge");
  }
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
cases.forEach((c, k) => {
  c.addEventListener("input", () => {
    c.value = c.value.replace(/\D/g, "").slice(-1);
    if (c.value && k < 3) cases[k + 1].focus();
    if (cases.every((x) => x.value)) verifier();
  });
  c.addEventListener("keydown", (e) => {
    if (e.key === "Backspace" && !c.value && k > 0) cases[k - 1].focus();
  });
  c.addEventListener("paste", (e) => {
    const chiffres = (e.clipboardData.getData("text").match(/\d/g) || []).slice(0, 4);
    if (chiffres.length < 4) return;
    e.preventDefault();
    chiffres.forEach((d, n) => { cases[n].value = d; });
    verifier();
  });
});

async function verifier() {
  const code = cases.map((c) => c.value).join("");
  cases.forEach((c) => { c.disabled = true; });
  msg.className = "prive-msg";
  msg.textContent = "Vérification…";
  try {
    const { auth, A } = await firebase();
    await A.signInWithEmailAndPassword(auth, COMPTE, code + SUFFIXE);
    msg.textContent = "";
    modal.querySelector(".prive-box").classList.add("ok");
    setTimeout(() => {
      fermerModal();
      modal.querySelector(".prive-box").classList.remove("ok");
      ouvrirPanneau();
    }, 500);
  } catch (e) {
    const box = modal.querySelector(".prive-box");
    box.classList.remove("secoue");
    void box.offsetWidth; // relance l'animation
    box.classList.add("secoue");
    msg.className = "prive-msg erreur";
    msg.textContent = e.code === "auth/too-many-requests"
      ? "Trop d’essais. Réessaie dans quelques minutes."
      : e.code === "auth/network-request-failed" ? "Pas de connexion." : "Code incorrect.";
    cases.forEach((c) => { c.disabled = false; c.value = ""; });
    cases[0].focus();
  }
}

/* ---------- Galerie ---------- */
selDossier.addEventListener("change", chargerGalerie);

async function chargerGalerie() {
  const { storage, S } = await firebase();
  const dossier = selDossier.value;
  grille.innerHTML = "";
  vide.textContent = "Chargement…";
  vide.hidden = false;
  try {
    const res = await S.listAll(S.ref(storage, `prive/${dossier}`));
    if (selDossier.value !== dossier) return; // l'utilisateur a changé de dossier entre-temps
    const items = res.items.sort((a, b) => b.name.localeCompare(a.name)); // plus récentes d'abord
    const urls = await Promise.all(items.map((it) => S.getDownloadURL(it)));
    items.forEach((it, k) => grille.appendChild(vignette(it, urls[k])));
    vide.textContent = "Aucune photo dans ce dossier pour l’instant.";
    vide.hidden = items.length > 0;
  } catch (e) {
    console.error(e);
    vide.textContent = e.code === "storage/unauthorized"
      ? "Accès refusé : vérifie les règles de Storage (voir le guide)."
      : "Impossible de charger les photos.";
  }
}

function vignette(item, url) {
  const fig = document.createElement("figure");
  fig.innerHTML = estVideo(item.name)
    ? `<video src="${url}" controls playsinline preload="metadata"></video>`
    : `<img src="${url}" alt="${item.name.replace(/^\d+-/, "")}" loading="lazy" decoding="async">`;
  const suppr = document.createElement("button");
  suppr.className = "prive-suppr";
  suppr.type = "button";
  suppr.title = "Supprimer";
  suppr.textContent = "🗑";
  suppr.addEventListener("click", async (e) => {
    e.stopPropagation();
    if (!confirm("Supprimer définitivement ce fichier ?")) return;
    try {
      await fb.S.deleteObject(item);
      fig.classList.add("part");
      setTimeout(() => { fig.remove(); vide.hidden = grille.children.length > 0; }, 350);
    } catch (err) {
      alert("Suppression impossible.");
      console.error(err);
    }
  });
  fig.appendChild(suppr);
  return fig;
}

/* ---------- Envoi de fichiers ---------- */
$(".prive-ajout input", panneau).addEventListener("change", async (e) => {
  const fichiers = [...e.target.files];
  e.target.value = "";
  for (const f of fichiers) await envoyer(f);
  chargerGalerie();
});

const propre = (nom) => nom.normalize("NFD").replace(/[̀-ͯ]/g, "")
  .replace(/[^\w.-]+/g, "-").replace(/-+/g, "-").toLowerCase();

/** Réduit les grosses photos (max 2560 px) pour économiser l'espace gratuit. */
async function preparer(f) {
  if (!/^image\/(jpeg|png|webp)$/.test(f.type)) return { blob: f, nom: f.name };
  try {
    const img = await createImageBitmap(f);
    const k = Math.min(1, 2560 / Math.max(img.width, img.height));
    if (k === 1 && f.size < 1.5e6) return { blob: f, nom: f.name };
    const c = document.createElement("canvas");
    c.width = Math.round(img.width * k);
    c.height = Math.round(img.height * k);
    c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
    const blob = await new Promise((ok) => c.toBlob(ok, "image/jpeg", 0.86));
    return blob ? { blob, nom: f.name.replace(/\.\w+$/, "") + ".jpg" } : { blob: f, nom: f.name };
  } catch {
    return { blob: f, nom: f.name };
  }
}

async function envoyer(f) {
  const { storage, S } = await firebase();
  const ligne = document.createElement("div");
  ligne.className = "prive-envoi";
  ligne.innerHTML = `<span class="nom"></span><span class="barre"><i></i></span><span class="pct">0 %</span>`;
  ligne.querySelector(".nom").textContent = f.name;
  envois.appendChild(ligne);

  const { blob, nom } = await preparer(f);
  const chemin = `prive/${selDossier.value}/${Date.now()}-${propre(nom)}`;
  await new Promise((ok) => {
    const tache = S.uploadBytesResumable(S.ref(storage, chemin), blob, { contentType: blob.type || f.type });
    tache.on("state_changed",
      (s) => {
        const p = Math.round((s.bytesTransferred / s.totalBytes) * 100);
        ligne.querySelector("i").style.width = p + "%";
        ligne.querySelector(".pct").textContent = p + " %";
      },
      (err) => {
        console.error(err);
        ligne.classList.add("echec");
        ligne.querySelector(".pct").textContent = "Échec";
        ok();
      },
      () => {
        ligne.classList.add("fini");
        setTimeout(() => ligne.remove(), 1500);
        ok();
      });
  });
}