/* =========================================================
   Objets 3D en blocs dorés (style « archive ») :
   un objet par chapitre, qui se construit bloc par bloc au
   défilement, tourne lentement puis se disperse en poussière.
   Un seul moteur WebGL (three.js) dessine tous les objets,
   chacun dans son emplacement .objet3d de la page.
   ========================================================= */

const THREE_URL = "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const borne = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lisse = (x) => x * x * (3 - 2 * x);
const alea = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

/* ---------- Formes en voxels ---------- */
const cle = (x, y, z) => `${x},${y},${z}`;

/** Ne garde que les blocs visibles (au moins une face libre). */
function surface(set) {
  const out = [];
  for (const k of set) {
    const [x, y, z] = k.split(",").map(Number);
    if (!set.has(cle(x + 1, y, z)) || !set.has(cle(x - 1, y, z)) || !set.has(cle(x, y + 1, z)) ||
        !set.has(cle(x, y - 1, z)) || !set.has(cle(x, y, z + 1)) || !set.has(cle(x, y, z - 1))) out.push([x, y, z]);
  }
  return out;
}
const boite = (s, x0, x1, y0, y1, z0, z1) => {
  for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) s.add(cle(x, y, z));
};
const disque = (s, r, y0, y1, cx = 0, cz = 0) => {
  for (let y = y0; y <= y1; y++) for (let x = -Math.ceil(r); x <= Math.ceil(r); x++) for (let z = -Math.ceil(r); z <= Math.ceil(r); z++)
    if (x * x + z * z <= r * r) s.add(cle(x + cx, y, z + cz));
};

const FORMES = {
  /* Biosphère de Montréal : sphère géodésique ajourée */
  biosphere() {
    const s = [], R = 9, lum = [];
    for (let x = -R; x <= R; x++) for (let y = -4; y <= R; y++) for (let z = -R; z <= R; z++) {
      const d = Math.hypot(x, y, z);
      if (Math.abs(d - R) < .55) {
        const motif = (Math.abs(x) + Math.abs(y * 2) + Math.abs(z)) % 4 === 0 || y === -4 || (x + z) % 3 === 0;
        if (motif) s.push([x, y, z]);
      }
    }
    lum.push([0, 0, 0]);
    return { blocs: s, lum, nom: "Biosphère", info: "Parc Jean-Drapeau · 1967" };
  },
  /* Château Frontenac : corps, tour centrale et toits pentus */
  frontenac() {
    const s = new Set();
    boite(s, -9, 9, 0, 6, -4, 4);               // corps
    boite(s, -3, 3, 7, 13, -3, 3);              // tour
    for (let k = 0; k <= 6; k++) boite(s, -3 + Math.floor(k / 2), 3 - Math.floor(k / 2), 14 + k, 14 + k, -3 + Math.floor(k / 2), 3 - Math.floor(k / 2));
    for (const cx of [-8, 8]) {                  // tourelles
      boite(s, cx - 1, cx + 1, 7, 9, -4, -2); boite(s, cx - 1, cx + 1, 7, 9, 2, 4);
      boite(s, cx, cx, 10, 11, -3, -3); boite(s, cx, cx, 10, 11, 3, 3);
    }
    for (let k = 0; k <= 2; k++) boite(s, -9 + k, 9 - k, 7 + k, 7 + k, -1 + 0, 1 - 0);   // faîtage
    return { blocs: surface(s), lum: [[0, 21, 0]], nom: "Château Frontenac", info: "Québec · 1893" };
  },
  /* Tour CN : pieds, fût, nacelle, antenne */
  cntower() {
    const s = new Set();
    disque(s, 3, 0, 1); disque(s, 2.2, 2, 4); disque(s, 1.3, 5, 25);
    disque(s, 3.6, 18, 19); disque(s, 4.2, 20, 20); disque(s, 3, 21, 22);
    disque(s, 1.6, 26, 27);
    boite(s, 0, 0, 28, 38, 0, 0);
    return { blocs: surface(s), lum: [[0, 20, 0], [0, 38, 0]], nom: "Tour CN", info: "Toronto · 553 m" };
  },
  /* Empire State Building : gradins et flèche */
  empire() {
    const s = new Set();
    boite(s, -6, 6, 0, 9, -4, 4);
    boite(s, -5, 5, 10, 17, -3, 3);
    boite(s, -3, 3, 18, 25, -2, 2);
    boite(s, -2, 2, 26, 29, -2, 2);
    boite(s, -1, 1, 30, 32, -1, 1);
    boite(s, 0, 0, 33, 40, 0, 0);
    return { blocs: surface(s), lum: [[0, 40, 0]], nom: "Empire State", info: "New York · 1931" };
  },
  /* Sapin de la Mauricie */
  sapin() {
    const s = new Set();
    boite(s, -1, 0, 0, 3, -1, 0);
    for (let y = 4; y <= 26; y++) {
      const t = (y - 4) / 22;
      const etage = ((y - 4) % 6) / 5;
      const r = (1 - t) * 8 * (0.62 + 0.38 * etage) + .4;
      disque(s, r, y, y);
    }
    boite(s, 0, 0, 27, 28, 0, 0);
    return { blocs: surface(s), lum: [[0, 28, 0]], nom: "Épinette noire", info: "Mauricie · Parc national" };
  },
  /* Feuille d'érable (vue d'ensemble) */
  erable() {
    const m = [
      "..........#..........",
      ".........###.........",
      "........#####........",
      "..#.....#####.....#..",
      "..##...#######...##..",
      "..###.#########.###..",
      "...###.#######.###...",
      "#...#############...#",
      "##..#############..##",
      ".###################.",
      "..#################..",
      "...###############...",
      "....#############....",
      "...#######.#######...",
      "..######.....######..",
      "..........#..........",
      "..........#..........",
      "..........#..........",
    ];
    const s = [];
    m.forEach((row, j) => [...row].forEach((c, i) => {
      if (c === "#") for (let z = -1; z <= 0; z++) s.push([i - 10, m.length - 1 - j, z]);
    }));
    return { blocs: s, lum: [[0, 12, 0]], nom: "Feuille d’érable", info: "Canada · 4 road trips" };
  },
};

