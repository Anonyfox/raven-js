/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file JPEG Start of Scan (SOS) decoder implementation.
 *
 * Implements ITU-T T.81 Section B.2.3 Start of Scan parsing with progressive
 * JPEG support, spectral selection, successive approximation, and component
 * interleaving validation. Handles all scan types from sequential to progressive.
 */

/**
 * Maximum number of components allowed in a single scan.
 * ITU-T T.81 constraint for JPEG baseline and extended.
 *
 * @type {number}
 */
export const MAX_COMPONENTS_PER_SCAN = 4;

/**
 * Maximum spectral coefficient index (0-63 for 8x8 DCT blocks).
 * ITU-T T.81 Section A.1.1 constraint.
 *
 * @type {number}
 */
export const MAX_SPECTRAL_INDEX = 63;

/**
 * Maximum Huffman table ID (0-3).
 * ITU-T T.81 Section B.2.4.1 constraint.
 *
 * @type {number}
 */
export const MAX_TABLE_ID = 3;

/**
 * Scan type enumeration for different JPEG scan modes.
 * Used for validation and processing logic selection.
 *
 * @type {{SEQUENTIAL: string, PROGRESSIVE_DC: string, PROGRESSIVE_AC: string, PROGRESSIVE_REFINEMENT: string, LOSSLESS: string}}
 */
export const SCAN_TYPE = {
  /** Sequential scan with all coefficients (Ss=0, Se=63) */
  SEQUENTIAL: "sequential",
  /** Progressive DC-only scan (Ss=0, Se=0) */
  PROGRESSIVE_DC: "progressive_dc",
  /** Progressive AC spectral selection (Ss>0 or Se<63) */
  PROGRESSIVE_AC: "progressive_ac",
  /** Progressive successive approximation refinement */
  PROGRESSIVE_REFINEMENT: "progressive_refinement",
  /** Lossless scan (different semantics) */
  LOSSLESS: "lossless",
};

/**
 * Validate component selector against SOF frame components.
 * Ensures component exists and is properly defined.
 *
 * @param {number} componentId - Component selector from SOS
 * @param {Array<{id: number}>} frameComponents - Components from SOF frame
 * @returns {Object} Component object from frame
 * @throws {Error} If component not found or invalid
 *
 * @example
 * const component = validateComponentSelector(1, sofComponents);
 * console.log(`Component ${component.id}: ${component.horizontalSampling}x${component.verticalSampling}`);
 */
export function validateComponentSelector(componentId, frameComponents) {
  if (!Array.isArray(frameComponents)) {
    throw new TypeError("Expected frameComponents to be an array");
  }

  if (typeof componentId !== "number" || componentId < 0 || componentId > 255) {
    throw new Error(`Invalid component selector: ${componentId} (must be 0-255)`);
  }

  const component = frameComponents.find((c) => c.id === componentId);
  if (!component) {
    const availableIds = frameComponents.map((c) => c.id).join(", ");
    throw new Error(`Component ${componentId} not found in frame (available: ${availableIds})`);
  }

  return component;
}

/**
 * Validate Huffman table selectors against available tables.
 * Ensures required DC/AC tables are defined and accessible.
 *
 * @param {number} dcTableId - DC Huffman table ID (0-3)
 * @param {number} acTableId - AC Huffman table ID (0-3)
 * @param {Array<{class: number, id: number}>} huffmanTables - Available Huffman tables
 * @param {boolean} requireAC - Whether AC table is required (false for DC-only scans)
 * @throws {Error} If required tables are missing or invalid
 *
 * @example
 * validateHuffmanTables(0, 0, dhtTables, true); // Validate both DC and AC tables
 * validateHuffmanTables(0, 0, dhtTables, false); // DC-only scan, AC table optional
 */
