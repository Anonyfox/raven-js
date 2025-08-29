/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Canadian holiday definitions with federal and provincial complexity
 *
 * Canada has complex federal/provincial holiday system:
 * - Federal holidays observed nationwide
 * - Provincial holidays specific to each province/territory
 * - Different names for same holidays in different provinces
 * - Victoria Day (Monday before May 25)
 * - Thanksgiving (second Monday in October)
 * - Boxing Day traditions
 */

import { HolidayDefinition } from "../holiday-definition.js";

/**
 * Calculate Victoria Day (Monday before May 25).
 * @param {number} year - Year to calculate for
 * @returns {Date} Victoria Day
 */
function calculateVictoriaDay(year) {
	const may25 = new Date(Date.UTC(year, 4, 25));
	const dayOfWeek = may25.getUTCDay();
	// Monday before May 25
	const mondayBefore = 25 - ((dayOfWeek + 6) % 7);
	return new Date(Date.UTC(year, 4, mondayBefore));
}

/**
 * Calculate Thanksgiving (Second Monday in October).
 * @param {number} year - Year to calculate for
 * @returns {Date} Canadian Thanksgiving
 */
function calculateThanksgiving(year) {
	const oct1 = new Date(Date.UTC(year, 9, 1));
	const dayOfWeek = oct1.getUTCDay();
	const firstMonday = dayOfWeek === 1 ? 1 : ((7 - dayOfWeek + 1) % 7) + 1;
	return new Date(Date.UTC(year, 9, firstMonday + 7)); // Second Monday
}

/**
 * Calculate Family Day (Third Monday in February).
 * @param {number} year - Year to calculate for
 * @returns {Date} Family Day
 */
function calculateFamilyDay(year) {
	const feb1 = new Date(Date.UTC(year, 1, 1));
	const dayOfWeek = feb1.getUTCDay();
	const firstMonday = dayOfWeek === 1 ? 1 : ((7 - dayOfWeek + 1) % 7) + 1;
	return new Date(Date.UTC(year, 1, firstMonday + 14)); // Third Monday
}

/**
 * Calculate Civic Holiday (First Monday in August).
 * @param {number} year - Year to calculate for
 * @returns {Date} Civic Holiday
 */
function calculateCivicHoliday(year) {
	const aug1 = new Date(Date.UTC(year, 7, 1));
	const dayOfWeek = aug1.getUTCDay();
	const firstMonday = dayOfWeek === 1 ? 1 : ((7 - dayOfWeek + 1) % 7) + 1;
	return new Date(Date.UTC(year, 7, firstMonday));
}

// Federal holidays observed throughout Canada
const NATIONAL_HOLIDAYS = [
	// New Year's Day
	new HolidayDefinition({
		name: "New Year's Day",
		type: "fixed",
		month: 1,
		day: 1,
		workFree: true,
	}),

	// Good Friday
	new HolidayDefinition({
		name: "Good Friday",
		type: "easter_relative",
		offset: -2,
		workFree: true,
	}),

	// Easter Monday (not federal, but widely observed)
	new HolidayDefinition({
		name: "Easter Monday",
		type: "easter_relative",
		offset: 1,
		workFree: false, // Not federal, provincial in some areas
	}),

	// Victoria Day (Monday before May 25)
	new HolidayDefinition({
		name: "Victoria Day",
		type: "calculated",
		workFree: true,
		calculator: (/** @type {number} */ year) => calculateVictoriaDay(year),
	}),

	// Canada Day (July 1)
	new HolidayDefinition({
		name: "Canada Day",
		type: "fixed",
		month: 7,
		day: 1,
		workFree: true,
	}),

	// Labour Day (First Monday in September)
	new HolidayDefinition({
		name: "Labour Day",
		type: "calculated",
		workFree: true,
		calculator: (/** @type {number} */ year) => {
			const sep1 = new Date(Date.UTC(year, 8, 1));
			const dayOfWeek = sep1.getUTCDay();
			const firstMonday = dayOfWeek === 1 ? 1 : ((7 - dayOfWeek + 1) % 7) + 1;
			return new Date(Date.UTC(year, 8, firstMonday));
		},
	}),

	// National Day for Truth and Reconciliation (September 30)
	new HolidayDefinition({
		name: "National Day for Truth and Reconciliation",
		type: "fixed",
		month: 9,
		day: 30,
		workFree: true, // Federal since 2021
	}),

	// Thanksgiving (Second Monday in October)
	new HolidayDefinition({
		name: "Thanksgiving",
		type: "calculated",
		workFree: true,
		calculator: (/** @type {number} */ year) => calculateThanksgiving(year),
	}),

	// Remembrance Day (November 11)
	new HolidayDefinition({
		name: "Remembrance Day",
		type: "fixed",
		month: 11,
		day: 11,
		workFree: true,
	}),

	// Christmas Day (December 25)
	new HolidayDefinition({
		name: "Christmas Day",
		type: "fixed",
		month: 12,
		day: 25,
		workFree: true,
	}),

	// Boxing Day (December 26)
	new HolidayDefinition({
		name: "Boxing Day",
		type: "fixed",
		month: 12,
		day: 26,
		workFree: true,
	}),
];

