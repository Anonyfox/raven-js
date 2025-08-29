/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file German holiday definitions - institutional memory of German bureaucracy
 *
 * Encodes the complex federal holiday system of Germany's 16 Länder (states).
 * Each holiday preserved as a Holiday class instance with precise calculation logic.
 *
 * GERMAN FEDERAL COMPLEXITY:
 * - 9 federal holidays observed nationwide
 * - 16 states with different regional holiday patterns
 * - Catholic vs Protestant denominational differences
 * - East/West reunification historical artifacts
 *
 * Ravens remember: bureaucratic patterns that outlive governments.
 */

import { HolidayDefinition } from "./holiday.js";

/**
 * Calculate Buß- und Bettag (Day of Prayer and Repentance).
 * Falls on the Wednesday before November 23.
 * Only observed as work-free holiday in Sachsen (Saxony).
 *
 * ALGORITHM:
 * 1. Find November 23 of the given year
 * 2. Determine its day of week
 * 3. Calculate the Wednesday before (may be in previous week)
 *
 * INSTITUTIONAL MEMORY:
 * This holiday was abolished as a federal holiday in 1995 to finance
 * long-term care insurance, but Saxony chose to maintain it as a state holiday.
 * A perfect example of political compromise encoded as algorithmic complexity.
 *
 * @param {number} year - Year to calculate for
 * @returns {Date} Date of Buß- und Bettag
 */
function calculateBussUndBettag(year) {
	// November 23 of the given year
	const nov23 = new Date(Date.UTC(year, 10, 23, 0, 0, 0, 0)); // Month 10 = November
	const dayOfWeek = nov23.getUTCDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

	// Calculate days to subtract to get to the previous Wednesday
	// Wednesday = 3, and we want the Wednesday BEFORE November 23 (strictly before)
	let daysBack;
	if (dayOfWeek > 3) {
		// Nov 23 is Thursday, Friday, or Saturday
		daysBack = dayOfWeek - 3; // Go back to Wednesday of same week
	} else {
		// Nov 23 is Sunday, Monday, Tuesday, or Wednesday
		// Go back to Wednesday of previous week
		daysBack = dayOfWeek + 4;
	}

	// Create the Wednesday before November 23
	const bussUndBettag = new Date(Date.UTC(year, 10, 23 - daysBack, 0, 0, 0, 0));
	return bussUndBettag;
}

/**
 * German federal holidays observed in all 16 states.
 * These form the baseline holiday calendar for all of Germany.
 */
export const NATIONAL_HOLIDAYS = [
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
		name: "Tag der Deutschen Einheit",
		type: "fixed",
		month: 10,
		day: 3,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Erster Weihnachtstag",
		type: "fixed",
		month: 12,
		day: 25,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Zweiter Weihnachtstag",
		type: "fixed",
		month: 12,
		day: 26,
		workFree: true,
	}),
];

/**
 * Regional holidays specific to individual German states.
 * Encoding the beautiful complexity of German federalism.
 *
 * STATE CODES:
 * BW = Baden-Württemberg, BY = Bayern (Bavaria), BE = Berlin,
 * BB = Brandenburg, HB = Bremen, HH = Hamburg, HE = Hessen,
 * MV = Mecklenburg-Vorpommern, NI = Niedersachsen, NW = Nordrhein-Westfalen,
 * RP = Rheinland-Pfalz, SL = Saarland, SN = Sachsen (Saxony),
 * ST = Sachsen-Anhalt, SH = Schleswig-Holstein, TH = Thüringen
 */
