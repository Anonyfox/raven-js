/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Chinese holiday definitions with lunar calendar support
 *
 * China uses both Gregorian and lunar calendars. Key features:
 * - Spring Festival (Chinese New Year) - most important holiday
 * - National Day Golden Week - October 1-7
 * - Traditional lunar holidays with modern work-free status
 * - Regional variations for ethnic autonomous regions
 */

import { HolidayDefinition } from "../holiday-definition.js";

/**
 * Calculate Chinese New Year (Spring Festival) date.
 * Note: This is a simplified calculation. Real implementation would need
 * comprehensive lunar calendar library for precise dates.
 * @param {number} year - Gregorian year
 * @returns {Date} Spring Festival date
 */
function calculateSpringFestival(year) {
	// Simplified Spring Festival dates (real implementation needs lunar calendar)
	/** @type {Record<number, Date>} */
	const springFestivalDates = {
		2024: new Date(Date.UTC(year, 1, 10)), // Feb 10
		2025: new Date(Date.UTC(year, 0, 29)), // Jan 29
		2026: new Date(Date.UTC(year, 1, 17)), // Feb 17
		2027: new Date(Date.UTC(year, 1, 6)), // Feb 6
		2028: new Date(Date.UTC(year, 0, 26)), // Jan 26
		2029: new Date(Date.UTC(year, 1, 13)), // Feb 13
		2030: new Date(Date.UTC(year, 1, 3)), // Feb 3
	};

	return springFestivalDates[year] || new Date(Date.UTC(year, 1, 10)); // fallback
}

/**
 * Calculate Qingming Festival (Tomb Sweeping Day).
 * Usually April 4-6, determined by solar calendar.
 * @param {number} year - Year to calculate for
 * @returns {Date} Qingming Festival date
 */
function calculateQingmingFestival(year) {
	// Qingming is usually April 4-6, based on solar terms
	return new Date(Date.UTC(year, 3, 4)); // April 4 (simplified)
}

/**
 * Calculate Mid-Autumn Festival.
 * 15th day of 8th lunar month.
 * @param {number} year - Year to calculate for
 * @returns {Date} Mid-Autumn Festival date
 */
function calculateMidAutumnFestival(year) {
	// Simplified Mid-Autumn Festival dates
	/** @type {Record<number, Date>} */
	const midAutumnDates = {
		2024: new Date(Date.UTC(year, 8, 17)), // Sep 17
		2025: new Date(Date.UTC(year, 9, 6)), // Oct 6
		2026: new Date(Date.UTC(year, 8, 25)), // Sep 25
		2027: new Date(Date.UTC(year, 8, 15)), // Sep 15
		2028: new Date(Date.UTC(year, 9, 3)), // Oct 3
		2029: new Date(Date.UTC(year, 8, 22)), // Sep 22
		2030: new Date(Date.UTC(year, 8, 12)), // Sep 12
	};

	return midAutumnDates[year] || new Date(Date.UTC(year, 8, 17)); // fallback
}

// National holidays observed throughout mainland China
const NATIONAL_HOLIDAYS = [
	// New Year's Day
	new HolidayDefinition({
		name: "元旦",
		type: "fixed",
		month: 1,
		day: 1,
		workFree: true,
	}),

	// Spring Festival (Chinese New Year) - most important holiday
	new HolidayDefinition({
		name: "春节",
		type: "calculated",
		workFree: true,
		calculator: (/** @type {number} */ year) => calculateSpringFestival(year),
	}),

	// Qingming Festival (Tomb Sweeping Day)
	new HolidayDefinition({
		name: "清明节",
		type: "calculated",
		workFree: true,
		calculator: (/** @type {number} */ year) => calculateQingmingFestival(year),
	}),

	// Labor Day
	new HolidayDefinition({
		name: "劳动节",
		type: "fixed",
		month: 5,
		day: 1,
		workFree: true,
	}),

	// Dragon Boat Festival (5th day of 5th lunar month)
	new HolidayDefinition({
		name: "端午节",
		type: "calculated",
		workFree: true,
		calculator: (/** @type {number} */ year) => {
			// Simplified Dragon Boat Festival dates
			/** @type {Record<number, Date>} */
			const dragonBoatDates = {
				2024: new Date(Date.UTC(year, 5, 10)), // Jun 10
				2025: new Date(Date.UTC(year, 4, 31)), // May 31
				2026: new Date(Date.UTC(year, 5, 19)), // Jun 19
				2027: new Date(Date.UTC(year, 5, 9)), // Jun 9
				2028: new Date(Date.UTC(year, 4, 28)), // May 28
				2029: new Date(Date.UTC(year, 5, 16)), // Jun 16
				2030: new Date(Date.UTC(year, 5, 5)), // Jun 5
			};
			return dragonBoatDates[year] || new Date(Date.UTC(year, 5, 10));
		},
	}),

	// Mid-Autumn Festival
	new HolidayDefinition({
		name: "中秋节",
		type: "calculated",
		workFree: true,
		calculator: (/** @type {number} */ year) =>
			calculateMidAutumnFestival(year),
	}),

	// National Day (founding of PRC)
	new HolidayDefinition({
		name: "国庆节",
		type: "fixed",
		month: 10,
		day: 1,
		workFree: true,
	}),
];

