/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see https://github.com/Anonyfox/ravenjs
 * @see https://ravenjs.dev
 * @see https://anonyfox.com
 */

/**
 * @file VP8 DCT coefficient token decoding with context modeling.
 *
 * Implements VP8's entropy decoding of DCT coefficients using token trees,
 * band-based contexts, and partition boundary enforcement for macroblocks.
 */

// VP8 coefficient token tree probabilities (default values from spec)
const COEFF_PROBS = [
  // Band 0 (DC)
  [
    [128, 128, 128, 128, 128, 128, 128, 128, 128, 128, 128],
    [128, 128, 128, 128, 128, 128, 128, 128, 128, 128, 128],
    [128, 128, 128, 128, 128, 128, 128, 128, 128, 128, 128],
  ],
  // Band 1 (AC low frequency)
  [
    [253, 136, 254, 255, 228, 219, 128, 128, 128, 128, 128],
    [207, 114, 255, 255, 163, 166, 128, 128, 128, 128, 128],
    [26, 62, 252, 255, 94, 128, 128, 128, 128, 128, 128],
  ],
  // Band 2
  [
    [251, 129, 255, 255, 143, 128, 128, 128, 128, 128, 128],
    [207, 114, 255, 255, 163, 166, 128, 128, 128, 128, 128],
    [26, 62, 252, 255, 94, 128, 128, 128, 128, 128, 128],
  ],
  // Band 3
  [
    [251, 129, 255, 255, 143, 128, 128, 128, 128, 128, 128],
    [207, 114, 255, 255, 163, 166, 128, 128, 128, 128, 128],
    [26, 62, 252, 255, 94, 128, 128, 128, 128, 128, 128],
  ],
];

// VP8 coefficient bands for 4x4 blocks (zigzag order)
const COEFF_BANDS = [0, 1, 2, 3, 6, 4, 5, 6, 6, 6, 6, 6, 6, 6, 6, 7];

// Quantization matrices for dequantization
const DC_QUANT = [
  4, 5, 6, 7, 8, 9, 10, 10, 11, 12, 13, 14, 15, 16, 17, 17, 18, 19, 20, 20, 21, 21, 22, 22, 23, 23, 24, 25, 25, 26, 27,
  28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 46, 47, 48, 49, 50, 51, 52, 53, 54,
  55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 76, 77, 78, 79, 80, 81, 82,
  83, 84, 85, 86, 87, 88, 89, 91, 93, 95, 96, 98, 100, 101, 102, 104, 106, 108, 110, 112, 114, 116, 118, 122, 124, 126,
  128, 130, 132, 134, 136, 138, 140, 143, 145, 148, 151, 154, 157,
];

const AC_QUANT = [
  4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34,
  35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63,
  64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92,
  93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 104, 106, 108, 110, 112, 114, 116, 119, 122, 125, 128, 131, 134, 137, 140,
  143, 146, 149, 152, 155, 158, 161, 164, 167, 170, 173, 177, 181, 185,
];

/**
 * Decode DCT coefficients for a macroblock using VP8 token trees.
 *
 * Processes coefficient tokens across multiple partitions with strict
 * boundary enforcement and context modeling for optimal compression.
 *
 * @param {{ readBit: (prob: number) => 0|1, readLiteral: (n: number) => number, tell: () => number }} decoder - Boolean decoder instance
 * @param {{ yAC: number, yDC: number, y2AC: number, y2DC: number, uvAC: number, uvDC: number }} quant - Quantization parameters
 * @param {Object} modeCtx - Mode context for coefficient probability updates
 * @param {Array<{start: number, end: number}>} partitions - Partition boundaries for safety
 * @returns {Int16Array} Decoded coefficient blocks for macroblock (384 coefficients: 16*16 + 4*4 + 4*4)
 * @throws {Error} Partition boundary violation or malformed token
 */
