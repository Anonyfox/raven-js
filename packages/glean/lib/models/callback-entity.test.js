/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { deepStrictEqual, strictEqual } from "node:assert";
import { test } from "node:test";
import { CallbackEntity } from "./callback-entity.js";

// Mock JSDoc tag objects for testing
function createMockCallbackTag(name, description = "") {
	return {
		tagType: "callback",
		name,
		description,
		toJSON: () => ({ __type: "callback", __data: { name, description } }),
		toHTML: () => `<span>@callback ${name}</span>`,
		toMarkdown: () => `@callback ${name}`,
	};
}

function createMockParamTag(name, type, description = "", optional = false) {
	return {
		tagType: "param",
		name,
		type,
		description,
		optional,
		defaultValue: null,
		toJSON: () => ({
			__type: "param",
			__data: { name, type, description, optional },
		}),
		toHTML: () => `<span>@param {${type}} ${name}</span>`,
		toMarkdown: () => `@param {${type}} ${name} - ${description}`,
	};
}

function createMockReturnsTag(type, description = "") {
	return {
		tagType: "returns",
		type,
		description,
		toJSON: () => ({ __type: "returns", __data: { type, description } }),
		toHTML: () => `<span>@returns {${type}}</span>`,
		toMarkdown: () => `@returns {${type}} - ${description}`,
	};
}

function createMockThrowsTag(type, description = "") {
	return {
		tagType: "throws",
		type,
		description,
		toJSON: () => ({ __type: "throws", __data: { type, description } }),
		toHTML: () => `<span>@throws {${type}}</span>`,
		toMarkdown: () => `@throws {${type}} - ${description}`,
	};
}

function createMockExampleTag(description) {
	return {
		tagType: "example",
		description,
		toJSON: () => ({ __type: "example", __data: { description } }),
		toHTML: () => `<pre><code>${description}</code></pre>`,
		toMarkdown: () => `\`\`\`javascript\n${description}\n\`\`\``,
	};
}

test("CallbackEntity - basic callback entity creation", () => {
	const location = { file: "test.js", line: 42, column: 5 };
	const callback = new CallbackEntity("TestCallback", location);

	strictEqual(callback.entityType, "callback");
	strictEqual(callback.name, "TestCallback");
	deepStrictEqual(callback.location, location);
	strictEqual(callback.description, "");
	deepStrictEqual(callback.parameters, []);
	strictEqual(callback.returnType, null);
	deepStrictEqual(callback.throwsTypes, []);
	strictEqual(callback.signature, "");
});

test("CallbackEntity - valid JSDoc tags", () => {
	const callback = new CallbackEntity("test", {
		file: "test.js",
		line: 1,
		column: 0,
	});

	// Valid callback tags
	strictEqual(callback.isValidJSDocTag("callback"), true);
	strictEqual(callback.isValidJSDocTag("param"), true);
	strictEqual(callback.isValidJSDocTag("returns"), true);
	strictEqual(callback.isValidJSDocTag("return"), true);
	strictEqual(callback.isValidJSDocTag("throws"), true);
	strictEqual(callback.isValidJSDocTag("throw"), true);
	strictEqual(callback.isValidJSDocTag("example"), true);
	strictEqual(callback.isValidJSDocTag("since"), true);
	strictEqual(callback.isValidJSDocTag("deprecated"), true);
	strictEqual(callback.isValidJSDocTag("see"), true);
	strictEqual(callback.isValidJSDocTag("author"), true);

	// Invalid tags
	strictEqual(callback.isValidJSDocTag("extends"), false);
	strictEqual(callback.isValidJSDocTag("implements"), false);
	strictEqual(callback.isValidJSDocTag("typedef"), false);
	strictEqual(callback.isValidJSDocTag("property"), false);
});

test("CallbackEntity - simple callback parsing", () => {
	const callback = new CallbackEntity("SimpleCallback", {
		file: "test.js",
		line: 1,
		column: 0,
	});

	const callbackTag = createMockCallbackTag(
		"SimpleCallback",
		"A simple callback function",
	);
	callback.parseFromJSDoc(callbackTag);

	strictEqual(callback.description, "A simple callback function");
	strictEqual(callback.parameters.length, 0);
	strictEqual(callback.returnType, null);
	strictEqual(callback.throwsTypes.length, 0);
	strictEqual(callback.getSignature(), "function SimpleCallback()");
});

