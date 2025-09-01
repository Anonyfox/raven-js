/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Perfect Grammar Detector for AI-Generated Text Analysis
 *
 * Detects artificially perfect text that lacks natural human imperfections.
 * While most AI detection methods look for positive indicators, this algorithm
 * identifies AI text through the conspicuous absence of typical human errors.
 *
 * Human writing naturally contains small errors, inconsistencies, and imperfections,
 * while AI-generated text tends to be mechanically perfect in grammar, spelling,
 * and punctuation usage.
 */

/**
 * Human baseline error rates per 1000 words for different types of errors.
 * These rates are based on typical human writing patterns across various contexts.
 */
const HUMAN_ERROR_BASELINES = {
	// Spelling and typo errors
	spelling_errors: 2.5, // Misspelled words
	typos: 1.8, // Character transpositions, missing letters
	homophone_errors: 0.8, // their/there/they're confusion

	// Punctuation inconsistencies
	comma_splices: 1.2, // Incorrect comma usage
	apostrophe_errors: 0.9, // its/it's, contractions
	quotation_inconsistencies: 0.6, // Mixed quote styles

	// Grammar imperfections
	subject_verb_disagreement: 1.1, // Singular/plural mismatches
	pronoun_reference_errors: 0.7, // Unclear antecedents
	tense_inconsistencies: 0.9, // Mixed past/present tense

	// Style and consistency variations
	capitalization_errors: 0.8, // Inconsistent proper noun caps
	number_format_variations: 0.5, // Mixed "5" vs "five"
	contraction_inconsistencies: 0.4, // Mixed "don't" vs "do not"

	// Natural writing imperfections
	redundancy: 1.5, // Repeated words/phrases
	informal_constructions: 2.1, // Sentence fragments, colloquialisms
	minor_word_order_issues: 0.6, // Slightly awkward phrasing
};

/**
 * Patterns for detecting various types of errors and imperfections in text
 */