export function validateHuffmanTables(dcTableId, acTableId, huffmanTables, requireAC = true) {
  if (!Array.isArray(huffmanTables)) {
    throw new TypeError("Expected huffmanTables to be an array");
  }

  // Validate table IDs
  if (typeof dcTableId !== "number" || dcTableId < 0 || dcTableId > MAX_TABLE_ID) {
    throw new Error(`Invalid DC table ID: ${dcTableId} (must be 0-${MAX_TABLE_ID})`);
  }

  if (typeof acTableId !== "number" || acTableId < 0 || acTableId > MAX_TABLE_ID) {
    throw new Error(`Invalid AC table ID: ${acTableId} (must be 0-${MAX_TABLE_ID})`);
  }

  // Find DC table (class 0)
  const dcTable = huffmanTables.find((t) => t.class === 0 && t.id === dcTableId);
  if (!dcTable) {
    const availableDC = huffmanTables.filter((t) => t.class === 0).map((t) => t.id);
    throw new Error(
      `DC Huffman table ${dcTableId} not found (available DC tables: ${availableDC.join(", ") || "none"})`
    );
  }

  // Find AC table (class 1) if required
  if (requireAC) {
    const acTable = huffmanTables.find((t) => t.class === 1 && t.id === acTableId);
    if (!acTable) {
      const availableAC = huffmanTables.filter((t) => t.class === 1).map((t) => t.id);
      throw new Error(
        `AC Huffman table ${acTableId} not found (available AC tables: ${availableAC.join(", ") || "none"})`
      );
    }
  }
}

/**
 * Validate spectral selection parameters for progressive JPEG.
 * Ensures Ss/Se are within valid ranges and follow JPEG constraints.
 *
 * @param {number} startSpectral - Start of spectral selection (Ss)
 * @param {number} endSpectral - End of spectral selection (Se)
 * @param {string} scanType - Type of scan being validated
 * @throws {Error} If spectral parameters are invalid
 *
 * @example
 * validateSpectralSelection(0, 63, SCAN_TYPE.SEQUENTIAL); // Full sequential scan
 * validateSpectralSelection(0, 0, SCAN_TYPE.PROGRESSIVE_DC); // DC-only progressive
 * validateSpectralSelection(1, 5, SCAN_TYPE.PROGRESSIVE_AC); // AC band 1-5
 */
export function validateSpectralSelection(startSpectral, endSpectral, scanType) {
  if (typeof startSpectral !== "number" || startSpectral < 0 || startSpectral > MAX_SPECTRAL_INDEX) {
    throw new Error(`Invalid start spectral: ${startSpectral} (must be 0-${MAX_SPECTRAL_INDEX})`);
  }

  if (typeof endSpectral !== "number" || endSpectral < 0 || endSpectral > MAX_SPECTRAL_INDEX) {
    throw new Error(`Invalid end spectral: ${endSpectral} (must be 0-${MAX_SPECTRAL_INDEX})`);
  }

  if (startSpectral > endSpectral) {
    throw new Error(`Invalid spectral range: Ss(${startSpectral}) > Se(${endSpectral})`);
  }

  // Validate specific scan type constraints
  switch (scanType) {
    case SCAN_TYPE.SEQUENTIAL:
      if (startSpectral !== 0 || endSpectral !== 63) {
        throw new Error(`Sequential scan must have Ss=0, Se=63 (got Ss=${startSpectral}, Se=${endSpectral})`);
      }
      break;

    case SCAN_TYPE.PROGRESSIVE_DC:
      if (startSpectral !== 0 || endSpectral !== 0) {
        throw new Error(`Progressive DC scan must have Ss=0, Se=0 (got Ss=${startSpectral}, Se=${endSpectral})`);
      }
      break;

    case SCAN_TYPE.PROGRESSIVE_AC:
      if (startSpectral === 0 && endSpectral === 0) {
        throw new Error("Progressive AC scan cannot have Ss=0, Se=0 (use PROGRESSIVE_DC type)");
      }
      break;
  }
}

/**
 * Validate successive approximation parameters for progressive JPEG.
 * Ensures Ah/Al follow progressive refinement rules.
 *
 * @param {number} approximationHigh - Successive approximation high (Ah)
 * @param {number} approximationLow - Successive approximation low (Al)
 * @param {string} scanType - Type of scan being validated
 * @throws {Error} If approximation parameters are invalid
 *
 * @example
 * validateSuccessiveApproximation(0, 0, SCAN_TYPE.SEQUENTIAL); // No approximation
 * validateSuccessiveApproximation(0, 2, SCAN_TYPE.PROGRESSIVE_DC); // First progressive scan
 * validateSuccessiveApproximation(2, 1, SCAN_TYPE.PROGRESSIVE_REFINEMENT); // Refinement scan
 */
