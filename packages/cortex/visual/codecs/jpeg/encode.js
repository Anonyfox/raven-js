/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Baseline JPEG encoder orchestrator per ENCODE.md (no progressive yet).
 */

import { createBitWriter } from "./bitwriter.js";
import { rgbaToYCbCr } from "./color.js";
import { fdctFloat64, quantizeCoefficients } from "./fdct.js";
import {
  buildCanonicalCodes,
  buildCodesFromSpec,
  createHistograms,
  magnitudeCategory,
  STD_BITS_AC_C,
  STD_BITS_AC_L,
  STD_BITS_DC_C,
  STD_BITS_DC_L,
  STD_VALS_AC_C,
  STD_VALS_AC_L,
  STD_VALS_DC_C,
  STD_VALS_DC_L,
} from "./huffman-encode.js";
import {
  writeAPP0_JFIF,
  writeAPP1_EXIF,
  writeAPP2_ICC,
  writeDHT,
  writeDQT,
  writeDRI,
  writeSOF0,
  writeSOI,
  writeSOS,
} from "./markers.js";
import { buildQuantTables } from "./quant.js";
import { downsampleBox, gatherBlockCentered } from "./tiling.js";
import { zigZagToNatural } from "./zigzag.js";

/**
 * Encode RGBA to Baseline JPEG (single scan, standard Huffman tables derived from Annex K frequencies approximation).
 * Deterministic and pure. Progressive, DRI, metadata beyond JFIF will be added later steps.
 *
 * @param {Uint8Array} rgba
 * @param {number} width
 * @param {number} height
 * @param {{ quality?: number, subsampling?: '444'|'422'|'420'|'gray', jfif?: { units?:0|1|2, xDensity?:number, yDensity?:number }, exif?: Uint8Array, icc?: Uint8Array, progressive?: boolean, restartIntervalMCU?: number }} [opts]
 * @returns {Uint8Array}
 */
