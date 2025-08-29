/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Polish holiday definitions - national public holidays.
 *
 * Poland's national holiday system with public holidays observed throughout
 * the Republic. The murder remembers Poland's deep Catholic traditions,
 * historical struggles for independence, and modern democratic celebrations.
 */

import { HolidayDefinition } from "../holiday-definition.js";

/**
 * Polish national holidays observed throughout the Republic.
 * Core holidays recognized by Polish law and tradition.
 */
const NATIONAL_HOLIDAYS = [
	new HolidayDefinition({
		name: "Nowy Rok",
		type: "fixed",
		month: 1,
		day: 1,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Święto Trzech Króli",
		type: "fixed",
		month: 1,
		day: 6,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Wielkanoc",
		type: "easter_relative",
		offset: 0,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Poniedziałek Wielkanocny",
		type: "easter_relative",
		offset: 1,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Święto Pracy",
		type: "fixed",
		month: 5,
		day: 1,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Święto Konstytucji 3 Maja",
		type: "fixed",
		month: 5,
		day: 3,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Zielone Świątki",
		type: "easter_relative",
		offset: 49,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Boże Ciało",
		type: "easter_relative",
		offset: 60,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Wniebowzięcie Najświętszej Maryi Panny",
		type: "fixed",
		month: 8,
		day: 15,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Wszystkich Świętych",
		type: "fixed",
		month: 11,
		day: 1,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Święto Niepodległości",
		type: "fixed",
		month: 11,
		day: 11,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Boże Narodzenie",
		type: "fixed",
		month: 12,
		day: 25,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Święty Szczepan",
		type: "fixed",
		month: 12,
		day: 26,
		workFree: true,
	}),
];

/**
 * Polish regional holidays - currently none defined.
 * Poland has a unified national system with no regional variations.
 */
const REGIONAL_HOLIDAYS = {};

// Freeze holiday arrays to prevent modification
Object.freeze(NATIONAL_HOLIDAYS);

/**
 * Polish holiday definitions with national public holidays.
 *
 * Poland has 13 official public holidays, reflecting the country's strong
 * Catholic heritage and national historical commemorations. The system
 * combines religious observances with patriotic celebrations.
 *
 * @example
 * // Import Polish holidays
 * import { PL } from '@raven-js/cortex/temporal/countries/PL';
 * const holidays = calculateHolidaysOfYear(PL, { year: 2024 });
 */
export const PL = {
	national: NATIONAL_HOLIDAYS,
	regional: REGIONAL_HOLIDAYS,
};

Object.freeze(PL);
