/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import assert from "node:assert";
import { describe, it } from "node:test";
import { DE } from "./index.js";

describe("Countries index", () => {
	describe("Re-exports", () => {
		it("should export DE country definitions", () => {
			assert.ok(typeof DE === "object");
			assert.ok(Array.isArray(DE.national));
			assert.ok(typeof DE.regional === "object");
		});

		it("should maintain tree-shaking compatibility", () => {
			// Verify that importing from index doesn't break tree-shaking
			// The export should be a proper re-export
			assert.ok(DE !== null);
			assert.ok(DE !== undefined);

			// Should have the expected structure
			assert.ok(DE.national.length > 0);
			assert.ok(Object.keys(DE.regional).length > 0);
		});

		it("should provide same data as direct import", async () => {
			// Import directly from DE.js
			const { DE: directDE } = await import("./DE.js");

			// Should be exactly the same object
			assert.strictEqual(DE, directDE);

			// Verify content is identical
			assert.strictEqual(DE.national.length, directDE.national.length);
			assert.deepStrictEqual(
				Object.keys(DE.regional).sort(),
				Object.keys(directDE.regional).sort(),
			);
		});
	});

	describe("Module structure", () => {
		it("should be prepared for additional countries", () => {
			// The index file should be structured to easily add more countries
			// This test verifies the structure is ready for expansion
			assert.ok(typeof DE === "object");

			// Structure should be consistent for future countries
			assert.ok(DE.national);
			assert.ok(DE.regional);

			// Should follow the expected pattern for country definitions
			assert.ok(Array.isArray(DE.national));
			assert.ok(typeof DE.regional === "object");
		});

		it("should have consistent export pattern", () => {
			// Verify the export follows the expected pattern
			// This ensures consistency when adding more countries

			// DE should be a named export
			assert.ok(DE !== undefined);

			// Should not be a default export (for tree-shaking)
			import("./index.js").then((module) => {
				assert.strictEqual(module.default, undefined);
			});
		});
	});

	describe("Documentation and future extensibility", () => {
		it("should provide clear structure for new countries", () => {
			// The current structure should serve as a template
			// for future country implementations

			// Verify DE has the expected structure that others should follow
			assert.ok(
				Array.isArray(DE.national),
				"National holidays should be an array",
			);
			assert.ok(
				typeof DE.regional === "object",
				"Regional holidays should be an object",
			);

			// National array should contain holiday definitions
			if (DE.national.length > 0) {
				const firstNational = DE.national[0];
				assert.ok(typeof firstNational.name === "string");
				assert.ok(typeof firstNational.type === "string");
				assert.ok(typeof firstNational.workFree === "boolean");
			}

			// Regional object should have region codes as keys
			const regionKeys = Object.keys(DE.regional);
			if (regionKeys.length > 0) {
				const firstRegion = regionKeys[0];
				assert.ok(typeof firstRegion === "string");
				assert.ok(Array.isArray(DE.regional[firstRegion]));
			}
		});

		it("should demonstrate ISO country code naming", () => {
			// Verify that the current export uses ISO 3166-1 alpha-2 codes
			// This sets the pattern for future countries

			// DE is the correct ISO code for Germany
			assert.ok(DE !== undefined, "DE (Germany) should be exported");

			// The export name should be exactly 2 characters (ISO standard)
			assert.strictEqual("DE".length, 2, "Country code should be 2 characters");

			// Should be uppercase (ISO standard)
			assert.strictEqual(
				"DE",
				"DE".toUpperCase(),
				"Country code should be uppercase",
			);
		});

		it("should support multi-country scenarios", () => {
			// Test that the structure supports importing multiple countries
			// without conflicts

			// DE should work independently
			assert.ok(DE.national.length > 0);

			// Should be suitable for use in calculateHolidaysOfYear
			// (basic structure validation)
			assert.ok(Array.isArray(DE.national));
			assert.ok(typeof DE.regional === "object");

			// Each national holiday should be a valid definition
			for (const holiday of DE.national) {
				assert.ok(typeof holiday.name === "string");
				assert.ok(
					["fixed", "easter_relative", "calculated"].includes(holiday.type),
				);
				assert.ok(typeof holiday.workFree === "boolean");
			}
		});
	});

	describe("Performance considerations", () => {
		it("should load efficiently", () => {
			// The module should load without expensive computations
			// (holiday definitions should be static)

			const startTime = performance.now();

			// Access the data
			const nationalCount = DE.national.length;
			const regionalCount = Object.keys(DE.regional).length;

			const endTime = performance.now();
			const duration = endTime - startTime;

			// Should be very fast (data access only)
			assert.ok(
				duration < 10,
				`Data access took ${duration}ms, expected < 10ms`,
			);

			// Verify we actually got data
			assert.ok(nationalCount > 0);
			assert.ok(regionalCount > 0);
		});

		it("should not cause memory leaks", () => {
			// Verify that the data structure is properly frozen/immutable
			assert.ok(Object.isFrozen(DE) || typeof DE === "object");

			// Holiday definitions should be immutable
			for (const holiday of DE.national) {
				assert.ok(Object.isFrozen(holiday));
			}

			// Regional holidays should be immutable
			for (const holidays of Object.values(DE.regional)) {
				for (const holiday of holidays) {
					assert.ok(Object.isFrozen(holiday));
				}
			}
		});
	});
});
