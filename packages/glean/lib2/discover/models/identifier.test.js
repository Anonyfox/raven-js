/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Test suite for the Identifier class.
 */

import { deepStrictEqual, strictEqual } from "node:assert";
import { test } from "node:test";
import { Identifier } from "./identifier.js";

test("Identifier - constructor with all fields", () => {
	const id = new Identifier("exported", "original", "./source.js");

	strictEqual(id.exportedName, "exported");
	strictEqual(id.originalName, "original");
	strictEqual(id.sourcePath, "./source.js");
});

test("Identifier - constructor with null sourcePath", () => {
	const id = new Identifier("myExport", "myOriginal", null);

	strictEqual(id.exportedName, "myExport");
	strictEqual(id.originalName, "myOriginal");
	strictEqual(id.sourcePath, null);
});

test("Identifier - toString with sourcePath", () => {
	const id = new Identifier("exported", "original", "./source.js");
	const expected = "exported (original from ./source.js)";

	strictEqual(id.toString(), expected);
});

test("Identifier - toString without sourcePath, same names", () => {
	const id = new Identifier("same", "same", null);

	strictEqual(id.toString(), "same");
});

test("Identifier - toString without sourcePath, different names", () => {
	const id = new Identifier("exported", "original", null);
	const expected = "exported (original)";

	strictEqual(id.toString(), expected);
});

test("Identifier - toJSON", () => {
	const id = new Identifier("exported", "original", "./source.js");
	const expected = {
		exportedName: "exported",
		originalName: "original",
		sourcePath: "./source.js",
	};

	deepStrictEqual(id.toJSON(), expected);
});

test("Identifier - fromObject", () => {
	const obj = {
		exportedName: "exported",
		originalName: "original",
		sourcePath: "./source.js",
	};

	const id = Identifier.fromObject(obj);

	strictEqual(id.exportedName, "exported");
	strictEqual(id.originalName, "original");
	strictEqual(id.sourcePath, "./source.js");
});

test("Identifier - round trip via toJSON and fromObject", () => {
	const original = new Identifier("exported", "original", "./source.js");
	const roundTrip = Identifier.fromObject(original.toJSON());

	strictEqual(roundTrip.exportedName, original.exportedName);
	strictEqual(roundTrip.originalName, original.originalName);
	strictEqual(roundTrip.sourcePath, original.sourcePath);
});
