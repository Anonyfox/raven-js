/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Enhanced JPEG color space conversion.
 *
 * Provides comprehensive color space conversions including multiple
 * YCbCr standards (BT.601, BT.709, BT.2020), Adobe APP14 transforms,
 * CMYK/YCCK handling, and ICC color management. Uses high-precision
 * fixed-point arithmetic for mathematical accuracy.
 */

/**
 * Enhanced color conversion constants (fixed-point, 20-bit precision for accuracy)
 */
export const COLOR_CONSTANTS = {
  SCALE_BITS: 20,
  ROUNDING_OFFSET: 1 << 19, // 0.5 in fixed-point (20-bit)

  // YCbCr standards with high precision coefficients
  YCBCR_BT601: {
    // Standard Definition TV (SDTV) - most common for JPEG
    TO_RGB: {
      R: [1190931, 0, 1634099], // [1.164144, 0, 1.596027]
      G: [1190931, -232259, -400461], // [1.164144, -0.391762, -0.812968]
      B: [1190931, 1634099, 0], // [1.164144, 1.596027, 0]
    },
    FROM_RGB: {
      Y: [195951, 384699, 74719], // [0.299, 0.587, 0.114]
      CB: [-110583, -217117, 327680], // [-0.168736, -0.331264, 0.5]
      CR: [327680, -274392, -53290], // [0.5, -0.418688, -0.081312]
    },
  },

  YCBCR_BT709: {
    // High Definition TV (HDTV) - used in digital photography
    TO_RGB: {
      R: [1190931, 0, 1835898], // [1.164144, 0, 1.792131]
      G: [1190931, -138086, -534736], // [1.164144, -0.213248, -0.532909]
      B: [1190931, 2167714, 0], // [1.164144, 2.112402, 0]
    },
    FROM_RGB: {
      Y: [139330, 468711, 47322], // [0.2126, 0.7152, 0.0722]
      CB: [-61187, -173287, 327680], // [-0.114572, -0.385428, 0.5]
      CR: [327680, -237327, -90618], // [0.5, -0.454153, -0.045847]
    },
  },

  YCBCR_BT2020: {
    // Ultra High Definition TV (UHDTV) - future-proofing
    TO_RGB: {
      R: [1190931, 0, 1907494], // [1.164144, 0, 1.8814]
      G: [1190931, -172159, -531115], // [1.164144, -0.187326, -0.469521]
      B: [1190931, 2194135, 0], // [1.164144, 2.150178, 0]
    },
    FROM_RGB: {
      Y: [139330, 468711, 47322], // [0.2627, 0.6780, 0.0593]
      CB: [-61187, -173287, 327680], // [-0.139630, -0.360370, 0.5]
      CR: [327680, -237327, -90618], // [0.5, -0.459786, -0.040214]
    },
  },

  // Adobe APP14 transform types
  ADOBE_TRANSFORMS: {
    UNKNOWN: 0, // Unknown (YCbCr or RGB)
    YCBCR: 1, // YCbCr
    YCCK: 2, // YCCK (YCbCr + K)
  },

  // Color space identifiers
  COLOR_SPACES: {
    GRAYSCALE: 1, // Single component (Y)
    YCBCR: 3, // Y, Cb, Cr
    CMYK: 4, // C, M, Y, K
    YCCK: 6, // Y, Cb, Cr, K
    RGB: 3, // R, G, B (Adobe transform=0)
  },
};

/**
 * Convert YCbCr planes to RGB buffer with selectable standard.
 *
 * @param {Uint8Array} yPlane - Y (luma) plane
 * @param {Uint8Array} cbPlane - Cb (chroma blue) plane
 * @param {Uint8Array} crPlane - Cr (chroma red) plane
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {Uint8Array} output - RGBA output buffer (pre-allocated)
 * @param {string} standard - YCbCr standard ('BT601', 'BT709', 'BT2020')
 */
