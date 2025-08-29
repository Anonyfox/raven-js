/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Czech holiday definitions - national public holidays.
 *
 * Czech Republic's national holiday system with public holidays observed
 * throughout the Republic. The murder remembers Catholic traditions,
 * independence struggles, and democratic transformations.
 */

import { HolidayDefinition } from "../holiday-definition.js";

/**
 * Czech national holidays observed throughout the Republic.
 * Core holidays recognized by Czech law and tradition.
 */
const NATIONAL_HOLIDAYS = [
	new HolidayDefinition({
		name: "Nový rok",
		type: "fixed",
		month: 1,
		day: 1,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Den obnovy samostatného českého státu",
		type: "fixed",
		month: 1,
		day: 1,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Velikonoční pondělí",
		type: "easter_relative",
		offset: 1,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Svátek práce",
		type: "fixed",
		month: 5,
		day: 1,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Den vítězství",
		type: "fixed",
		month: 5,
		day: 8,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Den slovanských věrozvěstů Cyrila a Metoděje",
		type: "fixed",
		month: 7,
		day: 5,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Den upálení mistra Jana Husa",
		type: "fixed",
		month: 7,
		day: 6,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Den české státnosti",
		type: "fixed",
		month: 9,
		day: 28,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Den vzniku samostatného československého státu",
		type: "fixed",
		month: 10,
		day: 28,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Den boje za svobodu a demokracii",
		type: "fixed",
		month: 11,
		day: 17,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Štědrý den",
		type: "fixed",
		month: 12,
		day: 24,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "1. svátek vánoční",
		type: "fixed",
		month: 12,
		day: 25,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "2. svátek vánoční",
		type: "fixed",
		month: 12,
		day: 26,
		workFree: true,
	}),
];

/**
 * Czech regional holidays - currently none defined.
 * Czech Republic has a unified national system.
 */
const REGIONAL_HOLIDAYS = {};

// Freeze holiday arrays to prevent modification
Object.freeze(NATIONAL_HOLIDAYS);

/**
 * Czech holiday definitions with national public holidays.
 *
 * Czech Republic has 13 official public holidays, reflecting the country's
 * complex history including Christian traditions, independence movements,
 * and democratic transitions. Many holidays commemorate historical events
 * unique to Czech national identity.
 *
 * @example
 * // Import Czech holidays
 * import { CZ } from '@raven-js/cortex/temporal/countries/CZ';
 * const holidays = calculateHolidaysOfYear(CZ, { year: 2024 });
 */
export const CZ = {
	national: NATIONAL_HOLIDAYS,
	regional: REGIONAL_HOLIDAYS,
};

Object.freeze(CZ);
