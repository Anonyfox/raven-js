import { strict as assert } from "node:assert";
import { beforeEach, describe, it } from "node:test";
import { Current } from "./current.js";

describe("Current", () => {
	/** @type {Current} */
	let current;
	let url;
	let headers;

	beforeEach(() => {
		url = new URL("https://example.com/users/123?page=1&limit=10");
		headers = new Headers({
			"content-type": "application/json",
			authorization: "Bearer token123",
		});
		current = new Current("GET", url, headers);
	});

	describe("constructor", () => {
		it("should create instance and validate parameters", () => {
			assert.equal(current.method, "GET");
			assert.equal(current.path, "/users/123");
			assert.equal(
				current.requestHeaders.get("content-type"),
				"application/json",
			);
			assert.equal(current.queryParams.get("page"), "1");

			// Test validation errors
			assert.throws(() => new Current("", url, headers), {
				message: "Method is required, got: ",
			});

			const emptyUrl = new URL("https://example.com");
			Object.defineProperty(emptyUrl, "pathname", { value: "" });
			assert.throws(() => new Current("GET", emptyUrl, headers), {
				message: "Path is required, got: ",
			});
		});

		it("should handle body parsing", () => {
			// No body
			assert.equal(current.requestBody(), null);

			// JSON body
			const jsonBody = Buffer.from('{"name":"test","age":25}');
			const jsonCurrent = new Current("POST", url, headers, jsonBody);
			const parsed = jsonCurrent.requestBody();
			assert.equal(parsed.name, "test");
			assert.equal(parsed.age, 25);

			// Form body
			const formHeaders = new Headers({
				"content-type": "application/x-www-form-urlencoded",
			});
			const formBody = Buffer.from("name=test&age=25");
			const formCurrent = new Current("POST", url, formHeaders, formBody);
			const formParsed = formCurrent.requestBody();
			assert.equal(formParsed.name, "test");

			// Unknown content type
			const unknownHeaders = new Headers({
				"content-type": "application/octet-stream",
			});
			const rawBody = Buffer.from("raw data");
			const rawCurrent = new Current("POST", url, unknownHeaders, rawBody);
			const rawResult = rawCurrent.requestBody();
			assert(Buffer.isBuffer(rawResult));
			assert.equal(rawResult.toString(), "raw data");

			// Malformed JSON
			const malformedBody = Buffer.from('{"name":"test"');
			const malformedCurrent = new Current("POST", url, headers, malformedBody);
			assert.throws(() => malformedCurrent.requestBody(), SyntaxError);
		});
	});

	describe("response shortcuts", () => {
		it("should set all response types", () => {
			// Text response
			current.text("Hello World");
			assert.equal(current.responseStatusCode, 200);
			assert.equal(current.responseHeaders.get("content-type"), "text/plain");
			assert.equal(current.responseBody, "Hello World");
			assert.equal(current.responseHeaders.get("content-length"), "11");

			// Reset for next test
			current = new Current("GET", url, headers);

			// HTML response
			current.html("<h1>Hello</h1>");
			assert.equal(current.responseHeaders.get("content-type"), "text/html");

			// Reset for next test
			current = new Current("GET", url, headers);

			// XML response
			current.xml("<root><item>test</item></root>");
			assert.equal(
				current.responseHeaders.get("content-type"),
				"application/xml",
			);

			// Reset for next test
			current = new Current("GET", url, headers);

			// JSON response
			const data = { name: "test", status: "ok" };
			current.json(data);
			assert.equal(
				current.responseHeaders.get("content-type"),
				"application/json",
			);
			assert.equal(current.responseBody, JSON.stringify(data));

			// Reset for next test
			current = new Current("GET", url, headers);

			// JavaScript response
			current.js("console.log('test');");
			assert.equal(
				current.responseHeaders.get("content-type"),
				"application/javascript",
			);

			// Reset for next test
			current = new Current("GET", url, headers);

			// Redirect responses
			current.redirect("/new-location");
			assert.equal(current.responseStatusCode, 302);
			assert.equal(current.responseHeaders.get("location"), "/new-location");

			current.redirect("/permanent", 301);
			assert.equal(current.responseStatusCode, 301);
		});
	});

	describe("middleware callbacks", () => {
		it("should handle before callbacks", async () => {
			const order = [];
			let executed = false;

			// Add callbacks
			current.addBeforeCallback((ctx) => {
				order.push(1);
				ctx.data.first = true;
			});

			current.addBeforeCallback((ctx) => {
				order.push(2);
				ctx.data.second = true;
			});

			// Test responseEnded stopping execution
			current.addBeforeCallback((ctx) => {
				ctx.responseEnded = true;
			});

			current.addBeforeCallback((_ctx) => {
				executed = true; // Should not execute
			});

			await current.runBeforeCallbacks();

			assert.deepEqual(order, [1, 2]);
			assert(current.data.first);
			assert(current.data.second);
			assert(!executed);

			// Test callback consumption
			await current.runBeforeCallbacks(); // Should do nothing
		});

		it("should handle after callbacks", async () => {
			const order = [];
			let executed = false;

			// Add callbacks
			current.addAfterCallback((ctx) => {
				order.push(1);
				ctx.data.first = true;
			});

			current.addAfterCallback((ctx) => {
				order.push(2);
				ctx.data.second = true;
			});

			// Test responseEnded stopping execution
			current.addAfterCallback((ctx) => {
				ctx.responseEnded = true;
			});

			current.addAfterCallback((_ctx) => {
				executed = true; // Should not execute
			});

			await current.runAfterCallbacks();

			assert.deepEqual(order, [1, 2]);
			assert(current.data.first);
			assert(current.data.second);
			assert(!executed);

			// Test callback consumption
			await current.runAfterCallbacks(); // Should do nothing
		});

		it("should handle async callbacks", async () => {
			let resolved = false;

			current.addBeforeCallback(async (_ctx) => {
				await new Promise((resolve) => setTimeout(resolve, 10));
				resolved = true;
			});

			await current.runBeforeCallbacks();
			assert(resolved);
		});
	});

	describe("data and properties", () => {
		it("should handle all data containers", () => {
			// Path parameters
			current.pathParams.id = "123";
			current.pathParams.name = "test";
			assert.equal(current.pathParams.id, "123");

			// Custom data
			current.data.user = { id: 1, name: "test" };
			current.data.session = { token: "abc123" };
			assert.equal(current.data.user.id, 1);

			// Response headers (mutable)
			current.responseHeaders.set("new-header", "value");
			assert.equal(current.responseHeaders.get("new-header"), "value");

			// Request headers and query params (Object.freeze limitation)
			current.requestHeaders.set("new-req-header", "value");
			current.queryParams.set("new-param", "value");
			assert.equal(current.requestHeaders.get("new-req-header"), "value");
			assert.equal(current.queryParams.get("new-param"), "value");
		});
	});

	describe("edge cases", () => {
		it("should handle various edge cases", () => {
			// Empty headers
			const emptyHeaders = new Headers();
			const emptyCurrent = new Current("GET", url, emptyHeaders);
			assert.equal(emptyCurrent.requestHeaders.get("content-type"), null);

			// No query parameters
			const simpleUrl = new URL("https://example.com/users");
			const simpleCurrent = new Current("GET", simpleUrl, headers);
			assert.equal(simpleCurrent.queryParams.get("page"), null);

			// Content-type with charset
			const charsetHeaders = new Headers({
				"content-type": "application/json; charset=utf-8",
			});
			const charsetBody = Buffer.from('{"name":"test"}');
			const charsetCurrent = new Current(
				"POST",
				url,
				charsetHeaders,
				charsetBody,
			);
			const charsetParsed = charsetCurrent.requestBody();
			assert.equal(charsetParsed.name, "test");

			// Empty body with content-type
			const emptyBodyCurrent = new Current("POST", url, headers);
			assert.equal(emptyBodyCurrent.requestBody(), null);

			// Empty response body
			current.text("");
			assert.equal(current.responseBody, "");
			assert.equal(current.responseHeaders.get("content-length"), "0");

			// Unicode content
			current.text("Hello 世界");
			assert.equal(current.responseBody, "Hello 世界");
			assert.equal(current.responseHeaders.get("content-length"), "12");
		});
	});
});
