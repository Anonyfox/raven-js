/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Huffman encoding utilities for JPEG encoder.
 */

/**
 * Build histograms for DC categories and AC run/size symbols.
 * DC symbol is the category (0..11). AC symbol is (r<<4)|s (0x00..0xF0..0xFF with EOB/ZRL).
 * @returns {{dcY: Uint32Array, acY: Uint32Array, dcC: Uint32Array, acC: Uint32Array}}
 */
export function createHistograms() {
  return {
    dcY: new Uint32Array(12),
    acY: new Uint32Array(256),
    dcC: new Uint32Array(12),
    acC: new Uint32Array(256),
  };
}

/**
 * Compute the magnitude category (number of bits) for a signed integer.
 * @param {number} v
 */
export function magnitudeCategory(v) {
  let a = v < 0 ? -v : v;
  let c = 0;
  while (a) {
    a >>= 1;
    c++;
  }
  return c;
}

/**
 * Build canonical Huffman codes from symbol frequencies with code lengths <= 16.
 * Stable: ties broken by symbol value ascending.
 * @param {Uint32Array} freq length N (N<=256)
 * @returns {{codes: Uint16Array, lengths: Uint8Array, codeLengthCounts: Uint8Array, symbols: Uint8Array}}
 */
export function buildCanonicalCodes(freq) {
  const N = freq.length;
  /** @type {{sym:number,f:number}[]} */
  const items = [];
  for (let s = 0; s < N; s++) if (freq[s] > 0) items.push({ sym: s, f: freq[s] });
  if (items.length === 0) {
    // JPEG requires at least one symbol; insert a zero symbol
    items.push({ sym: 0, f: 1 });
  }
  // Build a length-limited Huffman using a simple package-merge approximation.
  // For simplicity and determinism, we use a bounded redistribution: start from optimal lengths,
  // then rebalance if any length > 16 by moving counts upward from longer to shorter.
  // Step 1: generate a binary tree with a priority queue (two smallest merge) → code lengths.
  const queue = items.map((it) => ({ w: it.f, nodes: [it.sym] }));
  queue.sort((a, b) => a.w - b.w || a.nodes[0] - b.nodes[0]);
  /** @type {number[]} */
  const lengths = new Array(N).fill(0);
  if (queue.length === 1) {
    lengths[queue[0].nodes[0]] = 1; // single symbol gets length 1
  } else {
    while (queue.length > 1) {
      const a = queue.shift();
      const b = queue.shift();
      const merged = { w: a.w + b.w, nodes: a.nodes.concat(b.nodes) };
      for (const s of merged.nodes) lengths[s]++;
      // insert merged back keeping stable ordering
      let i = 0;
      while (
        i < queue.length &&
        (queue[i].w < merged.w || (queue[i].w === merged.w && queue[i].nodes[0] <= merged.nodes[0]))
      )
        i++;
      queue.splice(i, 0, merged);
    }
  }
  // Extract only used symbols
  const used = items.map((it) => it.sym);
  // Limit lengths to 16 by redistributing (JPEG requirement)
  const lenCounts = new Uint8Array(33);
  for (const s of used) lenCounts[lengths[s]]++;
  // Move overflow from >16 downwards
  let _overflow = 0;
  for (let L = 32; L > 16; L--) {
    _overflow += lenCounts[L];
    lenCounts[16] += lenCounts[L];
    lenCounts[L] = 0;
  }
  // If total codes at length 16 still exceed capacity, shift counts leftwards (from short to longer) deterministically
  // Canonical capacity rule: sum(lenCounts[i] << (16 - i)) <= 1<<16
  function capacityOK() {
    let sum = 0;
    for (let i = 1; i <= 16; i++) sum += lenCounts[i] << (16 - i);
    return sum <= 1 << 16;
  }
  while (!capacityOK()) {
    // Find the smallest i>=2 with lenCounts[i]>0 and move one symbol to i+1.
    let i = 2;
    while (i <= 16 && lenCounts[i] === 0) i++;
    if (i > 16) break;
    lenCounts[i]--;
    lenCounts[i + 1]++;
  }
  // Assign lengths to symbols stably by increasing length then symbol value
  used.sort((a, b) => lengths[a] - lengths[b] || a - b);
  /** @type {Uint8Array} */
  const finalLengths = new Uint8Array(N);
  // rebuild lengths to match lenCounts (truncate/expand as needed)
  let idx = 0;
  for (let L = 1; L <= 16; L++) {
    let count = lenCounts[L];
    while (count > 0 && idx < used.length) {
      finalLengths[used[idx]] = L;
      idx++;
      count--;
    }
  }
  // Build canonical codes
  const codeLengthCounts = new Uint8Array(16);
  // Symbols must be ordered by increasing code length, then by symbol value
  const symbols = [];
  for (let L = 1; L <= 16; L++) {
    for (let s = 0; s < N; s++) {
      if (finalLengths[s] === L) {
        codeLengthCounts[L - 1]++;
        symbols.push(s);
      }
    }
  }
  let code = 0;
  const nextCode = new Uint16Array(17);
  for (let i = 1; i <= 16; i++) {
    nextCode[i] = code;
    code = (code + codeLengthCounts[i - 1]) << 1;
  }
  let code2 = 0;
  const nextCode2 = new Uint16Array(17);
  for (let i = 1; i <= 16; i++) {
    nextCode2[i] = code2;
    code2 = (code2 + codeLengthCounts[i - 1]) << 1;
  }
  const codes = new Uint16Array(N);
  // Assign codes in increasing length then symbol order
  for (const s of symbols) {
    const L = finalLengths[s];
    const c = nextCode2[L]++;
    codes[s] = c;
  }
  return { codes, lengths: finalLengths, codeLengthCounts, symbols: Uint8Array.from(symbols) };
}

