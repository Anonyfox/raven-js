/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Progressive JPEG multi-pass decoding implementation.
 *
 * Implements ITU-T T.81 Section B.2.3 progressive JPEG decoding with support
 * for spectral selection, successive approximation, and combined progressive modes.
 * Handles multi-scan coordination, coefficient accumulation, and intermediate
 * image generation for progressive display.
 */

/**
 * Progressive JPEG scan types.
 * Different types of progressive scans based on parameters.
 */
export const PROGRESSIVE_SCAN_TYPES = {
  /** DC coefficient scan (Ss=0, Se=0) */
  DC_FIRST: "dc_first",
  /** AC coefficient scan (Ss>0) */
  AC_PROGRESSIVE: "ac_progressive",
  /** Successive approximation refinement scan */
  SA_REFINEMENT: "sa_refinement",
  /** Combined spectral selection and successive approximation */
  COMBINED: "combined",
  /** Sequential scan (non-progressive) */
  SEQUENTIAL: "sequential",
};

/**
 * Progressive decode states.
 * State machine for progressive decoding process.
 */
export const PROGRESSIVE_STATES = {
  /** Initial state, no scans processed */
  INITIAL: "initial",
  /** Processing DC coefficients */
  DC_PROCESSING: "dc_processing",
  /** Processing AC coefficients */
  AC_PROCESSING: "ac_processing",
  /** Refining coefficient precision */
  REFINEMENT: "refinement",
  /** All scans completed */
  COMPLETED: "completed",
  /** Error state */
  ERROR: "error",
};

/**
 * Maximum progressive scan parameters.
 * ITU-T T.81 specification limits.
 */
export const PROGRESSIVE_LIMITS = {
  /** Maximum spectral selection start (Ss) */
  MAX_SPECTRAL_START: 63,
  /** Maximum spectral selection end (Se) */
  MAX_SPECTRAL_END: 63,
  /** Maximum successive approximation high (Ah) */
  MAX_APPROXIMATION_HIGH: 13,
  /** Maximum successive approximation low (Al) */
  MAX_APPROXIMATION_LOW: 0,
  /** Maximum number of progressive scans */
  MAX_SCANS: 64,
};

/**
 * Determine progressive scan type from SOS parameters.
 * Analyzes spectral selection and successive approximation parameters.
 *
 * @param {number} spectralStart - Spectral selection start (Ss)
 * @param {number} spectralEnd - Spectral selection end (Se)
 * @param {number} approximationHigh - Successive approximation high (Ah)
 * @param {number} approximationLow - Successive approximation low (Al)
 * @param {number} _componentCount - Number of components in scan
 * @returns {string} Progressive scan type
 */
export function determineProgressiveScanType(
  spectralStart,
  spectralEnd,
  approximationHigh,
  approximationLow,
  _componentCount
) {
  // Validate parameters
  if (
    typeof spectralStart !== "number" ||
    typeof spectralEnd !== "number" ||
    typeof approximationHigh !== "number" ||
    typeof approximationLow !== "number"
  ) {
    throw new Error("Progressive scan parameters must be numbers");
  }

  // Sequential scan (baseline JPEG)
  if (spectralStart === 0 && spectralEnd === 63 && approximationHigh === 0 && approximationLow === 0) {
    return PROGRESSIVE_SCAN_TYPES.SEQUENTIAL;
  }

  // DC coefficient scan
  if (spectralStart === 0 && spectralEnd === 0) {
    if (approximationHigh === 0) {
      return PROGRESSIVE_SCAN_TYPES.DC_FIRST;
    }
    return PROGRESSIVE_SCAN_TYPES.SA_REFINEMENT;
  }

  // AC coefficient scan
  if (spectralStart > 0) {
    if (approximationHigh === 0) {
      return PROGRESSIVE_SCAN_TYPES.AC_PROGRESSIVE;
    }
    return PROGRESSIVE_SCAN_TYPES.COMBINED;
  }

  // Mixed DC/AC scan with successive approximation
  if (approximationHigh > 0 || approximationLow < approximationHigh) {
    return PROGRESSIVE_SCAN_TYPES.SA_REFINEMENT;
  }

  return PROGRESSIVE_SCAN_TYPES.SEQUENTIAL;
}

