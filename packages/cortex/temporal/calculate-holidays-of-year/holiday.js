/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Holiday class definition for institutional memory preservation
 *
 * Encapsulates bureaucratic holiday patterns that survive across political changes.
 * Supports multiple calculation types with validation and date generation.
 *
 * The murder's memory palace: each holiday preserved as a computational artifact.
 */

/**
 * @typedef {Object} CalculatedHoliday
 * @property {string} name - Holiday name
 * @property {Date} date - Holiday date
 * @property {boolean} workFree - Whether this is a work-free holiday
 * @property {'national' | 'regional'} scope - Holiday scope
 * @property {'fixed' | 'easter_relative' | 'calculated'} type - Calculation type
 */

/**
 * Holiday definition class for encoding governmental temporal patterns.
 *
 * Internal class that preserves institutional memory of bureaucratic holiday calculations
 * across political changes, calendar reforms, and regional variations. Each definition
 * encapsulates its calculation logic and metadata.
 *
 * SUPPORTED CALCULATION TYPES:
 * - **fixed**: Calendar date holidays (Christmas, New Year)
 * - **easter_relative**: Offset from Easter Sunday (Good Friday, Pentecost)
 * - **calculated**: Custom algorithm holidays (Buß- und Bettag)
 *
 * DESIGN PRINCIPLES:
 * - **Immutable**: Holiday definitions don't change after creation
 * - **Self-contained**: Each holiday knows how to calculate itself
 * - **Validated**: Construction ensures data integrity
 * - **Extensible**: New calculation types can be added
 *
 * @example
 * // Fixed date holiday definition
 * const newYear = new HolidayDefinition({
 *   name: 'Neujahr',
 *   type: 'fixed',
 *   month: 1,
 *   day: 1,
 *   workFree: true
 * });
 *
 * @example
 * // Easter-relative holiday definition
 * const goodFriday = new HolidayDefinition({
 *   name: 'Karfreitag',
 *   type: 'easter_relative',
 *   offset: -2,
 *   workFree: true
 * });
 *
 * @example
 * // Calculate actual holiday instances
 * const newYearHoliday = newYear.calculateHoliday(2024);
 * const goodFridayHoliday = goodFriday.calculateHoliday(2024, easterSunday);
 */
export class HolidayDefinition {
	/**
	 * Create a new holiday definition.
	 *
	 * @param {Object} definition - Holiday definition object
	 * @param {string} definition.name - Holiday name
	 * @param {'fixed' | 'easter_relative' | 'calculated'} definition.type - Calculation type
	 * @param {boolean} definition.workFree - Whether this is a work-free holiday
	 * @param {number} [definition.month] - Month for fixed holidays (1-12)
	 * @param {number} [definition.day] - Day for fixed holidays
	 * @param {number} [definition.offset] - Days offset from Easter for relative holidays
	 * @param {Function} [definition.calculator] - Custom calculation function for complex holidays
	 * @throws {Error} Invalid holiday definition parameters
	 */
	constructor(definition) {
		// Validate required fields
		if (typeof definition.name !== "string" || definition.name.length === 0) {
			throw new Error("Holiday name must be a non-empty string");
		}

		if (!["fixed", "easter_relative", "calculated"].includes(definition.type)) {
			throw new Error(
				"Holiday type must be 'fixed', 'easter_relative', or 'calculated'",
			);
		}

		if (typeof definition.workFree !== "boolean") {
			throw new Error("Holiday workFree must be a boolean");
		}

		// Type-specific validation
		switch (definition.type) {
			case "fixed":
				if (
					!Number.isInteger(definition.month) ||
					definition.month < 1 ||
					definition.month > 12
				) {
					throw new Error("Fixed holiday month must be integer 1-12");
				}
				if (
					!Number.isInteger(definition.day) ||
					definition.day < 1 ||
					definition.day > 31
				) {
					throw new Error("Fixed holiday day must be integer 1-31");
				}
				break;

			case "easter_relative":
				if (!Number.isInteger(definition.offset)) {
					throw new Error("Easter relative holiday offset must be an integer");
				}
				break;

			case "calculated":
				if (typeof definition.calculator !== "function") {
					throw new Error("Calculated holiday must have a calculator function");
				}
				break;
		}

		// Assign properties (immutable after construction)
		this.name = definition.name;
		this.type = definition.type;
		this.workFree = definition.workFree;

		// Type-specific properties
		if (definition.type === "fixed") {
			this.month = definition.month;
			this.day = definition.day;
		} else if (definition.type === "easter_relative") {
			this.offset = definition.offset;
		} else if (definition.type === "calculated") {
			this.calculator = definition.calculator;
		}

		// Freeze the object to prevent modification
		Object.freeze(this);
	}