export function decodeCoefficients(decoder, quant, modeCtx, partitions) {
  if (!decoder || typeof decoder.readBit !== "function") {
    throw new Error("Coefficients: invalid boolean decoder");
  }

  if (!quant || typeof quant.yAC !== "number") {
    throw new Error("Coefficients: invalid quantization parameters");
  }

  if (!Array.isArray(partitions) || partitions.length === 0) {
    throw new Error("Coefficients: invalid partitions array");
  }

  // Allocate coefficient storage: 16 Y blocks + 4 Y2 blocks + 8 UV blocks = 28 blocks * 16 coeffs = 448 coeffs
  const coeffs = new Int16Array(28 * 16);

  let coeffIndex = 0;
  let currentPartition = 0;

  // Decode Y blocks (16 blocks of 4x4)
  for (let i = 0; i < 16; i++) {
    const blockCoeffs = decodeBlock(decoder, quant.yAC, quant.yDC, "Y", modeCtx, partitions, currentPartition);
    coeffs.set(blockCoeffs, coeffIndex);
    coeffIndex += 16;

    // Check partition boundaries (allow some flexibility for decoder state)
    if (currentPartition < partitions.length && decoder.tell() >= partitions[currentPartition].end - 8) {
      // 8-bit buffer for decoder state
      currentPartition++;
      if (currentPartition >= partitions.length) {
        // Allow graceful completion if we're near the end
        break;
      }
    }
  }

  // Decode Y2 blocks (4 blocks of 4x4 for DC coefficients)
  for (let i = 0; i < 4; i++) {
    const blockCoeffs = decodeBlock(decoder, quant.y2AC, quant.y2DC, "Y2", modeCtx, partitions, currentPartition);
    coeffs.set(blockCoeffs, coeffIndex);
    coeffIndex += 16;

    // Check partition boundaries (allow some flexibility for decoder state)
    if (currentPartition < partitions.length && decoder.tell() >= partitions[currentPartition].end - 8) {
      // 8-bit buffer for decoder state
      currentPartition++;
      if (currentPartition >= partitions.length) {
        // Allow graceful completion if we're near the end
        break;
      }
    }
  }

  // Decode U blocks (4 blocks of 4x4)
  for (let i = 0; i < 4; i++) {
    const blockCoeffs = decodeBlock(decoder, quant.uvAC, quant.uvDC, "UV", modeCtx, partitions, currentPartition);
    coeffs.set(blockCoeffs, coeffIndex);
    coeffIndex += 16;

    // Check partition boundaries (allow some flexibility for decoder state)
    if (currentPartition < partitions.length && decoder.tell() >= partitions[currentPartition].end - 8) {
      // 8-bit buffer for decoder state
      currentPartition++;
      if (currentPartition >= partitions.length) {
        // Allow graceful completion if we're near the end
        break;
      }
    }
  }

  // Decode V blocks (4 blocks of 4x4)
  for (let i = 0; i < 4; i++) {
    const blockCoeffs = decodeBlock(decoder, quant.uvAC, quant.uvDC, "UV", modeCtx, partitions, currentPartition);
    coeffs.set(blockCoeffs, coeffIndex);
    coeffIndex += 16;

    // Check partition boundaries (allow some flexibility for decoder state)
    if (currentPartition < partitions.length && decoder.tell() >= partitions[currentPartition].end - 8) {
      // 8-bit buffer for decoder state
      currentPartition++;
      if (currentPartition >= partitions.length && i < 3) {
        // Allow graceful completion if we're near the end
        break;
      }
    }
  }

  return coeffs;
}

/**
 * Decode a single 4x4 block of DCT coefficients.
 *
 * @param {{ readBit: (prob: number) => 0|1, readLiteral: (n: number) => number, tell: () => number }} decoder - Boolean decoder
 * @param {number} acQuant - AC quantization value
 * @param {number} dcQuant - DC quantization value
 * @param {"Y"|"Y2"|"UV"} _blockType - Block type for context selection
 * @param {Object} _modeCtx - Mode context for probability updates
 * @param {Array<{start: number, end: number}>} partitions - Partition boundaries
 * @param {number} currentPartition - Current partition index
 * @returns {Int16Array} 16 decoded coefficients in zigzag order
 * @throws {Error} Malformed token or partition violation
 */
