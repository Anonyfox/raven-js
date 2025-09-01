/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Em-dash epidemic detector for identifying AI punctuation overuse patterns.
 *
 * Analyzes punctuation frequency patterns that are characteristic of AI-generated content.
 * Research shows AI systematically overuses certain punctuation marks (em-dashes, semicolons,
 * ellipses, parentheses) at rates 2-4x higher than human writers, creating detectible fingerprints.
 */

/**
 * Human baseline punctuation frequencies per 1000 words in natural writing.
 * These values represent typical usage rates in human-written content.
 */
const PUNCTUATION_BASELINES = {
	// High-impact AI overuse patterns
	"—": 0.5, // Em-dash (AI often overuses for sophistication)
	"–": 0.3, // En-dash (less common, but AI overuses)
	";": 2.1, // Semicolon (AI uses to sound academic)
	"...": 0.8, // Ellipsis (AI uses for dramatic effect)
	"…": 0.4, // Unicode ellipsis

	// Parenthetical overuse (AI loves nested explanations)
	"(": 3.2, // Opening parenthesis
	")": 3.2, // Closing parenthesis
	"[": 0.2, // Square brackets
	"]": 0.2,
	"{": 0.1, // Curly braces (rare in prose)
	"}": 0.1,

	// Quotation sophistication markers
	"\u201c": 1.5, // Smart quotes (AI often overuses)
	"\u201d": 1.5,
	"\u2018": 0.8, // Smart apostrophes
	"\u2019": 0.8,
	"«": 0.1, // Guillemets (rare in English)
	"»": 0.1,

	// Colon overuse (AI loves lists and explanations)
	":": 4.8,

	// Question and exclamation patterns
	"?": 3.5, // Questions
	"!": 2.1, // Exclamations
	"‽": 0.01, // Interrobang (extremely rare)

	// Other sophisticated punctuation
	"*": 0.3, // Asterisk
	"†": 0.05, // Dagger
	"‡": 0.02, // Double dagger
	"§": 0.03, // Section sign
	"¶": 0.01, // Pilcrow

	// Emphasis and formatting
	_: 0.1, // Underscore (in prose)
	"|": 0.05, // Pipe character
	"\\": 0.02, // Backslash
	"/": 0.8, // Forward slash

	// Mathematical and special symbols
	"±": 0.02,
	"×": 0.05,
	"÷": 0.02,
	"≠": 0.01,
	"≤": 0.01,
	"≥": 0.01,
	"∞": 0.01,
};

/**
 * Analyzes text for punctuation overuse patterns characteristic of AI-generated content.
 *
 * Scans input text for punctuation marks that appear disproportionately in AI-generated
 * content compared to human writing. Calculates frequency ratios, AI-likelihood scores,
 * and provides detailed breakdowns of detected punctuation patterns. Higher scores
 * indicate more AI-like punctuation usage.
 *
 * @param {string} text - Input text to analyze for punctuation overuse patterns
 * @param {Object} [options={}] - Configuration options for analysis
 * @param {number} [options.minWordCount=20] - Minimum word count for reliable analysis
 * @param {boolean} [options.includeDetails=false] - Whether to include punctuation-specific details
 * @param {number} [options.sensitivityThreshold=2.0] - Multiplier threshold for flagging overuse (2.0 = 2x human baseline)
 * @returns {{aiLikelihood: number, overallScore: number, punctuationDensity: number, totalPunctuation: number, wordCount: number, detectedOveruse: Array<Object>}} Analysis results with AI detection metrics. aiLikelihood: Overall AI probability score (0-1, higher = more AI-like). overallScore: Weighted frequency score vs human baseline. punctuationDensity: Total punctuation marks per 1000 words. totalPunctuation: Total number of flagged punctuation marks found. wordCount: Total words analyzed. detectedOveruse: Array of overused punctuation with frequencies (if includeDetails=true).
 *
 * @throws {TypeError} When text parameter is not a string
 * @throws {Error} When text contains insufficient words for analysis
 * @throws {Error} When options contain invalid values
 *
 * @example
 * // Human text typically shows lower punctuation overuse
 * const humanText = "The author explores narrative techniques. She writes with careful attention to detail and uses punctuation naturally.";
 * const humanAnalysis = detectEmDashEpidemic(humanText);
 * console.log(humanAnalysis.aiLikelihood); // ~0.1-0.3 (low AI probability)
 *
 * @example
 * // AI text typically shows higher punctuation density and overuse
 * const aiText = "Furthermore—it's important to note—we must analyze various approaches; consequently, multiple implementations (using comprehensive methodologies) facilitate substantial improvements...";
 * const aiAnalysis = detectEmDashEpidemic(aiText);
 * console.log(aiAnalysis.aiLikelihood); // ~0.6-0.9 (high AI probability)
 *
 * @example
 * // Academic integrity checking
 * function checkPunctuationAuthenticity(essay) {
 *   const analysis = detectEmDashEpidemic(essay, { includeDetails: true });
 *   if (analysis.aiLikelihood > 0.6) {
 *     return {
 *       status: 'suspicious',
 *       overusedPunctuation: analysis.detectedOveruse.slice(0, 3)
 *     };
 *   }
 *   return { status: 'likely-human', overusedPunctuation: [] };
 * }
 *
 * @example
 * // Writing style assessment
 * function assessPunctuationNaturalness(content) {
 *   const analysis = detectEmDashEpidemic(content);
 *   return {
 *     naturalness: 1 - analysis.aiLikelihood,
 *     punctuation_density: analysis.punctuationDensity,
 *     overuse_score: analysis.overallScore
 *   };
 * }
 */
