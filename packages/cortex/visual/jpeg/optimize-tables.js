/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Optimal Huffman and quantization table generation for maximum JPEG compression efficiency.
 *
 * Implements advanced statistical analysis and optimization algorithms for generating
 * custom Huffman and quantization tables that maximize compression while preserving
 * visual quality. Uses content-adaptive optimization, perceptual modeling, and
 * rate-distortion optimization for optimal compression efficiency.
 */

import { collectSymbolStatistics, generateOptimalHuffmanTable } from "./huffman-encode.js";

/**
 * Image content types for adaptive optimization.
 * Different content types require different optimization strategies.
 */
export const CONTENT_TYPES = {
  /** Natural photographic images with smooth gradients */
  NATURAL: "natural",
  /** Computer-generated images with sharp edges */
  SYNTHETIC: "synthetic",
  /** Text and line art with high contrast */
  TEXT: "text",
  /** Mixed content requiring balanced optimization */
  MIXED: "mixed",
  /** Unknown content type requiring general optimization */
  UNKNOWN: "unknown",
};

/**
 * Optimization strategies for different quality/size trade-offs.
 * Each strategy emphasizes different aspects of compression.
 */
export const OPTIMIZATION_STRATEGIES = {
  /** Maximum compression with acceptable quality loss */
  SIZE: "size",
  /** Balanced compression and quality */
  BALANCED: "balanced",
  /** Maximum quality with reasonable compression */
  QUALITY: "quality",
  /** Custom optimization with user-defined parameters */
  CUSTOM: "custom",
};

/**
 * Perceptual weighting matrices for HVS-based quantization optimization.
 * Based on human visual system sensitivity to different frequencies.
 */
export const PERCEPTUAL_WEIGHTS = {
  /** Luminance perceptual weights (more sensitive to low frequencies) */
  LUMINANCE: new Float32Array([
    1.0, 1.1, 1.2, 1.4, 1.8, 2.3, 3.0, 4.0, 1.1, 1.2, 1.3, 1.5, 1.9, 2.5, 3.2, 4.2, 1.2, 1.3, 1.4, 1.7, 2.2, 2.8, 3.6,
    4.6, 1.4, 1.5, 1.7, 2.0, 2.6, 3.3, 4.2, 5.4, 1.8, 1.9, 2.2, 2.6, 3.3, 4.2, 5.4, 6.9, 2.3, 2.5, 2.8, 3.3, 4.2, 5.4,
    6.9, 8.8, 3.0, 3.2, 3.6, 4.2, 5.4, 6.9, 8.8, 11.2, 4.0, 4.2, 4.6, 5.4, 6.9, 8.8, 11.2, 14.3,
  ]),

  /** Chrominance perceptual weights (less sensitive overall) */
  CHROMINANCE: new Float32Array([
    1.0, 1.4, 1.8, 2.4, 3.2, 4.2, 5.6, 7.4, 1.4, 1.6, 2.0, 2.7, 3.6, 4.8, 6.3, 8.4, 1.8, 2.0, 2.4, 3.2, 4.2, 5.6, 7.4,
    9.8, 2.4, 2.7, 3.2, 4.0, 5.3, 7.0, 9.3, 12.3, 3.2, 3.6, 4.2, 5.3, 7.0, 9.3, 12.3, 16.3, 4.2, 4.8, 5.6, 7.0, 9.3,
    12.3, 16.3, 21.6, 5.6, 6.3, 7.4, 9.3, 12.3, 16.3, 21.6, 28.6, 7.4, 8.4, 9.8, 12.3, 16.3, 21.6, 28.6, 37.9,
  ]),
};

/**
 * Standard quantization tables for comparison and fallback.
 * ITU-T T.81 Annex K reference tables.
 */
export const STANDARD_QUANTIZATION_TABLES = {
  /** Standard luminance quantization table */
  LUMINANCE: new Uint8Array([
    16, 11, 10, 16, 24, 40, 51, 61, 12, 12, 14, 19, 26, 58, 60, 55, 14, 13, 16, 24, 40, 57, 69, 56, 14, 17, 22, 29, 51,
    87, 80, 62, 18, 22, 37, 56, 68, 109, 103, 77, 24, 35, 55, 64, 81, 104, 113, 92, 49, 64, 78, 87, 103, 121, 120, 101,
    72, 92, 95, 98, 112, 100, 103, 99,
  ]),

  /** Standard chrominance quantization table */
  CHROMINANCE: new Uint8Array([
    17, 18, 24, 47, 99, 99, 99, 99, 18, 21, 26, 66, 99, 99, 99, 99, 24, 26, 56, 99, 99, 99, 99, 99, 47, 66, 99, 99, 99,
    99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99,
    99, 99, 99, 99, 99, 99,
  ]),
};

