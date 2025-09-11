/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file JPEG decoder orchestrator (stub).
 *
 * This is a placeholder export to satisfy wiring and allow incremental
 * development with passing type checks and tests. The real implementation
 * will follow the specification in DECODE.md.
 */

/**
 * @typedef {Object} DecodeOptions
 * @property {boolean=} tolerantDecoding
 * @property {number=} maxResolutionMP
 * @property {number=} maxMemoryMB
 * @property {boolean=} fancyUpsampling
 * @property {boolean=} colorTransform
 * @property {number=} metadataMaxMB
 * @property {number=} metadataSegmentMaxBytes
 */

import { decodeBaselineScanWithDRI } from "./baseline.js";
import { ycbcrToRgba } from "./color.js";
import { createBitReader } from "./huffman.js";
import {
  createHuffmanStore,
  parseDHTSegment,
  parseDQTSegment,
  parseDRISegment,
  parseSOFSegment,
  parseSOSSegment,
} from "./parse.js";
import { reconstructComponentPlane } from "./planes.js";
import { decodeProgressiveScanWithDRI } from "./progressive.js";
import { upsampleLinear, upsampleNearest } from "./upsample.js";

/**
 * Baseline JPEG decoder orchestrator (SOF0/DHT/DQT/SOS/DRI).
 * Progressive and advanced color transforms are out-of-scope here.
 *
 * @param {Uint8Array|ArrayBuffer} buffer
 * @param {DecodeOptions=} opts
 */
