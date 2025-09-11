/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Chroma upsampling kernels (nearest and linear, clamped edges).
 */

/**
 * Nearest-neighbor upsampling from (sw,sh) to (sw*Hs, sh*Vs).
 * @param {Uint8Array} src
 * @param {number} sw
 * @param {number} sh
 * @param {number} Hs horizontal factor
 * @param {number} Vs vertical factor
 */
export function upsampleNearest(src, sw, sh, Hs, Vs) {
  const dw = sw * Hs;
  const dh = sh * Vs;
  const dst = new Uint8Array(dw * dh);
  for (let y = 0; y < dh; y++) {
    const sy = Math.min(sh - 1, (y / Vs) | 0);
    const srow = sy * sw;
    const drow = y * dw;
    for (let x = 0; x < dw; x++) {
      const sx = Math.min(sw - 1, (x / Hs) | 0);
      dst[drow + x] = src[srow + sx];
    }
  }
  return { data: dst, width: dw, height: dh };
}

/**
 * Linear separable upsampling (horizontal then vertical). Edges are clamped.
 * @param {Uint8Array} src
 * @param {number} sw
 * @param {number} sh
 * @param {number} Hs
 * @param {number} Vs
 */
export function upsampleLinear(src, sw, sh, Hs, Vs) {
  // Horizontal pass
  const iw = sw,
    ih = sh;
  const midW = iw * Hs;
  const horiz = new Uint8Array(midW * ih);
  for (let y = 0; y < ih; y++) {
    const srow = y * iw;
    const drow = y * midW;
    for (let dx = 0; dx < midW; dx++) {
      const fx = dx / Hs;
      const x0 = fx | 0;
      const x1 = Math.min(iw - 1, x0 + 1);
      const t = fx - x0;
      const a = src[srow + x0];
      const b = src[srow + x1];
      const v = Math.round(a * (1 - t) + b * t);
      horiz[drow + dx] = v;
    }
  }
  // Vertical pass
  const dw = midW,
    dh = ih * Vs;
  const dst = new Uint8Array(dw * dh);
  for (let dy = 0; dy < dh; dy++) {
    const fy = dy / Vs;
    const y0 = fy | 0;
    const y1 = Math.min(ih - 1, y0 + 1);
    const t = fy - y0;
    const row0 = y0 * dw;
    const row1 = y1 * dw;
    const drow = dy * dw;
    for (let x = 0; x < dw; x++) {
      const a = horiz[row0 + x];
      const b = horiz[row1 + x];
      const v = Math.round(a * (1 - t) + b * t);
      dst[drow + x] = v;
    }
  }
  return { data: dst, width: dw, height: dh };
}
