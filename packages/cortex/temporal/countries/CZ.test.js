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
import { CZ } from "./CZ.js";

describe("Czech holiday definitions (CZ)", () => {
	describe("Structure validation", () => {
		it("should have proper structure", () => {
			assert.ok(typeof CZ === "object");
			assert.ok(Array.isArray(CZ.national));
			assert.ok(typeof CZ.regional === "object");
		});

		it("should have national holidays as HolidayDefinition instances", () => {
			assert.ok(CZ.national.length > 0);

			for (const holiday of CZ.national) {
				assert.ok(holiday instanceof HolidayDefinition);
			}
		});

		it("should have 13 national holidays", () => {
			// Czech Republic has 13 official public holidays
			assert.strictEqual(CZ.national.length, 13);
		});
	});

	describe("Holiday validation", () => {
		it("should have expected national holidays", () => {
			const nationalNames = CZ.national.map((h) => h.name);

			const expectedHolidays = [
				"Nový rok",
				"Den obnovy samostatného českého státu",
				"Velikonoční pondělí",
				"Svátek práce",
				"Den vítězství",
				"Den slovanských věrozvěstů Cyrila a Metoděje",
				"Den upálení mistra Jana Husa",
				"Den české státnosti",
				"Den vzniku samostatného československého státu",
				"Den boje za svobodu a demokracii",
				"Štědrý den",
				"1. svátek vánoční",
				"2. svátek vánoční",
			];

			for (const expected of expectedHolidays) {
				assert.ok(
					nationalNames.includes(expected),
					`Missing national holiday: ${expected}`,
				);
			}
		});

		it("should calculate Christmas Eve correctly", () => {
			const christmasEve = CZ.national.find((h) => h.name === "Štědrý den");
			assert.ok(christmasEve);

			const holiday2024 = christmasEve.calculateHoliday(2024);
			assert.strictEqual(holiday2024.date.getUTCMonth(), 11); // December
			assert.strictEqual(holiday2024.date.getUTCDate(), 24);
			assert.strictEqual(holiday2024.workFree, true);
		});
	});

	describe("Data consistency", () => {
		it("should have consistent holiday definitions", () => {
			for (const holiday of CZ.national) {
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
