/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { strictEqual } from "node:assert";
import { describe, test } from "node:test";
import { JSDocThrowsTag } from "./throws-tag.js";

describe("JSDocThrowsTag core functionality", () => {
	test("should inherit from JSDocTagBase", () => {
		const tag = new JSDocThrowsTag("{Error} When validation fails");

		strictEqual(tag.tagType, "throws");
		strictEqual(tag.rawContent, "{Error} When validation fails");
		strictEqual(tag.isValid(), true);
	});

	test("should parse type and description", () => {
		const tag = new JSDocThrowsTag("{TypeError} Invalid input parameter");

		strictEqual(tag.type, "TypeError");
		strictEqual(tag.description, "Invalid input parameter");
		strictEqual(tag.isValidated, true);
	});

	test("should parse type only", () => {
		const tag = new JSDocThrowsTag("{RangeError}");

		strictEqual(tag.type, "RangeError");
		strictEqual(tag.description, "");
		strictEqual(tag.isValidated, true);
	});

	test("should parse description only", () => {
		const tag = new JSDocThrowsTag("When network request fails");

		strictEqual(tag.type, "");
		strictEqual(tag.description, "When network request fails");
		strictEqual(tag.isValidated, true);
	});

	test("should handle empty content", () => {
		const tag = new JSDocThrowsTag("");

		strictEqual(tag.type, "");
		strictEqual(tag.description, "");
		strictEqual(tag.isValidated, false);
	});
});

describe("JSDocThrowsTag exception types", () => {
	test("should handle standard JavaScript errors", () => {
		const errorTypes = [
			"Error",
			"TypeError",
			"ReferenceError",
			"RangeError",
			"SyntaxError",
			"URIError",
		];

		errorTypes.forEach((errorType) => {
			const tag = new JSDocThrowsTag(`{${errorType}} Standard error`);
			strictEqual(tag.type, errorType);
			strictEqual(tag.description, "Standard error");
			strictEqual(tag.isValidated, true);
		});
	});

	test("should handle custom error types", () => {
		const customErrors = [
			"ValidationError",
			"NetworkError",
			"AuthenticationError",
			"BusinessLogicError",
		];

		customErrors.forEach((errorType) => {
			const tag = new JSDocThrowsTag(`{${errorType}} Custom error scenario`);
			strictEqual(tag.type, errorType);
			strictEqual(tag.description, "Custom error scenario");
			strictEqual(tag.isValidated, true);
		});
	});

	test("should handle complex error types", () => {
		const tag = new JSDocThrowsTag(
			"{Promise.reject<NetworkError>} Async operation failure",
		);

		strictEqual(tag.type, "Promise.reject<NetworkError>");
		strictEqual(tag.description, "Async operation failure");
		strictEqual(tag.isValidated, true);
	});
});

describe("JSDocThrowsTag parsing edge cases", () => {
	test("should handle undefined/null content", () => {
		const undefinedTag = new JSDocThrowsTag(undefined);
		const nullTag = new JSDocThrowsTag(null);

		strictEqual(undefinedTag.type, "");
		strictEqual(undefinedTag.description, "");
		strictEqual(undefinedTag.isValidated, false);

		strictEqual(nullTag.type, "");
		strictEqual(nullTag.description, "");
		strictEqual(nullTag.isValidated, false);
	});

	test("should trim whitespace properly", () => {
		const tag = new JSDocThrowsTag("  { Error }   Invalid operation  ");

		strictEqual(tag.type, "Error");
		strictEqual(tag.description, "Invalid operation");
		strictEqual(tag.isValidated, true);
	});

	test("should handle empty braces", () => {
		const tag = new JSDocThrowsTag("{} Description only");

		strictEqual(tag.type, "");
		strictEqual(tag.description, "Description only");
		strictEqual(tag.isValidated, true);
	});

	test("should handle malformed braces", () => {
		const tag1 = new JSDocThrowsTag("{Error When missing closing brace");
		const tag2 = new JSDocThrowsTag("Error} When missing opening brace");

		strictEqual(tag1.type, "");
		strictEqual(tag1.description, "{Error When missing closing brace");
		strictEqual(tag1.isValidated, true);

		strictEqual(tag2.type, "");
		strictEqual(tag2.description, "Error} When missing opening brace");
		strictEqual(tag2.isValidated, true);
	});

	test("should handle nested braces limitation", () => {
		const tag = new JSDocThrowsTag("{Error<{code: number}>} Complex type");

		// Regex stops at first }, breaking nested types
		strictEqual(tag.type, "Error<{code: number");
		strictEqual(tag.description, ">} Complex type");
		strictEqual(tag.isValidated, true);
	});

	test("should handle multiline limitation", () => {
		const tag = new JSDocThrowsTag("When operation\nfails across lines");

		// Regex doesn't match multiline due to $ anchor
		strictEqual(tag.type, "");
		strictEqual(tag.description, "");
		strictEqual(tag.isValidated, false);
	});
});

