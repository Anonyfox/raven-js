/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Thai holiday definitions with Buddhist calendar
 *
 * Thailand observes holidays from multiple traditions:
 * - Buddhist holidays (majority religion)
 * - Royal holidays (King's Birthday, Queen's Birthday)
 * - Songkran (Thai New Year) - water festival
 * - Constitutional and national civic holidays
 * - Lunar calendar-based Buddhist holidays
 * - No regional variations (unified national system)
 */

import { HolidayDefinition } from "../holiday-definition.js";

/**
 * Calculate Makha Bucha Day.
 * Full moon day of 3rd lunar month (February/March).
 * @param {number} year - Year to calculate for
 * @returns {Date} Makha Bucha Day
 */
function calculateMakhaBucha(year) {
	// Simplified Makha Bucha dates
	/** @type {Record<number, Date>} */
	const makhaBuchaDates = {
		2024: new Date(Date.UTC(year, 1, 24)), // Feb 24
		2025: new Date(Date.UTC(year, 1, 12)), // Feb 12
		2026: new Date(Date.UTC(year, 2, 4)), // Mar 4
		2027: new Date(Date.UTC(year, 1, 21)), // Feb 21
		2028: new Date(Date.UTC(year, 1, 11)), // Feb 11
		2029: new Date(Date.UTC(year, 1, 28)), // Feb 28
		2030: new Date(Date.UTC(year, 1, 17)), // Feb 17
	};

	return makhaBuchaDates[year] || new Date(Date.UTC(year, 1, 24)); // fallback
}

/**
 * Calculate Visakha Bucha Day.
 * Full moon day of 6th lunar month (May/June).
 * @param {number} year - Year to calculate for
 * @returns {Date} Visakha Bucha Day
 */
function calculateVisakhaBucha(year) {
	// Simplified Visakha Bucha dates
	/** @type {Record<number, Date>} */
	const visakhaBuchaDates = {
		2024: new Date(Date.UTC(year, 4, 22)), // May 22
		2025: new Date(Date.UTC(year, 4, 12)), // May 12
		2026: new Date(Date.UTC(year, 5, 1)), // Jun 1
		2027: new Date(Date.UTC(year, 4, 20)), // May 20
		2028: new Date(Date.UTC(year, 4, 9)), // May 9
		2029: new Date(Date.UTC(year, 4, 27)), // May 27
		2030: new Date(Date.UTC(year, 4, 16)), // May 16
	};

	return visakhaBuchaDates[year] || new Date(Date.UTC(year, 4, 22)); // fallback
}

/**
 * Calculate Asanha Bucha Day.
 * Full moon day of 8th lunar month (July).
 * @param {number} year - Year to calculate for
 * @returns {Date} Asanha Bucha Day
 */
function calculateAsanhaBucha(year) {
	// Simplified Asanha Bucha dates
	/** @type {Record<number, Date>} */
	const asanhaBuchaDates = {
		2024: new Date(Date.UTC(year, 6, 20)), // Jul 20
		2025: new Date(Date.UTC(year, 6, 10)), // Jul 10
		2026: new Date(Date.UTC(year, 6, 29)), // Jul 29
		2027: new Date(Date.UTC(year, 6, 18)), // Jul 18
		2028: new Date(Date.UTC(year, 6, 7)), // Jul 7
		2029: new Date(Date.UTC(year, 6, 25)), // Jul 25
		2030: new Date(Date.UTC(year, 6, 15)), // Jul 15
	};

	return asanhaBuchaDates[year] || new Date(Date.UTC(year, 6, 20)); // fallback
}

/**
 * Calculate Khao Phansa Day (Buddhist Lent begins).
 * Day after Asanha Bucha Day.
 * @param {number} year - Year to calculate for
 * @returns {Date} Khao Phansa Day
 */
function calculateKhaoPhansa(year) {
	const asanhaBucha = calculateAsanhaBucha(year);
	return new Date(asanhaBucha.getTime() + 24 * 60 * 60 * 1000);
}