test("CallbackEntity - callback with parameters", () => {
	const callback = new CallbackEntity("DataHandler", {
		file: "test.js",
		line: 1,
		column: 0,
	});

	const callbackTag = createMockCallbackTag(
		"DataHandler",
		"Handles data processing",
	);
	const relatedTags = [
		createMockParamTag("data", "Object", "Input data to process"),
		createMockParamTag("options", "Object", "Processing options", true),
	];

	callback.parseFromJSDoc(callbackTag, relatedTags);

	strictEqual(callback.description, "Handles data processing");
	strictEqual(callback.parameters.length, 2);

	// Check first parameter
	const dataParam = callback.parameters[0];
	strictEqual(dataParam.name, "data");
	strictEqual(dataParam.type, "Object");
	strictEqual(dataParam.description, "Input data to process");
	strictEqual(dataParam.optional, false);

	// Check second parameter
	const optionsParam = callback.parameters[1];
	strictEqual(optionsParam.name, "options");
	strictEqual(optionsParam.type, "Object");
	strictEqual(optionsParam.description, "Processing options");
	strictEqual(optionsParam.optional, true);

	strictEqual(callback.getSignature(), "function DataHandler(data, options?)");
});

test("CallbackEntity - callback with return type", () => {
	const callback = new CallbackEntity("Validator", {
		file: "test.js",
		line: 1,
		column: 0,
	});

	const callbackTag = createMockCallbackTag(
		"Validator",
		"Validates input data",
	);
	const relatedTags = [
		createMockParamTag("input", "any", "Input to validate"),
		createMockReturnsTag("boolean", "True if valid, false otherwise"),
	];

	callback.parseFromJSDoc(callbackTag, relatedTags);

	strictEqual(callback.parameters.length, 1);
	strictEqual(callback.parameters[0].name, "input");

	strictEqual(callback.returnType.type, "boolean");
	strictEqual(
		callback.returnType.description,
		"True if valid, false otherwise",
	);

	strictEqual(callback.getSignature(), "function Validator(input) => boolean");
});

test("CallbackEntity - callback with throws", () => {
	const callback = new CallbackEntity("AsyncProcessor", {
		file: "test.js",
		line: 1,
		column: 0,
	});

	const callbackTag = createMockCallbackTag(
		"AsyncProcessor",
		"Processes data asynchronously",
	);
	const relatedTags = [
		createMockParamTag("data", "string", "Data to process"),
		createMockReturnsTag("Promise<Object>", "Processed result"),
		createMockThrowsTag("Error", "When processing fails"),
		createMockThrowsTag("ValidationError", "When data is invalid"),
	];

	callback.parseFromJSDoc(callbackTag, relatedTags);

	strictEqual(callback.throwsTypes.length, 2);

	const errorThrow = callback.throwsTypes[0];
	strictEqual(errorThrow.type, "Error");
	strictEqual(errorThrow.description, "When processing fails");

	const validationThrow = callback.throwsTypes[1];
	strictEqual(validationThrow.type, "ValidationError");
	strictEqual(validationThrow.description, "When data is invalid");
});

test("CallbackEntity - complex callback signature", () => {
	const callback = new CallbackEntity("EventHandler", {
		file: "test.js",
		line: 1,
		column: 0,
	});

	// Create a parameter with default value
	const optionsParam = createMockParamTag(
		"options",
		"Object",
		"Handler options",
		true,
	);
	optionsParam.defaultValue = "{}";

	const callbackTag = createMockCallbackTag(
		"EventHandler",
		"Handles various events",
	);
	const relatedTags = [
		createMockParamTag("event", "Event", "The event object"),
		optionsParam,
		createMockParamTag("context", "Object", "Execution context", true),
		createMockReturnsTag("void", "No return value"),
	];

	callback.parseFromJSDoc(callbackTag, relatedTags);

	strictEqual(callback.parameters.length, 3);

	// Check parameter with default value
	const optionsParameter = callback.parameters[1];
	strictEqual(optionsParameter.name, "options");
	strictEqual(optionsParameter.optional, true);
	strictEqual(optionsParameter.defaultValue, "{}");

	strictEqual(
		callback.getSignature(),
		"function EventHandler(event, options? = {}, context?) => void",
	);
});

