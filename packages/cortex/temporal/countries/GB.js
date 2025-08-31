/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file United Kingdom holiday definitions with regional variations across constituent countries.
 *
 * Different bank holiday patterns for England/Wales, Scotland, and Northern Ireland
 * based on Royal proclamations and Parliamentary acts.
 */

import { HolidayDefinition } from "../holiday-definition.js";

/**
 * Calculate the Summer Bank Holiday (last Monday in August).
 * @param {number} year - Year to calculate for
 * @returns {Date} Date of Summer Bank Holiday
 */
function calculateSummerBankHoliday(year) {
	// Last Monday in August
	const august31 = new Date(Date.UTC(year, 7, 31));
	const dayOfWeek = august31.getUTCDay();
	const mondayOffset =
		dayOfWeek === 1 ? 0 : dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
	return new Date(Date.UTC(year, 7, 31 - mondayOffset));
}

/**
 * Calculate the Spring Bank Holiday (last Monday in May).
 * @param {number} year - Year to calculate for
 * @returns {Date} Date of Spring Bank Holiday
 */
function calculateSpringBankHoliday(year) {
	// Last Monday in May
	const may31 = new Date(Date.UTC(year, 4, 31));
	const dayOfWeek = may31.getUTCDay();
	const mondayOffset =
		dayOfWeek === 1 ? 0 : dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
	return new Date(Date.UTC(year, 4, 31 - mondayOffset));
}

/**
 * UK-wide bank holidays observed across all constituent countries.
 * Core holidays recognized throughout the United Kingdom.
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
		name: "Good Friday",
		type: "easter_relative",
		offset: -2,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Easter Monday",
		type: "easter_relative",
		offset: 1,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Christmas Day",
		type: "fixed",
		month: 12,
		day: 25,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Boxing Day",
		type: "fixed",
		month: 12,
		day: 26,
		workFree: true,
	}),
];

/**
 * Regional bank holidays by constituent country.
 * Different bank holiday arrangements across the UK.
 */
const REGIONAL_HOLIDAYS = {
	// England and Wales
	EW: [
		new HolidayDefinition({
			name: "Early May Bank Holiday",
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
			name: "Spring Bank Holiday",
			type: "calculated",
			workFree: true,
			calculator: calculateSpringBankHoliday,
		}),
		new HolidayDefinition({
			name: "Summer Bank Holiday",
			type: "calculated",
			workFree: true,
			calculator: calculateSummerBankHoliday,
		}),
	],

	// Scotland
	SC: [
		new HolidayDefinition({
			name: "2nd January",
			type: "fixed",
			month: 1,
			day: 2,
			workFree: true,
		}),
		new HolidayDefinition({
			name: "Early May Bank Holiday",
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
			name: "Summer Bank Holiday",
			type: "calculated",
			workFree: true,
			calculator: calculateSummerBankHoliday,
		}),
		new HolidayDefinition({
			name: "St. Andrew's Day",
			type: "fixed",
			month: 11,
			day: 30,
			workFree: true,
		}),
	],

	// Northern Ireland
	NI: [
		new HolidayDefinition({
			name: "St. Patrick's Day",
			type: "fixed",
			month: 3,
			day: 17,
			workFree: true,
		}),
		new HolidayDefinition({
			name: "Early May Bank Holiday",
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
			name: "Spring Bank Holiday",
			type: "calculated",
			workFree: true,
			calculator: calculateSpringBankHoliday,
		}),
		new HolidayDefinition({
			name: "Battle of the Boyne",
			type: "fixed",
			month: 7,
			day: 12,
			workFree: true,
		}),
		new HolidayDefinition({
			name: "Summer Bank Holiday",
			type: "calculated",
			workFree: true,
			calculator: calculateSummerBankHoliday,
		}),
	],
};

// Freeze holiday arrays to prevent modification
Object.freeze(NATIONAL_HOLIDAYS);
for (const holidays of Object.values(REGIONAL_HOLIDAYS)) {
	Object.freeze(holidays);
}

/**
 * United Kingdom holiday definitions with regional variations.
 *
 * The UK has a complex system of bank holidays that differ across England,
 * Wales, Scotland, and Northern Ireland. Scotland replaces Easter Monday
 * with 2nd January, and Northern Ireland has additional holidays.
 *
 * @example
 * // Import UK holidays
 * import { GB } from '@raven-js/cortex/temporal/countries/GB';
 * const holidays = calculateHolidaysOfYear(GB, { year: 2024, region: 'SC' });
 */
export const GB = {
	national: NATIONAL_HOLIDAYS,
	regional: REGIONAL_HOLIDAYS,
};

Object.freeze(GB);
