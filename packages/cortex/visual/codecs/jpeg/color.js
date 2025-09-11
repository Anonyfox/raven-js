/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Color conversions: YCbCr→RGB (BT.601 fixed-point), RGB pass-through, CMYK/YCCK conversions.
 */

/**
 * Convert Y, Cb, Cr planes (same resolution) to RGBA (A=255) using BT.601 fixed-point.
 * @param {Uint8Array} Y
 * @param {Uint8Array} Cb
 * @param {Uint8Array} Cr
 * @param {number} width
 * @param {number} height
 */
export function ycbcrToRgba(Y, Cb, Cr, width, height) {
  const out = new Uint8Array(width * height * 4);
  let oi = 0;
  for (let i = 0; i < width * height; i++) {
    const y = Y[i] | 0;
    const cb = (Cb[i] | 0) - 128;
    const cr = (Cr[i] | 0) - 128;
    let r = y + ((91881 * cr) >> 16);
    let g = y - ((22554 * cb + 46802 * cr) >> 16);
    let b = y + ((116130 * cb) >> 16);
    if (r < 0) r = 0;
    else if (r > 255) r = 255;
    if (g < 0) g = 0;
    else if (g > 255) g = 255;
    if (b < 0) b = 0;
    else if (b > 255) b = 255;
    out[oi++] = r;
    out[oi++] = g;
    out[oi++] = b;
    out[oi++] = 255;
  }
  return out;
}

/**
 * Convert CMYK planes (same resolution) to RGBA.
 * @param {Uint8Array} C
 * @param {Uint8Array} M
 * @param {Uint8Array} Y
 * @param {Uint8Array} K
 * @param {number} width
 * @param {number} height
 */
export function cmykToRgba(C, M, Y, K, width, height) {
  const out = new Uint8Array(width * height * 4);
  let oi = 0;
  for (let i = 0; i < width * height; i++) {
    const c = C[i] | 0;
    const m = M[i] | 0;
    const y = Y[i] | 0;
    const k = K[i] | 0;
    // R = 255 - clamp((C*(255-K)+K*255)/255)
    const r = 255 - Math.min(255, Math.floor((c * (255 - k) + 255 * k) / 255));
    const g = 255 - Math.min(255, Math.floor((m * (255 - k) + 255 * k) / 255));
    const b = 255 - Math.min(255, Math.floor((y * (255 - k) + 255 * k) / 255));
    out[oi++] = r;
    out[oi++] = g;
    out[oi++] = b;
    out[oi++] = 255;
  }
  return out;
}

/**
 * Convert YCCK to RGBA by first converting YCbCr to CMYK then CMYK to RGB.
 * @param {Uint8Array} Y
 * @param {Uint8Array} Cb
 * @param {Uint8Array} Cr
 * @param {Uint8Array} K
 * @param {number} width
 * @param {number} height
 */
export function ycckToRgba(Y, Cb, Cr, K, width, height) {
  // Convert YCbCr -> C,M,Y' (as chroma channels), then combine with K to RGB via CMYK conversion.
  const Cchan = new Uint8Array(width * height);
  const Mchan = new Uint8Array(width * height);
  const Ychan = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const y = Y[i] | 0;
    const cb = (Cb[i] | 0) - 128;
    const cr = (Cr[i] | 0) - 128;
    // Use same fixed-point but map into CMY space; a rough inverse as per common implementations
    let r = y + ((91881 * cr) >> 16);
    let g = y - ((22554 * cb + 46802 * cr) >> 16);
    let b = y + ((116130 * cb) >> 16);
    if (r < 0) r = 0;
    else if (r > 255) r = 255;
    if (g < 0) g = 0;
    else if (g > 255) g = 255;
    if (b < 0) b = 0;
    else if (b > 255) b = 255;
    // Convert RGB to CMY (0..255)
    Cchan[i] = 255 - r;
    Mchan[i] = 255 - g;
    Ychan[i] = 255 - b;
  }
  return cmykToRgba(Cchan, Mchan, Ychan, K, width, height);
}
