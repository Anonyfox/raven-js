/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file JPEG IDCT (Inverse Discrete Cosine Transform) implementation.
 *
 * Provides fixed-point Loeffler IDCT for JPEG coefficient reconstruction.
 * Includes dequantization, fast paths for zero AC coefficients, and
 * deterministic rounding for cross-platform consistency.
 */

// Enhanced IDCT constants (fixed-point, optimized precision)
const IDCT_CONSTANTS = {
  // AAN (Arai-Nakajima-Nakamura) scaling factors for better precision
  // These account for the 2D DCT normalization and provide better accuracy
  AAN_SCALE_BITS: 12,
  AAN_SCALE_FACTOR: 1 << 12,

  // Precomputed cosine values with optimized precision (14-bit for better accuracy)
  COS_1_16: 8035, // cos(π/16) * 16384 (14-bit precision)
  COS_2_16: 7568, // cos(2π/16) * 16384
  COS_3_16: 6811, // cos(3π/16) * 16384
  COS_4_16: 5793, // cos(4π/16) * 16384
  COS_5_16: 4551, // cos(5π/16) * 16384
  COS_6_16: 3135, // cos(6π/16) * 16384
  COS_7_16: 1598, // cos(7π/16) * 16384

  // AAN scaling constants (sqrt(2) and 1/sqrt(2) scaled)
  SQRT2: 5793, // sqrt(2) * 4096 (12-bit)
  INV_SQRT2: 2896, // 1/sqrt(2) * 4096 (12-bit)

  // Final output scaling for 8x8 normalization
  FINAL_SCALE_BITS: 17, // Combined AAN + DCT scaling
  ROUND_FACTOR: 1 << 16, // Round-to-nearest for final scaling

  // Fast path detection threshold
  DC_ONLY_THRESHOLD: 1, // Coefficient magnitude threshold for DC-only detection
};

/**
 * Dequantize 8×8 coefficient block.
 *
 * @param {Int16Array} coeffs - 64 quantized coefficients
 * @param {Int32Array} quantTable - 64 quantization values
 * @param {Int32Array} output - Output buffer for dequantized coefficients
 */
export function dequantizeBlock(coeffs, quantTable, output) {
  for (let i = 0; i < 64; i++) {
    output[i] = coeffs[i] * quantTable[i];
  }
}

/**
 * Enhanced IDCT for 8×8 block using optimized Loeffler algorithm.
 * Implements AAN (Arai-Nakajima-Nakamura) scaling for better precision.
 *
 * @param {Int32Array} coeffs - 64 dequantized coefficients (modified in-place)
 * @param {Uint8Array} output - 64 output samples (0-255 range)
 */
