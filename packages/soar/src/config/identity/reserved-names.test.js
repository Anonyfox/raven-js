/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Test suite for reserved names constant.
 */

import { describe, it } from "node:test";
import assert from "node:assert";
import { RESERVED_NAMES } from "./reserved-names.js";

describe("RESERVED_NAMES", () => {
	it("should be a frozen array", () => {
		assert.strictEqual(Array.isArray(RESERVED_NAMES), true);
		assert.strictEqual(Object.isFrozen(RESERVED_NAMES), true);
	});

	it("should contain expected infrastructure names", () => {
		const expectedNames = [
			"api",
			"www",
			"admin",
			"root",
			"mail",
			"ftp",
			"localhost",
			"production",
			"staging",
		];

		for (const name of expectedNames) {
			assert.strictEqual(
				RESERVED_NAMES.includes(name),
				true,
				`Expected '${name}' to be in reserved names`,
			);
		}
	});

	it("should only contain lowercase strings", () => {
		for (const name of RESERVED_NAMES) {
			assert.strictEqual(typeof name, "string", `Expected string, got ${typeof name}`);
			assert.strictEqual(name, name.toLowerCase(), `Expected '${name}' to be lowercase`);
		}
	});

	it("should not contain duplicates", () => {
		const uniqueNames = [...new Set(RESERVED_NAMES)];
		assert.strictEqual(
			RESERVED_NAMES.length,
			uniqueNames.length,
			"Reserved names should not contain duplicates",
		);
	});

	it("should contain DNS and protocol-related names", () => {
		const dnsNames = ["dns", "mx", "ns", "cname", "txt", "srv"];
		const protocolNames = ["http", "https", "ftp", "ssh"];

		for (const name of [...dnsNames, ...protocolNames]) {
			assert.strictEqual(
				RESERVED_NAMES.includes(name),
				true,
				`Expected DNS/protocol name '${name}' to be reserved`,
			);
		}
	});
});
