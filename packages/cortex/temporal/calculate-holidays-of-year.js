/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Pure holiday calculation function for international holiday systems.
 *
 * This module provides the core calculation logic that operates on any country's
 * holiday definitions. The function is pure and stateless, taking holiday definitions
 * as input rather than hardcoding country-specific data, enabling tree-shaking
 * and flexible multi-country support.
 */

import { Schema } from "../structures/schema.js";
import { calculateEasterSunday } from "./calculate-easter-sunday.js";

// Holiday instances are created by HolidayDefinition.calculateHoliday() method

/**
 * Options schema for holiday calculation.
 * Validates input parameters for type safety and clear error messages.
 */
class HolidayOptionsSchema extends Schema {
	year = Schema.field("number", {
		description: "Year to calculate holidays for (>= 1583)",
	});
	region = Schema.field("string", {
		description: "Optional region code for regional holidays",
		optional: true,
	});
	includeRegional = Schema.field("boolean", {
		description: "Whether to include regional holidays",
		optional: true,
	});
	includeWorkdays = Schema.field("boolean", {
		description: "Whether to include observance-only holidays",
		optional: true,
	});
}

/**
 * Calculate holidays for a given year using provided holiday definitions.
 *
 * This is a pure function that operates on any country's holiday definitions,
 * enabling tree-shaking and multi-country support. Users import only the
 * country definitions they need.
 *
 * @param {Object} countryDefinitions - Holiday definitions for a country
 * @param {Array<import('./holiday-definition.js').HolidayDefinition>} countryDefinitions.national - National holidays
 * @param {Object<string, Array<import('./holiday-definition.js').HolidayDefinition>>} countryDefinitions.regional - Regional holidays by region code
 * @param {Object} options - Calculation options
 * @param {number} options.year - Year to calculate holidays for (>= 1583)
 * @param {string} [options.region] - Region code for regional holidays
 * @param {boolean} [options.includeRegional=true] - Include regional holidays
 * @param {boolean} [options.includeWorkdays=false] - Include observance-only holidays
 * @returns {Array<import('./holiday.js').Holiday>} Array of calculated Holiday instances
 * @throws {Error} If options are invalid or year is out of range
 *
 * @example
 * import { calculateHolidaysOfYear } from '@raven-js/cortex/temporal';
 * import { DE } from '@raven-js/cortex/temporal/countries/DE';
 *
 * const holidays = calculateHolidaysOfYear(DE, {
 *   year: 2024,
 *   region: 'BY',
 *   includeRegional: true
 * });
 *
 * @example
 * // Tree-shakable - only imports German holidays
 * import { calculateHolidaysOfYear } from '@raven-js/cortex/temporal';
 * import { DE } from '@raven-js/cortex/temporal/countries/DE';
 *
 * const nationalOnly = calculateHolidaysOfYear(DE, {
 *   year: 2024,
 *   includeRegional: false
 * });
 */
export function calculateHolidaysOfYear(countryDefinitions, options) {
	// Validate input parameters
	if (!countryDefinitions || typeof countryDefinitions !== "object") {
		throw new Error("Country definitions must be a valid object");
	}

	if (!Array.isArray(countryDefinitions.national)) {
		throw new Error(
			"Country definitions must have a 'national' array of holiday definitions",
		);
	}

	try {
		new HolidayOptionsSchema().validate(options);
	} catch (error) {
		throw new Error(`Invalid holiday calculation options: ${error.message}`);
	}

	const {
		year,
		region = null,
		includeRegional = true,
		includeWorkdays = false,
	} = options;

	// Validate year range
	if (year < 1583) {
		throw new Error("Year must be >= 1583 (Gregorian calendar adoption)");
	}

	const holidays = [];

	// Calculate Easter Sunday once for the year (many holidays depend on it)
	const easter = calculateEasterSunday(year);

	// Process national holidays
	for (const holidayDefinition of countryDefinitions.national) {
		const holiday = holidayDefinition.calculateHoliday(
			year,
			easter,
			"national",
		);
		if (includeWorkdays || holiday.workFree) {
			holidays.push(holiday);
		}
	}

	// Process regional holidays if requested and available
	if (
		includeRegional &&
		region &&
		countryDefinitions.regional &&
		countryDefinitions.regional[region]
	) {
		for (const holidayDefinition of countryDefinitions.regional[region]) {
			const holiday = holidayDefinition.calculateHoliday(
				year,
				easter,
				"regional",
			);
			if (includeWorkdays || holiday.workFree) {
				holidays.push(holiday);
			}
		}
	}

	// Sort holidays by date for consistent output
	holidays.sort((a, b) => a.date.getTime() - b.date.getTime());

	return holidays;
}