/**
 * Validate progressive scan parameters.
 * Ensures scan parameters conform to JPEG specification.
 *
 * @param {number} spectralStart - Spectral selection start (Ss)
 * @param {number} spectralEnd - Spectral selection end (Se)
 * @param {number} approximationHigh - Successive approximation high (Ah)
 * @param {number} approximationLow - Successive approximation low (Al)
 * @throws {Error} If parameters are invalid
 */
export function validateProgressiveScanParameters(spectralStart, spectralEnd, approximationHigh, approximationLow) {
  // Range validation
  if (spectralStart < 0 || spectralStart > PROGRESSIVE_LIMITS.MAX_SPECTRAL_START) {
    throw new Error(`Invalid spectral start: ${spectralStart} (must be 0-${PROGRESSIVE_LIMITS.MAX_SPECTRAL_START})`);
  }

  if (spectralEnd < 0 || spectralEnd > PROGRESSIVE_LIMITS.MAX_SPECTRAL_END) {
    throw new Error(`Invalid spectral end: ${spectralEnd} (must be 0-${PROGRESSIVE_LIMITS.MAX_SPECTRAL_END})`);
  }

  if (spectralStart > spectralEnd) {
    throw new Error(`Spectral start ${spectralStart} cannot be greater than spectral end ${spectralEnd}`);
  }

  if (approximationHigh < 0 || approximationHigh > PROGRESSIVE_LIMITS.MAX_APPROXIMATION_HIGH) {
    throw new Error(
      `Invalid approximation high: ${approximationHigh} (must be 0-${PROGRESSIVE_LIMITS.MAX_APPROXIMATION_HIGH})`
    );
  }

  if (approximationLow < PROGRESSIVE_LIMITS.MAX_APPROXIMATION_LOW) {
    throw new Error(
      `Invalid approximation low: ${approximationLow} (must be >= ${PROGRESSIVE_LIMITS.MAX_APPROXIMATION_LOW})`
    );
  }

  // For successive approximation:
  // - Initial scans can have any Al <= Ah
  // - Refinement scans must have Al = Ah - 1
  if (approximationHigh > 0 && approximationLow > approximationHigh) {
    throw new Error(
      `Invalid successive approximation: Al=${approximationLow} cannot be greater than Ah=${approximationHigh}`
    );
  }

  // Sequential scan validation
  if (spectralStart === 0 && spectralEnd === 63) {
    if (approximationHigh !== 0 || approximationLow !== 0) {
      throw new Error("Sequential scan must have Ah=0, Al=0");
    }
  }

  // DC-only scan validation
  if (spectralStart === 0 && spectralEnd === 0) {
    // DC scans can have successive approximation
    return;
  }

  // AC-only scan validation
  if (spectralStart > 0) {
    // AC scans cannot include DC coefficient
    if (spectralEnd < spectralStart) {
      throw new Error(`AC scan spectral range invalid: ${spectralStart}-${spectralEnd}`);
    }
  }
}

/**
 * Progressive JPEG decoder state manager.
 * Manages multi-scan progressive decoding process.
 */
