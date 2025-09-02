/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Code-aware tokenization for developer text patterns.
 *
 * Provides specialized tokenization for programming conventions like
 * camelCase, PascalCase, snake_case, kebab-case, and SCREAMING_SNAKE_CASE.
 * Essential for search and analysis of technical documentation and code.
 */

// Pre-compiled regexes for V8 optimization - avoid regex compilation on every call
const SEPARATOR_REGEX = /[\s\-_.]+/;
const CAMEL_CASE_REGEX =
	/(?=[A-Z][a-z])|(?<=[a-z])(?=[A-Z])|(?<=[0-9])(?=[A-Z])|(?<=[A-Z])(?=[A-Z][a-z])/;

/**
 * Tokenizes developer text by splitting on common programming naming conventions.
 *
 * Recognizes and splits camelCase, PascalCase, snake_case, kebab-case,
 * SCREAMING_SNAKE_CASE, and dot.notation into meaningful word components.
 * Preserves the original casing of each component for context.
 *
 * @param {string} text - The code/developer text to tokenize
 * @returns {string[]} Array of word tokens split from programming conventions
 *
 * @example
 * // camelCase and PascalCase
 * tokenizeCode('getUserData'); // ['get', 'User', 'Data']
 * tokenizeCode('XMLHttpRequest'); // ['XML', 'Http', 'Request']
 *
 * @example
 * // snake_case and variations
 * tokenizeCode('user_profile_data'); // ['user', 'profile', 'data']
 * tokenizeCode('API_KEY_SECRET'); // ['API', 'KEY', 'SECRET']
 *
 * @example
 * // kebab-case
 * tokenizeCode('user-profile-component'); // ['user', 'profile', 'component']
 *
 * @example
 * // Mixed conventions and numbers
 * tokenizeCode('parseHTML5Document'); // ['parse', 'HTML5', 'Document']
 * tokenizeCode('v2.api-endpoint_handler'); // ['v2', 'api', 'endpoint', 'handler']
 */
export function tokenizeCode(text) {
	// Handle edge cases - return early for invalid inputs
	if (!text) return [];

	const tokens = [];

	// Split the text into segments using pre-compiled separator regex
	const segments = text.split(SEPARATOR_REGEX);

	for (const segment of segments) {
		if (!segment) continue;

		// Handle camelCase and PascalCase within each segment using pre-compiled regex
		const camelTokens = segment.split(CAMEL_CASE_REGEX);

		for (const token of camelTokens) {
			if (token?.trim()) {
				tokens.push(token.trim());
			}
		}
	}

	return tokens;
}
