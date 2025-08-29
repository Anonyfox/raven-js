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
import { IN } from "./IN.js";

describe("Indian holiday definitions (IN)", () => {
	describe("Structure validation", () => {
		it("should have proper structure", () => {
			assert.ok(typeof IN === "object");
			assert.ok(Array.isArray(IN.national));
			assert.ok(typeof IN.regional === "object");
		});

		it("should have national holidays as HolidayDefinition instances", () => {
			assert.ok(IN.national.length > 0);

			for (const holiday of IN.national) {
				assert.ok(holiday instanceof HolidayDefinition);
			}
		});

		it("should have regional holidays as HolidayDefinition instances", () => {
			const regions = Object.keys(IN.regional);

			for (const region of regions) {
				assert.ok(Array.isArray(IN.regional[region]));

				for (const holiday of IN.regional[region]) {
					assert.ok(holiday instanceof HolidayDefinition);
				}
			}
		});

		it("should have 11 national holidays", () => {
			// India has 11 gazetted holidays
			assert.strictEqual(IN.national.length, 11);
		});

		it("should have multiple states", () => {
			const states = Object.keys(IN.regional);
			assert.ok(states.length >= 6); // Should have major states
		});
	});

	describe("Holiday validation", () => {
		it("should have expected national holidays", () => {
			const nationalNames = IN.national.map((h) => h.name);

			const expectedHolidays = [
				"Republic Day",
				"Independence Day",
				"Gandhi Jayanti",
				"Diwali",
				"Holi",
				"Dussehra",
				"Eid al-Fitr",
				"Eid al-Adha",
				"Good Friday",
				"Buddha Purnima",
				"Guru Nanak Jayanti",
			];

			for (const expected of expectedHolidays) {
				assert.ok(
					nationalNames.includes(expected),
					`Missing national holiday: ${expected}`,
				);
			}
		});

		it("should have Maharashtra state holidays", () => {
			assert.ok(IN.regional.MH);
			const maharashtraNames = IN.regional.MH.map((h) => h.name);

			assert.ok(maharashtraNames.includes("Maharashtra Day"));
			assert.ok(maharashtraNames.includes("Gudi Padwa"));
		});

		it("should have Tamil Nadu state holidays", () => {
			assert.ok(IN.regional.TN);
			const tamilNaduNames = IN.regional.TN.map((h) => h.name);

			assert.ok(tamilNaduNames.includes("Tamil New Year"));
			assert.ok(tamilNaduNames.includes("Pongal"));
		});

		it("should have West Bengal state holidays", () => {
			assert.ok(IN.regional.WB);
			const westBengalNames = IN.regional.WB.map((h) => h.name);

			assert.ok(westBengalNames.includes("Poila Boishakh"));
			assert.ok(westBengalNames.includes("Durga Puja"));
		});
	});

	describe("Holiday calculations", () => {
		it("should calculate Republic Day correctly", () => {
			const republicDay = IN.national.find((h) => h.name === "Republic Day");
			assert.ok(republicDay);

			const holiday2024 = republicDay.calculateHoliday(2024);
			assert.strictEqual(holiday2024.date.getUTCMonth(), 0); // January
			assert.strictEqual(holiday2024.date.getUTCDate(), 26);
			assert.strictEqual(holiday2024.workFree, true);
		});

		it("should calculate Independence Day correctly", () => {
			const independenceDay = IN.national.find(
				(h) => h.name === "Independence Day",
			);
			assert.ok(independenceDay);

			const holiday2024 = independenceDay.calculateHoliday(2024);
			assert.strictEqual(holiday2024.date.getUTCMonth(), 7); // August
			assert.strictEqual(holiday2024.date.getUTCDate(), 15);
			assert.strictEqual(holiday2024.workFree, true);
		});

		it("should calculate Gandhi Jayanti correctly", () => {
			const gandhiJayanti = IN.national.find(
				(h) => h.name === "Gandhi Jayanti",
			);
			assert.ok(gandhiJayanti);

			const holiday2024 = gandhiJayanti.calculateHoliday(2024);
			assert.strictEqual(holiday2024.date.getUTCMonth(), 9); // October
			assert.strictEqual(holiday2024.date.getUTCDate(), 2);
			assert.strictEqual(holiday2024.workFree, true);
		});

		it("should handle calculated holidays", () => {
			const calculatedHolidays = IN.national.filter(
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
				...IN.national,
				...Object.values(IN.regional).flat(),
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

		it("should maintain Indian institutional memory", () => {
			const allNames = [
				...IN.national.map((h) => h.name),
				...Object.values(IN.regional)
					.flat()
					.map((h) => h.name),
			];

			// Core Indian holidays that should always be present
			const coreHolidays = [
				"Republic Day",
				"Independence Day",
				"Gandhi Jayanti",
				"Diwali",
			];

			for (const coreHoliday of coreHolidays) {
				assert.ok(
					allNames.includes(coreHoliday),
					`Core Indian holiday missing: ${coreHoliday}`,
				);
			}
		});
	});
});