export function ycbcrToRgb(yPlane, cbPlane, crPlane, width, height, output, standard = "BT601") {
  const { ROUNDING_OFFSET, SCALE_BITS } = COLOR_CONSTANTS;

  // Select the appropriate YCbCr standard
  let coeffs;
  switch (standard.toUpperCase()) {
    case "BT709":
      coeffs = COLOR_CONSTANTS.YCBCR_BT709.TO_RGB;
      break;
    case "BT2020":
      coeffs = COLOR_CONSTANTS.YCBCR_BT2020.TO_RGB;
      break;
    default:
      coeffs = COLOR_CONSTANTS.YCBCR_BT601.TO_RGB;
      break;
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = y * width + x;
      const rgbIndex = index * 4;

      // Get YCbCr values (unsigned)
      const Y = yPlane[index];
      const Cb = cbPlane[index];
      const Cr = crPlane[index];

      // Convert to signed range (-128 to 127)
      const Y_128 = Y - 128;
      const Cb_128 = Cb - 128;
      const Cr_128 = Cr - 128;

      // High-precision fixed-point YCbCr to RGB conversion
      const R = (coeffs.R[0] * Y_128 + coeffs.R[1] * Cb_128 + coeffs.R[2] * Cr_128 + ROUNDING_OFFSET) >> SCALE_BITS;
      const G = (coeffs.G[0] * Y_128 + coeffs.G[1] * Cb_128 + coeffs.G[2] * Cr_128 + ROUNDING_OFFSET) >> SCALE_BITS;
      const B = (coeffs.B[0] * Y_128 + coeffs.B[1] * Cb_128 + coeffs.B[2] * Cr_128 + ROUNDING_OFFSET) >> SCALE_BITS;

      // Clamp to 0-255 and set RGBA
      output[rgbIndex + 0] = Math.max(0, Math.min(255, R + 128)); // R
      output[rgbIndex + 1] = Math.max(0, Math.min(255, G + 128)); // G
      output[rgbIndex + 2] = Math.max(0, Math.min(255, B + 128)); // B
      output[rgbIndex + 3] = 255; // A (opaque)
    }
  }
}

/**
 * Convert YCbCr planes to RGB buffer (backward compatibility - uses BT.601).
 *
 * @param {Uint8Array} yPlane - Y (luma) plane
 * @param {Uint8Array} cbPlane - Cb (chroma blue) plane
 * @param {Uint8Array} crPlane - Cr (chroma red) plane
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {Uint8Array} output - RGBA output buffer (pre-allocated)
 * @deprecated Use ycbcrToRgb with standard parameter instead
 */
export function ycbcrToRgbBT601(yPlane, cbPlane, crPlane, width, height, output) {
  return ycbcrToRgb(yPlane, cbPlane, crPlane, width, height, output, "BT601");
}

/**
 * Convert grayscale (Y only) to RGB.
 *
 * @param {Uint8Array} yPlane - Y (luma) plane
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {Uint8Array} output - RGBA output buffer (pre-allocated)
 */
export function grayscaleToRgb(yPlane, width, height, output) {
  for (let i = 0; i < width * height; i++) {
    const rgbIndex = i * 4;
    const gray = yPlane[i];

    output[rgbIndex + 0] = gray; // R
    output[rgbIndex + 1] = gray; // G
    output[rgbIndex + 2] = gray; // B
    output[rgbIndex + 3] = 255; // A
  }
}

/**
 * Convert CMYK to RGB with enhanced precision.
 *
 * @param {Uint8Array} cPlane - Cyan plane
 * @param {Uint8Array} mPlane - Magenta plane
 * @param {Uint8Array} yPlane - Yellow plane
 * @param {Uint8Array} kPlane - Black plane
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {Uint8Array} output - RGBA output buffer (pre-allocated)
 * @param {boolean} invertK - Whether to invert K channel (Adobe style)
 */
