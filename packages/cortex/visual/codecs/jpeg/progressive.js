/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Progressive JPEG scan refinement (placeholder).
 *
 * Documentation:
 * This module will implement progressive JPEG scan handling per DECODE.md:
 * DC first/refine, AC first/refine with EOBRUN, and RST resets. No exports yet.
 */

import { decodeHuffmanSymbol } from "./huffman.js";
import { zigZagToNatural } from "./zigzag.js";

/**
 * Decode a progressive scan with restart handling.
 * - Supports DC first/refine and AC first/refine with EOBRUN.
 * - Predictors persist across scans; pass in and modified in place.
 *
 * @param {import('./huffman.js').createBitReader extends (...args:any)=>infer R ? R : any} br
 * @param {import('./parse.js').Frame} frame
 * @param {{ components: { idx:number, id:number, td:number, ta:number }[], Ss:number, Se:number, Ah:number, Al:number }} scan
 * @param {{ dc: any[], ac: any[] }} store
 * @param {number} Ri
 * @param {Int32Array} predictors
 */
export function decodeProgressiveScanWithDRI(br, frame, scan, store, Ri, predictors) {
  const isDC = scan.Ss === 0 && scan.Se === 0;
  const isFirst = scan.Ah === 0;
  const Al = scan.Al | 0;
  let mcusSinceRST = 0;
  let rstIndex = 0;
  let eobrun = 0;

  for (let my = 0; my < frame.mcusPerColumn; my++) {
    for (let mx = 0; mx < frame.mcusPerLine; mx++) {
      for (let s = 0; s < scan.components.length; s++) {
        const sc = scan.components[s];
        const comp = frame.components[sc.idx];
        for (let v = 0; v < comp.v; v++) {
          for (let h = 0; h < comp.h; h++) {
            const blockRow = my * comp.v + v;
            const blockCol = mx * comp.h + h;
            const coeffs = comp.blocks[blockRow][blockCol];

            if (isDC) {
              if (isFirst) {
                const sdc = decodeHuffmanSymbol(br, store.dc[sc.td]);
                const diff = br.receiveSigned(sdc) << Al;
                predictors[sc.idx] += diff;
                coeffs[0] = predictors[sc.idx];
              } else {
                // DC refine: append next bit at Al
                const bit = br.readBit();
                coeffs[0] |= bit << Al;
              }
            } else {
              // AC scan
              if (isFirst) {
                let k = scan.Ss;
                while (k <= scan.Se) {
                  if (eobrun > 0) {
                    eobrun--;
                    break;
                  }
                  const RS = decodeHuffmanSymbol(br, store.ac[sc.ta]);
                  const r = RS >> 4;
                  const sBits = RS & 0x0f;
                  if (sBits === 0) {
                    if (r < 15) {
                      // EOBRUN
                      const rbits = r;
                      const val = rbits ? br.receive(rbits) : 0;
                      eobrun = val + ((1 << rbits) - 1);
                      break;
                    } else {
                      // ZRL
                      k += 16;
                      continue;
                    }
                  }
                  // Skip r zeros
                  k += r;
                  if (k > scan.Se) break;
                  const zz = zigZagToNatural[k];
                  const vnew = br.receiveSigned(sBits) << Al;
                  coeffs[zz] = vnew;
                  k++;
                }
              } else {
                // AC refine
                let k = scan.Ss;
                while (k <= scan.Se) {
                  // refine existing nonzeros in band and process zeros/new insertion
                  if (eobrun > 0) {
                    for (let t = k; t <= scan.Se; t++) {
                      const zz = zigZagToNatural[t];
                      const cv = coeffs[zz];
                      if (cv !== 0) {
                        const bit = br.readBit();
                        if (bit) coeffs[zz] += (cv > 0 ? 1 : -1) * (1 << Al);
                      }
                    }
                    eobrun--;
                    break;
                  }
                  const RS = decodeHuffmanSymbol(br, store.ac[sc.ta]);
                  let r = RS >> 4;
                  const sBits = RS & 0x0f;
                  if (sBits === 0) {
                    if (r < 15) {
                      // EOBRUN start
                      const rbits = r;
                      const val = rbits ? br.receive(rbits) : 0;
                      eobrun = val + ((1 << rbits) - 1);
                      continue;
                    } else {
                      // ZRL in refine: skip 16 zeros with refining of intervening nonzeros
                      let zeros = 16;
                      while (k <= scan.Se && zeros > 0) {
                        const zz = zigZagToNatural[k];
                        const cv = coeffs[zz];
                        if (cv !== 0) {
                          const bit = br.readBit();
                          if (bit) coeffs[zz] += (cv > 0 ? 1 : -1) * (1 << Al);
                        } else {
                          zeros--;
                        }
                        k++;
                      }
                      continue;
                    }
                  }
                  // Insert with run r
                  while (k <= scan.Se) {
                    const zz = zigZagToNatural[k];
                    const cv = coeffs[zz];
                    if (cv !== 0) {
                      const bit = br.readBit();
                      if (bit) coeffs[zz] += (cv > 0 ? 1 : -1) * (1 << Al);
                    } else {
                      if (r === 0) {
                        // new coefficient
                        const sign = br.readBit() ? -1 : 1; // sign bit per spec: 1 means negative; using convention
                        coeffs[zz] = sign * (1 << Al);
                        k++;
                        break;
                      }
                      r = (r - 1) | 0;
                    }
                    k++;
                  }
                }
              }
            }
          }
        }
      }
      // Restart handling
      if (Ri > 0) {
        mcusSinceRST++;
        if (mcusSinceRST === Ri) {
          try {
            br.alignToByte();
            if (!br.hasMarker()) br.readBit();
          } catch (err) {
            if (err && err.code === "ERR_MARKER") {
              const m = br.getMarker();
              const expected = 0xffd0 + rstIndex;
              if (m !== expected) rstIndex = (m - 0xffd0) & 7;
              predictors.fill(0);
              eobrun = 0;
              mcusSinceRST = 0;
              rstIndex = (rstIndex + 1) & 7;
              continue;
            }
            throw err;
          }
        }
      }
    }
  }
}
