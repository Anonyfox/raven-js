/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { deepStrictEqual } from "node:assert";
import { test } from "node:test";
import {
	parseJSDocToStructured,
	parseParamTag,
	parseReturnTag,
} from "./jsdoc-processing.js";

test("parseJSDocToStructured - comprehensive branch coverage", () => {
	// Test normal JSDoc with multiple tag types
	const complexJSDoc = {
		description: "A complex function that does many things",
		tags: {
			param: ["{string} name - The user name", "{number} age - User age"],
			returns: ["{boolean} True if successful"],
			since: ["1.0.0"],
			author: ["John Doe"],
			see: ["https://example.com", "relatedFunction"],
		},
	};

	deepStrictEqual(parseJSDocToStructured(complexJSDoc), {
		description: "A complex function that does many things",
		tags: {
			param: [
				{ type: "string", name: "name", description: "The user name" },
				{ type: "number", name: "age", description: "User age" },
			],
			returns: { type: "boolean", description: "True if successful" },
			since: ["1.0.0"],
			author: ["John Doe"],
			see: ["https://example.com", "relatedFunction"],
		},
	});

	// Test JSDoc with only description (no tags)
	const simpleJSDoc = {
		description: "Simple function",
		tags: {},
	};

	deepStrictEqual(parseJSDocToStructured(simpleJSDoc), {
		description: "Simple function",
		tags: {},
	});

	// Test JSDoc with return tag (alternative to returns)
	const returnTagJSDoc = {
		description: "Function with return tag",
		tags: {
			return: ["{string} The result"],
		},
	};

	deepStrictEqual(parseJSDocToStructured(returnTagJSDoc), {
		description: "Function with return tag",
		tags: {
			returns: { type: "string", description: "The result" },
		},
	});

	// Test JSDoc with empty description
	const emptyDescJSDoc = {
		description: "",
		tags: {
			param: ["{any} value - Some value"],
		},
	};

	deepStrictEqual(parseJSDocToStructured(emptyDescJSDoc), {
		description: "",
		tags: {
			param: [{ type: "any", name: "value", description: "Some value" }],
		},
	});

	// Test JSDoc with only non-param/return tags
	const otherTagsJSDoc = {
		description: "Function with other tags",
		tags: {
			since: ["2.0.0"],
			deprecated: ["Use newFunction instead"],
			throws: ["{Error} When validation fails"],
		},
	};

	deepStrictEqual(parseJSDocToStructured(otherTagsJSDoc), {
		description: "Function with other tags",
		tags: {
			since: ["2.0.0"],
			deprecated: ["Use newFunction instead"],
			throws: ["{Error} When validation fails"],
		},
	});
});

test("parseParamTag - comprehensive branch coverage", () => {
	// Test well-formed param with dash
	deepStrictEqual(parseParamTag("{string} name - The user name"), {
		type: "string",
		name: "name",
		description: "The user name",
	});

	// Test well-formed param without dash
	deepStrictEqual(parseParamTag("{number} age User age in years"), {
		type: "number",
		name: "age",
		description: "User age in years",
	});

	// Test param with complex type
	deepStrictEqual(
		parseParamTag("{Object<string, number>} map - Key-value mapping"),
		{
			type: "Object<string, number>",
			name: "map",
			description: "Key-value mapping",
		},
	);

	// Test param with extra spaces (leading spaces cause regex to fail)
	deepStrictEqual(
		parseParamTag("  {boolean}   active   -   Is user active  "),
		{
			type: "any",
			name: "unknown",
			description: "  {boolean}   active   -   Is user active  ",
		},
	);

	// Test param with internal spaces (should work)
	deepStrictEqual(parseParamTag("{boolean}   active   -   Is user active"), {
		type: "boolean",
		name: "active",
		description: "Is user active",
	});

	// Test param without description
	deepStrictEqual(parseParamTag("{string} value"), {
		type: "string",
		name: "value",
		description: "",
	});

	// Test param with only dash (no description after)
	deepStrictEqual(parseParamTag("{number} count -"), {
		type: "number",
		name: "count",
		description: "",
	});

	// Test malformed param (no braces)
	deepStrictEqual(parseParamTag("string name - Invalid format"), {
		type: "any",
		name: "unknown",
		description: "string name - Invalid format",
	});

	// Test malformed param (no name)
	deepStrictEqual(parseParamTag("{string} - No name provided"), {
		type: "any",
		name: "unknown",
		description: "{string} - No name provided",
	});

	// Test empty param
	deepStrictEqual(parseParamTag(""), {
		type: "any",
		name: "unknown",
		description: "",
	});

	// Test param with underscore and special characters in name
	deepStrictEqual(parseParamTag("{Array} _privateVar - Internal variable"), {
		type: "Array",
		name: "_privateVar",
		description: "Internal variable",
	});
});

test("parseReturnTag - comprehensive branch coverage", () => {
	// Test well-formed return tag
	deepStrictEqual(parseReturnTag("{string} The processed result"), {
		type: "string",
		description: "The processed result",
	});

	// Test return tag with complex type
	deepStrictEqual(
		parseReturnTag("{Promise<Array<Object>>} Array of user objects"),
		{ type: "Promise<Array<Object>>", description: "Array of user objects" },
	);

	// Test return tag with extra spaces (leading spaces cause regex to fail)
	deepStrictEqual(parseReturnTag("  {boolean}   Success status  "), {
		type: "any",
		description: "  {boolean}   Success status  ",
	});

	// Test return tag with internal spaces (should work)
	deepStrictEqual(parseReturnTag("{boolean}   Success status"), {
		type: "boolean",
		description: "Success status",
	});

	// Test return tag without description
	deepStrictEqual(parseReturnTag("{void}"), { type: "void", description: "" });

	// Test return tag with only type (no description space)
	deepStrictEqual(parseReturnTag("{number}"), {
		type: "number",
		description: "",
	});

	// Test malformed return (no braces)
	deepStrictEqual(parseReturnTag("string Invalid format"), {
		type: "any",
		description: "string Invalid format",
	});

	// Test malformed return (incomplete braces)
	deepStrictEqual(parseReturnTag("{string Missing closing brace"), {
		type: "any",
		description: "{string Missing closing brace",
	});

	// Test empty return
	deepStrictEqual(parseReturnTag(""), { type: "any", description: "" });

	// Test return with nested braces in description
	deepStrictEqual(parseReturnTag("{Object} Contains {key: value} pairs"), {
		type: "Object",
		description: "Contains {key: value} pairs",
	});
});
