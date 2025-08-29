/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file United States holiday definitions with federal and state complexity
 *
 * United States has complex federal/state holiday system:
 * - Federal holidays observed by federal government and most states
 * - State-specific holidays and observances
 * - Different observance rules (Monday holidays, federal vs state)
 * - Historical and cultural variations by region
 * - Special rules for federal employees vs private sector
 */

import { HolidayDefinition } from "../holiday-definition.js";

/**
 * Calculate Memorial Day (Last Monday in May).
 * @param {number} year - Year to calculate for
 * @returns {Date} Memorial Day
 */
function calculateMemorialDay(year) {
	// Last Monday in May
	const may31 = new Date(Date.UTC(year, 4, 31));
	const dayOfWeek = may31.getUTCDay();
	const lastMonday = 31 - ((dayOfWeek + 6) % 7);
	return new Date(Date.UTC(year, 4, lastMonday));
}

/**
 * Calculate Labor Day (First Monday in September).
 * @param {number} year - Year to calculate for
 * @returns {Date} Labor Day
 */
function calculateLaborDay(year) {
	const sep1 = new Date(Date.UTC(year, 8, 1));
	const dayOfWeek = sep1.getUTCDay();
	const firstMonday = dayOfWeek === 1 ? 1 : ((7 - dayOfWeek + 1) % 7) + 1;
	return new Date(Date.UTC(year, 8, firstMonday));
}

/**
 * Calculate Columbus Day (Second Monday in October).
 * @param {number} year - Year to calculate for
 * @returns {Date} Columbus Day
 */
function calculateColumbusDay(year) {
	const oct1 = new Date(Date.UTC(year, 9, 1));
	const dayOfWeek = oct1.getUTCDay();
	const firstMonday = dayOfWeek === 1 ? 1 : ((7 - dayOfWeek + 1) % 7) + 1;
	return new Date(Date.UTC(year, 9, firstMonday + 7)); // Second Monday
}

/**
 * Calculate Thanksgiving Day (Fourth Thursday in November).
 * @param {number} year - Year to calculate for
 * @returns {Date} Thanksgiving Day
 */
function calculateThanksgiving(year) {
	const nov1 = new Date(Date.UTC(year, 10, 1));
	const dayOfWeek = nov1.getUTCDay();
	// Find first Thursday
	const firstThursday = dayOfWeek <= 4 ? 5 - dayOfWeek : 12 - dayOfWeek;
	// Fourth Thursday = first Thursday + 21 days
	return new Date(Date.UTC(year, 10, firstThursday + 21));
}

/**
 * Calculate Martin Luther King Jr. Day (Third Monday in January).
 * @param {number} year - Year to calculate for
 * @returns {Date} MLK Day
 */
function calculateMLKDay(year) {
	const jan1 = new Date(Date.UTC(year, 0, 1));
	const dayOfWeek = jan1.getUTCDay();
	const firstMonday = dayOfWeek === 1 ? 1 : ((7 - dayOfWeek + 1) % 7) + 1;
	return new Date(Date.UTC(year, 0, firstMonday + 14)); // Third Monday
}

/**
 * Calculate Presidents' Day (Third Monday in February).
 * @param {number} year - Year to calculate for
 * @returns {Date} Presidents' Day
 */
function calculatePresidentsDay(year) {
	const feb1 = new Date(Date.UTC(year, 1, 1));
	const dayOfWeek = feb1.getUTCDay();
	const firstMonday = dayOfWeek === 1 ? 1 : ((7 - dayOfWeek + 1) % 7) + 1;
	return new Date(Date.UTC(year, 1, firstMonday + 14)); // Third Monday
}

