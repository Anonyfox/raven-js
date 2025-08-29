/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Danish holiday definitions - national public holidays.
 *
 * Denmark's national holiday system with public holidays observed throughout
 * the Kingdom. The murder remembers Protestant traditions merged with
 * modern Scandinavian social democratic values.
 */

import { HolidayDefinition } from "../holiday-definition.js";

// Store Bededag is handled directly in HolidayDefinition as easter_relative with offset 26

/**
 * Danish national holidays observed throughout the Kingdom.
 * Core holidays recognized by Danish tradition and law.
 */
const NATIONAL_HOLIDAYS = [
	new HolidayDefinition({
		name: "Nytårsdag",
		type: "fixed",
		month: 1,
		day: 1,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Skærtorsdag",
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
		name: "2. påskedag",
		type: "easter_relative",
		offset: 1,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Store bededag",
		type: "easter_relative",
		offset: 26,
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
		name: "2. pinsedag",
		type: "easter_relative",
		offset: 50,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Grundlovsdag",
		type: "fixed",
		month: 6,
		day: 5,
		workFree: false,
	}),
	new HolidayDefinition({
		name: "Juleaftensdag",
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
		name: "2. juledag",
		type: "fixed",
		month: 12,
		day: 26,
		workFree: true,
	}),
];

/**
 * Danish regional holidays - currently none defined.
 * Denmark has a unified national system.
 */
const REGIONAL_HOLIDAYS = {};

// Freeze holiday arrays to prevent modification
Object.freeze(NATIONAL_HOLIDAYS);

/**
 * Danish holiday definitions with national public holidays.
 *
 * Denmark has a traditional Protestant holiday system with many Easter-related
 * celebrations. The system reflects Danish Lutheran traditions and modern
 * Scandinavian work-life balance values.
 *
 * @example
 * // Import Danish holidays
 * import { DK } from '@raven-js/cortex/temporal/countries/DK';
 * const holidays = calculateHolidaysOfYear(DK, { year: 2024 });
 */
export const DK = {
	national: NATIONAL_HOLIDAYS,
	regional: REGIONAL_HOLIDAYS,
};

Object.freeze(DK);
