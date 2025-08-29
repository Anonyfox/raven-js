/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Indian holiday definitions with Hindu calendar and regional diversity
 *
 * India has complex holiday system with:
 * - National holidays (gazetted holidays)
 * - Hindu calendar-based festivals
 * - Regional state-specific holidays
 * - Religious diversity (Hindu, Islamic, Sikh, Christian, Buddhist)
 * - Multiple languages and cultural traditions
 */

import { HolidayDefinition } from "../holiday-definition.js";

/**
 * Calculate Diwali (Festival of Lights).
 * New moon day in Hindu month of Kartik (October/November).
 * @param {number} year - Year to calculate for
 * @returns {Date} Diwali date
 */
function calculateDiwali(year) {
	// Simplified Diwali dates (Hindu lunar calendar)
	/** @type {Record<number, Date>} */
	const diwaliDates = {
		2024: new Date(Date.UTC(year, 10, 1)), // Nov 1
		2025: new Date(Date.UTC(year, 9, 20)), // Oct 20
		2026: new Date(Date.UTC(year, 10, 8)), // Nov 8
		2027: new Date(Date.UTC(year, 9, 29)), // Oct 29
		2028: new Date(Date.UTC(year, 10, 17)), // Nov 17
		2029: new Date(Date.UTC(year, 10, 5)), // Nov 5
		2030: new Date(Date.UTC(year, 9, 26)), // Oct 26
	};

	return diwaliDates[year] || new Date(Date.UTC(year, 10, 1)); // fallback
}

/**
 * Calculate Holi (Festival of Colors).
 * Full moon day in Hindu month of Phalguna (February/March).
 * @param {number} year - Year to calculate for
 * @returns {Date} Holi date
 */
function calculateHoli(year) {
	// Simplified Holi dates
	/** @type {Record<number, Date>} */
	const holiDates = {
		2024: new Date(Date.UTC(year, 2, 25)), // Mar 25
		2025: new Date(Date.UTC(year, 2, 14)), // Mar 14
		2026: new Date(Date.UTC(year, 2, 3)), // Mar 3
		2027: new Date(Date.UTC(year, 2, 22)), // Mar 22
		2028: new Date(Date.UTC(year, 2, 11)), // Mar 11
		2029: new Date(Date.UTC(year, 1, 28)), // Feb 28
		2030: new Date(Date.UTC(year, 2, 20)), // Mar 20
	};

	return holiDates[year] || new Date(Date.UTC(year, 2, 25)); // fallback
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
		2024: new Date(Date.UTC(year, 3, 11)), // Apr 11
		2025: new Date(Date.UTC(year, 2, 31)), // Mar 31
		2026: new Date(Date.UTC(year, 2, 20)), // Mar 20
		2027: new Date(Date.UTC(year, 2, 10)), // Mar 10
		2028: new Date(Date.UTC(year, 1, 26)), // Feb 26
		2029: new Date(Date.UTC(year, 1, 15)), // Feb 15
		2030: new Date(Date.UTC(year, 1, 5)), // Feb 5
	};

	return eidDates[year] || new Date(Date.UTC(year, 3, 11)); // fallback
}

// National holidays (gazetted holidays observed across India)
const NATIONAL_HOLIDAYS = [
	// Republic Day
	new HolidayDefinition({
		name: "Republic Day",
		type: "fixed",
		month: 1,
		day: 26,
		workFree: true,
	}),

	// Independence Day
	new HolidayDefinition({
		name: "Independence Day",
		type: "fixed",
		month: 8,
		day: 15,
		workFree: true,
	}),

	// Gandhi Jayanti (Gandhi's Birthday)
	new HolidayDefinition({
		name: "Gandhi Jayanti",
		type: "fixed",
		month: 10,
		day: 2,
		workFree: true,
	}),

	// Diwali (Festival of Lights)
	new HolidayDefinition({
		name: "Diwali",
		type: "calculated",
		workFree: true,
		calculator: (/** @type {number} */ year) => calculateDiwali(year),
	}),

	// Holi (Festival of Colors)
	new HolidayDefinition({
		name: "Holi",
		type: "calculated",
		workFree: true,
		calculator: (/** @type {number} */ year) => calculateHoli(year),
	}),

	// Dussehra (Vijayadashami)
	new HolidayDefinition({
		name: "Dussehra",
		type: "calculated",
		workFree: true,
		calculator: (/** @type {number} */ year) => {
			// 10 days before Diwali (approximately)
			const diwali = calculateDiwali(year);
			return new Date(diwali.getTime() - 20 * 24 * 60 * 60 * 1000);
		},
	}),

	// Eid al-Fitr
	new HolidayDefinition({
		name: "Eid al-Fitr",
		type: "calculated",
		workFree: true,
		calculator: (/** @type {number} */ year) => calculateEidAlFitr(year),
	}),

	// Eid al-Adha
	new HolidayDefinition({
		name: "Eid al-Adha",
		type: "calculated",
		workFree: true,
		calculator: (/** @type {number} */ year) => {
			// ~70 days after Eid al-Fitr
			const eidFitr = calculateEidAlFitr(year);
			return new Date(eidFitr.getTime() + 70 * 24 * 60 * 60 * 1000);
		},
	}),

	// Good Friday
	new HolidayDefinition({
		name: "Good Friday",
		type: "easter_relative",
		offset: -2,
		workFree: true,
	}),

	// Buddha Purnima
	new HolidayDefinition({
		name: "Buddha Purnima",
		type: "calculated",
		workFree: true,
		calculator: (/** @type {number} */ year) => {
			// Full moon in Vaisakha (April/May)
			return new Date(Date.UTC(year, 4, 15)); // Simplified
		},
	}),

	// Guru Nanak Jayanti
	new HolidayDefinition({
		name: "Guru Nanak Jayanti",
		type: "calculated",
		workFree: true,
		calculator: (/** @type {number} */ year) => {
			// Full moon in Kartik (October/November)
			return new Date(Date.UTC(year, 10, 15)); // Simplified
		},
	}),
];

