/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Test suite for the Identifier class - Raven doctrine applied.
 */

import { deepStrictEqual, strictEqual } from "node:assert";
import { describe, test } from "node:test";
import { Identifier } from "./identifier.js";

describe("core functionality", () => {
	test("should create instances and provide property access with all combinations", () => {
		// Test constructor with all fields
		const fullId = new Identifier("exported", "original", "./source.js");
		strictEqual(fullId.exportedName, "exported");
		strictEqual(fullId.originalName, "original");
		strictEqual(fullId.sourcePath, "./source.js");

		// Test constructor with null sourcePath
		const nullSourceId = new Identifier("myExport", "myOriginal", null);
		strictEqual(nullSourceId.exportedName, "myExport");
		strictEqual(nullSourceId.originalName, "myOriginal");
		strictEqual(nullSourceId.sourcePath, null);
	});

	test("should generate correct string representations for all patterns", () => {
		// With sourcePath
		const withSource = new Identifier("exported", "original", "./source.js");
		strictEqual(withSource.toString(), "exported (original from ./source.js)");

		// Without sourcePath, same names
		const sameNames = new Identifier("same", "same", null);
		strictEqual(sameNames.toString(), "same");

		// Without sourcePath, different names
		const diffNames = new Identifier("exported", "original", null);
		strictEqual(diffNames.toString(), "exported (original)");
	});

	test("should serialize and deserialize maintaining data integrity", () => {
		const original = new Identifier("exported", "original", "./source.js");

		// Test toJSON
		const serialized = original.toJSON();
		deepStrictEqual(serialized, {
			exportedName: "exported",
			originalName: "original",
			sourcePath: "./source.js",
		});

		// Test fromObject
		const deserialized = Identifier.fromObject(serialized);
		strictEqual(deserialized.exportedName, original.exportedName);
		strictEqual(deserialized.originalName, original.originalName);
		strictEqual(deserialized.sourcePath, original.sourcePath);

		// Test round trip integrity
		const roundTrip = Identifier.fromObject(original.toJSON());
		strictEqual(roundTrip.exportedName, original.exportedName);
		strictEqual(roundTrip.originalName, original.originalName);
		strictEqual(roundTrip.sourcePath, original.sourcePath);

		// Test toJSON with null sourcePath
		const nullSourceId = new Identifier("local", "local", null);
		const nullSerialized = nullSourceId.toJSON();
		deepStrictEqual(nullSerialized, {
			exportedName: "local",
			originalName: "local",
			sourcePath: null,
		});

		// Test fromObject with null sourcePath
		const nullDeserialized = Identifier.fromObject(nullSerialized);
		strictEqual(nullDeserialized.sourcePath, null);
	});
});
