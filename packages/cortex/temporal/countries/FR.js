/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file French holiday definitions with national and regional variations.
 *
 * Centralized holiday system with national holidays throughout the Republic,
 * plus regional variations in Alsace-Moselle and overseas territories.
 */

import { HolidayDefinition } from "../holiday-definition.js";

/**
 * French national holidays observed across metropolitan France.
 * Core Republican holidays established by secular and Christian traditions.
 */
const NATIONAL_HOLIDAYS = [
	new HolidayDefinition({
		name: "Jour de l'An",
		type: "fixed",
		month: 1,
		day: 1,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Lundi de Pâques",
		type: "easter_relative",
		offset: 1,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Fête du Travail",
		type: "fixed",
		month: 5,
		day: 1,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Fête de la Victoire",
		type: "fixed",
		month: 5,
		day: 8,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Ascension",
		type: "easter_relative",
		offset: 39,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Lundi de Pentecôte",
		type: "easter_relative",
		offset: 50,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Fête nationale",
		type: "fixed",
		month: 7,
		day: 14,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Assomption",
		type: "fixed",
		month: 8,
		day: 15,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Toussaint",
		type: "fixed",
		month: 11,
		day: 1,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Armistice",
		type: "fixed",
		month: 11,
		day: 11,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Noël",
		type: "fixed",
		month: 12,
		day: 25,
		workFree: true,
	}),
];

/**
 * French regional holidays by department/territory.
 * Special status regions with additional holidays.
 */
const REGIONAL_HOLIDAYS = {
	// Alsace-Moselle (departments 57, 67, 68)
	"ALSACE-MOSELLE": [
		new HolidayDefinition({
			name: "Vendredi Saint",
			type: "easter_relative",
			offset: -2,
			workFree: true,
		}),
		new HolidayDefinition({
			name: "Saint-Étienne",
			type: "fixed",
			month: 12,
			day: 26,
			workFree: true,
		}),
	],

	// Martinique
	MARTINIQUE: [
		new HolidayDefinition({
			name: "Abolition de l'esclavage",
			type: "fixed",
			month: 5,
			day: 22,
			workFree: true,
		}),
	],

	// Guadeloupe
	GUADELOUPE: [
		new HolidayDefinition({
			name: "Abolition de l'esclavage",
			type: "fixed",
			month: 5,
			day: 27,
			workFree: true,
		}),
	],

	// Guyane
	GUYANE: [
		new HolidayDefinition({
			name: "Abolition de l'esclavage",
			type: "fixed",
			month: 6,
			day: 10,
			workFree: true,
		}),
	],

	// Réunion
	REUNION: [
		new HolidayDefinition({
			name: "Abolition de l'esclavage",
			type: "fixed",
			month: 12,
			day: 20,
			workFree: true,
		}),
	],

	// Mayotte
	MAYOTTE: [
		new HolidayDefinition({
			name: "Abolition de l'esclavage",
			type: "fixed",
			month: 4,
			day: 27,
			workFree: true,
		}),
	],

	// Saint-Pierre-et-Miquelon
	SPM: [
		new HolidayDefinition({
			name: "Mi-Carême",
			type: "easter_relative",
			offset: -21,
			workFree: false,
		}),
	],

	// Nouvelle-Calédonie
	NC: [
		new HolidayDefinition({
			name: "Abolition de l'esclavage",
			type: "fixed",
			month: 9,
			day: 27,
			workFree: true,
		}),
		new HolidayDefinition({
			name: "Citoyenneté",
			type: "fixed",
			month: 9,
			day: 24,
			workFree: true,
		}),
	],

	// Polynésie française
	PF: [
		new HolidayDefinition({
			name: "Arrivée de l'Évangile",
			type: "fixed",
			month: 3,
			day: 5,
			workFree: true,
		}),
		new HolidayDefinition({
			name: "Autonomie interne",
			type: "fixed",
			month: 6,
			day: 29,
			workFree: true,
		}),
	],

	// Wallis-et-Futuna
	WF: [
		new HolidayDefinition({
			name: "Saint-Pierre-Chanel",
			type: "fixed",
			month: 4,
			day: 28,
			workFree: true,
		}),
		new HolidayDefinition({
			name: "Territoire",
			type: "fixed",
			month: 7,
			day: 29,
			workFree: true,
		}),
	],
};

// Freeze holiday arrays to prevent modification
Object.freeze(NATIONAL_HOLIDAYS);
for (const holidays of Object.values(REGIONAL_HOLIDAYS)) {
	Object.freeze(holidays);
}

/**
 * French holiday definitions with national and regional variations.
 *
 * France has 11 official national holidays, with regional additions in
 * Alsace-Moselle (due to Concordat regime) and overseas territories.
 * The system reflects Republican values and colonial history.
 *
 * @example
 * // Import French holidays
 * import { FR } from '@raven-js/cortex/temporal/countries/FR';
 * const holidays = calculateHolidaysOfYear(FR, { year: 2024, region: 'ALSACE-MOSELLE' });
 */
export const FR = {
	national: NATIONAL_HOLIDAYS,
	regional: REGIONAL_HOLIDAYS,
};

Object.freeze(FR);
