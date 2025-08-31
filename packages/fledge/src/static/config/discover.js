/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://ravenjs.dev}
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Discovery configuration for link following during crawling.
 *
 * Controls how the crawler discovers and follows links during static generation.
 * Platform-native class over loose options object.
 */

/**
 * Link discovery configuration
 */
export class Discover {
	/**
	 * Maximum depth from starting points
	 * @type {number | null}
	 */
	depth = null;

	/**
	 * Patterns to skip during discovery
	 * @type {string[] | null}
	 */
	ignore = null;

	/**
	 * Create discovery configuration
	 * @param {Partial<Discover>} [options] - Discovery options to override defaults
	 */
	constructor(options = {}) {
		Object.assign(this, options);
	}

	/**
	 * Get depth with defaults
	 * @returns {number | null} Maximum depth (null = unlimited)
	 */
	getDepth() {
		return this.depth;
	}

	/**
	 * Get ignore patterns with defaults
	 * @returns {string[]} Patterns to ignore
	 */
	getIgnore() {
		return this.ignore ?? [];
	}

	/**
	 * Check if a path should be ignored
	 * @param {string} path - Path to check
	 * @returns {boolean} True if path should be ignored
	 */
	shouldIgnore(path) {
		const patterns = this.getIgnore();
		return patterns.some((pattern) => {
			// Convert glob pattern to regex
			const escaped = pattern
				.replace(/\*/g, "__ASTERISK__") // Temporarily replace *
				.replace(/\?/g, "__QUESTION__") // Temporarily replace ?
				.replace(/[.+^${}()|[\]\\]/g, "\\$&") // Escape regex special chars
				.replace(/__ASTERISK__/g, ".*") // Convert * to .*
				.replace(/__QUESTION__/g, "."); // Convert ? to .

			const regex = new RegExp(`^${escaped}$`);
			return regex.test(path);
		});
	}

	/**
	 * Validate discovery configuration
	 * @throws {Error} If configuration is invalid
	 */
	validate() {
		// Depth must be positive number if specified
		if (this.depth !== null) {
			if (
				typeof this.depth !== "number" ||
				this.depth < 0 ||
				!Number.isInteger(this.depth)
			) {
				throw new Error("Discover depth must be positive integer if specified");
			}
		}

		// Ignore must be array of strings if specified
		if (this.ignore !== null) {
			if (!Array.isArray(this.ignore)) {
				throw new Error(
					"Discover ignore must be array of patterns if specified",
				);
			}

			for (const pattern of this.ignore) {
				if (typeof pattern !== "string") {
					throw new Error("Discover ignore patterns must be strings");
				}
			}
		}
	}
}
