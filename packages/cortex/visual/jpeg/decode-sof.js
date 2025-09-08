/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file JPEG Start of Frame (SOF) decoder with full specification support.
 *
 * Decodes SOF marker segments according to ITU-T T.81 specification.
 * Handles all SOF variants: baseline, extended, progressive, lossless,
 * differential, and arithmetic coding modes. Validates sampling factors,
 * component configurations, and precision requirements.
 */

/**
 * SOF marker types and their characteristics.
 * Maps marker codes to processing modes and capabilities.
 */
export const SOF_TYPES = {
  // Sequential DCT-based modes
  SOF0: {
    code: 0xc0,
    name: "Baseline DCT",
    mode: "sequential",
    coding: "huffman",
    precision: [8],
    differential: false,
    lossless: false,
    progressive: false,
  },
  SOF1: {
    code: 0xc1,
    name: "Extended Sequential DCT",
    mode: "sequential",
    coding: "huffman",
    precision: [8, 12],
    differential: false,
    lossless: false,
    progressive: false,
  },
  SOF2: {
    code: 0xc2,
    name: "Progressive DCT",
    mode: "progressive",
    coding: "huffman",
    precision: [8, 12],
    differential: false,
    lossless: false,
    progressive: true,
  },
  SOF3: {
    code: 0xc3,
    name: "Lossless Sequential",
    mode: "sequential",
    coding: "huffman",
    precision: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
    differential: false,
    lossless: true,
    progressive: false,
  },

  // Differential modes
  SOF5: {
    code: 0xc5,
    name: "Differential Sequential DCT",
    mode: "sequential",
    coding: "huffman",
    precision: [8, 12],
    differential: true,
    lossless: false,
    progressive: false,
  },
  SOF6: {
    code: 0xc6,
    name: "Differential Progressive DCT",
    mode: "progressive",
    coding: "huffman",
    precision: [8, 12],
    differential: true,
    lossless: false,
    progressive: true,
  },
  SOF7: {
    code: 0xc7,
    name: "Differential Lossless Sequential",
    mode: "sequential",
    coding: "huffman",
    precision: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
    differential: true,
    lossless: true,
    progressive: false,
  },

  // Arithmetic coding modes
  SOF9: {
    code: 0xc9,
    name: "Extended Sequential DCT (Arithmetic)",
    mode: "sequential",
    coding: "arithmetic",
    precision: [8, 12],
    differential: false,
    lossless: false,
    progressive: false,
  },
  SOF10: {
    code: 0xca,
    name: "Progressive DCT (Arithmetic)",
    mode: "progressive",
    coding: "arithmetic",
    precision: [8, 12],
    differential: false,
    lossless: false,
    progressive: true,
  },
  SOF11: {
    code: 0xcb,
    name: "Lossless Sequential (Arithmetic)",
    mode: "sequential",
    coding: "arithmetic",
    precision: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
    differential: false,
    lossless: true,
    progressive: false,
  },

  // Differential arithmetic modes
  SOF13: {
    code: 0xcd,
    name: "Differential Sequential DCT (Arithmetic)",
    mode: "sequential",
    coding: "arithmetic",
    precision: [8, 12],
    differential: true,
    lossless: false,
    progressive: false,
  },
  SOF14: {
    code: 0xce,
    name: "Differential Progressive DCT (Arithmetic)",
    mode: "progressive",
    coding: "arithmetic",
    precision: [8, 12],
    differential: true,
    lossless: false,
    progressive: true,
  },
  SOF15: {
    code: 0xcf,
    name: "Differential Lossless Sequential (Arithmetic)",
    mode: "sequential",
    coding: "arithmetic",
    precision: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
    differential: true,
    lossless: true,
    progressive: false,
  },
};

/**
 * Common chroma subsampling configurations.
 * Maps sampling factor combinations to standard names.
 */
export const CHROMA_SUBSAMPLING = {
  "2,2,1,1,1,1": "4:2:0", // Y(2,2), Cb(1,1), Cr(1,1)
  "2,1,1,1,1,1": "4:2:2", // Y(2,1), Cb(1,1), Cr(1,1)
  "1,1,1,1,1,1": "4:4:4", // Y(1,1), Cb(1,1), Cr(1,1)
  "4,1,1,1,1,1": "4:1:1", // Y(4,1), Cb(1,1), Cr(1,1)
  "1,2,1,1,1,1": "4:4:0", // Y(1,2), Cb(1,1), Cr(1,1) - rare
};