/**
 * Default optimization options.
 * Balanced settings for general-purpose optimization.
 */
export const DEFAULT_OPTIMIZATION_OPTIONS = {
  strategy: OPTIMIZATION_STRATEGIES.BALANCED,
  contentType: CONTENT_TYPES.UNKNOWN,
  targetQuality: 75,
  targetSize: /** @type {number|null} */ (null),
  maxIterations: 5,
  convergenceThreshold: 0.01,
  enableHuffmanOptimization: true,
  enableQuantizationOptimization: true,
  enablePerceptualWeighting: true,
  enableContentAdaptation: true,
  preserveEdges: true,
  minimumQuality: 10,
  maximumQuality: 100,
};

/**
 * Analyze image content to determine optimal optimization strategy.
 * Uses statistical analysis of coefficient distributions and spatial characteristics.
 *
 * @param {Array<Int16Array>} coefficientBlocks - DCT coefficient blocks
 * @param {{
 *   enableEdgeDetection?: boolean,
 *   enableFrequencyAnalysis?: boolean,
 *   enableTextureAnalysis?: boolean
 * }} options - Analysis options
 * @returns {{
 *   contentType: string,
 *   characteristics: {
 *     edgeDensity: number,
 *     textureComplexity: number,
 *     frequencyDistribution: Float32Array,
 *     sparsityRatio: number,
 *     dynamicRange: number
 *   },
 *   recommendations: {
 *     strategy: string,
 *     targetQuality: number,
 *     emphasisFrequencies: string[]
 *   }
 * }} Content analysis results
 */
export function analyzeImageContent(coefficientBlocks, options = {}) {
  const { enableEdgeDetection = true, enableFrequencyAnalysis = true, enableTextureAnalysis = true } = options;

  if (!Array.isArray(coefficientBlocks) || coefficientBlocks.length === 0) {
    throw new Error("Must provide coefficient blocks for analysis");
  }

  // Initialize analysis metrics
  let totalCoefficients = 0;
  let nonZeroCoefficients = 0;
  let highFrequencyEnergy = 0;
  let lowFrequencyEnergy = 0;
  let edgeIndicators = 0;
  let textureIndicators = 0;

  const frequencyDistribution = new Float32Array(64);
  const coefficientMagnitudes = new Float32Array(64);
  let minCoefficient = Number.POSITIVE_INFINITY;
  let maxCoefficient = Number.NEGATIVE_INFINITY;

  // Analyze each block
  for (const block of coefficientBlocks) {
    if (!(block instanceof Int16Array) || block.length !== 64) {
      throw new Error("Invalid coefficient block format");
    }

    for (let i = 0; i < 64; i++) {
      const coefficient = block[i];
      const absCoeff = Math.abs(coefficient);

      totalCoefficients++;
      coefficientMagnitudes[i] += absCoeff;

      if (coefficient !== 0) {
        nonZeroCoefficients++;
        frequencyDistribution[i]++;

        // Track dynamic range
        minCoefficient = Math.min(minCoefficient, coefficient);
        maxCoefficient = Math.max(maxCoefficient, coefficient);

        // Frequency analysis
        if (enableFrequencyAnalysis) {
          if (i < 8) {
            // Low frequency (first row)
            lowFrequencyEnergy += absCoeff * absCoeff;
          } else if (i > 48) {
            // High frequency (bottom-right region)
            highFrequencyEnergy += absCoeff * absCoeff;
          }
        }

        // Edge detection (high AC coefficients indicate edges)
        if (enableEdgeDetection && i > 0 && absCoeff > 50) {
          edgeIndicators++;
        }

        // Texture analysis (medium frequency coefficients)
        if (enableTextureAnalysis && i >= 8 && i <= 48 && absCoeff > 20) {
          textureIndicators++;
        }
      }
    }
  }

  // Normalize metrics
  const blockCount = coefficientBlocks.length;
  const sparsityRatio = (totalCoefficients - nonZeroCoefficients) / totalCoefficients;
  const edgeDensity = edgeIndicators / blockCount;
  const textureComplexity = textureIndicators / blockCount;
  const dynamicRange = maxCoefficient - minCoefficient;

  // Normalize frequency distribution
  for (let i = 0; i < 64; i++) {
    frequencyDistribution[i] /= blockCount;
    coefficientMagnitudes[i] /= blockCount;
  }

  // Determine content type
  let contentType = CONTENT_TYPES.UNKNOWN;
  let recommendedStrategy = OPTIMIZATION_STRATEGIES.BALANCED;
  let targetQuality = 75;
  const emphasisFrequencies = [];

  // Content classification logic
  const highFrequencyRatio = highFrequencyEnergy / (lowFrequencyEnergy + highFrequencyEnergy + 1);

  if (sparsityRatio > 0.8 && edgeDensity > 10) {
    // High sparsity with many edges suggests synthetic/text content
    contentType = edgeDensity > 20 ? CONTENT_TYPES.TEXT : CONTENT_TYPES.SYNTHETIC;
    recommendedStrategy = OPTIMIZATION_STRATEGIES.QUALITY;
    targetQuality = 85;
    emphasisFrequencies.push("high");
  } else if (sparsityRatio < 0.6 && textureComplexity > 15) {
    // Low sparsity with high texture suggests natural images
    contentType = CONTENT_TYPES.NATURAL;
    recommendedStrategy = OPTIMIZATION_STRATEGIES.SIZE;
    targetQuality = 70;
    emphasisFrequencies.push("low", "medium");
  } else if (highFrequencyRatio > 0.3) {
    // High frequency content suggests mixed or synthetic
    contentType = CONTENT_TYPES.MIXED;
    recommendedStrategy = OPTIMIZATION_STRATEGIES.BALANCED;
    targetQuality = 75;
    emphasisFrequencies.push("medium", "high");
  } else {
    // Default to natural for smooth content
    contentType = CONTENT_TYPES.NATURAL;
    recommendedStrategy = OPTIMIZATION_STRATEGIES.BALANCED;
    targetQuality = 75;
    emphasisFrequencies.push("low");
  }

  return {
    contentType,
    characteristics: {
      edgeDensity,
      textureComplexity,
      frequencyDistribution,
      sparsityRatio,
      dynamicRange,
    },
    recommendations: {
      strategy: recommendedStrategy,
      targetQuality,
      emphasisFrequencies,
    },
  };
}