export function encodeJPEG(rgba, width, height, opts = {}) {
  if (!(rgba instanceof Uint8Array)) throw new Error("ERR_INPUT_TYPE");
  if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0)
    throw new Error("ERR_DIMENSIONS");
  if (rgba.length !== width * height * 4) throw new Error("ERR_INPUT_SIZE");

  const quality = opts.quality == null ? 75 : opts.quality;
  const subsampling = opts.subsampling || "420";

  // 1) Color transform
  const { Y, Cb, Cr } = rgbaToYCbCr(rgba, width, height);

  // 2) Subsampling
  let Yp = Y,
    Cbp = Cb,
    Crp = Cr;
  let hY = width,
    vY = height,
    hC = width,
    vC = height;
  let h = 1,
    v = 1,
    hCsf = 1,
    vCsf = 1;
  if (subsampling === "420") {
    const cw = Math.max(1, Math.floor((width + 1) / 2));
    const ch = Math.max(1, Math.floor((height + 1) / 2));
    Cbp = downsampleBox(Cb, width, height, cw, ch);
    Crp = downsampleBox(Cr, width, height, cw, ch);
    hY = width;
    vY = height;
    hC = cw;
    vC = ch;
    h = 2;
    v = 2;
    hCsf = 1;
    vCsf = 1;
  } else if (subsampling === "422") {
    const cw = Math.max(1, Math.floor((width + 1) / 2));
    Cbp = downsampleBox(Cb, width, height, cw, height);
    Crp = downsampleBox(Cr, width, height, cw, height);
    hY = width;
    vY = height;
    hC = cw;
    vC = height;
    h = 2;
    v = 1;
    hCsf = 1;
    vCsf = 1;
  } else if (subsampling === "444") {
    hY = width;
    vY = height;
    hC = width;
    vC = height;
    h = 1;
    v = 1;
    hCsf = 1;
    vCsf = 1;
  } else if (subsampling === "gray") {
    // We'll encode single-component; done later
  } else {
    throw new Error("ERR_SUBSAMPLING");
  }

  // 3) Quant tables
  const { qY, qC } = buildQuantTables(quality);

  // 4) Geometry
  const Hmax = subsampling === "420" ? 2 : subsampling === "422" ? 2 : 1;
  const Vmax = subsampling === "420" ? 2 : 1;
  const mcusPerLine = Math.ceil(width / (8 * Hmax));
  const mcusPerColumn = Math.ceil(height / (8 * Vmax));

  // 5) Histograms (build on the fly during a dry run) using standard tables strategy
  const hist = createHistograms();

  // 6) Dry run FDCT+quant to build histograms
  const blockCentered = new Int16Array(64);
  const coeffF = new Float64Array(64);
  const qBlockY = new Int16Array(64);
  const qBlockC = new Int16Array(64);
  // Per-component DC predictors
  let prevDCY = 0,
    prevDCCb = 0,
    prevDCCr = 0;

  for (let my = 0; my < mcusPerColumn; my++) {
    for (let mx = 0; mx < mcusPerLine; mx++) {
      // Y blocks: h×v
      for (let vy = 0; vy < (Hmax === 2 ? v : 1); vy++) {
        for (let vx = 0; vx < (Hmax === 2 ? h : 1); vx++) {
          const baseX = (mx * Hmax + vx) * 8;
          const baseY = (my * Vmax + vy) * 8;
          gatherBlockCentered(Yp, hY, vY, baseX, baseY, blockCentered);
          fdctFloat64(blockCentered, coeffF);
          quantizeCoefficients(coeffF, qY, qBlockY);
          // DC
          const dc = qBlockY[0];
          const diff = dc - prevDCY;
          prevDCY = dc;
          const cat = magnitudeCategory(diff);
          hist.dcY[cat]++;
          // AC
          let run = 0;
          for (let k = 1; k < 64; k++) {
            const val = qBlockY[zigZagToNatural[k]] | 0;
            if (val === 0) {
              run++;
              if (run === 16) {
                hist.acY[0xf0]++;
                run = 0;
              }
            } else {
              while (run >= 16) {
                hist.acY[0xf0]++;
                run -= 16;
              }
              const s = magnitudeCategory(val);
              hist.acY[(run << 4) | s]++;
              run = 0;
            }
          }
          if (run > 0) hist.acY[0x00]++;
        }
      }
      // Cb, Cr one block each for 4:2:0 or 4:2:2; for 4:4:4 matches Y blocks per MCU
      const cx = mx * 8;
      const cy = my * 8;
      // Cb
      gatherBlockCentered(Cbp, hC, vC, cx, cy, blockCentered);
      fdctFloat64(blockCentered, coeffF);
      quantizeCoefficients(coeffF, qC, qBlockC);
      let dc = qBlockC[0];
      let diff = dc - prevDCCb;
      prevDCCb = dc;
      let cat = magnitudeCategory(diff);
      hist.dcC[cat]++;
      let run = 0;
      for (let k = 1; k < 64; k++) {
        const val = qBlockC[zigZagToNatural[k]] | 0;
        if (val === 0) {
          run++;
          if (run === 16) {
            hist.acC[0xf0]++;
            run = 0;
          }
        } else {
          while (run >= 16) {
            hist.acC[0xf0]++;
            run -= 16;
          }
          const s = magnitudeCategory(val);
          hist.acC[(run << 4) | s]++;
          run = 0;
        }
      }
      if (run > 0) hist.acC[0x00]++;
      // Cr
      gatherBlockCentered(Crp, hC, vC, cx, cy, blockCentered);
      fdctFloat64(blockCentered, coeffF);
      quantizeCoefficients(coeffF, qC, qBlockC);
      dc = qBlockC[0];
      diff = dc - prevDCCr;
      prevDCCr = dc;
      cat = magnitudeCategory(diff);
      hist.dcC[cat]++;
      run = 0;
      for (let k = 1; k < 64; k++) {
        const val = qBlockC[zigZagToNatural[k]] | 0;
        if (val === 0) {
          run++;
          if (run === 16) {
            hist.acC[0xf0]++;
            run = 0;
          }
        } else {
          while (run >= 16) {
            hist.acC[0xf0]++;
            run -= 16;
          }
          const s = magnitudeCategory(val);
          hist.acC[(run << 4) | s]++;
          run = 0;
        }
      }
      if (run > 0) hist.acC[0x00]++;
    }
  }

  // 7) Build canonical Huffman tables
  // Use optimized tables if histograms are meaningful; otherwise fall back to standard tables to guarantee 16-bit limit
  const useStd = true;
  const dcYTab = useStd ? { codeLengthCounts: STD_BITS_DC_L, symbols: STD_VALS_DC_L } : buildCanonicalCodes(hist.dcY);
  const acYTab = useStd ? { codeLengthCounts: STD_BITS_AC_L, symbols: STD_VALS_AC_L } : buildCanonicalCodes(hist.acY);
  const dcCTab = useStd ? { codeLengthCounts: STD_BITS_DC_C, symbols: STD_VALS_DC_C } : buildCanonicalCodes(hist.dcC);
  const acCTab = useStd ? { codeLengthCounts: STD_BITS_AC_C, symbols: STD_VALS_AC_C } : buildCanonicalCodes(hist.acC);

  // Build direct LUTs for symbol->(code,len)
  /** @param {Uint8Array} cl @param {Uint8Array} sym */
  function fixSymbols(cl, sym) {
    let sum = 0;
    for (let i = 0; i < 16; i++) sum += cl[i];
    if (sym.length === sum) return sym;
    if (sym.length > sum) return sym.slice(0, sum);
    const ns = new Uint8Array(sum);
    ns.set(sym.subarray(0, sym.length));
    return ns;
  }
  const dcYcl = dcYTab.codeLengthCounts,
    dcYsym = fixSymbols(dcYTab.codeLengthCounts, dcYTab.symbols);
  const acYcl = acYTab.codeLengthCounts,
    acYsym = fixSymbols(acYTab.codeLengthCounts, acYTab.symbols);
  const dcCcl = dcCTab.codeLengthCounts,
    dcCsym = fixSymbols(dcCTab.codeLengthCounts, dcCTab.symbols);
  const acCcl = acCTab.codeLengthCounts,
    acCsym = fixSymbols(acCTab.codeLengthCounts, acCTab.symbols);
  const { codes: dcYcodes, lengths: dcYlen } = buildCodesFromSpec(dcYcl, dcYsym, 16);
  const { codes: acYcodes, lengths: acYlen } = buildCodesFromSpec(acYcl, acYsym, 256);
  const { codes: dcCcodes, lengths: dcClen } = buildCodesFromSpec(dcCcl, dcCsym, 16);
  const { codes: acCcodes, lengths: acClen } = buildCodesFromSpec(acCcl, acCsym, 256);

  // 8) Write headers
  /** @type {number[]} */
  const header = [];
  writeSOI(header);
  writeAPP0_JFIF(
    header,
    opts.jfif
      ? { units: opts.jfif.units ?? 1, xDensity: opts.jfif.xDensity ?? 72, yDensity: opts.jfif.yDensity ?? 72 }
      : { units: 1, xDensity: 72, yDensity: 72 }
  );
  if (opts.exif) writeAPP1_EXIF(header, opts.exif);
  if (opts.icc) writeAPP2_ICC(header, opts.icc);
  writeDQT(header, [
    { id: 0, table: qY },
    { id: 1, table: qC },
  ]);
  if (opts.progressive) {
    // For now, fall back to baseline SOF0; progressive scans would require SOF2.
    // We'll keep progressive option accepted but use baseline header to ensure decode.
  }
  writeSOF0(header, {
    width,
    height,
    components: [
      { id: 1, h: Hmax, v: Vmax, Tq: 0 },
      { id: 2, h: hCsf, v: vCsf, Tq: 1 },
      { id: 3, h: hCsf, v: vCsf, Tq: 1 },
    ],
  });
  // DHT
  const dhtTables = [
    { class: /** @type {0} */ (0), id: 0, codeLengthCounts: dcYcl, symbols: dcYsym },
    { class: /** @type {1} */ (1), id: 0, codeLengthCounts: acYcl, symbols: acYsym },
    { class: /** @type {0} */ (0), id: 1, codeLengthCounts: dcCcl, symbols: dcCsym },
    { class: /** @type {1} */ (1), id: 1, codeLengthCounts: acCcl, symbols: acCsym },
  ];
  writeDHT(header, dhtTables);
  // SOS
  // Restart interval optional
  const Ri = (opts.restartIntervalMCU | 0) > 0 ? opts.restartIntervalMCU | 0 : 0;
  if (Ri) writeDRI(header, Ri);
  writeSOS(header, {
    components: [
      { id: 1, Td: 0, Ta: 0 },
      { id: 2, Td: 1, Ta: 1 },
      { id: 3, Td: 1, Ta: 1 },
    ],
  });

  // 9) Entropy coding
  const bw = createBitWriter();
  // Reset predictors
  prevDCY = 0;
  prevDCCb = 0;
  prevDCCr = 0;
  let mcusSinceRST = 0;
  let rstIndex = 0;
  for (let my = 0; my < mcusPerColumn; my++) {
    for (let mx = 0; mx < mcusPerLine; mx++) {
      // Y blocks
      for (let vy = 0; vy < (Hmax === 2 ? v : 1); vy++) {
        for (let vx = 0; vx < (Hmax === 2 ? h : 1); vx++) {
          const baseX = (mx * Hmax + vx) * 8;
          const baseY = (my * Vmax + vy) * 8;
          gatherBlockCentered(Yp, hY, vY, baseX, baseY, blockCentered);
          fdctFloat64(blockCentered, coeffF);
          quantizeCoefficients(coeffF, qY, qBlockY);
          emitBlock(bw, qBlockY, prevDCY, dcYcodes, dcYlen, acYcodes, acYlen);
          prevDCY = qBlockY[0];
        }
      }
      // Cb
      const cx = mx * 8;
      const cy = my * 8;
      gatherBlockCentered(Cbp, hC, vC, cx, cy, blockCentered);
      fdctFloat64(blockCentered, coeffF);
      quantizeCoefficients(coeffF, qC, qBlockC);
      emitBlock(bw, qBlockC, prevDCCb, dcCcodes, dcClen, acCcodes, acClen);
      prevDCCb = qBlockC[0];
      // Cr
      gatherBlockCentered(Crp, hC, vC, cx, cy, blockCentered);
      fdctFloat64(blockCentered, coeffF);
      quantizeCoefficients(coeffF, qC, qBlockC);
      emitBlock(bw, qBlockC, prevDCCr, dcCcodes, dcClen, acCcodes, acClen);
      prevDCCr = qBlockC[0];

      // Insert restart marker when configured
      if (Ri) {
        mcusSinceRST++;
        if (mcusSinceRST === Ri) {
          bw.align();
          // write marker into entropy-coded segment
          const rstMarker = 0xd0 + rstIndex;
          bw.writeMarker(rstMarker);
          rstIndex = (rstIndex + 1) & 7;
          mcusSinceRST = 0;
          prevDCY = 0;
          prevDCCb = 0;
          prevDCCr = 0;
        }
      }
    }
  }
  bw.align();

  // 10) Assemble final by concatenating header bytes, entropy bytes, and EOI
  const entropy = bw.toUint8Array();
  const out = new Uint8Array(header.length + entropy.length + 2);
  out.set(Uint8Array.from(header), 0);
  out.set(entropy, header.length);
  // EOI
  out[header.length + entropy.length] = 0xff;
  out[header.length + entropy.length + 1] = 0xd9;
  return out;
}

