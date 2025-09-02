/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Width folding for fullwidth to halfwidth character conversion.
 *
 * Converts fullwidth characters commonly used in CJK typography to their
 * halfwidth ASCII equivalents. Critical for text processing in international
 * applications where mixed character widths create comparison failures.
 */

// Pre-compiled regex for V8 optimization - avoids regex compilation on every call
const FULLWIDTH_REGEX = /[\uff01-\uff5e]/g;

/**
 * Converts fullwidth characters to their halfwidth equivalents.
 *
 * Transforms fullwidth Latin letters, digits, and punctuation marks used
 * in CJK typography to standard ASCII characters. This normalization prevents
 * comparison failures between visually identical text with different encodings.
 *
 * @param {string} text - The text containing fullwidth characters
 * @returns {string} The text with fullwidth characters converted to halfwidth
 *
 * @example
 * // Fullwidth digits and letters
 * foldWidth('１２３ＡＢＣ'); // '123ABC'
 *
 * @example
 * // Fullwidth punctuation
 * foldWidth('（Ｈｅｌｌｏ！）'); // '(Hello!)'
 *
 * @example
 * // Mixed content
 * foldWidth('Ｅｍａｉｌ：ｔｅｓｔ＠ｅｘａｍｐｌｅ．ｃｏｍ'); // 'Email:test@example.com'
 */
export function foldWidth(text) {
	// Handle edge cases - return early for invalid inputs
	if (!text) return text || "";

	// Convert fullwidth characters (0xFF01-0xFF5E) to halfwidth (0x21-0x7E)
	return text.replace(FULLWIDTH_REGEX, (match) => {
		const code = match.charCodeAt(0);
		return String.fromCharCode(code - 0xfee0);
	});
}