/**
 * Generate optimal Huffman tables from coefficient statistics.
 * Creates custom tables optimized for specific image content.
 *
 * @param {Array<Int16Array>} coefficientBlocks - DCT coefficient blocks
 * @param {{
 *   componentType?: string,
 *   enableLengthLimiting?: boolean,
 *   maxCodeLength?: number,
 *   minSymbolFrequency?: number
 * }} options - Optimization options
 * @returns {{
 *   dcTable: Object,
 *   acTable: Object,
 *   statistics: {
 *     dcSymbols: number,
 *     acSymbols: number,
 *     compressionImprovement: number,
 *     averageCodeLength: number
 *   }
 * }} Optimal Huffman tables
 */
export function generateOptimalHuffmanTables(coefficientBlocks, options = {}) {
  const {
    componentType = "luminance",
    enableLengthLimiting = true,
    maxCodeLength = 16,
    minSymbolFrequency = 1,
  } = options;

  if (!Array.isArray(coefficientBlocks) || coefficientBlocks.length === 0) {
    throw new Error("Must provide coefficient blocks for Huffman optimization");
  }

  // Collect symbol statistics
  const statistics = collectSymbolStatistics(coefficientBlocks, componentType);

  // Filter out infrequent symbols to improve compression
  const filteredDCStats = new Map();
  const filteredACStats = new Map();

  for (const [symbol, frequency] of statistics.dcStatistics) {
    if (frequency >= minSymbolFrequency) {
      filteredDCStats.set(symbol, frequency);
    }
  }

  for (const [symbol, frequency] of statistics.acStatistics) {
    if (frequency >= minSymbolFrequency) {
      filteredACStats.set(symbol, frequency);
    }
  }

  // Generate optimal tables (with fallback for empty statistics)
  let dcTable, acTable;

  try {
    dcTable = filteredDCStats.size > 0 ? generateOptimalHuffmanTable(filteredDCStats) : createMinimalHuffmanTable();
  } catch (_error) {
    dcTable = createMinimalHuffmanTable();
  }

  try {
    acTable = filteredACStats.size > 0 ? generateOptimalHuffmanTable(filteredACStats) : createMinimalHuffmanTable();
  } catch (_error) {
    acTable = createMinimalHuffmanTable();
  }

  // Apply length limiting if enabled
  if (enableLengthLimiting) {
    /** @type {any} */ (dcTable).codes = limitCodeLengths(/** @type {any} */ (dcTable).codes, maxCodeLength);
    /** @type {any} */ (acTable).codes = limitCodeLengths(/** @type {any} */ (acTable).codes, maxCodeLength);
  }

  // Calculate compression improvement
  const standardDCEntropy = calculateEntropy(statistics.dcStatistics);
  const standardACEntropy = calculateEntropy(statistics.acStatistics);
  const optimizedDCEntropy = calculateHuffmanEntropy(/** @type {any} */ (dcTable).codes, filteredDCStats);
  const optimizedACEntropy = calculateHuffmanEntropy(/** @type {any} */ (acTable).codes, filteredACStats);

  const standardTotalEntropy = standardDCEntropy + standardACEntropy;
  const optimizedTotalEntropy = optimizedDCEntropy + optimizedACEntropy;
  const compressionImprovement = (standardTotalEntropy - optimizedTotalEntropy) / standardTotalEntropy;

  return {
    dcTable,
    acTable,
    statistics: {
      dcSymbols: filteredDCStats.size,
      acSymbols: filteredACStats.size,
      compressionImprovement,
      averageCodeLength: (optimizedDCEntropy + optimizedACEntropy) / (filteredDCStats.size + filteredACStats.size),
    },
  };
}

