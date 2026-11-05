/* =========================================================
   Effets « film » sur la carte : étalonnage doré, rayons de
   lumière, poussière, viseur central (altitude, coordonnées,
   zoom), reflet sur la cible, éclat et fuite de lumière à
   chaque vol de caméra.
   ========================================================= */

const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const lisse = (x) => x * x * (3 - 2 * x);

export function effetsCarte(map) {
  const cadre = document.getElementById("mapwrap");
  if (!cadre) return { vue() {} };
  const el = document.createElement("div");
  el.className = "carte-fx";
  el.setAttribute("aria-hidden", "true");
  el.innerHTML = `
    <div class="cfx-etalon"></div>
    <div class="cfx-rayons"></div>
    <div class="cfx-poussiere"></div>
    <div class="cfx-fuite"></div>
    <div class="cfx-balayage"></div>
    <div class="cfx-flare"><i></i><b></b></div>
    <div class="cfx-reticule">
      <i></i><i></i><i></i><i></i>
      <span class="cfx-nom"></span>
      <span class="cfx-alt"><em>ALT</em> <b>0</b> <em class="cfx-u">km</em></span>
      <span class="cfx-zoom"></span>
    </div>
    <div class="cfx-coins"><i></i><i></i><i></i><i></i></div>
    <div class="cfx-bas"><span class="cfx-lat"></span><span class="cfx-lon"></span><span class="cfx-cap"></span></div>`;
  cadre.insertBefore(el, cadre.querySelector("#map").nextSibling);
  const $ = (s) => el.querySelector(s);
  const ret = $(".cfx-reticule"), nom = $(".cfx-nom"), alt = $(".cfx-alt b"), unite = $(".cfx-u"),
    zoom = $(".cfx-zoom"), lat = $(".cfx-lat"), lon = $(".cfx-lon"), cap = $(".cfx-cap"),
    flare = $(".cfx-flare"), fuite = $(".cfx-fuite"), balayage = $(".cfx-balayage");

  /* Altitude de la caméra (approximation à partir du zoom) */
  const altitude = () => {
    const c = map.getCenter(), h = map.getContainer().clientHeight || 600;
    const mParPx = 40075016.686 * Math.cos(c.lat * Math.PI / 180) / (512 * Math.pow(2, map.getZoom()));
    return (mParPx * h / 2) / Math.tan((map.transform?.fov ?? 36.87) * Math.PI / 360) * Math.cos(map.getPitch() * Math.PI / 180);
  };
  const majInfos = () => {
    const c = map.getCenter();
    const a = altitude();
    if (a >= 1000) { alt.textContent = (a / 1000).toFixed(a > 20000 ? 0 : 1).replace(".", ","); unite.textContent = "km"; }
    else { alt.textContent = Math.round(a); unite.textContent = "m"; }
    zoom.textContent = `Z ${map.getZoom().toFixed(2)} · ${Math.round(map.getPitch())}°`;
    lat.textContent = `${Math.abs(c.lat).toFixed(4)}° ${c.lat >= 0 ? "N" : "S"}`;
    lon.textContent = `${Math.abs(c.lng).toFixed(4)}° ${c.lng >= 0 ? "E" : "W"}`;
    cap.textContent = `CAP ${String(Math.round((map.getBearing() + 360) % 360)).padStart(3, "0")}°`;
  };
  let raf = 0;
  map.on("move", () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; majInfos(); }); });
  majInfos();

  /* Pendant un vol : le viseur cherche, la lumière fuit ; à l'arrivée : il verrouille, le reflet s'allume */
  let enVol = false, t0 = 0, animFuite = 0;
  const fuiteAnim = (t) => {
    const k = Math.min(1, (t - t0) / 2200);
    const v = enVol ? Math.min(1, k * 2.2) : Math.max(0, 1 - k * 1.6);
    fuite.style.opacity = (v * .75).toFixed(3);
    fuite.style.transform = `translateX(${(-25 + k * 50).toFixed(1)}%)`;
    if (enVol || v > 0) animFuite = requestAnimationFrame(fuiteAnim); else animFuite = 0;
  };
  map.on("movestart", (e) => {
    if (!e.originalEvent && !reduceMotion) {          // vol programmé (pas un geste de l'utilisateur)
      enVol = true; t0 = performance.now();
      el.classList.add("vol"); el.classList.remove("verrou");
      if (!animFuite) animFuite = requestAnimationFrame(fuiteAnim);
    }
  });
  map.on("moveend", () => {
    if (!enVol) return;
    enVol = false; t0 = performance.now();
    el.classList.remove("vol");
    el.classList.remove("verrou"); void el.offsetWidth; el.classList.add("verrou");
  });

  /* Lueur qui respire sur le reflet */
  const pulse = (t) => {
    flare.style.setProperty("--p", (.85 + .15 * Math.sin(t * .004)).toFixed(3));
    requestAnimationFrame(pulse);
  };
  if (!reduceMotion) requestAnimationFrame(pulse);

  return {
    /** À chaque changement de vue : nom de la cible, éclat qui balaie la carte. */
    vue(texte, type) {
      nom.textContent = texte;
      el.dataset.type = type;
      if (reduceMotion) return;
      balayage.classList.remove("on"); void balayage.offsetWidth; balayage.classList.add("on");
    },
  };
}