	/**
	 * Calculate the actual holiday for this definition in a given year.
	 *
	 * @param {number} year - Year to calculate for (must be >= 1583)
	 * @param {Date} [easterSunday] - Easter Sunday date (required for easter_relative holidays)
	 * @param {'national' | 'regional'} [scope='national'] - Holiday scope for result object
	 * @returns {Holiday} Calculated holiday instance
	 * @throws {Error} Invalid parameters or missing Easter date for relative holidays
	 */
	calculateHoliday(year, easterSunday = null, scope = "national") {
		// Validate year
		if (!Number.isInteger(year) || year < 1583) {
			throw new Error("Year must be an integer >= 1583 (Gregorian calendar)");
		}

		// Validate scope
		if (!["national", "regional"].includes(scope)) {
			throw new Error("Scope must be 'national' or 'regional'");
		}

		let date;

		switch (this.type) {
			case "fixed":
				// Fixed date holidays
				date = new Date(Date.UTC(year, this.month - 1, this.day, 0, 0, 0, 0));
				break;

			case "easter_relative":
				// Easter-relative holidays
				if (!(easterSunday instanceof Date)) {
					throw new Error(
						"Easter Sunday date required for easter_relative holidays",
					);
				}
				date = new Date(easterSunday.getTime());
				date.setUTCDate(date.getUTCDate() + this.offset);
				break;

			case "calculated":
				// Custom calculated holidays
				date = this.calculator(year);
				if (!(date instanceof Date)) {
					throw new Error(
						`Calculator function for ${this.name} must return a Date object`,
					);
				}
				break;

			default:
				throw new Error(`Unsupported holiday type: ${this.type}`);
		}

		return new Holiday(this.name, date, this.workFree, scope, this.type);
	}

	/**
	 * Get a string representation of this holiday.
	 *
	 * @returns {string} Holiday description
	 */
	toString() {
		let details = `${this.name} (${this.type})`;

		if (this.type === "fixed") {
			details += ` - ${this.month}/${this.day}`;
		} else if (this.type === "easter_relative") {
			const sign = this.offset >= 0 ? "+" : "";
			details += ` - Easter${sign}${this.offset}`;
		}

		details += this.workFree ? " [work-free]" : " [observance]";

		return details;
	}

	/**
	 * Create a HolidayDefinition instance from a plain object definition.
	 * Convenience factory method for bulk creation.
	 *
	 * @param {any} definition - Holiday definition object
	 * @returns {HolidayDefinition} New HolidayDefinition instance
	 */
	static from(definition) {
		return new HolidayDefinition(definition);
	}

	/**
	 * Validate a holiday definition object without creating an instance.
	 * Useful for batch validation.
	 *
	 * @param {any} definition - Holiday definition to validate
	 * @returns {boolean} True if definition is valid
	 */
	static isValidDefinition(definition) {
		try {
			new HolidayDefinition(definition);
			return true;
		} catch (_error) {
			return false;
		}
	}
}

/**
 * Simple Holiday class representing a calculated holiday result.
 *
 * Clean data class for API consumers - contains only the essential information
 * about a calculated holiday without exposing internal calculation logic.
 *
 * DESIGN PRINCIPLES:
 * - **Simple**: Just data, no complex logic
 * - **Immutable**: Cannot be modified after creation
 * - **Clean API**: Only exposes what consumers need
 *
 * @example
 * const holiday = new Holiday(
 *   'Neujahr',
 *   new Date('2024-01-01'),
 *   true,
 *   'national',
 *   'fixed'
 * );
 * console.log(holiday.name); // 'Neujahr'
 * console.log(holiday.isWorkFree); // true
 */
export class Holiday {
	/**
	 * Create a new holiday result.
	 *
	 * @param {string} name - Holiday name
	 * @param {Date} date - Holiday date
	 * @param {boolean} workFree - Whether this is a work-free holiday
	 * @param {'national' | 'regional'} scope - Holiday scope
	 * @param {'fixed' | 'easter_relative' | 'calculated'} type - Calculation type
	 */
	constructor(name, date, workFree, scope, type) {
		this.name = name;
		this.date = date;
		this.workFree = workFree;
		this.scope = scope;
		this.type = type;

		// Freeze to make immutable
		Object.freeze(this);
	}

	/**
	 * Get string representation of this holiday.
	 *
	 * @returns {string} Holiday description
	 */
	toString() {
		const dateStr = this.date.toISOString().split("T")[0];
		const scopeStr = this.scope === "national" ? "National" : "Regional";
		const workStr = this.workFree ? "Work-free" : "Observance";
		return `${this.name} (${dateStr}) - ${scopeStr} ${workStr}`;
	}

	/**
	 * Check if this holiday falls on a specific date.
	 *
	 * @param {Date} date - Date to check against
	 * @returns {boolean} True if holiday falls on the given date
	 */
	isOnDate(date) {
		return this.date.getTime() === date.getTime();
	}

	/**
	 * Check if this holiday is work-free.
	 *
	 * @returns {boolean} True if this is a work-free holiday
	 */
	get isWorkFree() {
		return this.workFree;
	}

	/**
	 * Check if this holiday is national scope.
	 *
	 * @returns {boolean} True if this is a national holiday
	 */
	get isNational() {
		return this.scope === "national";
	}

	/**
	 * Check if this holiday is regional scope.
	 *
	 * @returns {boolean} True if this is a regional holiday
	 */
	get isRegional() {
		return this.scope === "regional";
	}
}