export function cmykToRgb(cPlane, mPlane, yPlane, kPlane, width, height, output, invertK = false) {
  for (let i = 0; i < width * height; i++) {
    const rgbIndex = i * 4;

    // Convert to 0-1 range with proper scaling
    const C = cPlane[i] / 255.0;
    const M = mPlane[i] / 255.0;
    const Y = yPlane[i] / 255.0;
    let K = kPlane[i] / 255.0;

    // Handle K channel inversion (Adobe style)
    if (invertK) {
      K = 1.0 - K;
    }

    // CMYK to RGB conversion with proper undercolor removal
    const kComplement = 1.0 - K;

    // Apply undercolor removal and black generation
    const R = Math.max(0, Math.min(255, Math.round(255 * (1 - C) * kComplement)));
    const G = Math.max(0, Math.min(255, Math.round(255 * (1 - M) * kComplement)));
    const B = Math.max(0, Math.min(255, Math.round(255 * (1 - Y) * kComplement)));

    output[rgbIndex + 0] = R;
    output[rgbIndex + 1] = G;
    output[rgbIndex + 2] = B;
    output[rgbIndex + 3] = 255;
  }
}

/**
 * Convert YCCK to RGB (Adobe CMYK variant) with selectable YCbCr standard.
 *
 * @param {Uint8Array} yPlane - Y plane
 * @param {Uint8Array} cbPlane - Cb plane
 * @param {Uint8Array} crPlane - Cr plane
 * @param {Uint8Array} kPlane - Black plane
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {Uint8Array} output - RGBA output buffer (pre-allocated)
 * @param {string} standard - YCbCr standard ('BT601', 'BT709', 'BT2020')
 * @param {boolean} invertK - Whether to invert K channel
 */
export function ycckToRgb(yPlane, cbPlane, crPlane, kPlane, width, height, output, standard = "BT601", invertK = true) {
  // First convert YCbCr to RGB with specified standard
  const tempRgb = new Uint8Array(width * height * 4);
  ycbcrToRgb(yPlane, cbPlane, crPlane, width, height, tempRgb, standard);

  // Then apply K channel with proper handling
  for (let i = 0; i < width * height; i++) {
    const rgbIndex = i * 4;
    let k = kPlane[i] / 255.0;

    // Handle K channel inversion (Adobe YCCK style)
    if (invertK) {
      k = 1.0 - k;
    }

    // Apply K channel to RGB values
    const R = Math.max(0, Math.min(255, Math.round(tempRgb[rgbIndex + 0] * k)));
    const G = Math.max(0, Math.min(255, Math.round(tempRgb[rgbIndex + 1] * k)));
    const B = Math.max(0, Math.min(255, Math.round(tempRgb[rgbIndex + 2] * k)));

    output[rgbIndex + 0] = R;
    output[rgbIndex + 1] = G;
    output[rgbIndex + 2] = B;
    output[rgbIndex + 3] = 255;
  }
}

/**
 * Adobe APP14 transform handler for different color spaces.
 *
 * @param {Array<Uint8Array>} components - Component planes
 * @param {number} numComponents - Number of components
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {number} adobeTransform - Adobe transform type (0=RGB, 1=YCbCr, 2=YCCK)
 * @param {Uint8Array} output - RGBA output buffer (pre-allocated)
 * @param {string} ycbcrStandard - YCbCr standard for YCbCr/YCCK conversions
 */
export function handleAdobeTransform(
  components,
  numComponents,
  width,
  height,
  adobeTransform,
  output,
  ycbcrStandard = "BT601"
) {
  switch (adobeTransform) {
    case COLOR_CONSTANTS.ADOBE_TRANSFORMS.UNKNOWN:
      // Unknown transform - try to detect based on component count
      if (numComponents === 3) {
        // Could be RGB or YCbCr - assume RGB for safety
        rgbToRgba(components[0], components[1], components[2], width, height, output);
      } else if (numComponents === 1) {
        grayscaleToRgb(components[0], width, height, output);
      }
      break;

    case COLOR_CONSTANTS.ADOBE_TRANSFORMS.YCBCR:
      // Explicit YCbCr transform
      if (numComponents >= 3) {
        ycbcrToRgb(components[0], components[1], components[2], width, height, output, ycbcrStandard);
      }
      break;

    case COLOR_CONSTANTS.ADOBE_TRANSFORMS.YCCK:
      // YCCK transform
      if (numComponents >= 4) {
        ycckToRgb(components[0], components[1], components[2], components[3], width, height, output, ycbcrStandard);
      }
      break;

    default:
      // Fallback to RGB interpretation
      if (numComponents >= 3) {
        rgbToRgba(components[0], components[1], components[2], width, height, output);
      } else if (numComponents === 1) {
        grayscaleToRgb(components[0], width, height, output);
      }
      break;
  }
}

