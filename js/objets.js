/* =========================================================
   Objets 3D en or (style « archive ») : un modèle par chapitre,
   sur le côté, qui se matérialise depuis le sable doré, tourne
   lentement dans la fumée, puis se dissout en poussière.
   Moteur : three.js (chargé via l'importmap de index.html).
   ========================================================= */

const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const borne = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lisse = (x) => x * x * (3 - 2 * x);
const alea = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

/* ---------- Modèles ---------- */
function modeles(THREE) {
  const lathe = (pts, seg = 64) => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), seg);
  const boite = (w, h, d, x = 0, y = 0, z = 0) => { const g = new THREE.BoxGeometry(w, h, d); g.translate(x, y + h / 2, z); return g; };
  const toit = (w, h, d, x = 0, y = 0, z = 0) => {            // toit à quatre pans
    const g = new THREE.ConeGeometry(Math.SQRT1_2, 1, 4, 1); g.rotateY(Math.PI / 4);
    g.scale(w, h, d); g.translate(x, y + h / 2, z); return g;
  };
  const cyl = (r, h, x = 0, y = 0, z = 0, s = 24) => { const g = new THREE.CylinderGeometry(r, r, h, s); g.translate(x, y + h / 2, z); return g; };
  const cone = (r, h, x = 0, y = 0, z = 0, s = 24) => { const g = new THREE.ConeGeometry(r, h, s); g.translate(x, y + h / 2, z); return g; };

  return {
    /* Tour CN : profil réel (base, fût effilé, nacelle, Skypod, antenne) */
    cntower: () => [lathe([
      [0, 0], [3.4, 0], [3.2, .6], [1.9, 3], [1.35, 8], [1.05, 16], [.95, 19.2],
      [2.2, 19.4], [3.5, 19.9], [3.7, 20.6], [3.3, 21.4], [3.4, 21.7], [2.6, 22.3], [1.0, 22.6],
      [.85, 26.4], [1.55, 26.6], [1.6, 27.4], [.7, 27.7], [.42, 28.4], [.3, 31], [.14, 36.5], [0, 37],
    ])],

    /* Empire State : socle, fût à retraits, couronne, flèche */
    empire: () => {
      const g = [
        boite(10, 3, 7.5), boite(8.4, 5, 6.2, 0, 3), boite(6, 18, 4.4, 0, 8),
        boite(4.6, 3, 3.4, 0, 26), boite(3.4, 2, 2.6, 0, 29), boite(2.6, 1.6, 2, 0, 31),
        lathe([[1.15, 0], [1.15, 2], [.9, 2.4], [.8, 3.6], [.5, 4], [.35, 4.4], [.12, 9], [0, 9.2]], 32).translate(0, 32.6, 0),
      ];
      // nervures verticales sur le fût
      for (let k = -2; k <= 2; k++) {
        g.push(boite(.22, 18, .3, k * 1.15, 8, 2.3), boite(.22, 18, .3, k * 1.15, 8, -2.3));
        if (Math.abs(k) < 2) g.push(boite(.3, 18, .22, 3.1, 8, k * 1.1), boite(.3, 18, .22, -3.1, 8, k * 1.1));
      }
      return g;
    },

    /* Château Frontenac : ailes à toits pentus, tour centrale, tourelles */
    frontenac: () => {
      const g = [
        boite(16, 6, 4.5), toit(16, 4, 4.5, 0, 6),
        boite(4.5, 6, 10, -7, 0, -3), toit(4.5, 4, 10, -7, 6, -3),
        boite(4.5, 6, 10, 7, 0, -3), toit(4.5, 4, 10, 7, 6, -3),
        boite(5, 15, 5, 0, 0, 1), toit(5.4, 9, 5.4, 0, 15, 1),
        cone(.12, 2.4, 0, 23.6, 1, 8),
      ];
      for (const [x, z] of [[-8.6, 2], [8.6, 2], [-8.6, -8], [8.6, -8], [-2.7, 3.6], [2.7, 3.6]]) {
        g.push(cyl(.85, 7.5, x, 0, z), cone(1.05, 3.6, x, 7.5, z));
      }
      // lucarnes
      for (let k = -2; k <= 2; k++) g.push(toit(1.1, 1.4, 1, k * 3, 7, 2.1));
      return g;
    },

    /* Épinette : étages de branches, tronc */
    sapin: () => {
      const g = [cyl(.6, 4, 0, 0, 0, 16)];
      const etages = 7;
      for (let k = 0; k < etages; k++) {
        const t = k / (etages - 1);
        const r = 6.2 * (1 - t) + 1.2, h = 6.5 - t * 2.5, y = 3 + k * 3.1;
        g.push(cone(r, h, 0, y, 0, 9).rotateY(k * .7));
      }
      g.push(cone(.5, 3, 0, 3 + etages * 3.1, 0, 8));
      return g;
    },

    /* Feuille d'érable du drapeau, en relief */
    erable: () => {
      const d = [[0, 10], [1.2, 7.6], [2.6, 8.4], [2.2, 4.4], [5.2, 6.9], [5.8, 5.6], [8.4, 6.2], [7.6, 3.4], [9.2, 2.6],
        [4.8, -.7], [5.4, -2.5], [.45, -1.7], [.45, -5.4], [0, -5.4]];
      const s = new THREE.Shape();
      const pts = [...d, ...d.slice(1, -1).reverse().map(([x, y]) => [-x, y])];
      s.moveTo(pts[0][0], pts[0][1]);
      pts.slice(1).forEach(([x, y]) => s.lineTo(x, y));
      s.closePath();
      const g = new THREE.ExtrudeGeometry(s, { depth: .7, bevelEnabled: true, bevelThickness: .35, bevelSize: .3, bevelSegments: 4 });
      g.translate(0, 5.4, -.35);
      g.scale(1.25, 1.25, 1.25);
      return [g];
    },

    /* Biosphère : treillis géodésique (structure de Buckminster Fuller) */
    biosphere: () => {
      const R = 10;
      const ico = new THREE.IcosahedronGeometry(R, 3);
      const aretes = new THREE.EdgesGeometry(ico, 1).attributes.position;
      const g = [];
      const a = new THREE.Vector3(), b = new THREE.Vector3();
      for (let i = 0; i < aretes.count; i += 2) {
        a.fromBufferAttribute(aretes, i); b.fromBufferAttribute(aretes, i + 1);
        if (a.y < -4 && b.y < -4) continue;                      // sphère tronquée en bas
        const l = a.distanceTo(b);
        const c = new THREE.CylinderGeometry(.09, .09, l, 5, 1);
        c.translate(0, l / 2, 0);
        c.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()));
        c.translate(a.x, a.y + 4, a.z);
        g.push(c);
      }
      for (const v of new Set(Array.from({ length: ico.attributes.position.count }, (_, i) => i))) {
        a.fromBufferAttribute(ico.attributes.position, v);
        if (a.y < -4) continue;
        if (v % 3) continue;
        const n = new THREE.SphereGeometry(.16, 6, 4); n.translate(a.x, a.y + 4, a.z); g.push(n);
      }
      g.push(cyl(10, .4, 0, 0, 0, 48));
      return g;
    },
  };
}

