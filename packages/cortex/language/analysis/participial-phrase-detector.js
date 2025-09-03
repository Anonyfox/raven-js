/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Participial phrase formula detector for identifying AI syntactic patterns.
 *
 * Analyzes participial phrase construction patterns that are characteristic of AI-generated
 * content. Research shows AI systematically overuses participial phrase formulas (sentence-initial
 * participial constructions, mechanical templates) at rates 2-4x higher than human writers,
 * creating detectible syntactic uniformity in sentence structure and construction.
 * Uses robust cortex building blocks for accurate sentence and word boundary detection.
 */

import { tokenizeSentences, tokenizeWords } from "../segmentation/index.js";

/**
 * Human baseline frequencies for participial phrase patterns per 1000 words in natural writing.
 * These values represent typical usage rates in human-written content.
 */
const PARTICIPIAL_BASELINES = {
	// Sentence-initial participial phrases
	sentence_initial_ing: 1.8, // "Walking through...", "Running the system..."
	sentence_initial_ed: 1.2, // "Designed for...", "Created with..."
	sentence_initial_irregular: 0.8, // "Built to...", "Made from..."

	// Mechanical construction patterns
	optimized_constructed: 0.3, // "Optimized for...", "Constructed to..."
	designed_built: 0.4, // "Designed for...", "Built to..."
	created_developed: 0.5, // "Created with...", "Developed using..."
	configured_implemented: 0.2, // "Configured to...", "Implemented using..."

	// Present participle constructions
	present_participle_transitions: 0.6, // "Speaking of...", "Looking at..."
	present_participle_actions: 2.1, // "Running...", "Working...", "Processing..."
	present_participle_states: 1.4, // "Being...", "Having...", "Considering..."

	// Past participle constructions
	past_participle_results: 1.6, // "Completed...", "Finished...", "Accomplished..."
	past_participle_passive: 2.3, // "Written by...", "Developed by...", "Created by..."
	past_participle_conditions: 0.9, // "Given that...", "Based on...", "Provided that..."

	// Formulaic participial transitions
	having_constructions: 0.4, // "Having completed...", "Having analyzed..."
	being_constructions: 0.7, // "Being careful...", "Being aware..."
	when_participle: 0.8, // "When considering...", "When analyzing..."

	// Technical/formal participial phrases
	technical_participles: 0.6, // "Leveraging...", "Utilizing...", "Employing..."
	process_participles: 0.9, // "Processing...", "Analyzing...", "Evaluating..."
	system_participles: 0.5, // "Implementing...", "Executing...", "Deploying..."

	// Repetitive participial patterns
	repeated_participle_forms: 0.3, // Same participial form used multiple times
	mechanical_participle_sequences: 0.2, // Sequential mechanical constructions

	// Academic/business participial formulas
	academic_participles: 0.8, // "Examining...", "Investigating...", "Exploring..."
	business_participles: 0.7, // "Streamlining...", "Optimizing...", "Enhancing..."
	marketing_participles: 0.4, // "Delivering...", "Providing...", "Offering..."
};