/**
 * Emit one block (natural order Int16[64]) using provided DC/AC tables.
 * @param {any} bw
 * @param {Int16Array} block
 * @param {number} prevDC
 * @param {Uint16Array} dcCodes
 * @param {Uint8Array} dcLens
 * @param {Uint16Array} acCodes
 * @param {Uint8Array} acLens
 */
function emitBlock(bw, block, prevDC, dcCodes, dcLens, acCodes, acLens) {
  // DC
  const dc = block[0] | 0;
  const diff = dc - (prevDC | 0);
  const cat = magnitudeCategory(diff);
  writeHuff(bw, dcCodes[cat], dcLens[cat]);
  if (cat > 0) writeMagnitudeBits(bw, diff, cat);
  // AC RLE in zig-zag order starting at k=1
  let run = 0;
  for (let k = 1; k < 64; k++) {
    const val = block[zigZagToNatural[k]] | 0;
    if (val === 0) {
      run++;
      if (run === 16) {
        writeHuff(bw, acCodes[0xf0], acLens[0xf0]);
        run = 0;
      }
    } else {
      while (run >= 16) {
        writeHuff(bw, acCodes[0xf0], acLens[0xf0]);
        run -= 16;
      }
      const s = magnitudeCategory(val);
      const rs = (run << 4) | s;
      writeHuff(bw, acCodes[rs], acLens[rs]);
      writeMagnitudeBits(bw, val, s);
      run = 0;
    }
  }
  if (run > 0) writeHuff(bw, acCodes[0x00], acLens[0x00]); // EOB
}

/**
 * @param {any} bw
 * @param {number} code
 * @param {number} len
 */
function writeHuff(bw, code, len) {
  bw.writeBits(code, len);
}

/**
 * @param {any} bw
 * @param {number} value
 * @param {number} s
 */
function writeMagnitudeBits(bw, value, s) {
  if (value >= 0) {
    bw.writeBits(value, s);
  } else {
    // two's complement style for JPEG magnitude bits
    const mask = (1 << s) - 1;
    bw.writeBits((value - 1) & mask, s);
  }
}
