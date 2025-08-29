/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Spanish holiday definitions - national and autonomous community holidays.
 *
 * Spain's complex holiday system with national holidays and significant
 * variations across autonomous communities. The murder remembers centuries
 * of regional traditions, Catholic heritage, and modern federalism.
 */

import { HolidayDefinition } from "../holiday-definition.js";

/**
 * Spanish national holidays observed across all autonomous communities.
 * Core holidays recognized throughout the Kingdom of Spain.
 */
const NATIONAL_HOLIDAYS = [
	new HolidayDefinition({
		name: "Año Nuevo",
		type: "fixed",
		month: 1,
		day: 1,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Reyes Magos",
		type: "fixed",
		month: 1,
		day: 6,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Viernes Santo",
		type: "easter_relative",
		offset: -2,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Fiesta del Trabajo",
		type: "fixed",
		month: 5,
		day: 1,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Asunción de la Virgen",
		type: "fixed",
		month: 8,
		day: 15,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Fiesta Nacional de España",
		type: "fixed",
		month: 10,
		day: 12,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Todos los Santos",
		type: "fixed",
		month: 11,
		day: 1,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Día de la Constitución",
		type: "fixed",
		month: 12,
		day: 6,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Inmaculada Concepción",
		type: "fixed",
		month: 12,
		day: 8,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Navidad",
		type: "fixed",
		month: 12,
		day: 25,
		workFree: true,
	}),
];

/**
 * Spanish autonomous community holidays by region code.
 * Each community can add regional holidays beyond national ones.
 */
const REGIONAL_HOLIDAYS = {
	// Andalucía
	AN: [
		new HolidayDefinition({
			name: "Día de Andalucía",
			type: "fixed",
			month: 2,
			day: 28,
			workFree: true,
		}),
		new HolidayDefinition({
			name: "Jueves Santo",
			type: "easter_relative",
			offset: -3,
			workFree: true,
		}),
	],

	// Cataluña
	CT: [
		new HolidayDefinition({
			name: "Lunes de Pascua",
			type: "easter_relative",
			offset: 1,
			workFree: true,
		}),
		new HolidayDefinition({
			name: "San Juan",
			type: "fixed",
			month: 6,
			day: 24,
			workFree: true,
		}),
		new HolidayDefinition({
			name: "Diada Nacional de Catalunya",
			type: "fixed",
			month: 9,
			day: 11,
			workFree: true,
		}),
		new HolidayDefinition({
			name: "San Esteban",
			type: "fixed",
			month: 12,
			day: 26,
			workFree: true,
		}),
	],

	// Madrid
	MD: [
		new HolidayDefinition({
			name: "Jueves Santo",
			type: "easter_relative",
			offset: -3,
			workFree: true,
		}),
		new HolidayDefinition({
			name: "Fiesta de la Comunidad de Madrid",
			type: "fixed",
			month: 5,
			day: 2,
			workFree: true,
		}),
	],

	// País Vasco
	PV: [
		new HolidayDefinition({
			name: "Lunes de Pascua",
			type: "easter_relative",
			offset: 1,
			workFree: true,
		}),
		new HolidayDefinition({
			name: "Día del País Vasco",
			type: "fixed",
			month: 10,
			day: 25,
			workFree: true,
		}),
	],

	// Valencia
	VC: [
		new HolidayDefinition({
			name: "Lunes de Pascua",
			type: "easter_relative",
			offset: 1,
			workFree: true,
		}),
		new HolidayDefinition({
			name: "San José",
			type: "fixed",
			month: 3,
			day: 19,
			workFree: true,
		}),
		new HolidayDefinition({
			name: "Día de la Comunidad Valenciana",
			type: "fixed",
			month: 10,
			day: 9,
			workFree: true,
		}),
	],

	// Galicia
	GA: [
		new HolidayDefinition({
			name: "Día das Letras Galegas",
			type: "fixed",
			month: 5,
			day: 17,
			workFree: true,
		}),
		new HolidayDefinition({
			name: "Día de Galicia",
			type: "fixed",
			month: 7,
			day: 25,
			workFree: true,
		}),
	],

	// Islas Baleares
	IB: [
		new HolidayDefinition({
			name: "Lunes de Pascua",
			type: "easter_relative",
			offset: 1,
			workFree: true,
		}),
		new HolidayDefinition({
			name: "Día de las Islas Baleares",
			type: "fixed",
			month: 3,
			day: 1,
			workFree: true,
		}),
	],

	// Canarias
	CN: [
		new HolidayDefinition({
			name: "Día de Canarias",
			type: "fixed",
			month: 5,
			day: 30,
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
 * Spanish holiday definitions with national and autonomous community variations.
 *
 * Spain has 10 official national holidays, with autonomous communities adding
 * regional celebrations. The system reflects Spain's federal structure,
 * Catholic heritage, and distinct regional identities.
 *
 * @example
 * // Import Spanish holidays
 * import { ES } from '@raven-js/cortex/temporal/countries/ES';
 * const holidays = calculateHolidaysOfYear(ES, { year: 2024, region: 'CT' });
 */
export const ES = {
	national: NATIONAL_HOLIDAYS,
	regional: REGIONAL_HOLIDAYS,
};

Object.freeze(ES);
