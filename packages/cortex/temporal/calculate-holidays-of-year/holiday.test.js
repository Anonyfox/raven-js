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

describe("Holiday result class", () => {
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

			// Attempt to modify should fail
			try {
				holiday.name = "Modified";
				assert.strictEqual(holiday.name, "Test");
			} catch (error) {
				assert.ok(error instanceof TypeError);
			}
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

			assert.strictEqual(holiday.isOnDate(dateWithTime), false);
		});
	});

	describe("Data integrity", () => {
		it("should handle various holiday types", () => {
			const date = new Date("2024-01-01T00:00:00.000Z");
			const types = ["fixed", "easter_relative", "calculated"];

			types.forEach((type) => {
				const holiday = new Holiday("Test", date, true, "national", type);
				assert.strictEqual(holiday.type, type);
			});
		});

		it("should handle various scopes", () => {
			const date = new Date("2024-01-01T00:00:00.000Z");
			const scopes = ["national", "regional"];

			scopes.forEach((scope) => {
				const holiday = new Holiday("Test", date, true, scope, "fixed");
				assert.strictEqual(holiday.scope, scope);
			});
		});

		it("should preserve date object reference", () => {
			const date = new Date("2024-01-01T00:00:00.000Z");
			const holiday = new Holiday("Test", date, true, "national", "fixed");

			assert.strictEqual(holiday.date, date);
			assert.strictEqual(holiday.date.getTime(), date.getTime());
		});
	});
});
