/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Integration tests for transformation module exports.
 */

import { strictEqual } from "node:assert";
import { describe, it } from "node:test";
import { stemCistem, stemPorter2 } from "./index.js";

describe("transformation module", () => {
	it("exports stemming functions", () => {
		strictEqual(typeof stemPorter2, "function");
		strictEqual(typeof stemCistem, "function");
	});

	it("demonstrates English transformation pipeline", () => {
		// Test basic English transformation workflow
		const words = ["running", "nationalization", "responsibilities"];
		const expected = ["run", "nation", "respons"];

		const results = words.map((word) => stemPorter2(word));

		for (let i = 0; i < words.length; i++) {
			strictEqual(
				results[i],
				expected[i],
				`Failed English transformation: ${words[i]} -> ${expected[i]}`,
			);
		}
	});

	it("demonstrates German transformation pipeline", () => {
		// Test basic German transformation workflow
		const words = ["laufen", "Möglichkeit", "Regierungsgebäude"];
		const expected = ["lauf", "moeglich", "regierungsgebaeud"];

		const results = words.map((word) => stemCistem(word));

		for (let i = 0; i < words.length; i++) {
			strictEqual(
				results[i],
				expected[i],
				`Failed German transformation: ${words[i]} -> ${expected[i]}`,
			);
		}
	});

	it("handles mixed case and edge cases", () => {
		// English cases
		strictEqual(stemPorter2("WALKING"), "walk");
		strictEqual(stemPorter2(""), "");
		strictEqual(stemPorter2("I"), "I");
		strictEqual(stemPorter2("be"), "be");

		// German cases
		strictEqual(stemCistem("LAUFEN"), "lauf");
		strictEqual(stemCistem(""), "");
		strictEqual(stemCistem("ich"), "ich");
		strictEqual(stemCistem("ä"), "ä"); // Too short to process
	});
});