/**
 * Generate optimal quantization table using rate-distortion optimization.
 * Balances compression efficiency with perceptual quality.
 *
 * @param {Array<Int16Array>} coefficientBlocks - DCT coefficient blocks
 * @param {{
 *   baseTable?: Uint8Array,
 *   targetQuality?: number,
 *   targetBitRate?: number,
 *   perceptualWeights?: Float32Array,
 *   enablePerceptualOptimization?: boolean,
 *   maxIterations?: number,
 *   convergenceThreshold?: number
 * }} options - Optimization options
 * @returns {{
 *   quantizationTable: Uint8Array,
 *   metrics: {
 *     estimatedQuality: number,
 *     estimatedBitRate: number,
 *     perceptualScore: number,
 *     iterations: number
 *   }
 * }} Optimal quantization table
 */
export function generateOptimalQuantizationTable(coefficientBlocks, options = {}) {
  const {
    baseTable = STANDARD_QUANTIZATION_TABLES.LUMINANCE,
    targetQuality = 75,
    targetBitRate = null,
    perceptualWeights = PERCEPTUAL_WEIGHTS.LUMINANCE,
    enablePerceptualOptimization = true,
    maxIterations = 10,
    convergenceThreshold = 0.01,
  } = options;

  if (!Array.isArray(coefficientBlocks) || coefficientBlocks.length === 0) {
    throw new Error("Must provide coefficient blocks for quantization optimization");
  }

  if (!(baseTable instanceof Uint8Array) || baseTable.length !== 64) {
    throw new Error("Base table must be Uint8Array with 64 elements");
  }

  // Analyze coefficient statistics
  const coefficientStats = analyzeCoefficientsStatistics(coefficientBlocks);

  // Initialize quantization table
  let quantTable = new Uint8Array(baseTable);
  const bestTable = new Uint8Array(quantTable);
  let bestScore = Number.NEGATIVE_INFINITY;
  let iterations = 0;

  // Iterative optimization
  for (let iter = 0; iter < maxIterations; iter++) {
    iterations = iter + 1;

    // Calculate current quality metrics
    const currentMetrics = evaluateQuantizationTable(quantTable, coefficientStats, perceptualWeights);

    // Rate-distortion optimization
    const lagrangian = calculateLagrangianCost(currentMetrics, targetQuality, targetBitRate);

    if (lagrangian > bestScore) {
      bestScore = lagrangian;
      bestTable.set(quantTable);
    }

    // Generate improved table
    const improvedTable = optimizeTableStep(quantTable, coefficientStats, currentMetrics, {
      targetQuality,
      targetBitRate,
      perceptualWeights,
      enablePerceptualOptimization,
    });

    // Check convergence
    const improvement = calculateTableDifference(quantTable, improvedTable);
    if (improvement < convergenceThreshold) {
      break;
    }

    quantTable = improvedTable;
  }

  // Calculate final metrics
  const finalMetrics = evaluateQuantizationTable(bestTable, coefficientStats, perceptualWeights);

  return {
    quantizationTable: bestTable,
    metrics: {
      estimatedQuality: /** @type {any} */ (finalMetrics).estimatedQuality,
      estimatedBitRate: /** @type {any} */ (finalMetrics).estimatedBitRate,
      perceptualScore: /** @type {any} */ (finalMetrics).perceptualScore,
      iterations,
    },
  };
}

