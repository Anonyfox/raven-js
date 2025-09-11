/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Reconstruct per-component planes from coefficient blocks.
 */

import { dequantizeAndIDCTBlock } from "./idct.js";

/**
 * Reconstruct a component plane at its native resolution from its coefficient blocks.
 * Blocks are dequantized+IDCT into 8×8 pixels and stitched with cropping at edges.
 *
 * @param {import('./parse.js').Frame} frame
 * @param {number} compIndex Index into frame.components
 * @returns {{ plane: Uint8Array, width: number, height: number }}
 */
export function reconstructComponentPlane(frame, compIndex) {
  const comp = frame.components[compIndex];
  const width = Math.ceil((frame.width * comp.h) / frame.Hmax);
  const height = Math.ceil((frame.height * comp.v) / frame.Vmax);
  const plane = new Uint8Array(width * height);
  const blockOut = new Uint8Array(64);
  const quant = /** @type {Int32Array} */ (frame.qtables[comp.tq]);
  if (!quant) throw new Error(`ERR_MISSING_DQT: quant table not found for component ${compIndex}`);

  for (let br = 0; br < comp.blocksPerColumn; br++) {
    for (let bc = 0; bc < comp.blocksPerLine; bc++) {
      const coeffs = comp.blocks[br][bc];
      dequantizeAndIDCTBlock(coeffs, quant, blockOut);
      const baseY = br * 8;
      const baseX = bc * 8;
      const copyH = Math.min(8, height - baseY);
      const copyW = Math.min(8, width - baseX);
      for (let y = 0; y < copyH; y++) {
        const srcRow = y * 8;
        const dstRow = (baseY + y) * width + baseX;
        for (let x = 0; x < copyW; x++) {
          plane[dstRow + x] = blockOut[srcRow + x];
        }
      }
    }
  }
  return { plane, width, height };
}