/**
 * Get SOF type information from marker code.
 *
 * @param {number} markerCode - SOF marker code (0xC0-0xCF)
 * @returns {Object|null} SOF type info or null if not a SOF marker
 *
 * @example
 * const sofType = getSOFType(0xC0);
 * console.log(sofType.name); // "Baseline DCT"
 * console.log(sofType.progressive); // false
 */
export function getSOFType(markerCode) {
  for (const sofType of Object.values(SOF_TYPES)) {
    if (sofType.code === markerCode) {
      return sofType;
    }
  }
  return null;
}

/**
 * Check if marker code represents a SOF marker.
 *
 * @param {number} markerCode - JPEG marker code
 * @returns {boolean} True if marker is a SOF variant
 *
 * @example
 * console.log(isSOFMarker(0xC0)); // true
 * console.log(isSOFMarker(0xC4)); // false (DHT)
 */
export function isSOFMarker(markerCode) {
  return getSOFType(markerCode) !== null;
}

/**
 * Read 16-bit big-endian unsigned integer from buffer.
 *
 * @param {Uint8Array} buffer - Buffer to read from
 * @param {number} offset - Byte offset to read from
 * @returns {number} 16-bit unsigned integer
 * @throws {Error} If offset is out of bounds
 *
 * @private
 */
function readUint16BE(buffer, offset) {
  if (offset + 1 >= buffer.length) {
    throw new Error(`Cannot read uint16 at offset ${offset}: buffer too short`);
  }
  return (buffer[offset] << 8) | buffer[offset + 1];
}

/**
 * Validate SOF component configuration.
 * Ensures component parameters are within specification limits.
 *
 * @param {Object} component - Component configuration
 * @param {number} component.id - Component identifier (1-255)
 * @param {number} component.horizontalSampling - Horizontal sampling factor (1-4)
 * @param {number} component.verticalSampling - Vertical sampling factor (1-4)
 * @param {number} component.quantizationTable - Quantization table index (0-3)
 * @param {number} componentIndex - Component index for error messages
 * @throws {Error} If component configuration is invalid
 *
 * @private
 */
function validateComponent(component, componentIndex) {
  const { id, horizontalSampling, verticalSampling, quantizationTable } = component;

  // Validate component ID
  if (id < 1 || id > 255) {
    throw new Error(`Component ${componentIndex}: invalid ID ${id} (must be 1-255)`);
  }

  // Validate horizontal sampling factor
  if (horizontalSampling < 1 || horizontalSampling > 4) {
    throw new Error(`Component ${componentIndex}: invalid horizontal sampling ${horizontalSampling} (must be 1-4)`);
  }

  // Validate vertical sampling factor
  if (verticalSampling < 1 || verticalSampling > 4) {
    throw new Error(`Component ${componentIndex}: invalid vertical sampling ${verticalSampling} (must be 1-4)`);
  }

  // Validate quantization table index
  if (quantizationTable < 0 || quantizationTable > 3) {
    throw new Error(`Component ${componentIndex}: invalid quantization table ${quantizationTable} (must be 0-3)`);
  }
}

/**
 * Calculate maximum sampling factors across all components.
 * Used for determining MCU (Minimum Coded Unit) dimensions.
 *
 * @param {Array<{horizontalSampling: number, verticalSampling: number}>} components - Array of component configurations
 * @returns {{maxHorizontal: number, maxVertical: number}} Maximum sampling factors
 *
 * @private
 */
function getMaxSamplingFactors(components) {
  let maxHorizontal = 1;
  let maxVertical = 1;

  for (const component of components) {
    maxHorizontal = Math.max(maxHorizontal, component.horizontalSampling);
    maxVertical = Math.max(maxVertical, component.verticalSampling);
  }

  return { maxHorizontal, maxVertical };
}

/**
 * Determine chroma subsampling format from component sampling factors.
 * Recognizes common subsampling patterns used in JPEG.
 *
 * @param {Array<{horizontalSampling: number, verticalSampling: number}>} components - Array of component configurations
 * @returns {string} Subsampling format name or 'Custom' if non-standard
 *
 * @example
 * // For YCbCr 4:2:0 image
 * const subsampling = getChromaSubsampling(components);
 * console.log(subsampling); // "4:2:0"
 *
 * @private
 */
function getChromaSubsampling(components) {
  if (components.length !== 3) {
    return "Custom"; // Not standard YCbCr
  }

  // Create sampling factor signature
  const signature = components.map((c) => `${c.horizontalSampling},${c.verticalSampling}`).join(",");

  return (
    /** @type {string} */ (CHROMA_SUBSAMPLING[/** @type {keyof typeof CHROMA_SUBSAMPLING} */ (signature)]) || "Custom"
  );
}