/**
 * Build encoder LUTs {code,len} for fast emission for a given symbol space size (e.g., 12 for DC, 256 for AC).
 * @param {Uint8Array} _codeLengthCounts
 * @param {Uint8Array} symbols
 * @returns {{ehufco: Uint16Array, ehufsi: Uint8Array}}
 */
export function buildEncodeLUT(/** @type {Uint8Array} */ _codeLengthCounts, symbols) {
  // Recompute canonical codes to map every symbol; simpler to call buildCanonicalCodes with derived lengths
  const N = Math.max(256, Math.max(...symbols) + 1);
  const freq = new Uint32Array(N);
  for (let i = 0; i < symbols.length; i++) freq[symbols[i]] = 1; // placeholder
  const { codes, lengths } = buildCanonicalCodes(freq);
  return { ehufco: codes, ehufsi: lengths };
}

/**
 * Build codes and lengths from a DHT spec (code length counts and symbols), for a given symbol space size.
 * @param {Uint8Array} codeLengthCounts length 16
 * @param {Uint8Array} symbols
 * @param {number} symbolSpaceSize
 * @returns {{ codes: Uint16Array, lengths: Uint8Array }}
 */
export function buildCodesFromSpec(codeLengthCounts, symbols, symbolSpaceSize) {
  const codes = new Uint16Array(symbolSpaceSize);
  const lengths = new Uint8Array(symbolSpaceSize);
  // Next codes per length
  const nextCode = new Uint16Array(17);
  let code = 0;
  for (let i = 1; i <= 16; i++) {
    nextCode[i] = code;
    code = (code + codeLengthCounts[i - 1]) << 1;
  }
  // Assign codes in the order of symbols, which are grouped by increasing length
  // We need to iterate lengths and pick symbols accordingly
  let idx = 0;
  for (let L = 1; L <= 16; L++) {
    const count = codeLengthCounts[L - 1];
    for (let j = 0; j < count; j++, idx++) {
      const sym = symbols[idx];
      const c = nextCode[L]++;
      codes[sym] = c;
      lengths[sym] = L;
    }
  }
  return { codes, lengths };
}