/* ---------- Moteur ---------- */
export async function objets3D() {
  const slots = [...document.querySelectorAll(".objet3d[data-objet]")];
  if (!slots.length) return;
  let THREE;
  try { THREE = await import(THREE_URL); } catch { slots.forEach((s) => s.classList.add("indispo")); return; }

  const canvas = document.createElement("canvas");
  canvas.className = "objets-canvas";
  canvas.setAttribute("aria-hidden", "true");
  document.body.appendChild(canvas);
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
  } catch { canvas.remove(); slots.forEach((s) => s.classList.add("indispo")); return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
  renderer.setClearColor(0x000000, 0);
  renderer.autoClear = false;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  const taille = () => renderer.setSize(innerWidth, innerHeight, false);
  taille();
  addEventListener("resize", taille);

  const cube = new THREE.BoxGeometry(.9, .9, .9);
  const OR_BAS = new THREE.Color("#6e5130"), OR_HAUT = new THREE.Color("#f3d79e");

  const scenes = slots.map((slot, n) => {
    const def = (FORMES[slot.dataset.objet] || FORMES.erable)();
    slot.insertAdjacentHTML("beforeend", `
      <span class="o-hg">Objet ${String(n + 1).padStart(2, "0")}</span>
      <span class="o-hd">${def.blocs.length} blocs</span>
      <span class="o-bg">${def.nom}</span>
      <span class="o-bd">${def.info}</span>`);

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x0b0907, 40, 120);
    const cam = new THREE.PerspectiveCamera(32, 1, .1, 400);
    scene.add(new THREE.HemisphereLight(0xffe9c4, 0x1a120a, .9));
    const soleil = new THREE.DirectionalLight(0xffd9a0, 2.6);
    soleil.position.set(30, 50, 25);
    scene.add(soleil);
    const contre = new THREE.DirectionalLight(0xff9a4a, 1.4);
    contre.position.set(-30, 10, -30);
    scene.add(contre);

    // Centrage et taille
    const ys = def.blocs.map((b) => b[1]), xs = def.blocs.map((b) => b[0]), zs = def.blocs.map((b) => b[2]);
    const y0 = Math.min(...ys), y1 = Math.max(...ys);
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cz = (Math.min(...zs) + Math.max(...zs)) / 2, cy = (y0 + y1) / 2;
    const span = Math.max(y1 - y0, Math.max(...xs) - Math.min(...xs), Math.max(...zs) - Math.min(...zs)) + 2;

    const groupe = new THREE.Group();
    scene.add(groupe);
    const mat = new THREE.MeshStandardMaterial({ metalness: .55, roughness: .38, color: 0xffffff });
    const N = def.blocs.length;
    const mesh = new THREE.InstancedMesh(cube, mat, N);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    groupe.add(mesh);

    const cibles = [], departs = [], rots = [], delais = [], fuites = [];
    const col = new THREE.Color();
    def.blocs.forEach(([x, y, z], i) => {
      const t = new THREE.Vector3(x - cx, y - cy, z - cz);
      cibles.push(t);
      const a = alea(i * 3 + n * 101) * Math.PI * 2, r = span * (0.9 + alea(i * 7 + n) * 1.3);
      departs.push(new THREE.Vector3(Math.cos(a) * r, t.y + (alea(i * 5) - .2) * span * 1.4, Math.sin(a) * r));
      rots.push(new THREE.Euler(alea(i) * 6, alea(i + 1) * 6, alea(i + 2) * 6));
      delais.push(borne((y - y0) / Math.max(1, y1 - y0)) * .55 + alea(i * 11) * .12);      // du bas vers le haut
      fuites.push(new THREE.Vector3((alea(i * 13) - .5) * 2, .6 + alea(i * 17) * 1.6, (alea(i * 19) - .5) * 2).multiplyScalar(span * .9));
      col.copy(OR_BAS).lerp(OR_HAUT, borne((y - y0) / Math.max(1, y1 - y0)) * .85 + alea(i * 23) * .15);
      col.multiplyScalar(.85 + alea(i * 29) * .3);
      mesh.setColorAt(i, col);
    });
    mesh.instanceColor.needsUpdate = true;

    // Lumières de l'objet (sommet, nacelle…)
    def.lum.forEach(([x, y, z]) => {
      const p = new THREE.PointLight(0xffc878, 30, span * 1.2, 1.6);
      p.position.set(x - cx, y - cy + .5, z - cz);
      groupe.add(p);
      const halo = new THREE.Mesh(new THREE.SphereGeometry(.55, 16, 16), new THREE.MeshBasicMaterial({ color: 0xfff1d0 }));
      halo.position.copy(p.position);
      groupe.add(halo);
    });

    // Poussière d'or
    const NP = 260, pos = new Float32Array(NP * 3);
    for (let i = 0; i < NP; i++) {
      pos[i * 3] = (alea(i * 31 + n) - .5) * span * 2.2;
      pos[i * 3 + 1] = (alea(i * 37 + n) - .5) * span * 1.6;
      pos[i * 3 + 2] = (alea(i * 41 + n) - .5) * span * 2.2;
    }
    const geoP = new THREE.BufferGeometry();
    geoP.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const poussiere = new THREE.Points(geoP, new THREE.PointsMaterial({
      color: 0xf0d6a0, size: span / 90, transparent: true, opacity: .5, depthWrite: false, blending: THREE.AdditiveBlending,
    }));
    scene.add(poussiere);

    // Sol : grille de plan
    const grille = new THREE.GridHelper(span * 3, 24, 0x6b5536, 0x3a2e1f);
    grille.position.y = -(y1 - y0) / 2 - .6;
    grille.material.transparent = true;
    grille.material.opacity = .35;
    scene.add(grille);

    return { slot, scene, cam, groupe, mesh, cibles, departs, rots, delais, fuites, span, poussiere, grille, N, dernier: -1 };
  });

  const visibles = new Set();
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    const s = scenes.find((x) => x.slot === e.target);
    if (e.isIntersecting) visibles.add(s); else visibles.delete(s);
  }), { rootMargin: "20% 0px" });
  scenes.forEach((s) => io.observe(s.slot));

  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), sc = new THREE.Vector3(), eu = new THREE.Euler();
  let enMarche = false;

  const image = (t) => {
    const vh = innerHeight;
    renderer.setScissorTest(false);
    renderer.clear();
    renderer.setScissorTest(true);
    for (const s of visibles) {
      const r = s.slot.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh || !r.width) continue;
      // construction : le haut de l'emplacement passe de 95 % à 25 % de l'écran
      const p = reduceMotion ? 1 : borne((vh * .95 - r.top) / (vh * .7));
      // dispersion : le bas passe de 30 % à -10 % de l'écran
      const e = reduceMotion ? 0 : borne((vh * .3 - r.bottom) / (vh * .4));
      const cle = Math.round(p * 400) + Math.round(e * 400) * 1000;
      if (cle !== s.dernier) {
        s.dernier = cle;
        for (let i = 0; i < s.N; i++) {
          const d = s.delais[i];
          const k = lisse(borne((p - d * .7) / .45));
          const f = lisse(borne((e - (1 - d) * .4) / .6));
          v.copy(s.departs[i]).lerp(s.cibles[i], k).addScaledVector(s.fuites[i], f);
          eu.set(s.rots[i].x * (1 - k + f), s.rots[i].y * (1 - k + f), s.rots[i].z * (1 - k + f));
          q.setFromEuler(eu);
          const z = k <= 0 ? 0 : (0.25 + .75 * k) * (1 - f * .85);
          sc.set(z, z, z);
          m4.compose(v, q, sc);
          s.mesh.setMatrixAt(i, m4);
        }
        s.mesh.instanceMatrix.needsUpdate = true;
      }
      // Rotation lente + caméra
      s.groupe.rotation.y = (reduceMotion ? 0 : t * .00012) + p * 1.2;
      s.groupe.position.y = Math.sin(t * .0008) * .25;
      s.poussiere.rotation.y = -t * .00004;
      s.poussiere.material.opacity = .25 + .45 * e + .2 * (1 - p);
      s.grille.material.opacity = .35 * p * (1 - e);
      const dist = s.span * 2.15;
      s.cam.aspect = r.width / r.height;
      s.cam.position.set(Math.sin(.6) * dist, s.span * .32, Math.cos(.6) * dist);
      s.cam.lookAt(0, 0, 0);
      s.cam.updateProjectionMatrix();

      const y = vh - r.bottom;
      renderer.setViewport(r.left, y, r.width, r.height);
      renderer.setScissor(r.left, y, r.width, r.height);
      renderer.render(s.scene, s.cam);
      s.slot.style.setProperty("--p", p.toFixed(3));
    }
    if (visibles.size) requestAnimationFrame(image); else { enMarche = false; renderer.setScissorTest(false); renderer.clear(); }
  };
  const lancer = () => { if (!enMarche && visibles.size) { enMarche = true; requestAnimationFrame(image); } };
  addEventListener("scroll", lancer, { passive: true });
  new MutationObserver(lancer);
  setInterval(lancer, 500);
  lancer();
}
