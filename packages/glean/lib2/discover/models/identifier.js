/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file High-performance identifier class for extracted JavaScript symbols.
 *
 * Represents an exported identifier with optimal memory layout for V8 performance.
 * Uses consistent property order and types for maximum optimization by the JavaScript engine.
 */

/**
 * Represents an exported JavaScript identifier with optimal V8 performance characteristics.
 *
 * This class uses a consistent property order and initialization pattern that allows
 * V8 to create optimized hidden classes, improving both memory usage and access speed.
 */
export class Identifier {
	/**
	 * Creates a new identifier instance.
	 *
	 * @param {string} exportedName - The name used when exporting the identifier
	 * @param {string} originalName - The original name of the identifier in its source
	 * @param {string|null} sourcePath - The source path where the identifier originates, or null for local identifiers
	 */
	constructor(exportedName, originalName, sourcePath) {
		/** @type {string} The name used when exporting the identifier */
		this.exportedName = exportedName;

		/** @type {string} The original name of the identifier in its source */
		this.originalName = originalName;

		/** @type {string|null} The source path where the identifier originates, or null for local identifiers */
		this.sourcePath = sourcePath;
	}

	/**
	 * Returns a string representation of the identifier.
	 * Useful for debugging and logging.
	 *
	 * @returns {string} String representation
	 */
	toString() {
		if (this.sourcePath) {
			return `${this.exportedName} (${this.originalName} from ${this.sourcePath})`;
		}
		return this.exportedName === this.originalName
			? this.exportedName
			: `${this.exportedName} (${this.originalName})`;
	}

	/**
	 * Converts the identifier to a plain object for serialization.
	 *
	 * @returns {{exportedName: string, originalName: string, sourcePath: string|null}}
	 */
	toJSON() {
		return {
			exportedName: this.exportedName,
			originalName: this.originalName,
			sourcePath: this.sourcePath,
		};
	}

	/**
	 * Creates an Identifier instance from a plain object.
	 *
	 * @param {{exportedName: string, originalName: string, sourcePath: string|null}} obj - Plain object with identifier data
	 * @returns {Identifier} New Identifier instance
	 */
	static fromObject(obj) {
		return new Identifier(obj.exportedName, obj.originalName, obj.sourcePath);
	}
}