/**
 * Calculate MCU (Minimum Coded Unit) dimensions.
 * MCU is the smallest unit of data that can be decoded independently.
 *
 * @param {{maxHorizontal: number, maxVertical: number}} maxSampling - Maximum sampling factors
 * @returns {{width: number, height: number}} MCU dimensions in pixels
 *
 * @private
 */
function calculateMCUDimensions(maxSampling) {
  // Each sampling unit is 8x8 pixels (one DCT block)
  return {
    width: maxSampling.maxHorizontal * 8,
    height: maxSampling.maxVertical * 8,
  };
}

/**
 * Calculate total number of MCUs in image.
 * Accounts for partial MCUs at image boundaries.
 *
 * @param {number} imageWidth - Image width in pixels
 * @param {number} imageHeight - Image height in pixels
 * @param {{width: number, height: number}} mcuDimensions - MCU dimensions
 * @returns {{horizontal: number, vertical: number, total: number}} MCU counts
 *
 * @private
 */
function calculateMCUCounts(imageWidth, imageHeight, mcuDimensions) {
  const horizontal = Math.ceil(imageWidth / mcuDimensions.width);
  const vertical = Math.ceil(imageHeight / mcuDimensions.height);

  return {
    horizontal,
    vertical,
    total: horizontal * vertical,
  };
}

/**
 * Decode JPEG Start of Frame (SOF) marker.
 *
 * Parses SOF marker data and extracts frame parameters including image
 * dimensions, component configuration, and sampling factors. Validates
 * all parameters against JPEG specification requirements.
 *
 * @param {Uint8Array} data - SOF marker data
 * @param {number} markerCode - SOF marker code (0xC0-0xCF)
 * @returns {{precision: number, width: number, height: number, componentCount: number, components: Array<{id: number, horizontalSampling: number, verticalSampling: number, quantizationTable: number}>, sofType: Object, maxSampling: {maxHorizontal: number, maxVertical: number}, mcuDimensions: {width: number, height: number}, mcuCounts: {horizontal: number, vertical: number, total: number}, chromaSubsampling: string}} Decoded SOF information
 * @throws {Error} If SOF data is invalid or parameters violate JPEG specification
 *
 * @example
 * // Decode SOF0 marker
 * const sof = decodeSOF(sofData, 0xC0);
 * console.log(`${sof.width}x${sof.height}, ${sof.componentCount} components`);
 * console.log(`Subsampling: ${sof.chromaSubsampling}`);
 *
 * @example
 * // Check for progressive JPEG
 * const sof = decodeSOF(sofData, markerCode);
 * if (sof.sofType.progressive) {
 *   console.log('Progressive JPEG detected');
 * }
 */
export function decodeSOF(data, markerCode) {
  if (!(data instanceof Uint8Array)) {
    throw new TypeError("Expected data to be Uint8Array");
  }

  if (typeof markerCode !== "number") {
    throw new TypeError("Expected markerCode to be number");
  }

  // Get SOF type information
  const sofType = getSOFType(markerCode);
  if (!sofType) {
    throw new Error(`Invalid SOF marker code: 0x${markerCode.toString(16).toUpperCase()}`);
  }

  // Minimum SOF size: 1 (precision) + 2 (height) + 2 (width) + 1 (component count) = 6 bytes
  if (data.length < 6) {
    throw new Error(`SOF data too short: need at least 6 bytes, got ${data.length}`);
  }

  let offset = 0;

  // Parse precision (P)
  const precision = data[offset++];

  // Validate precision for SOF type
  if (!(/** @type {any} */ (sofType).precision.includes(precision))) {
    throw new Error(
      `Invalid precision ${precision} for ${/** @type {any} */ (sofType).name} (valid: ${/** @type {any} */ (sofType).precision.join(", ")})`
    );
  }

  // Parse image dimensions
  const height = readUint16BE(data, offset);
  offset += 2;
  const width = readUint16BE(data, offset);
  offset += 2;

  // Validate dimensions
  if (width === 0 || width > 65535) {
    throw new Error(`Invalid width: ${width} (must be 1-65535)`);
  }

  if (height === 0 || height > 65535) {
    throw new Error(`Invalid height: ${height} (must be 1-65535)`);
  }

  // Parse component count
  const componentCount = data[offset++];

  // Validate component count
  if (componentCount < 1 || componentCount > 255) {
    throw new Error(`Invalid component count: ${componentCount} (must be 1-255)`);
  }

  // Common component counts: 1 (grayscale), 3 (YCbCr), 4 (CMYK)
  if (componentCount > 4) {
    console.warn(`Unusual component count: ${componentCount} (typically 1-4)`);
  }

  // Validate remaining data length
  const expectedLength = 6 + componentCount * 3;
  if (data.length !== expectedLength) {
    throw new Error(`SOF data length mismatch: expected ${expectedLength} bytes, got ${data.length}`);
  }

  // Parse components
  const components = [];
  const componentIds = new Set();

  for (let i = 0; i < componentCount; i++) {
    if (offset + 3 > data.length) {
      throw new Error(`Incomplete component ${i}: need 3 bytes, got ${data.length - offset}`);
    }

    // Parse component parameters
    const id = data[offset++];
    const samplingFactors = data[offset++];
    const quantizationTable = data[offset++];

    // Extract sampling factors (Hi in upper 4 bits, Vi in lower 4 bits)
    const horizontalSampling = (samplingFactors >> 4) & 0x0f;
    const verticalSampling = samplingFactors & 0x0f;

    const component = {
      id,
      horizontalSampling,
      verticalSampling,
      quantizationTable,
    };

    // Validate component
    validateComponent(component, i);

    // Check for duplicate component IDs
    if (componentIds.has(id)) {
      throw new Error(`Duplicate component ID: ${id}`);
    }
    componentIds.add(id);

    components.push(component);
  }

  // Calculate derived properties
  const maxSampling = getMaxSamplingFactors(components);
  const mcuDimensions = calculateMCUDimensions(maxSampling);
  const mcuCounts = calculateMCUCounts(width, height, mcuDimensions);
  const chromaSubsampling = getChromaSubsampling(components);

  return {
    precision,
    width,
    height,
    componentCount,
    components,
    sofType,
    maxSampling,
    mcuDimensions,
    mcuCounts,
    chromaSubsampling,
  };
}

