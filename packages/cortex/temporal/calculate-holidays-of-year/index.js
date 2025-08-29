/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Holiday calculation system API - institutional memory preservation
 *
 * Clean interface for calculating governmental holiday patterns across countries
 * and regions. Encodes bureaucratic complexity with surgical precision.
 *
 * Ravens remember: political patterns that outlive governments deserve
 * algorithmic immortality through zero-dependency calculation.
 */

import { Schema } from "../../structures/schema.js";
import { calculateEasterSunday } from "../calculate-easter-sunday.js";
import { GERMAN_HOLIDAYS } from "./de.js";
import { Holiday } from "./holiday.js";

/**
 * Options schema for holiday calculation validation.
 * Ensures type safety and provides clear API documentation.
 */
class HolidayOptionsSchema extends Schema {
	year = Schema.field(0, { description: "Year for holiday calculation" });
	country = Schema.field("", { description: "ISO country code (e.g., 'DE')" });
	region = Schema.field("", {
		description: "Region/state code (e.g., 'BY' for Bavaria)",
		optional: true,
	});
	includeWorkdays = Schema.field(false, {
		description: "Include non-work-free holidays",
		optional: true,
	});
	includeRegional = Schema.field(true, {
		description: "Include region-specific holidays",
		optional: true,
	});
}

/**
 * Supported country holiday definitions.
 * Extensible registry for adding new countries.
 */
const COUNTRY_HOLIDAYS = {
	DE: GERMAN_HOLIDAYS,
};

/**
 * Calculate all holidays for a given year and location.
 *
 * Processes national and regional holidays based on the provided options,
 * supporting multiple calculation types (fixed dates, Easter-relative,
 * and custom calculated holidays).
 *
 * PERFORMANCE CHARACTERISTICS:
 * - O(n) where n = number of applicable holidays (typically < 20)
 * - Single Easter calculation per year (reused for all relative holidays)
 * - Static data lookup - no external dependencies
 * - Memory efficient - creates minimal temporary objects
 *
 * INSTITUTIONAL MEMORY:
 * Each country's holiday system encodes centuries of political, religious,
 * and cultural evolution. This function preserves that complexity while
 * providing a clean, predictable API for modern applications.
 *
 * @param {Object} options - Holiday calculation options
 * @param {number} options.year - Year for holiday calculation
 * @param {string} options.country - ISO country code (e.g., 'DE')
 * @param {string} [options.region] - Region/state code (e.g., 'BY' for Bavaria)
 * @param {boolean} [options.includeWorkdays=false] - Include non-work-free holidays
 * @param {boolean} [options.includeRegional=true] - Include region-specific holidays
 * @returns {Holiday[]} Array of holiday objects sorted by date
 * @throws {Error} Invalid options or unsupported country/region
 *
 * @example
 * // Get all German federal holidays for 2024
 * const holidays = calculateHolidaysOfYear({
 *   year: 2024,
 *   country: 'DE'
 * });
 *
 * @example
 * // Get Bavaria-specific holidays including regional ones
 * const bavarianHolidays = calculateHolidaysOfYear({
 *   year: 2024,
 *   country: 'DE',
 *   region: 'BY',
 *   includeRegional: true
 * });
 *
 * @example
 * // Get only work-free holidays for Saxony
 * const workFreeHolidays = calculateHolidaysOfYear({
 *   year: 2024,
 *   country: 'DE',
 *   region: 'SN',
 *   includeWorkdays: false
 * });
 */
export function calculateHolidaysOfYear(options) {
	// Validate and normalize options using Schema
	const schema = new HolidayOptionsSchema();

	// Set defaults for optional fields
	const normalizedOptions = {
		region: "",
		includeWorkdays: false,
		includeRegional: true,
		...options,
	};

	// Validate options structure
	if (!schema.validate(normalizedOptions)) {
		throw new Error("Invalid holiday calculation options");
	}

	// Additional business logic validation
	if (
		!Number.isInteger(normalizedOptions.year) ||
		normalizedOptions.year < 1583
	) {
		throw new Error("Year must be an integer >= 1583 (Gregorian calendar)");
	}

	if (
		typeof normalizedOptions.country !== "string" ||
		normalizedOptions.country.length === 0
	) {
		throw new Error("Country must be a non-empty string");
	}

	// Check if country is supported
	const countryData = /** @type {any} */ (COUNTRY_HOLIDAYS)[
		normalizedOptions.country
	];
	if (!countryData) {
		throw new Error(`Unsupported country: ${normalizedOptions.country}`);
	}

	// Check if region is supported (if specified)
	if (
		normalizedOptions.region &&
		normalizedOptions.includeRegional &&
		!countryData.regional[normalizedOptions.region]
	) {
		throw new Error(
			`Unsupported region: ${normalizedOptions.region} for country ${normalizedOptions.country}`,
		);
	}

	const { year, region, includeWorkdays, includeRegional } = normalizedOptions;

	// Calculate Easter once for the year (reused by all Easter-relative holidays)
	const easter = calculateEasterSunday(year);

	/** @type {Holiday[]} */
	const holidays = [];

	// Process national holidays
	for (const holidayDefinition of countryData.national) {
		const holiday = holidayDefinition.calculateHoliday(
			year,
			easter,
			"national",
		);
		if (includeWorkdays || holiday.workFree) {
			holidays.push(holiday);
		}
	}

	// Process regional holidays if requested and region specified
	if (includeRegional && region && countryData.regional[region]) {
		for (const holidayDefinition of countryData.regional[region]) {
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

	// Sort holidays by date
	holidays.sort((a, b) => a.date.getTime() - b.date.getTime());

	return holidays;
}

// Note: Holiday and HolidayDefinition classes are internal implementation details
// Only the calculateHolidaysOfYear function is exported for public API
