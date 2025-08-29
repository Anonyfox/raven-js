/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Australian holiday definitions with national and state complexity
 *
 * Australia has complex national/state holiday system:
 * - National public holidays observed throughout Australia
 * - State and territory specific public holidays
 * - Queen's Birthday celebrated on different dates in different states
 * - Labour Day celebrated on different dates by state
 * - Melbourne Cup Day (Victoria only)
 * - Bank holidays and additional regional observances
 */

import { HolidayDefinition } from "../holiday-definition.js";

/**
 * Calculate Queen's Birthday (Second Monday in June) - for most states.
 * @param {number} year - Year to calculate for
 * @returns {Date} Queen's Birthday (June)
 */
function calculateQueensBirthdayJune(year) {
	const jun1 = new Date(Date.UTC(year, 5, 1));
	const dayOfWeek = jun1.getUTCDay();
	const firstMonday = dayOfWeek === 1 ? 1 : ((7 - dayOfWeek + 1) % 7) + 1;
	return new Date(Date.UTC(year, 5, firstMonday + 7)); // Second Monday
}

/**
 * Calculate Queen's Birthday (First Monday in October) - for WA.
 * @param {number} year - Year to calculate for
 * @returns {Date} Queen's Birthday (October)
 */
function calculateQueensBirthdayOctober(year) {
	const oct1 = new Date(Date.UTC(year, 9, 1));
	const dayOfWeek = oct1.getUTCDay();
	const firstMonday = dayOfWeek === 1 ? 1 : ((7 - dayOfWeek + 1) % 7) + 1;
	return new Date(Date.UTC(year, 9, firstMonday));
}

/**
 * Calculate Melbourne Cup Day (First Tuesday in November).
 * @param {number} year - Year to calculate for
 * @returns {Date} Melbourne Cup Day
 */
function calculateMelbourneCup(year) {
	const nov1 = new Date(Date.UTC(year, 10, 1));
	const dayOfWeek = nov1.getUTCDay();
	const firstTuesday = dayOfWeek <= 2 ? 3 - dayOfWeek : 10 - dayOfWeek;
	return new Date(Date.UTC(year, 10, firstTuesday));
}

// National public holidays observed throughout Australia
const NATIONAL_HOLIDAYS = [
	// New Year's Day
	new HolidayDefinition({
		name: "New Year's Day",
		type: "fixed",
		month: 1,
		day: 1,
		workFree: true,
	}),

	// Australia Day
	new HolidayDefinition({
		name: "Australia Day",
		type: "fixed",
		month: 1,
		day: 26,
		workFree: true,
	}),

	// Good Friday
	new HolidayDefinition({
		name: "Good Friday",
		type: "easter_relative",
		offset: -2,
		workFree: true,
	}),

	// Easter Saturday
	new HolidayDefinition({
		name: "Easter Saturday",
		type: "easter_relative",
		offset: -1,
		workFree: true,
	}),

	// Easter Monday
	new HolidayDefinition({
		name: "Easter Monday",
		type: "easter_relative",
		offset: 1,
		workFree: true,
	}),

	// ANZAC Day
	new HolidayDefinition({
		name: "ANZAC Day",
		type: "fixed",
		month: 4,
		day: 25,
		workFree: true,
	}),

	// Queen's Birthday (Second Monday in June - for most states)
	new HolidayDefinition({
		name: "Queen's Birthday",
		type: "calculated",
		workFree: true,
		calculator: (/** @type {number} */ year) =>
			calculateQueensBirthdayJune(year),
	}),

	// Christmas Day
	new HolidayDefinition({
		name: "Christmas Day",
		type: "fixed",
		month: 12,
		day: 25,
		workFree: true,
	}),

	// Boxing Day
	new HolidayDefinition({
		name: "Boxing Day",
		type: "fixed",
		month: 12,
		day: 26,
		workFree: true,
	}),
];