export function validateSuccessiveApproximation(approximationHigh, approximationLow, scanType) {
  if (typeof approximationHigh !== "number" || approximationHigh < 0 || approximationHigh > 13) {
    throw new Error(`Invalid approximation high: ${approximationHigh} (must be 0-13)`);
  }

  if (typeof approximationLow !== "number" || approximationLow < 0 || approximationLow > 13) {
    throw new Error(`Invalid approximation low: ${approximationLow} (must be 0-13)`);
  }

  // Validate approximation relationships
  if (approximationHigh > 0 && approximationLow !== approximationHigh - 1) {
    throw new Error(`Invalid approximation: Ah=${approximationHigh} must equal Al+1 (Al=${approximationLow})`);
  }

  // Validate scan type constraints
  switch (scanType) {
    case SCAN_TYPE.SEQUENTIAL:
      if (approximationHigh !== 0 || approximationLow !== 0) {
        throw new Error(`Sequential scan must have Ah=0, Al=0 (got Ah=${approximationHigh}, Al=${approximationLow})`);
      }
      break;

    case SCAN_TYPE.PROGRESSIVE_REFINEMENT:
      if (approximationHigh === 0) {
        throw new Error("Progressive refinement scan must have Ah>0");
      }
      break;
  }
}

/**
 * Determine scan type from spectral selection and approximation parameters.
 * Classifies scan according to JPEG progressive modes.
 *
 * @param {number} startSpectral - Start of spectral selection (Ss)
 * @param {number} endSpectral - End of spectral selection (Se)
 * @param {number} approximationHigh - Successive approximation high (Ah)
 * @param {number} approximationLow - Successive approximation low (Al)
 * @returns {string} Scan type from SCAN_TYPE enumeration
 *
 * @example
 * const type = determineScanType(0, 63, 0, 0); // SCAN_TYPE.SEQUENTIAL
 * const type = determineScanType(0, 0, 0, 2); // SCAN_TYPE.PROGRESSIVE_DC
 * const type = determineScanType(1, 5, 0, 0); // SCAN_TYPE.PROGRESSIVE_AC
 */
export function determineScanType(startSpectral, endSpectral, approximationHigh, approximationLow) {
  // Sequential: full spectrum, no approximation
  if (startSpectral === 0 && endSpectral === 63 && approximationHigh === 0 && approximationLow === 0) {
    return SCAN_TYPE.SEQUENTIAL;
  }

  // Progressive refinement: Ah > 0
  if (approximationHigh > 0) {
    return SCAN_TYPE.PROGRESSIVE_REFINEMENT;
  }

  // Progressive DC: only DC coefficient
  if (startSpectral === 0 && endSpectral === 0) {
    return SCAN_TYPE.PROGRESSIVE_DC;
  }

  // Progressive AC: partial spectrum or AC-only
  return SCAN_TYPE.PROGRESSIVE_AC;
}

/**
 * Validate interleaving constraints for multi-component scans.
 * Ensures component combinations follow JPEG interleaving rules.
 *
 * @param {Array<Object>} scanComponents - Components in current scan
 * @param {string} scanType - Type of scan being validated
 * @throws {Error} If interleaving constraints are violated
 *
 * @example
 * validateInterleaving([comp1, comp2, comp3], SCAN_TYPE.SEQUENTIAL); // Multi-component sequential
 * validateInterleaving([comp1], SCAN_TYPE.PROGRESSIVE_DC); // Single-component progressive
 */
/**
 * @param {Array<{id: number}>} scanComponents - Components in current scan
 * @param {string} scanType - Type of scan being validated
 */