// Standard Annex K Huffman tables (BITS and VALS)
export const STD_BITS_DC_L = Uint8Array.from([0, 1, 5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0]);
export const STD_VALS_DC_L = Uint8Array.from([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
export const STD_BITS_AC_L = Uint8Array.from([0, 2, 1, 3, 3, 2, 4, 3, 5, 5, 4, 4, 0, 0, 1, 0x7d]);
export const STD_VALS_AC_L = Uint8Array.from([
  0x01, 0x02, 0x03, 0x00, 0x04, 0x11, 0x05, 0x12, 0x21, 0x31, 0x41, 0x06, 0x13, 0x51, 0x61, 0x07, 0x22, 0x71, 0x14,
  0x32, 0x81, 0x91, 0xa1, 0x08, 0x23, 0x42, 0xb1, 0xc1, 0x15, 0x52, 0xd1, 0xf0, 0x24, 0x33, 0x62, 0x72, 0x82, 0x09,
  0x0a, 0x16, 0x17, 0x18, 0x19, 0x1a, 0x25, 0x26, 0x27, 0x28, 0x29, 0x2a, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3a,
  0x43, 0x44, 0x45, 0x46, 0x47, 0x48, 0x49, 0x4a, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0x59, 0x5a, 0x63, 0x64, 0x65,
  0x66, 0x67, 0x68, 0x69, 0x6a, 0x73, 0x74, 0x75, 0x76, 0x77, 0x78, 0x79, 0x7a, 0x83, 0x84, 0x85, 0x86, 0x87, 0x88,
  0x89, 0x8a, 0x92, 0x93, 0x94, 0x95, 0x96, 0x97, 0x98, 0x99, 0x9a, 0xa2, 0xa3, 0xa4, 0xa5, 0xa6, 0xa7, 0xa8, 0xa9,
  0xaa, 0xb2, 0xb3, 0xb4, 0xb5, 0xb6, 0xb7, 0xb8, 0xb9, 0xba, 0xc2, 0xc3, 0xc4, 0xc5, 0xc6, 0xc7, 0xc8, 0xc9, 0xca,
  0xd2, 0xd3, 0xd4, 0xd5, 0xd6, 0xd7, 0xd8, 0xd9, 0xda, 0xe1, 0xe2, 0xe3, 0xe4, 0xe5, 0xe6, 0xe7, 0xe8, 0xe9, 0xea,
  0xf1, 0xf2, 0xf3, 0xf4, 0xf5, 0xf6, 0xf7, 0xf8, 0xf9, 0xfa,
]);
export const STD_BITS_DC_C = Uint8Array.from([0, 3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0]);
export const STD_VALS_DC_C = Uint8Array.from([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
export const STD_BITS_AC_C = Uint8Array.from([0, 2, 1, 2, 4, 4, 3, 4, 7, 5, 4, 4, 0, 1, 2, 0x77]);
export const STD_VALS_AC_C = Uint8Array.from([
  0x00, 0x01, 0x02, 0x03, 0x11, 0x04, 0x05, 0x21, 0x31, 0x06, 0x12, 0x41, 0x51, 0x07, 0x61, 0x71, 0x13, 0x22, 0x32,
  0x81, 0x08, 0x14, 0x42, 0x91, 0xa1, 0xb1, 0xc1, 0x09, 0x23, 0x33, 0x52, 0xf0, 0x15, 0x62, 0x72, 0xd1, 0x0a, 0x16,
  0x24, 0x34, 0xe1, 0x25, 0xf1, 0x17, 0x18, 0x19, 0x1a, 0x26, 0x27, 0x28, 0x29, 0x2a, 0x35, 0x36, 0x37, 0x38, 0x39,
  0x3a, 0x43, 0x44, 0x45, 0x46, 0x47, 0x48, 0x49, 0x4a, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0x59, 0x5a, 0x63, 0x64,
  0x65, 0x66, 0x67, 0x68, 0x69, 0x6a, 0x73, 0x74, 0x75, 0x76, 0x77, 0x78, 0x79, 0x7a, 0x82, 0x83, 0x84, 0x85, 0x86,
  0x87, 0x88, 0x89, 0x8a, 0x92, 0x93, 0x94, 0x95, 0x96, 0x97, 0x98, 0x99, 0x9a, 0xa2, 0xa3, 0xa4, 0xa5, 0xa6, 0xa7,
  0xa8, 0xa9, 0xaa, 0xb2, 0xb3, 0xb4, 0xb5, 0xb6, 0xb7, 0xb8, 0xb9, 0xba, 0xc2, 0xc3, 0xc4, 0xc5, 0xc6, 0xc7, 0xc8,
  0xc9, 0xca, 0xd2, 0xd3, 0xd4, 0xd5, 0xd6, 0xd7, 0xd8, 0xd9, 0xda, 0xe2, 0xe3, 0xe4, 0xe5, 0xe6, 0xe7, 0xe8, 0xe9,
  0xea, 0xf2, 0xf3, 0xf4, 0xf5, 0xf6, 0xf7, 0xf8, 0xf9, 0xfa,
]);
