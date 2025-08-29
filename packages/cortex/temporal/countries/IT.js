/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Italian holiday definitions - national and regional holiday patterns.
 *
 * Italy's national holiday system with some regional variations across the
 * 20 regions. The murder remembers the Catholic Church's influence, historical
 * patron saints, and the modern Republic's celebrations.
 */

import { HolidayDefinition } from "../holiday-definition.js";

/**
 * Italian national holidays observed across all regions.
 * Core holidays recognized throughout the Italian Republic.
 */
const NATIONAL_HOLIDAYS = [
	new HolidayDefinition({
		name: "Capodanno",
		type: "fixed",
		month: 1,
		day: 1,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Epifania del Signore",
		type: "fixed",
		month: 1,
		day: 6,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Festa della Liberazione",
		type: "fixed",
		month: 4,
		day: 25,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Lunedì dell'Angelo",
		type: "easter_relative",
		offset: 1,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Festa dei Lavoratori",
		type: "fixed",
		month: 5,
		day: 1,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Festa della Repubblica",
		type: "fixed",
		month: 6,
		day: 2,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Assunzione di Maria Vergine",
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
	new HolidayDefinition({
		name: "Natale del Signore",
		type: "fixed",
		month: 12,
		day: 25,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Santo Stefano",
		type: "fixed",
		month: 12,
		day: 26,
		workFree: true,
	}),
];

/**
 * Italian regional holidays by region code.
 * Some regions observe additional patron saint days.
 */
const REGIONAL_HOLIDAYS = {
	// Lombardia
	LOM: [
		new HolidayDefinition({
			name: "Sant'Ambrogio",
			type: "fixed",
			month: 12,
			day: 7,
			workFree: false,
		}),
	],

	// Veneto
	VEN: [
		new HolidayDefinition({
			name: "San Marco",
			type: "fixed",
			month: 4,
			day: 25,
			workFree: false,
		}),
	],

	// Piemonte
	PIE: [
		new HolidayDefinition({
			name: "San Giovanni Battista",
			type: "fixed",
			month: 6,
			day: 24,
			workFree: false,
		}),
	],

	// Lazio
	LAZ: [
		new HolidayDefinition({
			name: "Santi Pietro e Paolo",
			type: "fixed",
			month: 6,
			day: 29,
			workFree: false,
		}),
	],

	// Campania
	CAM: [
		new HolidayDefinition({
			name: "San Gennaro",
			type: "fixed",
			month: 9,
			day: 19,
			workFree: false,
		}),
	],

	// Sicilia
	SIC: [
		new HolidayDefinition({
			name: "Santa Rosalia",
			type: "fixed",
			month: 7,
			day: 15,
			workFree: false,
		}),
		new HolidayDefinition({
			name: "Sant'Agata",
			type: "fixed",
			month: 2,
			day: 5,
			workFree: false,
		}),
	],

	// Puglia
	PUG: [
		new HolidayDefinition({
			name: "San Nicola",
			type: "fixed",
			month: 5,
			day: 9,
			workFree: false,
		}),
	],

	// Toscana
	TOS: [
		new HolidayDefinition({
			name: "San Giovanni Battista",
			type: "fixed",
			month: 6,
			day: 24,
			workFree: false,
		}),
	],

	// Emilia-Romagna
	EMR: [
		new HolidayDefinition({
			name: "San Petronio",
			type: "fixed",
			month: 10,
			day: 4,
			workFree: false,
		}),
	],

	// Liguria
	LIG: [
		new HolidayDefinition({
			name: "San Giovanni Battista",
			type: "fixed",
			month: 6,
			day: 24,
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
 * Italian holiday definitions with national and regional variations.
 *
 * Italy has 11 official national holidays, with regions adding patron saint
 * celebrations. The system reflects Italy's strong Catholic tradition and
 * regional saint devotions throughout the peninsula.
 *
 * @example
 * // Import Italian holidays
 * import { IT } from '@raven-js/cortex/temporal/countries/IT';
 * const holidays = calculateHolidaysOfYear(IT, { year: 2024, region: 'LAZ' });
 */
export const IT = {
	national: NATIONAL_HOLIDAYS,
	regional: REGIONAL_HOLIDAYS,
};

Object.freeze(IT);