/* ---------- Matériau or qui se dissout (bruit + hauteur) ---------- */
function orDissolvant(THREE, y0, hauteur) {
  const m = new THREE.MeshStandardMaterial({ color: 0xd9ad5f, metalness: 1, roughness: .26, envMapIntensity: 1.35 });
  m.userData.u = { uD: { value: 1 }, uY0: { value: y0 }, uH: { value: hauteur }, uT: { value: 0 } };
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, m.userData.u);
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vPosD;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvPosD = transformed;");
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", `#include <common>
        varying vec3 vPosD; uniform float uD, uY0, uH, uT;
        float hD(vec3 p){ return fract(sin(dot(p, vec3(12.9898,78.233,37.719))) * 43758.5453); }
        float nD(vec3 p){ vec3 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
          return mix(mix(mix(hD(i),hD(i+vec3(1,0,0)),f.x), mix(hD(i+vec3(0,1,0)),hD(i+vec3(1,1,0)),f.x),f.y),
                     mix(mix(hD(i+vec3(0,0,1)),hD(i+vec3(1,0,1)),f.x), mix(hD(i+vec3(0,1,1)),hD(i+vec3(1,1,1)),f.x),f.y),f.z); }`)
      .replace("#include <clipping_planes_fragment>", `#include <clipping_planes_fragment>
        float hN = clamp((vPosD.y - uY0) / uH, 0., 1.);
        float bruitD = nD(vPosD * .9) * .55 + nD(vPosD * 2.7) * .25;
        float valD = mix(bruitD, 1. - hN, .5);
        if (valD < uD) discard;
        float bordD = (1. - smoothstep(uD, uD + .045, valD)) * step(.002, uD);`)
      .replace("#include <opaque_fragment>", `#include <opaque_fragment>
        gl_FragColor.rgb += vec3(1.0, .72, .32) * bordD * 2.6;`);
  };
  return m;
}

function textureDouce(THREE, nuage) {
  const c = document.createElement("canvas");
  c.width = c.height = nuage ? 256 : 64;
  const g = c.getContext("2d");
  const W = c.width;
  if (!nuage) {
    const r = g.createRadialGradient(W / 2, W / 2, 0, W / 2, W / 2, W / 2);
    r.addColorStop(0, "rgba(255,240,210,1)"); r.addColorStop(.35, "rgba(255,225,170,.5)"); r.addColorStop(1, "rgba(255,210,150,0)");
    g.fillStyle = r; g.fillRect(0, 0, W, W);
  } else {
    // fumée : beaucoup de taches douces superposées
    for (let i = 0; i < 70; i++) {
      const x = W / 2 + (alea(i) - .5) * W * .55, y = W / 2 + (alea(i + 50) - .5) * W * .45, rr = W * (.08 + alea(i + 99) * .22);
      const r = g.createRadialGradient(x, y, 0, x, y, rr);
      r.addColorStop(0, `rgba(255,240,220,${.05 + alea(i + 7) * .07})`); r.addColorStop(1, "rgba(255,240,220,0)");
      g.fillStyle = r; g.fillRect(0, 0, W, W);
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* ---------- Moteur ---------- */
export async function objets3D() {
  const reperes = [...document.querySelectorAll(".objet3d[data-objet]")];
  if (!reperes.length) return;
  let THREE, RoomEnvironment, BufferGeometryUtils;
  try {
    THREE = await import("three");
    ({ RoomEnvironment } = await import("three/addons/environments/RoomEnvironment.js"));
    BufferGeometryUtils = await import("three/addons/utils/BufferGeometryUtils.js");
  } catch (e) { console.warn("objets 3D indisponibles", e); return; }

  const canvas = document.createElement("canvas");
  canvas.className = "objets-canvas";
  canvas.setAttribute("aria-hidden", "true");
  document.body.appendChild(canvas);
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
  } catch { canvas.remove(); return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture;
  scene.fog = new THREE.FogExp2(0x0b0907, .006);
  const cam = new THREE.PerspectiveCamera(30, 1, .1, 800);
  const cle = new THREE.DirectionalLight(0xffdca8, 3); cle.position.set(30, 45, 30); scene.add(cle);
  const contre = new THREE.DirectionalLight(0xff9f55, 2.4); contre.position.set(-35, 15, -35); scene.add(contre);
  scene.add(new THREE.HemisphereLight(0xffe2b0, 0x120c06, .35));

  const texPoint = textureDouce(THREE, false), texFumee = textureDouce(THREE, true);
  const FORMES = modeles(THREE);
  const HAUT = 20;                                       // hauteur commune des objets

  const objets = reperes.map((rep, n) => {
    const geos = (FORMES[rep.dataset.objet] || FORMES.erable)();
    let geo = BufferGeometryUtils.mergeGeometries(geos.map((g) => g.index ? g.toNonIndexed() : g), false);
    geo.computeVertexNormals();
    geo.computeBoundingBox();
    const bb = geo.boundingBox, taille = new THREE.Vector3(); bb.getSize(taille);
    const k = HAUT / Math.max(taille.y, taille.x * .9);
    geo.translate(-(bb.min.x + bb.max.x) / 2, -bb.min.y, -(bb.min.z + bb.max.z) / 2);
    geo.scale(k, k, k);
    geo.translate(0, -HAUT / 2, 0);
    geo.computeBoundingBox();
    const h = geo.boundingBox.max.y - geo.boundingBox.min.y;
    const mat = orDissolvant(THREE, geo.boundingBox.min.y, h);
    const mesh = new THREE.Mesh(geo, mat);
    const groupe = new THREE.Group();
    groupe.add(mesh);
    groupe.visible = false;
    scene.add(groupe);

    // Sable : points pris à la surface du modèle, qui s'envolent pendant la dissolution
    const pos = geo.attributes.position;
    const NS = 1400, base = new Float32Array(NS * 3), cur = new Float32Array(NS * 3), vit = new Float32Array(NS * 3);
    for (let i = 0; i < NS; i++) {
      const j = Math.floor(alea(i * 3 + n) * pos.count);
      base[i * 3] = pos.getX(j); base[i * 3 + 1] = pos.getY(j); base[i * 3 + 2] = pos.getZ(j);
      vit[i * 3] = (alea(i * 5) - .5) * 14; vit[i * 3 + 1] = 4 + alea(i * 7) * 14; vit[i * 3 + 2] = (alea(i * 11) - .5) * 14;
    }
    const gs = new THREE.BufferGeometry();
    gs.setAttribute("position", new THREE.BufferAttribute(cur, 3));
    const sable = new THREE.Points(gs, new THREE.PointsMaterial({
      map: texPoint, color: 0xf2cf8a, size: .55, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending,
    }));
    groupe.add(sable);

    // Lueur au sommet
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: texPoint, color: 0xffe2a8, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
    halo.scale.setScalar(7);
    halo.position.y = geo.boundingBox.max.y - .3;
    groupe.add(halo);

    return { rep, groupe, mat, sable, base, cur, vit, NS, halo, n, h };
  });

  /* ---------- Fumée (plusieurs nappes) + poussière en profondeur ---------- */
  const fumees = Array.from({ length: 16 }, (_, i) => {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({
      map: texFumee, color: i % 3 ? 0x5e4b36 : 0x7d6548, transparent: true, opacity: 0, depthWrite: false, fog: false,
    }));
    const bas = i < 9;
    s.userData = {
      x: (alea(i * 3) - .5) * (bas ? 50 : 140), y: bas ? -12 + alea(i * 5) * 8 : (alea(i * 5) - .5) * 60,
      z: (alea(i * 7) - .5) * (bas ? 30 : 90) - (bas ? 0 : 30), t: 22 + alea(i * 9) * (bas ? 22 : 40),
      o: bas ? .32 : .1, v: (alea(i * 13) - .5) * .00012, d: (alea(i * 17) - .5) * .004,
    };
    s.scale.setScalar(s.userData.t);
    scene.add(s);
    return s;
  });
  const NPo = 500, pPos = new Float32Array(NPo * 3);
  for (let i = 0; i < NPo; i++) {
    pPos[i * 3] = (alea(i * 31) - .5) * 220; pPos[i * 3 + 1] = (alea(i * 37) - .5) * 120; pPos[i * 3 + 2] = (alea(i * 41) - .5) * 200;
  }
  const gP = new THREE.BufferGeometry(); gP.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
  const poussiere = new THREE.Points(gP, new THREE.PointsMaterial({ map: texPoint, size: .5, color: 0xf3d7a0, transparent: true, opacity: .45, depthWrite: false, blending: THREE.AdditiveBlending }));
  scene.add(poussiere);

  /* ---------- Placement : sur le côté droit ---------- */
  let W = 0, H = 0;
  const main = document.querySelector("main");
  const taille = () => {
    W = innerWidth; H = innerHeight;
    renderer.setSize(W, H, false);
    const droite = main ? main.getBoundingClientRect().right : W * .6;
    const libre = W - droite;
    const cx = W < 800 ? W / 2 : libre >= 200 ? droite + libre / 2 : Math.min(W * .9, droite + 60);
    document.documentElement.classList.toggle("objet-fond", W < 800 || libre < 160);
    cam.aspect = W / H;
    cam.setViewOffset(W, H, -(cx - W / 2), 0, W, H);
    cam.updateProjectionMatrix();
  };
  taille();
  addEventListener("resize", taille);

  let mx = 0, my = 0, smx = 0, smy = 0;
  addEventListener("pointermove", (e) => { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; }, { passive: true });

  let bornes = [];
  const mesurer = () => {
    const fin = document.documentElement.scrollHeight;
    bornes = objets.map((o, k) => {
      const debut = (o.rep.closest(".card")?.getBoundingClientRect().top ?? 0) + scrollY;
      const suivant = objets[k + 1]?.rep.closest(".card");
      return [debut, suivant ? suivant.getBoundingClientRect().top + scrollY : fin];
    });
  };
  mesurer();
  addEventListener("resize", mesurer);
  setInterval(mesurer, 2000);

  let tPrec = 0;
  const image = (t) => {
    requestAnimationFrame(image);
    const dt = Math.min(.05, (t - (tPrec || t)) / 1000); tPrec = t;
    if (document.hidden || document.body.classList.contains("en-vol")) return;
    const yLect = scrollY + H * .55;
    smx += (mx - smx) * .04; smy += (my - smy) * .04;
    let uPrinc = 0, poidsMax = -1, transition = 0, vu = false;

    objets.forEach((o, k) => {
      const [a, b] = bornes[k] || [0, 1];
      const u = (yLect - a) / Math.max(1, b - a);
      const actif = u > -.3 && u < 1.12;
      o.groupe.visible = actif;
      if (!actif) return;
      vu = true;
      const entree = reduceMotion ? 1 : borne((u + .3) / .4);            // se matérialise
      const sortie = reduceMotion ? 0 : borne((u - .82) / .28);          // se dissout
      const present = Math.min(lisse(entree), 1 - lisse(sortie));
      if (present > poidsMax) { poidsMax = present; uPrinc = u; }
      transition = Math.max(transition, Math.sin(Math.PI * borne(entree)) * (entree < 1 ? 1 : 0), Math.sin(Math.PI * sortie));

      // dissolution : 1 = invisible, 0 = entier
      o.mat.userData.u.uD.value = 1 - present * 1.02;
      o.groupe.rotation.y = (reduceMotion ? 0 : t * .00009) + u * 1.4 + .5;
      o.groupe.position.y = Math.sin(t * .0006 + k) * .35 + (1 - present) * -1.5;
      o.halo.material.opacity = present * (.75 + .25 * Math.sin(t * .003));

      // sable qui s'échappe pendant les transitions
      const vol = 1 - present;
      o.sable.material.opacity = Math.sin(Math.PI * borne(vol)) * .9;
      if (o.sable.material.opacity > .01) {
        const dir = sortie > 0 ? 1 : -1;                  // à l'entrée, le sable converge vers l'objet
        for (let i = 0; i < o.NS; i++) {
          const kk = vol * (1 + alea(i) * .6);
          o.cur[i * 3] = o.base[i * 3] + o.vit[i * 3] * kk * dir * (dir < 0 ? -1 : 1);
          o.cur[i * 3 + 1] = o.base[i * 3 + 1] + o.vit[i * 3 + 1] * kk * (dir > 0 ? 1 : .6);
          o.cur[i * 3 + 2] = o.base[i * 3 + 2] + o.vit[i * 3 + 2] * kk;
        }
        o.sable.geometry.attributes.position.needsUpdate = true;
      }
    });

    if (!vu) { renderer.clear(); return; }

    // Caméra : léger travelling avant pendant le chapitre + parallaxe souris
    const v = borne(uPrinc);
    const dist = 92 - v * 14;
    const ang = .5 + smx * .22;
    cam.position.set(Math.sin(ang) * dist, 9 - smy * 7 + v * 3, Math.cos(ang) * dist);
    cam.lookAt(0, 1, 0);

    // Fumée : dérive lente, plus dense pendant les transitions
    fumees.forEach((s, i) => {
      const d = s.userData;
      s.material.rotation += d.v * dt * 1000;
      s.position.set(d.x + Math.sin(t * .00005 * (i + 1)) * 6, d.y + Math.sin(t * .00007 + i) * 2, d.z);
      s.material.opacity = d.o * (.6 + transition * .6);
    });
    poussiere.rotation.y = t * .000015;
    poussiere.position.y = (-scrollY * .01) % 60;

    renderer.render(scene, cam);
  };
  requestAnimationFrame(image);
}
