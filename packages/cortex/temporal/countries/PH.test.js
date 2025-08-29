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
import { PH } from "./PH.js";

describe("Philippine holiday definitions (PH)", () => {
	describe("Structure validation", () => {
		it("should have proper structure", () => {
			assert.ok(typeof PH === "object");
			assert.ok(Array.isArray(PH.national));
			assert.ok(typeof PH.regional === "object");
		});

		it("should have national holidays as HolidayDefinition instances", () => {
			assert.ok(PH.national.length > 0);

			for (const holiday of PH.national) {
				assert.ok(holiday instanceof HolidayDefinition);
			}
		});

		it("should have regional holidays as HolidayDefinition instances", () => {
			const regions = Object.keys(PH.regional);

			for (const region of regions) {
				assert.ok(Array.isArray(PH.regional[region]));

				for (const holiday of PH.regional[region]) {
					assert.ok(holiday instanceof HolidayDefinition);
				}
			}
		});

		it("should have 17 national holidays", () => {
			// Philippines has 17 official holidays (regular + special non-working)
			assert.strictEqual(PH.national.length, 17);
		});

		it("should have regional variations", () => {
			const regions = Object.keys(PH.regional);
			assert.ok(regions.length >= 2); // Should have BARMM and CAR
		});
	});

	describe("Holiday validation", () => {
		it("should have expected national holidays", () => {
			const nationalNames = PH.national.map((h) => h.name);

			const expectedHolidays = [
				"New Year's Day",
				"People Power Anniversary",
				"Maundy Thursday",
				"Good Friday",
				"Black Saturday",
				"Araw ng Kagitingan",
				"Labor Day",
				"Independence Day",
				"Ninoy Aquino Day",
				"National Heroes Day",
				"All Saints' Day",
				"Bonifacio Day",
				"Rizal Day",
				"Christmas Day",
				"Last Day of the Year",
				"Chinese New Year",
				"Eid al-Fitr",
			];

			for (const expected of expectedHolidays) {
				assert.ok(
					nationalNames.includes(expected),
					`Missing national holiday: ${expected}`,
				);
			}
		});

		it("should have Catholic Holy Week holidays", () => {
			const nationalNames = PH.national.map((h) => h.name);

			const holyWeekHolidays = [
				"Maundy Thursday",
				"Good Friday",
				"Black Saturday",
			];

			for (const holiday of holyWeekHolidays) {
				assert.ok(
					nationalNames.includes(holiday),
					`Missing Holy Week holiday: ${holiday}`,
				);
			}
		});

		it("should have national heroes holidays", () => {
			const nationalNames = PH.national.map((h) => h.name);

			const heroesHolidays = [
				"Araw ng Kagitingan", // Day of Valor
				"Ninoy Aquino Day",
				"National Heroes Day",
				"Bonifacio Day",
				"Rizal Day",
			];

			for (const holiday of heroesHolidays) {
				assert.ok(
					nationalNames.includes(holiday),
					`Missing heroes holiday: ${holiday}`,
				);
			}
		});

		it("should have BARMM regional holidays", () => {
			assert.ok(PH.regional.BARMM);
			const barmmNames = PH.regional.BARMM.map((h) => h.name);

			assert.ok(barmmNames.includes("Eid al-Adha"));
			assert.ok(barmmNames.includes("Maulid un-Nabi"));
		});

		it("should distinguish work-free vs special non-working holidays", () => {
			const workFreeHolidays = PH.national.filter((h) => h.workFree === true);
			const specialHolidays = PH.national.filter((h) => h.workFree === false);

			assert.ok(workFreeHolidays.length > 0);
			assert.ok(specialHolidays.length > 0);

			// Chinese New Year and Eid al-Fitr should be special non-working
			const chineseNewYear = PH.national.find(
				(h) => h.name === "Chinese New Year",
			);
			const eidAlFitr = PH.national.find((h) => h.name === "Eid al-Fitr");

			assert.ok(chineseNewYear);
			assert.strictEqual(chineseNewYear.workFree, false);
			assert.ok(eidAlFitr);
			assert.strictEqual(eidAlFitr.workFree, false);
		});
	});

	describe("Holiday calculations", () => {
		it("should calculate New Year correctly", () => {
			const newYear = PH.national.find((h) => h.name === "New Year's Day");
			assert.ok(newYear);

			const holiday2024 = newYear.calculateHoliday(2024);
			assert.strictEqual(holiday2024.date.getUTCMonth(), 0); // January
			assert.strictEqual(holiday2024.date.getUTCDate(), 1);
			assert.strictEqual(holiday2024.workFree, true);
		});

		it("should calculate Independence Day correctly", () => {
			const independenceDay = PH.national.find(
				(h) => h.name === "Independence Day",
			);
			assert.ok(independenceDay);

			const holiday2024 = independenceDay.calculateHoliday(2024);
			assert.strictEqual(holiday2024.date.getUTCMonth(), 5); // June
			assert.strictEqual(holiday2024.date.getUTCDate(), 12);
			assert.strictEqual(holiday2024.workFree, true);
		});

		it("should calculate Rizal Day correctly", () => {
			const rizalDay = PH.national.find((h) => h.name === "Rizal Day");
			assert.ok(rizalDay);

			const holiday2024 = rizalDay.calculateHoliday(2024);
			assert.strictEqual(holiday2024.date.getUTCMonth(), 11); // December
			assert.strictEqual(holiday2024.date.getUTCDate(), 30);
			assert.strictEqual(holiday2024.workFree, true);
		});

		it("should calculate National Heroes Day correctly", () => {
			const heroesDay = PH.national.find(
				(h) => h.name === "National Heroes Day",
			);
			assert.ok(heroesDay);
			assert.strictEqual(heroesDay.type, "calculated");

			const holiday2024 = heroesDay.calculateHoliday(2024);
			assert.ok(holiday2024.date instanceof Date);
			assert.strictEqual(holiday2024.date.getUTCMonth(), 7); // August
			assert.strictEqual(holiday2024.date.getUTCDay(), 1); // Should be Monday
			assert.strictEqual(holiday2024.workFree, true);
		});

		it("should handle Easter-relative holidays", () => {
			const easterHolidays = PH.national.filter(
				(h) => h.type === "easter_relative",
			);

			assert.strictEqual(easterHolidays.length, 3); // Maundy Thursday, Good Friday, Black Saturday

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
				...PH.national,
				...Object.values(PH.regional).flat(),
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

		it("should maintain Philippine institutional memory", () => {
			const allNames = [
				...PH.national.map((h) => h.name),
				...Object.values(PH.regional)
					.flat()
					.map((h) => h.name),
			];

			// Core Philippine holidays that should always be present
			const coreHolidays = [
				"New Year's Day",
				"Independence Day",
				"Rizal Day",
				"Christmas Day",
			];

			for (const coreHoliday of coreHolidays) {
				assert.ok(
					allNames.includes(coreHoliday),
					`Core Philippine holiday missing: ${coreHoliday}`,
				);
			}
		});
	});
});