export const REGIONAL_HOLIDAYS = {
	// Baden-Württemberg - Catholic southern state
	BW: [
		new HolidayDefinition({
			name: "Heilige Drei Könige",
			type: "fixed",
			month: 1,
			day: 6,
			workFree: true,
		}),
		new HolidayDefinition({
			name: "Fronleichnam",
			type: "easter_relative",
			offset: 60,
			workFree: true,
		}),
		new HolidayDefinition({
			name: "Allerheiligen",
			type: "fixed",
			month: 11,
			day: 1,
			workFree: true,
		}),
	],

	// Bayern (Bavaria) - Catholic southern state with additional Marian feast
	BY: [
		new HolidayDefinition({
			name: "Heilige Drei Könige",
			type: "fixed",
			month: 1,
			day: 6,
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
			name: "Allerheiligen",
			type: "fixed",
			month: 11,
			day: 1,
			workFree: true,
		}),
	],

	// Berlin - Added International Women's Day in 2019
	BE: [
		new HolidayDefinition({
			name: "Internationaler Frauentag",
			type: "fixed",
			month: 3,
			day: 8,
			workFree: true,
		}),
	],

	// Brandenburg - Protestant eastern state, added Reformation Day
	BB: [
		new HolidayDefinition({
			name: "Reformationstag",
			type: "fixed",
			month: 10,
			day: 31,
			workFree: true,
		}),
	],

	// Bremen - Protestant northern city-state
	HB: [
		new HolidayDefinition({
			name: "Reformationstag",
			type: "fixed",
			month: 10,
			day: 31,
			workFree: true,
		}),
	],

	// Hamburg - Protestant northern city-state
	HH: [
		new HolidayDefinition({
			name: "Reformationstag",
			type: "fixed",
			month: 10,
			day: 31,
			workFree: true,
		}),
	],

	// Hessen - Mixed denominational state with Catholic elements
	HE: [
		new HolidayDefinition({
			name: "Fronleichnam",
			type: "easter_relative",
			offset: 60,
			workFree: true,
		}),
	],

	// Mecklenburg-Vorpommern - Protestant eastern state
	MV: [
		new HolidayDefinition({
			name: "Reformationstag",
			type: "fixed",
			month: 10,
			day: 31,
			workFree: true,
		}),
	],

	// Niedersachsen - Protestant northern state
	NI: [
		new HolidayDefinition({
			name: "Reformationstag",
			type: "fixed",
			month: 10,
			day: 31,
			workFree: true,
		}),
	],

	// Nordrhein-Westfalen - Mixed with strong Catholic influence
	NW: [
		new HolidayDefinition({
			name: "Fronleichnam",
			type: "easter_relative",
			offset: 60,
			workFree: true,
		}),
		new HolidayDefinition({
			name: "Allerheiligen",
			type: "fixed",
			month: 11,
			day: 1,
			workFree: true,
		}),
	],

	// Rheinland-Pfalz - Catholic western state
	RP: [
		new HolidayDefinition({
			name: "Fronleichnam",
			type: "easter_relative",
			offset: 60,
			workFree: true,
		}),
		new HolidayDefinition({
			name: "Allerheiligen",
			type: "fixed",
			month: 11,
			day: 1,
			workFree: true,
		}),
	],

	// Saarland - Catholic western state with French influences
	SL: [
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
			name: "Allerheiligen",
			type: "fixed",
			month: 11,
			day: 1,
			workFree: true,
		}),
	],

	// Sachsen (Saxony) - Only state that kept Buß- und Bettag
	SN: [
		new HolidayDefinition({
			name: "Fronleichnam",
			type: "easter_relative",
			offset: 60,
			workFree: true,
		}),
		new HolidayDefinition({
			name: "Reformationstag",
			type: "fixed",
			month: 10,
			day: 31,
			workFree: true,
		}),
		new HolidayDefinition({
			name: "Buß- und Bettag",
			type: "calculated",
			workFree: true,
			calculator: calculateBussUndBettag,
		}),
	],

	// Sachsen-Anhalt - Eastern state with mixed denomination
	ST: [
		new HolidayDefinition({
			name: "Heilige Drei Könige",
			type: "fixed",
			month: 1,
			day: 6,
			workFree: true,
		}),
		new HolidayDefinition({
			name: "Reformationstag",
			type: "fixed",
			month: 10,
			day: 31,
			workFree: true,
		}),
	],

	// Schleswig-Holstein - Protestant northern state
	SH: [
		new HolidayDefinition({
			name: "Reformationstag",
			type: "fixed",
			month: 10,
			day: 31,
			workFree: true,
		}),
	],

	// Thüringen - Eastern state with mixed denomination
	TH: [
		new HolidayDefinition({
			name: "Fronleichnam",
			type: "easter_relative",
			offset: 60,
			workFree: true,
		}),
		new HolidayDefinition({
			name: "Reformationstag",
			type: "fixed",
			month: 10,
			day: 31,
			workFree: true,
		}),
	],
};

/**
 * Complete German holiday system.
 * Institutional memory: federal structure with regional variations.
 */
export const GERMAN_HOLIDAYS = {
	national: NATIONAL_HOLIDAYS,
	regional: REGIONAL_HOLIDAYS,
};
