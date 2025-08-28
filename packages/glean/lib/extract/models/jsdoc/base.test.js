/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Test suite for JSDocTagBase - 100% coverage validation.
 */

import { strictEqual, throws } from "node:assert";
import { describe, test } from "node:test";
import { JSDocTagBase } from "./base.js";

// Test child class for valid inheritance scenarios
class TestChildTag extends JSDocTagBase {
	constructor(rawContent) {
		super("test", rawContent);
	}

	parseContent() {
		// Valid implementation - sets some test state
		this.parsed = true;
	}

	validate() {
		// Valid implementation - sets validation state
		this.isValidated = this.rawContent?.trim().length > 0;
	}
}

// Test child class that throws in parseContent
class TestParseErrorTag extends JSDocTagBase {
	constructor(rawContent) {
		super("test", rawContent);
	}

	parseContent() {
		throw new Error("Parse error for testing");
	}

	validate() {
		this.isValidated = true;
	}
}

// Test child class that throws in validate
class TestValidateErrorTag extends JSDocTagBase {
	constructor(rawContent) {
		super("test", rawContent);
	}

	parseContent() {
		// Do nothing
	}

	validate() {
		throw new Error("Validate error for testing");
	}
}

describe("JSDocTagBase abstract class", () => {
	test("should throw when instantiated directly", () => {
		throws(() => new JSDocTagBase("test", "content"), {
			name: "Error",
			message: "JSDocTagBase is abstract and cannot be instantiated directly",
		});
	});

	test("should allow child class instantiation with valid parameters", () => {
		const tag = new TestChildTag("test content");

		strictEqual(tag.tagType, "test");
		strictEqual(tag.rawContent, "test content");
		strictEqual(tag.isValidated, true);
		strictEqual(tag.parsed, true);
	});

	test("should handle empty rawContent parameter", () => {
		const tag = new TestChildTag("");

		strictEqual(tag.tagType, "test");
		strictEqual(tag.rawContent, "");
		strictEqual(tag.isValidated, false); // Empty content is invalid per test implementation
	});

	test("should handle undefined rawContent parameter", () => {
		const tag = new TestChildTag(undefined);

		strictEqual(tag.tagType, "test");
		strictEqual(tag.rawContent, ""); // Constructor sets fallback to empty string
		strictEqual(tag.isValidated, false);
	});

	test("should handle null rawContent parameter", () => {
		const tag = new TestChildTag(null);

		strictEqual(tag.tagType, "test");
		strictEqual(tag.rawContent, ""); // Constructor sets fallback to empty string
		strictEqual(tag.isValidated, false);
	});

	test("should handle whitespace-only rawContent", () => {
		const tag = new TestChildTag("   \t\n  ");

		strictEqual(tag.tagType, "test");
		strictEqual(tag.rawContent, "   \t\n  ");
		strictEqual(tag.isValidated, false); // Whitespace-only should be invalid per test implementation
	});

	test("should throw when parseContent is not implemented in child", () => {
		// Create anonymous child class without parseContent implementation
		class IncompleteTag extends JSDocTagBase {
			constructor() {
				super("incomplete", "test");
			}

			validate() {
				this.isValidated = true;
			}
		}

		throws(() => new IncompleteTag(), {
			name: "Error",
			message: "parseContent() must be implemented by child classes",
		});
	});

	test("should throw when validate is not implemented in child", () => {
		// Create anonymous child class without validate implementation
		class IncompleteTag extends JSDocTagBase {
			constructor() {
				super("incomplete", "test");
			}

			parseContent() {
				// Do nothing
			}
		}

		throws(() => new IncompleteTag(), {
			name: "Error",
			message: "validate() must be implemented by child classes",
		});
	});

	test("should propagate errors from parseContent in constructor", () => {
		throws(() => new TestParseErrorTag("content"), {
			name: "Error",
			message: "Parse error for testing",
		});
	});

	test("should propagate errors from validate in constructor", () => {
		throws(() => new TestValidateErrorTag("content"), {
			name: "Error",
			message: "Validate error for testing",
		});
	});
});

describe("JSDocTagBase public methods", () => {
	test("isValid() should return isValidated state", () => {
		const validTag = new TestChildTag("valid content");
		const invalidTag = new TestChildTag("");

		strictEqual(validTag.isValid(), true);
		strictEqual(invalidTag.isValid(), false);
	});

	test("getType() should return tagType", () => {
		const tag = new TestChildTag("content");

		strictEqual(tag.getType(), "test");
	});

	test("getRawContent() should return rawContent", () => {
		const tag1 = new TestChildTag("some content");
		const tag2 = new TestChildTag("");

		strictEqual(tag1.getRawContent(), "some content");
		strictEqual(tag2.getRawContent(), "");
	});
});

describe("JSDocTagBase abstract methods called directly", () => {
	test("parseContent() should throw when called on base class", () => {
		const base = Object.create(JSDocTagBase.prototype);

		throws(() => base.parseContent(), {
			name: "Error",
			message: "parseContent() must be implemented by child classes",
		});
	});

	test("validate() should throw when called on base class", () => {
		const base = Object.create(JSDocTagBase.prototype);

		throws(() => base.validate(), {
			name: "Error",
			message: "validate() must be implemented by child classes",
		});
	});
});
