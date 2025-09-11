/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Marker writers for JPEG encoder.
 */

/**
 * Write big-endian 16-bit into an array.
 * @param {number[]} arr
 * @param {number} v
 */
function be16(arr, v) {
  arr.push((v >>> 8) & 0xff, v & 0xff);
}

/**
 * Write SOI marker.
 * @param {number[]} out
 */
export function writeSOI(out) {
  out.push(0xff, 0xd8);
}

/**
 * Write EOI marker.
 * @param {number[]} out
 */
export function writeEOI(out) {
  out.push(0xff, 0xd9);
}

/**
 * Write JFIF APP0 segment with given density.
 * @param {number[]} out
 * @param {{ units: 0|1|2, xDensity: number, yDensity: number }} jfif
 */
export function writeAPP0_JFIF(out, jfif) {
  const { units = 1, xDensity = 72, yDensity = 72 } = jfif || {};
  out.push(0xff, 0xe0); // APP0
  const payload = [];
  // Identifier "JFIF\0"
  payload.push(0x4a, 0x46, 0x49, 0x46, 0x00);
  // Version 1.01
  payload.push(0x01, 0x01);
  payload.push(units & 0xff);
  be16(payload, Math.max(1, Math.min(0xffff, xDensity | 0)));
  be16(payload, Math.max(1, Math.min(0xffff, yDensity | 0)));
  // Thumbnail 0x0
  payload.push(0x00, 0x00);
  // Length includes the two length bytes
  be16(out, payload.length + 2);
  out.push(...payload);
}

/**
 * Write APP1 EXIF segment if provided. Accepts raw EXIF buffer that may include leading "Exif\0\0".
 * @param {number[]} out
 * @param {Uint8Array} exif
 */
export function writeAPP1_EXIF(out, exif) {
  if (!(exif instanceof Uint8Array) || exif.length === 0) return;
  out.push(0xff, 0xe1);
  const payload = [];
  // Ensure header
  const needHeader = !(
    exif[0] === 0x45 &&
    exif[1] === 0x78 &&
    exif[2] === 0x69 &&
    exif[3] === 0x66 &&
    exif[4] === 0x00 &&
    exif[5] === 0x00
  );
  if (needHeader) payload.push(0x45, 0x78, 0x69, 0x66, 0x00, 0x00);
  for (let i = 0; i < exif.length; i++) payload.push(exif[i]);
  be16(out, payload.length + 2);
  out.push(...payload);
}

/**
 * Write APP2 ICC_PROFILE segments, splitting as needed.
 * @param {number[]} out
 * @param {Uint8Array} icc
 */
export function writeAPP2_ICC(out, icc) {
  if (!(icc instanceof Uint8Array) || icc.length === 0) return;
  const chunkMax = 65519; // per spec
  const count = Math.ceil(icc.length / chunkMax);
  for (let i = 0; i < count; i++) {
    const start = i * chunkMax;
    const end = Math.min(icc.length, start + chunkMax);
    const payload = [];
    // Identifier "ICC_PROFILE\0"
    payload.push(0x49, 0x43, 0x43, 0x5f, 0x50, 0x52, 0x4f, 0x46, 0x49, 0x4c, 0x45, 0x00);
    payload.push((i + 1) & 0xff, count & 0xff);
    for (let p = start; p < end; p++) payload.push(icc[p]);
    out.push(0xff, 0xe2);
    be16(out, payload.length + 2);
    out.push(...payload);
  }
}

/**
 * Write DQT for up to 4 tables (8-bit precision) with ids 0..3, natural order 64 entries each.
 * @param {number[]} out
 * @param {{id:number, table:Int32Array}[]} tables
 */
export function writeDQT(out, tables) {
  const payload = [];
  for (const { id, table } of tables) {
    payload.push((0 << 4) | (id & 0x0f)); // Pq=0, Tq=id
    // emit in zig-zag order: we assume caller passes natural order; provide zigzag mapping here
    const zigzag = [
      0, 1, 8, 16, 9, 2, 3, 10, 17, 24, 32, 25, 18, 11, 4, 5, 12, 19, 26, 33, 40, 48, 41, 34, 27, 20, 13, 6, 7, 14, 21,
      28, 35, 42, 49, 56, 57, 50, 43, 36, 29, 22, 15, 23, 30, 37, 44, 51, 58, 59, 52, 45, 38, 31, 39, 46, 53, 60, 61,
      54, 47, 55, 62, 63,
    ];
    for (let i = 0; i < 64; i++) {
      const v = table[zigzag[i]] | 0;
      payload.push(Math.max(1, Math.min(255, v)) & 0xff);
    }
  }
  out.push(0xff, 0xdb);
  be16(out, payload.length + 2);
  out.push(...payload);
}

/**
 * Write DHT segment for provided DC/AC tables in JPEG format.
 * @param {number[]} out
 * @param {{class:0|1,id:number, codeLengthCounts:Uint8Array, symbols:Uint8Array}[]} tables
 */
export function writeDHT(out, tables) {
  for (const t of tables) {
    const payload = [];
    payload.push(((t.class & 1) << 4) | (t.id & 0x0f));
    for (let i = 0; i < 16; i++) payload.push(t.codeLengthCounts[i] | 0);
    for (let i = 0; i < t.symbols.length; i++) payload.push(t.symbols[i] | 0);
    out.push(0xff, 0xc4);
    be16(out, payload.length + 2);
    out.push(...payload);
  }
}

/**
 * Write SOF0 (baseline) frame header.
 * @param {number[]} out
 * @param {{width:number,height:number, components:{id:number,h:number,v:number,Tq:number}[]}} frame
 */
export function writeSOF0(out, frame) {
  const payload = [];
  payload.push(8); // precision
  be16(payload, frame.height);
  be16(payload, frame.width);
  payload.push(frame.components.length & 0xff);
  for (const c of frame.components) {
    payload.push(c.id & 0xff);
    payload.push(((c.h & 0x0f) << 4) | (c.v & 0x0f));
    payload.push(c.Tq & 0x0f);
  }
  out.push(0xff, 0xc0);
  be16(out, payload.length + 2);
  out.push(...payload);
}

/**
 * Write DRI segment (restart interval) if Ri>0.
 * @param {number[]} out
 * @param {number} Ri MCUs per restart interval
 */
export function writeDRI(out, Ri) {
  if (!Ri) return;
  out.push(0xff, 0xdd);
  be16(out, 4);
  be16(out, Ri & 0xffff);
}

/**
 * Write SOS segment for a baseline single-scan.
 * @param {number[]} out
 * @param {{ components:{id:number,Td:number,Ta:number}[] }} scan
 */
export function writeSOS(out, scan) {
  const payload = [];
  payload.push(scan.components.length & 0xff);
  for (const c of scan.components) {
    payload.push(c.id & 0xff);
    payload.push(((c.Td & 0x0f) << 4) | (c.Ta & 0x0f));
  }
  // Baseline params Ss=0, Se=63, AhAl=0
  payload.push(0x00, 0x3f, 0x00);
  out.push(0xff, 0xda);
  be16(out, payload.length + 2);
  out.push(...payload);
}
