/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Portuguese holiday definitions - national and regional holiday patterns.
 *
 * Portugal's national holiday system with public holidays and municipal
 * variations. The murder remembers Catholic traditions, revolutionary history,
 * and local patron saint celebrations.
 */

import { HolidayDefinition } from "../holiday-definition.js";

/**
 * Portuguese national holidays observed throughout the Republic.
 * Core holidays recognized by Portuguese law and tradition.
 */
const NATIONAL_HOLIDAYS = [
	new HolidayDefinition({
		name: "Ano Novo",
		type: "fixed",
		month: 1,
		day: 1,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Sexta-feira Santa",
		type: "easter_relative",
		offset: -2,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Páscoa",
		type: "easter_relative",
		offset: 0,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Dia da Liberdade",
		type: "fixed",
		month: 4,
		day: 25,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Dia do Trabalhador",
		type: "fixed",
		month: 5,
		day: 1,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Dia de Portugal",
		type: "fixed",
		month: 6,
		day: 10,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Corpo de Deus",
		type: "easter_relative",
		offset: 60,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Assunção de Nossa Senhora",
		type: "fixed",
		month: 8,
		day: 15,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Implantação da República",
		type: "fixed",
		month: 10,
		day: 5,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Dia de Todos os Santos",
		type: "fixed",
		month: 11,
		day: 1,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Restauração da Independência",
		type: "fixed",
		month: 12,
		day: 1,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Imaculada Conceição",
		type: "fixed",
		month: 12,
		day: 8,
		workFree: true,
	}),
	new HolidayDefinition({
		name: "Natal",
		type: "fixed",
		month: 12,
		day: 25,
		workFree: true,
	}),
];

/**
 * Portuguese regional holidays by major municipalities/regions.
 * Many municipalities have their own patron saint days.
 */
const REGIONAL_HOLIDAYS = {
	// Lisbon
	LISBOA: [
		new HolidayDefinition({
			name: "Santo António",
			type: "fixed",
			month: 6,
			day: 13,
			workFree: true,
		}),
	],

	// Porto
	PORTO: [
		new HolidayDefinition({
			name: "São João",
			type: "fixed",
			month: 6,
			day: 24,
			workFree: true,
		}),
	],

	// Braga
	BRAGA: [
		new HolidayDefinition({
			name: "São João",
			type: "fixed",
			month: 6,
			day: 24,
			workFree: true,
		}),
	],

	// Azores
	AZORES: [
		new HolidayDefinition({
			name: "Dia da Região Autónoma dos Açores",
			type: "easter_relative",
			offset: 50, // Whit Monday
			workFree: true,
		}),
		new HolidayDefinition({
			name: "Espírito Santo",
			type: "easter_relative",
			offset: 49, // Whit Sunday
			workFree: true,
		}),
	],

	// Madeira
	MADEIRA: [
		new HolidayDefinition({
			name: "Dia da Região Autónoma da Madeira",
			type: "fixed",
			month: 7,
			day: 1,
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
 * Portuguese holiday definitions with national and regional variations.
 *
 * Portugal has 13 official national holidays, with municipalities and
 * autonomous regions adding local patron saint celebrations. The system
 * reflects strong Catholic traditions and Republican historical commemorations.
 *
 * @example
 * // Import Portuguese holidays
 * import { PT } from '@raven-js/cortex/temporal/countries/PT';
 * const holidays = calculateHolidaysOfYear(PT, { year: 2024, region: 'LISBOA' });
 */
export const PT = {
	national: NATIONAL_HOLIDAYS,
	regional: REGIONAL_HOLIDAYS,
};

Object.freeze(PT);