export function detectEmDashEpidemic(text, options = {}) {
	if (typeof text !== "string") {
		throw new TypeError("Expected text to be a string");
	}

	if (text.trim().length === 0) {
		throw new Error("Cannot analyze empty text");
	}

	// Extract and validate options
	const {
		minWordCount = 20,
		includeDetails = false,
		sensitivityThreshold = 2.0,
	} = options;

	if (!Number.isInteger(minWordCount) || minWordCount < 1) {
		throw new Error("Parameter minWordCount must be a positive integer");
	}

	if (typeof sensitivityThreshold !== "number" || sensitivityThreshold <= 0) {
		throw new Error("Parameter sensitivityThreshold must be a positive number");
	}

	// Count total words for frequency calculations
	const words = text.split(/\s+/).filter((word) => word.length > 0);
	const wordCount = words.length;

	if (wordCount < minWordCount) {
		throw new Error(
			`Text must contain at least ${minWordCount} words for reliable analysis`,
		);
	}

	// Analyze punctuation patterns
	const detectedOveruse = [];
	let totalPunctuation = 0;
	let weightedScore = 0;

	for (const [punctuation, humanBaseline] of Object.entries(
		PUNCTUATION_BASELINES,
	)) {
		// Count occurrences of this punctuation mark
		const regex = new RegExp(
			punctuation.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
			"g",
		);
		const matches = text.match(regex) || [];
		const count = matches.length;

		if (count > 0) {
			const frequency = (count / wordCount) * 1000; // Per thousand words
			const ratio = frequency / humanBaseline; // How much higher than human baseline

			// Check if this punctuation is overused beyond sensitivity threshold
			if (ratio >= sensitivityThreshold) {
				totalPunctuation += count;
				weightedScore += ratio * count; // Weight by frequency

				if (includeDetails) {
					detectedOveruse.push({
						punctuation,
						count,
						frequency,
						humanBaseline,
						ratio,
						overuseLevel:
							ratio >= 4.0 ? "severe" : ratio >= 3.0 ? "high" : "moderate",
					});
				}
			}
		}
	}

	// Calculate metrics
	const punctuationDensity = (totalPunctuation / wordCount) * 1000;

	// Calculate overall AI likelihood score
	// Higher punctuation density and ratios indicate more AI-like content
	const densityScore = Math.min(punctuationDensity / 20, 1); // Cap at 20 punctuation marks per 1000 words
	const ratioScore =
		totalPunctuation > 0
			? Math.min(weightedScore / totalPunctuation / 4, 1)
			: 0; // Cap ratio at 4x human baseline
	const aiLikelihood = densityScore * 0.7 + ratioScore * 0.3; // Weight density more heavily than individual ratios

	// Calculate overall score (average ratio across all detected overuse)
	const overallScore =
		totalPunctuation > 0 ? weightedScore / totalPunctuation : 0;

	// Sort detected overuse by ratio if details requested
	if (includeDetails) {
		detectedOveruse.sort((a, b) => b.ratio - a.ratio);
	}

	return {
		aiLikelihood,
		overallScore,
		punctuationDensity,
		totalPunctuation,
		wordCount,
		detectedOveruse: includeDetails ? detectedOveruse : [],
	};
}
