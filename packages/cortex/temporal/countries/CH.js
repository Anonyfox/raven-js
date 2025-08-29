/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Swiss holiday definitions - federal and cantonal holiday patterns.
 *
 * Switzerland's complex federal holiday system with 26 cantons, each having
 * different holiday observances. The murder remembers Switzerland's precise
 * bureaucratic traditions across linguistic and cultural boundaries.
 *
 * Swiss holidays follow both Christian traditions and unique cantonal customs,
 * with some holidays observed only in specific linguistic regions.
 */

import { HolidayDefinition } from "../holiday-definition.js";

/**
 * Swiss national holidays observed across all cantons.
 * Core federal holidays recognized throughout the Confederation.
 */
const NATIONAL_HOLIDAYS = [
	new HolidayDefinition({
		name: "Neujahr",
		type: "fixed",
		month: 1,
		day: 1,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Karfreitag",
		type: "easter_relative",
		offset: -2,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Ostermontag",
		type: "easter_relative",
		offset: 1,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Tag der Arbeit",
		type: "fixed",
		month: 5,
		day: 1,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Christi Himmelfahrt",
		type: "easter_relative",
		offset: 39,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Pfingstmontag",
		type: "easter_relative",
		offset: 50,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Schweizer Bundesfeiertag",
		type: "fixed",
		month: 8,
		day: 1,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Weihnachtstag",
		type: "fixed",
		month: 12,
		day: 25,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Stephanstag",
		type: "fixed",
		month: 12,
		day: 26,
		workFree: true,
	}),
];

/**
 * Swiss cantonal holidays by canton abbreviation.
 * Each canton has its own additional holidays beyond federal ones.
 */
const CANTONAL_HOLIDAYS = {
	// Zurich
	ZH: [
		new HolidayDefinition({
			name: "Berchtoldstag",
			type: "fixed",
			month: 1,
			day: 2,
			workFree: true,
		}),
		new HolidayDefinition({
			name: "Sechseläuten",
			type: "calculated",
			workFree: false,
			calculator: (/** @type {number} */ year) => {
				// Third Monday in April
				const april1 = new Date(Date.UTC(year, 3, 1));
				const dayOfWeek = april1.getUTCDay();
				const mondayOffset = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
				return new Date(Date.UTC(year, 3, mondayOffset + 14));
			},
		}),
	],

	// Bern
	BE: [
		new HolidayDefinition({
			name: "Berchtoldstag",
			type: "fixed",
			month: 1,
			day: 2,
			workFree: true,
		}),
	],

	// Basel-Stadt
	BS: [
		new HolidayDefinition({
			name: "Heilige Drei Könige",
			type: "fixed",
			month: 1,
			day: 6,
			workFree: true,
		}),
		new HolidayDefinition({
			name: "Fasnacht Montag",
			type: "easter_relative",
			offset: -48,
			workFree: true,
		}),
		new HolidayDefinition({
			name: "Fasnacht Dienstag",
			type: "easter_relative",
			offset: -47,
			workFree: true,
		}),
	],

	// Geneva
	GE: [
		new HolidayDefinition({
			name: "Restauration Genevoise",
			type: "fixed",
			month: 12,
			day: 31,
			workFree: true,
		}),
		new HolidayDefinition({
			name: "Jeûne Genevois",
			type: "calculated",
			workFree: true,
			calculator: (/** @type {number} */ year) => {
				// First Thursday after first Sunday in September
				const september1 = new Date(Date.UTC(year, 8, 1));
				const dayOfWeek = september1.getUTCDay();
				const firstSunday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
				return new Date(Date.UTC(year, 8, firstSunday + 4));
			},
		}),
	],

	// Vaud
	VD: [
		new HolidayDefinition({
			name: "Berchtoldstag",
			type: "fixed",
			month: 1,
			day: 2,
			workFree: true,
		}),
		new HolidayDefinition({
			name: "Jeûne Fédéral",
			type: "calculated",
			workFree: true,
			calculator: (/** @type {number} */ year) => {
				// Third Sunday in September
				const september1 = new Date(Date.UTC(year, 8, 1));
				const dayOfWeek = september1.getUTCDay();
				const firstSunday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
				return new Date(Date.UTC(year, 8, firstSunday + 14));
			},
		}),
	],

	// Ticino
	TI: [
		new HolidayDefinition({
			name: "Heilige Drei Könige",
			type: "fixed",
			month: 1,
			day: 6,
			workFree: true,
		}),
		new HolidayDefinition({
			name: "San Giuseppe",
			type: "fixed",
			month: 3,
			day: 19,
			workFree: true,
		}),
		new HolidayDefinition({
			name: "Fronleichnam",
			type: "easter_relative",
			offset: 60,
			workFree: true,
		}),
		new HolidayDefinition({
			name: "Santi Pietro e Paolo",
			type: "fixed",
			month: 6,
			day: 29,
			workFree: true,
		}),
		new HolidayDefinition({
			name: "Assunzione",
			type: "fixed",
			month: 8,
			day: 15,
			workFree: true,
		}),
		new HolidayDefinition({
			name: "Ognissanti",
			type: "fixed",
			month: 11,
			day: 1,
			workFree: true,
		}),
		new HolidayDefinition({
			name: "Immacolata Concezione",
			type: "fixed",
			month: 12,
			day: 8,
			workFree: true,
		}),
	],
};

// Freeze holiday arrays to prevent modification
Object.freeze(NATIONAL_HOLIDAYS);
for (const holidays of Object.values(CANTONAL_HOLIDAYS)) {
	Object.freeze(holidays);
}

/**
 * Swiss holiday definitions with federal and cantonal variations.
 *
 * Switzerland has 8 official federal holidays, with cantons adding their own.
 * The complex federal system means each canton can have different observances,
 * reflecting Switzerland's linguistic and cultural diversity.
 *
 * @example
 * // Import Swiss holidays
 * import { CH } from '@raven-js/cortex/temporal/countries/CH';
 * const holidays = calculateHolidaysOfYear(CH, { year: 2024, region: 'ZH' });
 */
export const CH = {
	national: NATIONAL_HOLIDAYS,
	regional: CANTONAL_HOLIDAYS,
};

Object.freeze(CH);