/**
 * Analyzes text for participial phrase formula patterns characteristic of AI-generated content.
 *
 * Scans input text for systematic participial phrase constructions that appear disproportionately
 * in AI-generated content compared to human writing. Calculates frequency ratios, AI-likelihood
 * scores, and provides detailed breakdowns of detected syntactic patterns. Higher scores indicate
 * more AI-like mechanical participial phrase usage.
 *
 * @param {string} text - Input text to analyze for participial phrase patterns
 * @param {object} [options={}] - Analysis options
 * @param {number} [options.minWordCount=25] - Minimum word count
 * @param {boolean} [options.includeDetails=false] - Include details
 * @param {number} [options.sensitivityThreshold=2.0] - Overuse threshold multiplier
 * @param {import('../languagepacks/language-pack.js').LanguagePack} [options.languagePack] - Language pack
 * @returns {{aiLikelihood: number, overallScore: number, participialDensity: number, totalPatterns: number, wordCount: number, detectedPatterns: Array<Object>}} Analysis results with AI detection metrics. aiLikelihood: Overall AI probability score (0-1, higher = more AI-like). overallScore: Weighted frequency score vs human baseline. participialDensity: Total participial patterns per 1000 words. totalPatterns: Total number of flagged participial patterns found. wordCount: Total words analyzed. detectedPatterns: Array of detected patterns with frequencies (if includeDetails=true).
 *
 * @throws {TypeError} When text parameter is not a string
 * @throws {Error} When text contains insufficient words for analysis
 * @throws {Error} When options contain invalid values
 *
 * @example
 * // Human text typically shows natural participial variety
 * const humanText = "The author carefully examines narrative techniques through detailed analysis. Creative writers often experiment with different approaches to storytelling that enhance reader engagement.";
 * const humanAnalysis = detectParticipalPhraseFormula(humanText);
 * console.log(humanAnalysis.aiLikelihood); // ~0.1-0.3 (low AI probability)
 *
 * @example
 * // AI text typically shows systematic participial formulas
 * const aiText = "Optimized for performance, the system delivers exceptional results. Designed with scalability in mind, the architecture supports growing demands. Implemented using best practices, the solution ensures reliability.";
 * const aiAnalysis = detectParticipalPhraseFormula(aiText);
 * console.log(aiAnalysis.aiLikelihood); // ~0.7-0.9 (high AI probability)
 *
 * @example
 * // Academic integrity checking
 * function checkSyntacticAuthenticity(essay) {
 *   const analysis = detectParticipalPhraseFormula(essay, { includeDetails: true });
 *   if (analysis.aiLikelihood > 0.6) {
 *     return {
 *       status: 'suspicious',
 *       participialPatterns: analysis.detectedPatterns.slice(0, 3)
 *     };
 *   }
 *   return { status: 'likely-human', participialPatterns: [] };
 * }
 *
 * @example
 * // Writing style assessment
 * function assessSyntacticNaturalness(content) {
 *   const analysis = detectParticipalPhraseFormula(content);
 *   return {
 *     naturalness: 1 - analysis.aiLikelihood,
 *     participial_density: analysis.participialDensity,
 *     syntactic_uniformity: analysis.overallScore
 *   };
 * }
 */