/**
 * Get component by ID from SOF data.
 * Utility function to find specific components by their identifier.
 *
 * @param {Array<{id: number}>} components - Array of components from SOF
 * @param {number} componentId - Component ID to find
 * @returns {Object|null} Component object or null if not found
 *
 * @example
 * // Find luminance component (typically ID 1)
 * const yComponent = getComponentById(sof.components, 1);
 * if (yComponent) {
 *   console.log(`Y sampling: ${yComponent.horizontalSampling}x${yComponent.verticalSampling}`);
 * }
 */
export function getComponentById(components, componentId) {
  if (!Array.isArray(components)) {
    throw new TypeError("Expected components to be an array");
  }

  if (typeof componentId !== "number") {
    throw new TypeError("Expected componentId to be a number");
  }

  return components.find((component) => component.id === componentId) || null;
}

/**
 * Calculate blocks per component in an MCU.
 * Determines how many 8x8 blocks each component contributes to an MCU.
 *
 * @param {{horizontalSampling: number, verticalSampling: number}} component - Component configuration
 * @param {{maxHorizontal: number, maxVertical: number}} maxSampling - Maximum sampling factors
 * @returns {number} Number of blocks for this component in each MCU
 *
 * @example
 * // For Y component in 4:2:0 (Y=2x2, max=2x2)
 * const blocks = getComponentBlocksPerMCU(yComponent, maxSampling);
 * console.log(blocks); // 4 (2x2 blocks)
 */
export function getComponentBlocksPerMCU(component, maxSampling) {
  if (!component || typeof component !== "object") {
    throw new TypeError("Expected component to be an object");
  }

  if (!maxSampling || typeof maxSampling !== "object") {
    throw new TypeError("Expected maxSampling to be an object");
  }

  return component.horizontalSampling * component.verticalSampling;
}

/**
 * Get SOF summary information for debugging.
 * Provides human-readable summary of SOF parameters.
 *
 * @param {{sofType: any, width: number, height: number, precision: number, componentCount: number, chromaSubsampling: string, mcuDimensions: {width: number, height: number}, mcuCounts: {total: number}}} sof - Decoded SOF data
 * @returns {Object} Summary information
 *
 * @example
 * const summary = getSOFSummary(sof);
 * console.log(`${summary.description}`);
 * console.log(`MCU: ${summary.mcuInfo}`);
 */
export function getSOFSummary(sof) {
  const { sofType, width, height, precision, componentCount, chromaSubsampling, mcuDimensions, mcuCounts } = sof;

  return {
    description: `${width}x${height} ${sofType.name}, ${precision}-bit, ${componentCount} components`,
    chromaInfo: `Chroma subsampling: ${chromaSubsampling}`,
    mcuInfo: `MCU: ${mcuDimensions.width}x${mcuDimensions.height} pixels, ${mcuCounts.total} total MCUs`,
    features: {
      progressive: sofType.progressive,
      lossless: sofType.lossless,
      differential: sofType.differential,
      arithmetic: sofType.coding === "arithmetic",
    },
  };
}
