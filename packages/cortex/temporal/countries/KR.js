/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file South Korean holiday definitions with lunar calendar
 *
 * South Korea observes both lunar and solar calendar holidays:
 * - Lunar New Year (Seollal) - 3 days
 * - Chuseok (Korean Thanksgiving) - 3 days
 * - Buddha's Birthday (lunar calendar)
 * - National Foundation Day
 * - Hangul Day (Korean alphabet)
 * - No regional variations (unified national system)
 */

import { HolidayDefinition } from "../holiday-definition.js";

/**
 * Calculate Lunar New Year (Seollal).
 * Same as Chinese New Year but with Korean traditions.
 * @param {number} year - Year to calculate for
 * @returns {Date} Lunar New Year date
 */
function calculateLunarNewYear(year) {
	// Simplified Lunar New Year dates (same as Chinese New Year)
	/** @type {Record<number, Date>} */
	const lunarNewYearDates = {
		2024: new Date(Date.UTC(year, 1, 10)), // Feb 10
		2025: new Date(Date.UTC(year, 0, 29)), // Jan 29
		2026: new Date(Date.UTC(year, 1, 17)), // Feb 17
		2027: new Date(Date.UTC(year, 1, 6)), // Feb 6
		2028: new Date(Date.UTC(year, 0, 26)), // Jan 26
		2029: new Date(Date.UTC(year, 1, 13)), // Feb 13
		2030: new Date(Date.UTC(year, 1, 3)), // Feb 3
	};

	return lunarNewYearDates[year] || new Date(Date.UTC(year, 1, 10)); // fallback
}

/**
 * Calculate Chuseok (Korean Thanksgiving).
 * 15th day of 8th lunar month.
 * @param {number} year - Year to calculate for
 * @returns {Date} Chuseok date
 */
function calculateChuseok(year) {
	// Simplified Chuseok dates (15th day of 8th lunar month)
	/** @type {Record<number, Date>} */
	const chuseokDates = {
		2024: new Date(Date.UTC(year, 8, 17)), // Sep 17
		2025: new Date(Date.UTC(year, 9, 6)), // Oct 6
		2026: new Date(Date.UTC(year, 8, 25)), // Sep 25
		2027: new Date(Date.UTC(year, 8, 15)), // Sep 15
		2028: new Date(Date.UTC(year, 9, 3)), // Oct 3
		2029: new Date(Date.UTC(year, 8, 22)), // Sep 22
		2030: new Date(Date.UTC(year, 8, 12)), // Sep 12
	};

	return chuseokDates[year] || new Date(Date.UTC(year, 8, 17)); // fallback
}

/**
 * Calculate Buddha's Birthday.
 * 8th day of 4th lunar month.
 * @param {number} year - Year to calculate for
 * @returns {Date} Buddha's Birthday
 */
function calculateBuddhasBirthday(year) {
	// Simplified Buddha's Birthday dates
	/** @type {Record<number, Date>} */
	const buddhasBirthdayDates = {
		2024: new Date(Date.UTC(year, 4, 15)), // May 15
		2025: new Date(Date.UTC(year, 4, 5)), // May 5
		2026: new Date(Date.UTC(year, 4, 24)), // May 24
		2027: new Date(Date.UTC(year, 4, 13)), // May 13
		2028: new Date(Date.UTC(year, 4, 2)), // May 2
		2029: new Date(Date.UTC(year, 4, 20)), // May 20
		2030: new Date(Date.UTC(year, 4, 9)), // May 9
	};

	return buddhasBirthdayDates[year] || new Date(Date.UTC(year, 4, 15)); // fallback
}