export class ProgressiveDecoder {
  /**
   * Create progressive decoder.
   *
   * @param {number} imageWidth - Image width in pixels
   * @param {number} imageHeight - Image height in pixels
   * @param {Array<{id: number, samplingFactorH: number, samplingFactorV: number}>} components - Image components
   */
  constructor(imageWidth, imageHeight, components) {
    if (!Number.isInteger(imageWidth) || imageWidth <= 0) {
      throw new Error("Image width must be positive integer");
    }
    if (!Number.isInteger(imageHeight) || imageHeight <= 0) {
      throw new Error("Image height must be positive integer");
    }
    if (!Array.isArray(components) || components.length === 0) {
      throw new Error("Components must be non-empty array");
    }

    /** @type {number} */
    this.imageWidth = imageWidth;
    /** @type {number} */
    this.imageHeight = imageHeight;
    /** @type {Array<{id: number, samplingFactorH: number, samplingFactorV: number}>} */
    this.components = components;

    /** @type {string} */
    this.state = PROGRESSIVE_STATES.INITIAL;
    /** @type {number} */
    this.scansProcessed = 0;
    /** @type {Array<{spectralStart: number, spectralEnd: number, approximationHigh: number, approximationLow: number, scanType: string, componentIds: number[]}>} */
    this.scanHistory = [];

    // Calculate block dimensions
    const maxSamplingH = Math.max(...components.map((c) => c.samplingFactorH));
    const maxSamplingV = Math.max(...components.map((c) => c.samplingFactorV));

    /** @type {number} */
    this.mcuWidth = maxSamplingH * 8;
    /** @type {number} */
    this.mcuHeight = maxSamplingV * 8;
    /** @type {number} */
    this.mcusWide = Math.ceil(imageWidth / this.mcuWidth);
    /** @type {number} */
    this.mcusHigh = Math.ceil(imageHeight / this.mcuHeight);

    // Initialize coefficient buffers for each component
    /** @type {Map<number, Int16Array[]>} */
    this.coefficientBuffers = new Map();

    for (const component of components) {
      const blocksH = Math.ceil((imageWidth * component.samplingFactorH) / maxSamplingH / 8);
      const blocksV = Math.ceil((imageHeight * component.samplingFactorV) / maxSamplingV / 8);
      const totalBlocks = blocksH * blocksV;

      // Each block has 64 coefficients (8x8)
      const blocks = [];
      for (let i = 0; i < totalBlocks; i++) {
        blocks.push(new Int16Array(64));
      }
      this.coefficientBuffers.set(component.id, blocks);
    }

    /** @type {string[]} */
    this.errors = [];
    /** @type {number} */
    this.qualityProgression = 0;
  }

  /**
   * Process a progressive scan.
   * Integrates scan data into coefficient buffers.
   *
   * @param {{
   *   spectralStart: number,
   *   spectralEnd: number,
   *   approximationHigh: number,
   *   approximationLow: number,
   *   componentIds: number[],
   *   coefficients: Map<number, Int16Array[]>
   * }} scanData - Progressive scan data
   * @returns {{
   *   scanType: string,
   *   qualityImprovement: number,
   *   completionPercentage: number,
   *   intermediateAvailable: boolean
   * }} Scan processing result
   */
  processScan(scanData) {
    try {
      // Validate scan parameters
      validateProgressiveScanParameters(
        scanData.spectralStart,
        scanData.spectralEnd,
        scanData.approximationHigh,
        scanData.approximationLow
      );

      // Determine scan type
      const scanType = determineProgressiveScanType(
        scanData.spectralStart,
        scanData.spectralEnd,
        scanData.approximationHigh,
        scanData.approximationLow,
        scanData.componentIds.length
      );

      // Validate scan sequence
      this._validateScanSequence(scanData, scanType);

      // Process coefficients based on scan type
      let qualityImprovement = 0;
      switch (scanType) {
        case PROGRESSIVE_SCAN_TYPES.DC_FIRST:
          qualityImprovement = this._processDcFirstScan(scanData);
          this.state = PROGRESSIVE_STATES.DC_PROCESSING;
          break;

        case PROGRESSIVE_SCAN_TYPES.AC_PROGRESSIVE:
          qualityImprovement = this._processAcProgressiveScan(scanData);
          this.state = PROGRESSIVE_STATES.AC_PROCESSING;
          break;

        case PROGRESSIVE_SCAN_TYPES.SA_REFINEMENT:
          qualityImprovement = this._processRefinementScan(scanData);
          this.state = PROGRESSIVE_STATES.REFINEMENT;
          break;

        case PROGRESSIVE_SCAN_TYPES.COMBINED:
          qualityImprovement = this._processCombinedScan(scanData);
          this.state = PROGRESSIVE_STATES.AC_PROCESSING;
          break;

        case PROGRESSIVE_SCAN_TYPES.SEQUENTIAL:
          qualityImprovement = this._processSequentialScan(scanData);
          this.state = PROGRESSIVE_STATES.COMPLETED;
          break;

        default:
          throw new Error(`Unknown progressive scan type: ${scanType}`);
      }

      // Update scan history
      this.scanHistory.push({
        spectralStart: scanData.spectralStart,
        spectralEnd: scanData.spectralEnd,
        approximationHigh: scanData.approximationHigh,
        approximationLow: scanData.approximationLow,
        scanType,
        componentIds: [...scanData.componentIds],
      });

      this.scansProcessed++;
      this.qualityProgression = Math.min(100, this.qualityProgression + qualityImprovement);

      // Determine if intermediate image can be generated
      const intermediateAvailable = this._canGenerateIntermediate();
      const completionPercentage = this._calculateCompletionPercentage();

      return {
        scanType,
        qualityImprovement,
        completionPercentage,
        intermediateAvailable,
      };
    } catch (error) {
      this.errors.push(error.message);
      this.state = PROGRESSIVE_STATES.ERROR;
      throw error;
    }
  }