export function validateInterleaving(scanComponents, scanType) {
  if (!Array.isArray(scanComponents)) {
    throw new TypeError("Expected scanComponents to be an array");
  }

  const componentCount = scanComponents.length;

  // Progressive scans with multiple components have restrictions
  if (componentCount > 1) {
    switch (scanType) {
      case SCAN_TYPE.PROGRESSIVE_DC:
      case SCAN_TYPE.PROGRESSIVE_AC:
      case SCAN_TYPE.PROGRESSIVE_REFINEMENT:
        // Progressive scans typically use non-interleaved (single component)
        // Multi-component progressive is allowed but less common
        break;

      case SCAN_TYPE.SEQUENTIAL:
        // Sequential multi-component is standard (interleaved MCUs)
        break;
    }
  }

  // Check for duplicate components
  const componentIds = scanComponents.map((c) => c.id);
  const uniqueIds = new Set(componentIds);
  if (uniqueIds.size !== componentIds.length) {
    throw new Error("Duplicate components in scan not allowed");
  }
}

/**
 * Parse single component specification from SOS data.
 * Extracts component ID and Huffman table selectors.
 *
 * @param {Uint8Array} data - SOS scan data
 * @param {number} offset - Current parsing offset
 * @returns {{component: {id: number, dcTableId: number, acTableId: number}, bytesRead: number}} Parsed component and bytes consumed
 * @throws {Error} If parsing fails
 *
 * @private
 */
function parseComponentSpec(data, offset) {
  if (offset + 2 > data.length) {
    throw new Error(
      `Incomplete component specification at offset ${offset}: need 2 bytes, got ${data.length - offset}`
    );
  }

  const componentId = data[offset++];
  const tableSelectors = data[offset++];

  const dcTableId = (tableSelectors >> 4) & 0x0f; // Upper 4 bits
  const acTableId = tableSelectors & 0x0f; // Lower 4 bits

  return {
    component: {
      id: componentId,
      dcTableId,
      acTableId,
    },
    bytesRead: 2,
  };
}

/**
 * Decode JPEG Start of Scan from SOS marker data.
 * Parses scan header with full validation and progressive support.
 *
 * @param {Uint8Array} data - SOS marker data (without marker and length)
 * @param {Array<{id: number}>} frameComponents - Components from SOF frame
 * @param {Array<{class: number, id: number}>} huffmanTables - Available Huffman tables from DHT
 * @returns {Object} Parsed SOS information with validation
 * @throws {Error} If decoding fails
 *
 * @example
 * const sos = decodeSOS(sosData, sofComponents, dhtTables);
 * console.log(`Scan type: ${sos.scanType}`);
 * console.log(`Components: ${sos.components.map(c => c.id).join(', ')}`);
 * console.log(`Spectral: ${sos.startSpectral}-${sos.endSpectral}`);
 */
