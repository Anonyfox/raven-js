/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Baseline JPEG MCU entropy decoder (no DRI yet).
 */

import { decodeHuffmanSymbol } from "./huffman.js";
import { zigZagToNatural } from "./zigzag.js";

/**
 * Decode a baseline scan into frame component coefficient blocks.
 * @param {import('./huffman.js').createBitReader extends (...args:any)=>infer R ? R : any} br
 * @param {import('./parse.js').Frame} frame
 * @param {{ components: { idx:number, id:number, td:number, ta:number }[] }} scan
 * @param {{ dc: any[], ac: any[] }} store
 */
export function decodeBaselineScan(br, frame, scan, store) {
  const totalMCUs = frame.mcusPerLine * frame.mcusPerColumn;
  if (totalMCUs === 0) return;
  // DC predictors per component index
  const predictors = new Int32Array(frame.components.length);

  for (let my = 0; my < frame.mcusPerColumn; my++) {
    for (let mx = 0; mx < frame.mcusPerLine; mx++) {
      for (let s = 0; s < scan.components.length; s++) {
        const sc = scan.components[s];
        const comp = frame.components[sc.idx];
        for (let v = 0; v < comp.v; v++) {
          for (let h = 0; h < comp.h; h++) {
            const blockRow = Math.min(my * comp.v + v, comp.blocksPerColumn - 1);
            const blockCol = Math.min(mx * comp.h + h, comp.blocksPerLine - 1);
            const rowArr = comp.blocks[blockRow];
            if (!rowArr) continue;
            const coeffs = rowArr[blockCol];
            if (!coeffs) continue;

            // DC
            const dcTab = store.dc[sc.td];
            const sdc = decodeHuffmanSymbol(br, dcTab);
            const diff = br.receiveSigned(sdc);
            predictors[sc.idx] += diff;
            coeffs[0] = predictors[sc.idx];

            // AC
            let k = 1;
            const acTab = store.ac[sc.ta];
            while (k < 64) {
              const RS = decodeHuffmanSymbol(br, acTab);
              if (RS === 0x00) {
                // EOB
                break;
              }
              const r = RS >> 4;
              const sBits = RS & 0x0f;
              if (RS === 0xf0) {
                k += 16;
                continue;
              }
              k += r;
              if (k >= 64) break;
              const val = br.receiveSigned(sBits);
              const nat = zigZagToNatural[k];
              coeffs[nat] = val;
              k++;
            }
          }
        }
      }
    }
  }
}

/**
 * Wrap baseline MCU decode with restart interval handling.
 * Resets DC predictors at each RST and consumes markers from bitreader.
 *
 * @param {import('./huffman.js').createBitReader extends (...args:any)=>infer R ? R : any} br
 * @param {import('./parse.js').Frame} frame
 * @param {{ components: { idx:number, id:number, td:number, ta:number }[] }} scan
 * @param {{ dc: any[], ac: any[] }} store
 * @param {number} Ri MCUs per restart interval (0 disables restarts)
 */
export function decodeBaselineScanWithDRI(br, frame, scan, store, Ri) {
  const predictors = new Int32Array(frame.components.length);
  let mcusSinceRST = 0;
  let rstIndex = 0;
  const interleaved = scan.components.length > 1;
  const outerRows = interleaved
    ? frame.mcusPerColumn
    : Math.ceil(frame.components[scan.components[0].idx].blocksPerColumn / frame.components[scan.components[0].idx].v);
  const outerCols = interleaved
    ? frame.mcusPerLine
    : Math.ceil(frame.components[scan.components[0].idx].blocksPerLine / frame.components[scan.components[0].idx].h);
  for (let my = 0; my < outerRows; my++) {
    for (let mx = 0; mx < outerCols; mx++) {
      // Decode one MCU (same as in decodeBaselineScan inner body)
      for (let s = 0; s < scan.components.length; s++) {
        const sc = scan.components[s];
        const comp = frame.components[sc.idx];
        if (interleaved) {
          for (let v = 0; v < comp.v; v++) {
            for (let h = 0; h < comp.h; h++) {
              const blockRow = my * comp.v + v;
              const blockCol = mx * comp.h + h;
              const coeffs = comp.blocks[blockRow][blockCol];

              const sdc = decodeHuffmanSymbol(br, store.dc[sc.td]);
              const diff = br.receiveSigned(sdc);
              predictors[sc.idx] += diff;
              coeffs[0] = predictors[sc.idx];

              let k = 1;
              const acTab = store.ac[sc.ta];
              while (k < 64) {
                const RS = decodeHuffmanSymbol(br, acTab);
                if (RS === 0x00) break;
                if (RS === 0xf0) {
                  k += 16;
                  continue;
                }
                const r = RS >> 4;
                const sBits = RS & 0x0f;
                k += r;
                if (k >= 64) break;
                const val = br.receiveSigned(sBits);
                coeffs[zigZagToNatural[k]] = val;
                k++;
              }
            }
          }
        } else {
          // Non-interleaved single-component scan: decode one block per iteration
          const blockRow = Math.min(my, comp.blocksPerColumn - 1);
          const blockCol = Math.min(mx, comp.blocksPerLine - 1);
          const rowArr = comp.blocks[blockRow];
          if (!rowArr) break;
          const coeffs = rowArr[blockCol];
          if (!coeffs) break;

          const sdc = decodeHuffmanSymbol(br, store.dc[sc.td]);
          const diff = br.receiveSigned(sdc);
          predictors[sc.idx] += diff;
          coeffs[0] = predictors[sc.idx];

          let k = 1;
          const acTab = store.ac[sc.ta];
          while (k < 64) {
            const RS = decodeHuffmanSymbol(br, acTab);
            if (RS === 0x00) break;
            if (RS === 0xf0) {
              k += 16;
              continue;
            }
            const r = RS >> 4;
            const sBits = RS & 0x0f;
            k += r;
            if (k >= 64) break;
            const val = br.receiveSigned(sBits);
            coeffs[zigZagToNatural[k]] = val;
            k++;
          }
        }
      }

      // Handle restart interval
      if (Ri > 0) {
        mcusSinceRST++;
        if (mcusSinceRST === Ri) {
          // Expect RSTm marker; our bitreader will throw with marker error and expose marker via getMarker()
          // Consume until marker is seen
          try {
            // Attempt a benign read to trigger marker detection if pending
            br.alignToByte();
            if (!br.hasMarker()) {
              // force a read to surface marker if queued next
              br.readBit();
            }
          } catch (err) {
            if (err && err.code === "ERR_MARKER") {
              const m = br.getMarker();
              const expected = 0xffd0 + rstIndex;
              if (m !== expected) {
                // In strict mode, this would be an error; here we still accept but resync index
                rstIndex = (m - 0xffd0) & 7;
              }
              // Reset predictors and counters
              predictors.fill(0);
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
