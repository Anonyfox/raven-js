/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Belgian holiday definitions - national and regional holiday patterns.
 *
 * Belgium's federal holiday system with national holidays and some regional
 * variations. The murder remembers Catholic traditions, linguistic divisions,
 * and complex federal arrangements.
 */

import { HolidayDefinition } from "../holiday-definition.js";

/**
 * Belgian national holidays observed across all regions.
 * Core holidays recognized throughout the federal Kingdom.
 */
const NATIONAL_HOLIDAYS = [
	new HolidayDefinition({
		name: "Nieuwjaar",
		type: "fixed",
		month: 1,
		day: 1,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Paasmaandag",
		type: "easter_relative",
		offset: 1,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Dag van de Arbeid",
		type: "fixed",
		month: 5,
		day: 1,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Hemelvaart",
		type: "easter_relative",
		offset: 39,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Pinkstermaandag",
		type: "easter_relative",
		offset: 50,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Nationale Feestdag",
		type: "fixed",
		month: 7,
		day: 21,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Onze-Lieve-Vrouw-Hemelvaart",
		type: "fixed",
		month: 8,
		day: 15,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Allerheiligen",
		type: "fixed",
		month: 11,
		day: 1,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Wapenstilstand",
		type: "fixed",
		month: 11,
		day: 11,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Kerstmis",
		type: "fixed",
		month: 12,
		day: 25,
		workFree: true,
	}),
];

/**
 * Belgian regional holidays by region/community.
 * Some communities have additional observances.
 */
const REGIONAL_HOLIDAYS = {
	// German-speaking community
	DG: [
		new HolidayDefinition({
			name: "Heilige Drei Könige",
			type: "fixed",
			month: 1,
			day: 6,
			workFree: false,
		}),
		new HolidayDefinition({
			name: "Rosenmontag",
			type: "easter_relative",
			offset: -48,
			workFree: false,
		}),
		new HolidayDefinition({
			name: "Fronleichnam",
			type: "easter_relative",
			offset: 60,
			workFree: false,
		}),
	],

	// Some municipalities observe local patron saints
	LOCAL: [
		new HolidayDefinition({
			name: "Sint-Pietersdag",
			type: "fixed",
			month: 6,
			day: 29,
			workFree: false,
		}),
		new HolidayDefinition({
			name: "Sint-Baafsdag",
			type: "fixed",
			month: 10,
			day: 1,
			workFree: false,
		}),
	],
};

// Freeze holiday arrays to prevent modification
Object.freeze(NATIONAL_HOLIDAYS);
for (const holidays of Object.values(REGIONAL_HOLIDAYS)) {
	Object.freeze(holidays);
}

/**
 * Belgian holiday definitions with national and regional variations.
 *
 * Belgium has 10 official national holidays, with the German-speaking
 * community adding some additional observances. The system reflects
 * Belgium's Catholic heritage and complex federal structure.
 *
 * @example
 * // Import Belgian holidays
 * import { BE } from '@raven-js/cortex/temporal/countries/BE';
 * const holidays = calculateHolidaysOfYear(BE, { year: 2024, region: 'DG' });
 */
export const BE = {
	national: NATIONAL_HOLIDAYS,
	regional: REGIONAL_HOLIDAYS,
};

Object.freeze(BE);