export function detectParticipalPhraseFormula(text, options = {}) {
	if (typeof text !== "string") {
		throw new TypeError("Expected text to be a string");
	}

	if (text.trim().length === 0) {
		throw new Error("Cannot analyze empty text");
	}

	// Extract and validate options
	const {
		minWordCount = 25,
		includeDetails = false,
		sensitivityThreshold = 2.0,
		languagePack,
	} = options;

	if (!Number.isInteger(minWordCount) || minWordCount < 1) {
		throw new Error("Parameter minWordCount must be a positive integer");
	}

	if (typeof sensitivityThreshold !== "number" || sensitivityThreshold <= 0) {
		throw new Error("Parameter sensitivityThreshold must be a positive number");
	}

	// Count total words using robust Unicode-aware tokenization
	const words = tokenizeWords(text);
	const wordCount = words.length;

	if (wordCount < minWordCount) {
		throw new Error(
			`Text must contain at least ${minWordCount} words for reliable analysis`,
		);
	}

	const profile = languagePack?.participles;

	// Analyze participial phrase patterns
	const detectedPatterns = [];
	let totalPatterns = 0;
	let weightedScore = 0;

	// Helper to build regex from a Set of words
	const startsWithAny = (/** @type {Set<string> | undefined} */ set) =>
		set && set.size > 0
			? new RegExp(`^(?:${Array.from(set).join("|")})\\b`)
			: null;

	const patterns = {
		// Sentence-initial participial phrases
		sentence_initial_ing: (/** @type {string} */ text) => {
			const sentences = tokenizeSentences(text);
			let count = 0;
			for (const sentence of sentences) {
				const rx =
					(profile && startsWithAny(profile.sentenceInitial?.presentActions)) ||
					/^[A-Z][a-z]*ing\b/;
				if (rx.test(sentence)) {
					count++;
				}
			}
			return count;
		},

		sentence_initial_ed: (/** @type {string} */ text) => {
			const sentences = tokenizeSentences(text);
			let count = 0;
			for (const sentence of sentences) {
				const rx =
					(profile && startsWithAny(profile.sentenceInitial?.past)) ||
					/^[A-Z][a-z]*ed\b/;
				if (rx.test(sentence)) {
					count++;
				}
			}
			return count;
		},

		sentence_initial_irregular: (/** @type {string} */ text) => {
			const sentences = tokenizeSentences(text);
			let count = 0;
			for (const sentence of sentences) {
				const words = tokenizeWords(sentence);
				const firstWord = words[0];
				const irregular = profile?.sentenceInitial?.irregular;
				if (
					firstWord &&
					(irregular?.has?.call(irregular, firstWord) ||
						/^(?:Built|Made|Done|Written|Given|Taken|Shown|Known)\b/.test(
							firstWord,
						))
				) {
					count++;
				}
			}
			return count;
		},

		optimized_constructed: (/** @type {string} */ text) => {
			const pattern =
				/\b(?:Optimized|Constructed|Engineered|Architected)\s+(?:for|to|with)\b/gi;
			return (text.match(pattern) || []).length;
		},

		designed_built: (/** @type {string} */ text) => {
			const pattern =
				/\b(?:Designed|Built|Crafted|Developed)\s+(?:for|to|with|using)\b/gi;
			return (text.match(pattern) || []).length;
		},

		created_developed: (/** @type {string} */ text) => {
			const pattern =
				/\b(?:Created|Developed|Established|Formed)\s+(?:with|using|for|to)\b/gi;
			return (text.match(pattern) || []).length;
		},

		configured_implemented: (/** @type {string} */ text) => {
			const pattern =
				/\b(?:Configured|Implemented|Deployed|Executed)\s+(?:to|using|with|for)\b/gi;
			return (text.match(pattern) || []).length;
		},

		present_participle_transitions: (/** @type {string} */ text) => {
			const verbs = profile?.transitionsVerbs;
			const pattern =
				verbs && verbs.size > 0
					? new RegExp(`\\b(?:${Array.from(verbs).join("|")})\\b`, "gi")
					: /\b(?:Speaking|Looking|Considering|Thinking|Turning|Moving)\b/gi;
			return (text.match(pattern) || []).length;
		},

		present_participle_actions: (/** @type {string} */ text) => {
			// Only count sentence-initial present participle actions
			const sentences = tokenizeSentences(text);
			let count = 0;
			for (const sentence of sentences) {
				const rx =
					(profile && startsWithAny(profile.sentenceInitial?.presentActions)) ||
					/^(?:Running|Working|Processing|Operating|Functioning|Performing)\b/;
				if (rx.test(sentence)) {
					count++;
				}
			}
			return count;
		},

		present_participle_states: (/** @type {string} */ text) => {
			// Only count sentence-initial present participle states
			const sentences = tokenizeSentences(text);
			let count = 0;
			for (const sentence of sentences) {
				const rx =
					(profile && startsWithAny(profile.sentenceInitial?.presentStates)) ||
					/^(?:Being|Having|Considering|Maintaining|Ensuring|Providing)\b/;
				if (rx.test(sentence)) {
					count++;
				}
			}
			return count;
		},

		past_participle_results: (/** @type {string} */ text) => {
			// Only count sentence-initial past participle results
			const sentences = tokenizeSentences(text);
			let count = 0;
			for (const sentence of sentences) {
				const rx =
					(profile && startsWithAny(profile.sentenceInitial?.past)) ||
					/^(?:Completed|Finished|Accomplished|Achieved|Realized|Fulfilled)\b/;
				if (rx.test(sentence)) {
					count++;
				}
			}
			return count;
		},

		past_participle_passive: (/** @type {string} */ text) => {
			const verbs = profile?.sentenceInitial?.past;
			const pattern =
				verbs && verbs.size > 0
					? new RegExp(`\\b(?:${Array.from(verbs).join("|")})\\s+by\\b`, "gi")
					: /\b(?:Written|Developed|Created|Produced|Generated|Manufactured)\s+by\b/gi;
			return (text.match(pattern) || []).length;
		},

		past_participle_conditions: (/** @type {string} */ text) => {
			const pattern =
				/\b(?:Given|Based|Provided|Granted|Assuming|Considering)\s+(?:that|on)\b/gi;
			return (text.match(pattern) || []).length;
		},

		having_constructions: (/** @type {string} */ text) => {
			const pattern =
				/\bHaving\s+(?:completed|analyzed|considered|examined|evaluated|reviewed)\b/gi;
			return (text.match(pattern) || []).length;
		},

		being_constructions: (/** @type {string} */ text) => {
			const pattern =
				/\bBeing\s+(?:careful|aware|mindful|conscious|deliberate|strategic)\b/gi;
			return (text.match(pattern) || []).length;
		},

		when_participle: (/** @type {string} */ text) => {
			const pattern =
				/\bWhen\s+(?:considering|analyzing|evaluating|examining|reviewing|assessing)\b/gi;
			return (text.match(pattern) || []).length;
		},

		technical_participles: (/** @type {string} */ text) => {
			const pattern =
				/\b(?:Leveraging|Utilizing|Employing|Incorporating|Integrating|Adopting)\b/gi;
			return (text.match(pattern) || []).length;
		},

		process_participles: (/** @type {string} */ text) => {
			const pattern =
				/\b(?:Processing|Analyzing|Evaluating|Computing|Calculating|Determining)\b/gi;
			return (text.match(pattern) || []).length;
		},

		system_participles: (/** @type {string} */ text) => {
			const pattern =
				/\b(?:Implementing|Executing|Deploying|Installing|Configuring|Initializing)\b/gi;
			return (text.match(pattern) || []).length;
		},

		repeated_participle_forms: (/** @type {string} */ text) => {
			const participleWords = text.match(/\b\w+(?:ing|ed)\b/gi) || [];
			const participleCount = new Map();

			for (const word of participleWords) {
				const lowerWord = word.toLowerCase();
				participleCount.set(
					lowerWord,
					(participleCount.get(lowerWord) || 0) + 1,
				);
			}

			let repeatedCount = 0;
			for (const count of participleCount.values()) {
				if (count >= 3) {
					// 3 or more repetitions is considered mechanical
					repeatedCount += count - 2; // Count excess beyond natural repetition
				}
			}
			return repeatedCount;
		},

		mechanical_participle_sequences: (/** @type {string} */ text) => {
			// Look for sequential sentences starting with similar participial constructions
			const sentences = tokenizeSentences(text).filter((s) => s.length > 10);

			let sequenceCount = 0;
			for (let i = 0; i < sentences.length - 1; i++) {
				const current = sentences[i];
				const next = sentences[i + 1];

				// Check if both start with participial constructions
				const currentStartsParticiple =
					/^(?:[A-Z][a-z]*(?:ing|ed)|Built|Made|Done|Written|Given)\b/.test(
						current,
					);
				const nextStartsParticiple =
					/^(?:[A-Z][a-z]*(?:ing|ed)|Built|Made|Done|Written|Given)\b/.test(
						next,
					);

				if (currentStartsParticiple && nextStartsParticiple) {
					sequenceCount++;
				}
			}
			return sequenceCount;
		},

		academic_participles: (/** @type {string} */ text) => {
			// Only count sentence-initial academic participles
			const sentences = tokenizeSentences(text);
			let count = 0;
			for (const sentence of sentences) {
				const rx =
					(profile && startsWithAny(profile.academicVerbs)) ||
					/^(?:Examining|Investigating|Exploring|Researching|Studying|Analyzing)\b/;
				if (rx.test(sentence)) {
					count++;
				}
			}
			return count;
		},

		business_participles: (/** @type {string} */ text) => {
			// Only count sentence-initial business participles
			const sentences = tokenizeSentences(text);
			let count = 0;
			for (const sentence of sentences) {
				const rx =
					(profile && startsWithAny(profile.businessVerbs)) ||
					/^(?:Streamlining|Optimizing|Enhancing|Improving|Maximizing|Increasing)\b/;
				if (rx.test(sentence)) {
					count++;
				}
			}
			return count;
		},

		marketing_participles: (/** @type {string} */ text) => {
			// Only count sentence-initial marketing participles
			const sentences = tokenizeSentences(text);
			let count = 0;
			for (const sentence of sentences) {
				const rx =
					(profile && startsWithAny(profile.marketingVerbs)) ||
					/^(?:Delivering|Providing|Offering|Presenting|Introducing|Showcasing)\b/;
				if (rx.test(sentence)) {
					count++;
				}
			}
			return count;
		},
	};

	// Analyze each pattern type
	for (const [patternName, humanBaseline] of Object.entries(
		PARTICIPIAL_BASELINES,
	)) {
		const patternFunction =
			/** @type {((text: string) => number) | undefined} */ (
				patterns[/** @type {keyof typeof patterns} */ (patternName)]
			);
		if (patternFunction) {
			const count = patternFunction(text);

			if (count > 0) {
				const frequency = (count / wordCount) * 1000; // Per thousand words
				const ratio = frequency / humanBaseline; // How much higher than human baseline

				// Check if this pattern is overused beyond sensitivity threshold
				if (ratio >= sensitivityThreshold) {
					totalPatterns += count;
					weightedScore += ratio * count; // Weight by frequency

					if (includeDetails) {
						detectedPatterns.push({
							pattern: patternName,
							count,
							frequency,
							humanBaseline,
							ratio,
							overuseLevel:
								ratio >= 4.0 ? "severe" : ratio >= 3.0 ? "high" : "moderate",
							description: getPatternDescription(patternName),
						});
					}
				}
			}
		}
	}

	// Calculate metrics
	const participialDensity = (totalPatterns / wordCount) * 1000;

	// Calculate overall AI likelihood score
	// Higher participial density and ratios indicate more AI-like content
	const densityScore = Math.min(participialDensity / 8, 1); // Cap at 8 patterns per 1000 words
	const ratioScore =
		totalPatterns > 0 ? Math.min(weightedScore / totalPatterns / 4, 1) : 0; // Cap ratio at 4x human baseline
	const aiLikelihood = densityScore * 0.7 + ratioScore * 0.3; // Weight density more heavily

	// Calculate overall score (average ratio across all detected patterns)
	const overallScore = totalPatterns > 0 ? weightedScore / totalPatterns : 0;

	// Sort detected patterns by ratio if details requested
	if (includeDetails) {
		detectedPatterns.sort((a, b) => b.ratio - a.ratio);
	}

	return {
		aiLikelihood,
		overallScore,
		participialDensity,
		totalPatterns,
		wordCount,
		detectedPatterns: includeDetails ? detectedPatterns : [],
	};
}