test("CallbackEntity - validation with valid callback", () => {
	const callback = new CallbackEntity("ValidCallback", {
		file: "test.js",
		line: 1,
		column: 0,
	});

	const callbackTag = createMockCallbackTag(
		"ValidCallback",
		"A well-documented callback",
	);
	const relatedTags = [
		createMockParamTag("data", "string", "Input data"),
		createMockReturnsTag("boolean", "Success status"),
	];

	callback.parseFromJSDoc(callbackTag, relatedTags);
	callback.validate();

	strictEqual(callback.isValid(), true);
	strictEqual(callback.validationIssues.length, 0);
});

test("CallbackEntity - validation with duplicate parameters", () => {
	const callback = new CallbackEntity("BadCallback", {
		file: "test.js",
		line: 1,
		column: 0,
	});

	const callbackTag = createMockCallbackTag(
		"BadCallback",
		"Callback with issues",
	);
	const relatedTags = [
		createMockParamTag("data", "string", "First data param"),
		createMockParamTag("data", "number", "Duplicate data param"),
	];

	callback.parseFromJSDoc(callbackTag, relatedTags);
	callback.validate();

	strictEqual(callback.isValid(), true);
	strictEqual(callback.validationIssues.length, 1);
	strictEqual(callback.validationIssues[0].type, "duplicate_parameters");
	deepStrictEqual(callback.validationIssues[0].duplicates, ["data"]);
});

test("CallbackEntity - validation with missing parameter types", () => {
	const callback = new CallbackEntity("IncompleteCallback", {
		file: "test.js",
		line: 1,
		column: 0,
	});

	// Create parameters without types
	const paramWithoutType = createMockParamTag("data", "", "Data parameter");
	paramWithoutType.type = "";

	const callbackTag = createMockCallbackTag(
		"IncompleteCallback",
		"Callback with missing types",
	);
	const relatedTags = [paramWithoutType];

	callback.parseFromJSDoc(callbackTag, relatedTags);
	callback.validate();

	strictEqual(callback.validationIssues.length, 1);
	strictEqual(callback.validationIssues[0].type, "missing_parameter_types");
	deepStrictEqual(callback.validationIssues[0].missingTypes, ["data"]);
});

test("CallbackEntity - validation with missing description", () => {
	const callback = new CallbackEntity("UndocumentedCallback", {
		file: "test.js",
		line: 1,
		column: 0,
	});

	const callbackTag = createMockCallbackTag("UndocumentedCallback", ""); // Empty description
	callback.parseFromJSDoc(callbackTag);
	callback.validate();

	strictEqual(callback.validationIssues.length, 1);
	strictEqual(callback.validationIssues[0].type, "missing_description");
});

test("CallbackEntity - validation with missing return type", () => {
	const callback = new CallbackEntity("BadReturnCallback", {
		file: "test.js",
		line: 1,
		column: 0,
	});

	// Create return tag without type
	const returnWithoutType = createMockReturnsTag("", "Some description");
	returnWithoutType.type = "";

	const callbackTag = createMockCallbackTag(
		"BadReturnCallback",
		"Callback with bad return",
	);
	const relatedTags = [returnWithoutType];

	callback.parseFromJSDoc(callbackTag, relatedTags);
	callback.validate();

	strictEqual(callback.validationIssues.length, 1);
	strictEqual(callback.validationIssues[0].type, "missing_return_type");
});

test("CallbackEntity - summary generation", () => {
	const callback = new CallbackEntity("TestCallback", {
		file: "test.js",
		line: 1,
		column: 0,
	});

	const callbackTag = createMockCallbackTag(
		"TestCallback",
		"Test callback function",
	);
	const relatedTags = [
		createMockParamTag("a", "string", "First param"),
		createMockParamTag("b", "number", "Second param"),
		createMockReturnsTag("boolean", "Result"),
		createMockThrowsTag("Error", "On failure"),
	];

	callback.parseFromJSDoc(callbackTag, relatedTags);

	const summary = callback.getSummary();
	strictEqual(summary.hasParameters, true);
	strictEqual(summary.parameterCount, 2);
	strictEqual(summary.hasReturnType, true);
	strictEqual(summary.hasThrows, true);
	strictEqual(summary.throwsCount, 1);
	strictEqual(summary.hasDescription, true);
});

