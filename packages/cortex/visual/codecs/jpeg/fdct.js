/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Forward DCT (8×8) in Float64 with deterministic rounding.
 *
 * This uses the exact separable DCT definition with alpha scaling factors.
 * The output coefficients are in natural order [u*8+v].
 */

const PI = Math.PI;
const COS = new Float64Array(8 * 8);
for (let x = 0; x < 8; x++) {
  for (let u = 0; u < 8; u++) {
    COS[x * 8 + u] = Math.cos(((2 * x + 1) * u * PI) / 16);
  }
}
const ALPHA = new Float64Array(8);
for (let u = 0; u < 8; u++) ALPHA[u] = u === 0 ? 1 / Math.SQRT2 : 1;

/**
 * Perform forward DCT on a centered 8×8 block (Int16 in [-128..127]).
 * Write Float64 coefficients to out (length 64) in natural order.
 * @param {Int16Array} blockCentered length 64
 * @param {Float64Array} out length 64
 */
export function fdctFloat64(blockCentered, out) {
  // Compute separable 2D DCT: C[u,v] = 1/4 * a(u) a(v) * sum_{x,y} f[x,y] cos.. cos..
  for (let v = 0; v < 8; v++) {
    for (let u = 0; u < 8; u++) {
      let sum = 0;
      for (let y = 0; y < 8; y++) {
        const cv = COS[y * 8 + v] * ALPHA[v];
        for (let x = 0; x < 8; x++) {
          const fxy = blockCentered[y * 8 + x];
          sum += ALPHA[u] * COS[x * 8 + u] * cv * fxy;
        }
      }
      out[v * 8 + u] = 0.25 * sum;
    }
  }
}

/**
 * Quantize Float64 coefficients by dividing by quant table and rounding to nearest int.
 * Returns Int16Array of quantized coefficients (natural order).
 * @param {Float64Array} coeffs length 64
 * @param {Int32Array} quant length 64
 * @param {Int16Array} out length 64
 */
export function quantizeCoefficients(coeffs, quant, out) {
  for (let i = 0; i < 64; i++) {
    const q = quant[i] | 0;
    const v = coeffs[i] / (q === 0 ? 1 : q);
    const r = v < 0 ? -Math.round(-v) : Math.round(v);
    out[i] = r | 0;
  }
}
