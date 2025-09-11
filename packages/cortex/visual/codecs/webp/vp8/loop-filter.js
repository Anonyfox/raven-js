/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see https://github.com/Anonyfox/ravenjs
 * @see https://ravenjs.dev
 * @see https://anonyfox.com
 */

/**
 * @file VP8 loop filter for deblocking artifacts.
 *
 * Implements VP8's in-loop deblocking filter to reduce compression artifacts
 * at block boundaries. Operates on YUV planes with configurable strength.
 */

/**
 * Apply VP8 loop filter to YUV planes.
 *
 * @param {Uint8Array} yPlane - Y plane buffer
 * @param {Uint8Array} uPlane - U plane buffer
 * @param {Uint8Array} vPlane - V plane buffer
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {{ level: number, type?: string, sharpness?: number }} filterConfig - Loop filter configuration
 */
export function applyLoopFilter(yPlane, uPlane, vPlane, width, height, filterConfig) {
  // For simplicity, this is a minimal implementation
  // A full implementation would apply edge filtering based on:
  // - Filter level and sharpness
  // - Block boundaries (4x4, 8x8, 16x16)
  // - High Edge Variance (HEV) detection
  // - Simple vs Normal filter modes

  if (!filterConfig || filterConfig.level === 0) {
    return; // No filtering
  }

  // Apply simple smoothing at macroblock boundaries
  const mbWidth = Math.ceil(width / 16);
  const mbHeight = Math.ceil(height / 16);

  // Horizontal filtering (vertical edges) - filter both 8-pixel and 16-pixel boundaries
  for (let mbY = 0; mbY < mbHeight; mbY++) {
    for (let mbX = 0; mbX < mbWidth; mbX++) {
      // Filter at 8-pixel boundaries within macroblocks
      const x8 = mbX * 16 + 8;
      if (x8 < width && x8 > 0) {
        filterVerticalEdge(yPlane, x8, mbY * 16, width, height, filterConfig.level);
      }

      // Filter at 16-pixel macroblock boundaries
      if (mbX > 0) {
        const x16 = mbX * 16;
        if (x16 < width) {
          filterVerticalEdge(yPlane, x16, mbY * 16, width, height, filterConfig.level);
        }
      }
    }
  }

  // Vertical filtering (horizontal edges)
  for (let mbY = 1; mbY < mbHeight; mbY++) {
    // Skip first row
    for (let mbX = 0; mbX < mbWidth; mbX++) {
      const y = mbY * 16;
      if (y < height) {
        filterHorizontalEdge(yPlane, mbX * 16, y, width, height, filterConfig.level);
      }
    }
  }

  // Apply similar filtering to U and V planes (at half resolution)
  const chromaWidth = width >> 1;
  const chromaHeight = height >> 1;

  if (chromaWidth > 0 && chromaHeight > 0) {
    filterChromaPlanes(uPlane, vPlane, chromaWidth, chromaHeight, filterConfig.level);
  }
}

/**
 * Filter vertical edge (smooths pixels across vertical boundary).
 *
 * @param {Uint8Array} plane - Image plane
 * @param {number} x - X position of edge
 * @param {number} y - Y position (top of edge)
 * @param {number} width - Plane width
 * @param {number} height - Plane height
 * @param {number} strength - Filter strength
 */
function filterVerticalEdge(plane, x, y, width, height, strength) {
  if (x <= 0 || x >= width - 1) return;

  const filterStrength = Math.min(strength / 8, 1.0); // More aggressive normalization

  for (let row = y; row < Math.min(y + 16, height); row++) {
    const leftIdx = row * width + (x - 1);
    const rightIdx = row * width + x;

    if (leftIdx >= 0 && rightIdx < plane.length) {
      const left = plane[leftIdx];
      const right = plane[rightIdx];

      // Apply filtering to any edge difference
      const diff = Math.abs(left - right);
      if (diff > 0) {
        // Filter any difference
        const avg = Math.round((left + right) / 2);
        const blend = Math.min(filterStrength, 0.8); // Strong blending up to 80%

        plane[leftIdx] = Math.round(left * (1 - blend) + avg * blend);
        plane[rightIdx] = Math.round(right * (1 - blend) + avg * blend);
      }
    }
  }
}

/**
 * Filter horizontal edge (smooths pixels across horizontal boundary).
 *
 * @param {Uint8Array} plane - Image plane
 * @param {number} x - X position (left of edge)
 * @param {number} y - Y position of edge
 * @param {number} width - Plane width
 * @param {number} height - Plane height
 * @param {number} strength - Filter strength
 */
function filterHorizontalEdge(plane, x, y, width, height, strength) {
  if (y <= 0 || y >= height - 1) return;

  const filterStrength = Math.min(strength / 8, 1.0); // More aggressive normalization

  for (let col = x; col < Math.min(x + 16, width); col++) {
    const topIdx = (y - 1) * width + col;
    const bottomIdx = y * width + col;

    if (topIdx >= 0 && bottomIdx < plane.length) {
      const top = plane[topIdx];
      const bottom = plane[bottomIdx];

      // Apply filtering to any edge difference
      const diff = Math.abs(top - bottom);
      if (diff > 0) {
        // Filter any difference
        const avg = Math.round((top + bottom) / 2);
        const blend = Math.min(filterStrength, 0.8); // Strong blending up to 80%

        plane[topIdx] = Math.round(top * (1 - blend) + avg * blend);
        plane[bottomIdx] = Math.round(bottom * (1 - blend) + avg * blend);
      }
    }
  }
}

/**
 * Apply loop filter to chroma planes.
 *
 * @param {Uint8Array} uPlane - U plane buffer
 * @param {Uint8Array} vPlane - V plane buffer
 * @param {number} width - Chroma plane width
 * @param {number} height - Chroma plane height
 * @param {number} strength - Filter strength
 */
function filterChromaPlanes(uPlane, vPlane, width, height, strength) {
  const _filterStrength = Math.min(strength / 32, 0.5); // Weaker for chroma

  // Apply simple smoothing at 8x8 boundaries for chroma
  const mbWidth = Math.ceil(width / 8);
  const mbHeight = Math.ceil(height / 8);

  // Filter both U and V planes
  [uPlane, vPlane].forEach((plane) => {
    // Horizontal filtering
    for (let mbY = 0; mbY < mbHeight; mbY++) {
      for (let mbX = 1; mbX < mbWidth; mbX++) {
        const x = mbX * 8;
        if (x < width) {
          filterVerticalEdge(plane, x, mbY * 8, width, height, strength * 0.5);
        }
      }
    }

    // Vertical filtering
    for (let mbY = 1; mbY < mbHeight; mbY++) {
      for (let mbX = 0; mbX < mbWidth; mbX++) {
        const y = mbY * 8;
        if (y < height) {
          filterHorizontalEdge(plane, mbX * 8, y, width, height, strength * 0.5);
        }
      }
    }
  });
}
