/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Core utilities for database operations - LRU cache, ring buffers, and object factories.
 *
 * Provides high-performance utilities optimized for database client operations.
 * Includes a tiny LRU cache for prepared statements, ring buffers for parsing,
 * and stable object factories for monomorphic row construction.
 */

/**
 * @typedef {Object} LRUNode
 * @property {string} key - Cache key
 * @property {any} value - Cache value
 * @property {LRUNode|null} prev - Previous node
 * @property {LRUNode|null} next - Next node
 */

/**
 * Tiny LRU cache implementation optimized for prepared statement caching
 */
export class LRUCache {
	/**
	 * @param {number} maxSize - Maximum number of items to cache
	 */
	constructor(maxSize = 100) {
		this.maxSize = maxSize;
		this.size = 0;
		this.cache = new Map();

		// Create dummy head and tail nodes for O(1) operations
		this.head = { key: null, value: null, prev: null, next: null };
		this.tail = { key: null, value: null, prev: null, next: null };
		this.head.next = this.tail;
		this.tail.prev = this.head;
	}

	/**
	 * Get value from cache
	 * @param {string} key - Cache key
	 * @returns {any|undefined} Cached value or undefined if not found
	 */
	get(key) {
		const node = this.cache.get(key);
		if (!node) return undefined;

		// Move to front (most recently used)
		this._moveToFront(node);
		return node.value;
	}

	/**
	 * Set value in cache
	 * @param {string} key - Cache key
	 * @param {any} value - Value to cache
	 */
	set(key, value) {
		const existingNode = this.cache.get(key);

		if (existingNode) {
			// Update existing node
			existingNode.value = value;
			this._moveToFront(existingNode);
			return;
		}

		// Create new node
		const newNode = { key, value, prev: null, next: null };

		// Add to cache and front of list
		this.cache.set(key, newNode);
		this._addToFront(newNode);
		this.size++;

		// Evict least recently used if over capacity
		if (this.size > this.maxSize) {
			this._evictLRU();
		}
	}

	/**
	 * Remove value from cache
	 * @param {string} key - Cache key
	 * @returns {boolean} True if key was found and removed
	 */
	delete(key) {
		const node = this.cache.get(key);
		if (!node) return false;

		this.cache.delete(key);
		this._removeNode(node);
		this.size--;
		return true;
	}

	/**
	 * Clear all cached values
	 */
	clear() {
		this.cache.clear();
		this.size = 0;
		this.head.next = this.tail;
		this.tail.prev = this.head;
	}

	/**
	 * Get current cache size
	 * @returns {number} Number of cached items
	 */
	get length() {
		return this.size;
	}

	/**
	 * Move node to front of list
	 * @param {LRUNode} node - Node to move
	 * @private
	 */
	_moveToFront(node) {
		this._removeNode(node);
		this._addToFront(node);
	}

	/**
	 * Add node to front of list
	 * @param {LRUNode} node - Node to add
	 * @private
	 */
	_addToFront(node) {
		node.prev = this.head;
		node.next = this.head.next;
		this.head.next.prev = node;
		this.head.next = node;
	}

	/**
	 * Remove node from list
	 * @param {LRUNode} node - Node to remove
	 * @private
	 */
	_removeNode(node) {
		node.prev.next = node.next;
		node.next.prev = node.prev;
	}

	/**
	 * Evict least recently used item
	 * @private
	 */
	_evictLRU() {
		const lru = this.tail.prev;
		this.cache.delete(lru.key);
		this._removeNode(lru);
		this.size--;
	}
}

/**
 * Ring buffer for efficient parsing operations
 */
export class RingBuffer {
	/**
	 * @param {number} size - Buffer size (must be power of 2 for optimal performance)
	 */
	constructor(size = 8192) {
		// Ensure size is power of 2 for efficient modulo operations
		this.size = 2 ** Math.ceil(Math.log2(size));
		this.mask = this.size - 1;
		this.buffer = new Uint8Array(this.size);
		this.head = 0;
		this.tail = 0;
		this.length = 0;
	}

	/**
	 * Write data to buffer
	 * @param {Uint8Array} data - Data to write
	 * @returns {number} Number of bytes written
	 */
	write(data) {
		const available = this.size - this.length;
		const toWrite = Math.min(data.length, available);

		for (let i = 0; i < toWrite; i++) {
			this.buffer[this.tail] = data[i];
			this.tail = (this.tail + 1) & this.mask;
		}

		this.length += toWrite;
		return toWrite;
	}

	/**
	 * Read data from buffer
	 * @param {number} count - Number of bytes to read
	 * @returns {Uint8Array} Read data
	 */
	read(count) {
		const toRead = Math.min(count, this.length);
		const result = new Uint8Array(toRead);

		for (let i = 0; i < toRead; i++) {
			result[i] = this.buffer[this.head];
			this.head = (this.head + 1) & this.mask;
		}

		this.length -= toRead;
		return result;
	}

	/**
	 * Peek at data without consuming it
	 * @param {number} count - Number of bytes to peek
	 * @returns {Uint8Array} Peeked data
	 */
	peek(count) {
		const toPeek = Math.min(count, this.length);
		const result = new Uint8Array(toPeek);
		let pos = this.head;

		for (let i = 0; i < toPeek; i++) {
			result[i] = this.buffer[pos];
			pos = (pos + 1) & this.mask;
		}

		return result;
	}