/**
 * Perform complete table optimization for maximum compression efficiency.
 * Jointly optimizes both Huffman and quantization tables.
 *
 * @param {Array<Int16Array>} coefficientBlocks - DCT coefficient blocks
 * @param {Object} options - Optimization options
 * @returns {Promise<{
 *   huffmanTables: {
 *     dcLuminance: Object,
 *     acLuminance: Object,
 *     dcChrominance: Object,
 *     acChrominance: Object
 *   },
 *   quantizationTables: {
 *     luminance: Uint8Array,
 *     chrominance: Uint8Array
 *   },
 *   optimization: {
 *     contentAnalysis: Object,
 *     compressionImprovement: number,
 *     qualityScore: number,
 *     iterations: number,
 *     convergenceAchieved: boolean
 *   }
 * }>} Complete optimization results
 */
export async function optimizeTablesComplete(coefficientBlocks, options = {}) {
  const opts = { ...DEFAULT_OPTIMIZATION_OPTIONS, ...options };

  if (!Array.isArray(coefficientBlocks) || coefficientBlocks.length === 0) {
    throw new Error("Must provide coefficient blocks for optimization");
  }

  // Analyze image content
  const contentAnalysis = analyzeImageContent(coefficientBlocks, {
    enableEdgeDetection: opts.enableContentAdaptation,
    enableFrequencyAnalysis: true,
    enableTextureAnalysis: opts.enableContentAdaptation,
  });

  // Adapt options based on content analysis
  const adaptedOptions = adaptOptionsToContent(opts, contentAnalysis);

  // Separate luminance and chrominance blocks (simplified assumption)
  const luminanceBlocks = coefficientBlocks;
  const chrominanceBlocks = coefficientBlocks; // In real implementation, would separate

  let huffmanTables = null;
  let quantizationTables = null;
  let totalIterations = 0;
  let convergenceAchieved = false;
  let previousScore = 0;

  // Joint optimization loop
  for (let iter = 0; iter < /** @type {any} */ (adaptedOptions).maxIterations; iter++) {
    totalIterations = iter + 1;

    // Generate optimal Huffman tables
    if (/** @type {any} */ (adaptedOptions).enableHuffmanOptimization) {
      const lumHuffman = generateOptimalHuffmanTables(luminanceBlocks, {
        componentType: "luminance",
        maxCodeLength: 16,
      });

      const chromaHuffman = generateOptimalHuffmanTables(chrominanceBlocks, {
        componentType: "chrominance",
        maxCodeLength: 16,
      });

      huffmanTables = {
        dcLuminance: lumHuffman.dcTable,
        acLuminance: lumHuffman.acTable,
        dcChrominance: chromaHuffman.dcTable,
        acChrominance: chromaHuffman.acTable,
      };
    }

    // Generate optimal quantization tables
    if (/** @type {any} */ (adaptedOptions).enableQuantizationOptimization) {
      const lumQuantTable = generateOptimalQuantizationTable(luminanceBlocks, {
        baseTable: STANDARD_QUANTIZATION_TABLES.LUMINANCE,
        targetQuality: /** @type {any} */ (adaptedOptions).targetQuality,
        perceptualWeights: PERCEPTUAL_WEIGHTS.LUMINANCE,
        enablePerceptualOptimization: /** @type {any} */ (adaptedOptions).enablePerceptualWeighting,
        maxIterations: 5,
      });

      const chromaQuantTable = generateOptimalQuantizationTable(chrominanceBlocks, {
        baseTable: STANDARD_QUANTIZATION_TABLES.CHROMINANCE,
        targetQuality: /** @type {any} */ (adaptedOptions).targetQuality,
        perceptualWeights: PERCEPTUAL_WEIGHTS.CHROMINANCE,
        enablePerceptualOptimization: /** @type {any} */ (adaptedOptions).enablePerceptualWeighting,
        maxIterations: 5,
      });

      quantizationTables = {
        luminance: lumQuantTable.quantizationTable,
        chrominance: chromaQuantTable.quantizationTable,
      };
    }

    // Evaluate overall optimization score
    const currentScore = evaluateOptimizationScore(huffmanTables, quantizationTables, contentAnalysis);

    // Check convergence
    if (Math.abs(currentScore - previousScore) < /** @type {any} */ (adaptedOptions).convergenceThreshold) {
      convergenceAchieved = true;
      break;
    }

    previousScore = currentScore;
  }

  // Calculate compression improvement
  const compressionImprovement = estimateCompressionImprovement(huffmanTables, quantizationTables, contentAnalysis);

  return {
    huffmanTables: /** @type {any} */ (huffmanTables || (await generateFallbackHuffmanTables())),
    quantizationTables: /** @type {any} */ (quantizationTables || generateFallbackQuantizationTables()),
    optimization: {
      contentAnalysis,
      compressionImprovement,
      qualityScore: previousScore,
      iterations: totalIterations,
      convergenceAchieved,
    },
  };
}

