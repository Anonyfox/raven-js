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
import { MX } from "./MX.js";

describe("Mexican holiday definitions (MX)", () => {
	describe("Structure validation", () => {
		it("should have proper structure", () => {
			assert.ok(typeof MX === "object");
			assert.ok(Array.isArray(MX.national));
			assert.ok(typeof MX.regional === "object");
		});

		it("should have national holidays as HolidayDefinition instances", () => {
			assert.ok(MX.national.length > 0);

			for (const holiday of MX.national) {
				assert.ok(holiday instanceof HolidayDefinition);
			}
		});

		it("should have regional holidays as HolidayDefinition instances", () => {
			const states = Object.keys(MX.regional);

			for (const state of states) {
				assert.ok(Array.isArray(MX.regional[state]));

				for (const holiday of MX.regional[state]) {
					assert.ok(holiday instanceof HolidayDefinition);
				}
			}
		});

		it("should have 17 national holidays", () => {
			// Mexico has official and traditional holidays
			assert.strictEqual(MX.national.length, 17);
		});

		it("should have multiple state variations", () => {
			const states = Object.keys(MX.regional);
			assert.ok(states.length >= 8); // Should have major states
		});
	});

	describe("Holiday validation", () => {
		it("should have expected official holidays", () => {
			const nationalNames = MX.national.map((h) => h.name);

			const officialHolidays = [
				"Año Nuevo", // New Year's Day
				"Día de la Constitución", // Constitution Day
				"Natalicio de Benito Juárez", // Benito Juárez Birthday
				"Viernes Santo", // Good Friday
				"Día del Trabajo", // Labor Day
				"Día de la Independencia", // Independence Day
				"Día de la Revolución", // Revolution Day
				"Navidad", // Christmas
			];

			for (const expected of officialHolidays) {
				assert.ok(
					nationalNames.includes(expected),
					`Missing official holiday: ${expected}`,
				);
			}
		});

		it("should have traditional and cultural holidays", () => {
			const nationalNames = MX.national.map((h) => h.name);

			const traditionalHolidays = [
				"Día de los Reyes Magos", // Three Kings Day
				"Día de la Candelaria", // Candlemas
				"Día de las Madres", // Mother's Day
				"Día de los Padres", // Father's Day
				"Día de los Muertos", // Day of the Dead
				"Día de la Virgen de Guadalupe", // Our Lady of Guadalupe
			];

			for (const expected of traditionalHolidays) {
				assert.ok(
					nationalNames.includes(expected),
					`Missing traditional holiday: ${expected}`,
				);
			}
		});

		it("should have Jalisco state holidays", () => {
			assert.ok(MX.regional.JAL);
			const jaliscoNames = MX.regional.JAL.map((h) => h.name);

			assert.ok(jaliscoNames.includes("Día de Jalisco"));
			assert.ok(jaliscoNames.includes("Fiestas de Octubre"));
		});

		it("should have Puebla state holidays", () => {
			assert.ok(MX.regional.PUE);
			const pueblaNames = MX.regional.PUE.map((h) => h.name);

			assert.ok(pueblaNames.includes("Batalla de Puebla")); // Cinco de Mayo
			assert.ok(pueblaNames.includes("Día de Puebla"));
		});

		it("should distinguish work-free vs observance holidays", () => {
			const workFreeHolidays = MX.national.filter((h) => h.workFree === true);
			const observanceHolidays = MX.national.filter(
				(h) => h.workFree === false,
			);

			assert.ok(workFreeHolidays.length > 0);
			assert.ok(observanceHolidays.length > 0);

			// Official holidays should be work-free
			const independenceDay = MX.national.find(
				(h) => h.name === "Día de la Independencia",
			);
			assert.ok(independenceDay);
			assert.strictEqual(independenceDay.workFree, true);

			// Traditional holidays are observed but not work-free
			const dayOfTheDead = MX.national.find(
				(h) => h.name === "Día de los Muertos",
			);
			assert.ok(dayOfTheDead);
			assert.strictEqual(dayOfTheDead.workFree, false);
		});
	});

	describe("Holiday calculations", () => {
		it("should calculate New Year correctly", () => {
			const newYear = MX.national.find((h) => h.name === "Año Nuevo");
			assert.ok(newYear);

			const holiday2024 = newYear.calculateHoliday(2024);
			assert.strictEqual(holiday2024.date.getUTCMonth(), 0); // January
			assert.strictEqual(holiday2024.date.getUTCDate(), 1);
			assert.strictEqual(holiday2024.workFree, true);
		});

		it("should calculate Independence Day correctly", () => {
			const independenceDay = MX.national.find(
				(h) => h.name === "Día de la Independencia",
			);
			assert.ok(independenceDay);

			const holiday2024 = independenceDay.calculateHoliday(2024);
			assert.strictEqual(holiday2024.date.getUTCMonth(), 8); // September
			assert.strictEqual(holiday2024.date.getUTCDate(), 16);
			assert.strictEqual(holiday2024.workFree, true);
		});

		it("should calculate Mother's Day correctly", () => {
			const mothersDay = MX.national.find(
				(h) => h.name === "Día de las Madres",
			);
			assert.ok(mothersDay);

			const holiday2024 = mothersDay.calculateHoliday(2024);
			assert.strictEqual(holiday2024.date.getUTCMonth(), 4); // May
			assert.strictEqual(holiday2024.date.getUTCDate(), 10);
			assert.strictEqual(holiday2024.workFree, false); // Observed but not work-free
		});

		it("should calculate Monday holidays correctly", () => {
			const mondayHolidays = [
				"Día de la Constitución", // First Monday in February
				"Natalicio de Benito Juárez", // Third Monday in March
				"Día de la Revolución", // Third Monday in November
			];

			for (const holidayName of mondayHolidays) {
				const holiday = MX.national.find((h) => h.name === holidayName);
				assert.ok(holiday);
				assert.strictEqual(holiday.type, "calculated");

				// Test that it falls on Monday
				const result = holiday.calculateHoliday(2024);
				assert.strictEqual(result.date.getUTCDay(), 1); // Monday
			}
		});

		it("should handle Easter-relative holidays", () => {
			const easterHolidays = MX.national.filter(
				(h) => h.type === "easter_relative",
			);

			assert.strictEqual(easterHolidays.length, 1); // Good Friday

			for (const holiday of easterHolidays) {
				const easterSunday = new Date(Date.UTC(2024, 2, 31)); // March 31, 2024
				const result = holiday.calculateHoliday(2024, easterSunday);
				assert.ok(result.date instanceof Date);
				assert.strictEqual(result.workFree, true);
			}
		});
	});

	describe("Data consistency", () => {
		it("should have consistent holiday definitions", () => {
			const allHolidays = [
				...MX.national,
				...Object.values(MX.regional).flat(),
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

		it("should maintain Mexican institutional memory", () => {
			const allNames = [
				...MX.national.map((h) => h.name),
				...Object.values(MX.regional)
					.flat()
					.map((h) => h.name),
			];

			// Core Mexican holidays that should always be present
			const coreHolidays = [
				"Año Nuevo",
				"Día de la Independencia",
				"Día de los Muertos",
				"Día de la Virgen de Guadalupe",
				"Navidad",
			];

			for (const coreHoliday of coreHolidays) {
				assert.ok(
					allNames.includes(coreHoliday),
					`Core Mexican holiday missing: ${coreHoliday}`,
				);
			}
		});
	});
});
