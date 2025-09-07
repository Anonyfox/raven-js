/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see https://github.com/Anonyfox/ravenjs
 * @see https://ravenjs.dev
 * @see https://anonyfox.com
 */

/**
 * @file DCT (Discrete Cosine Transform) mathematics for JPEG compression.
 *
 * The DCT is the mathematical foundation of JPEG compression, converting
 * 8x8 pixel blocks from spatial domain to frequency domain for efficient
 * compression. This implementation uses the standard JPEG DCT formulation.
 */

/**
 * Pre-computed cosine tables for DCT performance optimization.
 * These tables avoid repeated Math.cos() calculations during transformation.
 * @type {{forward: Float32Array[], inverse: Float32Array[]} | null}
 */
let cosineTable = null;

/**
 * Creates pre-computed cosine lookup tables for DCT operations.
 * This optimization significantly improves performance by avoiding
 * repeated trigonometric calculations.
 *
 * @returns {{
 *   forward: Float32Array[],
 *   inverse: Float32Array[]
 * }} Pre-computed cosine tables for forward and inverse DCT
 */
export function createDCTTables() {
  const forward = [];
  const inverse = [];

  // Pre-compute cosine values for all possible u,v,x,y combinations
  for (let u = 0; u < 8; u++) {
    forward[u] = new Float32Array(8);
    inverse[u] = new Float32Array(8);

    for (let x = 0; x < 8; x++) {
      // Forward DCT: cos((2x + 1) * u * π / 16)
      forward[u][x] = Math.cos(((2 * x + 1) * u * Math.PI) / 16);

      // Inverse DCT: cos((2x + 1) * u * π / 16) (same formula)
      inverse[u][x] = Math.cos(((2 * x + 1) * u * Math.PI) / 16);
    }
  }

  return { forward, inverse };
}

/**
 * Initializes DCT cosine tables if not already created.
 * Called automatically by DCT functions for lazy initialization.
 */
function ensureDCTTables() {
  if (!cosineTable) {
    cosineTable = createDCTTables();
  }
}

/**
 * Validates an 8x8 block for DCT processing.
 *
 * @param {number[][]} block - 8x8 matrix of numbers
 * @param {string} [operation="DCT"] - Operation name for error messages
 * @throws {Error} If block is invalid
 */
export function validateDCTBlock(block, operation = "DCT") {
  if (!Array.isArray(block) || block.length !== 8) {
    throw new Error(`${operation} block must be an 8x8 array (got ${block?.length || "invalid"} rows)`);
  }

  for (let i = 0; i < 8; i++) {
    if (!Array.isArray(block[i]) || block[i].length !== 8) {
      throw new Error(`${operation} block row ${i} must have 8 elements (got ${block[i]?.length || "invalid"})`);
    }

    for (let j = 0; j < 8; j++) {
      if (typeof block[i][j] !== "number" || Number.isNaN(block[i][j])) {
        throw new Error(`${operation} block element [${i}][${j}] must be a valid number`);
      }
    }
  }
}

/**
 * Applies the forward Discrete Cosine Transform to an 8x8 block.
 *
 * Converts spatial domain data (pixel values) to frequency domain coefficients.
 * The DCT concentrates image energy in low-frequency coefficients, enabling
 * efficient compression through quantization.
 *
 * Formula: F(u,v) = (1/4) * C(u) * C(v) * Σ Σ f(x,y) * cos((2x+1)uπ/16) * cos((2y+1)vπ/16)
 * Where C(u) = 1/√2 if u = 0, else C(u) = 1
 *
 * @param {number[][]} block - 8x8 spatial domain block (pixel values)
 * @returns {number[][]} 8x8 frequency domain block (DCT coefficients)
 * @throws {Error} If block is invalid
 *
 * @example
 * const pixelBlock = [
 *   [139, 144, 149, 153, 155, 155, 155, 155],
 *   [144, 151, 153, 156, 159, 156, 156, 156],
 *   // ... 6 more rows
 * ];
 * const dctBlock = forwardDCT(pixelBlock);
 * // dctBlock[0][0] contains DC coefficient (average)
 * // Other coefficients represent various frequencies
 */
export function forwardDCT(block) {
  validateDCTBlock(block, "Forward DCT");
  ensureDCTTables();

  const result = Array(8)
    .fill()
    .map(() => Array(8).fill(0));

  // Apply 2D DCT transformation
  for (let u = 0; u < 8; u++) {
    for (let v = 0; v < 8; v++) {
      let sum = 0;

      // Sum over all spatial positions
      for (let x = 0; x < 8; x++) {
        for (let y = 0; y < 8; y++) {
          sum += block[x][y] * cosineTable.forward[u][x] * cosineTable.forward[v][y];
        }
      }

      // Apply normalization factors
      const Cu = u === 0 ? 1 / Math.sqrt(2) : 1;
      const Cv = v === 0 ? 1 / Math.sqrt(2) : 1;

      result[u][v] = 0.25 * Cu * Cv * sum;
    }
  }

  return result;
}