export function decodeSOS(data, frameComponents, huffmanTables) {
  if (!(data instanceof Uint8Array)) {
    throw new TypeError("Expected data to be Uint8Array");
  }

  if (!Array.isArray(frameComponents)) {
    throw new TypeError("Expected frameComponents to be an array");
  }

  if (!Array.isArray(huffmanTables)) {
    throw new TypeError("Expected huffmanTables to be an array");
  }

  if (data.length < 6) {
    throw new Error(`SOS data too short: need at least 6 bytes, got ${data.length}`);
  }

  let offset = 0;

  // Parse number of components
  const componentCount = data[offset++];

  if (componentCount < 1 || componentCount > MAX_COMPONENTS_PER_SCAN) {
    throw new Error(`Invalid component count: ${componentCount} (must be 1-${MAX_COMPONENTS_PER_SCAN})`);
  }

  // Calculate expected minimum length
  const expectedMinLength = 1 + componentCount * 2 + 3; // Ns + components + Ss + Se + Ah|Al
  if (data.length < expectedMinLength) {
    throw new Error(`SOS data too short: need ${expectedMinLength} bytes, got ${data.length}`);
  }

  // Parse component specifications
  /** @type {Array<{id: number, dcTableId: number, acTableId: number}>} */
  const components = [];
  for (let i = 0; i < componentCount; i++) {
    const { component, bytesRead } = parseComponentSpec(data, offset);
    components.push(component);
    offset += bytesRead;
  }

  // Parse spectral selection
  const startSpectral = data[offset++];
  const endSpectral = data[offset++];

  // Parse successive approximation
  const approximationByte = data[offset++];
  const approximationHigh = (approximationByte >> 4) & 0x0f;
  const approximationLow = approximationByte & 0x0f;

  // Determine scan type
  const scanType = determineScanType(startSpectral, endSpectral, approximationHigh, approximationLow);

  // Validate spectral selection
  validateSpectralSelection(startSpectral, endSpectral, scanType);

  // Validate successive approximation
  validateSuccessiveApproximation(approximationHigh, approximationLow, scanType);

  // Validate and enrich components
  /** @type {Array<{id: number, dcTableId: number, acTableId: number}>} */
  const scanComponents = [];
  for (const comp of components) {
    // Validate component exists in frame
    const frameComponent = validateComponentSelector(comp.id, frameComponents);

    // Validate Huffman tables
    const requireAC = scanType !== SCAN_TYPE.PROGRESSIVE_DC && !(startSpectral === 0 && endSpectral === 0);
    validateHuffmanTables(comp.dcTableId, comp.acTableId, huffmanTables, requireAC);

    // Create enriched component
    scanComponents.push({
      ...comp,
      ...frameComponent, // Include frame component properties
    });
  }

  // Validate interleaving constraints
  validateInterleaving(scanComponents, scanType);

  // Validate we consumed all expected data
  if (offset !== data.length) {
    throw new Error(`SOS parsing error: expected to consume ${data.length} bytes, consumed ${offset}`);
  }

  // Create scan object
  const scan = {
    componentCount,
    components: scanComponents,
    startSpectral,
    endSpectral,
    approximationHigh,
    approximationLow,
    scanType,
    isProgressive: scanType !== SCAN_TYPE.SEQUENTIAL,
    isInterleaved: componentCount > 1,
    isDCOnly: startSpectral === 0 && endSpectral === 0,
    isACOnly: startSpectral > 0,
    isRefinement: approximationHigh > 0,
    spectralRange: endSpectral - startSpectral + 1,
    bitPrecision: approximationLow,
  };

  return scan;
}

/**
 * Get summary information about Start of Scan.
 * Provides human-readable overview for debugging.
 *
 * @param {{scanType: string, componentCount: number, components: Array<{id: number}>, startSpectral: number, endSpectral: number, isProgressive: boolean, isInterleaved: boolean, isDCOnly: boolean, isACOnly: boolean, isRefinement: boolean, spectralRange: number, approximationHigh: number, approximationLow: number}} scan - Decoded SOS information
 * @returns {Object} Summary information
 *
 * @example
 * const summary = getSOSSummary(scan);
 * console.log(summary.description); // "Sequential scan: 3 components (Y,Cb,Cr)"
 */
export function getSOSSummary(scan) {
  if (!scan || typeof scan !== "object") {
    throw new TypeError("Expected scan to be an object");
  }

  const componentNames = scan.components.map((c) => `${c.id}`).join(",");
  const spectralDesc = scan.isDCOnly
    ? "DC-only"
    : scan.isACOnly
      ? `AC(${scan.startSpectral}-${scan.endSpectral})`
      : `Full(${scan.startSpectral}-${scan.endSpectral})`;
  const approxDesc = scan.isRefinement ? ` Ah=${scan.approximationHigh},Al=${scan.approximationLow}` : "";

  let typeDesc;
  switch (scan.scanType) {
    case SCAN_TYPE.SEQUENTIAL:
      typeDesc = "Sequential";
      break;
    case SCAN_TYPE.PROGRESSIVE_DC:
      typeDesc = "Progressive DC";
      break;
    case SCAN_TYPE.PROGRESSIVE_AC:
      typeDesc = "Progressive AC";
      break;
    case SCAN_TYPE.PROGRESSIVE_REFINEMENT:
      typeDesc = "Progressive Refinement";
      break;
    default:
      typeDesc = scan.scanType;
  }

  return {
    type: scan.scanType,
    componentCount: scan.componentCount,
    componentIds: scan.components.map((c) => c.id),
    isProgressive: scan.isProgressive,
    isInterleaved: scan.isInterleaved,
    spectralRange: scan.spectralRange,
    description: `${typeDesc} scan: ${scan.componentCount} component${scan.componentCount === 1 ? "" : "s"} (${componentNames}) ${spectralDesc}${approxDesc}`,
  };
}
