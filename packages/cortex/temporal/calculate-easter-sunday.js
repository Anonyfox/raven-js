/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Easter Sunday calculation using the Meeus/Jones/Butcher algorithm
 *
 * Implements the Anonymous Gregorian algorithm for determining Easter Sunday dates.
 * This algorithm represents centuries of ecclesiastical astronomy compressed into
 * surgical mathematical precision - exactly the kind of institutional memory
 * ravens preserve across generations.
 *
 * Historical context: Easter calculation has been a critical problem since the
 * Council of Nicaea (325 AD). The algorithm encodes complex lunar-solar calendar
 * relationships into pure integer arithmetic, avoiding floating-point errors
 * that could accumulate over centuries.
 */

/**
 * Calculate the date of Easter Sunday for a given year using the
 * Meeus/Jones/Butcher algorithm (Anonymous Gregorian algorithm).
 *
 * This algorithm is astronomically accurate for the Gregorian calendar from 1583 onwards.
 * It encodes the complex relationship between lunar months and solar years that
 * determines Easter's date as "the first Sunday after the first full moon occurring
 * on or after the spring equinox."
 *
 * ALGORITHM BREAKDOWN:
 * The calculation involves several astronomical cycles:
 * - Metonic cycle (19 years): lunar months nearly repeat after 19 solar years
 * - Solar cycle (28 years): day-of-week pattern repeats every 28 years
 * - Century corrections: account for Gregorian calendar leap year rules
 *
 * MATHEMATICAL PRECISION:
 * - Uses only integer arithmetic to avoid floating-point drift
 * - Handles century boundary corrections automatically
 * - Accounts for Gregorian leap year suppression (years divisible by 100 but not 400)
 *
 * PERFORMANCE CHARACTERISTICS:
 * - O(1) constant time complexity
 * - Zero dependencies on date libraries
 * - Deterministic output for any valid input year
 *
 * @param {number} year - Year for which to calculate Easter (must be >= 1583)
 * @returns {Date} Date object representing Easter Sunday at midnight UTC
 * @throws {Error} If year is before 1583 (pre-Gregorian calendar)
 *
 * @example
 * // Calculate Easter for recent years
 * console.log(calculateEasterSunday(2024)); // 2024-03-31 (March 31, 2024)
 * console.log(calculateEasterSunday(2025)); // 2025-04-20 (April 20, 2025)
 *
 * @example
 * // Historical Easter dates
 * console.log(calculateEasterSunday(1900)); // 1900-04-15 (April 15, 1900)
 * console.log(calculateEasterSunday(2000)); // 2000-04-23 (April 23, 2000)
 *
 * @example
 * // Extract readable components
 * const easter = calculateEasterSunday(2024);
 * const month = easter.getUTCMonth() + 1; // 3 (March)
 * const day = easter.getUTCDate();        // 31
 * console.log(`Easter 2024: ${month}/${day}`); // "Easter 2024: 3/31"
 */
export function calculateEasterSunday(year) {
	// Input validation: algorithm only valid for Gregorian calendar
	if (!Number.isInteger(year)) {
		throw new Error("Year must be an integer");
	}
	if (year < 1583) {
		throw new Error(
			"Year must be >= 1583 (Gregorian calendar adoption). " +
				"Julian calendar Easter calculation requires different algorithm.",
		);
	}

	// STEP 1: Golden Number (position in 19-year Metonic cycle)
	// The Metonic cycle: 19 solar years ≈ 235 lunar months
	// This gives us the lunar phase pattern repetition
	const a = year % 19;

	// STEP 2: Century calculations
	// Extract century and year-within-century for leap year corrections
	const b = Math.floor(year / 100); // Century number
	const c = year % 100; // Year within century

	// STEP 3: Century leap year correction
	// Gregorian calendar: years divisible by 100 are not leap years,
	// unless also divisible by 400
	const d = Math.floor(b / 4); // Number of 400-year cycles in centuries
	const e = b % 4; // Remaining centuries after 400-year cycles

	// STEP 4: Moon orbit correction
	// Accounts for the fact that 19 years is not exactly 235 lunar months
	// This correction accumulates over centuries
	const f = Math.floor((b + 8) / 25);
	const g = Math.floor((b - f + 1) / 3);

	// STEP 5: Calculate ecclesiastical full moon
	// This determines when the "Paschal full moon" (Easter full moon) occurs
	// The calculation encodes centuries of lunar observation into pure arithmetic
	const h = (19 * a + b - d - g + 15) % 30;

	// STEP 6: Year-within-century leap year pattern
	// Calculate leap year adjustments for the specific year
	const i = Math.floor(c / 4); // Leap years within the century
	const k = c % 4; // Years since last leap year

	// STEP 7: Calculate the day of week for Easter
	// This determines which Sunday follows the Paschal full moon
	const l = (32 + 2 * e + 2 * i - h - k) % 7;

	// STEP 8: Special correction for late Easter dates
	// Prevents Easter from falling too late in April
	// This handles edge cases in the lunar-solar calendar alignment
	const m = Math.floor((a + 11 * h + 22 * l) / 451);

	// STEP 9: Final month and day calculation
	// Convert the accumulated corrections into actual calendar month/day
	const month = Math.floor((h + l - 7 * m + 114) / 31);
	const day = ((h + l - 7 * m + 114) % 31) + 1;

	// STEP 10: Create and return the Date object
	// Easter Sunday at midnight UTC
	return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
}
