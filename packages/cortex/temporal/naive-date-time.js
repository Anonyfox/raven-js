/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Timezone-naive DateTime class for clean temporal manipulation
 *
 * Extension of native Date that eliminates timezone complexity and normalizes
 * Unix timestamp handling to seconds precision. Optimized for SQLite databases
 * and clean API surfaces where timezone offset manipulation creates bugs.
 * Pure V8 implementation with zero external dependencies.
 */

/**
 * Extension of the builtin Date class, which removes the timezone offset, and
 * constructing from a Unix timestamp in seconds is possible directly.
 *
 * This is especially useful when working with SQLite databases, where dates are
 * often stored as Unix timestamps in seconds. The constructor and getTime methods
 * are overridden to make sure the timestamp is always in seconds, aka valid Unix time.
 *
 * @class NaiveDateTime
 * @extends Date
 * @example
 * // Creating a NaiveDateTime from an ISO string
 * const dateFromString = new NaiveDateTime("2024-01-01T00:00:00+02:00");
 * console.log(dateFromString.toISOString()); // "2023-12-31T22:00:00.000Z"
 *
 * @example
 * // Creating a NaiveDateTime from a Unix timestamp in seconds
 * const dateFromTimestamp = new NaiveDateTime(1704067200);
 * console.log(dateFromTimestamp.toISOString()); // "2024-01-01T00:00:00.000Z"
 *
 * @example
 * // Creating a NaiveDateTime from a Date object
 * const dateFromDateObject = new NaiveDateTime(new Date("2024-01-01T00:00:00Z"));
 * console.log(dateFromDateObject.toISOString()); // "2024-01-01T00:00:00.000Z"
 */
export class NaiveDateTime extends Date {
	/**
	 * Creates a new NaiveDateTime instance, which extends the native Date class.
	 * (Even though its called "Date", it actually is a DateTime representation!)
	 *
	 * It accepts a string, number, or Date object as input. (like the original Date class)
	 *
	 * - if the input is a string in some parseable ISO format, the timezone offset will be removed
	 * - if the input is a number, it is assumed to be a Unix timestamp in seconds (not milliseconds!)
	 * - if the input is a Date object, it will be passed to the Date constructor as-is
	 *
	 * @param {string|number|Date} input - Input value for date construction
	 */
	constructor(input) {
		let value = input;
		if (typeof value === "string") {
			if (value.includes("+")) {
				value = `${value.split("+")[0]}Z`;
			} else if (value.includes("-") && value.lastIndexOf("-") > 10) {
				// Only process timezone offset if - appears after the date part
				const lastDashIndex = value.lastIndexOf("-");
				value = `${value.substring(0, lastDashIndex)}Z`;
			}
		}
		if (typeof value === "number") value = value * 1000;
		super(value);
	}

	/**
	 * The Unix timestamp of the date (in seconds!).
	 *
	 * No need to manually divide by 1000 to get rid of the milliseconds.
	 *
	 * @returns {number} - the Unix timestamp in seconds
	 */
	toUnix() {
		return super.getTime() / 1000;
	}

	/**
	 * override the native getTime method to actually ouput a unix timestamp
	 * (in seconds, not milliseconds!).
	 *
	 * Same as `toUnix`, but protects against accidental errors when using `getTime()`.
	 *
	 * @override
	 * @returns {number} - the Unix timestamp in seconds
	 */
	getTime() {
		return this.toUnix();
	}
}
