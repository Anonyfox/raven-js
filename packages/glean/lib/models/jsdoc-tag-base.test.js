/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { deepStrictEqual, strictEqual, throws } from "node:assert";
import { test } from "node:test";
import { JSDocTagBase } from "./jsdoc-tag-base.js";

// Test implementation for concrete testing
class TestTag extends JSDocTagBase {
	constructor(rawContent, shouldValidate = true) {
		super("test", rawContent);
		this._shouldValidate = shouldValidate;
		// Re-run validation with the correct _shouldValidate flag
		this.validate();
	}

	parseContent() {
		// Simple parsing: split by first space
		const spaceIndex = this.rawContent.indexOf(" ");
		if (spaceIndex === -1) {
			this.name = this.rawContent;
			this.description = "";
		} else {
			this.name = this.rawContent.substring(0, spaceIndex);
			this.description = this.rawContent.substring(spaceIndex + 1);
		}
	}

	validate() {
		// Default to true if _shouldValidate is undefined (during construction)
		const shouldValidate = this._shouldValidate !== false;
		this.isValidated = shouldValidate && this.name && this.name.length > 0;
	}

	getSerializableData() {
		return {
			tagType: this.tagType,
			rawContent: this.rawContent,
			name: this.name,
			description: this.description,
		};
	}

	toHTML() {
		return `<code>@${this.tagType}</code> <strong>${this.name}</strong> - ${this.description}`;
	}

	toMarkdown() {
		return `**@${this.tagType}** \`${this.name}\` - ${this.description}`;
	}
}

test("JSDocTagBase - abstract class instantiation throws error", () => {
	throws(
		() => new JSDocTagBase("test", "content"),
		/JSDocTagBase is abstract and cannot be instantiated directly/,
		"Should throw error when instantiating abstract base class directly",
	);
});

test("JSDocTagBase - abstract methods throw errors", () => {
	// Test abstract methods directly on the base class prototype
	const baseInstance = Object.create(JSDocTagBase.prototype);
	baseInstance.tagType = "test";
	baseInstance.rawContent = "test";

	throws(
		() => baseInstance.parseContent(),
		/parseContent\(\) must be implemented by child classes/,
		"Should throw error when parseContent() not implemented",
	);

	throws(
		() => baseInstance.validate(),
		/validate\(\) must be implemented by child classes/,
		"Should throw error when validate() not implemented",
	);
});

test("JSDocTagBase - concrete methods work correctly", () => {
	const tag = new TestTag("testName some description");

	// Test basic property access
	strictEqual(tag.tagType, "test", "Should return correct tag type");
	strictEqual(
		tag.rawContent,
		"testName some description",
		"Should return raw content",
	);

	// Test validation
	strictEqual(tag.isValid(), true, "Should be valid with proper content");

	// Test serialization
	const json = tag.toJSON();
	deepStrictEqual(
		json,
		{
			__type: "test",
			__data: {
				tagType: "test",
				rawContent: "testName some description",
				name: "testName",
				description: "some description",
			},
		},
		"Should serialize correctly",
	);

	// Test HTML output
	strictEqual(
		tag.toHTML(),
		"<code>@test</code> <strong>testName</strong> - some description",
		"Should generate correct HTML",
	);

	// Test Markdown output
	strictEqual(
		tag.toMarkdown(),
		"**@test** `testName` - some description",
		"Should generate correct Markdown",
	);
});

test("JSDocTagBase - validation edge cases", () => {
	// Test invalid tag (empty name)
	const invalidTag = new TestTag("", false);
	strictEqual(invalidTag.isValid(), false, "Should be invalid with empty name");

	// Test valid tag with validation flag false
	const invalidByFlag = new TestTag("validName description", false);
	strictEqual(
		invalidByFlag.isValid(),
		false,
		"Should be invalid when validation flag is false",
	);
});

test("JSDocTagBase - default getSerializableData filters internal properties", () => {
	// Create a tag that uses the base class getSerializableData method
	class PlainTag extends JSDocTagBase {
		parseContent() {
			// Minimal implementation
		}

		validate() {
			this.isValidated = true;
		}
	}

	const tag = new PlainTag("default", "test content");
	tag._internal = "should be filtered";
	tag.isValidated = true; // This should be filtered
	tag.public = "should be included";

	const data = tag.getSerializableData();

	// Should not include internal properties or isValidated
	strictEqual(
		data._internal,
		undefined,
		"Should filter properties starting with underscore",
	);
	strictEqual(
		data.isValidated,
		undefined,
		"Should filter isValidated property",
	);
	strictEqual(
		data.public,
		"should be included",
		"Should include public properties",
	);
});

test("JSDocTagBase - default HTML/Markdown fallbacks", () => {
	// Create a tag that uses default implementations
	class DefaultTag extends JSDocTagBase {
		parseContent() {
			// Minimal implementation
		}

		validate() {
			this.isValidated = true;
		}
	}

	const tag = new DefaultTag("default", "test content");

	// Test default HTML implementation
	strictEqual(
		tag.toHTML(),
		'<span class="jsdoc-tag" data-type="default">test content</span>',
		"Should use default HTML implementation",
	);

	// Test default Markdown implementation
	strictEqual(
		tag.toMarkdown(),
		"`@default test content`",
		"Should use default Markdown implementation",
	);
});

test("JSDocTagBase - fromJSON throws error (registry not implemented)", () => {
	throws(
		() => JSDocTagBase.fromJSON({ __type: "test", __data: {} }),
		/fromJSON requires tag registry/,
		"Should throw error when registry not available",
	);

	// Test invalid JSON format
	throws(
		() => JSDocTagBase.fromJSON({}),
		/Invalid JSON format: missing __type or __data/,
		"Should throw error for invalid JSON format",
	);

	throws(
		() => JSDocTagBase.fromJSON({ __type: "test" }),
		/Invalid JSON format: missing __type or __data/,
		"Should throw error when __data missing",
	);

	throws(
		() => JSDocTagBase.fromJSON({ __data: {} }),
		/Invalid JSON format: missing __type or __data/,
		"Should throw error when __type missing",
	);
});
