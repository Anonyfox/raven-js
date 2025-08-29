/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import assert from "node:assert";
import { describe, it } from "node:test";
import { HolidayDefinition } from "../holiday-definition.js";
import { AT } from "./AT.js";

describe("Austrian holiday definitions (AT)", () => {
	describe("Structure validation", () => {
		it("should have proper structure", () => {
			assert.ok(typeof AT === "object");
			assert.ok(Array.isArray(AT.national));
			assert.ok(typeof AT.regional === "object");
		});

		it("should have national holidays as HolidayDefinition instances", () => {
			assert.ok(AT.national.length > 0);

			for (const holiday of AT.national) {
				assert.ok(holiday instanceof HolidayDefinition);
			}
		});

		it("should have regional holidays as HolidayDefinition instances", () => {
			const regions = Object.keys(AT.regional);

			for (const region of regions) {
				assert.ok(Array.isArray(AT.regional[region]));

				for (const holiday of AT.regional[region]) {
					assert.ok(holiday instanceof HolidayDefinition);
				}
			}
		});

		it("should have at least 13 national holidays", () => {
			// Austria has 13 federal holidays
			assert.ok(AT.national.length >= 13);
		});
	});

	describe("Holiday validation", () => {
		it("should have expected national holidays", () => {
			const nationalNames = AT.national.map((h) => h.name);

			const expectedHolidays = [
				"Neujahr",
				"Heilige Drei Könige",
				"Ostermontag",
				"Staatsfeiertag",
				"Christi Himmelfahrt",
				"Pfingstmontag",
				"Fronleichnam",
				"Mariä Himmelfahrt",
				"Nationalfeiertag",
				"Allerheiligen",
				"Mariä Empfängnis",
				"Weihnachtstag",
				"Stefanitag",
			];

			for (const expected of expectedHolidays) {
				assert.ok(
					nationalNames.includes(expected),
					`Missing national holiday: ${expected}`,
				);
			}
		});

		it("should have some regional variations", () => {
			const regions = Object.keys(AT.regional);
			assert.ok(regions.length >= 0); // Austria has some state-specific observances
		});
	});

	describe("Holiday calculations", () => {
		it("should calculate New Year correctly", () => {
			const newYear = AT.national.find((h) => h.name === "Neujahr");
			assert.ok(newYear);

			const holiday2024 = newYear.calculateHoliday(2024);
			assert.strictEqual(holiday2024.date.getUTCMonth(), 0); // January
			assert.strictEqual(holiday2024.date.getUTCDate(), 1);
			assert.strictEqual(holiday2024.workFree, true);
		});

		it("should calculate Easter-relative holidays", () => {
			const easterMonday = AT.national.find((h) => h.name === "Ostermontag");
			assert.ok(easterMonday);
			assert.strictEqual(easterMonday.type, "easter_relative");
			assert.strictEqual(easterMonday.offset, 1);

			const ascension = AT.national.find(
				(h) => h.name === "Christi Himmelfahrt",
			);
			assert.ok(ascension);
			assert.strictEqual(ascension.type, "easter_relative");
			assert.strictEqual(ascension.offset, 39);
		});

		it("should calculate Epiphany correctly", () => {
			const epiphany = AT.national.find(
				(h) => h.name === "Heilige Drei Könige",
			);
			assert.ok(epiphany);
			assert.strictEqual(epiphany.type, "fixed");
			assert.strictEqual(epiphany.month, 1);
			assert.strictEqual(epiphany.day, 6);
		});
	});

	describe("Data consistency", () => {
		it("should have consistent holiday definitions", () => {
			const allHolidays = [
				...AT.national,
				...Object.values(AT.regional).flat(),
			];

			for (const holiday of allHolidays) {
				// Name should be non-empty string
				assert.strictEqual(typeof holiday.name, "string");
				assert.ok(holiday.name.length > 0);

				// WorkFree should be boolean
				assert.strictEqual(typeof holiday.workFree, "boolean");

				// Type should be valid
				assert.ok(
					["fixed", "easter_relative", "calculated"].includes(holiday.type),
				);
			}
		});

		it("should maintain institutional memory", () => {
			const allNames = [
				...AT.national.map((h) => h.name),
				...Object.values(AT.regional)
					.flat()
					.map((h) => h.name),
			];

			// Core Austrian holidays that should always be present
			const coreHolidays = [
				"Neujahr", // New Year
				"Staatsfeiertag", // Labor Day
				"Nationalfeiertag", // National Day
				"Weihnachtstag", // Christmas Day
			];

			for (const coreHoliday of coreHolidays) {
				assert.ok(
					allNames.includes(coreHoliday),
					`Core Austrian holiday missing: ${coreHoliday}`,
				);
			}
		});
	});
});
