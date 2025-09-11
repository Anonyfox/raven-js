/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see https://github.com/Anonyfox/ravenjs
 * @see https://ravenjs.dev
 * @see https://anonyfox.com
 */

/**
 * @file Integer transforms for VP8: 4x4 IDCT and 4-point Walsh-Hadamard Transform.
 *
 * Implements VP8's integer approximation of IDCT using butterfly operations.
 * All arithmetic is integer-only for deterministic cross-platform results.
 */

/**
 * In-place 4x4 inverse transform for VP8 residual blocks.
 *
 * VP8 uses an integer approximation of IDCT that can be computed with
 * simple butterfly operations. The transform is applied first to rows,
 * then to columns.
 *
 * Early exit optimization: if all AC coefficients are zero (only DC),
 * the transform simplifies to DC replication.
 *
 * @param {Int16Array} block - 16 coefficients in row-major order, modified in-place
 * @throws {Error} Invalid block size
 */
export function inverse4x4(block) {
  if (block.length !== 16) {
    throw new Error(`IDCT: block must have 16 coefficients (got ${block.length})`);
  }

  // Check for all-zero AC coefficients (early exit optimization)
  let hasAC = false;
  for (let i = 1; i < 16; i++) {
    if (block[i] !== 0) {
      hasAC = true;
      break;
    }
  }

  if (!hasAC) {
    // DC-only block: replicate DC value across all positions
    const dc = block[0];
    for (let i = 1; i < 16; i++) {
      block[i] = dc;
    }
    return;
  }

  // VP8 IDCT constants (scaled for integer arithmetic)
  const kC1 = 20091; // cos(π/8) * 32768
  const kC2 = 35468; // sin(π/8) * 32768

  // Transform rows first
  for (let row = 0; row < 4; row++) {
    const offset = row * 4;

    const a = block[offset] + block[offset + 2];
    const b = block[offset] - block[offset + 2];
    const c = (block[offset + 1] * kC2 - block[offset + 3] * kC1) >> 16;
    const d = (block[offset + 1] * kC1 + block[offset + 3] * kC2) >> 16;

    block[offset] = a + d;
    block[offset + 1] = b + c;
    block[offset + 2] = b - c;
    block[offset + 3] = a - d;
  }

  // Transform columns
  for (let col = 0; col < 4; col++) {
    const a = block[col] + block[col + 8];
    const b = block[col] - block[col + 8];
    const c = (block[col + 4] * kC2 - block[col + 12] * kC1) >> 16;
    const d = (block[col + 4] * kC1 + block[col + 12] * kC2) >> 16;

    block[col] = (a + d + 4) >> 3; // Add rounding bias
    block[col + 4] = (b + c + 4) >> 3;
    block[col + 8] = (b - c + 4) >> 3;
    block[col + 12] = (a - d + 4) >> 3;
  }
}

/**
 * In-place 4-point Walsh-Hadamard Transform for DC coefficients.
 *
 * VP8 applies WHT to the 4 DC coefficients from the four 4x4 Y blocks
 * within each 16x16 macroblock. This is a fast butterfly transform.
 *
 * @param {Int16Array} dc - 4 DC coefficients, modified in-place
 * @throws {Error} Invalid DC array size
 */
export function inverseWHT4(dc) {
  if (dc.length !== 4) {
    throw new Error(`WHT: dc must have 4 coefficients (got ${dc.length})`);
  }

  // Walsh-Hadamard Transform (WHT) for 4 DC coefficients
  // VP8 applies this to the 4 DC values from 4x4 blocks in a 16x16 macroblock

  // First butterfly stage
  const a = dc[0] + dc[3];
  const b = dc[1] + dc[2];
  const c = dc[1] - dc[2];
  const d = dc[0] - dc[3];

  // Second butterfly stage with final scaling
  dc[0] = (a + b + 3) >> 3; // Add rounding bias and scale by 1/8
  dc[1] = (d + c + 3) >> 3;
  dc[2] = (a - b + 3) >> 3;
  dc[3] = (d - c + 3) >> 3;
}