// Federal holidays observed throughout the United States
const NATIONAL_HOLIDAYS = [
	// New Year's Day
	new HolidayDefinition({
		name: "New Year's Day",
		type: "fixed",
		month: 1,
		day: 1,
		workFree: true,
	}),

	// Martin Luther King Jr. Day (Third Monday in January)
	new HolidayDefinition({
		name: "Martin Luther King Jr. Day",
		type: "calculated",
		workFree: true,
		calculator: (/** @type {number} */ year) => calculateMLKDay(year),
	}),

	// Presidents' Day (Third Monday in February)
	new HolidayDefinition({
		name: "Presidents' Day",
		type: "calculated",
		workFree: true,
		calculator: (/** @type {number} */ year) => calculatePresidentsDay(year),
	}),

	// Memorial Day (Last Monday in May)
	new HolidayDefinition({
		name: "Memorial Day",
		type: "calculated",
		workFree: true,
		calculator: (/** @type {number} */ year) => calculateMemorialDay(year),
	}),

	// Juneteenth National Independence Day (June 19)
	new HolidayDefinition({
		name: "Juneteenth",
		type: "fixed",
		month: 6,
		day: 19,
		workFree: true,
	}),

	// Independence Day (July 4)
	new HolidayDefinition({
		name: "Independence Day",
		type: "fixed",
		month: 7,
		day: 4,
		workFree: true,
	}),

	// Labor Day (First Monday in September)
	new HolidayDefinition({
		name: "Labor Day",
		type: "calculated",
		workFree: true,
		calculator: (/** @type {number} */ year) => calculateLaborDay(year),
	}),

	// Columbus Day (Second Monday in October)
	new HolidayDefinition({
		name: "Columbus Day",
		type: "calculated",
		workFree: true,
		calculator: (/** @type {number} */ year) => calculateColumbusDay(year),
	}),

	// Veterans Day (November 11)
	new HolidayDefinition({
		name: "Veterans Day",
		type: "fixed",
		month: 11,
		day: 11,
		workFree: true,
	}),

	// Thanksgiving Day (Fourth Thursday in November)
	new HolidayDefinition({
		name: "Thanksgiving Day",
		type: "calculated",
		workFree: true,
		calculator: (/** @type {number} */ year) => calculateThanksgiving(year),
	}),

	// Christmas Day (December 25)
	new HolidayDefinition({
		name: "Christmas Day",
		type: "fixed",
		month: 12,
		day: 25,
		workFree: true,
	}),
];