// State and territory specific holidays
const REGIONAL_HOLIDAYS = {
	// Australian Capital Territory
	ACT: [
		new HolidayDefinition({
			name: "Canberra Day",
			type: "calculated", // Second Monday in March
			workFree: true,
			calculator: (/** @type {number} */ year) => {
				const mar1 = new Date(Date.UTC(year, 2, 1));
				const dayOfWeek = mar1.getUTCDay();
				const firstMonday = dayOfWeek === 1 ? 1 : ((7 - dayOfWeek + 1) % 7) + 1;
				return new Date(Date.UTC(year, 2, firstMonday + 7)); // Second Monday
			},
		}),
		new HolidayDefinition({
			name: "Labour Day",
			type: "calculated", // First Monday in October
			workFree: true,
			calculator: (/** @type {number} */ year) => {
				const oct1 = new Date(Date.UTC(year, 9, 1));
				const dayOfWeek = oct1.getUTCDay();
				const firstMonday = dayOfWeek === 1 ? 1 : ((7 - dayOfWeek + 1) % 7) + 1;
				return new Date(Date.UTC(year, 9, firstMonday));
			},
		}),
	],

	// New South Wales
	NSW: [
		new HolidayDefinition({
			name: "Labour Day",
			type: "calculated", // First Monday in October
			workFree: true,
			calculator: (/** @type {number} */ year) => {
				const oct1 = new Date(Date.UTC(year, 9, 1));
				const dayOfWeek = oct1.getUTCDay();
				const firstMonday = dayOfWeek === 1 ? 1 : ((7 - dayOfWeek + 1) % 7) + 1;
				return new Date(Date.UTC(year, 9, firstMonday));
			},
		}),
	],

	// Northern Territory
	NT: [
		new HolidayDefinition({
			name: "May Day",
			type: "calculated", // First Monday in May
			workFree: true,
			calculator: (/** @type {number} */ year) => {
				const may1 = new Date(Date.UTC(year, 4, 1));
				const dayOfWeek = may1.getUTCDay();
				const firstMonday = dayOfWeek === 1 ? 1 : ((7 - dayOfWeek + 1) % 7) + 1;
				return new Date(Date.UTC(year, 4, firstMonday));
			},
		}),
		new HolidayDefinition({
			name: "Picnic Day",
			type: "calculated", // First Monday in August
			workFree: true,
			calculator: (/** @type {number} */ year) => {
				const aug1 = new Date(Date.UTC(year, 7, 1));
				const dayOfWeek = aug1.getUTCDay();
				const firstMonday = dayOfWeek === 1 ? 1 : ((7 - dayOfWeek + 1) % 7) + 1;
				return new Date(Date.UTC(year, 7, firstMonday));
			},
		}),
	],

	// Queensland
	QLD: [
		new HolidayDefinition({
			name: "Labour Day",
			type: "calculated", // First Monday in May
			workFree: true,
			calculator: (/** @type {number} */ year) => {
				const may1 = new Date(Date.UTC(year, 4, 1));
				const dayOfWeek = may1.getUTCDay();
				const firstMonday = dayOfWeek === 1 ? 1 : ((7 - dayOfWeek + 1) % 7) + 1;
				return new Date(Date.UTC(year, 4, firstMonday));
			},
		}),
		new HolidayDefinition({
			name: "RNA Show Day",
			type: "fixed", // Wednesday in August (varies by region)
			month: 8,
			day: 14, // Simplified - varies by show location
			workFree: true,
		}),
	],

	// South Australia
	SA: [
		new HolidayDefinition({
			name: "Adelaide Cup Day",
			type: "calculated", // Second Monday in March
			workFree: true,
			calculator: (/** @type {number} */ year) => {
				const mar1 = new Date(Date.UTC(year, 2, 1));
				const dayOfWeek = mar1.getUTCDay();
				const firstMonday = dayOfWeek === 1 ? 1 : ((7 - dayOfWeek + 1) % 7) + 1;
				return new Date(Date.UTC(year, 2, firstMonday + 7)); // Second Monday
			},
		}),
		new HolidayDefinition({
			name: "Labour Day",
			type: "calculated", // First Monday in October
			workFree: true,
			calculator: (/** @type {number} */ year) => {
				const oct1 = new Date(Date.UTC(year, 9, 1));
				const dayOfWeek = oct1.getUTCDay();
				const firstMonday = dayOfWeek === 1 ? 1 : ((7 - dayOfWeek + 1) % 7) + 1;
				return new Date(Date.UTC(year, 9, firstMonday));
			},
		}),
		new HolidayDefinition({
			name: "Proclamation Day",
			type: "fixed",
			month: 12,
			day: 26, // If Boxing Day falls on weekend, this becomes the holiday
			workFree: true,
		}),
	],

	// Tasmania
	TAS: [
		new HolidayDefinition({
			name: "Eight Hours Day",
			type: "calculated", // Second Monday in March
			workFree: true,
			calculator: (/** @type {number} */ year) => {
				const mar1 = new Date(Date.UTC(year, 2, 1));
				const dayOfWeek = mar1.getUTCDay();
				const firstMonday = dayOfWeek === 1 ? 1 : ((7 - dayOfWeek + 1) % 7) + 1;
				return new Date(Date.UTC(year, 2, firstMonday + 7)); // Second Monday
			},
		}),
	],

	// Victoria
	VIC: [
		new HolidayDefinition({
			name: "Labour Day",
			type: "calculated", // Second Monday in March
			workFree: true,
			calculator: (/** @type {number} */ year) => {
				const mar1 = new Date(Date.UTC(year, 2, 1));
				const dayOfWeek = mar1.getUTCDay();
				const firstMonday = dayOfWeek === 1 ? 1 : ((7 - dayOfWeek + 1) % 7) + 1;
				return new Date(Date.UTC(year, 2, firstMonday + 7)); // Second Monday
			},
		}),
		new HolidayDefinition({
			name: "Melbourne Cup Day",
			type: "calculated",
			workFree: true,
			calculator: (/** @type {number} */ year) => calculateMelbourneCup(year),
		}),
	],

	// Western Australia
	WA: [
		new HolidayDefinition({
			name: "Labour Day",
			type: "calculated", // First Monday in March
			workFree: true,
			calculator: (/** @type {number} */ year) => {
				const mar1 = new Date(Date.UTC(year, 2, 1));
				const dayOfWeek = mar1.getUTCDay();
				const firstMonday = dayOfWeek === 1 ? 1 : ((7 - dayOfWeek + 1) % 7) + 1;
				return new Date(Date.UTC(year, 2, firstMonday));
			},
		}),
		new HolidayDefinition({
			name: "Western Australia Day",
			type: "calculated", // First Monday in June
			workFree: true,
			calculator: (/** @type {number} */ year) => {
				const jun1 = new Date(Date.UTC(year, 5, 1));
				const dayOfWeek = jun1.getUTCDay();
				const firstMonday = dayOfWeek === 1 ? 1 : ((7 - dayOfWeek + 1) % 7) + 1;
				return new Date(Date.UTC(year, 5, firstMonday));
			},
		}),
		new HolidayDefinition({
			name: "Queen's Birthday",
			type: "calculated", // First Monday in October (different from other states)
			workFree: true,
			calculator: (/** @type {number} */ year) =>
				calculateQueensBirthdayOctober(year),
		}),
	],
};

// Freeze holiday arrays to prevent modification
Object.freeze(NATIONAL_HOLIDAYS);
for (const holidays of Object.values(REGIONAL_HOLIDAYS)) {
	Object.freeze(holidays);
}
Object.freeze(REGIONAL_HOLIDAYS);

export const AU = {
	national: NATIONAL_HOLIDAYS,
	regional: REGIONAL_HOLIDAYS,
};

Object.freeze(AU);