	/**
	 * Skip bytes in buffer
	 * @param {number} count - Number of bytes to skip
	 * @returns {number} Number of bytes actually skipped
	 */
	skip(count) {
		const toSkip = Math.min(count, this.length);
		this.head = (this.head + toSkip) & this.mask;
		this.length -= toSkip;
		return toSkip;
	}

	/**
	 * Clear buffer
	 */
	clear() {
		this.head = 0;
		this.tail = 0;
		this.length = 0;
	}

	/**
	 * Get available space in buffer
	 * @returns {number} Available bytes
	 */
	get available() {
		return this.size - this.length;
	}

	/**
	 * Check if buffer is empty
	 * @returns {boolean} True if empty
	 */
	get isEmpty() {
		return this.length === 0;
	}

	/**
	 * Check if buffer is full
	 * @returns {boolean} True if full
	 */
	get isFull() {
		return this.length === this.size;
	}
}

/**
 * Factory for creating stable object constructors (monomorphic optimization)
 */
export class ObjectFactory {
	/**
	 * @param {string[]} columns - Column names
	 */
	constructor(columns) {
		this.columns = columns;
		this.constructor = this._createConstructor(columns);
	}

	/**
	 * Create new object with given values
	 * @param {any[]} values - Values in column order
	 * @returns {Object} Object with column names as keys
	 */
	create(values) {
		return this.constructor(values);
	}

	/**
	 * Create optimized constructor function for given columns
	 * @param {string[]} columns - Column names
	 * @returns {Function} Constructor function
	 * @private
	 */
	_createConstructor(columns) {
		// Create function body that directly assigns properties
		// This creates a monomorphic constructor that V8 can optimize
		const assignments = columns
			.map(
				(col, idx) =>
					`obj.${this._sanitizePropertyName(col)} = values[${idx}];`,
			)
			.join("\n    ");

		const functionBody = `
			const obj = {};
			${assignments}
			return obj;
		`;

		// Use Function constructor to create optimized function
		// biome-ignore lint/security/noGlobalEval: Controlled function generation for performance
		return new Function("values", functionBody);
	}

	/**
	 * Sanitize column name for use as JavaScript property
	 * @param {string} name - Column name
	 * @returns {string} Sanitized property name
	 * @private
	 */
	_sanitizePropertyName(name) {
		// Replace invalid characters with underscore
		return name.replace(/[^a-zA-Z0-9_$]/g, "_");
	}
}

/**
 * UTF-8 encoding/decoding utilities
 */
export const utf8 = {
	/**
	 * Encode string to UTF-8 bytes
	 * @param {string} str - String to encode
	 * @returns {Uint8Array} UTF-8 encoded bytes
	 */
	encode(str) {
		return new TextEncoder().encode(str);
	},

	/**
	 * Decode UTF-8 bytes to string
	 * @param {Uint8Array} bytes - UTF-8 bytes to decode
	 * @returns {string} Decoded string
	 */
	decode(bytes) {
		return new TextDecoder("utf-8").decode(bytes);
	},

	/**
	 * Get byte length of string when UTF-8 encoded
	 * @param {string} str - String to measure
	 * @returns {number} Byte length
	 */
	byteLength(str) {
		return new TextEncoder().encode(str).length;
	},
};

/**
 * High-resolution timer utilities
 */
export const timer = {
	/**
	 * Get current high-resolution timestamp
	 * @returns {number} Timestamp in milliseconds
	 */
	now() {
		return performance.now();
	},

	/**
	 * Create a timeout promise that rejects after specified milliseconds
	 * @param {number} ms - Timeout in milliseconds
	 * @param {string} [message] - Error message
	 * @returns {Promise<never>} Promise that rejects on timeout
	 */
	timeout(ms, message = "Operation timed out") {
		return new Promise((_, reject) => {
			setTimeout(() => reject(new Error(message)), ms);
		});
	},

	/**
	 * Race a promise against a timeout
	 * @param {Promise<T>} promise - Promise to race
	 * @param {number} ms - Timeout in milliseconds
	 * @param {string} [message] - Error message
	 * @returns {Promise<T>} Promise that resolves or rejects
	 * @template T
	 */
	race(promise, ms, message) {
		return Promise.race([promise, this.timeout(ms, message)]);
	},
};

/**
 * Create a deferred promise (promise with external resolve/reject)
 * @returns {{promise: Promise<T>, resolve: Function, reject: Function}} Deferred promise
 * @template T
 */
export function createDeferred() {
	let resolve, reject;
	const promise = new Promise((res, rej) => {
		resolve = res;
		reject = rej;
	});
	return { promise, resolve, reject };
}

/**
 * Sleep for specified milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>} Promise that resolves after delay
 */
export function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Escape SQL identifier (table/column names)
 * @param {string} identifier - Identifier to escape
 * @param {string} [quote='"'] - Quote character to use
 * @returns {string} Escaped identifier
 */
export function escapeIdentifier(identifier, quote = '"') {
	return (
		quote + identifier.replace(new RegExp(quote, "g"), quote + quote) + quote
	);
}

/**
 * Generate a random identifier for prepared statements
 * @param {string} [prefix='stmt'] - Prefix for identifier
 * @returns {string} Random identifier
 */
export function generateId(prefix = "stmt") {
	return `${prefix}_${Math.random().toString(36).slice(2, 11)}`;
}