// State-specific holidays and observances
const REGIONAL_HOLIDAYS = {
	// Alabama
	AL: [
		new HolidayDefinition({
			name: "Robert E. Lee/Martin Luther King Jr. Birthday",
			type: "calculated",
			workFree: true,
			calculator: (/** @type {number} */ year) => calculateMLKDay(year),
		}),
		new HolidayDefinition({
			name: "Confederate Memorial Day",
			type: "calculated", // Fourth Monday in April
			workFree: true,
			calculator: (/** @type {number} */ year) => {
				const apr1 = new Date(Date.UTC(year, 3, 1));
				const dayOfWeek = apr1.getUTCDay();
				const firstMonday = dayOfWeek === 1 ? 1 : ((7 - dayOfWeek + 1) % 7) + 1;
				return new Date(Date.UTC(year, 3, firstMonday + 21)); // Fourth Monday
			},
		}),
	],

	// Alaska
	AK: [
		new HolidayDefinition({
			name: "Alaska Day",
			type: "fixed",
			month: 10,
			day: 18,
			workFree: true,
		}),
		new HolidayDefinition({
			name: "Seward's Day",
			type: "calculated", // Last Monday in March
			workFree: true,
			calculator: (/** @type {number} */ year) => {
				const mar31 = new Date(Date.UTC(year, 2, 31));
				const dayOfWeek = mar31.getUTCDay();
				const lastMonday = 31 - ((dayOfWeek + 6) % 7);
				return new Date(Date.UTC(year, 2, lastMonday));
			},
		}),
	],

	// California
	CA: [
		new HolidayDefinition({
			name: "César Chávez Day",
			type: "fixed",
			month: 3,
			day: 31,
			workFree: false, // Not a paid holiday for most
		}),
		new HolidayDefinition({
			name: "Good Friday",
			type: "easter_relative",
			offset: -2,
			workFree: false, // State holiday but not paid
		}),
	],

	// Florida
	FL: [
		new HolidayDefinition({
			name: "Susan B. Anthony Day",
			type: "fixed",
			month: 2,
			day: 15,
			workFree: false,
		}),
		new HolidayDefinition({
			name: "Pascua Florida Day",
			type: "calculated", // Second Sunday in April
			workFree: false,
			calculator: (/** @type {number} */ year) => {
				const apr1 = new Date(Date.UTC(year, 3, 1));
				const dayOfWeek = apr1.getUTCDay();
				const firstSunday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
				return new Date(Date.UTC(year, 3, firstSunday + 7)); // Second Sunday
			},
		}),
	],

	// Hawaii
	HI: [
		new HolidayDefinition({
			name: "Prince Jonah Kuhio Kalanianaole Day",
			type: "fixed",
			month: 3,
			day: 26,
			workFree: true,
		}),
		new HolidayDefinition({
			name: "Kamehameha Day",
			type: "fixed",
			month: 6,
			day: 11,
			workFree: true,
		}),
		new HolidayDefinition({
			name: "Statehood Day",
			type: "calculated", // Third Friday in August
			workFree: true,
			calculator: (/** @type {number} */ year) => {
				const aug1 = new Date(Date.UTC(year, 7, 1));
				const dayOfWeek = aug1.getUTCDay();
				const firstFriday = dayOfWeek <= 5 ? 6 - dayOfWeek : 13 - dayOfWeek;
				return new Date(Date.UTC(year, 7, firstFriday + 14)); // Third Friday
			},
		}),
	],

	// Texas
	TX: [
		new HolidayDefinition({
			name: "Texas Independence Day",
			type: "fixed",
			month: 3,
			day: 2,
			workFree: false,
		}),
		new HolidayDefinition({
			name: "San Jacinto Day",
			type: "fixed",
			month: 4,
			day: 21,
			workFree: false,
		}),
		new HolidayDefinition({
			name: "Lyndon Baines Johnson Day",
			type: "fixed",
			month: 8,
			day: 27,
			workFree: false,
		}),
	],

	// New York
	NY: [
		new HolidayDefinition({
			name: "Lincoln's Birthday",
			type: "fixed",
			month: 2,
			day: 12,
			workFree: true,
		}),
		new HolidayDefinition({
			name: "Election Day",
			type: "calculated", // First Tuesday after first Monday in November
			workFree: false,
			calculator: (/** @type {number} */ year) => {
				const nov1 = new Date(Date.UTC(year, 10, 1));
				const dayOfWeek = nov1.getUTCDay();
				const firstMonday = dayOfWeek === 1 ? 1 : ((7 - dayOfWeek + 1) % 7) + 1;
				return new Date(Date.UTC(year, 10, firstMonday + 1)); // Tuesday after first Monday
			},
		}),
	],

	// Massachusetts
	MA: [
		new HolidayDefinition({
			name: "Patriots' Day",
			type: "calculated", // Third Monday in April
			workFree: true,
			calculator: (/** @type {number} */ year) => {
				const apr1 = new Date(Date.UTC(year, 3, 1));
				const dayOfWeek = apr1.getUTCDay();
				const firstMonday = dayOfWeek === 1 ? 1 : ((7 - dayOfWeek + 1) % 7) + 1;
				return new Date(Date.UTC(year, 3, firstMonday + 14)); // Third Monday
			},
		}),
		new HolidayDefinition({
			name: "Bunker Hill Day",
			type: "fixed",
			month: 6,
			day: 17,
			workFree: true,
		}),
	],

	// Vermont
	VT: [
		new HolidayDefinition({
			name: "Town Meeting Day",
			type: "calculated", // First Tuesday in March
			workFree: true,
			calculator: (/** @type {number} */ year) => {
				const mar1 = new Date(Date.UTC(year, 2, 1));
				const dayOfWeek = mar1.getUTCDay();
				const firstTuesday = dayOfWeek <= 2 ? 3 - dayOfWeek : 10 - dayOfWeek;
				return new Date(Date.UTC(year, 2, firstTuesday));
			},
		}),
	],
};

// Freeze holiday arrays to prevent modification
Object.freeze(NATIONAL_HOLIDAYS);
for (const holidays of Object.values(REGIONAL_HOLIDAYS)) {
	Object.freeze(holidays);
}
Object.freeze(REGIONAL_HOLIDAYS);

export const US = {
	national: NATIONAL_HOLIDAYS,
	regional: REGIONAL_HOLIDAYS,
};

Object.freeze(US);
