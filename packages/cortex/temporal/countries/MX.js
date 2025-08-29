/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Mexican holiday definitions with national and regional traditions
 *
 * Mexico has rich holiday traditions combining:
 * - National civic holidays (Independence, Revolution, Constitution)
 * - Catholic religious holidays (deeply embedded in culture)
 * - Indigenous and traditional celebrations
 * - Regional patron saint festivals
 * - Modern observances and bridge holidays (puentes)
 */

import { HolidayDefinition } from "../holiday-definition.js";

/**
 * Calculate Benito Juárez's Birthday (Third Monday in March).
 * @param {number} year - Year to calculate for
 * @returns {Date} Benito Juárez's Birthday
 */
function calculateBenitoJuarezDay(year) {
	const mar1 = new Date(Date.UTC(year, 2, 1));
	const dayOfWeek = mar1.getUTCDay();
	const firstMonday = dayOfWeek === 1 ? 1 : ((7 - dayOfWeek + 1) % 7) + 1;
	return new Date(Date.UTC(year, 2, firstMonday + 14)); // Third Monday
}

// National holidays observed throughout Mexico
const NATIONAL_HOLIDAYS = [
	// Año Nuevo (New Year's Day)
	new HolidayDefinition({
		name: "Año Nuevo",
		type: "fixed",
		month: 1,
		day: 1,
		workFree: true,
	}),

	// Día de la Constitución (Constitution Day - First Monday in February)
	new HolidayDefinition({
		name: "Día de la Constitución",
		type: "calculated",
		workFree: true,
		calculator: (/** @type {number} */ year) => {
			const feb1 = new Date(Date.UTC(year, 1, 1));
			const dayOfWeek = feb1.getUTCDay();
			const firstMonday = dayOfWeek === 1 ? 1 : ((7 - dayOfWeek + 1) % 7) + 1;
			return new Date(Date.UTC(year, 1, firstMonday));
		},
	}),

	// Natalicio de Benito Juárez (Third Monday in March)
	new HolidayDefinition({
		name: "Natalicio de Benito Juárez",
		type: "calculated",
		workFree: true,
		calculator: (/** @type {number} */ year) => calculateBenitoJuarezDay(year),
	}),

	// Viernes Santo (Good Friday)
	new HolidayDefinition({
		name: "Viernes Santo",
		type: "easter_relative",
		offset: -2,
		workFree: true,
	}),

	// Día del Trabajo (Labor Day)
	new HolidayDefinition({
		name: "Día del Trabajo",
		type: "fixed",
		month: 5,
		day: 1,
		workFree: true,
	}),

	// Día de la Independencia (Independence Day)
	new HolidayDefinition({
		name: "Día de la Independencia",
		type: "fixed",
		month: 9,
		day: 16,
		workFree: true,
	}),

	// Día de la Revolución (Third Monday in November)
	new HolidayDefinition({
		name: "Día de la Revolución",
		type: "calculated",
		workFree: true,
		calculator: (/** @type {number} */ year) => {
			const nov1 = new Date(Date.UTC(year, 10, 1));
			const dayOfWeek = nov1.getUTCDay();
			const firstMonday = dayOfWeek === 1 ? 1 : ((7 - dayOfWeek + 1) % 7) + 1;
			return new Date(Date.UTC(year, 10, firstMonday + 14)); // Third Monday
		},
	}),

	// Navidad (Christmas Day)
	new HolidayDefinition({
		name: "Navidad",
		type: "fixed",
		month: 12,
		day: 25,
		workFree: true,
	}),

	// Traditional and Cultural Holidays (not official work-free but widely observed)

	// Día de los Reyes Magos (Three Kings Day)
	new HolidayDefinition({
		name: "Día de los Reyes Magos",
		type: "fixed",
		month: 1,
		day: 6,
		workFree: false,
	}),

	// Día de la Candelaria (Candlemas)
	new HolidayDefinition({
		name: "Día de la Candelaria",
		type: "fixed",
		month: 2,
		day: 2,
		workFree: false,
	}),

	// Día de San Valentín (Valentine's Day)
	new HolidayDefinition({
		name: "Día de San Valentín",
		type: "fixed",
		month: 2,
		day: 14,
		workFree: false,
	}),

	// Día de las Madres (Mother's Day - May 10)
	new HolidayDefinition({
		name: "Día de las Madres",
		type: "fixed",
		month: 5,
		day: 10,
		workFree: false,
	}),

	// Día de los Padres (Father's Day - Third Sunday in June)
	new HolidayDefinition({
		name: "Día de los Padres",
		type: "calculated",
		workFree: false,
		calculator: (/** @type {number} */ year) => {
			const jun1 = new Date(Date.UTC(year, 5, 1));
			const dayOfWeek = jun1.getUTCDay();
			const firstSunday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
			return new Date(Date.UTC(year, 5, firstSunday + 14)); // Third Sunday
		},
	}),

	// Día de los Muertos (Day of the Dead - November 1)
	new HolidayDefinition({
		name: "Día de los Muertos",
		type: "fixed",
		month: 11,
		day: 1,
		workFree: false, // Traditional but not official
	}),

	// Día de los Fieles Difuntos (All Souls' Day - November 2)
	new HolidayDefinition({
		name: "Día de los Fieles Difuntos",
		type: "fixed",
		month: 11,
		day: 2,
		workFree: false,
	}),

	// Día de la Virgen de Guadalupe (Our Lady of Guadalupe)
	new HolidayDefinition({
		name: "Día de la Virgen de Guadalupe",
		type: "fixed",
		month: 12,
		day: 12,
		workFree: false,
	}),

	// Las Posadas (Christmas season begins - December 16)
	new HolidayDefinition({
		name: "Las Posadas",
		type: "fixed",
		month: 12,
		day: 16,
		workFree: false,
	}),
];

