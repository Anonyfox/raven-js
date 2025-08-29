/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Vietnamese holiday definitions with lunar calendar
 *
 * Vietnam observes holidays from multiple traditions:
 * - Tet (Vietnamese New Year) - most important holiday
 * - National civic holidays (Independence Day, Reunification Day)
 * - Ancestral worship holidays (Hung Kings' Commemoration Day)
 * - Lunar calendar-based traditional holidays
 * - No regional variations (unified national system)
 */

import { HolidayDefinition } from "../holiday-definition.js";

/**
 * Calculate Tet (Vietnamese New Year).
 * Same as Chinese New Year lunar calendar.
 * @param {number} year - Year to calculate for
 * @returns {Date} Tet date
 */
function calculateTet(year) {
	// Same as Chinese New Year lunar calendar
	/** @type {Record<number, Date>} */
	const tetDates = {
		2024: new Date(Date.UTC(year, 1, 10)), // Feb 10
		2025: new Date(Date.UTC(year, 0, 29)), // Jan 29
		2026: new Date(Date.UTC(year, 1, 17)), // Feb 17
		2027: new Date(Date.UTC(year, 1, 6)), // Feb 6
		2028: new Date(Date.UTC(year, 0, 26)), // Jan 26
		2029: new Date(Date.UTC(year, 1, 13)), // Feb 13
		2030: new Date(Date.UTC(year, 1, 3)), // Feb 3
	};

	return tetDates[year] || new Date(Date.UTC(year, 1, 10)); // fallback
}

/**
 * Calculate Hung Kings' Commemoration Day.
 * 10th day of 3rd lunar month.
 * @param {number} year - Year to calculate for
 * @returns {Date} Hung Kings' Day
 */
function calculateHungKingsDay(year) {
	// Simplified Hung Kings' Day dates (10th day of 3rd lunar month)
	/** @type {Record<number, Date>} */
	const hungKingsDates = {
		2024: new Date(Date.UTC(year, 3, 18)), // Apr 18
		2025: new Date(Date.UTC(year, 3, 6)), // Apr 6
		2026: new Date(Date.UTC(year, 3, 26)), // Apr 26
		2027: new Date(Date.UTC(year, 3, 15)), // Apr 15
		2028: new Date(Date.UTC(year, 3, 3)), // Apr 3
		2029: new Date(Date.UTC(year, 3, 22)), // Apr 22
		2030: new Date(Date.UTC(year, 3, 11)), // Apr 11
	};

	return hungKingsDates[year] || new Date(Date.UTC(year, 3, 18)); // fallback
}

// National holidays observed throughout Vietnam
const NATIONAL_HOLIDAYS = [
	// New Year's Day
	new HolidayDefinition({
		name: "Tết Dương lịch",
		type: "fixed",
		month: 1,
		day: 1,
		workFree: true,
	}),

	// Tet (Vietnamese New Year) - 5 days
	new HolidayDefinition({
		name: "Tết Nguyên đán",
		type: "calculated",
		workFree: true,
		calculator: (/** @type {number} */ year) => {
			const tet = calculateTet(year);
			return new Date(tet.getTime() - 24 * 60 * 60 * 1000); // Day before
		},
	}),

	new HolidayDefinition({
		name: "Tết Nguyên đán",
		type: "calculated",
		workFree: true,
		calculator: (/** @type {number} */ year) => calculateTet(year),
	}),

	new HolidayDefinition({
		name: "Tết Nguyên đán",
		type: "calculated",
		workFree: true,
		calculator: (/** @type {number} */ year) => {
			const tet = calculateTet(year);
			return new Date(tet.getTime() + 24 * 60 * 60 * 1000); // Day after
		},
	}),

	new HolidayDefinition({
		name: "Tết Nguyên đán",
		type: "calculated",
		workFree: true,
		calculator: (/** @type {number} */ year) => {
			const tet = calculateTet(year);
			return new Date(tet.getTime() + 2 * 24 * 60 * 60 * 1000); // 2 days after
		},
	}),

	new HolidayDefinition({
		name: "Tết Nguyên đán",
		type: "calculated",
		workFree: true,
		calculator: (/** @type {number} */ year) => {
			const tet = calculateTet(year);
			return new Date(tet.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days after
		},
	}),

	// Hung Kings' Commemoration Day
	new HolidayDefinition({
		name: "Giỗ tổ Hùng Vương",
		type: "calculated",
		workFree: true,
		calculator: (/** @type {number} */ year) => calculateHungKingsDay(year),
	}),

	// Liberation Day/Reunification Day
	new HolidayDefinition({
		name: "Ngày Giải phóng miền Nam",
		type: "fixed",
		month: 4,
		day: 30,
		workFree: true,
	}),

	// International Labor Day
	new HolidayDefinition({
		name: "Ngày Quốc tế Lao động",
		type: "fixed",
		month: 5,
		day: 1,
		workFree: true,
	}),

	// National Day
	new HolidayDefinition({
		name: "Quốc khánh",
		type: "fixed",
		month: 9,
		day: 2,
		workFree: true,
	}),

	// National Day Holiday (September 3)
	new HolidayDefinition({
		name: "Quốc khánh",
		type: "fixed",
		month: 9,
		day: 3,
		workFree: true,
	}),
];

// Vietnam has no regional holiday variations (unified national system)
const REGIONAL_HOLIDAYS = {
	/** @type {import('../holiday-definition.js').HolidayDefinition[]} */
	// No regional variations in Vietnam
};

// Freeze holiday arrays to prevent modification
Object.freeze(NATIONAL_HOLIDAYS);
Object.freeze(REGIONAL_HOLIDAYS);

export const VN = {
	national: NATIONAL_HOLIDAYS,
	regional: REGIONAL_HOLIDAYS,
};

Object.freeze(VN);
