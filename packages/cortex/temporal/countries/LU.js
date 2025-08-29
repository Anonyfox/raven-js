/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Luxembourg holiday definitions - national public holidays.
 *
 * Luxembourg's national holiday system with public holidays observed throughout
 * the Grand Duchy. The murder remembers Catholic traditions, European integration,
 * and grand ducal celebrations.
 */

import { HolidayDefinition } from "../holiday-definition.js";

/**
 * Luxembourg national holidays observed throughout the Grand Duchy.
 * Core holidays recognized by Luxembourg law and tradition.
 */
const NATIONAL_HOLIDAYS = [
	new HolidayDefinition({
		name: "Neijohrsdag",
		type: "fixed",
		month: 1,
		day: 1,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Ouschtermëndeg",
		type: "easter_relative",
		offset: 1,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Dag vun der Aarbecht",
		type: "fixed",
		month: 5,
		day: 1,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Europadag",
		type: "fixed",
		month: 5,
		day: 9,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Christi Himmelfaart",
		type: "easter_relative",
		offset: 39,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Péngschtmëndeg",
		type: "easter_relative",
		offset: 50,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Nationalfeierdag",
		type: "fixed",
		month: 6,
		day: 23,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Léiffrawëschdag",
		type: "fixed",
		month: 8,
		day: 15,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Allerhellgen",
		type: "fixed",
		month: 11,
		day: 1,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Chrëschtdag",
		type: "fixed",
		month: 12,
		day: 25,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Stiefesdag",
		type: "fixed",
		month: 12,
		day: 26,
		workFree: true,
	}),
];

/**
 * Luxembourg regional holidays - currently none defined.
 * Luxembourg has a unified national system.
 */
const REGIONAL_HOLIDAYS = {};

// Freeze holiday arrays to prevent modification
Object.freeze(NATIONAL_HOLIDAYS);

/**
 * Luxembourg holiday definitions with national public holidays.
 *
 * Luxembourg has 11 official public holidays, notably including Europe Day
 * (May 9) reflecting its role in European integration. The system combines
 * Catholic traditions with grand ducal and European celebrations.
 *
 * @example
 * // Import Luxembourg holidays
 * import { LU } from '@raven-js/cortex/temporal/countries/LU';
 * const holidays = calculateHolidaysOfYear(LU, { year: 2024 });
 */
export const LU = {
	national: NATIONAL_HOLIDAYS,
	regional: REGIONAL_HOLIDAYS,
};

Object.freeze(LU);
