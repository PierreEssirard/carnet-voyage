/* Petits outils géographiques (distances, interpolation, cap). */

const R = 6371; // rayon de la Terre en km
const RAD = Math.PI / 180;

/** Distance approximative en km entre deux points [lon, lat]. */
export function dist(a, b) {
  const dLat = (b[1] - a[1]) * RAD;
  const dLon = (b[0] - a[0]) * RAD * Math.cos(((a[1] + b[1]) / 2) * RAD);
  return R * Math.hypot(dLat, dLon);
}

/** Distances cumulées le long d'une ligne. */
export function cumul(coords) {
  const d = [0];
  for (let i = 1; i < coords.length; i++) d.push(d[i - 1] + dist(coords[i - 1], coords[i]));
  return d;
}

/** Point situé à x km du début de la ligne. Renvoie { pos, index }. */
export function along(coords, d, x) {
  if (x <= 0) return { pos: coords[0], index: 0 };
  const last = coords.length - 1;
  if (x >= d[last]) return { pos: coords[last], index: last };
  let lo = 0, hi = last;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (d[mid] <= x) lo = mid; else hi = mid;
  }
  const t = (x - d[lo]) / (d[hi] - d[lo] || 1);
  const a = coords[lo], b = coords[hi];
  return { pos: [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t], index: lo };
}

/** Cap (en degrés) pour aller de a vers b. */
export function bearing(a, b) {
  const dLon = (b[0] - a[0]) * RAD;
  const y = Math.sin(dLon) * Math.cos(b[1] * RAD);
  const x = Math.cos(a[1] * RAD) * Math.sin(b[1] * RAD) -
            Math.sin(a[1] * RAD) * Math.cos(b[1] * RAD) * Math.cos(dLon);
  return Math.atan2(y, x) / RAD;
}

/** Plus petite différence d'angle (-180..180). */
export function angleDiff(from, to) {
  return ((to - from + 540) % 360) - 180;
}

/** Ajoute des points intermédiaires sur une ligne droite (animations plus fluides). */
export function densify(coords, perSegment = 40) {
  const out = [];
  for (let i = 0; i < coords.length - 1; i++) {
    const [a, b] = [coords[i], coords[i + 1]];
    for (let k = 0; k < perSegment; k++) {
      const t = k / perSegment;
      out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
    }
  }
  out.push(coords[coords.length - 1]);
  return out;
}

/** GeoJSON d'une ligne (ou collection vide). */
export function lineFeature(coords) {
  if (!coords || coords.length < 2) return { type: "FeatureCollection", features: [] };
  return { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: coords } };
}

/** [lon, lat] d'un lieu { lon, lat }. */
export const ll = (p) => [p.lon, p.lat];
