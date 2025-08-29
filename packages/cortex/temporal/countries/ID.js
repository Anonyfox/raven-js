/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Indonesian holiday definitions with Islamic calendar
 *
 * Indonesia observes holidays from multiple traditions:
 * - Islamic holidays (majority religion)
 * - Christian holidays (Good Friday, Christmas)
 * - Hindu holidays (Nyepi - Balinese New Year)
 * - Buddhist holidays (Vesak Day)
 * - Chinese New Year (Imlek)
 * - National civic holidays
 * - No regional variations (unified national system)
 */

import { HolidayDefinition } from "../holiday-definition.js";

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
	// Simplified Eid al-Adha dates (about 70 days after Eid al-Fitr)
	const eidAlFitr = calculateEidAlFitr(year);
	return new Date(eidAlFitr.getTime() + 70 * 24 * 60 * 60 * 1000);
}

/**
 * Calculate Islamic New Year (Muharram).
 * @param {number} year - Year to calculate for
 * @returns {Date} Islamic New Year date
 */
function calculateIslamicNewYear(year) {
	// Simplified Islamic New Year dates
	/** @type {Record<number, Date>} */
	const islamicNewYearDates = {
		2024: new Date(Date.UTC(year, 6, 7)), // Jul 7
		2025: new Date(Date.UTC(year, 5, 26)), // Jun 26
		2026: new Date(Date.UTC(year, 5, 16)), // Jun 16
		2027: new Date(Date.UTC(year, 5, 5)), // Jun 5
		2028: new Date(Date.UTC(year, 4, 25)), // May 25
		2029: new Date(Date.UTC(year, 4, 14)), // May 14
		2030: new Date(Date.UTC(year, 4, 4)), // May 4
	};

	return islamicNewYearDates[year] || new Date(Date.UTC(year, 6, 7)); // fallback
}

/**
 * Calculate Chinese New Year (Imlek).
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
 * Calculate Nyepi (Balinese New Year).
 * Based on Saka calendar, usually March.
 * @param {number} year - Year to calculate for
 * @returns {Date} Nyepi date
 */
function calculateNyepi(year) {
	// Simplified Nyepi dates
	/** @type {Record<number, Date>} */
	const nyepiDates = {
		2024: new Date(Date.UTC(year, 2, 11)), // Mar 11
		2025: new Date(Date.UTC(year, 2, 29)), // Mar 29
		2026: new Date(Date.UTC(year, 2, 19)), // Mar 19
		2027: new Date(Date.UTC(year, 2, 9)), // Mar 9
		2028: new Date(Date.UTC(year, 2, 25)), // Mar 25
		2029: new Date(Date.UTC(year, 2, 14)), // Mar 14
		2030: new Date(Date.UTC(year, 2, 4)), // Mar 4
	};

	return nyepiDates[year] || new Date(Date.UTC(year, 2, 11)); // fallback
}

// National holidays observed throughout Indonesia
const NATIONAL_HOLIDAYS = [
	// New Year's Day
	new HolidayDefinition({
		name: "Tahun Baru Masehi",
		type: "fixed",
		month: 1,
		day: 1,
		workFree: true,
	}),

	// Chinese New Year (Imlek)
	new HolidayDefinition({
		name: "Tahun Baru Imlek",
		type: "calculated",
		workFree: true,
		calculator: (/** @type {number} */ year) => calculateChineseNewYear(year),
	}),

	// Nyepi (Balinese New Year)
	new HolidayDefinition({
		name: "Hari Raya Nyepi",
		type: "calculated",
		workFree: true,
		calculator: (/** @type {number} */ year) => calculateNyepi(year),
	}),

	// Good Friday
	new HolidayDefinition({
		name: "Wafat Isa Al-Masih",
		type: "easter_relative",
		offset: -2,
		workFree: true,
	}),

	// Eid al-Fitr (End of Ramadan)
	new HolidayDefinition({
		name: "Hari Raya Idul Fitri",
		type: "calculated",
		workFree: true,
		calculator: (/** @type {number} */ year) => calculateEidAlFitr(year),
	}),

	// Labor Day
	new HolidayDefinition({
		name: "Hari Buruh",
		type: "fixed",
		month: 5,
		day: 1,
		workFree: true,
	}),

	// Vesak Day (Buddha's Birthday)
	new HolidayDefinition({
		name: "Hari Raya Waisak",
		type: "calculated",
		workFree: true,
		calculator: (/** @type {number} */ year) => {
			// Full moon in May (simplified)
			return new Date(Date.UTC(year, 4, 15));
		},
	}),

	// Ascension of Jesus Christ
	new HolidayDefinition({
		name: "Kenaikan Isa Al-Masih",
		type: "easter_relative",
		offset: 39,
		workFree: true,
	}),

	// Eid al-Adha (Festival of Sacrifice)
	new HolidayDefinition({
		name: "Hari Raya Idul Adha",
		type: "calculated",
		workFree: true,
		calculator: (/** @type {number} */ year) => calculateEidAlAdha(year),
	}),

	// Independence Day
	new HolidayDefinition({
		name: "Hari Kemerdekaan",
		type: "fixed",
		month: 8,
		day: 17,
		workFree: true,
	}),

	// Islamic New Year
	new HolidayDefinition({
		name: "Tahun Baru Islam",
		type: "calculated",
		workFree: true,
		calculator: (/** @type {number} */ year) => calculateIslamicNewYear(year),
	}),

	// Prophet Muhammad's Birthday
	new HolidayDefinition({
		name: "Maulid Nabi Muhammad",
		type: "calculated",
		workFree: true,
		calculator: (/** @type {number} */ year) => {
			// 12th day of Rabi' al-awwal (simplified)
			const islamicNewYear = calculateIslamicNewYear(year);
			return new Date(islamicNewYear.getTime() + 70 * 24 * 60 * 60 * 1000);
		},
	}),

	// Christmas Day
	new HolidayDefinition({
		name: "Hari Raya Natal",
		type: "fixed",
		month: 12,
		day: 25,
		workFree: true,
	}),
];

// Indonesia has no regional holiday variations (unified national system)
const REGIONAL_HOLIDAYS = {
	/** @type {import('../holiday-definition.js').HolidayDefinition[]} */
	// No regional variations in Indonesia
};

// Freeze holiday arrays to prevent modification
Object.freeze(NATIONAL_HOLIDAYS);
Object.freeze(REGIONAL_HOLIDAYS);

export const ID = {
	national: NATIONAL_HOLIDAYS,
	regional: REGIONAL_HOLIDAYS,
};

Object.freeze(ID);
