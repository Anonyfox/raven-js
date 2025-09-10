/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file JPEG progressive DCT scan processing.
 *
 * Handles progressive JPEG scans with DC refinement, AC successive approximation,
 * and EOB run management. Maintains coefficient state across multiple scans.
 */

import { BitReader, HuffmanTable } from "./huffman.js";

/**
 * Progressive scan state machine states
 */
export const PROGRESSIVE_STATES = {
  INITIAL: 0,
  RUN: 1,
  SET: 2,
  EOB: 3,
};

/**
 * Progressive AC decoder state
 */
export class ProgressiveACState {
  constructor() {
    this.eobrun = 0; // End-of-band run counter
    this.state = PROGRESSIVE_STATES.INITIAL;
    this.runLength = 0;
    this.refinementBit = 0;
  }

  /**
   * Reset state at restart markers
   */
  reset() {
    this.eobrun = 0;
    this.state = PROGRESSIVE_STATES.INITIAL;
    this.runLength = 0;
  }
}

/**
 * Decode progressive DC scan (Ss=0, Se=0).
 *
 * @param {BitReader} bitReader - Bit reader
 * @param {HuffmanTable} dcTable - DC Huffman table
 * @param {Int16Array} block - 64-element coefficient block
 * @param {number} predictor - Current DC predictor
 * @param {number} al - Successive approximation low bit position
 * @returns {number} Updated predictor
 */
export function decodeProgressiveDC(bitReader, dcTable, block, predictor, al) {
  if (al === 0) {
    // First pass: decode full DC coefficient
    const symbol = dcTable.decodeSymbol(bitReader);
    if (symbol === 0) {
      block[0] = predictor;
      return predictor;
    }

    const diff = bitReader.receiveSigned(symbol) << al;
    const coeff = predictor + diff;
    block[0] = coeff;
    return coeff;
  } else {
    // Refinement pass: add next bit
    const bit = bitReader.readBit();
    const refinement = bit << al;
    const coeff = block[0] + refinement;
    block[0] = coeff;
    return predictor; // Predictor unchanged in refinement
  }
}

/**
 * Decode progressive AC scan (Ss>0).
 *
 * @param {BitReader} bitReader - Bit reader
 * @param {HuffmanTable} acTable - AC Huffman table
 * @param {Int16Array} block - 64-element coefficient block
 * @param {number} ss - Spectral start (0-63)
 * @param {number} se - Spectral end (0-63)
 * @param {number} al - Successive approximation low bit position
 * @param {ProgressiveACState} state - Progressive AC state
 */
export function decodeProgressiveAC(bitReader, acTable, block, ss, se, al, state) {
  let k = ss;

  if (al === 0) {
    // First pass AC decoding
    while (k <= se) {
      if (state.eobrun > 0) {
        // Still in EOB run
        state.eobrun--;
        k++;
        continue;
      }

      const rs = acTable.decodeSymbol(bitReader);
      const r = rs >>> 4;
      const s = rs & 15;

      if (s === 0) {
        if (r < 15) {
          // EOB run
          state.eobrun = bitReader.receive(r) + (1 << r) - 1;
          break;
        } else {
          // ZRL (16 zeros)
          k += 16;
          continue;
        }
      }

      // Skip r zeros
      k += r;

      if (k > se) break;

      // Decode coefficient
      const coeff = bitReader.receiveSigned(s) << al;
      block[k] = coeff;
      k++;
    }
  } else {
    // Refinement pass AC decoding
    while (k <= se) {
      switch (state.state) {
        case PROGRESSIVE_STATES.INITIAL:
          if (block[k] !== 0) {
            // Refine existing non-zero coefficient
            const bit = bitReader.readBit();
            const sign = block[k] > 0 ? 1 : -1;
            block[k] += sign * (bit << al);
          } else {
            // Check for new non-zero coefficient
            const rs = acTable.decodeSymbol(bitReader);
            const r = rs >>> 4;
            const s = rs & 15;

            if (s === 0) {
              if (r < 15) {
                // EOB run
                state.eobrun = bitReader.receive(r) + (1 << r) - 1;
                state.state = PROGRESSIVE_STATES.EOB;
                return;
              } else {
                // ZRL
                state.runLength = 16;
                state.state = PROGRESSIVE_STATES.RUN;
              }
            } else {
              // New non-zero coefficient
              state.runLength = r;
              state.refinementBit = bitReader.readBit();
              state.state = PROGRESSIVE_STATES.SET;
            }
          }
          break;

        case PROGRESSIVE_STATES.RUN:
          if (block[k] !== 0) {
            // Refine existing coefficient
            const bit = bitReader.readBit();
            const sign = block[k] > 0 ? 1 : -1;
            block[k] += sign * (bit << al);
          } else {
            // Still in run of zeros
            state.runLength--;
            if (state.runLength === 0) {
              state.state = PROGRESSIVE_STATES.INITIAL;
            }
          }
          break;

        case PROGRESSIVE_STATES.SET: {
          // Set new non-zero coefficient
          const sign = state.refinementBit ? 1 : -1;
          block[k] = sign * (1 << al);

          state.runLength--;
          if (state.runLength === 0) {
            state.state = PROGRESSIVE_STATES.INITIAL;
          } else {
            state.state = PROGRESSIVE_STATES.RUN;
          }
          break;
        }

        case PROGRESSIVE_STATES.EOB:
          // In EOB run
          state.eobrun--;
          if (state.eobrun === 0) {
            state.state = PROGRESSIVE_STATES.INITIAL;
            return; // End of band
          }
          break;
      }

      k++;
    }
  }
}

/**
 * Validate progressive scan parameters.
 *
 * @param {number} ss - Spectral start
 * @param {number} se - Spectral end
 * @param {number} ah - Successive approximation high
 * @param {number} al - Successive approximation low
 * @returns {boolean} True if valid
 */
export function validateProgressiveScan(ss, se, ah, al) {
  // Basic range checks
  if (ss < 0 || ss > 63 || se < 0 || se > 63 || ss > se) {
    return false;
  }

  // Successive approximation constraints
  if (ah < 0 || ah > 13 || al < 0 || al > 13 || ah > al) {
    return false;
  }

  // DC scan (Ss=0, Se=0)
  if (ss === 0 && se === 0) {
    return ah === 0 || (ah > 0 && al >= ah - 1);
  }

  // AC scan (Ss>0)
  if (ss > 0) {
    if (ah === 0) {
      // First AC pass
      return al >= 0;
    } else {
      // AC refinement
      return al >= ah;
    }
  }

  return true;
}

/**
 * Check if scan is DC refinement (Ss=0, Se=0, Ah>0).
 *
 * @param {number} ss - Spectral start
 * @param {number} se - Spectral end
 * @param {number} ah - Successive approximation high
 * @returns {boolean} True if DC refinement
 */
export function isDCRefinement(ss, se, ah) {
  return ss === 0 && se === 0 && ah > 0;
}

/**
 * Check if scan is AC refinement (Ss>0, Ah>0).
 *
 * @param {number} ss - Spectral start
 * @param {number} _se - Spectral end
 * @param {number} ah - Successive approximation high
 * @returns {boolean} True if AC refinement
 */
export function isACRefinement(ss, _se, ah) {
  return ss > 0 && ah > 0;
}
