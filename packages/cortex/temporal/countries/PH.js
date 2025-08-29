/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Philippine holiday definitions with Catholic and national system
 *
 * Philippines observes holidays from multiple traditions:
 * - Catholic holidays (majority religion) - Easter, Christmas, etc.
 * - National civic holidays (Independence Day, Rizal Day)
 * - Chinese New Year (significant Chinese minority)
 * - Islamic holidays (for Muslim regions)
 * - Regional variations for autonomous regions
 */

import { HolidayDefinition } from "../holiday-definition.js";

/**
 * Calculate Chinese New Year.
 * @param {number} year - Year to calculate for
 * @returns {Date} Chinese New Year date
 */
function calculateChineseNewYear(year) {
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

// National holidays observed throughout Philippines
const NATIONAL_HOLIDAYS = [
	// New Year's Day
	new HolidayDefinition({
		name: "New Year's Day",
		type: "fixed",
		month: 1,
		day: 1,
		workFree: true,
	}),

	// People Power Anniversary
	new HolidayDefinition({
		name: "People Power Anniversary",
		type: "fixed",
		month: 2,
		day: 25,
		workFree: true,
	}),

	// Maundy Thursday
	new HolidayDefinition({
		name: "Maundy Thursday",
		type: "easter_relative",
		offset: -3,
		workFree: true,
	}),

	// Good Friday
	new HolidayDefinition({
		name: "Good Friday",
		type: "easter_relative",
		offset: -2,
		workFree: true,
	}),

	// Black Saturday
	new HolidayDefinition({
		name: "Black Saturday",
		type: "easter_relative",
		offset: -1,
		workFree: true,
	}),

	// Araw ng Kagitingan (Day of Valor)
	new HolidayDefinition({
		name: "Araw ng Kagitingan",
		type: "fixed",
		month: 4,
		day: 9,
		workFree: true,
	}),

	// Labor Day
	new HolidayDefinition({
		name: "Labor Day",
		type: "fixed",
		month: 5,
		day: 1,
		workFree: true,
	}),

	// Independence Day
	new HolidayDefinition({
		name: "Independence Day",
		type: "fixed",
		month: 6,
		day: 12,
		workFree: true,
	}),

	// Ninoy Aquino Day
	new HolidayDefinition({
		name: "Ninoy Aquino Day",
		type: "fixed",
		month: 8,
		day: 21,
		workFree: true,
	}),

	// National Heroes Day (Last Monday of August)
	new HolidayDefinition({
		name: "National Heroes Day",
		type: "calculated",
		workFree: true,
		calculator: (/** @type {number} */ year) => {
			// Last Monday of August
			const aug31 = new Date(Date.UTC(year, 7, 31));
			const dayOfWeek = aug31.getUTCDay();
			const lastMonday = 31 - ((dayOfWeek + 6) % 7);
			return new Date(Date.UTC(year, 7, lastMonday));
		},
	}),

	// All Saints' Day
	new HolidayDefinition({
		name: "All Saints' Day",
		type: "fixed",
		month: 11,
		day: 1,
		workFree: true,
	}),

	// Bonifacio Day
	new HolidayDefinition({
		name: "Bonifacio Day",
		type: "fixed",
		month: 11,
		day: 30,
		workFree: true,
	}),

	// Rizal Day
	new HolidayDefinition({
		name: "Rizal Day",
		type: "fixed",
		month: 12,
		day: 30,
		workFree: true,
	}),

	// Christmas Day
	new HolidayDefinition({
		name: "Christmas Day",
		type: "fixed",
		month: 12,
		day: 25,
		workFree: true,
	}),

	// Last Day of the Year
	new HolidayDefinition({
		name: "Last Day of the Year",
		type: "fixed",
		month: 12,
		day: 31,
		workFree: true,
	}),

	// Special Non-Working Holidays

	// Chinese New Year
	new HolidayDefinition({
		name: "Chinese New Year",
		type: "calculated",
		workFree: false, // Special non-working holiday
		calculator: (/** @type {number} */ year) => calculateChineseNewYear(year),
	}),

	// Eid al-Fitr
	new HolidayDefinition({
		name: "Eid al-Fitr",
		type: "calculated",
		workFree: false, // Special non-working holiday
		calculator: (/** @type {number} */ year) => calculateEidAlFitr(year),
	}),
];

// Regional holidays for autonomous regions
const REGIONAL_HOLIDAYS = {
	// Autonomous Region in Muslim Mindanao (ARMM) / Bangsamoro
	BARMM: [
		new HolidayDefinition({
			name: "Eid al-Adha",
			type: "calculated",
			workFree: true,
			calculator: (/** @type {number} */ year) => {
				const eidAlFitr = calculateEidAlFitr(year);
				return new Date(eidAlFitr.getTime() + 70 * 24 * 60 * 60 * 1000);
			},
		}),
		new HolidayDefinition({
			name: "Maulid un-Nabi",
			type: "calculated",
			workFree: true,
			calculator: (/** @type {number} */ year) => {
				// 12th day of Rabi' al-awwal (simplified)
				const eidAlFitr = calculateEidAlFitr(year);
				return new Date(eidAlFitr.getTime() - 30 * 24 * 60 * 60 * 1000);
			},
		}),
	],

	// Cordillera Administrative Region
	CAR: [
		new HolidayDefinition({
			name: "Cordillera Day",
			type: "fixed",
			month: 4,
			day: 24,
			workFree: false,
		}),
	],
};

// Freeze holiday arrays to prevent modification
Object.freeze(NATIONAL_HOLIDAYS);
for (const holidays of Object.values(REGIONAL_HOLIDAYS)) {
	Object.freeze(holidays);
}
Object.freeze(REGIONAL_HOLIDAYS);

export const PH = {
	national: NATIONAL_HOLIDAYS,
	regional: REGIONAL_HOLIDAYS,
};

Object.freeze(PH);
