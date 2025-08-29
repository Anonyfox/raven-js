/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Singaporean holiday definitions with multicultural system
 *
 * Singapore has one of the world's most multicultural holiday systems:
 * - Chinese holidays (Chinese New Year, Vesak Day)
 * - Islamic holidays (Eid al-Fitr, Eid al-Adha)
 * - Hindu holidays (Deepavali)
 * - Christian holidays (Good Friday, Christmas)
 * - National civic holidays
 * - No regional variations (city-state)
 */

import { HolidayDefinition } from "../holiday-definition.js";

/**
 * Calculate Chinese New Year.
 * @param {number} year - Year to calculate for
 * @returns {Date} Chinese New Year date
 */
function calculateChineseNewYear(year) {
	// Same as Chinese calendar
	/** @type {Record<number, Date>} */
	const chineseNewYearDates = {
		2024: new Date(Date.UTC(year, 1, 10)), // Feb 10
		2025: new Date(Date.UTC(year, 0, 29)), // Jan 29
		2026: new Date(Date.UTC(year, 1, 17)), // Feb 17
		2027: new Date(Date.UTC(year, 1, 6)), // Feb 6
		2028: new Date(Date.UTC(year, 0, 26)), // Jan 26
		2029: new Date(Date.UTC(year, 1, 13)), // Feb 13
		2030: new Date(Date.UTC(year, 1, 3)), // Feb 3
	};

	return chineseNewYearDates[year] || new Date(Date.UTC(year, 1, 10)); // fallback
}

/**
 * Calculate Eid al-Fitr (Islamic calendar).
 * @param {number} year - Year to calculate for
 * @returns {Date} Eid al-Fitr date
 */
function calculateEidAlFitr(year) {
	// Simplified Eid al-Fitr dates
	/** @type {Record<number, Date>} */
	const eidDates = {
		2024: new Date(Date.UTC(year, 3, 10)), // Apr 10
		2025: new Date(Date.UTC(year, 2, 30)), // Mar 30
		2026: new Date(Date.UTC(year, 2, 20)), // Mar 20
		2027: new Date(Date.UTC(year, 2, 9)), // Mar 9
		2028: new Date(Date.UTC(year, 1, 26)), // Feb 26
		2029: new Date(Date.UTC(year, 1, 15)), // Feb 15
		2030: new Date(Date.UTC(year, 1, 5)), // Feb 5
	};

	return eidDates[year] || new Date(Date.UTC(year, 3, 10)); // fallback
}

/**
 * Calculate Eid al-Adha (Islamic calendar).
 * @param {number} year - Year to calculate for
 * @returns {Date} Eid al-Adha date
 */
function calculateEidAlAdha(year) {
	// About 70 days after Eid al-Fitr
	const eidAlFitr = calculateEidAlFitr(year);
	return new Date(eidAlFitr.getTime() + 70 * 24 * 60 * 60 * 1000);
}

/**
 * Calculate Deepavali (Hindu Festival of Lights).
 * @param {number} year - Year to calculate for
 * @returns {Date} Deepavali date
 */
function calculateDeepavali(year) {
	// Same as Indian Diwali
	/** @type {Record<number, Date>} */
	const deepavaliDates = {
		2024: new Date(Date.UTC(year, 10, 1)), // Nov 1
		2025: new Date(Date.UTC(year, 9, 20)), // Oct 20
		2026: new Date(Date.UTC(year, 10, 8)), // Nov 8
		2027: new Date(Date.UTC(year, 9, 29)), // Oct 29
		2028: new Date(Date.UTC(year, 10, 17)), // Nov 17
		2029: new Date(Date.UTC(year, 10, 5)), // Nov 5
		2030: new Date(Date.UTC(year, 9, 26)), // Oct 26
	};

	return deepavaliDates[year] || new Date(Date.UTC(year, 10, 1)); // fallback
}

// National holidays observed throughout Singapore
const NATIONAL_HOLIDAYS = [
	// New Year's Day
	new HolidayDefinition({
		name: "New Year's Day",
		type: "fixed",
		month: 1,
		day: 1,
		workFree: true,
	}),

	// Chinese New Year Day 1
	new HolidayDefinition({
		name: "Chinese New Year",
		type: "calculated",
		workFree: true,
		calculator: (/** @type {number} */ year) => calculateChineseNewYear(year),
	}),

	// Chinese New Year Day 2
	new HolidayDefinition({
		name: "Chinese New Year (Day 2)",
		type: "calculated",
		workFree: true,
		calculator: (/** @type {number} */ year) => {
			const cny = calculateChineseNewYear(year);
			return new Date(cny.getTime() + 24 * 60 * 60 * 1000);
		},
	}),

	// Good Friday
	new HolidayDefinition({
		name: "Good Friday",
		type: "easter_relative",
		offset: -2,
		workFree: true,
	}),

	// Eid al-Fitr
	new HolidayDefinition({
		name: "Hari Raya Puasa",
		type: "calculated",
		workFree: true,
		calculator: (/** @type {number} */ year) => calculateEidAlFitr(year),
	}),

	// Labor Day
	new HolidayDefinition({
		name: "Labour Day",
		type: "fixed",
		month: 5,
		day: 1,
		workFree: true,
	}),

	// Vesak Day
	new HolidayDefinition({
		name: "Vesak Day",
		type: "calculated",
		workFree: true,
		calculator: (/** @type {number} */ year) => {
			// Full moon in May (Buddhist calendar)
			return new Date(Date.UTC(year, 4, 15)); // Simplified
		},
	}),

	// Eid al-Adha
	new HolidayDefinition({
		name: "Hari Raya Haji",
		type: "calculated",
		workFree: true,
		calculator: (/** @type {number} */ year) => calculateEidAlAdha(year),
	}),

	// National Day
	new HolidayDefinition({
		name: "National Day",
		type: "fixed",
		month: 8,
		day: 9,
		workFree: true,
	}),

	// Deepavali
	new HolidayDefinition({
		name: "Deepavali",
		type: "calculated",
		workFree: true,
		calculator: (/** @type {number} */ year) => calculateDeepavali(year),
	}),

	// Christmas Day
	new HolidayDefinition({
		name: "Christmas Day",
		type: "fixed",
		month: 12,
		day: 25,
		workFree: true,
	}),
];

// Singapore has no regional holiday variations (city-state)
const REGIONAL_HOLIDAYS = {
	/** @type {import('../holiday-definition.js').HolidayDefinition[]} */
	// No regional variations in Singapore (city-state)
};

// Freeze holiday arrays to prevent modification
Object.freeze(NATIONAL_HOLIDAYS);
Object.freeze(REGIONAL_HOLIDAYS);

export const SG = {
	national: NATIONAL_HOLIDAYS,
	regional: REGIONAL_HOLIDAYS,
};

Object.freeze(SG);
