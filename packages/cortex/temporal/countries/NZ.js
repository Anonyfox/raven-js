/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file New Zealand holiday definitions with national and regional complexity
 *
 * New Zealand has complex national/regional anniversary system:
 * - National public holidays observed throughout New Zealand
 * - Provincial anniversary days (each region has different dates)
 * - Queen's Birthday, Labour Day with specific Monday rules
 * - Waitangi Day and ANZAC Day (uniquely New Zealand/Australian)
 * - Complex anniversary day calculations (closest Monday to historic dates)
 */

import { HolidayDefinition } from "../holiday-definition.js";

/**
 * Calculate Queen's Birthday (First Monday in June).
 * @param {number} year - Year to calculate for
 * @returns {Date} Queen's Birthday
 */
function calculateQueensBirthday(year) {
	const jun1 = new Date(Date.UTC(year, 5, 1));
	const dayOfWeek = jun1.getUTCDay();
	const firstMonday = dayOfWeek === 1 ? 1 : ((7 - dayOfWeek + 1) % 7) + 1;
	return new Date(Date.UTC(year, 5, firstMonday));
}

/**
 * Calculate Labour Day (Fourth Monday in October).
 * @param {number} year - Year to calculate for
 * @returns {Date} Labour Day
 */
function calculateLabourDay(year) {
	const oct1 = new Date(Date.UTC(year, 9, 1));
	const dayOfWeek = oct1.getUTCDay();
	const firstMonday = dayOfWeek === 1 ? 1 : ((7 - dayOfWeek + 1) % 7) + 1;
	return new Date(Date.UTC(year, 9, firstMonday + 21)); // Fourth Monday
}

/**
 * Calculate Monday closest to a given date.
 * @param {number} year - Year to calculate for
 * @param {number} month - Month (0-11)
 * @param {number} day - Day of month
 * @returns {Date} Monday closest to the given date
 */
function mondayClosestTo(year, month, day) {
	const targetDate = new Date(Date.UTC(year, month, day));
	const dayOfWeek = targetDate.getUTCDay();

	// Calculate offset to nearest Monday
	let offset;
	if (dayOfWeek === 0) {
		// Sunday
		offset = 1; // Next day (Monday)
	} else if (dayOfWeek === 1) {
		// Monday
		offset = 0; // Same day
	} else if (dayOfWeek <= 4) {
		// Tuesday-Thursday
		offset = 1 - dayOfWeek; // Previous Monday
	} else {
		// Friday-Saturday
		offset = 8 - dayOfWeek; // Next Monday
	}

	return new Date(Date.UTC(year, month, day + offset));
}

