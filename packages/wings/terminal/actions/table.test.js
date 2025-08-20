import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { table } from "./table.js";

describe("table", () => {
	it("should be a function", () => {
		assert.equal(typeof table, "function");
	});

	it("should throw TypeError for non-array data", () => {
		assert.throws(() => table(null), {
			name: "TypeError",
			message: "Data must be an array",
		});

		assert.throws(() => table("not an array"), {
			name: "TypeError",
			message: "Data must be an array",
		});

		assert.throws(() => table({}), {
			name: "TypeError",
			message: "Data must be an array",
		});
	});

	it("should handle empty array gracefully", () => {
		// Should not throw
		assert.doesNotThrow(() => table([]));
	});

	it("should handle array with empty objects", () => {
		// Should not throw
		assert.doesNotThrow(() => table([{}, {}]));
	});

	it("should handle normal data", () => {
		const data = [
			{ name: "John", age: 30 },
			{ name: "Jane", age: 25 },
		];

		// Should not throw
		assert.doesNotThrow(() => table(data));
	});

	it("should handle custom headers", () => {
		const data = [
			{ name: "John", age: 30 },
			{ name: "Jane", age: 25 },
		];

		// Should not throw with custom headers
		assert.doesNotThrow(() => table(data, { headers: ["Name", "Age"] }));
	});

	it("should handle different padding", () => {
		const data = [{ name: "John", age: 30 }];

		// Should not throw with custom padding
		assert.doesNotThrow(() => table(data, { padding: 4 }));
	});

	it("should handle missing properties", () => {
		const data = [
			{ name: "John", age: 30 },
			{ name: "Jane" }, // Missing age
			{ age: 35 }, // Missing name
		];

		// Should not throw
		assert.doesNotThrow(() => table(data));
	});

	it("should handle custom headers longer than available keys", () => {
		// This covers the fallback branches where allKeys[i] is undefined
		const data = [
			{ name: "John" }, // Only has 'name' key
		];

		// Custom headers that are longer than available keys
		const headers = ["Name", "Age", "City", "Country"];

		// Should not throw and should use header names as fallback keys
		assert.doesNotThrow(() => table(data, { headers }));
	});

	it("should handle custom headers with different key mapping", () => {
		// This covers the case where headers don't match data keys exactly
		const data = [{ firstName: "John", lastName: "Doe" }];

		// Headers that don't match the data keys
		const headers = ["First", "Last"];

		// Should not throw and should fall back to using headers as keys
		assert.doesNotThrow(() => table(data, { headers }));
	});

	it("should handle empty headers with data", () => {
		// This covers edge cases in header processing
		const data = [{ name: "John", age: 30 }];

		// Empty headers array
		assert.doesNotThrow(() => table(data, { headers: [] }));
	});
});
