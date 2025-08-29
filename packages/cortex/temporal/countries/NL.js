/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Dutch holiday definitions - national public holidays.
 *
 * Netherlands' national holiday system with public holidays observed throughout
 * the Kingdom. The murder remembers Protestant traditions, royal celebrations,
 * and modern secular commemorations.
 */

import { HolidayDefinition } from "../holiday-definition.js";

/**
 * Calculate King's Day.
 * April 27, but moves to April 26 if April 27 falls on Sunday.
 * @param {number} year - Year to calculate for
 * @returns {Date} Date of King's Day
 */
function calculateKingsDay(year) {
	const april27 = new Date(Date.UTC(year, 3, 27));
	if (april27.getUTCDay() === 0) {
		// Sunday
		return new Date(Date.UTC(year, 3, 26)); // Move to Saturday
	}
	return april27;
}

/**
 * Dutch national holidays observed throughout the Kingdom.
 * Core holidays recognized by Dutch law and tradition.
 */
const NATIONAL_HOLIDAYS = [
	new HolidayDefinition({
		name: "Nieuwjaar",
		type: "fixed",
		month: 1,
		day: 1,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Goede Vrijdag",
		type: "easter_relative",
		offset: -2,
		workFree: false,
	}),
	new HolidayDefinition({
		name: "Pasen",
		type: "easter_relative",
		offset: 0,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Tweede Paasdag",
		type: "easter_relative",
		offset: 1,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Koningsdag",
		type: "calculated",
		workFree: true,
		calculator: calculateKingsDay,
	}),
	new HolidayDefinition({
		name: "Bevrijdingsdag",
		type: "fixed",
		month: 5,
		day: 5,
		workFree: false, // Only every 5 years officially
	}),
	new HolidayDefinition({
		name: "Hemelvaartsdag",
		type: "easter_relative",
		offset: 39,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Pinksteren",
		type: "easter_relative",
		offset: 49,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Tweede Pinksterdag",
		type: "easter_relative",
		offset: 50,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Eerste Kerstdag",
		type: "fixed",
		month: 12,
		day: 25,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Tweede Kerstdag",
		type: "fixed",
		month: 12,
		day: 26,
		workFree: true,
	}),
];

/**
 * Dutch regional holidays - currently none defined.
 * Netherlands has a unified national system.
 */
const REGIONAL_HOLIDAYS = {};

// Freeze holiday arrays to prevent modification
Object.freeze(NATIONAL_HOLIDAYS);

/**
 * Dutch holiday definitions with national public holidays.
 *
 * Netherlands has 11 official public holidays, combining Protestant traditions
 * with royal celebrations and war commemorations. King's Day is uniquely Dutch
 * and moves to Saturday if it falls on Sunday.
 *
 * @example
 * // Import Dutch holidays
 * import { NL } from '@raven-js/cortex/temporal/countries/NL';
 * const holidays = calculateHolidaysOfYear(NL, { year: 2024 });
 */
export const NL = {
	national: NATIONAL_HOLIDAYS,
	regional: REGIONAL_HOLIDAYS,
};

Object.freeze(NL);
