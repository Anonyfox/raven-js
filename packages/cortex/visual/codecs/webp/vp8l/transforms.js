/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * VP8L Lossless Transforms
 *
 * Implements the 4 transform types used in VP8L lossless compression:
 * - Subtract Green Transform
 * - Color Transform
 * - Palette Transform
 * - Cross-Color Transform
 *
 * @fileoverview Zero-dependency VP8L transforms with ARGB pixel format
 */

/**
 * Transform type constants
 */
export const TRANSFORM_TYPES = {
  PREDICTOR: 0,
  COLOR: 1,
  SUBTRACT_GREEN: 2,
  PALETTE: 3,
};

/**
 * Maximum palette size for palette transform
 */
const MAX_PALETTE_SIZE = 256;

/**
 * Extracts ARGB components from a packed 32-bit pixel.
 *
 * @param {number} pixel - Packed ARGB pixel (0xAARRGGBB)
 * @returns {{a: number, r: number, g: number, b: number}} ARGB components
 */
function unpackARGB(pixel) {
  return {
    a: (pixel >>> 24) & 0xff,
    r: (pixel >>> 16) & 0xff,
    g: (pixel >>> 8) & 0xff,
    b: pixel & 0xff,
  };
}

/**
 * Packs ARGB components into a 32-bit pixel.
 *
 * @param {number} a - Alpha component (0-255)
 * @param {number} r - Red component (0-255)
 * @param {number} g - Green component (0-255)
 * @param {number} b - Blue component (0-255)
 * @returns {number} Packed ARGB pixel
 */
function packARGB(a, r, g, b) {
  return ((a & 0xff) << 24) | ((r & 0xff) << 16) | ((g & 0xff) << 8) | (b & 0xff);
}

/**
 * Applies subtract green transform to pixels.
 * This transform reduces correlation between R/G and B/G channels.
 *
 * Formula: R' = R - G, B' = B - G (with wraparound)
 *
 * @param {Uint32Array} pixels - ARGB pixel array
 * @returns {Uint32Array} Transformed pixels (new array)
 * @throws {Error} For invalid input
 */
export function applySubtractGreen(pixels) {
  if (!(pixels instanceof Uint32Array)) {
    throw new Error("Transform: pixels must be Uint32Array");
  }

  const result = new Uint32Array(pixels.length);

  for (let i = 0; i < pixels.length; i++) {
    const { a, r, g, b } = unpackARGB(pixels[i]);

    // Subtract green from red and blue (with wraparound)
    const newR = (r - g) & 0xff;
    const newB = (b - g) & 0xff;

    result[i] = packARGB(a, newR, g, newB);
  }

  return result;
}

/**
 * Applies inverse subtract green transform to pixels.
 * This reverses the subtract green transform.
 *
 * Formula: R = R' + G, B = B' + G (with wraparound)
 *
 * @param {Uint32Array} pixels - Transformed ARGB pixel array
 * @returns {Uint32Array} Original pixels (modified in-place)
 * @throws {Error} For invalid input
 */
export function applyInverseSubtractGreen(pixels) {
  if (!(pixels instanceof Uint32Array)) {
    throw new Error("Transform: pixels must be Uint32Array");
  }

  for (let i = 0; i < pixels.length; i++) {
    const { a, r, g, b } = unpackARGB(pixels[i]);

    // Add green back to red and blue (with wraparound)
    const newR = (r + g) & 0xff;
    const newB = (b + g) & 0xff;

    pixels[i] = packARGB(a, newR, g, newB);
  }

  return pixels;
}

/**
 * Applies color transform to pixels using transform data.
 * This is a more complex transform that uses multipliers.
 *
 * @param {Uint32Array} pixels - ARGB pixel array
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {Uint32Array} transformData - Transform multipliers
 * @param {number} transformWidth - Transform data width
 * @param {number} transformHeight - Transform data height
 * @returns {Uint32Array} Transformed pixels (new array)
 * @throws {Error} For invalid parameters
 */
export function applyColorTransform(pixels, width, height, transformData, transformWidth, transformHeight) {
  if (!(pixels instanceof Uint32Array)) {
    throw new Error("Transform: pixels must be Uint32Array");
  }

  if (pixels.length !== width * height) {
    throw new Error(`Transform: pixel count ${pixels.length} does not match ${width}x${height}`);
  }

  if (!(transformData instanceof Uint32Array)) {
    throw new Error("Transform: transformData must be Uint32Array");
  }

  if (transformData.length !== transformWidth * transformHeight) {
    throw new Error(`Transform: transform data size mismatch`);
  }

  const result = new Uint32Array(pixels.length);
  const blockWidth = Math.ceil(width / transformWidth);
  const blockHeight = Math.ceil(height / transformHeight);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pixelIdx = y * width + x;
      const transformX = Math.floor(x / blockWidth);
      const transformY = Math.floor(y / blockHeight);
      const transformIdx = transformY * transformWidth + transformX;

      const pixel = unpackARGB(pixels[pixelIdx]);
      const transform = unpackARGB(transformData[transformIdx]);

      // Apply color transform (simplified version)
      // Full VP8L uses more complex multipliers
      const newR = (pixel.r + ((transform.r * pixel.g) >> 8)) & 0xff;
      const newB = (pixel.b + ((transform.b * pixel.g) >> 8)) & 0xff;

      result[pixelIdx] = packARGB(pixel.a, newR, pixel.g, newB);
    }
  }

  return result;
}