// National holidays observed throughout Thailand
const NATIONAL_HOLIDAYS = [
	// New Year's Day
	new HolidayDefinition({
		name: "วันขึ้นปีใหม่",
		type: "fixed",
		month: 1,
		day: 1,
		workFree: true,
	}),

	// Makha Bucha Day
	new HolidayDefinition({
		name: "วันมาฆบูชา",
		type: "calculated",
		workFree: true,
		calculator: (/** @type {number} */ year) => calculateMakhaBucha(year),
	}),

	// Chakri Dynasty Day
	new HolidayDefinition({
		name: "วันจักรี",
		type: "fixed",
		month: 4,
		day: 6,
		workFree: true,
	}),

	// Songkran Day 1 (Thai New Year)
	new HolidayDefinition({
		name: "วันสงกรานต์",
		type: "fixed",
		month: 4,
		day: 13,
		workFree: true,
	}),

	// Songkran Day 2
	new HolidayDefinition({
		name: "วันสงกรานต์",
		type: "fixed",
		month: 4,
		day: 14,
		workFree: true,
	}),

	// Songkran Day 3
	new HolidayDefinition({
		name: "วันสงกรานต์",
		type: "fixed",
		month: 4,
		day: 15,
		workFree: true,
	}),

	// Labor Day
	new HolidayDefinition({
		name: "วันแรงงานแห่งชาติ",
		type: "fixed",
		month: 5,
		day: 1,
		workFree: true,
	}),

	// Coronation Day
	new HolidayDefinition({
		name: "วันฉัตรมงคล",
		type: "fixed",
		month: 5,
		day: 4,
		workFree: true,
	}),

	// Royal Ploughing Ceremony
	new HolidayDefinition({
		name: "วันพืชมงคล",
		type: "calculated",
		workFree: true,
		calculator: (/** @type {number} */ year) => {
			// Usually in May, determined by palace
			return new Date(Date.UTC(year, 4, 10)); // Simplified
		},
	}),

	// Visakha Bucha Day
	new HolidayDefinition({
		name: "วันวิสาขบูชา",
		type: "calculated",
		workFree: true,
		calculator: (/** @type {number} */ year) => calculateVisakhaBucha(year),
	}),

	// Queen Suthida's Birthday
	new HolidayDefinition({
		name: "วันเฉลิมพระชนมพรรษาสมเด็จพระนางเจ้าสุทิดา",
		type: "fixed",
		month: 6,
		day: 3,
		workFree: true,
	}),

	// Asanha Bucha Day
	new HolidayDefinition({
		name: "วันอาสาฬหบูชา",
		type: "calculated",
		workFree: true,
		calculator: (/** @type {number} */ year) => calculateAsanhaBucha(year),
	}),

	// Khao Phansa Day (Buddhist Lent begins)
	new HolidayDefinition({
		name: "วันเข้าพรรษา",
		type: "calculated",
		workFree: true,
		calculator: (/** @type {number} */ year) => calculateKhaoPhansa(year),
	}),

	// HM the Queen's Birthday
	new HolidayDefinition({
		name: "วันเฉลิมพระชนมพรรษาสมเด็จพระนางเจ้าสิริกิติ์",
		type: "fixed",
		month: 8,
		day: 12,
		workFree: true,
	}),

	// HM King Bhumibol Memorial Day
	new HolidayDefinition({
		name: "วันคล้ายวันสวรรคตพระบาทสมเด็จพระปรมินทรมหาภูมิพลอดุลยเดช",
		type: "fixed",
		month: 10,
		day: 13,
		workFree: true,
	}),

	// Chulalongkorn Day
	new HolidayDefinition({
		name: "วันปิยมหาราช",
		type: "fixed",
		month: 10,
		day: 23,
		workFree: true,
	}),

	// HM the King's Birthday
	new HolidayDefinition({
		name: "วันเฉลิมพระชนมพรรษาพระบาทสมเด็จพระปรเมนทรรามาธิบดีศรีสินทรมหาวชิราลงกรณ",
		type: "fixed",
		month: 7,
		day: 28,
		workFree: true,
	}),

	// Constitution Day
	new HolidayDefinition({
		name: "วันรัฐธรรมนูญ",
		type: "fixed",
		month: 12,
		day: 10,
		workFree: true,
	}),

	// New Year's Eve
	new HolidayDefinition({
		name: "วันสิ้นปี",
		type: "fixed",
		month: 12,
		day: 31,
		workFree: true,
	}),
];

// Thailand has no regional holiday variations (unified national system)
const REGIONAL_HOLIDAYS = {
	/** @type {import('../holiday-definition.js').HolidayDefinition[]} */
	// No regional variations in Thailand
};

// Freeze holiday arrays to prevent modification
Object.freeze(NATIONAL_HOLIDAYS);
Object.freeze(REGIONAL_HOLIDAYS);

export const TH = {
	national: NATIONAL_HOLIDAYS,
	regional: REGIONAL_HOLIDAYS,
};

Object.freeze(TH);