  /**
   * Process DC-first scan (Ss=0, Se=0, Ah=0).
   * Initial DC coefficient scan for quick preview.
   *
   * @param {{spectralStart: number, spectralEnd: number, approximationHigh: number, approximationLow: number, componentIds: number[], coefficients: Map<number, Int16Array[]>}} scanData - Scan data
   * @returns {number} Quality improvement percentage
   * @private
   */
  _processDcFirstScan(scanData) {
    let coefficientsProcessed = 0;
    let totalCoefficients = 0;

    for (const componentId of scanData.componentIds) {
      const scanCoefficients = scanData.coefficients.get(componentId);
      const bufferBlocks = this.coefficientBuffers.get(componentId);

      if (!scanCoefficients || !bufferBlocks) {
        throw new Error(`Missing coefficient data for component ${componentId}`);
      }

      for (let blockIndex = 0; blockIndex < bufferBlocks.length && blockIndex < scanCoefficients.length; blockIndex++) {
        const scanBlock = scanCoefficients[blockIndex];
        const bufferBlock = bufferBlocks[blockIndex];

        // Copy DC coefficient (index 0) with bit shifting for successive approximation
        const dcValue = scanBlock[0];
        bufferBlock[0] = dcValue << scanData.approximationLow;

        coefficientsProcessed++;
        totalCoefficients++;
      }
    }

    // DC coefficients provide significant quality improvement for preview
    return totalCoefficients > 0 ? Math.min(40, (coefficientsProcessed / totalCoefficients) * 40) : 0;
  }

  /**
   * Process AC progressive scan (Ss>0).
   * AC coefficient scan for specific frequency ranges.
   *
   * @param {{spectralStart: number, spectralEnd: number, approximationHigh: number, approximationLow: number, componentIds: number[], coefficients: Map<number, Int16Array[]>}} scanData - Scan data
   * @returns {number} Quality improvement percentage
   * @private
   */
  _processAcProgressiveScan(scanData) {
    let coefficientsProcessed = 0;
    let totalCoefficients = 0;

    for (const componentId of scanData.componentIds) {
      const scanCoefficients = scanData.coefficients.get(componentId);
      const bufferBlocks = this.coefficientBuffers.get(componentId);

      if (!scanCoefficients || !bufferBlocks) {
        throw new Error(`Missing coefficient data for component ${componentId}`);
      }

      for (let blockIndex = 0; blockIndex < bufferBlocks.length && blockIndex < scanCoefficients.length; blockIndex++) {
        const scanBlock = scanCoefficients[blockIndex];
        const bufferBlock = bufferBlocks[blockIndex];

        // Copy AC coefficients in spectral range with bit shifting
        for (let k = scanData.spectralStart; k <= scanData.spectralEnd; k++) {
          const acValue = scanBlock[k];
          if (acValue !== 0) {
            bufferBlock[k] = acValue << scanData.approximationLow;
            coefficientsProcessed++;
          }
          totalCoefficients++;
        }
      }
    }

    // AC coefficients provide progressive quality improvement
    const frequencyRange = scanData.spectralEnd - scanData.spectralStart + 1;
    const maxImprovement = Math.min(30, frequencyRange * 0.5);
    return totalCoefficients > 0 ? (coefficientsProcessed / totalCoefficients) * maxImprovement : 0;
  }