// Provincial and territorial holidays
const REGIONAL_HOLIDAYS = {
	// Alberta
	AB: [
		new HolidayDefinition({
			name: "Family Day",
			type: "calculated",
			workFree: true,
			calculator: (/** @type {number} */ year) => calculateFamilyDay(year),
		}),
		new HolidayDefinition({
			name: "Heritage Day",
			type: "calculated",
			workFree: true,
			calculator: (/** @type {number} */ year) => calculateCivicHoliday(year),
		}),
	],

	// British Columbia
	BC: [
		new HolidayDefinition({
			name: "Family Day",
			type: "calculated",
			workFree: true,
			calculator: (/** @type {number} */ year) => calculateFamilyDay(year),
		}),
		new HolidayDefinition({
			name: "British Columbia Day",
			type: "calculated",
			workFree: true,
			calculator: (/** @type {number} */ year) => calculateCivicHoliday(year),
		}),
	],

	// Manitoba
	MB: [
		new HolidayDefinition({
			name: "Louis Riel Day",
			type: "calculated",
			workFree: true,
			calculator: (/** @type {number} */ year) => calculateFamilyDay(year),
		}),
		new HolidayDefinition({
			name: "Terry Fox Day",
			type: "calculated",
			workFree: true,
			calculator: (/** @type {number} */ year) => calculateCivicHoliday(year),
		}),
	],

	// New Brunswick
	NB: [
		new HolidayDefinition({
			name: "New Brunswick Day",
			type: "calculated",
			workFree: true,
			calculator: (/** @type {number} */ year) => calculateCivicHoliday(year),
		}),
	],

	// Newfoundland and Labrador
	NL: [
		new HolidayDefinition({
			name: "St. Patrick's Day",
			type: "fixed",
			month: 3,
			day: 17,
			workFree: true,
		}),
		new HolidayDefinition({
			name: "St. George's Day",
			type: "fixed",
			month: 4,
			day: 23,
			workFree: true,
		}),
		new HolidayDefinition({
			name: "Discovery Day",
			type: "fixed",
			month: 6,
			day: 24,
			workFree: true,
		}),
		new HolidayDefinition({
			name: "Orangemen's Day",
			type: "fixed",
			month: 7,
			day: 12,
			workFree: true,
		}),
	],

	// Northwest Territories
	NT: [
		new HolidayDefinition({
			name: "National Indigenous Peoples Day",
			type: "fixed",
			month: 6,
			day: 21,
			workFree: true,
		}),
	],

	// Nova Scotia
	NS: [
		new HolidayDefinition({
			name: "Nova Scotia Heritage Day",
			type: "calculated",
			workFree: true,
			calculator: (/** @type {number} */ year) => calculateFamilyDay(year),
		}),
	],

	// Nunavut
	NU: [
		new HolidayDefinition({
			name: "Nunavut Day",
			type: "fixed",
			month: 7,
			day: 9,
			workFree: true,
		}),
	],

	// Ontario
	ON: [
		new HolidayDefinition({
			name: "Family Day",
			type: "calculated",
			workFree: true,
			calculator: (/** @type {number} */ year) => calculateFamilyDay(year),
		}),
		new HolidayDefinition({
			name: "Civic Holiday",
			type: "calculated",
			workFree: true,
			calculator: (/** @type {number} */ year) => calculateCivicHoliday(year),
		}),
	],

	// Prince Edward Island
	PE: [
		new HolidayDefinition({
			name: "Islander Day",
			type: "calculated",
			workFree: true,
			calculator: (/** @type {number} */ year) => calculateFamilyDay(year),
		}),
		new HolidayDefinition({
			name: "Civic Holiday",
			type: "calculated",
			workFree: true,
			calculator: (/** @type {number} */ year) => calculateCivicHoliday(year),
		}),
	],

	// Quebec
	QC: [
		new HolidayDefinition({
			name: "Saint-Jean-Baptiste Day",
			type: "fixed",
			month: 6,
			day: 24,
			workFree: true,
		}),
		// Note: Quebec does not observe Remembrance Day as statutory holiday
	],

	// Saskatchewan
	SK: [
		new HolidayDefinition({
			name: "Family Day",
			type: "calculated",
			workFree: true,
			calculator: (/** @type {number} */ year) => calculateFamilyDay(year),
		}),
		new HolidayDefinition({
			name: "Saskatchewan Day",
			type: "calculated",
			workFree: true,
			calculator: (/** @type {number} */ year) => calculateCivicHoliday(year),
		}),
	],

	// Yukon
	YT: [
		new HolidayDefinition({
			name: "Heritage Day",
			type: "calculated",
			workFree: true,
			calculator: (/** @type {number} */ year) => calculateFamilyDay(year),
		}),
		new HolidayDefinition({
			name: "Discovery Day",
			type: "calculated", // Third Monday in August
			workFree: true,
			calculator: (/** @type {number} */ year) => {
				const aug1 = new Date(Date.UTC(year, 7, 1));
				const dayOfWeek = aug1.getUTCDay();
				const firstMonday = dayOfWeek === 1 ? 1 : ((7 - dayOfWeek + 1) % 7) + 1;
				return new Date(Date.UTC(year, 7, firstMonday + 14)); // Third Monday
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

export const CA = {
	national: NATIONAL_HOLIDAYS,
	regional: REGIONAL_HOLIDAYS,
};

Object.freeze(CA);