// Regional/State-specific holidays
const REGIONAL_HOLIDAYS = {
	// Maharashtra
	MH: [
		new HolidayDefinition({
			name: "Maharashtra Day",
			type: "fixed",
			month: 5,
			day: 1,
			workFree: true,
		}),
		new HolidayDefinition({
			name: "Gudi Padwa",
			type: "calculated", // Marathi New Year
			workFree: true,
			calculator: (/** @type {number} */ year) =>
				new Date(Date.UTC(year, 2, 22)), // Simplified
		}),
	],

	// Tamil Nadu
	TN: [
		new HolidayDefinition({
			name: "Tamil New Year",
			type: "fixed",
			month: 4,
			day: 14,
			workFree: true,
		}),
		new HolidayDefinition({
			name: "Pongal",
			type: "fixed",
			month: 1,
			day: 14,
			workFree: true,
		}),
	],

	// Kerala
	KL: [
		new HolidayDefinition({
			name: "Onam",
			type: "calculated",
			workFree: true,
			calculator: (/** @type {number} */ year) =>
				new Date(Date.UTC(year, 8, 8)), // Simplified
		}),
		new HolidayDefinition({
			name: "Vishu",
			type: "fixed",
			month: 4,
			day: 14,
			workFree: true,
		}),
	],

	// West Bengal
	WB: [
		new HolidayDefinition({
			name: "Poila Boishakh",
			type: "fixed", // Bengali New Year
			month: 4,
			day: 14,
			workFree: true,
		}),
		new HolidayDefinition({
			name: "Durga Puja",
			type: "calculated",
			workFree: true,
			calculator: (/** @type {number} */ year) => {
				// Usually in September/October
				return new Date(Date.UTC(year, 9, 1)); // Simplified
			},
		}),
	],

	// Punjab
	PB: [
		new HolidayDefinition({
			name: "Baisakhi",
			type: "fixed",
			month: 4,
			day: 13,
			workFree: true,
		}),
		new HolidayDefinition({
			name: "Guru Gobind Singh Jayanti",
			type: "fixed",
			month: 1,
			day: 5,
			workFree: true,
		}),
	],

	// Gujarat
	GJ: [
		new HolidayDefinition({
			name: "Gujarat Day",
			type: "fixed",
			month: 5,
			day: 1,
			workFree: true,
		}),
		new HolidayDefinition({
			name: "Navratri",
			type: "calculated",
			workFree: false, // Festival period, not single day
			calculator: (/** @type {number} */ year) =>
				new Date(Date.UTC(year, 9, 1)), // Simplified
		}),
	],

	// Karnataka
	KA: [
		new HolidayDefinition({
			name: "Karnataka Rajyotsava",
			type: "fixed",
			month: 11,
			day: 1,
			workFree: true,
		}),
		new HolidayDefinition({
			name: "Ugadi",
			type: "calculated", // Kannada New Year
			workFree: true,
			calculator: (/** @type {number} */ year) =>
				new Date(Date.UTC(year, 2, 22)), // Simplified
		}),
	],
};

// Freeze holiday arrays to prevent modification
Object.freeze(NATIONAL_HOLIDAYS);
for (const holidays of Object.values(REGIONAL_HOLIDAYS)) {
	Object.freeze(holidays);
}
Object.freeze(REGIONAL_HOLIDAYS);

export const IN = {
	national: NATIONAL_HOLIDAYS,
	regional: REGIONAL_HOLIDAYS,
};

Object.freeze(IN);
