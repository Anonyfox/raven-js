/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Austrian holiday definitions - federal and state holiday patterns.
 *
 * Austria's federal holiday system with 9 states (Bundesländer), each having
 * some regional variations. The murder remembers Austria's Catholic traditions
 * and state-specific observances across the Alpine confederation.
 */

import { HolidayDefinition } from "../holiday-definition.js";

/**
 * Austrian national holidays observed across all states.
 * Core federal holidays recognized throughout the Republic.
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
		name: "Heilige Drei Könige",
		type: "fixed",
		month: 1,
		day: 6,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Ostermontag",
		type: "easter_relative",
		offset: 1,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Staatsfeiertag",
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
		name: "Fronleichnam",
		type: "easter_relative",
		offset: 60,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Mariä Himmelfahrt",
		type: "fixed",
		month: 8,
		day: 15,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Nationalfeiertag",
		type: "fixed",
		month: 10,
		day: 26,
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
		name: "Mariä Empfängnis",
		type: "fixed",
		month: 12,
		day: 8,
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
		name: "Stefanitag",
		type: "fixed",
		month: 12,
		day: 26,
		workFree: true,
	}),
];

/**
 * Austrian state holidays by state abbreviation.
 * Some states have additional observances beyond federal holidays.
 */
const STATE_HOLIDAYS = {
	// Burgenland
	B: [
		new HolidayDefinition({
			name: "Sankt Martin",
			type: "fixed",
			month: 11,
			day: 11,
			workFree: false,
		}),
	],

	// Kärnten (Carinthia)
	K: [
		new HolidayDefinition({
			name: "Tag der Volksabstimmung",
			type: "fixed",
			month: 10,
			day: 10,
			workFree: false,
		}),
		new HolidayDefinition({
			name: "Sankt Josef",
			type: "fixed",
			month: 3,
			day: 19,
			workFree: false,
		}),
	],

	// Niederösterreich (Lower Austria)
	N: [
		new HolidayDefinition({
			name: "Sankt Leopold",
			type: "fixed",
			month: 11,
			day: 15,
			workFree: false,
		}),
	],

	// Oberösterreich (Upper Austria)
	O: [
		new HolidayDefinition({
			name: "Sankt Florian",
			type: "fixed",
			month: 5,
			day: 4,
			workFree: false,
		}),
	],

	// Salzburg
	S: [
		new HolidayDefinition({
			name: "Sankt Rupert",
			type: "fixed",
			month: 9,
			day: 24,
			workFree: false,
		}),
	],

	// Steiermark (Styria)
	ST: [
		new HolidayDefinition({
			name: "Sankt Josef",
			type: "fixed",
			month: 3,
			day: 19,
			workFree: false,
		}),
	],

	// Tirol (Tyrol)
	T: [
		new HolidayDefinition({
			name: "Sankt Josef",
			type: "fixed",
			month: 3,
			day: 19,
			workFree: false,
		}),
		new HolidayDefinition({
			name: "Herz-Jesu-Fest",
			type: "easter_relative",
			offset: 68,
			workFree: false,
		}),
	],

	// Vorarlberg
	V: [
		new HolidayDefinition({
			name: "Sankt Josef",
			type: "fixed",
			month: 3,
			day: 19,
			workFree: false,
		}),
	],

	// Wien (Vienna) - no additional state holidays
	/** @type {import('../holiday-definition.js').HolidayDefinition[]} */
	W: [],
};

// Freeze holiday arrays to prevent modification
Object.freeze(NATIONAL_HOLIDAYS);
for (const holidays of Object.values(STATE_HOLIDAYS)) {
	Object.freeze(holidays);
}

/**
 * Austrian holiday definitions with federal and state variations.
 *
 * Austria has 13 official federal holidays, with some states adding regional
 * observances. The system reflects Austria's strong Catholic heritage and
 * federal state structure.
 *
 * @example
 * // Import Austrian holidays
 * import { AT } from '@raven-js/cortex/temporal/countries/AT';
 * const holidays = calculateHolidaysOfYear(AT, { year: 2024, region: 'W' });
 */
export const AT = {
	national: NATIONAL_HOLIDAYS,
	regional: STATE_HOLIDAYS,
};

Object.freeze(AT);
