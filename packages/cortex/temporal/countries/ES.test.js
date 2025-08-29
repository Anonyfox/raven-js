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
import { ES } from "./ES.js";

describe("Spanish holiday definitions (ES)", () => {
	describe("Structure validation", () => {
		it("should have proper structure", () => {
			assert.ok(typeof ES === "object");
			assert.ok(Array.isArray(ES.national));
			assert.ok(typeof ES.regional === "object");
		});

		it("should have national holidays as HolidayDefinition instances", () => {
			assert.ok(ES.national.length > 0);

			for (const holiday of ES.national) {
				assert.ok(holiday instanceof HolidayDefinition);
			}
		});

		it("should have 10 national holidays", () => {
			// Spain has 10 official national holidays
			assert.strictEqual(ES.national.length, 10);
		});

		it("should have multiple autonomous communities", () => {
			const regions = Object.keys(ES.regional);
			assert.ok(regions.length >= 5);
		});
	});

	describe("Holiday validation", () => {
		it("should have expected national holidays", () => {
			const nationalNames = ES.national.map((h) => h.name);

			const expectedHolidays = [
				"Año Nuevo",
				"Reyes Magos",
				"Viernes Santo",
				"Fiesta del Trabajo",
				"Asunción de la Virgen",
				"Fiesta Nacional de España",
				"Todos los Santos",
				"Día de la Constitución",
				"Inmaculada Concepción",
				"Navidad",
			];

			for (const expected of expectedHolidays) {
				assert.ok(
					nationalNames.includes(expected),
					`Missing national holiday: ${expected}`,
				);
			}
		});

		it("should have Catalonia regional holidays", () => {
			assert.ok(ES.regional.CT);
			const cataloniaNames = ES.regional.CT.map((h) => h.name);

			assert.ok(cataloniaNames.includes("Diada Nacional de Catalunya"));
			assert.ok(cataloniaNames.includes("San Esteban"));
		});

		it("should calculate National Day correctly", () => {
			const nationalDay = ES.national.find(
				(h) => h.name === "Fiesta Nacional de España",
			);
			assert.ok(nationalDay);

			const holiday2024 = nationalDay.calculateHoliday(2024);
			assert.strictEqual(holiday2024.date.getUTCMonth(), 9); // October
			assert.strictEqual(holiday2024.date.getUTCDate(), 12);
			assert.strictEqual(holiday2024.workFree, true);
		});
	});

	describe("Data consistency", () => {
		it("should have consistent holiday definitions", () => {
			const allHolidays = [
				...ES.national,
				...Object.values(ES.regional).flat(),
			];

			for (const holiday of allHolidays) {
				assert.strictEqual(typeof holiday.name, "string");
				assert.ok(holiday.name.length > 0);
				assert.strictEqual(typeof holiday.workFree, "boolean");
				assert.ok(
					["fixed", "easter_relative", "calculated"].includes(holiday.type),
				);
			}
		});
	});
});