describe("JSDocThrowsTag descriptions", () => {
	test("should handle detailed exception descriptions", () => {
		const descriptions = [
			"When input validation fails",
			"If network connection is unavailable",
			"On database transaction rollback",
			"When user lacks required permissions",
		];

		descriptions.forEach((desc) => {
			const tag = new JSDocThrowsTag(desc);
			strictEqual(tag.type, "");
			strictEqual(tag.description, desc);
			strictEqual(tag.isValidated, true);
		});
	});

	test("should handle descriptions with special characters", () => {
		const tag = new JSDocThrowsTag("When user@domain.com fails auth!");

		strictEqual(tag.type, "");
		strictEqual(tag.description, "When user@domain.com fails auth!");
		strictEqual(tag.isValidated, true);
	});

	test("should handle Unicode in descriptions", () => {
		const tag = new JSDocThrowsTag("Cuando falla la validación 验证失败时");

		strictEqual(tag.type, "");
		strictEqual(tag.description, "Cuando falla la validación 验证失败时");
		strictEqual(tag.isValidated, true);
	});
});

describe("JSDocThrowsTag validation", () => {
	test("should validate when type exists", () => {
		const tag = new JSDocThrowsTag("{Error}");

		strictEqual(tag.isValidated, true);
		strictEqual(tag.isValid(), true);
	});

	test("should validate when description exists", () => {
		const tag = new JSDocThrowsTag("Operation failed");

		strictEqual(tag.isValidated, true);
		strictEqual(tag.isValid(), true);
	});

	test("should validate when both exist", () => {
		const tag = new JSDocThrowsTag("{Error} Operation failed");

		strictEqual(tag.isValidated, true);
		strictEqual(tag.isValid(), true);
	});

	test("should not validate empty content", () => {
		const emptyTags = ["", "   ", "{}", "{   }", undefined, null];

		emptyTags.forEach((content) => {
			const tag = new JSDocThrowsTag(content);
			strictEqual(tag.isValidated, false);
			strictEqual(tag.isValid(), false);
		});
	});
});

describe("JSDocThrowsTag boundary conditions", () => {
	test("should handle very long error types", () => {
		const longType = `${"Very".repeat(50)}LongErrorTypeName`;
		const tag = new JSDocThrowsTag(`{${longType}} Error description`);

		strictEqual(tag.type, longType);
		strictEqual(tag.description, "Error description");
		strictEqual(tag.isValidated, true);
	});

	test("should handle single character types", () => {
		const tag = new JSDocThrowsTag("{E} Single char error");

		strictEqual(tag.type, "E");
		strictEqual(tag.description, "Single char error");
		strictEqual(tag.isValidated, true);
	});

	test("should handle numeric error codes", () => {
		const tag = new JSDocThrowsTag("{404} Not found error");

		strictEqual(tag.type, "404");
		strictEqual(tag.description, "Not found error");
		strictEqual(tag.isValidated, true);
	});

	test("should handle error types with special characters", () => {
		const tag = new JSDocThrowsTag("{HTTP_404_Error} Network error");

		strictEqual(tag.type, "HTTP_404_Error");
		strictEqual(tag.description, "Network error");
		strictEqual(tag.isValidated, true);
	});
});