export async function decodeJPEG(buffer, opts) {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const options = opts || {};
  let offset = 0;

  // Helpers
  /** @returns {number} */
  const readU16 = () => {
    const v = (bytes[offset] << 8) | bytes[offset + 1];
    offset += 2;
    return v;
  };
  /** @param {number} code */
  function expectMarker(code) {
    if (bytes[offset++] !== 0xff || bytes[offset++] !== code)
      throw new Error(`ERR_MARKER: expected 0xFF${code.toString(16)} at ${offset - 2}`);
  }
  /** @returns {{ start: number, len: number }} */
  const readSegment = () => {
    const L = readU16();
    if (L < 2) throw new Error("ERR_SEGMENT_LENGTH");
    const len = L - 2;
    const start = offset;
    offset += len;
    if (offset > bytes.length) throw new Error("ERR_SEGMENT_OVERFLOW");
    return { start, len };
  };

  // Metadata
  /** @type {{ jfif?: any, adobe?: any, exif?: Uint8Array, icc?: Uint8Array, warnings?: string[] }} */
  const metadata = {};
  const warnings = [];
  const metaTotalCap = Math.floor((options.metadataMaxMB ?? 32) * 1024 * 1024);
  const metaSegCap = Math.floor(options.metadataSegmentMaxBytes ?? 10 * 1024 * 1024);
  let metaTotal = 0;
  // ICC assembly state
  /** @type {Map<number, Uint8Array>} */
  const iccChunks = new Map();
  let iccExpected = 0;

  // Tables and frame
  let huff = createHuffmanStore();
  /** @type {import('./parse.js').Frame|null} */
  let frame = null;
  /** @type {(Int32Array|null)[]} */
  const qtables = [null, null, null, null];
  let Ri = 0;
  /** @type {Int32Array|null} */
  let progPredictors = null;

  // SOI
  expectMarker(0xd8);

  /** @type {number|null} */
  let pendingMarker = null;
  parseLoop: while (offset < bytes.length) {
    // If a marker is pending from a scan, it has already consumed 0xFFxx
    let marker;
    if (pendingMarker !== null) {
      marker = pendingMarker & 0xff;
      pendingMarker = null;
    } else {
      // find next marker (skip fill 0xFF)
      if (bytes[offset++] !== 0xff) continue; // tolerate stray bytes
      let m = bytes[offset++];
      if (m === undefined) throw new Error("ERR_MARKER: unexpected end of data while reading marker");
      while (m === 0xff) m = bytes[offset++];
      marker = m;
    }

    switch (marker) {
      case 0xd9: // EOI
        break parseLoop;
      case 0xe0: {
        // APP0 JFIF
        const { start, len } = readSegment();
        // Minimal JFIF parse
        if (
          len >= 7 &&
          bytes[start] === 0x4a &&
          bytes[start + 1] === 0x46 &&
          bytes[start + 2] === 0x49 &&
          bytes[start + 3] === 0x46 &&
          bytes[start + 4] === 0x00
        ) {
          const units = bytes[start + 7];
          const xDensity = (bytes[start + 8] << 8) | bytes[start + 9];
          const yDensity = (bytes[start + 10] << 8) | bytes[start + 11];
          metadata.jfif = { units, xDensity, yDensity };
        }
        break;
      }
      case 0xe1: {
        // APP1 (EXIF/XMP)
        const { start, len } = readSegment();
        if (
          len >= 6 &&
          bytes[start] === 0x45 &&
          bytes[start + 1] === 0x78 &&
          bytes[start + 2] === 0x69 &&
          bytes[start + 3] === 0x66 &&
          bytes[start + 4] === 0x00 &&
          bytes[start + 5] === 0x00
        ) {
          if (len <= metaSegCap && metaTotal + len <= metaTotalCap) {
            metadata.exif = bytes.subarray(start, start + len);
            metaTotal += len;
          } else {
            warnings.push("EXIF skipped due to metadata caps");
          }
        }
        break;
      }
      case 0xee: {
        // APP14 Adobe
        const { start, len } = readSegment();
        if (
          len >= 12 &&
          bytes[start] === 0x41 &&
          bytes[start + 1] === 0x64 &&
          bytes[start + 2] === 0x6f &&
          bytes[start + 3] === 0x62 &&
          bytes[start + 4] === 0x65 &&
          bytes[start + 5] === 0x00
        ) {
          const transform = bytes[start + 11];
          metadata.adobe = { transform };
        }
        break;
      }
      case 0xe2: {
        // APP2 ICC profile
        const { start, len } = readSegment();
        const hdr = [0x49, 0x43, 0x43, 0x5f, 0x50, 0x52, 0x4f, 0x46, 0x49, 0x4c, 0x45, 0x00];
        let ok = true;
        for (let i = 0; i < hdr.length && i < len; i++) {
          if (bytes[start + i] !== hdr[i]) {
            ok = false;
            break;
          }
        }
        if (ok && len >= hdr.length + 2) {
          const seqNo = bytes[start + hdr.length];
          const count = bytes[start + hdr.length + 1];
          const payloadStart = start + hdr.length + 2;
          const payloadLen = len - (hdr.length + 2);
          if (payloadLen <= metaSegCap && metaTotal + payloadLen <= metaTotalCap) {
            iccChunks.set(seqNo, bytes.subarray(payloadStart, payloadStart + payloadLen));
            iccExpected = count;
            metaTotal += payloadLen;
            if (iccChunks.size === iccExpected) {
              // assemble
              let total = 0;
              for (let i = 1; i <= iccExpected; i++) total += iccChunks.get(i)?.length ?? 0;
              const icc = new Uint8Array(total);
              let o = 0;
              for (let i = 1; i <= iccExpected; i++) {
                const chunk = iccChunks.get(i) ?? new Uint8Array();
                icc.set(chunk, o);
                o += chunk.length;
              }
              metadata.icc = icc;
            }
          } else {
            warnings.push("ICC chunk skipped due to metadata caps");
          }
        }
        break;
      }
      case 0xdb: {
        // DQT
        const { start, len } = readSegment();
        parseDQTSegment(bytes, start, len, qtables);
        break;
      }
      case 0xc4: {
        // DHT
        const { start, len } = readSegment();
        huff = huff || createHuffmanStore();
        parseDHTSegment(bytes, start, len, huff, 9);
        break;
      }
      case 0xdd: {
        // DRI
        const { start, len } = readSegment();
        const res = parseDRISegment(bytes, start, len);
        Ri = res.Ri;
        break;
      }
      case 0xc0: // SOF0
      case 0xc2: {
        // SOF2 (not yet supported in decode loop)
        const { start, len } = readSegment();
        /** @type {import('./parse.js').Frame} */
        const fr = parseSOFSegment(bytes, start, len, marker === 0xc2, qtables);
        frame = fr;
        if (frame.progressive) progPredictors = new Int32Array(frame.components.length);
        // Basic resource guard
        const maxMP = options.maxResolutionMP || 100;
        if (frame.width * frame.height > maxMP * 1e6) throw new Error("ERR_LIMITS_RESOLUTION");
        // Memory budget estimate: RGBA + coefficients
        const maxMB = options.maxMemoryMB ?? 512;
        let coeffBytes = 0;
        for (const c of frame.components) coeffBytes += c.blocksPerLine * c.blocksPerColumn * 64 * 2; // Int16
        const rgbaBytes = frame.width * frame.height * 4;
        const estimate = coeffBytes + rgbaBytes + 1_000_000; // overhead cushion
        if (estimate > maxMB * 1024 * 1024) throw new Error("ERR_LIMITS_MEMORY");
        break;
      }
      case 0xda: {
        // SOS
        if (!frame) throw new Error("ERR_SOS_NO_FRAME");
        const { start, len } = readSegment();
        const scanDesc = parseSOSSegment(bytes, start, len, frame);
        // Non-interleaved scan adjustment: set outer loop bounds to component-local blocks if single component
        if (!frame.progressive && scanDesc.components.length === 1) {
          const ci = scanDesc.components[0].idx;
          const comp = frame.components[ci];
          // Override mcusPerLine/Column temporarily by reflecting component block grid
          // Note: baseline decoder uses these to iterate MCU raster; for single-component scans,
          // the MCU raster equals the component block grid.
          frame = { ...frame, mcusPerLine: comp.blocksPerLine, mcusPerColumn: comp.blocksPerColumn };
        }
        // Entropy-coded data follows until marker; use bitreader on subarray
        const sub = bytes.subarray(offset);
        const br = createBitReader(sub);
        // Decode scan
        if (frame.progressive) {
          if (!progPredictors) progPredictors = new Int32Array(frame.components.length);
          decodeProgressiveScanWithDRI(br, frame, scanDesc, huff, Ri | 0, progPredictors);
        } else {
          decodeBaselineScanWithDRI(br, frame, scanDesc, huff, Ri | 0);
        }
        // After scan, a marker should be pending; get it and update absolute offset
        const m = br.hasMarker() ? br.getMarker() : null;
        offset += br.offset; // advance by bytes consumed in subarray
        if (m !== null) {
          pendingMarker = m;
        }
        break;
      }
      default: {
        // Other APP/COM or unsupported: skip segment if it has length
        if (marker >= 0xe0 && marker <= 0xef) {
          const seg = readSegment();
          void seg;
          break;
        }
        if (marker === 0xfe) {
          // COM
          const seg = readSegment();
          void seg;
          break;
        }
        // Unsupported marker
        if (typeof marker !== "number") throw new Error("ERR_MARKER: invalid marker");
        throw new Error(`ERR_UNSUPPORTED_MARKER: 0xFF${marker.toString(16)}`);
      }
    }
  }

  if (!frame) throw new Error("ERR_NO_FRAME");

  // Reconstruct planes
  const planes = new Array(frame.components.length);
  for (let i = 0; i < frame.components.length; i++) {
    planes[i] = reconstructComponentPlane(frame, i);
  }

  // Upsample chroma to luma resolution when needed
  let Y, Cb, Cr;
  if (frame.components.length === 1) {
    // Grayscale: replicate Y directly to RGB without YCbCr math
    const width = frame.width;
    const height = frame.height;
    const Yp = planes[0].plane;
    const pixels = new Uint8Array(width * height * 4);
    let pi = 0;
    for (let i = 0; i < Yp.length; i++) {
      const y = Yp[i];
      pixels[pi++] = y;
      pixels[pi++] = y;
      pixels[pi++] = y;
      pixels[pi++] = 255;
    }
    return { pixels, width, height, metadata };
  } else if (frame.components.length === 3) {
    const y = planes[0];
    let cb = planes[1];
    let cr = planes[2];
    const HsCb = frame.Hmax / frame.components[1].h;
    const VsCb = frame.Vmax / frame.components[1].v;
    const HsCr = frame.Hmax / frame.components[2].h;
    const VsCr = frame.Vmax / frame.components[2].v;
    const useLinear = !!options.fancyUpsampling;
    if (HsCb !== 1 || VsCb !== 1) {
      cb = useLinear
        ? upsampleLinear(cb.plane, cb.width, cb.height, HsCb, VsCb)
        : upsampleNearest(cb.plane, cb.width, cb.height, HsCb, VsCb);
    }
    if (HsCr !== 1 || VsCr !== 1) {
      cr = useLinear
        ? upsampleLinear(cr.plane, cr.width, cr.height, HsCr, VsCr)
        : upsampleNearest(cr.plane, cr.width, cr.height, HsCr, VsCr);
    }
    Y = y.plane;
    Cb = cb.data || cb.plane;
    Cr = cr.data || cr.plane;
  } else {
    throw new Error("ERR_COLORSPACE_UNSUPPORTED");
  }

  const width = frame.width;
  const height = frame.height;

  // Color transform policy: Adobe APP14 transform=0 means RGB, =1 YCbCr, =2 YCCK (unsupported here)
  let pixels;
  if (frame.components.length === 3 && metadata.adobe && metadata.adobe.transform === 0) {
    // Direct RGB copy
    const R = planes[0].plane;
    const G = planes[1].data || planes[1].plane;
    const B = planes[2].data || planes[2].plane;
    pixels = new Uint8Array(width * height * 4);
    let oi = 0;
    for (let i = 0; i < width * height; i++) {
      pixels[oi++] = R[i];
      pixels[oi++] = G[i];
      pixels[oi++] = B[i];
      pixels[oi++] = 255;
    }
  } else {
    pixels = ycbcrToRgba(Y, Cb, Cr, width, height);
  }
  if (warnings.length) metadata.warnings = warnings;
  return { pixels, width, height, metadata };
}
