/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import assert from "node:assert";
import { describe, it } from "node:test";
import { Holiday } from "./holiday.js";

describe("Holiday class", () => {
	describe("Constructor and properties", () => {
		it("should create holiday with all properties", () => {
			const date = new Date("2024-01-01T00:00:00.000Z");
			const holiday = new Holiday(
				"Test Holiday",
				date,
				true,
				"national",
				"fixed",
			);

			assert.strictEqual(holiday.name, "Test Holiday");
			assert.strictEqual(holiday.date, date);
			assert.strictEqual(holiday.workFree, true);
			assert.strictEqual(holiday.scope, "national");
			assert.strictEqual(holiday.type, "fixed");
		});

		it("should be immutable after creation", () => {
			const date = new Date("2024-01-01T00:00:00.000Z");
			const holiday = new Holiday("Test", date, true, "national", "fixed");

			assert.ok(Object.isFrozen(holiday));
		});
	});

	describe("Getter methods", () => {
		it("should provide isWorkFree getter", () => {
			const date = new Date("2024-01-01T00:00:00.000Z");
			const workFree = new Holiday(
				"Work Free",
				date,
				true,
				"national",
				"fixed",
			);
			const observance = new Holiday(
				"Observance",
				date,
				false,
				"national",
				"fixed",
			);

			assert.strictEqual(workFree.isWorkFree, true);
			assert.strictEqual(observance.isWorkFree, false);
		});

		it("should provide isNational getter", () => {
			const date = new Date("2024-01-01T00:00:00.000Z");
			const national = new Holiday("National", date, true, "national", "fixed");
			const regional = new Holiday("Regional", date, true, "regional", "fixed");

			assert.strictEqual(national.isNational, true);
			assert.strictEqual(regional.isNational, false);
		});

		it("should provide isRegional getter", () => {
			const date = new Date("2024-01-01T00:00:00.000Z");
			const national = new Holiday("National", date, true, "national", "fixed");
			const regional = new Holiday("Regional", date, true, "regional", "fixed");

			assert.strictEqual(national.isRegional, false);
			assert.strictEqual(regional.isRegional, true);
		});
	});

	describe("toString method", () => {
		it("should format holiday string correctly", () => {
			const date = new Date("2024-01-01T00:00:00.000Z");
			const holiday = new Holiday("New Year", date, true, "national", "fixed");

			const result = holiday.toString();
			assert.strictEqual(result, "New Year (2024-01-01) - National Work-free");
		});

		it("should format regional observance correctly", () => {
			const date = new Date("2024-06-15T00:00:00.000Z");
			const holiday = new Holiday(
				"Regional Day",
				date,
				false,
				"regional",
				"fixed",
			);

			const result = holiday.toString();
			assert.strictEqual(
				result,
				"Regional Day (2024-06-15) - Regional Observance",
			);
		});

		it("should handle different holiday types in toString", () => {
			const date = new Date("2024-04-01T00:00:00.000Z");
			const types = ["fixed", "easter_relative", "calculated"];

			for (const type of types) {
				const holiday = new Holiday(
					"Test Holiday",
					date,
					true,
					"national",
					type,
				);
				const result = holiday.toString();
				assert.ok(result.includes("Test Holiday"));
				assert.ok(result.includes("2024-04-01"));
				assert.ok(result.includes("National"));
				assert.ok(result.includes("Work-free"));
			}
		});
	});

	describe("isOnDate method", () => {
		it("should correctly identify matching dates", () => {
			const date1 = new Date("2024-01-01T00:00:00.000Z");
			const date2 = new Date("2024-01-01T00:00:00.000Z");
			const date3 = new Date("2024-01-02T00:00:00.000Z");

			const holiday = new Holiday("Test", date1, true, "national", "fixed");

			assert.strictEqual(holiday.isOnDate(date2), true);
			assert.strictEqual(holiday.isOnDate(date3), false);
		});

		it("should handle time differences correctly", () => {
			const dateUTC = new Date("2024-01-01T00:00:00.000Z");
			const dateWithTime = new Date("2024-01-01T12:30:45.123Z");

			const holiday = new Holiday("Test", dateUTC, true, "national", "fixed");

			// Should be true because they're on the same calendar date
			assert.strictEqual(holiday.isOnDate(dateWithTime), true);
		});

		it("should handle same calendar date with different times", () => {
			const date1 = new Date("2024-01-01T00:00:00.000Z");
			const date2 = new Date("2024-01-01T23:59:59.999Z");

			const holiday = new Holiday("Test", date1, true, "national", "fixed");

			// Different times on same calendar date should be true
			assert.strictEqual(holiday.isOnDate(date2), true);
		});
	});

	describe("Data integrity", () => {
		it("should handle various holiday types", () => {
			const date = new Date("2024-01-01T00:00:00.000Z");
			const types = ["fixed", "easter_relative", "calculated"];

			for (const type of types) {
				const holiday = new Holiday("Test", date, true, "national", type);
				assert.strictEqual(holiday.type, type);
			}
		});

		it("should handle various scopes", () => {
			const date = new Date("2024-01-01T00:00:00.000Z");
			const scopes = ["national", "regional"];

			for (const scope of scopes) {
				const holiday = new Holiday("Test", date, true, scope, "fixed");
				assert.strictEqual(holiday.scope, scope);
			}
		});

		it("should preserve date object reference", () => {
			const date = new Date("2024-01-01T00:00:00.000Z");
			const holiday = new Holiday("Test", date, true, "national", "fixed");

			assert.strictEqual(holiday.date, date);
		});

		it("should handle different workFree values", () => {
			const date = new Date("2024-01-01T00:00:00.000Z");

			const workFree = new Holiday(
				"Work Free",
				date,
				true,
				"national",
				"fixed",
			);
			const observance = new Holiday(
				"Observance",
				date,
				false,
				"national",
				"fixed",
			);

			assert.strictEqual(workFree.workFree, true);
			assert.strictEqual(observance.workFree, false);

			assert.strictEqual(workFree.isWorkFree, true);
			assert.strictEqual(observance.isWorkFree, false);
		});
	});

	describe("Immutability", () => {
		it("should prevent modification of properties", () => {
			const date = new Date("2024-01-01T00:00:00.000Z");
			const holiday = new Holiday("Test", date, true, "national", "fixed");

			// Attempt to modify properties should fail silently or throw
			const originalName = holiday.name;
			const originalDate = holiday.date;
			const originalWorkFree = holiday.workFree;
			const originalScope = holiday.scope;
			const originalType = holiday.type;

			try {
				holiday.name = "Modified";
				holiday.workFree = false;
				holiday.scope = "regional";
				holiday.type = "calculated";
			} catch (_error) {
				// Expected in strict mode
			}

			// Values should remain unchanged
			assert.strictEqual(holiday.name, originalName);
			assert.strictEqual(holiday.date, originalDate);
			assert.strictEqual(holiday.workFree, originalWorkFree);
			assert.strictEqual(holiday.scope, originalScope);
			assert.strictEqual(holiday.type, originalType);
		});

		it("should not allow property addition", () => {
			const date = new Date("2024-01-01T00:00:00.000Z");
			const holiday = new Holiday("Test", date, true, "national", "fixed");

			try {
				holiday.newProperty = "should not work";
			} catch (_error) {
				// Expected in strict mode
			}

			assert.strictEqual(holiday.newProperty, undefined);
		});
	});

	describe("Edge cases and robustness", () => {
		it("should handle unusual but valid names", () => {
			const date = new Date("2024-01-01T00:00:00.000Z");
			const names = [
				"New Year's Day",
				"Día de los Muertos",
				"König's Birthday",
				"123 Numeric Holiday",
				"!@# Special Characters",
			];

			for (const name of names) {
				const holiday = new Holiday(name, date, true, "national", "fixed");
				assert.strictEqual(holiday.name, name);
			}
		});

		it("should handle edge date values", () => {
			const dates = [
				new Date("1583-01-01T00:00:00.000Z"), // Gregorian calendar start
				new Date("2000-02-29T00:00:00.000Z"), // Leap year
				new Date("2100-01-01T00:00:00.000Z"), // Future date
				new Date("9999-12-31T23:59:59.999Z"), // Far future
			];

			for (const date of dates) {
				const holiday = new Holiday("Test", date, true, "national", "fixed");
				assert.strictEqual(holiday.date, date);
			}
		});

		it("should maintain consistent behavior across instances", () => {
			const date = new Date("2024-01-01T00:00:00.000Z");

			const holiday1 = new Holiday("Test", date, true, "national", "fixed");
			const holiday2 = new Holiday("Test", date, true, "national", "fixed");

			// Should have same properties but be different objects
			assert.notStrictEqual(holiday1, holiday2);
			assert.strictEqual(holiday1.name, holiday2.name);
			assert.strictEqual(holiday1.date, holiday2.date);
			assert.strictEqual(holiday1.workFree, holiday2.workFree);
			assert.strictEqual(holiday1.scope, holiday2.scope);
			assert.strictEqual(holiday1.type, holiday2.type);
		});
	});
});