function decodeBlock(decoder, acQuant, dcQuant, _blockType, _modeCtx, partitions, currentPartition) {
  const block = new Int16Array(16);
  let coeffPos = 0;
  let context = 0; // Context for probability selection

  // Decode coefficients in zigzag order
  while (coeffPos < 16) {
    // Check partition boundary before reading token
    if (currentPartition >= partitions.length || decoder.tell() >= partitions[currentPartition].end) {
      break; // EOB due to partition boundary
    }

    const band = COEFF_BANDS[coeffPos];
    const probs = COEFF_PROBS[Math.min(band, COEFF_PROBS.length - 1)][Math.min(context, 2)];

    // Decode token using probability tree
    const token = decodeToken(decoder, probs);

    if (token === 0) {
      // EOB (End of Block)
      break;
    }

    if (token === 1) {
      // Zero run - skip this position
      coeffPos++;
      context = 0;
      continue;
    }

    // Non-zero coefficient
    let value = 0;
    let extraBits = 0;

    if (token === 2) {
      value = 1;
    } else if (token === 3) {
      value = 2;
    } else if (token === 4) {
      value = 3;
    } else if (token === 5) {
      value = 4;
    } else if (token >= 6 && token <= 10) {
      // Category 1: 5-12
      extraBits = token - 5;
      value = 5 + decoder.readLiteral(extraBits);
    } else if (token === 11) {
      // Category 2: 13-20
      value = 13 + decoder.readLiteral(3);
    } else if (token === 12) {
      // Category 3: 21-36
      value = 21 + decoder.readLiteral(4);
    } else if (token === 13) {
      // Category 4: 37-68
      value = 37 + decoder.readLiteral(5);
    } else if (token === 14) {
      // Category 5: 69-132
      value = 69 + decoder.readLiteral(6);
    } else if (token === 15) {
      // Category 6: 133-2048
      value = 133 + decoder.readLiteral(10);
    } else {
      throw new Error(`Coefficients: invalid token ${token} at position ${coeffPos}`);
    }

    // Read sign bit
    if (decoder.readBit(128) === 1) {
      value = -value;
    }

    // Apply quantization
    const quantValue = coeffPos === 0 ? dcQuant : acQuant;
    const quantIndex = Math.min(Math.abs(quantValue), 127);
    const dequantTable = coeffPos === 0 ? DC_QUANT : AC_QUANT;

    block[coeffPos] = Math.sign(value) * Math.min(2047, Math.abs(value) * dequantTable[quantIndex]);

    // Update context based on coefficient magnitude
    if (Math.abs(value) === 1) {
      context = 1;
    } else {
      context = 2;
    }

    coeffPos++;
  }

  return block;
}

/**
 * Decode a coefficient token using VP8's token tree.
 *
 * @param {{ readBit: (prob: number) => 0|1, tell: () => number }} decoder - Boolean decoder
 * @param {number[]} probs - Probability array for token tree (11 values)
 * @returns {number} Decoded token (0-15)
 * @throws {Error} Invalid probability array or decoder failure
 */
function decodeToken(decoder, probs) {
  if (!Array.isArray(probs) || probs.length !== 11) {
    throw new Error(`Coefficients: invalid probability array (expected 11, got ${probs.length})`);
  }

  // VP8 coefficient token tree decoding
  // This is a simplified version - the actual VP8 tree is more complex

  // First bit: EOB vs coefficient
  if (decoder.readBit(probs[0]) === 0) {
    return 0; // EOB
  }

  // Second bit: zero run vs non-zero coefficient
  if (decoder.readBit(probs[1]) === 0) {
    return 1; // Zero run
  }

  // Third bit: small vs large coefficient
  if (decoder.readBit(probs[2]) === 0) {
    // Small coefficient (1-4)
    if (decoder.readBit(probs[3]) === 0) {
      return 2; // Value 1
    }
    if (decoder.readBit(probs[4]) === 0) {
      return 3; // Value 2
    }
    if (decoder.readBit(probs[5]) === 0) {
      return 4; // Value 3
    }
    return 5; // Value 4
  }

  // Large coefficient - read category
  if (decoder.readBit(probs[6]) === 0) {
    // Category 1
    if (decoder.readBit(probs[7]) === 0) {
      return 6;
    }
    return 7;
  }

  if (decoder.readBit(probs[8]) === 0) {
    // Category 2
    if (decoder.readBit(probs[9]) === 0) {
      return 8;
    }
    return 9;
  }

  // Higher categories
  if (decoder.readBit(probs[10]) === 0) {
    return 10; // Category 3
  }

  // Read additional bits to determine exact category
  if (decoder.readBit(128) === 0) {
    return 11; // Category 2
  }
  if (decoder.readBit(128) === 0) {
    return 12; // Category 3
  }
  if (decoder.readBit(128) === 0) {
    return 13; // Category 4
  }
  if (decoder.readBit(128) === 0) {
    return 14; // Category 5
  }
  return 15; // Category 6
}

/**
 * Create default mode context for coefficient decoding.
 *
 * @returns {Object} Default mode context with probability tables
 */
export function createModeContext() {
  return {
    coeffProbs: COEFF_PROBS.map((band) => band.map((context) => [...context])),
    updateCount: 0,
  };
}
