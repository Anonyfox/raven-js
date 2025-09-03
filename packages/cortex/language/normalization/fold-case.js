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
 * Provides pure case normalization that respects locale-specific rules,
 * avoiding common pitfalls like the Turkish I problem. Uses platform-native
 * locale support for accurate transformations.
 */

/**
 * Performs locale-aware case folding for consistent text comparison.
 *
 * Uses toLocaleLowerCase() to handle locale-specific case conversion rules
 * that differ from simple ASCII case folding. Provides pure case folding
 * without character substitution for clean, predictable behavior.
 *
 * @param {string} text - The text to case-fold
 * @param {string} locale - BCP 47 locale code (e.g., 'en', 'de', 'tr')
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
 * // German case folding
 * foldCase('Straße', 'de'); // 'straße'
 * foldCase('STRAẞE', 'de'); // 'straße' (ẞ → ß via locale rules)
 */
export function foldCase(text, locale = "en") {
	// Handle edge cases - return early for invalid inputs
	if (!text) return text || "";

	// Ensure valid locale fallback
	if (!locale) locale = "en";

	// Validate locale using Intl canonicalization; fallback deterministically to 'en'
	try {
		Intl.getCanonicalLocales(locale);
	} catch (_error) {
		locale = "en";
	}

	// Platform-native locale-aware case folding
	return text.toLocaleLowerCase(locale);
}