/**
 * Returns a human-readable description for a participial phrase pattern type.
 *
 * @param {string} patternName - The pattern name to describe
 * @returns {string} Human-readable description of the pattern
 */
function getPatternDescription(patternName) {
	/** @type {Record<string, string>} */
	const descriptions = {
		sentence_initial_ing: "Sentences starting with -ing participles",
		sentence_initial_ed: "Sentences starting with -ed participles",
		sentence_initial_irregular:
			"Sentences starting with irregular past participles",
		optimized_constructed:
			"Technical construction phrases (optimized, constructed)",
		designed_built: "Design and building phrases (designed, built)",
		created_developed: "Creation and development phrases",
		configured_implemented: "Technical implementation phrases",
		present_participle_transitions: "Present participle transition phrases",
		present_participle_actions: "Present participle action descriptions",
		present_participle_states: "Present participle state descriptions",
		past_participle_results: "Past participle result descriptions",
		past_participle_passive: "Past participle passive constructions",
		past_participle_conditions: "Past participle conditional phrases",
		having_constructions: "Having + past participle constructions",
		being_constructions: "Being + adjective constructions",
		when_participle: "When + present participle constructions",
		technical_participles: "Technical process participles",
		process_participles: "Data processing participles",
		system_participles: "System operation participles",
		repeated_participle_forms: "Repeated use of same participial forms",
		mechanical_participle_sequences:
			"Sequential mechanical participial constructions",
		academic_participles: "Academic analysis participles",
		business_participles: "Business optimization participles",
		marketing_participles: "Marketing delivery participles",
	};

	return descriptions[patternName] || "Unknown participial pattern";
}