// State and regional celebrations
const REGIONAL_HOLIDAYS = {
	// Jalisco
	JAL: [
		new HolidayDefinition({
			name: "Día de Jalisco",
			type: "fixed",
			month: 2,
			day: 14,
			workFree: false,
		}),
		new HolidayDefinition({
			name: "Fiestas de Octubre",
			type: "fixed",
			month: 10,
			day: 1,
			workFree: false,
		}),
	],

	// Yucatán
	YUC: [
		new HolidayDefinition({
			name: "Día de Yucatán",
			type: "fixed",
			month: 1,
			day: 6,
			workFree: false,
		}),
		new HolidayDefinition({
			name: "Carnaval de Mérida",
			type: "easter_relative", // Varies with Easter
			offset: -47, // About 7 weeks before
			workFree: false,
		}),
	],

	// Chiapas
	CHIS: [
		new HolidayDefinition({
			name: "Día de Chiapas",
			type: "fixed",
			month: 9,
			day: 14,
			workFree: false,
		}),
		new HolidayDefinition({
			name: "San Cristóbal de las Casas",
			type: "fixed",
			month: 7,
			day: 25,
			workFree: false,
		}),
	],

	// Oaxaca
	OAX: [
		new HolidayDefinition({
			name: "Día de Oaxaca",
			type: "fixed",
			month: 9,
			day: 27,
			workFree: false,
		}),
		new HolidayDefinition({
			name: "Guelaguetza",
			type: "calculated", // Last two Mondays in July
			workFree: false,
			calculator: (/** @type {number} */ year) => {
				// First Monday in July
				const jul1 = new Date(Date.UTC(year, 6, 1));
				const dayOfWeek = jul1.getUTCDay();
				const firstMonday = dayOfWeek === 1 ? 1 : ((7 - dayOfWeek + 1) % 7) + 1;
				return new Date(Date.UTC(year, 6, firstMonday + 21)); // Fourth Monday (simplified)
			},
		}),
	],

	// Puebla
	PUE: [
		new HolidayDefinition({
			name: "Batalla de Puebla",
			type: "fixed",
			month: 5,
			day: 5,
			workFree: false,
		}),
		new HolidayDefinition({
			name: "Día de Puebla",
			type: "fixed",
			month: 4,
			day: 16,
			workFree: false,
		}),
	],

	// Veracruz
	VER: [
		new HolidayDefinition({
			name: "Día de Veracruz",
			type: "fixed",
			month: 4,
			day: 22,
			workFree: false,
		}),
		new HolidayDefinition({
			name: "Carnaval de Veracruz",
			type: "easter_relative",
			offset: -47, // About 7 weeks before Easter
			workFree: false,
		}),
	],

	// Nuevo León
	NL: [
		new HolidayDefinition({
			name: "Día de Nuevo León",
			type: "fixed",
			month: 12,
			day: 7,
			workFree: false,
		}),
	],

	// Quintana Roo
	QROO: [
		new HolidayDefinition({
			name: "Día de Quintana Roo",
			type: "fixed",
			month: 10,
			day: 8,
			workFree: false,
		}),
	],
};

// Freeze holiday arrays to prevent modification
Object.freeze(NATIONAL_HOLIDAYS);
for (const holidays of Object.values(REGIONAL_HOLIDAYS)) {
	Object.freeze(holidays);
}
Object.freeze(REGIONAL_HOLIDAYS);

export const MX = {
	national: NATIONAL_HOLIDAYS,
	regional: REGIONAL_HOLIDAYS,
};

Object.freeze(MX);
