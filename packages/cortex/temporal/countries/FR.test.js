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
import { FR } from "./FR.js";

describe("French holiday definitions (FR)", () => {
	describe("Structure validation", () => {
		it("should have proper structure", () => {
			assert.ok(typeof FR === "object");
			assert.ok(Array.isArray(FR.national));
			assert.ok(typeof FR.regional === "object");
		});

		it("should have national holidays as HolidayDefinition instances", () => {
			assert.ok(FR.national.length > 0);

			for (const holiday of FR.national) {
				assert.ok(holiday instanceof HolidayDefinition);
			}
		});

		it("should have regional holidays as HolidayDefinition instances", () => {
			const regions = Object.keys(FR.regional);

			for (const region of regions) {
				assert.ok(Array.isArray(FR.regional[region]));

				for (const holiday of FR.regional[region]) {
					assert.ok(holiday instanceof HolidayDefinition);
				}
			}
		});

		it("should have 11 national holidays", () => {
			// France has 11 official national holidays
			assert.strictEqual(FR.national.length, 11);
		});
	});

	describe("Holiday validation", () => {
		it("should have expected national holidays", () => {
			const nationalNames = FR.national.map((h) => h.name);

			const expectedHolidays = [
				"Jour de l'An",
				"Lundi de Pâques",
				"Fête du Travail",
				"Fête de la Victoire",
				"Ascension",
				"Lundi de Pentecôte",
				"Fête nationale",
				"Assomption",
				"Toussaint",
				"Armistice",
				"Noël",
			];

			for (const expected of expectedHolidays) {
				assert.ok(
					nationalNames.includes(expected),
					`Missing national holiday: ${expected}`,
				);
			}
		});

		it("should have Alsace-Moselle regional holidays", () => {
			assert.ok(FR.regional["ALSACE-MOSELLE"]);
			const alsaceNames = FR.regional["ALSACE-MOSELLE"].map((h) => h.name);

			assert.ok(alsaceNames.includes("Vendredi Saint"));
			assert.ok(alsaceNames.includes("Saint-Étienne"));
		});

		it("should have overseas territory holidays", () => {
			const territories = ["MARTINIQUE", "GUADELOUPE", "GUYANE", "REUNION"];

			for (const territory of territories) {
				assert.ok(FR.regional[territory]);
				const territoryNames = FR.regional[territory].map((h) => h.name);
				assert.ok(territoryNames.includes("Abolition de l'esclavage"));
			}
		});
	});

	describe("Holiday calculations", () => {
		it("should calculate Bastille Day correctly", () => {
			const bastilleDay = FR.national.find((h) => h.name === "Fête nationale");
			assert.ok(bastilleDay);

			const holiday2024 = bastilleDay.calculateHoliday(2024);
			assert.strictEqual(holiday2024.date.getUTCMonth(), 6); // July
			assert.strictEqual(holiday2024.date.getUTCDate(), 14);
			assert.strictEqual(holiday2024.workFree, true);
		});

		it("should calculate Easter-relative holidays", () => {
			const easterMonday = FR.national.find(
				(h) => h.name === "Lundi de Pâques",
			);
			assert.ok(easterMonday);
			assert.strictEqual(easterMonday.type, "easter_relative");
			assert.strictEqual(easterMonday.offset, 1);

			const ascension = FR.national.find((h) => h.name === "Ascension");
			assert.ok(ascension);
			assert.strictEqual(ascension.type, "easter_relative");
			assert.strictEqual(ascension.offset, 39);
		});
	});

	describe("Data consistency", () => {
		it("should have consistent holiday definitions", () => {
			const allHolidays = [
				...FR.national,
				...Object.values(FR.regional).flat(),
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

		it("should maintain French institutional memory", () => {
			const allNames = [
				...FR.national.map((h) => h.name),
				...Object.values(FR.regional)
					.flat()
					.map((h) => h.name),
			];

			// Core French holidays that should always be present
			const coreHolidays = [
				"Jour de l'An", // New Year
				"Fête du Travail", // Labor Day
				"Fête nationale", // Bastille Day
				"Noël", // Christmas Day
			];

			for (const coreHoliday of coreHolidays) {
				assert.ok(
					allNames.includes(coreHoliday),
					`Core French holiday missing: ${coreHoliday}`,
				);
			}
		});
	});
});
