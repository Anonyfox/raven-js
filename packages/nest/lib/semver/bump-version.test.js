/**
 * @fileoverview Tests for bump-version utility
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 */

import assert from "node:assert";
import { describe, test } from "node:test";
import { bumpVersion } from "./bump-version.js";

describe("bumpVersion", () => {
	describe("major version bumps", () => {
		test("should increment major version and reset minor and patch", () => {
			assert.strictEqual(bumpVersion("1.2.3", "major"), "2.0.0");
			assert.strictEqual(bumpVersion("0.1.0", "major"), "1.0.0");
			assert.strictEqual(bumpVersion("10.5.2", "major"), "11.0.0");
		});
	});

	describe("minor version bumps", () => {
		test("should increment minor version and reset patch", () => {
			assert.strictEqual(bumpVersion("1.2.3", "minor"), "1.3.0");
			assert.strictEqual(bumpVersion("0.1.0", "minor"), "0.2.0");
			assert.strictEqual(bumpVersion("10.5.2", "minor"), "10.6.0");
		});
	});

	describe("patch version bumps", () => {
		test("should increment patch version only", () => {
			assert.strictEqual(bumpVersion("1.2.3", "patch"), "1.2.4");
			assert.strictEqual(bumpVersion("0.1.0", "patch"), "0.1.1");
			assert.strictEqual(bumpVersion("10.5.2", "patch"), "10.5.3");
		});
	});

	describe("edge cases", () => {
		test("should handle zero versions", () => {
			assert.strictEqual(bumpVersion("0.0.0", "major"), "1.0.0");
			assert.strictEqual(bumpVersion("0.0.0", "minor"), "0.1.0");
			assert.strictEqual(bumpVersion("0.0.0", "patch"), "0.0.1");
		});

		test("should handle large version numbers", () => {
			assert.strictEqual(bumpVersion("999.999.999", "major"), "1000.0.0");
			assert.strictEqual(bumpVersion("999.999.999", "minor"), "999.1000.0");
			assert.strictEqual(bumpVersion("999.999.999", "patch"), "999.999.1000");
		});
	});

	describe("error handling", () => {
		test("should throw error for invalid version format", () => {
			assert.throws(
				() => bumpVersion("1.2", "major"),
				/Invalid version format/,
			);
			assert.throws(
				() => bumpVersion("1.2.3.4", "major"),
				/Invalid version format/,
			);
			assert.throws(
				() => bumpVersion("1.2.3-beta", "major"),
				/Invalid version format/,
			);
			assert.throws(
				() => bumpVersion("invalid", "major"),
				/Invalid version format/,
			);
			assert.throws(() => bumpVersion("", "major"), /Invalid version format/);
		});

		test("should throw error for invalid bump type", () => {
			assert.throws(() => bumpVersion("1.2.3", "invalid"), /Invalid bump type/);
			assert.throws(() => bumpVersion("1.2.3", ""), /Invalid bump type/);
			assert.throws(() => bumpVersion("1.2.3", "MAJOR"), /Invalid bump type/);
			assert.throws(
				() => bumpVersion("1.2.3", "major-minor"),
				/Invalid bump type/,
			);
		});

		test("should throw error for non-string inputs", () => {
			assert.throws(() => bumpVersion(null, "major"), /Invalid version format/);
			assert.throws(
				() => bumpVersion(undefined, "major"),
				/Invalid version format/,
			);
			assert.throws(() => bumpVersion(123, "major"), /Invalid version format/);
		});
	});
});
