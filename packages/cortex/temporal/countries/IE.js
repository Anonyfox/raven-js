/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Irish holiday definitions - national public holidays.
 *
 * Ireland's public holiday system with national holidays observed throughout
 * the Republic. The murder remembers the Celtic traditions merged with
 * Christian and modern Republican holidays.
 */

import { HolidayDefinition } from "../holiday-definition.js";

/**
 * Irish national public holidays observed throughout the Republic.
 * Core holidays recognized by Irish law and tradition.
 */
const NATIONAL_HOLIDAYS = [
	new HolidayDefinition({
		name: "New Year's Day",
		type: "fixed",
		month: 1,
		day: 1,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "St. Patrick's Day",
		type: "fixed",
		month: 3,
		day: 17,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Easter Monday",
		type: "easter_relative",
		offset: 1,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "May Day",
		type: "calculated",
		workFree: true,
		calculator: (/** @type {number} */ year) => {
			// First Monday in May
			const may1 = new Date(Date.UTC(year, 4, 1));
			const dayOfWeek = may1.getUTCDay();
			const mondayOffset =
				dayOfWeek === 0 ? 1 : dayOfWeek === 1 ? 0 : 8 - dayOfWeek;
			return new Date(Date.UTC(year, 4, 1 + mondayOffset));
		},
	}),
	new HolidayDefinition({
		name: "June Holiday",
		type: "calculated",
		workFree: true,
		calculator: (/** @type {number} */ year) => {
			// First Monday in June
			const june1 = new Date(Date.UTC(year, 5, 1));
			const dayOfWeek = june1.getUTCDay();
			const mondayOffset =
				dayOfWeek === 0 ? 1 : dayOfWeek === 1 ? 0 : 8 - dayOfWeek;
			return new Date(Date.UTC(year, 5, 1 + mondayOffset));
		},
	}),
	new HolidayDefinition({
		name: "August Holiday",
		type: "calculated",
		workFree: true,
		calculator: (/** @type {number} */ year) => {
			// First Monday in August
			const august1 = new Date(Date.UTC(year, 7, 1));
			const dayOfWeek = august1.getUTCDay();
			const mondayOffset =
				dayOfWeek === 0 ? 1 : dayOfWeek === 1 ? 0 : 8 - dayOfWeek;
			return new Date(Date.UTC(year, 7, 1 + mondayOffset));
		},
	}),
	new HolidayDefinition({
		name: "October Holiday",
		type: "calculated",
		workFree: true,
		calculator: (/** @type {number} */ year) => {
			// Last Monday in October
			const october31 = new Date(Date.UTC(year, 9, 31));
			const dayOfWeek = october31.getUTCDay();
			const mondayOffset =
				dayOfWeek === 1 ? 0 : dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
			return new Date(Date.UTC(year, 9, 31 - mondayOffset));
		},
	}),
	new HolidayDefinition({
		name: "Christmas Day",
		type: "fixed",
		month: 12,
		day: 25,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "St. Stephen's Day",
		type: "fixed",
		month: 12,
		day: 26,
		workFree: true,
	}),
];

/**
 * Irish regional holidays - currently none defined.
 * Ireland has a unified national system with no regional variations.
 */
const REGIONAL_HOLIDAYS = {};

// Freeze holiday arrays to prevent modification
Object.freeze(NATIONAL_HOLIDAYS);

/**
 * Irish holiday definitions with national public holidays.
 *
 * Ireland has 9 official public holidays, with a simple unified system
 * across the Republic. The system combines Christian traditions with
 * Irish national identity and modern bank holiday principles.
 *
 * @example
 * // Import Irish holidays
 * import { IE } from '@raven-js/cortex/temporal/countries/IE';
 * const holidays = calculateHolidaysOfYear(IE, { year: 2024 });
 */
export const IE = {
	national: NATIONAL_HOLIDAYS,
	regional: REGIONAL_HOLIDAYS,
};

Object.freeze(IE);
