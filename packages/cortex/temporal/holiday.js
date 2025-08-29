/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Public Holiday result class for clean API surface.
 *
 * This module provides the simple Holiday class that users receive from
 * the calculation function. It contains only the essential data and
 * convenience methods, keeping the API clean and focused.
 */

/**
 * Represents a calculated holiday with essential information.
 *
 * This is the public-facing result class that users receive from holiday
 * calculations. It provides a clean interface with readonly properties
 * and convenience methods for common operations.
 *
 * @class Holiday
 * @example
 * const holiday = new Holiday("Christmas", new Date("2024-12-25"), true, "national", "fixed");
 * console.log(holiday.name);        // "Christmas"
 * console.log(holiday.isWorkFree);  // true
 * console.log(holiday.toString());  // "Christmas (2024-12-25) - National Work-free"
 */
export class Holiday {
	/**
	 * Create a new Holiday instance.
	 *
	 * @param {string} name - The name of the holiday
	 * @param {Date} date - The date of the holiday (should be midnight UTC)
	 * @param {boolean} workFree - Whether this is a work-free day
	 * @param {string} scope - Either "national" or "regional"
	 * @param {string} type - Holiday type: "fixed", "easter_relative", or "calculated"
	 */
	constructor(name, date, workFree, scope, type) {
		this.name = name;
		this.date = date;
		this.workFree = workFree;
		this.scope = scope;
		this.type = type;

		// Freeze to prevent external modification
		Object.freeze(this);
	}

	/**
	 * Check if this holiday is work-free (not just an observance).
	 *
	 * @returns {boolean} True if work-free, false if observance only
	 */
	get isWorkFree() {
		return this.workFree;
	}

	/**
	 * Check if this is a national holiday.
	 *
	 * @returns {boolean} True if national scope
	 */
	get isNational() {
		return this.scope === "national";
	}

	/**
	 * Check if this is a regional holiday.
	 *
	 * @returns {boolean} True if regional scope
	 */
	get isRegional() {
		return this.scope === "regional";
	}

	/**
	 * Check if this holiday falls on a specific date.
	 *
	 * @param {Date} date - Date to compare against
	 * @returns {boolean} True if holidays are on the same calendar date
	 */
	isOnDate(date) {
		return (
			this.date.getUTCFullYear() === date.getUTCFullYear() &&
			this.date.getUTCMonth() === date.getUTCMonth() &&
			this.date.getUTCDate() === date.getUTCDate()
		);
	}

	/**
	 * Get a human-readable string representation of the holiday.
	 *
	 * @returns {string} Formatted holiday information
	 * @example
	 * holiday.toString(); // "Christmas (2024-12-25) - National Work-free"
	 */
	toString() {
		const dateStr = this.date.toISOString().split("T")[0];
		const scopeStr = this.scope === "national" ? "National" : "Regional";
		const workStr = this.workFree ? "Work-free" : "Observance";
		return `${this.name} (${dateStr}) - ${scopeStr} ${workStr}`;
	}
}
