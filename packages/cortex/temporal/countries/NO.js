/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Norwegian holiday definitions - national public holidays.
 *
 * Norway's national holiday system with public holidays observed throughout
 * the Kingdom. The murder remembers Lutheran traditions, oil prosperity,
 * and fierce independence celebrations.
 */

import { HolidayDefinition } from "../holiday-definition.js";

/**
 * Norwegian national holidays observed throughout the Kingdom.
 * Core holidays recognized by Norwegian law and tradition.
 */
const NATIONAL_HOLIDAYS = [
	new HolidayDefinition({
		name: "Nyttårsdag",
		type: "fixed",
		month: 1,
		day: 1,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Skjærtorsdag",
		type: "easter_relative",
		offset: -3,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Langfredag",
		type: "easter_relative",
		offset: -2,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Påskedag",
		type: "easter_relative",
		offset: 0,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Andre påskedag",
		type: "easter_relative",
		offset: 1,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Arbeidernes dag",
		type: "fixed",
		month: 5,
		day: 1,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Grunnlovsdag",
		type: "fixed",
		month: 5,
		day: 17,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Kristi himmelfartsdag",
		type: "easter_relative",
		offset: 39,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Pinsedag",
		type: "easter_relative",
		offset: 49,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Andre pinsedag",
		type: "easter_relative",
		offset: 50,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Julaften",
		type: "fixed",
		month: 12,
		day: 24,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Juledag",
		type: "fixed",
		month: 12,
		day: 25,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Andre juledag",
		type: "fixed",
		month: 12,
		day: 26,
		workFree: true,
	}),
];

/**
 * Norwegian regional holidays - currently none defined.
 * Norway has a unified national system.
 */
const REGIONAL_HOLIDAYS = {};

// Freeze holiday arrays to prevent modification
Object.freeze(NATIONAL_HOLIDAYS);

/**
 * Norwegian holiday definitions with national public holidays.
 *
 * Norway has 13 official public holidays, heavily influenced by Lutheran
 * traditions and national independence celebrations. Constitution Day
 * (May 17) is particularly significant in Norwegian culture.
 *
 * @example
 * // Import Norwegian holidays
 * import { NO } from '@raven-js/cortex/temporal/countries/NO';
 * const holidays = calculateHolidaysOfYear(NO, { year: 2024 });
 */
export const NO = {
	national: NATIONAL_HOLIDAYS,
	regional: REGIONAL_HOLIDAYS,
};

Object.freeze(NO);