/**
 * Applies the inverse Discrete Cosine Transform to an 8x8 block.
 *
 * Converts frequency domain coefficients back to spatial domain pixel values.
 * This is the reverse of the forward DCT, used during JPEG decoding.
 *
 * Formula: f(x,y) = Σ Σ C(u) * C(v) * F(u,v) * cos((2x+1)uπ/16) * cos((2y+1)vπ/16)
 * Where C(u) = 1/√2 if u = 0, else C(u) = 1
 *
 * @param {number[][]} dctBlock - 8x8 frequency domain block (DCT coefficients)
 * @returns {number[][]} 8x8 spatial domain block (reconstructed pixel values)
 * @throws {Error} If block is invalid
 *
 * @example
 * const dctBlock = forwardDCT(originalBlock);
 * const reconstructed = inverseDCT(dctBlock);
 * // reconstructed should be very close to originalBlock
 * // (within floating-point precision)
 */
export function inverseDCT(dctBlock) {
  validateDCTBlock(dctBlock, "Inverse DCT");
  ensureDCTTables();

  const result = Array(8)
    .fill()
    .map(() => Array(8).fill(0));

  // Apply 2D IDCT transformation
  for (let x = 0; x < 8; x++) {
    for (let y = 0; y < 8; y++) {
      let sum = 0;

      // Sum over all frequency coefficients
      for (let u = 0; u < 8; u++) {
        for (let v = 0; v < 8; v++) {
          // Apply normalization factors
          const Cu = u === 0 ? 1 / Math.sqrt(2) : 1;
          const Cv = v === 0 ? 1 / Math.sqrt(2) : 1;

          sum += Cu * Cv * dctBlock[u][v] * cosineTable.inverse[u][x] * cosineTable.inverse[v][y];
        }
      }

      result[x][y] = 0.25 * sum;
    }
  }

  return result;
}

/**
 * Creates a test 8x8 block with known DCT properties.
 * Useful for testing and validation of DCT implementation.
 *
 * @param {string} [type="gradient"] - Type of test block to create
 * @returns {number[][]} 8x8 test block
 */
export function createTestBlock(type = "gradient") {
  switch (type) {
    case "gradient":
      // Smooth gradient - should have low-frequency energy
      return Array(8)
        .fill()
        .map((_, i) =>
          Array(8)
            .fill()
            .map((_, j) => i * 8 + j)
        );

    case "constant":
      // Constant value - should have only DC component
      return Array(8)
        .fill()
        .map(() => Array(8).fill(128));

    case "checkerboard":
      // High-frequency pattern - should have high-frequency energy
      return Array(8)
        .fill()
        .map((_, i) =>
          Array(8)
            .fill()
            .map((_, j) => ((i + j) % 2) * 255)
        );

    case "impulse": {
      // Single impulse - should spread across all frequencies
      const impulse = Array(8)
        .fill()
        .map(() => Array(8).fill(0));
      impulse[0][0] = 255;
      return impulse;
    }

    default:
      throw new Error(`Unknown test block type: ${type}`);
  }
}

/**
 * Compares two 8x8 blocks for approximate equality.
 * Accounts for floating-point precision errors in DCT calculations.
 *
 * @param {number[][]} block1 - First 8x8 block
 * @param {number[][]} block2 - Second 8x8 block
 * @param {number} [tolerance=0.01] - Maximum allowed difference per element
 * @returns {boolean} True if blocks are approximately equal
 */
export function compareBlocks(block1, block2, tolerance = 0.01) {
  if (!block1 || !block2) return false;
  if (block1.length !== 8 || block2.length !== 8) return false;

  for (let i = 0; i < 8; i++) {
    if (block1[i].length !== 8 || block2[i].length !== 8) return false;

    for (let j = 0; j < 8; j++) {
      if (Math.abs(block1[i][j] - block2[i][j]) > tolerance) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Calculates the energy distribution of DCT coefficients.
 * Useful for analyzing compression efficiency and quality.
 *
 * @param {number[][]} dctBlock - 8x8 DCT coefficient block
 * @returns {{
 *   totalEnergy: number,
 *   dcEnergy: number,
 *   acEnergy: number,
 *   lowFreqEnergy: number,
 *   highFreqEnergy: number
 * }} Energy distribution analysis
 */
export function analyzeDCTEnergy(dctBlock) {
  validateDCTBlock(dctBlock, "DCT energy analysis");

  let totalEnergy = 0;
  let dcEnergy = 0;
  let acEnergy = 0;
  let lowFreqEnergy = 0; // First 3x3 coefficients
  let highFreqEnergy = 0; // Remaining coefficients

  for (let u = 0; u < 8; u++) {
    for (let v = 0; v < 8; v++) {
      const energy = dctBlock[u][v] * dctBlock[u][v];
      totalEnergy += energy;

      if (u === 0 && v === 0) {
        dcEnergy += energy;
      } else {
        acEnergy += energy;

        if (u < 3 && v < 3) {
          lowFreqEnergy += energy;
        } else {
          highFreqEnergy += energy;
        }
      }
    }
  }

  return {
    totalEnergy,
    dcEnergy,
    acEnergy,
    lowFreqEnergy,
    highFreqEnergy,
  };
}