/**
 * Limit Huffman code lengths to JPEG specification limits.
 * Ensures all codes are ≤16 bits as required by JPEG standard.
 *
 * @param {Map<any, any>} codes - Original Huffman codes
 * @param {number} maxLength - Maximum allowed code length
 * @returns {Map<any, any>} Length-limited codes
 */
function limitCodeLengths(codes, maxLength) {
  const limitedCodes = new Map();

  // Sort symbols by frequency (most frequent first)
  const sortedEntries = Array.from(codes.entries()).sort((a, b) => {
    return a[1].length - b[1].length; // Sort by code length
  });

  for (const [symbol, codeInfo] of sortedEntries) {
    if (codeInfo.length <= maxLength) {
      limitedCodes.set(symbol, codeInfo);
    } else {
      // Assign maximum length code to infrequent symbols
      limitedCodes.set(symbol, {
        code: limitedCodes.size,
        length: maxLength,
      });
    }
  }

  return limitedCodes;
}

/**
 * Calculate Shannon entropy of symbol distribution.
 * Theoretical minimum bits required for lossless compression.
 *
 * @param {Map<any, any>} symbolFrequencies - Symbol frequency map
 * @returns {number} Entropy in bits
 */
function calculateEntropy(symbolFrequencies) {
  const totalSymbols = Array.from(symbolFrequencies.values()).reduce((sum, freq) => sum + freq, 0);

  if (totalSymbols === 0) return 0;

  let entropy = 0;
  for (const frequency of symbolFrequencies.values()) {
    if (frequency > 0) {
      const probability = frequency / totalSymbols;
      entropy -= probability * Math.log2(probability);
    }
  }

  return entropy;
}

/**
 * Calculate Huffman entropy with specific code assignments.
 * Actual bits required with given Huffman codes.
 *
 * @param {Map<any, any>} codes - Huffman code assignments
 * @param {Map<any, any>} frequencies - Symbol frequencies
 * @returns {number} Huffman entropy in bits
 */
function calculateHuffmanEntropy(codes, frequencies) {
  let totalBits = 0;
  let totalSymbols = 0;

  for (const [symbol, frequency] of frequencies) {
    const codeInfo = codes.get(symbol);
    if (codeInfo) {
      totalBits += frequency * codeInfo.length;
      totalSymbols += frequency;
    }
  }

  return totalSymbols > 0 ? totalBits / totalSymbols : 0;
}

/**
 * Analyze coefficient statistics for quantization optimization.
 * @private
 *
 * @param {Array<Int16Array>} coefficientBlocks - DCT coefficient blocks
 * @returns {Object} Statistical analysis results
 */
function analyzeCoefficientsStatistics(coefficientBlocks) {
  const stats = {
    means: new Float32Array(64),
    variances: new Float32Array(64),
    energies: new Float32Array(64),
    counts: new Uint32Array(64),
  };

  // Calculate statistics for each frequency
  for (const block of coefficientBlocks) {
    for (let i = 0; i < 64; i++) {
      const coeff = block[i];
      stats.means[i] += coeff;
      stats.energies[i] += coeff * coeff;
      if (coeff !== 0) stats.counts[i]++;
    }
  }

  // Normalize
  const blockCount = coefficientBlocks.length;
  for (let i = 0; i < 64; i++) {
    stats.means[i] /= blockCount;
    stats.energies[i] /= blockCount;
    stats.variances[i] = stats.energies[i] - stats.means[i] * stats.means[i];
  }

  return stats;
}

/**
 * Evaluate quantization table quality metrics.
 * @private
 *
 * @param {Uint8Array} quantTable - Quantization table
 * @param {Object} coeffStats - Coefficient statistics
 * @param {Float32Array} perceptualWeights - Perceptual weighting
 * @returns {Object} Quality metrics
 */