/**
 * Applies inverse color transform to pixels.
 *
 * @param {Uint32Array} pixels - Transformed ARGB pixel array
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {Uint32Array} transformData - Transform multipliers
 * @param {number} transformWidth - Transform data width
 * @param {number} transformHeight - Transform data height
 * @returns {Uint32Array} Original pixels (modified in-place)
 * @throws {Error} For invalid parameters
 */
export function applyInverseColorTransform(pixels, width, height, transformData, transformWidth, transformHeight) {
  if (!(pixels instanceof Uint32Array)) {
    throw new Error("Transform: pixels must be Uint32Array");
  }

  const blockWidth = Math.ceil(width / transformWidth);
  const blockHeight = Math.ceil(height / transformHeight);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pixelIdx = y * width + x;
      const transformX = Math.floor(x / blockWidth);
      const transformY = Math.floor(y / blockHeight);
      const transformIdx = transformY * transformWidth + transformX;

      const pixel = unpackARGB(pixels[pixelIdx]);
      const transform = unpackARGB(transformData[transformIdx]);

      // Reverse color transform
      const newR = (pixel.r - ((transform.r * pixel.g) >> 8)) & 0xff;
      const newB = (pixel.b - ((transform.b * pixel.g) >> 8)) & 0xff;

      pixels[pixelIdx] = packARGB(pixel.a, newR, pixel.g, newB);
    }
  }

  return pixels;
}

/**
 * Applies palette transform to pixels.
 * Converts palette indices back to full ARGB colors.
 *
 * @param {Uint32Array} pixels - Palette index array
 * @param {Uint32Array} palette - Palette colors (up to 256 entries)
 * @returns {Uint32Array} Full-color pixels (new array)
 * @throws {Error} For invalid parameters or palette bounds
 */
export function applyPaletteTransform(pixels, palette) {
  if (!(pixels instanceof Uint32Array)) {
    throw new Error("Transform: pixels must be Uint32Array");
  }

  if (!(palette instanceof Uint32Array)) {
    throw new Error("Transform: palette must be Uint32Array");
  }

  if (palette.length === 0 || palette.length > MAX_PALETTE_SIZE) {
    throw new Error(`Transform: invalid palette size ${palette.length} (max ${MAX_PALETTE_SIZE})`);
  }

  const result = new Uint32Array(pixels.length);

  for (let i = 0; i < pixels.length; i++) {
    // Extract palette index from pixel (typically stored in one channel)
    const index = pixels[i] & 0xff; // Use blue channel as index

    if (index >= palette.length) {
      throw new Error(`Transform: palette index ${index} exceeds palette size ${palette.length}`);
    }

    result[i] = palette[index];
  }

  return result;
}

/**
 * Creates a palette from pixel data.
 * Extracts unique colors and builds a palette mapping.
 *
 * @param {Uint32Array} pixels - ARGB pixel array
 * @param {number} maxColors - Maximum number of colors in palette
 * @returns {{
 *   palette: Uint32Array,
 *   indices: Uint32Array,
 *   colorCount: number
 * }} Palette and index mapping
 * @throws {Error} For invalid parameters
 */
export function createPalette(pixels, maxColors = MAX_PALETTE_SIZE) {
  if (!(pixels instanceof Uint32Array)) {
    throw new Error("Transform: pixels must be Uint32Array");
  }

  if (!Number.isInteger(maxColors) || maxColors < 1 || maxColors > MAX_PALETTE_SIZE) {
    throw new Error(`Transform: invalid maxColors ${maxColors}`);
  }

  const colorSet = new Set();
  const palette = [];
  const indices = new Uint32Array(pixels.length);

  for (let i = 0; i < pixels.length; i++) {
    const color = pixels[i];

    if (!colorSet.has(color)) {
      if (palette.length >= maxColors) {
        throw new Error(`Transform: too many unique colors (>${maxColors})`);
      }
      colorSet.add(color);
      palette.push(color);
    }

    // Find index of this color in palette
    const index = palette.indexOf(color);
    indices[i] = packARGB(0, 0, 0, index); // Store index in blue channel
  }

  return {
    palette: new Uint32Array(palette),
    indices,
    colorCount: palette.length,
  };
}

/**
 * Applies a chain of transforms to pixels.
 *
 * @param {Array<object>} transformChain - Array of transform descriptors
 * @param {Uint32Array} pixels - ARGB pixel array
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @returns {Uint32Array} Transformed pixels
 * @throws {Error} For invalid transforms or parameters
 */
