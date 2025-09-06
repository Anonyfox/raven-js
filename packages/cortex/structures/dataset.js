/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Dataset - Enhanced array for structured content with configurable keys and URLs
 */

/**
 * Enhanced Array class for structured content operations with configurable key extraction and URL generation.
 * Provides type-safe operations for filtering, querying, and URL generation over collections of records.
 *
 * @template {{[key: string]: any}} T
 * @extends {Array<T>}
 */
export class Dataset extends Array {
	/**
	 * Override species to return plain Array for inherited methods
	 * This ensures map(), filter(), etc. return plain arrays, not Dataset instances
	 */
	static get [Symbol.species]() {
		return Array;
	}
	/**
	 * Create a new Dataset with configurable key and URL functions
	 *
	 * @param {T[]} [items=[]] - Array of items to initialize the dataset
	 * @param {Object} [options={}] - Configuration options
	 * @param {(item: T) => string} [options.keyFn] - Function to extract unique key from item
	 * @param {(item: T) => string} [options.urlFn] - Function to generate URL from item
	 */
	constructor(items = [], options = {}) {
		super();

		// Handle both array and non-array inputs
		if (Array.isArray(items)) {
			if (items.length > 0) {
				this.push(...items);
			}
		} else if (items !== undefined && items !== 0) {
			// Handle case where Array methods pass single values, but ignore length property
			this.push(items);
		}

		// Default key function tries common identifier fields
		this.keyFn =
			options.keyFn ||
			((item) => {
				if (item.id !== undefined) return String(item.id);
				if (item.slug !== undefined) return String(item.slug);
				if (item.key !== undefined) return String(item.key);
				throw new Error(
					"No key function provided and item has no id, slug, or key property",
				);
			});

		// Default URL function uses key with leading slash
		this.urlFn = options.urlFn || ((item) => `/${this.keyFn(item)}`);
	}

	/**
	 * Find single item by its key
	 *
	 * @param {string} key - The key to search for
	 * @returns {T|undefined} The matching item or undefined if not found
	 */
	get(key) {
		return this.find((item) => this.keyFn(item) === key);
	}

	/**
	 * Filter items matching the provided property matcher object
	 *
	 * @param {Partial<T>} matcher - Object with properties to match against
	 * @returns {Dataset<T>} New Dataset containing matching items
	 */
	match(matcher) {
		const filtered = Array.prototype.filter.call(
			this,
			(/** @type {T} */ item) =>
				Object.entries(matcher).every(([key, value]) => item[key] === value),
		);

		return new Dataset(filtered, {
			keyFn: this.keyFn,
			urlFn: this.urlFn,
		});
	}

	/**
	 * Generate URLs for all items in the dataset
	 *
	 * @returns {string[]} Array of URLs generated from all items
	 */
	urls() {
		const result = [];
		for (let i = 0; i < this.length; i++) {
			result.push(this.urlFn(this[i]));
		}
		return result;
	}

	/**
	 * Create new Dataset with different key and/or URL configuration
	 *
	 * @param {Object} options - New configuration options
	 * @param {(item: T) => string} [options.keyFn] - New key extraction function
	 * @param {(item: T) => string} [options.urlFn] - New URL generation function
	 * @returns {Dataset<T>} New Dataset with updated configuration
	 */
	using(options) {
		return new Dataset(Array.from(this), {
			keyFn: options.keyFn || this.keyFn,
			urlFn: options.urlFn || this.urlFn,
		});
	}

	/**
	 * Sort dataset by field name or custom comparison function
	 *
	 * @param {keyof T | ((a: T, b: T) => number)} sortBy - Field name or comparison function
	 * @returns {Dataset<T>} New sorted Dataset
	 */
	sortBy(sortBy) {
		const compareFn =
			typeof sortBy === "function"
				? sortBy
				: (/** @type {T} */ a, /** @type {T} */ b) => {
						const aVal = a[sortBy];
						const bVal = b[sortBy];
						if (aVal < bVal) return -1;
						if (aVal > bVal) return 1;
						return 0;
					};

		return new Dataset(Array.from(this).sort(compareFn), {
			keyFn: this.keyFn,
			urlFn: this.urlFn,
		});
	}

	/**
	 * Paginate the dataset
	 *
	 * @param {number} [page=1] - Page number (1-based)
	 * @param {number} [size=10] - Items per page
	 * @returns {Dataset<T>} New Dataset containing the requested page
	 */
	paginate(page = 1, size = 10) {
		const start = (page - 1) * size;
		const end = start + size;

		return new Dataset(Array.prototype.slice.call(this, start, end), {
			keyFn: this.keyFn,
			urlFn: this.urlFn,
		});
	}

	/**
	 * Get first item in the dataset
	 *
	 * @returns {T|undefined} First item or undefined if empty
	 */
	first() {
		return this[0];
	}

	/**
	 * Get last item in the dataset
	 *
	 * @returns {T|undefined} Last item or undefined if empty
	 */
	last() {
		return this[this.length - 1];
	}

	/**
	 * Check if dataset is empty
	 *
	 * @returns {boolean} True if dataset has no items
	 */
	isEmpty() {
		return this.length === 0;
	}

	/**
	 * Get all unique values for a specific field
	 *
	 * @param {keyof T} field - Field name to extract values from
	 * @returns {Array<any>} Array of unique values for the field
	 */
	pluck(field) {
		const values = [];
		for (let i = 0; i < this.length; i++) {
			values.push(this[i][field]);
		}
		return [...new Set(values)];
	}
}

/**
 * Create a new Dataset instance with type inference
 *
 * @template {{[key: string]: any}} T
 * @param {T[]} items - Array of items
 * @param {Object} [options] - Configuration options
 * @param {(item: T) => string} [options.keyFn] - Key extraction function
 * @param {(item: T) => string} [options.urlFn] - URL generation function
 * @returns {Dataset<T>} New Dataset instance
 */
export const dataset = (items, options) => new Dataset(items, options);
