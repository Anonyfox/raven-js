/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Japanese holiday definitions with unique Japanese calendar system
 *
 * Japan has a distinctive holiday system featuring:
 * - Golden Week (late April/early May cluster)
 * - Mountain Day (newest national holiday)
 * - Respect for the Aged Day (moved to Monday)
 * - Happy Monday System (Monday holidays)
 * - Emperor-related holidays with historical significance
 * - No regional variations (uniform national system)
 */

import { HolidayDefinition } from "../holiday-definition.js";

/**
 * Calculate Coming of Age Day (Second Monday in January).
 * @param {number} year - Year to calculate for
 * @returns {Date} Coming of Age Day
 */
function calculateComingOfAgeDay(year) {
	const jan1 = new Date(Date.UTC(year, 0, 1));
	const dayOfWeek = jan1.getUTCDay();
	// Second Monday = first Monday + 7 days
	const firstMonday = dayOfWeek === 1 ? 1 : ((7 - dayOfWeek + 1) % 7) + 1;
	return new Date(Date.UTC(year, 0, firstMonday + 7));
}

/**
 * Calculate Marine Day (Third Monday in July).
 * @param {number} year - Year to calculate for
 * @returns {Date} Marine Day
 */
function calculateMarineDay(year) {
	const jul1 = new Date(Date.UTC(year, 6, 1));
	const dayOfWeek = jul1.getUTCDay();
	const firstMonday = dayOfWeek === 1 ? 1 : ((7 - dayOfWeek + 1) % 7) + 1;
	return new Date(Date.UTC(year, 6, firstMonday + 14)); // Third Monday
}

/**
 * Calculate Respect for the Aged Day (Third Monday in September).
 * @param {number} year - Year to calculate for
 * @returns {Date} Respect for the Aged Day
 */
function calculateRespectForAgedDay(year) {
	const sep1 = new Date(Date.UTC(year, 8, 1));
	const dayOfWeek = sep1.getUTCDay();
	const firstMonday = dayOfWeek === 1 ? 1 : ((7 - dayOfWeek + 1) % 7) + 1;
	return new Date(Date.UTC(year, 8, firstMonday + 14)); // Third Monday
}

/**
 * Calculate Health and Sports Day (Second Monday in October).
 * @param {number} year - Year to calculate for
 * @returns {Date} Health and Sports Day
 */
function calculateHealthSportsDay(year) {
	const oct1 = new Date(Date.UTC(year, 9, 1));
	const dayOfWeek = oct1.getUTCDay();
	const firstMonday = dayOfWeek === 1 ? 1 : ((7 - dayOfWeek + 1) % 7) + 1;
	return new Date(Date.UTC(year, 9, firstMonday + 7)); // Second Monday
}

/**
 * Calculate Vernal Equinox Day (around March 20-21).
 * @param {number} year - Year to calculate for
 * @returns {Date} Vernal Equinox Day
 */
function calculateVernalEquinox(year) {
	// Simplified calculation - actual depends on astronomical calculation
	return new Date(Date.UTC(year, 2, 20)); // March 20 (simplified)
}

/**
 * Calculate Autumnal Equinox Day (around September 22-23).
 * @param {number} year - Year to calculate for
 * @returns {Date} Autumnal Equinox Day
 */
function calculateAutumnalEquinox(year) {
	// Simplified calculation
	return new Date(Date.UTC(year, 8, 23)); // September 23 (simplified)
}

// National holidays observed throughout Japan
const NATIONAL_HOLIDAYS = [
	// New Year's Day
	new HolidayDefinition({
		name: "元日",
		type: "fixed",
		month: 1,
		day: 1,
		workFree: true,
	}),

	// Coming of Age Day (Second Monday in January)
	new HolidayDefinition({
		name: "成人の日",
		type: "calculated",
		workFree: true,
		calculator: (/** @type {number} */ year) => calculateComingOfAgeDay(year),
	}),

	// National Foundation Day
	new HolidayDefinition({
		name: "建国記念の日",
		type: "fixed",
		month: 2,
		day: 11,
		workFree: true,
	}),

	// The Emperor's Birthday (February 23, since 2020)
	new HolidayDefinition({
		name: "天皇誕生日",
		type: "fixed",
		month: 2,
		day: 23,
		workFree: true,
	}),

	// Vernal Equinox Day
	new HolidayDefinition({
		name: "春分の日",
		type: "calculated",
		workFree: true,
		calculator: (/** @type {number} */ year) => calculateVernalEquinox(year),
	}),

	// Showa Day (start of Golden Week)
	new HolidayDefinition({
		name: "昭和の日",
		type: "fixed",
		month: 4,
		day: 29,
		workFree: true,
	}),

	// Constitution Memorial Day (Golden Week)
	new HolidayDefinition({
		name: "憲法記念日",
		type: "fixed",
		month: 5,
		day: 3,
		workFree: true,
	}),

	// Greenery Day (Golden Week)
	new HolidayDefinition({
		name: "みどりの日",
		type: "fixed",
		month: 5,
		day: 4,
		workFree: true,
	}),

	// Children's Day (Golden Week)
	new HolidayDefinition({
		name: "こどもの日",
		type: "fixed",
		month: 5,
		day: 5,
		workFree: true,
	}),

	// Marine Day (Third Monday in July)
	new HolidayDefinition({
		name: "海の日",
		type: "calculated",
		workFree: true,
		calculator: (/** @type {number} */ year) => calculateMarineDay(year),
	}),

	// Mountain Day (newest national holiday, since 2016)
	new HolidayDefinition({
		name: "山の日",
		type: "fixed",
		month: 8,
		day: 11,
		workFree: true,
	}),

	// Respect for the Aged Day (Third Monday in September)
	new HolidayDefinition({
		name: "敬老の日",
		type: "calculated",
		workFree: true,
		calculator: (/** @type {number} */ year) =>
			calculateRespectForAgedDay(year),
	}),

	// Autumnal Equinox Day
	new HolidayDefinition({
		name: "秋分の日",
		type: "calculated",
		workFree: true,
		calculator: (/** @type {number} */ year) => calculateAutumnalEquinox(year),
	}),

	// Health and Sports Day (Second Monday in October)
	new HolidayDefinition({
		name: "スポーツの日",
		type: "calculated",
		workFree: true,
		calculator: (/** @type {number} */ year) => calculateHealthSportsDay(year),
	}),

	// Culture Day
	new HolidayDefinition({
		name: "文化の日",
		type: "fixed",
		month: 11,
		day: 3,
		workFree: true,
	}),

	// Labor Thanksgiving Day
	new HolidayDefinition({
		name: "勤労感謝の日",
		type: "fixed",
		month: 11,
		day: 23,
		workFree: true,
	}),
];

// Japan has no regional holiday variations (unified national system)
const REGIONAL_HOLIDAYS = {
	/** @type {import('../holiday-definition.js').HolidayDefinition[]} */
	// No regional variations in Japan
};

// Freeze holiday arrays to prevent modification
Object.freeze(NATIONAL_HOLIDAYS);
Object.freeze(REGIONAL_HOLIDAYS);

export const JP = {
	national: NATIONAL_HOLIDAYS,
	regional: REGIONAL_HOLIDAYS,
};

Object.freeze(JP);