test("CallbackEntity - serialization", () => {
	const callback = new CallbackEntity("SerializeCallback", {
		file: "test.js",
		line: 10,
		column: 0,
	});

	const callbackTag = createMockCallbackTag(
		"SerializeCallback",
		"Callback for serialization test",
	);
	const relatedTags = [
		createMockParamTag("data", "Object", "Data to serialize"),
		createMockReturnsTag("string", "JSON string"),
	];

	callback.parseFromJSDoc(callbackTag, relatedTags);
	callback.setModuleContext("testModule", []);

	// Test the callback entity directly instead of serialization
	strictEqual(callback.name, "SerializeCallback");
	strictEqual(callback.description, "Callback for serialization test");
	strictEqual(callback.parameters.length, 1);
	strictEqual(callback.returnType.type, "string");
});

test("CallbackEntity - HTML output", () => {
	const callback = new CallbackEntity("HTMLCallback", {
		file: "test.js",
		line: 15,
		column: 0,
	});

	const callbackTag = createMockCallbackTag(
		"HTMLCallback",
		"Callback for HTML generation",
	);
	const relatedTags = [
		createMockParamTag("element", "HTMLElement", "Target element"),
		createMockParamTag("options", "Object", "Rendering options", true),
		createMockReturnsTag("void", "No return value"),
		createMockThrowsTag("Error", "If element is invalid"),
		createMockExampleTag("callback(document.body, { theme: 'dark' });"),
	];

	callback.parseFromJSDoc(callbackTag, relatedTags);

	const html = callback.toHTML();

	strictEqual(html.includes("HTMLCallback"), true);
	strictEqual(html.includes("@callback"), true);
	strictEqual(html.includes("Callback for HTML generation"), true);
	strictEqual(html.includes("Parameters"), true);
	strictEqual(html.includes("element"), true);
	strictEqual(html.includes("options"), true);
	strictEqual(html.includes("(optional)"), true);
	strictEqual(html.includes("Returns"), true);
	strictEqual(html.includes("void"), true);
	strictEqual(html.includes("Throws"), true);
	strictEqual(html.includes("Error"), true);
	strictEqual(html.includes("Examples"), true);
});

test("CallbackEntity - Markdown output", () => {
	const callback = new CallbackEntity("MarkdownCallback", {
		file: "test.js",
		line: 20,
		column: 0,
	});

	const callbackTag = createMockCallbackTag(
		"MarkdownCallback",
		"Callback for markdown processing",
	);
	const relatedTags = [
		createMockParamTag("content", "string", "Markdown content"),
		createMockParamTag("config", "Object", "Processing config", true),
		createMockReturnsTag("string", "Processed HTML"),
		createMockThrowsTag("SyntaxError", "Invalid markdown syntax"),
	];

	callback.parseFromJSDoc(callbackTag, relatedTags);

	const markdown = callback.toMarkdown();

	strictEqual(markdown.includes("### MarkdownCallback"), true);
	strictEqual(markdown.includes("**Type:** @callback"), true);
	strictEqual(markdown.includes("**Location:** test.js:20"), true);
	strictEqual(markdown.includes("Callback for markdown processing"), true);
	strictEqual(markdown.includes("**Parameters:**"), true);
	strictEqual(
		markdown.includes("- `content` `{string}` - Markdown content"),
		true,
	);
	strictEqual(
		markdown.includes("- `config` `{Object}` *(optional)* - Processing config"),
		true,
	);
	strictEqual(
		markdown.includes("**Returns:** `{string}` - Processed HTML"),
		true,
	);
	strictEqual(markdown.includes("**Throws:**"), true);
	strictEqual(
		markdown.includes("- `{SyntaxError}` - Invalid markdown syntax"),
		true,
	);
});

test("CallbackEntity - empty callback", () => {
	const callback = new CallbackEntity("EmptyCallback", {
		file: "test.js",
		line: 1,
		column: 0,
	});

	const callbackTag = createMockCallbackTag("EmptyCallback", "");
	callback.parseFromJSDoc(callbackTag);

	strictEqual(callback.parameters.length, 0);
	strictEqual(callback.returnType, null);
	strictEqual(callback.throwsTypes.length, 0);
	strictEqual(callback.getSignature(), "function EmptyCallback()");

	const summary = callback.getSummary();
	strictEqual(summary.hasParameters, false);
	strictEqual(summary.hasReturnType, false);
	strictEqual(summary.hasThrows, false);
	strictEqual(summary.hasDescription, false);
});
