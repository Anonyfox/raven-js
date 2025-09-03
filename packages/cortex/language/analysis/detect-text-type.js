/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Text Type Detection (language-agnostic algorithm)
 *
 * Pure function that classifies text into coarse types using signature phrases
 * provided by a language pack. No language data is bundled here. Packs are
 * tree-shakable and provided by the caller.
 */

import { foldCase } from "../normalization/index.js";

/**
 * @typedef {import('../signaturephrases/signature-phrase.js').SignaturePhraseProfile} SignaturePhraseProfile
 */

/**
 * Detects the likely text type based on content analysis using provided signature phrases.
 *
 * @param {string} text - Input text to analyze
 * @param {{ signaturePhrases: SignaturePhraseProfile }} options - Detection options
 * @returns {{ type: string, confidence: number, scores: Record<string, number> }} Classification result
 */
export function detectTextType(text, options) {
	if (typeof text !== "string") {
		throw new TypeError("Input 'text' must be a string.");
	}
	if (!options || !options.signaturePhrases) {
		throw new Error("Parameter 'signaturePhrases' is required");
	}

	const { signaturePhrases } = options;

	const lowerText = foldCase(text);

	const categoryScores = Object.create(null);

	// Simple tokenization for token matches (Unicode-aware is done upstream where needed)
	// Here, we rely on substring/word-boundary checks and provided patterns.
	const categories = signaturePhrases.categories || {};

	for (const categoryName of Object.keys(categories)) {
		const rules = categories[categoryName] || {};
		let score = 0;

		// Tokens: single words; use word boundary checks to reduce false positives
		if (rules.tokens && rules.tokens.size > 0) {
			for (const token of rules.tokens) {
				const re = new RegExp(`\\b${escapeRegex(token)}\\b`, "i");
				if (re.test(lowerText)) score += 1;
			}
		}

		// Phrases: multi-word phrases; substring match on folded text
		if (rules.phrases && rules.phrases.size > 0) {
			for (const phrase of rules.phrases) {
				if (lowerText.includes(phrase)) score += 1.5;
			}
		}

		// Co-occurrence: require presence of A and B groups in proximity (simple presence for speed)
		if (rules.cooccurrence && Array.isArray(rules.cooccurrence)) {
			const [groupA, groupB] = rules.cooccurrence;
			if (groupA && groupB) {
				let aHit = false;
				let bHit = false;
				for (const a of groupA) {
					if (new RegExp(`\\b${escapeRegex(a)}\\b`, "i").test(lowerText)) {
						aHit = true;
						break;
					}
				}
				for (const b of groupB) {
					if (new RegExp(`\\b${escapeRegex(b)}\\b`, "i").test(lowerText)) {
						bHit = true;
						break;
					}
				}
				if (aHit && bHit) score += 2;
			}
		}

		// Emojis: simple regex or explicit list checks
		if (rules.emojis?.length) {
			for (const emo of rules.emojis) {
				if (emo instanceof RegExp) {
					if (emo.test(text)) score += 1.5;
				} else if (typeof emo === "string") {
					if (text.includes(emo)) score += 1.5;
				}
			}
		}

		// Punctuation rules: regex array
		if (rules.punctuation?.length) {
			for (const re of rules.punctuation) {
				if (re.test(text)) score += 1;
			}
		}

		categoryScores[categoryName] = score;
	}

	// Determine best category by score, break ties by priority order if provided
	const priority = signaturePhrases.priority || [];
	let best = signaturePhrases.defaultType || "business";
	let bestScore = -Infinity;
	for (const [cat, val] of Object.entries(categoryScores)) {
		if (val > bestScore) {
			best = cat;
			bestScore = val;
		} else if (val === bestScore && val > -Infinity) {
			// Tie-breaker using explicit priority order
			const aIdx = priority.indexOf(cat);
			const bIdx = priority.indexOf(best);
			if (aIdx !== -1 && bIdx !== -1 && aIdx < bIdx) {
				best = cat;
			}
		}
	}

	// If no positive evidence, pick defaultType
	if (bestScore <= 0) {
		best = signaturePhrases.defaultType || "business";
	}

	// Confidence: normalized against sum and exclusivity
	const sum = Object.values(categoryScores).reduce((s, v) => s + v, 0) || 0;
	const max = bestScore <= 0 ? 0 : bestScore;
	const density = sum > 0 ? max / sum : 0;
	const confidence = Math.max(
		0,
		Math.min(1, 0.6 * density + 0.4 * Math.min(1, max / 5)),
	);

	return { type: best, confidence, scores: categoryScores };
}

/**
 * @param {string} s
 */
function escapeRegex(s) {
	return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