  /**
   * Process successive approximation refinement scan.
   * Adds precision bits to existing coefficients.
   *
   * @param {{spectralStart: number, spectralEnd: number, approximationHigh: number, approximationLow: number, componentIds: number[], coefficients: Map<number, Int16Array[]>}} scanData - Scan data
   * @returns {number} Quality improvement percentage
   * @private
   */
  _processRefinementScan(scanData) {
    let coefficientsRefined = 0;
    let totalCoefficients = 0;

    for (const componentId of scanData.componentIds) {
      const scanCoefficients = scanData.coefficients.get(componentId);
      const bufferBlocks = this.coefficientBuffers.get(componentId);

      if (!scanCoefficients || !bufferBlocks) {
        throw new Error(`Missing coefficient data for component ${componentId}`);
      }

      for (let blockIndex = 0; blockIndex < bufferBlocks.length && blockIndex < scanCoefficients.length; blockIndex++) {
        const scanBlock = scanCoefficients[blockIndex];
        const bufferBlock = bufferBlocks[blockIndex];

        // Refine coefficients in spectral range
        for (let k = scanData.spectralStart; k <= scanData.spectralEnd; k++) {
          const existingValue = bufferBlock[k];
          const refinementBit = scanBlock[k];

          if (existingValue !== 0) {
            // Add refinement bit to existing coefficient
            const sign = existingValue < 0 ? -1 : 1;
            const magnitude = Math.abs(existingValue);
            const newMagnitude = (magnitude << 1) | (refinementBit & 1);
            bufferBlock[k] = sign * newMagnitude;
            coefficientsRefined++;
          } else if (refinementBit !== 0) {
            // New coefficient at this precision level
            bufferBlock[k] = refinementBit << scanData.approximationLow;
            coefficientsRefined++;
          }
          totalCoefficients++;
        }
      }
    }

    // Refinement provides smaller quality improvements
    const precisionImprovement = Math.max(1, scanData.approximationHigh - scanData.approximationLow);
    return totalCoefficients > 0 ? (coefficientsRefined / totalCoefficients) * precisionImprovement * 2 : 0;
  }

  /**
   * Process combined progressive scan.
   * Spectral selection with successive approximation.
   *
   * @param {{spectralStart: number, spectralEnd: number, approximationHigh: number, approximationLow: number, componentIds: number[], coefficients: Map<number, Int16Array[]>}} scanData - Scan data
   * @returns {number} Quality improvement percentage
   * @private
   */
  _processCombinedScan(scanData) {
    // Combined scans use AC progressive logic with successive approximation
    return this._processAcProgressiveScan(scanData);
  }

  /**
   * Process sequential scan.
   * Complete coefficient data in single scan.
   *
   * @param {{spectralStart: number, spectralEnd: number, approximationHigh: number, approximationLow: number, componentIds: number[], coefficients: Map<number, Int16Array[]>}} scanData - Scan data
   * @returns {number} Quality improvement percentage
   * @private
   */
  _processSequentialScan(scanData) {
    let _coefficientsProcessed = 0;
    let _totalCoefficients = 0;

    for (const componentId of scanData.componentIds) {
      const scanCoefficients = scanData.coefficients.get(componentId);
      const bufferBlocks = this.coefficientBuffers.get(componentId);

      if (!scanCoefficients || !bufferBlocks) {
        throw new Error(`Missing coefficient data for component ${componentId}`);
      }

      for (let blockIndex = 0; blockIndex < bufferBlocks.length && blockIndex < scanCoefficients.length; blockIndex++) {
        const scanBlock = scanCoefficients[blockIndex];
        const bufferBlock = bufferBlocks[blockIndex];

        // Copy all coefficients (complete block)
        for (let k = 0; k < 64; k++) {
          bufferBlock[k] = scanBlock[k];
          if (scanBlock[k] !== 0) {
            _coefficientsProcessed++;
          }
          _totalCoefficients++;
        }
      }
    }

    // Sequential scan completes the image
    return 100;
  }

