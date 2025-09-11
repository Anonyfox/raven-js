/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file JPEG quantization tables and quality scaling.
 *
 * Provides base Annex K tables (natural order), and a scaling function that maps
 * quality 1..100 to scaled Int32Array tables for Y and C with clamping to [1,255].
 */

import { zigZagToNatural } from "./zigzag.js";

/**
 * Base JPEG quantization tables from Annex K (JFIF defaults), in zig-zag order.
 * We convert to natural order at load time.
 */
const BASE_LUMA_ZZ = Uint8Array.from([
  16, 11, 10, 16, 24, 40, 51, 61, 12, 12, 14, 19, 26, 58, 60, 55, 14, 13, 16, 24, 40, 57, 69, 56, 14, 17, 22, 29, 51,
  87, 80, 62, 18, 22, 37, 56, 68, 109, 103, 77, 24, 35, 55, 64, 81, 104, 113, 92, 49, 64, 78, 87, 103, 121, 120, 101,
  72, 92, 95, 98, 112, 100, 103, 99,
]);

const BASE_CHROMA_ZZ = Uint8Array.from([
  17, 18, 24, 47, 99, 99, 99, 99, 18, 21, 26, 66, 99, 99, 99, 99, 24, 26, 56, 99, 99, 99, 99, 99, 47, 66, 99, 99, 99,
  99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99,
  99, 99, 99, 99, 99, 99,
]);

/**
 * Convert a zig-zag ordered 64-entry table to natural order Int32Array.
 * @param {Uint8Array} zz
 */
function toNatural(zz) {
  const out = new Int32Array(64);
  for (let i = 0; i < 64; i++) out[zigZagToNatural[i]] = zz[i] | 0;
  return out;
}

export const BASE_LUMA = toNatural(BASE_LUMA_ZZ);
export const BASE_CHROMA = toNatural(BASE_CHROMA_ZZ);

/**
 * Map quality (1..100) to scale factor per standard mapping.
 * @param {number} q
 */
export function qualityToScale(q) {
  if (!Number.isFinite(q)) throw new Error("ERR_QUALITY: not finite");
  const qc = Math.min(100, Math.max(1, Math.floor(q)));
  return qc < 50 ? Math.floor(5000 / qc) : Math.floor(200 - 2 * qc);
}

/**
 * Scale a base table by a scale factor (sf) and clamp to [1,255].
 * @param {Int32Array} base
 * @param {number} sf
 */
function scaleTable(base, sf) {
  const out = new Int32Array(64);
  for (let i = 0; i < 64; i++) {
    const v = Math.floor((base[i] * sf + 50) / 100);
    out[i] = v < 1 ? 1 : v > 255 ? 255 : v;
  }
  return out;
}

/**
 * Compute scaled luma and chroma quant tables from quality 1..100.
 * @param {number} quality
 * @returns {{ qY: Int32Array, qC: Int32Array }}
 */
export function buildQuantTables(quality) {
  const sf = qualityToScale(quality);
  return { qY: scaleTable(BASE_LUMA, sf), qC: scaleTable(BASE_CHROMA, sf) };
}
