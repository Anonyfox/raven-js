/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see https://github.com/Anonyfox/ravenjs
 * @see https://ravenjs.dev
 * @see https://anonyfox.com
 */

/**
 * @file Shell command template literal - array joining with whitespace normalization
 *
 * Minimal shell command builder focused on array-to-arguments conversion and clean formatting.
 * No escaping, no security features - pure convenience for command assembly.
 * Developer owns all security considerations.
 */

// Template cache for memoized command generation
const TEMPLATE_CACHE = new WeakMap();

/**
 * Process shell values with transparent normalization.
 * Arrays become space-separated, falsy values filtered, whitespace cleaned.
 *
 * @param {any} value - Value to process for shell context
 * @returns {string} Processed shell value
 */
function processShellValue(value) {
	if (value == null || value === false || value === "") return "";
	if (value === true) return "true";
	if (typeof value === "string") return value;
	if (typeof value === "number") return String(value);

	if (Array.isArray(value)) {
		return value
			.filter((v) => v != null && v !== false && v !== "")
			.map((v) => String(v))
			.join(" ");
	}

	return String(value);
}

/**
 * Tagged template literal for shell command assembly.
 *
 * **Use:** Building command strings with arrays of flags/arguments.
 * **Security:** NO escaping applied - developer responsible for all safety.
 * **Features:** Array joining, whitespace normalization, falsy value filtering.
 *
 * **Value Processing:**
 * - Arrays: Space-separated values with falsy filtering
 * - Strings/Numbers: Direct conversion
 * - null/undefined/false/"": Empty string
 * - true: String "true"
 * - Objects: String conversion
 *
 * **Whitespace Handling:**
 * - Multiple spaces collapsed to single space
 * - Leading/trailing whitespace trimmed
 * - Template formatting artifacts removed
 *
 * @param {readonly string[]} strings - Template literal static parts
 * @param {...any} values - Template literal interpolated values
 * @returns {string} Clean shell command string
 *
 * @example
 * // Array flag handling
 * const flags = ['-la', '--color=always'];
 * const files = ['src/', 'test/'];
 * sh`ls ${flags} ${files}`
 * // → "ls -la --color=always src/ test/"
 *
 * @example
 * // Conditional flags with automatic filtering
 * const flags = ['-v', verbose && '--debug', quiet && '--quiet'];
 * sh`npm install ${flags}`
 * // → "npm install -v --debug" (false values filtered)
 *
 * @example
 * // Template formatting cleanup
 * const cmd = sh`docker run
 *   -v ${volume}
 *   -p ${port}
 *   ${image}`;
 * // → "docker run -v /data:/app -p 3000:3000 nginx"
 *
 * @example
 * // Complex command assembly
 * const env = ['NODE_ENV=production', 'PORT=3000'];
 * const args = ['--max-old-space-size=4096'];
 * sh`${env} node ${args} server.js`
 * // → "NODE_ENV=production PORT=3000 node --max-old-space-size=4096 server.js"
 */
export function sh(strings, ...values) {
	// Check cache for compiled template
	let fn = TEMPLATE_CACHE.get(strings);
	if (!fn) {
		// Static-only optimization: no interpolations
		if (values.length === 0) {
			fn = () => strings[0].replace(/\s+/g, " ").trim();
		} else {
			// Build processing function
			/**
			 * @param {...any} vals
			 * @returns {string}
			 */
			fn = (...vals) => {
				let result = strings[0];
				for (let i = 0; i < vals.length; i++) {
					result += processShellValue(vals[i]) + strings[i + 1];
				}
				// Normalize whitespace: collapse multiple spaces, trim edges
				return result.replace(/\s+/g, " ").trim();
			};
		}
		TEMPLATE_CACHE.set(strings, fn);
	}

	return fn(...values);
}