export function idctBlock(coeffs, output) {
  const { COS_2_16, COS_4_16, COS_6_16, SQRT2, INV_SQRT2, ROUND_FACTOR, AAN_SCALE_BITS } = IDCT_CONSTANTS;

  // Apply AAN scaling to input coefficients for better precision
  for (let i = 0; i < 8; i++) {
    // Scale DC coefficient (position 0) by 1/sqrt(2)
    coeffs[i * 8] = (coeffs[i * 8] * INV_SQRT2) >> AAN_SCALE_BITS;
    // Scale AC coefficients (positions 1-7) by 1/2
    for (let j = 1; j < 8; j++) {
      coeffs[i * 8 + j] = (coeffs[i * 8 + j] * SQRT2) >> AAN_SCALE_BITS;
    }
  }

  // Row pass with enhanced precision
  for (let row = 0; row < 8; row++) {
    const rowOffset = row * 8;

    // Extract row coefficients
    const x0 = coeffs[rowOffset + 0];
    const x1 = coeffs[rowOffset + 1];
    const x2 = coeffs[rowOffset + 2];
    const x3 = coeffs[rowOffset + 3];
    const x4 = coeffs[rowOffset + 4];
    const x5 = coeffs[rowOffset + 5];
    const x6 = coeffs[rowOffset + 6];
    const x7 = coeffs[rowOffset + 7];

    // Stage 1: Even/odd separation
    const t0 = x0 + x4;
    const t1 = x0 - x4;
    const t2 = x2 + x6;
    const t3 = x2 - x6;
    const t4 = x1 + x7;
    const t5 = x1 - x7;
    const t6 = x3 + x5;
    const t7 = x3 - x5;

    // Stage 2: 4-point DCT
    const s0 = t0 + t2;
    const s1 = t0 - t2;
    const s2 = t1 + t3;
    const s3 = t1 - t3;

    // Stage 3: 4-point DCT for odd part
    const u0 = t4 + t6;
    const u1 = t4 - t6;
    const u2 = t5 + t7;
    const u3 = t5 - t7;

    // Stage 4: 2-point DCT
    const v0 = u0 + u2;
    const v1 = u0 - u2;
    const v2 = u1 + u3;
    const v3 = u1 - u3;

    // Stage 5: Cosine multiplications with enhanced precision (14-bit)
    const w0 = v0;
    const w1 = (COS_4_16 * v1) >> 14; // 14-bit precision
    const w2 = (COS_2_16 * v2) >> 14;
    const w3 = (COS_6_16 * v3) >> 14;

    // Stage 6: Final butterfly
    const y0 = s0 + w0;
    const y1 = s0 - w0;
    const y2 = s1 + w1;
    const y3 = s1 - w1;
    const y4 = s2 + w2;
    const y5 = s2 - w2;
    const y6 = s3 + w3;
    const y7 = s3 - w3;

    // Write back row results
    coeffs[rowOffset + 0] = y0;
    coeffs[rowOffset + 1] = y1;
    coeffs[rowOffset + 2] = y2;
    coeffs[rowOffset + 3] = y3;
    coeffs[rowOffset + 4] = y4;
    coeffs[rowOffset + 5] = y5;
    coeffs[rowOffset + 6] = y6;
    coeffs[rowOffset + 7] = y7;
  }

  // Column pass with same algorithm and AAN scaling
  for (let col = 0; col < 8; col++) {
    // Extract column coefficients
    const x0 = coeffs[col + 0 * 8];
    const x1 = coeffs[col + 1 * 8];
    const x2 = coeffs[col + 2 * 8];
    const x3 = coeffs[col + 3 * 8];
    const x4 = coeffs[col + 4 * 8];
    const x5 = coeffs[col + 5 * 8];
    const x6 = coeffs[col + 6 * 8];
    const x7 = coeffs[col + 7 * 8];

    // Apply AAN scaling to column coefficients
    const scaled_x0 = (x0 * INV_SQRT2) >> AAN_SCALE_BITS;
    const scaled_x1 = (x1 * SQRT2) >> AAN_SCALE_BITS;
    const scaled_x2 = (x2 * SQRT2) >> AAN_SCALE_BITS;
    const scaled_x3 = (x3 * SQRT2) >> AAN_SCALE_BITS;
    const scaled_x4 = (x4 * INV_SQRT2) >> AAN_SCALE_BITS;
    const scaled_x5 = (x5 * SQRT2) >> AAN_SCALE_BITS;
    const scaled_x6 = (x6 * SQRT2) >> AAN_SCALE_BITS;
    const scaled_x7 = (x7 * SQRT2) >> AAN_SCALE_BITS;

    // Same Loeffler algorithm as row pass
    const t0 = scaled_x0 + scaled_x4;
    const t1 = scaled_x0 - scaled_x4;
    const t2 = scaled_x2 + scaled_x6;
    const t3 = scaled_x2 - scaled_x6;
    const t4 = scaled_x1 + scaled_x7;
    const t5 = scaled_x1 - scaled_x7;
    const t6 = scaled_x3 + scaled_x5;
    const t7 = scaled_x3 - scaled_x5;

    const s0 = t0 + t2;
    const s1 = t0 - t2;
    const s2 = t1 + t3;
    const s3 = t1 - t3;

    const u0 = t4 + t6;
    const u1 = t4 - t6;
    const u2 = t5 + t7;
    const u3 = t5 - t7;

    const v0 = u0 + u2;
    const v1 = u0 - u2;
    const v2 = u1 + u3;
    const v3 = u1 - u3;

    // Enhanced precision cosine multiplications
    const w0 = v0;
    const w1 = (COS_4_16 * v1) >> 14;
    const w2 = (COS_2_16 * v2) >> 14;
    const w3 = (COS_6_16 * v3) >> 14;

    const y0 = s0 + w0;
    const y1 = s0 - w0;
    const y2 = s1 + w1;
    const y3 = s1 - w1;
    const y4 = s2 + w2;
    const y5 = s2 - w2;
    const y6 = s3 + w3;
    const y7 = s3 - w3;

    // Final scaling and clamping to 0-255 range
    // Combined AAN scaling (17 bits total) + level shift for unsigned representation
    output[col + 0 * 8] = clampToUint8(((y0 + ROUND_FACTOR) >> 17) + 128);
    output[col + 1 * 8] = clampToUint8(((y1 + ROUND_FACTOR) >> 17) + 128);
    output[col + 2 * 8] = clampToUint8(((y2 + ROUND_FACTOR) >> 17) + 128);
    output[col + 3 * 8] = clampToUint8(((y3 + ROUND_FACTOR) >> 17) + 128);
    output[col + 4 * 8] = clampToUint8(((y4 + ROUND_FACTOR) >> 17) + 128);
    output[col + 5 * 8] = clampToUint8(((y5 + ROUND_FACTOR) >> 17) + 128);
    output[col + 6 * 8] = clampToUint8(((y6 + ROUND_FACTOR) >> 17) + 128);
    output[col + 7 * 8] = clampToUint8(((y7 + ROUND_FACTOR) >> 17) + 128);
  }
}

