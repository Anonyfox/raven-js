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
import { CH } from "./CH.js";

describe("Swiss holiday definitions (CH)", () => {
	describe("Structure validation", () => {
		it("should have proper structure", () => {
			assert.ok(typeof CH === "object");
			assert.ok(Array.isArray(CH.national));
			assert.ok(typeof CH.regional === "object");
		});

		it("should have national holidays as HolidayDefinition instances", () => {
			assert.ok(CH.national.length > 0);

			for (const holiday of CH.national) {
				assert.ok(holiday instanceof HolidayDefinition);
			}
		});

		it("should have cantonal holidays as HolidayDefinition instances", () => {
			const cantons = Object.keys(CH.regional);
			assert.ok(cantons.length > 0);

			for (const canton of cantons) {
				assert.ok(Array.isArray(CH.regional[canton]));

				for (const holiday of CH.regional[canton]) {
					assert.ok(holiday instanceof HolidayDefinition);
				}
			}
		});

		it("should have federal holidays", () => {
			// Switzerland has 8 official federal holidays
			assert.ok(CH.national.length >= 8);
		});

		it("should have multiple cantonal variations", () => {
			const cantons = Object.keys(CH.regional);
			// Should have several cantons represented
			assert.ok(cantons.length >= 5);
		});
	});

	describe("Holiday validation", () => {
		it("should have expected national holidays", () => {
			const nationalNames = CH.national.map((h) => h.name);

			const expectedHolidays = [
				"Neujahr",
				"Karfreitag",
				"Ostermontag",
				"Tag der Arbeit",
				"Christi Himmelfahrt",
				"Pfingstmontag",
				"Schweizer Bundesfeiertag",
				"Weihnachtstag",
				"Stephanstag",
			];

			for (const expected of expectedHolidays) {
				assert.ok(
					nationalNames.includes(expected),
					`Missing national holiday: ${expected}`,
				);
			}
		});

		it("should have Zurich cantonal holidays", () => {
			assert.ok(CH.regional.ZH);
			const zurichNames = CH.regional.ZH.map((h) => h.name);

			assert.ok(zurichNames.includes("Berchtoldstag"));
			assert.ok(zurichNames.includes("Sechseläuten"));
		});

		it("should have Ticino cantonal holidays", () => {
			assert.ok(CH.regional.TI);
			const ticinoNames = CH.regional.TI.map((h) => h.name);

			const expectedTicino = [
				"Heilige Drei Könige",
				"San Giuseppe",
				"Fronleichnam",
				"Santi Pietro e Paolo",
				"Assunzione",
				"Ognissanti",
				"Immacolata Concezione",
			];

			for (const expected of expectedTicino) {
				assert.ok(
					ticinoNames.includes(expected),
					`Missing Ticino holiday: ${expected}`,
				);
			}
		});
	});

	describe("Holiday calculations", () => {
		it("should calculate Swiss National Day correctly", () => {
			const nationalDay = CH.national.find(
				(h) => h.name === "Schweizer Bundesfeiertag",
			);
			assert.ok(nationalDay);

			const holiday2024 = nationalDay.calculateHoliday(2024);
			assert.strictEqual(holiday2024.date.getUTCMonth(), 7); // August
			assert.strictEqual(holiday2024.date.getUTCDate(), 1);
			assert.strictEqual(holiday2024.workFree, true);
		});

		it("should handle calculated holidays", () => {
			const allHolidays = [
				...CH.national,
				...Object.values(CH.regional).flat(),
			];

			const calculatedHolidays = allHolidays.filter(
				(h) => h.type === "calculated",
			);

			for (const holiday of calculatedHolidays) {
				assert.strictEqual(typeof holiday.calculator, "function");

				// Test the calculation
				const result = holiday.calculateHoliday(2024);
				assert.ok(result.date instanceof Date);
			}
		});
	});

	describe("Data consistency", () => {
		it("should have consistent holiday definitions", () => {
			const allHolidays = [
				...CH.national,
				...Object.values(CH.regional).flat(),
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

		it("should maintain Swiss institutional memory", () => {
			const allNames = [
				...CH.national.map((h) => h.name),
				...Object.values(CH.regional)
					.flat()
					.map((h) => h.name),
			];

			// Core Swiss holidays that should always be present
			const coreHolidays = [
				"Neujahr", // New Year
				"Schweizer Bundesfeiertag", // Swiss National Day
				"Weihnachtstag", // Christmas Day
			];

			for (const coreHoliday of coreHolidays) {
				assert.ok(
					allNames.includes(coreHoliday),
					`Core Swiss holiday missing: ${coreHoliday}`,
				);
			}
		});
	});
});
