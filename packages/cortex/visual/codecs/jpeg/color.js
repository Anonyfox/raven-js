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
 * Convert RGBA to planar Y, Cb, Cr with optional subsampling handled elsewhere.
 * Fixed-point BT.601 with deterministic rounding (round-to-nearest via +bias).
 * Returns separate Uint8Array planes at full resolution; downsampling occurs in tiling.
 *
 * @param {Uint8Array} rgba length width*height*4
 * @param {number} width
 * @param {number} height
 * @returns {{ Y: Uint8Array, Cb: Uint8Array, Cr: Uint8Array }}
 */
export function rgbaToYCbCr(rgba, width, height) {
  if (!(rgba instanceof Uint8Array)) throw new Error("ERR_INPUT_TYPE: rgba must be Uint8Array");
  if (rgba.length !== width * height * 4)
    throw new Error(`ERR_INPUT_SIZE: expected ${width * height * 4} bytes, got ${rgba.length}`);
  const Y = new Uint8Array(width * height);
  const Cb = new Uint8Array(width * height);
  const Cr = new Uint8Array(width * height);
  let si = 0;
  for (let i = 0; i < width * height; i++) {
    const r = rgba[si++] | 0;
    const g = rgba[si++] | 0;
    const b = rgba[si++] | 0;
    si++; // skip alpha
    // Fixed-point coefficients with +0.5 rounding bias (>>16)
    // Y  = ( 19595*R + 38470*G +  7471*B + 32768) >> 16
    // Cb = (-11059*R - 21709*G + 32768*B + 8421376) >> 16  // 128<<16 bias
    // Cr = ( 32768*R - 27439*G -  5329*B + 8421376) >> 16
    let y = (19595 * r + 38470 * g + 7471 * b + 32768) >> 16;
    let cb = (-11059 * r - 21709 * g + 32768 * b + 8421376) >> 16;
    let cr = (32768 * r - 27439 * g - 5329 * b + 8421376) >> 16;
    if (y < 0) y = 0;
    else if (y > 255) y = 255;
    if (cb < 0) cb = 0;
    else if (cb > 255) cb = 255;
    if (cr < 0) cr = 0;
    else if (cr > 255) cr = 255;
    Y[i] = y;
    Cb[i] = cb;
    Cr[i] = cr;
  }
  return { Y, Cb, Cr };
}

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
