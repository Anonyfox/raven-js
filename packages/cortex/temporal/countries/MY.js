/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Malaysian holiday definitions with multicultural and regional system
 *
 * Malaysia has a complex multicultural holiday system:
 * - Islamic holidays (official religion)
 * - Chinese holidays (Chinese New Year, Wesak Day)
 * - Hindu holidays (Deepavali, Thaipusam)
 * - Christian holidays (Christmas, Good Friday in some states)
 * - National civic holidays
 * - Extensive state-level variations
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

/**
 * Calculate Eid al-Adha (Islamic calendar).
 * @param {number} year - Year to calculate for
 * @returns {Date} Eid al-Adha date
 */
function calculateEidAlAdha(year) {
	const eidAlFitr = calculateEidAlFitr(year);
	return new Date(eidAlFitr.getTime() + 70 * 24 * 60 * 60 * 1000);
}

/**
 * Calculate Deepavali (Hindu Festival of Lights).
 * @param {number} year - Year to calculate for
 * @returns {Date} Deepavali date
 */
function calculateDeepavali(year) {
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

// National holidays observed throughout Malaysia
const NATIONAL_HOLIDAYS = [
	// New Year's Day
	new HolidayDefinition({
		name: "New Year's Day",
		type: "fixed",
		month: 1,
		day: 1,
		workFree: true,
	}),

	// Federal Territory Day
	new HolidayDefinition({
		name: "Federal Territory Day",
		type: "fixed",
		month: 2,
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

	// Labor Day
	new HolidayDefinition({
		name: "Labour Day",
		type: "fixed",
		month: 5,
		day: 1,
		workFree: true,
	}),

	// Wesak Day
	new HolidayDefinition({
		name: "Wesak Day",
		type: "calculated",
		workFree: true,
		calculator: (/** @type {number} */ year) => {
			// Full moon in May (Buddhist calendar)
			return new Date(Date.UTC(year, 4, 15)); // Simplified
		},
	}),

	// Yang di-Pertuan Agong's Birthday
	new HolidayDefinition({
		name: "Yang di-Pertuan Agong's Birthday",
		type: "calculated", // First Saturday in June
		workFree: true,
		calculator: (/** @type {number} */ year) => {
			const jun1 = new Date(Date.UTC(year, 5, 1));
			const dayOfWeek = jun1.getUTCDay();
			const firstSaturday = dayOfWeek === 6 ? 1 : ((6 - dayOfWeek) % 7) + 1;
			return new Date(Date.UTC(year, 5, firstSaturday));
		},
	}),

	// Eid al-Fitr Day 1
	new HolidayDefinition({
		name: "Hari Raya Aidilfitri",
		type: "calculated",
		workFree: true,
		calculator: (/** @type {number} */ year) => calculateEidAlFitr(year),
	}),

	// Eid al-Fitr Day 2
	new HolidayDefinition({
		name: "Hari Raya Aidilfitri (Day 2)",
		type: "calculated",
		workFree: true,
		calculator: (/** @type {number} */ year) => {
			const eid = calculateEidAlFitr(year);
			return new Date(eid.getTime() + 24 * 60 * 60 * 1000);
		},
	}),

	// Eid al-Adha
	new HolidayDefinition({
		name: "Hari Raya Aidiladha",
		type: "calculated",
		workFree: true,
		calculator: (/** @type {number} */ year) => calculateEidAlAdha(year),
	}),

	// National Day
	new HolidayDefinition({
		name: "National Day",
		type: "fixed",
		month: 8,
		day: 31,
		workFree: true,
	}),

	// Malaysia Day
	new HolidayDefinition({
		name: "Malaysia Day",
		type: "fixed",
		month: 9,
		day: 16,
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

// State-specific holidays
const REGIONAL_HOLIDAYS = {
	// Johor
	JHR: [
		new HolidayDefinition({
			name: "Sultan of Johor's Birthday",
			type: "fixed",
			month: 3,
			day: 23,
			workFree: true,
		}),
		new HolidayDefinition({
			name: "Thaipusam",
			type: "calculated",
			workFree: true,
			calculator: (/** @type {number} */ year) =>
				new Date(Date.UTC(year, 0, 25)), // Simplified
		}),
	],

	// Kedah
	KDH: [
		new HolidayDefinition({
			name: "Sultan of Kedah's Birthday",
			type: "fixed",
			month: 6,
			day: 15,
			workFree: true,
		}),
	],

	// Kelantan
	KTN: [
		new HolidayDefinition({
			name: "Sultan of Kelantan's Birthday",
			type: "fixed",
			month: 9,
			day: 29,
			workFree: true,
		}),
		new HolidayDefinition({
			name: "Kelantan Day",
			type: "fixed",
			month: 8,
			day: 19,
			workFree: true,
		}),
	],

	// Malacca
	MLK: [
		new HolidayDefinition({
			name: "Declaration of Malacca as Historical City",
			type: "fixed",
			month: 4,
			day: 15,
			workFree: true,
		}),
	],

	// Negeri Sembilan
	NSN: [
		new HolidayDefinition({
			name: "Yang di-Pertuan Besar of Negeri Sembilan's Birthday",
			type: "fixed",
			month: 1,
			day: 14,
			workFree: true,
		}),
	],

	// Pahang
	PHG: [
		new HolidayDefinition({
			name: "Sultan of Pahang's Birthday",
			type: "fixed",
			month: 10,
			day: 24,
			workFree: true,
		}),
	],

	// Penang
	PNG: [
		new HolidayDefinition({
			name: "Penang Governor's Birthday",
			type: "calculated", // Second Saturday in July
			workFree: true,
			calculator: (/** @type {number} */ year) => {
				const jul1 = new Date(Date.UTC(year, 6, 1));
				const dayOfWeek = jul1.getUTCDay();
				const firstSaturday = dayOfWeek === 6 ? 1 : ((6 - dayOfWeek) % 7) + 1;
				return new Date(Date.UTC(year, 6, firstSaturday + 7));
			},
		}),
		new HolidayDefinition({
			name: "Thaipusam",
			type: "calculated",
			workFree: true,
			calculator: (/** @type {number} */ year) =>
				new Date(Date.UTC(year, 0, 25)), // Simplified
		}),
	],

	// Perak
	PRK: [
		new HolidayDefinition({
			name: "Sultan of Perak's Birthday",
			type: "fixed",
			month: 11,
			day: 1,
			workFree: true,
		}),
	],

	// Perlis
	PLS: [
		new HolidayDefinition({
			name: "Raja of Perlis's Birthday",
			type: "fixed",
			month: 5,
			day: 17,
			workFree: true,
		}),
	],

	// Sabah
	SBH: [
		new HolidayDefinition({
			name: "Head of State of Sabah's Birthday",
			type: "calculated", // First Saturday in October
			workFree: true,
			calculator: (/** @type {number} */ year) => {
				const oct1 = new Date(Date.UTC(year, 9, 1));
				const dayOfWeek = oct1.getUTCDay();
				const firstSaturday = dayOfWeek === 6 ? 1 : ((6 - dayOfWeek) % 7) + 1;
				return new Date(Date.UTC(year, 9, firstSaturday));
			},
		}),
		new HolidayDefinition({
			name: "Good Friday",
			type: "easter_relative",
			offset: -2,
			workFree: true,
		}),
	],

	// Sarawak
	SWK: [
		new HolidayDefinition({
			name: "Sarawak Day",
			type: "fixed",
			month: 7,
			day: 22,
			workFree: true,
		}),
		new HolidayDefinition({
			name: "Good Friday",
			type: "easter_relative",
			offset: -2,
			workFree: true,
		}),
	],

	// Selangor
	SGR: [
		new HolidayDefinition({
			name: "Sultan of Selangor's Birthday",
			type: "fixed",
			month: 12,
			day: 11,
			workFree: true,
		}),
		new HolidayDefinition({
			name: "Thaipusam",
			type: "calculated",
			workFree: true,
			calculator: (/** @type {number} */ year) =>
				new Date(Date.UTC(year, 0, 25)), // Simplified
		}),
	],

	// Terengganu
	TRG: [
		new HolidayDefinition({
			name: "Sultan of Terengganu's Birthday",
			type: "fixed",
			month: 3,
			day: 4,
			workFree: true,
		}),
		new HolidayDefinition({
			name: "Terengganu Day",
			type: "fixed",
			month: 8,
			day: 21,
			workFree: true,
		}),
	],
};

// Freeze holiday arrays to prevent modification
Object.freeze(NATIONAL_HOLIDAYS);
for (const holidays of Object.values(REGIONAL_HOLIDAYS)) {
	Object.freeze(holidays);
}
Object.freeze(REGIONAL_HOLIDAYS);

export const MY = {
	national: NATIONAL_HOLIDAYS,
	regional: REGIONAL_HOLIDAYS,
};

Object.freeze(MY);
