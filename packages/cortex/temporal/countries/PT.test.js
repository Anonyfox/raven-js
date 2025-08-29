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
import { PT } from "./PT.js";

describe("Portuguese holiday definitions (PT)", () => {
	describe("Structure validation", () => {
		it("should have proper structure", () => {
			assert.ok(typeof PT === "object");
			assert.ok(Array.isArray(PT.national));
			assert.ok(typeof PT.regional === "object");
		});

		it("should have national holidays as HolidayDefinition instances", () => {
			assert.ok(PT.national.length > 0);

			for (const holiday of PT.national) {
				assert.ok(holiday instanceof HolidayDefinition);
			}
		});

		it("should have 13 national holidays", () => {
			// Portugal has 13 official national holidays
			assert.strictEqual(PT.national.length, 13);
		});
	});

	describe("Holiday validation", () => {
		it("should have expected national holidays", () => {
			const nationalNames = PT.national.map((h) => h.name);

			const expectedHolidays = [
				"Ano Novo",
				"Sexta-feira Santa",
				"Páscoa",
				"Dia da Liberdade",
				"Dia do Trabalhador",
				"Dia de Portugal",
				"Corpo de Deus",
				"Assunção de Nossa Senhora",
				"Implantação da República",
				"Dia de Todos os Santos",
				"Restauração da Independência",
				"Imaculada Conceição",
				"Natal",
			];

			for (const expected of expectedHolidays) {
				assert.ok(
					nationalNames.includes(expected),
					`Missing national holiday: ${expected}`,
				);
			}
		});

		it("should calculate Portugal Day correctly", () => {
			const portugalDay = PT.national.find((h) => h.name === "Dia de Portugal");
			assert.ok(portugalDay);

			const holiday2024 = portugalDay.calculateHoliday(2024);
			assert.strictEqual(holiday2024.date.getUTCMonth(), 5); // June
			assert.strictEqual(holiday2024.date.getUTCDate(), 10);
			assert.strictEqual(holiday2024.workFree, true);
		});

		it("should have regional variations", () => {
			const regions = Object.keys(PT.regional);
			assert.ok(regions.length > 0);

			// Should have major cities and autonomous regions
			assert.ok(PT.regional.LISBOA);
			assert.ok(PT.regional.PORTO);
		});
	});

	describe("Data consistency", () => {
		it("should have consistent holiday definitions", () => {
			const allHolidays = [
				...PT.national,
				...Object.values(PT.regional).flat(),
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