// Regional holidays for autonomous regions and special administrative regions
const REGIONAL_HOLIDAYS = {
	// Tibet Autonomous Region
	XZ: [
		new HolidayDefinition({
			name: "藏历新年",
			type: "calculated",
			workFree: true,
			calculator: (/** @type {number} */ year) => {
				// Tibetan New Year (Losar) - usually 1 month before Chinese New Year
				const springFestival = calculateSpringFestival(year);
				return new Date(springFestival.getTime() - 30 * 24 * 60 * 60 * 1000);
			},
		}),
		new HolidayDefinition({
			name: "雪顿节",
			type: "fixed", // Shoton Festival - August 30
			month: 8,
			day: 30,
			workFree: false,
		}),
	],

	// Xinjiang Uyghur Autonomous Region
	XJ: [
		new HolidayDefinition({
			name: "古尔邦节",
			type: "calculated", // Eid al-Adha (Islamic holiday)
			workFree: true,
			calculator: (/** @type {number} */ year) => {
				// Simplified Eid al-Adha dates (Islamic lunar calendar)
				/** @type {Record<number, Date>} */
				const eidDates = {
					2024: new Date(Date.UTC(year, 5, 16)), // Jun 16
					2025: new Date(Date.UTC(year, 5, 6)), // Jun 6
					2026: new Date(Date.UTC(year, 4, 26)), // May 26
					2027: new Date(Date.UTC(year, 4, 16)), // May 16
				};
				return eidDates[year] || new Date(Date.UTC(year, 5, 16));
			},
		}),
		new HolidayDefinition({
			name: "开斋节",
			type: "calculated", // Eid al-Fitr
			workFree: true,
			calculator: (/** @type {number} */ year) => {
				// Simplified Eid al-Fitr dates
				/** @type {Record<number, Date>} */
				const eidDates = {
					2024: new Date(Date.UTC(year, 3, 10)), // Apr 10
					2025: new Date(Date.UTC(year, 2, 31)), // Mar 31
					2026: new Date(Date.UTC(year, 2, 20)), // Mar 20
					2027: new Date(Date.UTC(year, 2, 10)), // Mar 10
				};
				return eidDates[year] || new Date(Date.UTC(year, 3, 10));
			},
		}),
	],

	// Inner Mongolia Autonomous Region
	NM: [
		new HolidayDefinition({
			name: "那达慕大会",
			type: "fixed", // Naadam Festival
			month: 7,
			day: 11,
			workFree: false,
		}),
	],

	// Hong Kong SAR (additional to national holidays)
	HK: [
		new HolidayDefinition({
			name: "Good Friday",
			type: "easter_relative",
			offset: -2,
			workFree: true,
		}),
		new HolidayDefinition({
			name: "Easter Monday",
			type: "easter_relative",
			offset: 1,
			workFree: true,
		}),
		new HolidayDefinition({
			name: "Buddha's Birthday",
			type: "calculated",
			workFree: true,
			calculator: (/** @type {number} */ year) => {
				// 8th day of 4th lunar month
				return new Date(Date.UTC(year, 4, 15)); // Simplified
			},
		}),
		new HolidayDefinition({
			name: "HKSAR Establishment Day",
			type: "fixed",
			month: 7,
			day: 1,
			workFree: true,
		}),
	],

	// Macau SAR
	MO: [
		new HolidayDefinition({
			name: "Macau SAR Establishment Day",
			type: "fixed",
			month: 12,
			day: 20,
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

export const CN = {
	national: NATIONAL_HOLIDAYS,
	regional: REGIONAL_HOLIDAYS,
};

Object.freeze(CN);
