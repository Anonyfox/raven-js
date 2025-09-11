/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tiling and downsampling utilities for JPEG encoder.
 */

/**
 * Downsample a source plane to (dstW,dstH) using box filter averaging with edge clamp.
 * @param {Uint8Array} src
 * @param {number} srcW
 * @param {number} srcH
 * @param {number} dstW
 * @param {number} dstH
 */
export function downsampleBox(src, srcW, srcH, dstW, dstH) {
  const dst = new Uint8Array(dstW * dstH);
  const scaleX = srcW / dstW;
  const scaleY = srcH / dstH;
  for (let dy = 0; dy < dstH; dy++) {
    const y0 = Math.floor(dy * scaleY);
    const y1 = Math.min(srcH - 1, Math.floor((dy + 1) * scaleY) - 1);
    for (let dx = 0; dx < dstW; dx++) {
      const x0 = Math.floor(dx * scaleX);
      const x1 = Math.min(srcW - 1, Math.floor((dx + 1) * scaleX) - 1);
      let sum = 0;
      let count = 0;
      for (let y = y0; y <= y1; y++) {
        const row = y * srcW;
        for (let x = x0; x <= x1; x++) {
          sum += src[row + x];
          count++;
        }
      }
      if (count === 0) {
        // Fallback to nearest
        const ny = Math.min(srcH - 1, Math.max(0, Math.round((dy + 0.5) * scaleY - 0.5)));
        const nx = Math.min(srcW - 1, Math.max(0, Math.round((dx + 0.5) * scaleX - 0.5)));
        dst[dy * dstW + dx] = src[ny * srcW + nx];
      } else {
        dst[dy * dstW + dx] = Math.round(sum / count);
      }
    }
  }
  return dst;
}

/**
 * Gather a centered Int16 8×8 block from a plane with edge replication.
 * @param {Uint8Array} plane
 * @param {number} width
 * @param {number} height
 * @param {number} baseX top-left x for the block
 * @param {number} baseY top-left y for the block
 * @param {Int16Array} out length 64 (centered samples: value-128)
 */
export function gatherBlockCentered(plane, width, height, baseX, baseY, out) {
  let p = 0;
  for (let y = 0; y < 8; y++) {
    const sy = Math.min(height - 1, baseY + y);
    const row = sy * width;
    for (let x = 0; x < 8; x++) {
      const sx = Math.min(width - 1, baseX + x);
      out[p++] = (plane[row + sx] | 0) - 128;
    }
  }
}
