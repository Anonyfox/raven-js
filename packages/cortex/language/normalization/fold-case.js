/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Locale-aware case folding for consistent text comparison.
 *
 * Provides proper case normalization that respects locale-specific rules,
 * avoiding common pitfalls like the Turkish I problem and German ß handling.
 * Uses platform-native locale support for accurate transformations.
 */

/**
 * Performs locale-aware case folding for consistent text comparison.
 *
 * Uses toLocaleLowerCase() to handle locale-specific case conversion rules
 * that differ from simple ASCII case folding. Includes special handling
 * for German ß → ss conversion when specified.
 *
 * @param {string} text - The text to case-fold
 * @param {string} locale - BCP 47 locale code (e.g., 'en', 'de', 'tr')
 * @param {boolean} germanSharpS - Convert German ß to ss for compatibility
 * @returns {string} The case-folded text
 *
 * @example
 * // Basic case folding
 * foldCase('Hello World', 'en'); // 'hello world'
 *
 * @example
 * // Turkish locale handling
 * foldCase('İstanbul', 'tr'); // 'i̇stanbul' (dotted i)
 * foldCase('İstanbul', 'en'); // 'i̇stanbul' (different result)
 *
 * @example
 * // German ß handling
 * foldCase('Straße', 'de'); // 'straße'
 * foldCase('Straße', 'de', true); // 'strasse'
 */
export function foldCase(text, locale = "en", germanSharpS = false) {
	let folded = text.toLocaleLowerCase(locale);

	if (germanSharpS && (locale === "de" || locale.startsWith("de-"))) {
		folded = folded.replace(/ß/g, "ss");
	}

	return folded;
}