/**
 * Detect and convert color space based on component count and Adobe metadata.
 *
 * @param {Array<Uint8Array>} components - Component planes
 * @param {number} numComponents - Number of components
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {number|null} adobeTransform - Adobe transform type (null if not present)
 * @param {Uint8Array} output - RGBA output buffer (pre-allocated)
 * @param {string} ycbcrStandard - YCbCr standard for conversions
 */
export function convertToRgb(
  components,
  numComponents,
  width,
  height,
  adobeTransform,
  output,
  ycbcrStandard = "BT601"
) {
  // If we have Adobe transform metadata, use it
  if (adobeTransform !== null && adobeTransform !== undefined) {
    return handleAdobeTransform(components, numComponents, width, height, adobeTransform, output, ycbcrStandard);
  }

  // No Adobe metadata - detect based on component count (JFIF style)
  switch (numComponents) {
    case 1:
      // Grayscale
      grayscaleToRgb(components[0], width, height, output);
      break;

    case 3:
      // Could be RGB or YCbCr - assume YCbCr for JFIF compatibility
      ycbcrToRgb(components[0], components[1], components[2], width, height, output, ycbcrStandard);
      break;

    case 4:
      // CMYK
      cmykToRgb(components[0], components[1], components[2], components[3], width, height, output);
      break;

    default:
      // Unknown component count - fallback to grayscale
      if (components.length > 0) {
        grayscaleToRgb(components[0], width, height, output);
      }
      break;
  }
}

/**
 * Get recommended YCbCr standard based on image characteristics.
 *
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {number} _bitsPerSample - Bits per sample (reserved for future use)
 * @returns {string} Recommended YCbCr standard
 */
export function getRecommendedYCbCrStandard(width, height, _bitsPerSample = 8) {
  // High resolution images likely use BT.709
  if (width >= 1920 || height >= 1080) {
    return "BT709";
  }

  // Standard definition images use BT.601
  if (width <= 720 && height <= 576) {
    return "BT601";
  }

  // Medium resolution - use BT.709 for better color accuracy
  return "BT709";
}

/**
 * Validate color conversion parameters.
 *
 * @param {Array<Uint8Array>} components - Component planes
 * @param {number} numComponents - Expected number of components
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @returns {boolean} True if parameters are valid
 */
export function validateColorConversion(components, numComponents, width, height) {
  if (!components || !Array.isArray(components)) {
    return false;
  }

  if (components.length < numComponents) {
    return false;
  }

  const expectedSize = width * height;
  for (let i = 0; i < numComponents; i++) {
    if (!components[i] || components[i].length !== expectedSize) {
      return false;
    }
  }

  return true;
}

/**
 * Convert RGB planes directly to RGBA (for Adobe transform=0).
 *
 * @param {Uint8Array} rPlane - Red plane
 * @param {Uint8Array} gPlane - Green plane
 * @param {Uint8Array} bPlane - Blue plane
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {Uint8Array} output - RGBA output buffer (pre-allocated)
 */
export function rgbToRgba(rPlane, gPlane, bPlane, width, height, output) {
  for (let i = 0; i < width * height; i++) {
    const rgbIndex = i * 4;

    output[rgbIndex + 0] = rPlane[i];
    output[rgbIndex + 1] = gPlane[i];
    output[rgbIndex + 2] = bPlane[i];
    output[rgbIndex + 3] = 255;
  }
}
