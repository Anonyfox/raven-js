/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Finnish holiday definitions - national public holidays.
 *
 * Finland's national holiday system with public holidays observed throughout
 * the Republic. The murder remembers Lutheran traditions, independence
 * struggles, and unique Nordic celebrations.
 */

import { HolidayDefinition } from "../holiday-definition.js";

/**
 * Calculate Finnish Midsummer Day.
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
 * Calculate Finnish All Saints' Day.
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
 * Finnish national holidays observed throughout the Republic.
 * Core holidays recognized by Finnish law and tradition.
 */
const NATIONAL_HOLIDAYS = [
	new HolidayDefinition({
		name: "Uudenvuodenpäivä",
		type: "fixed",
		month: 1,
		day: 1,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Loppiainen",
		type: "fixed",
		month: 1,
		day: 6,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Pitkäperjantai",
		type: "easter_relative",
		offset: -2,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Pääsiäispäivä",
		type: "easter_relative",
		offset: 0,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "2. pääsiäispäivä",
		type: "easter_relative",
		offset: 1,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Vappupäivä",
		type: "fixed",
		month: 5,
		day: 1,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Helatorstai",
		type: "easter_relative",
		offset: 39,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Helluntaipäivä",
		type: "easter_relative",
		offset: 49,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Juhannuspäivä",
		type: "calculated",
		workFree: true,
		calculator: calculateMidsummerDay,
	}),
	new HolidayDefinition({
		name: "Itsenäisyyspäivä",
		type: "fixed",
		month: 12,
		day: 6,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Jouluaatto",
		type: "fixed",
		month: 12,
		day: 24,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Joulupäivä",
		type: "fixed",
		month: 12,
		day: 25,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Tapaninpäivä",
		type: "fixed",
		month: 12,
		day: 26,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Pyhäinpäivä",
		type: "calculated",
		workFree: true,
		calculator: calculateAllSaintsDay,
	}),
];

/**
 * Finnish regional holidays - currently none defined.
 * Finland has a unified national system.
 */
const REGIONAL_HOLIDAYS = {};

// Freeze holiday arrays to prevent modification
Object.freeze(NATIONAL_HOLIDAYS);

/**
 * Finnish holiday definitions with national public holidays.
 *
 * Finland has 14 official public holidays, combining Lutheran traditions
 * with strong independence commemorations. Independence Day (December 6)
 * is particularly important in Finnish culture.
 *
 * @example
 * // Import Finnish holidays
 * import { FI } from '@raven-js/cortex/temporal/countries/FI';
 * const holidays = calculateHolidaysOfYear(FI, { year: 2024 });
 */
export const FI = {
	national: NATIONAL_HOLIDAYS,
	regional: REGIONAL_HOLIDAYS,
};

Object.freeze(FI);
