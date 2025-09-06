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

		// Private key index for O(1) lookups
		this.#keyIndex = new Map();
		this.#indexValid = false;

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
			((/** @type {T} */ item) => {
				if (item.id !== undefined) return String(item.id);
				if (item.slug !== undefined) return String(item.slug);
				if (item.key !== undefined) return String(item.key);
				throw new Error(
					"No key function provided and item has no id, slug, or key property",
				);
			});

		// Default URL function uses key with leading slash
		this.urlFn = options.urlFn || ((item) => `/${this.keyFn(item)}`);

		// Index will be built lazily when first needed
	}

	// Private fields for performance optimization
	#keyIndex;
	#indexValid;

	/**
	 * Build key index for O(1) lookups
	 */
	#buildIndex() {
		this.#keyIndex.clear();
		const keyFn = this.keyFn; // Cache function reference to avoid property lookup
		for (let i = 0; i < this.length; i++) {
			const item = this[i];
			const key = keyFn(item);
			this.#keyIndex.set(key, item);
		}
		this.#indexValid = true;
	}

	/**
	 * Invalidate index when array is modified
	 */
	#invalidateIndex() {
		this.#indexValid = false;
	}

	/**
	 * Ensure index is valid, rebuild if necessary
	 */
	#ensureIndex() {
		if (!this.#indexValid) {
			this.#buildIndex();
		}
	}

	/**
	 * Find single item by its key
	 *
	 * @param {string} key - The key to search for
	 * @returns {T|undefined} The matching item or undefined if not found
	 */
	get(key) {
		this.#ensureIndex();
		return this.#keyIndex.get(key);
	}

	/**
	 * Filter items matching the provided property matcher object
	 *
	 * @param {Partial<T>} matcher - Object with properties to match against
	 * @returns {Dataset<T>} New Dataset containing matching items
	 */
	match(matcher) {
		const filtered = [];
		const matcherKeys = Object.keys(matcher);
		const matcherLength = matcherKeys.length;

		// Fast path for single property matching (most common case)
		if (matcherLength === 1) {
			const key = matcherKeys[0];
			const value = matcher[key];
			for (let i = 0; i < this.length; i++) {
				const item = this[i];
				if (item[key] === value) {
					filtered.push(item);
				}
			}
		} else {
			// Multi-property matching
			for (let i = 0; i < this.length; i++) {
				const item = this[i];
				let matches = true;

				for (let j = 0; j < matcherLength; j++) {
					const key = matcherKeys[j];
					if (item[key] !== matcher[key]) {
						matches = false;
						break;
					}
				}

				if (matches) {
					filtered.push(item);
				}
			}
		}

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
		// Pre-allocate array to avoid dynamic growth and reallocations
		const result = new Array(this.length);
		const urlFn = this.urlFn; // Cache function reference
		for (let i = 0; i < this.length; i++) {
			result[i] = urlFn(this[i]);
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
		// Direct slice is faster than Array.from for copying
		const copy = this.slice();
		return new Dataset(copy, {
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

		// Direct slice and sort is faster than Array.from
		const sorted = this.slice().sort(compareFn);
		return new Dataset(sorted, {
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

		// Direct slice is more efficient than Array.prototype.slice.call
		return new Dataset(this.slice(start, end), {
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
		// Use Set directly to avoid intermediate array allocation
		const uniqueValues = new Set();
		for (let i = 0; i < this.length; i++) {
			uniqueValues.add(this[i][field]);
		}
		return Array.from(uniqueValues);
	}

	// Override array mutation methods to invalidate index
	/**
	 * @param {...T} items
	 * @returns {number}
	 */
	push(...items) {
		const result = super.push(...items);
		this.#invalidateIndex();
		return result;
	}

	/**
	 * @returns {T|undefined}
	 */
	pop() {
		const result = super.pop();
		this.#invalidateIndex();
		return result;
	}

	/**
	 * @returns {T|undefined}
	 */
	shift() {
		const result = super.shift();
		this.#invalidateIndex();
		return result;
	}

	/**
	 * @param {...T} items
	 * @returns {number}
	 */
	unshift(...items) {
		const result = super.unshift(...items);
		this.#invalidateIndex();
		return result;
	}

	/**
	 * @param {number} start
	 * @param {number} deleteCount
	 * @param {...T} items
	 * @returns {T[]}
	 */
	splice(start, deleteCount, ...items) {
		const result = super.splice(start, deleteCount, ...items);
		this.#invalidateIndex();
		return result;
	}

	/**
	 * @param {(a: T, b: T) => number} [compareFn]
	 * @returns {this}
	 */
	sort(compareFn) {
		super.sort(compareFn);
		this.#invalidateIndex();
		return this;
	}

	/**
	 * @returns {this}
	 */
	reverse() {
		super.reverse();
		this.#invalidateIndex();
		return this;
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