/**
 * Enhanced fast path for DC-only blocks with AAN scaling.
 *
 * @param {number} dcCoeff - DC coefficient value
 * @param {Uint8Array} output - 64 output samples
 */
export function idctBlockDCOnly(dcCoeff, output) {
  const { INV_SQRT2, AAN_SCALE_BITS, ROUND_FACTOR } = IDCT_CONSTANTS;

  // Apply AAN scaling to DC coefficient: DC * (1/sqrt(2)) * (1/sqrt(2))
  const scaledDC = (dcCoeff * INV_SQRT2 * INV_SQRT2) >> (AAN_SCALE_BITS * 2);

  // Final scaling and level shift for unsigned representation
  const value = clampToUint8(((scaledDC + ROUND_FACTOR) >> 17) + 128);

  // Fill all 64 samples with the same DC value
  for (let i = 0; i < 64; i++) {
    output[i] = value;
  }
}

/**
 * Check if a block contains only DC coefficient (all AC coefficients are zero).
 *
 * @param {Int16Array} coeffs - 64 quantized coefficients
 * @param {number} threshold - Magnitude threshold for considering coefficients as zero
 * @returns {boolean} True if block has only DC coefficient
 */
export function isDCOnlyBlock(coeffs, threshold = 1) {
  // Check if all AC coefficients (indices 1-63) are below threshold
  for (let i = 1; i < 64; i++) {
    if (Math.abs(coeffs[i]) >= threshold) {
      return false;
    }
  }
  return true;
}

/**
 * Count non-zero AC coefficients in a block for optimization decisions.
 *
 * @param {Int16Array} coeffs - 64 quantized coefficients
 * @returns {number} Number of non-zero AC coefficients
 */
export function countNonZeroAC(coeffs) {
  let count = 0;
  for (let i = 1; i < 64; i++) {
    if (coeffs[i] !== 0) {
      count++;
    }
  }
  return count;
}

/**
 * Clamp value to Uint8 range (0-255).
 *
 * @param {number} value - Input value
 * @returns {number} Clamped value
 */
function clampToUint8(value) {
  return Math.max(0, Math.min(255, value));
}

/**
 * Enhanced block processing with intelligent optimization selection.
 *
 * @param {Int16Array} coeffs - 64 quantized coefficients
 * @param {Int32Array} quantTable - 64 quantization values
 * @param {Uint8Array} output - 64 output samples (0-255)
 */
export function processBlock(coeffs, quantTable, output) {
  const { DC_ONLY_THRESHOLD } = IDCT_CONSTANTS;

  // Intelligent path selection based on coefficient analysis
  if (isDCOnlyBlock(coeffs, DC_ONLY_THRESHOLD)) {
    // Fast path for DC-only blocks
    const dcValue = coeffs[0] * quantTable[0];
    idctBlockDCOnly(dcValue, output);
  } else {
    // Full IDCT path with AAN scaling optimization
    const tempCoeffs = new Int32Array(64);
    dequantizeBlock(coeffs, quantTable, tempCoeffs);
    idctBlock(tempCoeffs, output);
  }
}

/**
 * Legacy processBlock function for backward compatibility.
 * @deprecated Use the enhanced processBlock without isDCOnly parameter
 * @param {Int16Array} coeffs - 64 quantized coefficients
 * @param {Int32Array} quantTable - 64 quantization values
 * @param {Uint8Array} output - 64 output samples (0-255)
 * @param {boolean} isDCOnly - Whether block has only DC coefficient
 */
export function processBlockLegacy(coeffs, quantTable, output, isDCOnly) {
  if (isDCOnly) {
    // Fast path for DC-only blocks
    const dcValue = coeffs[0] * quantTable[0];
    idctBlockDCOnly(dcValue, output);
  } else {
    // Full IDCT path
    const tempCoeffs = new Int32Array(64);
    dequantizeBlock(coeffs, quantTable, tempCoeffs);
    idctBlock(tempCoeffs, output);
  }
}