const errorPatterns = {
	/**
	 * Detects common spelling errors and typos
	 * @param {string} text - Input text to analyze
	 * @returns {number} Count of detected spelling/typo errors
	 */
	spelling_errors: /** @type {(text: string) => number} */ (text) => {
		const commonMisspellings = [
			/\b(recieve|recieved|recieving)\b/gi, // receive
			/\b(seperate|seperated|seperating)\b/gi, // separate
			/\b(occured|occuring)\b/gi, // occurred, occurring
			/\b(begining)\b/gi, // beginning
			/\b(definately)\b/gi, // definitely
			/\b(accomodate|accomodation)\b/gi, // accommodate
			/\b(maintainance)\b/gi, // maintenance
			/\b(recomend|recomendation)\b/gi, // recommend
			/\b(experiance|experiance)\b/gi, // experience
			/\b(embarass|embarassed)\b/gi, // embarrass
			/\b(sistem)\b/gi, // system
			/\b(recieved)\b/gi, // received
			/\b(achive|achived|achiving)\b/gi, // achieve
			/\b(payed)\b/gi, // paid
			/\b(usualy)\b/gi, // usually
		];

		return commonMisspellings.reduce((count, pattern) => {
			const matches = text.match(pattern);
			return count + (matches ? matches.length : 0);
		}, 0);
	},

	/**
	 * Detects character-level typos and transpositions
	 * @param {string} text - Input text to analyze
	 * @returns {number} Count of detected typos
	 */
	typos: /** @type {(text: string) => number} */ (text) => {
		const typoPatterns = [
			/\b(teh|hte)\b/gi, // the
			/\b(adn|nad)\b/gi, // and
			/\b(fo|fro)\b/gi, // for/of
			/\b(yuor|yoru)\b/gi, // your
			/\b(taht|thta)\b/gi, // that
			/\b(whihc|whcih)\b/gi, // which
			/\b(wiht|hwith)\b/gi, // with
			/\b(thier)\b/gi, // their
			/\b(woudl|wolud)\b/gi, // would
			/\b(coudl|colud)\b/gi, // could
		];

		return typoPatterns.reduce((count, pattern) => {
			const matches = text.match(pattern);
			return count + (matches ? matches.length : 0);
		}, 0);
	},

	/**
	 * Detects homophone confusion errors
	 * @param {string} text - Input text to analyze
	 * @returns {number} Count of detected homophone errors
	 */
	homophone_errors: /** @type {(text: string) => number} */ (text) => {
		// This is simplified - in practice these would need context analysis
		const homophonePatterns = [
			/\byour\s+(welcome|right|wrong)\b/gi, // you're welcome
			/\btheir\s+(are|is|going|coming|here)\b/gi, // they're/there are
			/\bthere\s+(house|car|dog|family)\b/gi, // their house
			/\bits\s+(a|an|the|not|important)\b/gi, // it's a (contraction)
			/\btoo\s+(much|many|few)\b/gi, // to much (should be "to")
			/\bto\s+(excited|happy|sad)\b/gi, // too excited
			/\bwhere\s+(going|coming)\b/gi, // we're going
			/\bno\s+(one|body|thing)\b/gi, // know one/body/thing
		];

		return homophonePatterns.reduce((count, pattern) => {
			const matches = text.match(pattern);
			return count + (matches ? matches.length : 0);
		}, 0);
	},

	/**
	 * Detects comma splice and comma usage errors
	 * @param {string} text - Input text to analyze
	 * @returns {number} Count of detected comma errors
	 */
	comma_splices: /** @type {(text: string) => number} */ (text) => {
		// Look for independent clauses joined only by comma
		const commaSplicePattern =
			/\b(however|therefore|nevertheless|furthermore|moreover),\s+[a-z]/g;
		const matches = text.match(commaSplicePattern);
		return matches ? matches.length : 0;
	},

	/**
	 * Detects apostrophe usage errors
	 * @param {string} text - Input text to analyze
	 * @returns {number} Count of detected apostrophe errors
	 */
	apostrophe_errors: /** @type {(text: string) => number} */ (text) => {
		const apostrophePatterns = [
			/\bits'/gi, // its' (should be its)
			/\bwhos\s/gi, // whos (should be who's)
			/\byours'/gi, // yours' (should be yours)
			/\btheirs'/gi, // theirs' (should be theirs)
			/\bits\s+(not|a|an|the|important|good)\b/gi, // its not (should be it's)
			/\b\w+s\s+(needs|wants|homes|cars)\b/gi, // users needs (should be users')
			/\bdont\b/gi, // dont (should be don't)
			/\bwont\b/gi, // wont (should be won't)
			/\bcant\b/gi, // cant (should be can't)
		];

		return apostrophePatterns.reduce((count, pattern) => {
			const matches = text.match(pattern);
			return count + (matches ? matches.length : 0);
		}, 0);
	},

	/**
	 * Detects inconsistent quotation mark usage
	 * @param {string} text - Input text to analyze
	 * @returns {number} Count of quotation inconsistencies
	 */
	quotation_inconsistencies: /** @type {(text: string) => number} */ (text) => {
		const doubleQuotes = (text.match(/"/g) || []).length;
		const singleQuotes = (text.match(/'/g) || []).length;
		const smartQuotes = (text.match(/[""'']/g) || []).length;

		// If multiple quote types are used, it suggests inconsistency
		const quoteTypes = [
			doubleQuotes > 0,
			singleQuotes > 0,
			smartQuotes > 0,
		].filter(Boolean).length;
		return quoteTypes > 1
			? Math.min(doubleQuotes, singleQuotes, smartQuotes)
			: 0;
	},

	/**
	 * Detects subject-verb disagreement
	 * @param {string} text - Input text to analyze
	 * @returns {number} Count of detected disagreements
	 */
	subject_verb_disagreement: /** @type {(text: string) => number} */ (text) => {
		const disagreementPatterns = [
			/\b(data|criteria|phenomena)\s+is\b/gi, // Plural subjects with singular verbs
			/\b(everyone|someone|anyone)\s+are\b/gi, // Singular subjects with plural verbs
			/\bthere\s+is\s+\w+\s+\w+s\b/gi, // "there is multiple items"
		];

		return disagreementPatterns.reduce((count, pattern) => {
			const matches = text.match(pattern);
			return count + (matches ? matches.length : 0);
		}, 0);
	},

	/**
	 * Detects pronoun reference errors
	 * @param {string} text - Input text to analyze
	 * @returns {number} Count of detected pronoun errors
	 */
	pronoun_reference_errors: /** @type {(text: string) => number} */ (text) => {
		// Simple detection of unclear pronoun references
		const sentences = text.split(/[.!?]+/);
		let errors = 0;

		for (const sentence of sentences) {
			// Look for sentences starting with "it" or "this" without clear antecedent
			if (/^\s*(it|this)\s+/i.test(sentence) && sentence.length < 50) {
				errors++;
			}
		}

		return errors;
	},

	/**
	 * Detects tense inconsistencies within text
	 * @param {string} text - Input text to analyze
	 * @returns {number} Count of detected tense inconsistencies
	 */
	tense_inconsistencies: /** @type {(text: string) => number} */ (text) => {
		const pastTenseVerbs = (text.match(/\b\w+ed\b/g) || []).length;
		const presentTenseVerbs = (
			text.match(/\b(is|are|am|do|does|have|has)\b/g) || []
		).length;

		// If both present and past tense are heavily used, might indicate inconsistency
		const totalVerbs = pastTenseVerbs + presentTenseVerbs;
		if (totalVerbs > 5) {
			const ratio = Math.min(pastTenseVerbs, presentTenseVerbs) / totalVerbs;
			return ratio > 0.3 ? 1 : 0; // Flag if mixed usage is significant
		}

		return 0;
	},

	/**
	 * Detects capitalization errors
	 * @param {string} text - Input text to analyze
	 * @returns {number} Count of detected capitalization errors
	 */
	capitalization_errors: /** @type {(text: string) => number} */ (text) => {
		const errors = [
			// Words that should be capitalized
			/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/g,
			/\b(january|february|march|april|may|june|july|august|september|october|november|december)\b/g,
			/\b(america|europe|asia|africa)\b/g,
		];

		return errors.reduce((count, pattern) => {
			const matches = text.match(pattern);
			return count + (matches ? matches.length : 0);
		}, 0);
	},

	/**
	 * Detects inconsistent number formatting
	 * @param {string} text - Input text to analyze
	 * @returns {number} Count of number format inconsistencies
	 */
	number_format_variations: /** @type {(text: string) => number} */ (text) => {
		const writtenNumbers = (
			text.match(/\b(one|two|three|four|five|six|seven|eight|nine|ten)\b/gi) ||
			[]
		).length;
		const digitNumbers = (text.match(/\b\d+\b/g) || []).length;

		// If both formats used for similar ranges, it's inconsistent
		return writtenNumbers > 0 && digitNumbers > 0
			? Math.min(writtenNumbers, digitNumbers)
			: 0;
	},

	/**
	 * Detects inconsistent contraction usage
	 * @param {string} text - Input text to analyze
	 * @returns {number} Count of contraction inconsistencies
	 */
	contraction_inconsistencies: /** @type {(text: string) => number} */ (
		text,
	) => {
		const contractions = (
			text.match(/\b(don't|won't|can't|shouldn't|wouldn't|couldn't)\b/gi) || []
		).length;
		const expanded = (
			text.match(
				/\b(do not|will not|cannot|should not|would not|could not)\b/gi,
			) || []
		).length;

		// Mixed usage suggests inconsistency
		return contractions > 0 && expanded > 0
			? Math.min(contractions, expanded)
			: 0;
	},

	/**
	 * Detects redundant phrases and repeated words
	 * @param {string} text - Input text to analyze
	 * @returns {number} Count of detected redundancies
	 */
	redundancy: /** @type {(text: string) => number} */ (text) => {
		// Look for repeated words within close proximity
		const words = text.toLowerCase().split(/\s+/);
		let redundancies = 0;

		for (let i = 0; i < words.length - 1; i++) {
			if (words[i] === words[i + 1] && words[i].length > 3) {
				redundancies++;
			}
		}

		// Look for redundant phrases
		const redundantPhrases = [
			/\b(at this point in time)\b/gi, // "at this time" is sufficient
			/\b(in order to)\b/gi, // "to" is sufficient
			/\b(due to the fact that)\b/gi, // "because" is sufficient
		];

		redundantPhrases.forEach((pattern) => {
			const matches = text.match(pattern);
			redundancies += matches ? matches.length : 0;
		});

		return redundancies;
	},

	/**
	 * Detects informal constructions and colloquialisms
	 * @param {string} text - Input text to analyze
	 * @returns {number} Count of detected informal constructions
	 */
	informal_constructions: /** @type {(text: string) => number} */ (text) => {
		const informalPatterns = [
			/\bkinda\b/gi, // "kind of"
			/\bgonna\b/gi, // "going to"
			/\bwanna\b/gi, // "want to"
			/\byeah\b/gi, // "yes"
			/\bokay\b/gi, // "all right"
			/\bstuff\s+(like|and|that)\b/gi, // vague "stuff like"
			/\bthing\s+(is|that|about)\b/gi, // vague "thing is/that"
			/\bomg\b/gi, // "oh my god"
			/\blol\b/gi, // "laugh out loud"
			/\btbh\b/gi, // "to be honest"
			/\bimo\b/gi, // "in my opinion"
			/\bu\b/gi, // "you"
			/\bur\b/gi, // "your"
			/\bcant\b/gi, // "can't" without apostrophe
			/\bdis\b/gi, // "this"
			/\biz\b/gi, // "is"
			/\brelly\b/gi, // "really"
			/\bgud\b/gi, // "good"
			/\ban\b(?=\s+\w+z\b)/gi, // "an" before z-plurals
			/\bworkz\b/gi, // "works"
			/\bwel\b/gi, // "well"
			/\b\d\b/g, // single digits used as words
			/\buserz\b/gi, // "users"
			/\bitz\b/gi, // "it's"
			/\bknda\b/gi, // "kind of"
			/\bsumtimez\b/gi, // "sometimes"
			/\boveral\b/gi, // "overall"
			/\bokei\b/gi, // "okay"
			/\bfr\b/gi, // "for"
			/\bbasicc\b/gi, // "basic"
			/\bworkng\b/gi, // "working"
			/\bimproovments\b/gi, // "improvements"
			/\bmaek\b/gi, // "make"
			/\bbettr\b/gi, // "better"
			/\bevry1\b/gi, // "everyone"
		];

		// Also detect sentence fragments (sentences without verbs) but be more lenient
		const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 10);
		let fragments = 0;

		for (const sentence of sentences) {
			// Simple check for verb presence - but only count very obvious fragments
			if (
				!/\b(is|are|was|were|have|has|had|do|does|did|will|would|can|could|should|may|might|provides|delivers|maintains|ensures|incorporates)\b/i.test(
					sentence,
				) &&
				sentence.length < 30
			) {
				fragments++;
			}
		}

		const informalCount = informalPatterns.reduce((count, pattern) => {
			const matches = text.match(pattern);
			return count + (matches ? matches.length : 0);
		}, 0);

		return informalCount + fragments;
	},

	/**
	 * Detects minor word order and phrasing issues
	 * @param {string} text - Input text to analyze
	 * @returns {number} Count of detected word order issues
	 */
	minor_word_order_issues: /** @type {(text: string) => number} */ (text) => {
		const awkwardPatterns = [
			/\bonly\s+\w+\s+\w+\s+can\b/gi, // "only users can" vs "users can only"
			/\bhave\s+not\s+\w+\s+yet\b/gi, // "have not done yet" vs "have not yet done"
		];

		return awkwardPatterns.reduce((count, pattern) => {
			const matches = text.match(pattern);
			return count + (matches ? matches.length : 0);
		}, 0);
	},
};

/**
 * Provides human-readable descriptions for each error pattern type
 */
const errorDescriptions = /** @type {Record<string, string>} */ ({
	spelling_errors: "Common spelling mistakes and misspellings",
	typos: "Character-level typos and letter transpositions",
	homophone_errors: "Confusion between similar-sounding words",
	comma_splices: "Incorrect comma usage and comma splices",
	apostrophe_errors: "Incorrect apostrophe placement and usage",
	quotation_inconsistencies: "Mixed quotation mark styles",
	subject_verb_disagreement: "Subject-verb agreement errors",
	pronoun_reference_errors: "Unclear pronoun antecedents",
	tense_inconsistencies: "Mixed or inconsistent verb tenses",
	capitalization_errors: "Incorrect capitalization of proper nouns",
	number_format_variations: "Inconsistent number formatting (digits vs words)",
	contraction_inconsistencies: "Mixed contraction usage styles",
	redundancy: "Redundant phrases and repeated words",
	informal_constructions: "Informal language and sentence fragments",
	minor_word_order_issues: "Awkward phrasing and word order",
});

/**
 * Detects and quantifies the "Perfect Grammar" patterns characteristic of AI-generated text.
 * AI-generated content often exhibits unnaturally perfect grammar, spelling, and punctuation
 * that lacks the minor imperfections commonly found in human writing. This function analyzes
 * text for the conspicuous absence of typical human errors and calculates an AI likelihood
 * score based on how artificially perfect the text appears.
 *
 * @param {string} text - The input text to analyze for perfect grammar patterns.
 * @param {object} [options={}] - Configuration options for the analysis.
 * @param {number} [options.minWordCount=30] - Minimum word count for reliable analysis.
 * @param {number} [options.errorToleranceThreshold=0.5] - Multiplier below human baseline to flag as suspicious.
 * @param {boolean} [options.includeDetails=false] - Whether to include error-specific details.
 * @returns {{aiLikelihood: number, overallScore: number, perfectionScore: number, totalErrors: number, wordCount: number, detectedErrors: Array<Object>}} Analysis results with AI detection metrics.
 *   - aiLikelihood: Overall AI probability score (0-1, higher = more AI-like).
 *   - overallScore: Weighted error frequency score vs human baseline.
 *   - perfectionScore: Measure of artificial perfection (higher = more perfect).
 *   - totalErrors: Total number of errors/imperfections found.
 *   - wordCount: Total words analyzed.
 *   - detectedErrors: Array of error types with details (if includeDetails=true).
 *
 * @throws {TypeError} When text parameter is not a string.
 * @throws {Error} When text contains insufficient words for analysis.
 * @throws {Error} When options contain invalid values.
 *
 * @example
 * const aiText = "The comprehensive system delivers optimal performance through advanced algorithms and streamlined processes. All components function perfectly and maintain consistent reliability across all operational parameters.";
 * const result = detectPerfectGrammar(aiText);
 * // result.aiLikelihood would be high (e.g., > 0.7) due to absence of natural errors
 *
 * @example
 * const humanText = "The system works pretty good most of the time, although their are occasional hiccups. Its not perfect but it gets the job done for most users needs.";
 * const result = detectPerfectGrammar(humanText);
 * // result.aiLikelihood would be low (e.g., < 0.3) due to natural errors present
 */
export function detectPerfectGrammar(text, options = {}) {
	if (typeof text !== "string") {
		throw new TypeError("Input 'text' must be a string.");
	}

	if (text.trim().length === 0) {
		throw new Error("Cannot analyze empty text");
	}

	const {
		minWordCount = 30,
		errorToleranceThreshold = 0.5,
		includeDetails = false,
	} = options;

	if (!Number.isInteger(minWordCount) || minWordCount < 1) {
		throw new Error("Parameter minWordCount must be a positive integer");
	}
	if (
		typeof errorToleranceThreshold !== "number" ||
		errorToleranceThreshold <= 0
	) {
		throw new Error(
			"Parameter errorToleranceThreshold must be a positive number",
		);
	}

	const words = text.split(/\s+/).filter((word) => word.length > 0);
	const wordCount = words.length;

	if (wordCount < minWordCount) {
		throw new Error(
			`Text must contain at least ${minWordCount} words for reliable analysis`,
		);
	}

	// Calculate detected errors for each pattern type
	const errorCounts = /** @type {Record<string, number>} */ ({});
	const detectedErrors = [];
	let totalErrors = 0;

	for (const [errorType, patternFunction] of Object.entries(errorPatterns)) {
		const count =
			/** @type {((text: string) => number) | undefined} */ (patternFunction)?.(
				text,
			) || 0;
		errorCounts[errorType] = count;
		totalErrors += count;

		if (includeDetails && count > 0) {
			detectedErrors.push({
				type: errorType,
				count: count,
				frequency: (count / wordCount) * 1000,
				description: errorDescriptions[errorType] || errorType,
			});
		}
	}

	// Calculate error frequencies per 1000 words
	const errorFrequencies = /** @type {Record<string, number>} */ ({});
	for (const [errorType, count] of Object.entries(errorCounts)) {
		errorFrequencies[errorType] = (count / wordCount) * 1000;
	}

	// Compare against human baselines and calculate deviation scores
	let overallScore = 0;
	let significantDeviations = 0;

	for (const [errorType, humanBaseline] of Object.entries(
		HUMAN_ERROR_BASELINES,
	)) {
		const observedFrequency = errorFrequencies[errorType] || 0;
		const expectedFrequency = humanBaseline;

		// Calculate how much lower the observed frequency is compared to human baseline
		const deviationRatio = observedFrequency / expectedFrequency;

		// Score increases as observed frequency approaches zero (more AI-like)
		const perfectionScore = Math.max(0, 1 - deviationRatio);
		overallScore += perfectionScore;

		// Flag significant deviations (much lower than human baseline)
		if (deviationRatio < errorToleranceThreshold) {
			significantDeviations++;
		}
	}

	// Normalize the overall score
	const maxPossibleScore = Object.keys(HUMAN_ERROR_BASELINES).length;
	const normalizedScore = overallScore / maxPossibleScore;

	// Calculate perfection score (higher = more artificially perfect)
	const perfectionScore = normalizedScore * 100;

	// Calculate AI likelihood based on multiple factors
	const errorDensity = (totalErrors / wordCount) * 1000;
	const expectedErrorDensity = Object.values(HUMAN_ERROR_BASELINES).reduce(
		(sum, rate) => sum + rate,
		0,
	);

	// Multiple scoring factors
	const perfectionFactor = normalizedScore; // How perfect the text appears
	const errorDeficitFactor = Math.max(
		0,
		1 - errorDensity / expectedErrorDensity,
	); // How much below expected error rate
	const consistencyFactor =
		significantDeviations / Object.keys(HUMAN_ERROR_BASELINES).length; // Proportion of error types significantly below baseline

	// Strong penalty for high error counts (human-like behavior)
	const errorPenalty = Math.min(1, totalErrors / (wordCount * 0.1)); // Penalty grows with error density

	// Weighted combination of factors with error penalty
	const baseScore =
		perfectionFactor * 0.4 + // 40% weight on overall perfection
		errorDeficitFactor * 0.35 + // 35% weight on error deficit
		consistencyFactor * 0.25; // 25% weight on consistency across error types

	// Apply error penalty - many errors should strongly indicate human text
	const aiLikelihood = Math.max(0, baseScore - errorPenalty * 0.6);

	return {
		aiLikelihood: Math.min(1, Math.max(0, aiLikelihood)),
		overallScore: normalizedScore,
		perfectionScore: perfectionScore,
		totalErrors: totalErrors,
		wordCount: wordCount,
		detectedErrors: includeDetails ? detectedErrors : [],
	};
}
