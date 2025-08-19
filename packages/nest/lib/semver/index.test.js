import assert from "node:assert";
import { describe, it } from "node:test";
import * as semver from "./index.js";

describe("lib/semver/index.js", () => {
	it("should export all expected functions", () => {
		assert.strictEqual(typeof semver.bumpVersion, "function");
		assert.strictEqual(typeof semver.updatePackageVersions, "function");
	});

	it("should have working bumpVersion function", () => {
		// Test with valid semver strings
		const result1 = semver.bumpVersion("1.0.0", "patch");
		assert.strictEqual(result1, "1.0.1");

		const result2 = semver.bumpVersion("1.0.0", "minor");
		assert.strictEqual(result2, "1.1.0");

		const result3 = semver.bumpVersion("1.0.0", "major");
		assert.strictEqual(result3, "2.0.0");
	});
});
