/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see https://github.com/Anonyfox/ravenjs
 * @see https://ravenjs.dev
 * @see https://anonyfox.com
 */

/**
 * @file YUV420 to RGBA color space conversion with deterministic integer arithmetic.
 *
 * Implements BT.601 limited range conversion using integer-only arithmetic for
 * deterministic output across platforms. Processes YUV420 planar data where
 * U and V components are subsampled 2:1 in both dimensions.
 */

/**
 * Convert YUV420 planar data to RGBA using integer BT.601 limited range conversion.
 *
 * YUV420 format has Y at full resolution, U and V subsampled 2:1 in both dimensions.
 * Each 2x2 block of Y pixels shares one U and one V value.
 *
 * Uses BT.601 conversion matrix:
 * R = Y + 1.402 * (V - 128)
 * G = Y - 0.344 * (U - 128) - 0.714 * (V - 128)
 * B = Y + 1.772 * (U - 128)
 *
 * Implemented with integer arithmetic using fixed-point scaling.
 *
 * @param {Uint8Array} y - Y (luma) plane, width * height bytes
 * @param {Uint8Array} u - U (chroma) plane, (width/2) * (height/2) bytes
 * @param {Uint8Array} v - V (chroma) plane, (width/2) * (height/2) bytes
 * @param {number} width - Image width in pixels (must be even)
 * @param {number} height - Image height in pixels (must be even)
 * @returns {Uint8Array} RGBA data, width * height * 4 bytes (R,G,B,A per pixel)
 * @throws {Error} Invalid dimensions or buffer sizes
 */
export function yuv420ToRgba(y, u, v, width, height) {
  // Validate inputs
  if (width <= 0 || height <= 0) {
    throw new Error(`YUV420: invalid dimensions ${width}x${height}`);
  }

  if (width & 1 || height & 1) {
    throw new Error(`YUV420: dimensions must be even (got ${width}x${height})`);
  }

  const ySize = width * height;
  const uvSize = (width >> 1) * (height >> 1);

  if (y.length !== ySize) {
    throw new Error(`YUV420: Y plane size mismatch (expected ${ySize}, got ${y.length})`);
  }

  if (u.length !== uvSize) {
    throw new Error(`YUV420: U plane size mismatch (expected ${uvSize}, got ${u.length})`);
  }

  if (v.length !== uvSize) {
    throw new Error(`YUV420: V plane size mismatch (expected ${uvSize}, got ${v.length})`);
  }

  const rgba = new Uint8Array(width * height * 4);
  const halfWidth = width >> 1;

  // BT.601 limited range conversion coefficients scaled by 256 for integer arithmetic
  // For limited range: Y=[16,235], U,V=[16,240]
  // R = 1.164 * (Y - 16) + 1.596 * (V - 128)
  // G = 1.164 * (Y - 16) - 0.391 * (U - 128) - 0.813 * (V - 128)
  // B = 1.164 * (Y - 16) + 2.018 * (U - 128)
  //
  // Scaled by 256:
  // R = ((298 * (Y - 16)) >> 8) + ((409 * (V - 128)) >> 8)
  // G = ((298 * (Y - 16)) >> 8) - ((100 * (U - 128)) >> 8) - ((208 * (V - 128)) >> 8)
  // B = ((298 * (Y - 16)) >> 8) + ((516 * (U - 128)) >> 8)

  for (let row = 0; row < height; row += 2) {
    for (let col = 0; col < width; col += 2) {
      // Get UV values for this 2x2 block
      const uvIndex = (row >> 1) * halfWidth + (col >> 1);
      const uVal = u[uvIndex];
      const vVal = v[uvIndex];

      // Pre-compute chroma contributions (integer scaled)
      const uContrib = uVal - 128;
      const vContrib = vVal - 128;

      const rChroma = (409 * vContrib + 128) >> 8;
      const gChroma = -((100 * uContrib + 208 * vContrib + 128) >> 8);
      const bChroma = (516 * uContrib + 128) >> 8;

      // Process 2x2 block of Y pixels
      for (let dy = 0; dy < 2; dy++) {
        for (let dx = 0; dx < 2; dx++) {
          const yIndex = (row + dy) * width + (col + dx);
          const rgbaIndex = yIndex * 4;

          const yVal = y[yIndex];

          // Apply BT.601 limited range conversion with clamping to [0, 255]
          // Add rounding bias (128) for proper integer division
          const yLuma = (298 * (yVal - 16) + 128) >> 8;
          const r = Math.max(0, Math.min(255, yLuma + rChroma));
          const g = Math.max(0, Math.min(255, yLuma + gChroma));
          const b = Math.max(0, Math.min(255, yLuma + bChroma));

          rgba[rgbaIndex] = r;
          rgba[rgbaIndex + 1] = g;
          rgba[rgbaIndex + 2] = b;
          rgba[rgbaIndex + 3] = 255; // Full alpha
        }
      }
    }
  }

  return rgba;
}