  /**
   * Validate progressive scan sequence.
   * Ensures scans are processed in valid order.
   *
   * @param {{spectralStart: number, spectralEnd: number, approximationHigh: number, approximationLow: number}} scanData - Scan data
   * @param {string} _scanType - Scan type
   * @throws {Error} If scan sequence is invalid
   * @private
   */
  _validateScanSequence(scanData, _scanType) {
    // Check for duplicate scans
    const duplicate = this.scanHistory.find(
      (scan) =>
        scan.spectralStart === scanData.spectralStart &&
        scan.spectralEnd === scanData.spectralEnd &&
        scan.approximationHigh === scanData.approximationHigh &&
        scan.approximationLow === scanData.approximationLow
    );

    if (duplicate) {
      throw new Error(
        `Duplicate progressive scan: Ss=${scanData.spectralStart}, Se=${scanData.spectralEnd}, Ah=${scanData.approximationHigh}, Al=${scanData.approximationLow}`
      );
    }

    // Validate successive approximation sequence
    if (scanData.approximationHigh > 0) {
      // Check for proper successive approximation progression
      const relatedScans = this.scanHistory.filter(
        (scan) => scan.spectralStart === scanData.spectralStart && scan.spectralEnd === scanData.spectralEnd
      );

      if (relatedScans.length > 0) {
        const lastScan = relatedScans[relatedScans.length - 1];
        if (scanData.approximationHigh !== lastScan.approximationLow - 1) {
          throw new Error(
            `Invalid successive approximation sequence: expected Ah=${lastScan.approximationLow - 1}, got Ah=${scanData.approximationHigh}`
          );
        }
      }
    }

    // Validate scan limits
    if (this.scansProcessed >= PROGRESSIVE_LIMITS.MAX_SCANS) {
      throw new Error(`Too many progressive scans: ${this.scansProcessed} (max ${PROGRESSIVE_LIMITS.MAX_SCANS})`);
    }
  }

  /**
   * Check if intermediate image can be generated.
   * Determines if enough data exists for meaningful display.
   *
   * @returns {boolean} True if intermediate image can be generated
   * @private
   */
  _canGenerateIntermediate() {
    if (this.scanHistory.length === 0) {
      return false;
    }

    // Check if at least DC coefficients are available
    const hasDcScan = this.scanHistory.some((scan) => scan.spectralStart === 0 && scan.spectralEnd === 0);

    if (hasDcScan) {
      return true;
    }

    // Check if sequential scan is complete
    const hasSequentialScan = this.scanHistory.some((scan) => scan.scanType === PROGRESSIVE_SCAN_TYPES.SEQUENTIAL);

    return hasSequentialScan;
  }

  /**
   * Calculate progressive decode completion percentage.
   * Estimates overall decode progress.
   *
   * @returns {number} Completion percentage (0-100)
   * @private
   */
  _calculateCompletionPercentage() {
    if (this.state === PROGRESSIVE_STATES.COMPLETED) {
      return 100;
    }

    if (this.scanHistory.length === 0) {
      return 0;
    }

    // Estimate completion based on scan types and coverage
    let dcCoverage = 0;
    let acCoverage = 0;
    const totalComponents = this.components.length;

    for (const scan of this.scanHistory) {
      if (scan.spectralStart === 0 && scan.spectralEnd === 0) {
        // DC scan
        dcCoverage = Math.max(dcCoverage, (scan.componentIds.length / totalComponents) * 100);
      } else if (scan.spectralStart === 0 && scan.spectralEnd === 63) {
        // Complete sequential scan
        return 100;
      } else {
        // AC scan
        const frequencyRange = scan.spectralEnd - scan.spectralStart + 1;
        const rangeCoverage = (frequencyRange / 63) * (scan.componentIds.length / totalComponents) * 100;
        acCoverage = Math.max(acCoverage, rangeCoverage);
      }
    }

    // Weight DC more heavily for perceptual quality
    return Math.min(100, dcCoverage * 0.4 + acCoverage * 0.6);
  }

  /**
   * Get current coefficient buffers.
   * Returns accumulated coefficients for image reconstruction.
   *
   * @returns {Map<number, Int16Array[]>} Component coefficient buffers
   */
  getCoefficientBuffers() {
    return this.coefficientBuffers;
  }

  /**
   * Get progressive decode summary.
   * Provides comprehensive decode status information.
   *
   * @returns {{
   *   state: string,
   *   scansProcessed: number,
   *   qualityProgression: number,
   *   completionPercentage: number,
   *   canGenerateIntermediate: boolean,
   *   scanTypes: string[],
   *   errorCount: number,
   *   description: string
   * }} Progressive decode summary
   */
  getSummary() {
    const scanTypes = [...new Set(this.scanHistory.map((scan) => scan.scanType))];
    const completionPercentage = this._calculateCompletionPercentage();
    const canGenerateIntermediate = this._canGenerateIntermediate();

    return {
      state: this.state,
      scansProcessed: this.scansProcessed,
      qualityProgression: Math.round(this.qualityProgression * 10) / 10,
      completionPercentage: Math.round(completionPercentage * 10) / 10,
      canGenerateIntermediate,
      scanTypes,
      errorCount: this.errors.length,
      description: `Progressive JPEG: ${this.scansProcessed} scans, ${completionPercentage.toFixed(1)}% complete, ${this.state}`,
    };
  }