// National public holidays observed throughout New Zealand
const NATIONAL_HOLIDAYS = [
	// New Year's Day
	new HolidayDefinition({
		name: "New Year's Day",
		type: "fixed",
		month: 1,
		day: 1,
		workFree: true,
	}),

	// Day after New Year's Day
	new HolidayDefinition({
		name: "Day after New Year's Day",
		type: "fixed",
		month: 1,
		day: 2,
		workFree: true,
	}),

	// Waitangi Day
	new HolidayDefinition({
		name: "Waitangi Day",
		type: "fixed",
		month: 2,
		day: 6,
		workFree: true,
	}),

	// Good Friday
	new HolidayDefinition({
		name: "Good Friday",
		type: "easter_relative",
		offset: -2,
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

	// Queen's Birthday (First Monday in June)
	new HolidayDefinition({
		name: "Queen's Birthday",
		type: "calculated",
		workFree: true,
		calculator: (/** @type {number} */ year) => calculateQueensBirthday(year),
	}),

	// Matariki (Mid-winter New Year - became national holiday in 2022)
	new HolidayDefinition({
		name: "Matariki",
		type: "calculated", // Varies based on lunar calendar and astronomical calculation
		workFree: true,
		calculator: (/** @type {number} */ year) => {
			// Simplified - actual date requires astronomical calculation
			// Usually late June/early July
			return new Date(Date.UTC(year, 5, 24)); // June 24 (simplified)
		},
	}),

	// Labour Day (Fourth Monday in October)
	new HolidayDefinition({
		name: "Labour Day",
		type: "calculated",
		workFree: true,
		calculator: (/** @type {number} */ year) => calculateLabourDay(year),
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

// Provincial anniversary days
const REGIONAL_HOLIDAYS = {
	// Auckland
	AUK: [
		new HolidayDefinition({
			name: "Auckland Anniversary Day",
			type: "calculated", // Monday closest to January 29
			workFree: true,
			calculator: (/** @type {number} */ year) => mondayClosestTo(year, 0, 29),
		}),
	],

	// Wellington
	WGN: [
		new HolidayDefinition({
			name: "Wellington Anniversary Day",
			type: "calculated", // Monday closest to January 22
			workFree: true,
			calculator: (/** @type {number} */ year) => mondayClosestTo(year, 0, 22),
		}),
	],

	// Canterbury
	CAN: [
		new HolidayDefinition({
			name: "Canterbury Anniversary Day",
			type: "calculated", // Second Friday after first Tuesday in November
			workFree: true,
			calculator: (/** @type {number} */ year) => {
				const nov1 = new Date(Date.UTC(year, 10, 1));
				const dayOfWeek = nov1.getUTCDay();
				// Find first Tuesday
				const firstTuesday = dayOfWeek <= 2 ? 3 - dayOfWeek : 10 - dayOfWeek;
				// Second Friday after = first Tuesday + 10 days
				return new Date(Date.UTC(year, 10, firstTuesday + 10));
			},
		}),
	],

	// Otago
	OTA: [
		new HolidayDefinition({
			name: "Otago Anniversary Day",
			type: "calculated", // Monday closest to March 23
			workFree: true,
			calculator: (/** @type {number} */ year) => mondayClosestTo(year, 2, 23),
		}),
	],

	// Southland
	STL: [
		new HolidayDefinition({
			name: "Southland Anniversary Day",
			type: "easter_relative", // Easter Tuesday
			offset: 2,
			workFree: true,
		}),
	],

	// Taranaki
	TKI: [
		new HolidayDefinition({
			name: "Taranaki Anniversary Day",
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

	// Hawke's Bay
	HKB: [
		new HolidayDefinition({
			name: "Hawke's Bay Anniversary Day",
			type: "calculated", // Friday before Labour Day
			workFree: true,
			calculator: (/** @type {number} */ year) => {
				const labourDay = calculateLabourDay(year);
				return new Date(labourDay.getTime() - 3 * 24 * 60 * 60 * 1000); // Friday before
			},
		}),
	],

	// Marlborough
	MBH: [
		new HolidayDefinition({
			name: "Marlborough Anniversary Day",
			type: "calculated", // First Monday after Labour Day
			workFree: true,
			calculator: (/** @type {number} */ year) => {
				const labourDay = calculateLabourDay(year);
				return new Date(labourDay.getTime() + 7 * 24 * 60 * 60 * 1000); // Monday after
			},
		}),
	],

	// Nelson
	NSN: [
		new HolidayDefinition({
			name: "Nelson Anniversary Day",
			type: "calculated", // Monday closest to February 1
			workFree: true,
			calculator: (/** @type {number} */ year) => mondayClosestTo(year, 1, 1),
		}),
	],

	// West Coast
	WTC: [
		new HolidayDefinition({
			name: "Westland Anniversary Day",
			type: "calculated", // Monday closest to December 1
			workFree: true,
			calculator: (/** @type {number} */ year) => mondayClosestTo(year, 11, 1),
		}),
	],

	// Chatham Islands
	CIT: [
		new HolidayDefinition({
			name: "Chatham Islands Anniversary Day",
			type: "calculated", // Monday closest to November 30
			workFree: true,
			calculator: (/** @type {number} */ year) => mondayClosestTo(year, 10, 30),
		}),
	],
};

// Freeze holiday arrays to prevent modification
Object.freeze(NATIONAL_HOLIDAYS);
for (const holidays of Object.values(REGIONAL_HOLIDAYS)) {
	Object.freeze(holidays);
}
Object.freeze(REGIONAL_HOLIDAYS);

export const NZ = {
	national: NATIONAL_HOLIDAYS,
	regional: REGIONAL_HOLIDAYS,
};

Object.freeze(NZ);