function evaluateQuantizationTable(quantTable, coeffStats, perceptualWeights) {
  let estimatedQuality = 0;
  let estimatedBitRate = 0;
  let perceptualScore = 0;

  for (let i = 0; i < 64; i++) {
    const quantValue = quantTable[i];
    const variance = /** @type {any} */ (coeffStats).variances[i];
    const perceptualWeight = perceptualWeights[i];

    // Estimate quality based on quantization error
    const quantizationError = variance / (quantValue * quantValue);
    estimatedQuality += quantizationError * perceptualWeight;

    // Estimate bit rate based on quantized coefficient distribution
    const effectiveCoeffs = Math.max(1, /** @type {any} */ (coeffStats).counts[i] / quantValue);
    estimatedBitRate += Math.log2(effectiveCoeffs + 1);

    // Perceptual score (lower quantization error for perceptually important frequencies)
    perceptualScore += (1 / quantizationError) * perceptualWeight;
  }

  return /** @type {any} */ ({
    estimatedQuality: Math.max(0, 100 - estimatedQuality * 10),
    estimatedBitRate: estimatedBitRate / 64,
    perceptualScore: perceptualScore / 64,
  });
}

/**
 * Calculate Lagrangian cost for rate-distortion optimization.
 * @private
 *
 * @param {Object} metrics - Current quality metrics
 * @param {number} targetQuality - Target quality level
 * @param {number|null} targetBitRate - Target bit rate (optional)
 * @returns {number} Lagrangian cost
 */
function calculateLagrangianCost(metrics, targetQuality, targetBitRate) {
  const qualityError = Math.abs(/** @type {any} */ (metrics).estimatedQuality - targetQuality);
  const lambda = targetBitRate ? 1.0 : 0.1; // Weight distortion vs rate

  if (targetBitRate) {
    const rateError = Math.abs(/** @type {any} */ (metrics).estimatedBitRate - targetBitRate);
    return -(qualityError + lambda * rateError);
  }

  return /** @type {any} */ (metrics).perceptualScore - lambda * qualityError;
}

/**
 * Optimize quantization table by one step.
 * @private
 *
 * @param {Uint8Array} currentTable - Current quantization table
 * @param {Object} coeffStats - Coefficient statistics
 * @param {any} _currentMetrics - Current quality metrics (unused)
 * @param {Object} options - Optimization options
 * @returns {Uint8Array} Improved quantization table
 */
function optimizeTableStep(currentTable, coeffStats, _currentMetrics, options) {
  const newTable = new Uint8Array(currentTable);
  const stepSize = Math.max(1, Math.floor(/** @type {any} */ (options).targetQuality / 20));

  for (let i = 0; i < 64; i++) {
    const currentValue = currentTable[i];
    const variance = /** @type {any} */ (coeffStats).variances[i];
    const perceptualWeight = /** @type {any} */ (options).perceptualWeights[i];

    // Adjust quantization value based on coefficient importance
    let adjustment = 0;

    if (/** @type {any} */ (options).enablePerceptualOptimization) {
      // Reduce quantization for perceptually important frequencies
      adjustment = -Math.round((stepSize * perceptualWeight) / 10);
    }

    // Adjust based on coefficient variance
    if (variance > 1000) {
      adjustment += stepSize; // Increase quantization for high variance
    } else if (variance < 100) {
      adjustment -= stepSize; // Decrease quantization for low variance
    }

    // Apply adjustment with bounds checking
    const newValue = Math.max(1, Math.min(255, currentValue + adjustment));
    newTable[i] = newValue;
  }

  return newTable;
}

/**
 * Calculate difference between two quantization tables.
 * @private
 *
 * @param {Uint8Array} table1 - First table
 * @param {Uint8Array} table2 - Second table
 * @returns {number} Normalized difference
 */
function calculateTableDifference(table1, table2) {
  let totalDifference = 0;

  for (let i = 0; i < 64; i++) {
    totalDifference += Math.abs(table1[i] - table2[i]);
  }

  return totalDifference / (64 * 255); // Normalize to 0-1 range
}

/**
 * Adapt optimization options based on content analysis.
 * @private
 *
 * @param {Object} options - Original options
 * @param {Object} contentAnalysis - Content analysis results
 * @returns {Object} Adapted options
 */
function adaptOptionsToContent(options, contentAnalysis) {
  const adapted = { ...options };
  const { contentType, recommendations } = /** @type {any} */ (contentAnalysis);

  // Adapt strategy
  if (/** @type {any} */ (options).strategy === OPTIMIZATION_STRATEGIES.BALANCED) {
    /** @type {any} */ (adapted).strategy = /** @type {any} */ (recommendations).strategy;
  }

  // Adapt target quality
  if (contentType === CONTENT_TYPES.TEXT || contentType === CONTENT_TYPES.SYNTHETIC) {
    /** @type {any} */ (adapted).targetQuality = Math.max(/** @type {any} */ (adapted).targetQuality, 80);
    /** @type {any} */ (adapted).preserveEdges = true;
  } else if (contentType === CONTENT_TYPES.NATURAL) {
    /** @type {any} */ (adapted).targetQuality = Math.min(/** @type {any} */ (adapted).targetQuality, 75);
  }

  // Adapt iterations based on complexity
  if (/** @type {any} */ (contentAnalysis).characteristics.textureComplexity > 20) {
    /** @type {any} */ (adapted).maxIterations = Math.max(/** @type {any} */ (adapted).maxIterations, 8);
  }

  return adapted;
}