  /**
   * Reset progressive decoder state.
   * Clears all accumulated data and resets to initial state.
   */
  reset() {
    this.state = PROGRESSIVE_STATES.INITIAL;
    this.scansProcessed = 0;
    this.scanHistory = [];
    this.errors = [];
    this.qualityProgression = 0;

    // Clear coefficient buffers
    for (const [_componentId, blocks] of this.coefficientBuffers) {
      for (const block of blocks) {
        block.fill(0);
      }
    }
  }
}

/**
 * Progressive decode quality metrics.
 * Analyzes progressive decoding performance and quality.
 */
export class ProgressiveMetrics {
  /**
   * Create progressive metrics analyzer.
   */
  constructor() {
    /** @type {number} */
    this.totalScans = 0;
    /** @type {number} */
    this.dcScans = 0;
    /** @type {number} */
    this.acScans = 0;
    /** @type {number} */
    this.refinementScans = 0;
    /** @type {number} */
    this.sequentialScans = 0;
    /** @type {Object<string, number>} */
    this.scanTypeCounts = {};
    /** @type {number[]} */
    this.qualityProgression = [];
    /** @type {number} */
    this.averageQualityImprovement = 0;
    /** @type {number} */
    this.totalDecodeTime = 0;
    /** @type {string[]} */
    this.errors = [];
  }

  /**
   * Record progressive scan processing.
   *
   * @param {string} scanType - Type of progressive scan
   * @param {number} qualityImprovement - Quality improvement from scan
   * @param {number} processingTime - Time to process scan (milliseconds)
   */
  recordScan(scanType, qualityImprovement, processingTime) {
    this.totalScans++;
    this.scanTypeCounts[scanType] = (this.scanTypeCounts[scanType] || 0) + 1;

    switch (scanType) {
      case PROGRESSIVE_SCAN_TYPES.DC_FIRST:
        this.dcScans++;
        break;
      case PROGRESSIVE_SCAN_TYPES.AC_PROGRESSIVE:
      case PROGRESSIVE_SCAN_TYPES.COMBINED:
        this.acScans++;
        break;
      case PROGRESSIVE_SCAN_TYPES.SA_REFINEMENT:
        this.refinementScans++;
        break;
      case PROGRESSIVE_SCAN_TYPES.SEQUENTIAL:
        this.sequentialScans++;
        break;
    }

    this.qualityProgression.push(qualityImprovement);
    this.totalDecodeTime += processingTime;

    // Update average quality improvement
    const totalImprovement = this.qualityProgression.reduce((sum, q) => sum + q, 0);
    this.averageQualityImprovement = totalImprovement / this.qualityProgression.length;
  }

  /**
   * Record progressive decode error.
   *
   * @param {string} error - Error message
   */
  recordError(error) {
    this.errors.push(error);
  }

  /**
   * Get progressive metrics summary.
   *
   * @returns {{
   *   totalScans: number,
   *   scanTypeDistribution: Object<string, number>,
   *   averageQualityImprovement: number,
   *   totalDecodeTime: number,
   *   averageTimePerScan: number,
   *   qualityProgression: number[],
   *   errorCount: number,
   *   efficiency: number,
   *   description: string
   * }} Progressive metrics summary
   */
  getSummary() {
    const averageTimePerScan = this.totalScans > 0 ? this.totalDecodeTime / this.totalScans : 0;
    const efficiency = this.totalDecodeTime > 0 ? (this.averageQualityImprovement / averageTimePerScan) * 1000 : 0;

    return {
      totalScans: this.totalScans,
      scanTypeDistribution: { ...this.scanTypeCounts },
      averageQualityImprovement: Math.round(this.averageQualityImprovement * 100) / 100,
      totalDecodeTime: Math.round(this.totalDecodeTime),
      averageTimePerScan: Math.round(averageTimePerScan * 100) / 100,
      qualityProgression: [...this.qualityProgression],
      errorCount: this.errors.length,
      efficiency: Math.round(efficiency * 100) / 100,
      description: `Progressive: ${this.totalScans} scans, ${this.averageQualityImprovement.toFixed(1)}% avg quality, ${averageTimePerScan.toFixed(1)}ms/scan`,
    };
  }