// National holidays observed throughout South Korea
const NATIONAL_HOLIDAYS = [
	// New Year's Day
	new HolidayDefinition({
		name: "신정",
		type: "fixed",
		month: 1,
		day: 1,
		workFree: true,
	}),

	// Lunar New Year (Seollal) - Day before
	new HolidayDefinition({
		name: "설날 전날",
		type: "calculated",
		workFree: true,
		calculator: (/** @type {number} */ year) => {
			const seollal = calculateLunarNewYear(year);
			return new Date(seollal.getTime() - 24 * 60 * 60 * 1000);
		},
	}),

	// Lunar New Year (Seollal)
	new HolidayDefinition({
		name: "설날",
		type: "calculated",
		workFree: true,
		calculator: (/** @type {number} */ year) => calculateLunarNewYear(year),
	}),

	// Lunar New Year (Seollal) - Day after
	new HolidayDefinition({
		name: "설날 다음날",
		type: "calculated",
		workFree: true,
		calculator: (/** @type {number} */ year) => {
			const seollal = calculateLunarNewYear(year);
			return new Date(seollal.getTime() + 24 * 60 * 60 * 1000);
		},
	}),

	// Independence Movement Day (3.1절)
	new HolidayDefinition({
		name: "삼일절",
		type: "fixed",
		month: 3,
		day: 1,
		workFree: true,
	}),

	// Buddha's Birthday
	new HolidayDefinition({
		name: "부처님 오신 날",
		type: "calculated",
		workFree: true,
		calculator: (/** @type {number} */ year) => calculateBuddhasBirthday(year),
	}),

	// Children's Day
	new HolidayDefinition({
		name: "어린이날",
		type: "fixed",
		month: 5,
		day: 5,
		workFree: true,
	}),

	// Memorial Day
	new HolidayDefinition({
		name: "현충일",
		type: "fixed",
		month: 6,
		day: 6,
		workFree: true,
	}),

	// Constitution Day
	new HolidayDefinition({
		name: "제헌절",
		type: "fixed",
		month: 7,
		day: 17,
		workFree: false, // Not a public holiday since 2008
	}),

	// Liberation Day
	new HolidayDefinition({
		name: "광복절",
		type: "fixed",
		month: 8,
		day: 15,
		workFree: true,
	}),

	// Chuseok (Korean Thanksgiving) - Day before
	new HolidayDefinition({
		name: "추석 전날",
		type: "calculated",
		workFree: true,
		calculator: (/** @type {number} */ year) => {
			const chuseok = calculateChuseok(year);
			return new Date(chuseok.getTime() - 24 * 60 * 60 * 1000);
		},
	}),

	// Chuseok (Korean Thanksgiving)
	new HolidayDefinition({
		name: "추석",
		type: "calculated",
		workFree: true,
		calculator: (/** @type {number} */ year) => calculateChuseok(year),
	}),

	// Chuseok (Korean Thanksgiving) - Day after
	new HolidayDefinition({
		name: "추석 다음날",
		type: "calculated",
		workFree: true,
		calculator: (/** @type {number} */ year) => {
			const chuseok = calculateChuseok(year);
			return new Date(chuseok.getTime() + 24 * 60 * 60 * 1000);
		},
	}),

	// National Foundation Day (Gaecheonjeol)
	new HolidayDefinition({
		name: "개천절",
		type: "fixed",
		month: 10,
		day: 3,
		workFree: true,
	}),

	// Hangul Day (Korean Alphabet Day)
	new HolidayDefinition({
		name: "한글날",
		type: "fixed",
		month: 10,
		day: 9,
		workFree: true,
	}),

	// Christmas Day
	new HolidayDefinition({
		name: "크리스마스",
		type: "fixed",
		month: 12,
		day: 25,
		workFree: true,
	}),
];

// South Korea has no regional holiday variations
const REGIONAL_HOLIDAYS = {
	/** @type {import('../holiday-definition.js').HolidayDefinition[]} */
	// No regional variations in South Korea
};

// Freeze holiday arrays to prevent modification
Object.freeze(NATIONAL_HOLIDAYS);
Object.freeze(REGIONAL_HOLIDAYS);

export const KR = {
	national: NATIONAL_HOLIDAYS,
	regional: REGIONAL_HOLIDAYS,
};

Object.freeze(KR);
