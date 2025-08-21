/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file README content entity model tests - comprehensive validation coverage.
 */

import { strictEqual } from "node:assert";
import { test } from "node:test";
import { ReadmeContentEntity } from "./readme-content-entity.js";

test("ReadmeContentEntity - metadata edge cases", () => {
	const content = new ReadmeContentEntity("test", "/path", "/dir");

	// Test with empty metadata object
	content.setMetadata({});
	strictEqual(content.lastModified, null);
	strictEqual(content.language, "markdown");

	// Test with undefined values
	content.setMetadata({ lastModified: undefined, language: undefined });
	strictEqual(content.lastModified, null);
	strictEqual(content.language, "markdown");
});