  /**
   * Reset progressive metrics.
   */
  reset() {
    this.totalScans = 0;
    this.dcScans = 0;
    this.acScans = 0;
    this.refinementScans = 0;
    this.sequentialScans = 0;
    this.scanTypeCounts = {};
    this.qualityProgression = [];
    this.averageQualityImprovement = 0;
    this.totalDecodeTime = 0;
    this.errors = [];
  }
}

/**
 * Get progressive scan analysis.
 * Analyzes progressive scan parameters and provides insights.
 *
 * @param {{
 *   spectralStart: number,
 *   spectralEnd: number,
 *   approximationHigh: number,
 *   approximationLow: number,
 *   componentIds: number[]
 * }} scanParameters - Progressive scan parameters
 * @returns {{
 *   scanType: string,
 *   frequencyRange: string,
 *   approximationLevel: string,
 *   componentCount: number,
 *   qualityImpact: string,
 *   displaySuitability: string,
 *   description: string
 * }} Progressive scan analysis
 */
export function analyzeProgressiveScan(scanParameters) {
  const scanType = determineProgressiveScanType(
    scanParameters.spectralStart,
    scanParameters.spectralEnd,
    scanParameters.approximationHigh,
    scanParameters.approximationLow,
    scanParameters.componentIds.length
  );

  // Frequency range analysis
  let frequencyRange;
  if (scanParameters.spectralStart === 0 && scanParameters.spectralEnd === 0) {
    frequencyRange = "DC only";
  } else if (scanParameters.spectralStart === 0 && scanParameters.spectralEnd === 63) {
    frequencyRange = "Full spectrum";
  } else if (scanParameters.spectralStart === 1 && scanParameters.spectralEnd <= 5) {
    frequencyRange = "Low frequency AC";
  } else if (scanParameters.spectralStart <= 10 && scanParameters.spectralEnd <= 20) {
    frequencyRange = "Mid frequency AC";
  } else {
    frequencyRange = "High frequency AC";
  }

  // Approximation level analysis
  let approximationLevel;
  if (scanParameters.approximationHigh === 0 && scanParameters.approximationLow === 0) {
    approximationLevel = "Full precision";
  } else if (scanParameters.approximationHigh > 0) {
    approximationLevel = `${scanParameters.approximationHigh + 1}-bit precision`;
  } else {
    approximationLevel = `Refinement to ${scanParameters.approximationLow}-bit`;
  }

  // Quality impact assessment
  let qualityImpact;
  if (scanType === PROGRESSIVE_SCAN_TYPES.DC_FIRST) {
    qualityImpact = "High (preview quality)";
  } else if (scanType === PROGRESSIVE_SCAN_TYPES.AC_PROGRESSIVE && scanParameters.spectralEnd <= 10) {
    qualityImpact = "Medium-High (structural detail)";
  } else if (scanType === PROGRESSIVE_SCAN_TYPES.SA_REFINEMENT) {
    qualityImpact = "Low-Medium (precision refinement)";
  } else {
    qualityImpact = "Medium (detail enhancement)";
  }

  // Display suitability
  let displaySuitability;
  if (scanType === PROGRESSIVE_SCAN_TYPES.DC_FIRST) {
    displaySuitability = "Excellent for preview";
  } else if (scanType === PROGRESSIVE_SCAN_TYPES.SEQUENTIAL) {
    displaySuitability = "Complete image";
  } else if (scanParameters.spectralEnd <= 5) {
    displaySuitability = "Good for progressive display";
  } else {
    displaySuitability = "Detail enhancement";
  }

  return {
    scanType,
    frequencyRange,
    approximationLevel,
    componentCount: scanParameters.componentIds.length,
    qualityImpact,
    displaySuitability,
    description: `${scanType}: ${frequencyRange}, ${approximationLevel}, ${scanParameters.componentIds.length} components`,
  };
}