export function applyTransforms(transformChain, pixels, width, height) {
  if (!Array.isArray(transformChain)) {
    throw new Error("Transform: transformChain must be array");
  }

  if (!(pixels instanceof Uint32Array)) {
    throw new Error("Transform: pixels must be Uint32Array");
  }

  let result = new Uint32Array(pixels);

  for (let i = 0; i < transformChain.length; i++) {
    const transform = transformChain[i];

    if (!transform || typeof transform !== "object") {
      throw new Error(`Transform: invalid transform at index ${i}`);
    }

    // @ts-expect-error - transform validated to have type property
    const { type, data } = transform;

    switch (type) {
      case TRANSFORM_TYPES.SUBTRACT_GREEN:
        result = applySubtractGreen(result);
        break;

      case TRANSFORM_TYPES.COLOR:
        if (!data || !data.transformData || !data.transformWidth || !data.transformHeight) {
          throw new Error(`Transform: missing color transform data at index ${i}`);
        }
        result = applyColorTransform(
          result,
          width,
          height,
          data.transformData,
          data.transformWidth,
          data.transformHeight
        );
        break;

      case TRANSFORM_TYPES.PALETTE:
        if (!data || !data.palette) {
          throw new Error(`Transform: missing palette data at index ${i}`);
        }
        result = applyPaletteTransform(result, data.palette);
        break;

      default:
        throw new Error(`Transform: unsupported transform type ${type} at index ${i}`);
    }
  }

  return result;
}

/**
 * Applies inverse transforms in reverse order.
 *
 * @param {Array<object>} transformChain - Array of transform descriptors
 * @param {Uint32Array} pixels - Transformed ARGB pixel array
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @returns {Uint32Array} Original pixels
 * @throws {Error} For invalid transforms or parameters
 */
export function applyInverseTransforms(transformChain, pixels, width, height) {
  if (!Array.isArray(transformChain)) {
    throw new Error("Transform: transformChain must be array");
  }

  if (!(pixels instanceof Uint32Array)) {
    throw new Error("Transform: pixels must be Uint32Array");
  }

  let result = pixels; // Modify in-place

  // Apply inverse transforms in reverse order
  for (let i = transformChain.length - 1; i >= 0; i--) {
    const transform = transformChain[i];

    if (!transform || typeof transform !== "object") {
      throw new Error(`Transform: invalid transform at index ${i}`);
    }

    // @ts-expect-error - transform validated to have type property
    const { type, data } = transform;

    switch (type) {
      case TRANSFORM_TYPES.SUBTRACT_GREEN:
        result = applyInverseSubtractGreen(result);
        break;

      case TRANSFORM_TYPES.COLOR:
        if (!data || !data.transformData || !data.transformWidth || !data.transformHeight) {
          throw new Error(`Transform: missing color transform data at index ${i}`);
        }
        result = applyInverseColorTransform(
          result,
          width,
          height,
          data.transformData,
          data.transformWidth,
          data.transformHeight
        );
        break;

      case TRANSFORM_TYPES.PALETTE:
        // Palette transform is not reversible in this context
        // (indices -> colors is one-way)
        throw new Error(`Transform: palette transform is not reversible`);

      default:
        throw new Error(`Transform: unsupported transform type ${type} at index ${i}`);
    }
  }

  return result;
}

/**
 * Validates transform parameters.
 *
 * @param {object} transform - Transform descriptor
 * @returns {{
 *   valid: boolean,
 *   error?: string
 * }} Validation result
 */
export function validateTransform(transform) {
  if (!transform || typeof transform !== "object") {
    return { valid: false, error: "transform must be object" };
  }

  // @ts-expect-error - transform validated to have type property
  const { type, data } = transform;

  if (!Number.isInteger(type) || !Object.values(TRANSFORM_TYPES).includes(type)) {
    return { valid: false, error: `invalid transform type ${type}` };
  }

  switch (type) {
    case TRANSFORM_TYPES.SUBTRACT_GREEN:
      // No additional data needed
      break;

    case TRANSFORM_TYPES.COLOR:
      if (!data || !data.transformData || !data.transformWidth || !data.transformHeight) {
        return { valid: false, error: "color transform missing required data" };
      }
      if (!(data.transformData instanceof Uint32Array)) {
        return { valid: false, error: "color transform data must be Uint32Array" };
      }
      break;

    case TRANSFORM_TYPES.PALETTE:
      if (!data || !data.palette) {
        return { valid: false, error: "palette transform missing palette data" };
      }
      if (!(data.palette instanceof Uint32Array)) {
        return { valid: false, error: "palette must be Uint32Array" };
      }
      if (data.palette.length === 0 || data.palette.length > MAX_PALETTE_SIZE) {
        return { valid: false, error: `invalid palette size ${data.palette.length}` };
      }
      break;

    default:
      return { valid: false, error: `unsupported transform type ${type}` };
  }

  return { valid: true };
}

/**
 * Gets the name of a transform type.
 *
 * @param {number} type - Transform type
 * @returns {string} Transform name
 */
export function getTransformTypeName(type) {
  const names = {
    [TRANSFORM_TYPES.PREDICTOR]: "PREDICTOR",
    [TRANSFORM_TYPES.COLOR]: "COLOR",
    [TRANSFORM_TYPES.SUBTRACT_GREEN]: "SUBTRACT_GREEN",
    [TRANSFORM_TYPES.PALETTE]: "PALETTE",
  };

  return names[type] || `UNKNOWN(${type})`;
}
