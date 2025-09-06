/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file FileRoute class - represents a file-based route definition
 */

/**
 * Represents a file-based route discovered from the filesystem
 */
export class FileRoute {
	/**
	 * URL pattern for the route (e.g., "/blog/:slug")
	 * @type {string}
	 */
	pattern;

	/**
	 * Absolute path to the module file
	 * @type {string}
	 */
	module;

	/**
	 * Array of dynamic parameter names extracted from the pattern
	 * @type {string[]}
	 */
	params;

	/**
	 * Whether this is a catch-all route (uses [...param] syntax)
	 * @type {boolean}
	 */
	catchAll;

	/**
	 * Sort priority for route matching (lower = higher precedence)
	 * Static routes: 0, Dynamic routes: 1, Catch-all routes: 2
	 * @type {number}
	 */
	priority;

	/**
	 * Create a new FileRoute instance
	 * @param {string} pattern - URL pattern (e.g., "/blog/:slug")
	 * @param {string} module - Absolute path to module file
	 * @param {string[]} params - Dynamic parameter names
	 * @param {boolean} catchAll - Whether this is a catch-all route
	 */
	constructor(pattern, module, params, catchAll) {
		this.pattern = pattern;
		this.module = module;
		this.params = params;
		this.catchAll = catchAll;
		this.priority = this.calculatePriority();
	}

	/**
	 * Calculate route priority for sorting
	 * @returns {number} Priority value (lower = higher precedence)
	 * @private
	 */
	calculatePriority() {
		if (this.catchAll) return 2; // Catch-all routes last
		if (this.params.length > 0) return 1; // Dynamic routes middle
		return 0; // Static routes first
	}

	/**
	 * Compare two FileRoute instances for sorting
	 * @param {FileRoute} other - Other route to compare against
	 * @returns {number} Comparison result for Array.sort()
	 */
	compareTo(other) {
		// First sort by priority
		if (this.priority !== other.priority) {
			return this.priority - other.priority;
		}

		// Within same priority, sort by specificity (fewer params = more specific)
		if (this.params.length !== other.params.length) {
			return this.params.length - other.params.length;
		}

		// Finally, sort alphabetically for consistent ordering
		return this.pattern.localeCompare(other.pattern);
	}

	/**
	 * Get a string representation of the route
	 * @returns {string} String representation
	 */
	toString() {
		return `FileRoute(${this.pattern} -> ${this.module})`;
	}

	/**
	 * Convert to plain object for serialization
	 * @returns {Object} Plain object representation
	 */
	toJSON() {
		return {
			pattern: this.pattern,
			module: this.module,
			params: this.params,
			catchAll: this.catchAll,
			priority: this.priority,
		};
	}
}
