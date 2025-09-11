/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file JPEG dequantization and IDCT (reference-quality, deterministic).
 *
 * Implements a separable 2D IDCT with exact cosine basis and JPEG normalization:
 *  f[x,y] = 1/4 * sum_u sum_v alpha(u) alpha(v) F[u,v]
 *           cos((2x+1)u*pi/16) cos((2y+1)v*pi/16)
 * where alpha(0)=1/sqrt(2), alpha(k>0)=1.
 *
 * The output is biased by +128 and clamped to [0,255].
 *
 * This implementation favors clarity and determinism. It can be swapped with a
 * fixed-point Loeffler/AAN variant later without changing the API.
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
 * Multiply coefficients by quantization table into Float64 domain.
 * @param {Int16Array} coeffs length 64
 * @param {Int32Array} quant length 64
 * @param {Float64Array} out length 64
 */
export function dequantizeToFloat(coeffs, quant, out) {
  for (let i = 0; i < 64; i++) out[i] = coeffs[i] * quant[i];
}

/**
 * Perform 2D IDCT on F (length 64 Float64), write Uint8 samples to out.
 * Adds +128 bias and clamps to [0,255].
 * @param {Float64Array} F length 64 (frequency domain, dequantized)
 * @param {Uint8Array} out length 64
 */
export function idctFloat64(F, out) {
  // DC-only fast path
  let acZero = true;
  for (let i = 1; i < 64; i++)
    if (F[i] !== 0) {
      acZero = false;
      break;
    }
  if (acZero) {
    // f[x,y] = 1/4 * alpha(0)^2 * F[0]
    const val = 0.25 * ALPHA[0] * ALPHA[0] * F[0] + 128;
    const s = clampTo8(Math.round(val));
    out.fill(s);
    return;
  }

  // Compute 2D IDCT via separable 1D transforms
  const tmp = new Float64Array(64);
  // Row-wise (y fixed, sum over v)
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      let sum = 0;
      for (let v = 0; v < 8; v++) {
        const cv = COS[y * 8 + v] * ALPHA[v];
        // sum over u inside to increase cache? We'll just do nested sums explicitly
        for (let u = 0; u < 8; u++) {
          sum += ALPHA[u] * COS[x * 8 + u] * cv * F[v * 8 + u];
        }
      }
      tmp[y * 8 + x] = 0.25 * sum;
    }
  }
  // Bias and clamp
  for (let i = 0; i < 64; i++) {
    out[i] = clampTo8(Math.round(tmp[i] + 128));
  }
}

/**
 * Combined convenience: coeffs(Int16), quant(Int32) -> out(Uint8 length 64)
 * @param {Int16Array} coeffs
 * @param {Int32Array} quant
 * @param {Uint8Array} out
 */
export function dequantizeAndIDCTBlock(coeffs, quant, out) {
  const F = new Float64Array(64);
  dequantizeToFloat(coeffs, quant, F);
  idctFloat64(F, out);
}

/** @param {number} x */
function clampTo8(x) {
  if (x < 0) return 0;
  if (x > 255) return 255;
  return x | 0;
}
