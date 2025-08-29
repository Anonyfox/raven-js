/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Swedish holiday definitions - national public holidays.
 *
 * Sweden's national holiday system with public holidays observed throughout
 * the Kingdom. The murder remembers Lutheran traditions, midsummer celebrations,
 * and social democratic holiday policies.
 */

import { HolidayDefinition } from "../holiday-definition.js";

/**
 * Calculate Swedish Midsummer Day.
 * Saturday between June 20-26.
 * @param {number} year - Year to calculate for
 * @returns {Date} Date of Midsummer Day
 */
function calculateMidsummerDay(year) {
	// Saturday between June 20-26
	const june20 = new Date(Date.UTC(year, 5, 20));
	const dayOfWeek = june20.getUTCDay();
	const saturdayOffset =
		dayOfWeek === 6 ? 0 : dayOfWeek === 0 ? 6 : 6 - dayOfWeek;
	return new Date(Date.UTC(year, 5, 20 + saturdayOffset));
}

/**
 * Calculate Swedish All Saints' Day.
 * Saturday between October 31 - November 6.
 * @param {number} year - Year to calculate for
 * @returns {Date} Date of All Saints' Day
 */
function calculateAllSaintsDay(year) {
	// Saturday between October 31 - November 6
	const october31 = new Date(Date.UTC(year, 9, 31));
	const dayOfWeek = october31.getUTCDay();
	const saturdayOffset =
		dayOfWeek === 6 ? 0 : dayOfWeek === 0 ? 6 : 6 - dayOfWeek;
	return new Date(Date.UTC(year, 9, 31 + saturdayOffset));
}

/**
 * Swedish national holidays observed throughout the Kingdom.
 * Core holidays recognized by Swedish law and tradition.
 */
const NATIONAL_HOLIDAYS = [
	new HolidayDefinition({
		name: "Nyårsdagen",
		type: "fixed",
		month: 1,
		day: 1,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Trettondedag jul",
		type: "fixed",
		month: 1,
		day: 6,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Långfredagen",
		type: "easter_relative",
		offset: -2,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Påskdagen",
		type: "easter_relative",
		offset: 0,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Annandag påsk",
		type: "easter_relative",
		offset: 1,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Första maj",
		type: "fixed",
		month: 5,
		day: 1,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Kristi himmelsfärds dag",
		type: "easter_relative",
		offset: 39,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Pingstdagen",
		type: "easter_relative",
		offset: 49,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Sveriges nationaldag",
		type: "fixed",
		month: 6,
		day: 6,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Midsommardagen",
		type: "calculated",
		workFree: true,
		calculator: calculateMidsummerDay,
	}),
	new HolidayDefinition({
		name: "Alla helgons dag",
		type: "calculated",
		workFree: true,
		calculator: calculateAllSaintsDay,
	}),
	new HolidayDefinition({
		name: "Juldagen",
		type: "fixed",
		month: 12,
		day: 25,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Annandag jul",
		type: "fixed",
		month: 12,
		day: 26,
		workFree: true,
	}),
];

/**
 * Swedish regional holidays - currently none defined.
 * Sweden has a unified national system.
 */
const REGIONAL_HOLIDAYS = {};

// Freeze holiday arrays to prevent modification
Object.freeze(NATIONAL_HOLIDAYS);

/**
 * Swedish holiday definitions with national public holidays.
 *
 * Sweden has 13 official public holidays, combining Lutheran traditions
 * with unique Swedish celebrations like Midsummer Day. The system reflects
 * Sweden's cultural heritage and modern social democratic values.
 *
 * @example
 * // Import Swedish holidays
 * import { SE } from '@raven-js/cortex/temporal/countries/SE';
 * const holidays = calculateHolidaysOfYear(SE, { year: 2024 });
 */
export const SE = {
	national: NATIONAL_HOLIDAYS,
	regional: REGIONAL_HOLIDAYS,
};

Object.freeze(SE);