/**
 * Evaluate overall optimization score.
 * @private
 *
 * @param {Object} huffmanTables - Huffman tables
 * @param {Object} quantizationTables - Quantization tables
 * @param {any} _contentAnalysis - Content analysis (unused)
 * @returns {number} Optimization score
 */
function evaluateOptimizationScore(huffmanTables, quantizationTables, _contentAnalysis) {
  // Simplified scoring based on expected compression efficiency
  let score = 0;

  if (huffmanTables) {
    // Score based on average code length (lower is better)
    score += 50 / /** @type {any} */ ((huffmanTables).dcLuminance?.averageCodeLength + 1 || 1);
    score += 50 / /** @type {any} */ ((huffmanTables).acLuminance?.averageCodeLength + 1 || 1);
  }

  if (quantizationTables) {
    // Score based on table efficiency (balanced quantization)
    const avgQuant =
      /** @type {any} */ (quantizationTables).luminance.reduce(
        (/** @type {any} */ sum, /** @type {any} */ val) => sum + val,
        0
      ) / 64;
    score += 100 / (avgQuant + 1); // Prefer moderate quantization
  }

  return score;
}

/**
 * Estimate compression improvement over standard tables.
 * @private
 *
 * @param {Object} huffmanTables - Optimized Huffman tables
 * @param {Object} quantizationTables - Optimized quantization tables
 * @param {Object} contentAnalysis - Content analysis
 * @returns {number} Estimated improvement ratio
 */
function estimateCompressionImprovement(huffmanTables, quantizationTables, contentAnalysis) {
  // Simplified estimation based on content characteristics
  let improvement = 0;

  // Huffman improvement
  if (huffmanTables) {
    improvement += /** @type {any} */ (contentAnalysis).characteristics.sparsityRatio * 0.1; // Up to 10% from Huffman
  }

  // Quantization improvement
  if (quantizationTables) {
    improvement += (1 - /** @type {any} */ (contentAnalysis).characteristics.sparsityRatio) * 0.05; // Up to 5% from quantization
  }

  // Content-specific improvements
  if (/** @type {any} */ (contentAnalysis).contentType === CONTENT_TYPES.SYNTHETIC) {
    improvement += 0.05; // Synthetic content compresses better
  }

  return Math.min(improvement, 0.2); // Cap at 20% improvement
}

/**
 * Create minimal Huffman table for edge cases.
 * @private
 *
 * @returns {Object} Minimal Huffman table
 */
function createMinimalHuffmanTable() {
  return {
    codeLengths: [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    symbols: [0],
    codes: new Map([[0, { code: 0, length: 1 }]]),
    averageCodeLength: 1.0,
    compressionRatio: 1.0,
  };
}

/**
 * Generate fallback Huffman tables.
 * @private
 *
 * @returns {Promise<Object>} Standard Huffman tables
 */
async function generateFallbackHuffmanTables() {
  // Import standard tables from huffman-encode module
  const { getStandardHuffmanTable, HUFFMAN_TABLE_TYPES, HUFFMAN_TABLE_CLASSES } = await import("./huffman-encode.js");

  return {
    dcLuminance: getStandardHuffmanTable(HUFFMAN_TABLE_TYPES.DC, HUFFMAN_TABLE_CLASSES.LUMINANCE),
    acLuminance: getStandardHuffmanTable(HUFFMAN_TABLE_TYPES.AC, HUFFMAN_TABLE_CLASSES.LUMINANCE),
    dcChrominance: getStandardHuffmanTable(HUFFMAN_TABLE_TYPES.DC, HUFFMAN_TABLE_CLASSES.CHROMINANCE),
    acChrominance: getStandardHuffmanTable(HUFFMAN_TABLE_TYPES.AC, HUFFMAN_TABLE_CLASSES.CHROMINANCE),
  };
}

/**
 * Generate fallback quantization tables.
 * @private
 *
 * @returns {Object} Standard quantization tables
 */
function generateFallbackQuantizationTables() {
  return {
    luminance: new Uint8Array(STANDARD_QUANTIZATION_TABLES.LUMINANCE),
    chrominance: new Uint8Array(STANDARD_QUANTIZATION_TABLES.CHROMINANCE),
  };
}
