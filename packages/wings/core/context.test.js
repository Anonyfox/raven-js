import { strict as assert } from "node:assert";
import { beforeEach, describe, it } from "node:test";
import { Context } from "./context.js";
import { Middleware } from "./middleware.js";

describe("Context", () => {
	/** @type {Context} */
	let ctx;
	let url;
	let headers;

	beforeEach(() => {
		url = new URL("https://example.com/users/123?page=1&limit=10");
		headers = new Headers({
			"content-type": "application/json",
			authorization: "Bearer token123",
		});
		ctx = new Context("GET", url, headers);
	});

	describe("constructor", () => {
		it("should create instance and validate parameters", () => {
			assert.equal(ctx.method, "GET");
			assert.equal(ctx.path, "/users/123");
			assert.equal(ctx.requestHeaders.get("content-type"), "application/json");
			assert.equal(ctx.queryParams.get("page"), "1");

			// Test validation errors
			assert.throws(() => new Context("", url, headers), {
				message: "Method is required, got: ",
			});

			const emptyUrl = new URL("https://example.com");
			Object.defineProperty(emptyUrl, "pathname", { value: "" });
			assert.throws(() => new Context("GET", emptyUrl, headers), {
				message: "Path is required, got: ",
			});
		});

		it("should handle body parsing", () => {
			// No body
			assert.equal(ctx.requestBody(), null);

			// JSON body
			const jsonBody = Buffer.from('{"name":"test","age":25}');
			const jsonCtx = new Context("POST", url, headers, jsonBody);
			const parsed = jsonCtx.requestBody();
			assert.equal(parsed.name, "test");
			assert.equal(parsed.age, 25);

			// Form body
			const formHeaders = new Headers({
				"content-type": "application/x-www-form-urlencoded",
			});
			const formBody = Buffer.from("name=test&age=25");
			const formCtx = new Context("POST", url, formHeaders, formBody);
			const formParsed = formCtx.requestBody();
			assert.equal(formParsed.name, "test");

			// Unknown content type
			const unknownHeaders = new Headers({
				"content-type": "application/octet-stream",
			});
			const rawBody = Buffer.from("raw data");
			const rawCtx = new Context("POST", url, unknownHeaders, rawBody);
			const rawResult = rawCtx.requestBody();
			assert(Buffer.isBuffer(rawResult));
			assert.equal(rawResult.toString(), "raw data");

			// Malformed JSON
			const malformedBody = Buffer.from('{"name":"test"');
			const malformedCtx = new Context("POST", url, headers, malformedBody);
			assert.throws(() => malformedCtx.requestBody(), SyntaxError);
		});
	});

	describe("response shortcuts", () => {
		it("should set all response types", async () => {
			// Text response
			await ctx.text("Hello World");
			assert.equal(ctx.responseStatusCode, 200);
			assert.equal(ctx.responseHeaders.get("content-type"), "text/plain");
			assert.equal(ctx.responseBody, "Hello World");
			assert.equal(ctx.responseHeaders.get("content-length"), "11");

			// Reset for next test
			ctx = new Context("GET", url, headers);

			// HTML response
			await ctx.html("<h1>Hello</h1>");
			assert.equal(ctx.responseHeaders.get("content-type"), "text/html");

			// Reset for next test
			ctx = new Context("GET", url, headers);

			// XML response
			await ctx.xml("<root><item>test</item></root>");
			assert.equal(ctx.responseHeaders.get("content-type"), "application/xml");

			// Reset for next test
			ctx = new Context("GET", url, headers);

			// JSON response
			const data = { name: "test", status: "ok" };
			await ctx.json(data);
			assert.equal(ctx.responseHeaders.get("content-type"), "application/json");
			assert.equal(ctx.responseBody, JSON.stringify(data));

			// Reset for next test
			ctx = new Context("GET", url, headers);

			// JavaScript response
			await ctx.js("console.log('test');");
			assert.equal(
				ctx.responseHeaders.get("content-type"),
				"application/javascript",
			);

			// Reset for next test
			ctx = new Context("GET", url, headers);

			// Redirect responses
			await ctx.redirect("/new-location");
			assert.equal(ctx.responseStatusCode, 302);
			assert.equal(ctx.responseHeaders.get("location"), "/new-location");

			await ctx.redirect("/permanent", 301);
			assert.equal(ctx.responseStatusCode, 301);
		});

		it("should support method chaining", async () => {
			// Test chaining with response methods
			const result = await ctx.text("Hello World");
			result.responseHeaders.set("custom-header", "value");

			// Verify the response was set correctly
			assert.equal(ctx.responseStatusCode, 200);
			assert.equal(ctx.responseHeaders.get("content-type"), "text/plain");
			assert.equal(ctx.responseBody, "Hello World");
			assert.equal(ctx.responseHeaders.get("custom-header"), "value");

			// Reset for next test
			ctx = new Context("GET", url, headers);

			// Test chaining with JSON response
			const jsonResult = await ctx.json({ success: true, message: "OK" });
			jsonResult.responseHeaders.set("cache-control", "no-cache");

			assert.equal(ctx.responseStatusCode, 200);
			assert.equal(ctx.responseHeaders.get("content-type"), "application/json");
			assert.equal(ctx.responseBody, '{"success":true,"message":"OK"}');
			assert.equal(ctx.responseHeaders.get("cache-control"), "no-cache");

			// Reset for next test
			ctx = new Context("GET", url, headers);

			// Test chaining with error responses
			const notFoundResult = await ctx.notFound("Resource not found");
			notFoundResult.responseHeaders.set("x-error-code", "404");

			assert.equal(ctx.responseStatusCode, 404);
			assert.equal(ctx.responseBody, "Resource not found");
			assert.equal(ctx.responseHeaders.get("x-error-code"), "404");
		});

		it("should handle error responses", async () => {
			// 404 Not Found
			await ctx.notFound();
			assert.equal(ctx.responseStatusCode, 404);
			assert.equal(ctx.responseHeaders.get("content-type"), "text/plain");
			assert.equal(ctx.responseBody, "Not Found");
			assert.equal(ctx.responseHeaders.get("content-length"), "9");

			// Reset for next test
			ctx = new Context("GET", url, headers);

			// 404 with custom message
			await ctx.notFound("Resource not found");
			assert.equal(ctx.responseStatusCode, 404);
			assert.equal(ctx.responseBody, "Resource not found");
			assert.equal(ctx.responseHeaders.get("content-length"), "18");

			// Reset for next test
			ctx = new Context("GET", url, headers);

			// 500 Internal Server Error
			await ctx.error();
			assert.equal(ctx.responseStatusCode, 500);
			assert.equal(ctx.responseHeaders.get("content-type"), "text/plain");
			assert.equal(ctx.responseBody, "Internal Server Error");
			assert.equal(ctx.responseHeaders.get("content-length"), "21");

			// Reset for next test
			ctx = new Context("GET", url, headers);

			// 500 with custom message
			await ctx.error("Something went wrong");
			assert.equal(ctx.responseStatusCode, 500);
			assert.equal(ctx.responseBody, "Something went wrong");
			assert.equal(ctx.responseHeaders.get("content-length"), "20");
		});
	});

	describe("middleware callbacks", () => {
		it("should handle before callbacks", async () => {
			const order = [];
			let executed = false;

			// Add callbacks
			ctx.addBeforeCallback(
				new Middleware((ctx) => {
					order.push(1);
					ctx.data.first = true;
				}),
			);

			ctx.addBeforeCallback(
				new Middleware((ctx) => {
					order.push(2);
					ctx.data.second = true;
				}),
			);

			// Test responseEnded stopping execution
			ctx.addBeforeCallback(
				new Middleware((ctx) => {
					ctx.responseEnded = true;
				}),
			);

			ctx.addBeforeCallback(
				new Middleware((_ctx) => {
					executed = true; // Should not execute
				}),
			);

			await ctx.runBeforeCallbacks();

			assert.deepEqual(order, [1, 2]);
			assert(ctx.data.first);
			assert(ctx.data.second);
			assert(!executed);

			// Test callback consumption
			await ctx.runBeforeCallbacks(); // Should do nothing
		});

		it("should handle multiple before callbacks", async () => {
			const order = [];
			const middlewares = [
				new Middleware((ctx) => {
					order.push(1);
					ctx.data.first = true;
				}),
				new Middleware((ctx) => {
					order.push(2);
					ctx.data.second = true;
				}),
				new Middleware((ctx) => {
					order.push(3);
					ctx.data.third = true;
				}),
			];

			// Add multiple callbacks at once
			ctx.addBeforeCallbacks(middlewares);

			await ctx.runBeforeCallbacks();

			assert.deepEqual(order, [1, 2, 3]);
			assert(ctx.data.first);
			assert(ctx.data.second);
			assert(ctx.data.third);
		});

		it("should handle after callbacks", async () => {
			const order = [];
			let executed = false;

			// Add callbacks
			ctx.addAfterCallback(
				new Middleware((ctx) => {
					order.push(1);
					ctx.data.first = true;
				}),
			);

			ctx.addAfterCallback(
				new Middleware((ctx) => {
					order.push(2);
					ctx.data.second = true;
				}),
			);

			// Test responseEnded stopping execution
			ctx.addAfterCallback(
				new Middleware((ctx) => {
					ctx.responseEnded = true;
				}),
			);

			ctx.addAfterCallback(
				new Middleware((_ctx) => {
					executed = true; // Should not execute
				}),
			);

			await ctx.runAfterCallbacks();

			assert.deepEqual(order, [1, 2]);
			assert(ctx.data.first);
			assert(ctx.data.second);
			assert(!executed);

			// Test callback consumption
			await ctx.runAfterCallbacks(); // Should do nothing
		});

		it("should handle multiple after callbacks", async () => {
			const order = [];
			const middlewares = [
				new Middleware((ctx) => {
					order.push(1);
					ctx.data.first = true;
				}),
				new Middleware((ctx) => {
					order.push(2);
					ctx.data.second = true;
				}),
				new Middleware((ctx) => {
					order.push(3);
					ctx.data.third = true;
				}),
			];

			// Add multiple callbacks at once
			ctx.addAfterCallbacks(middlewares);

			await ctx.runAfterCallbacks();

			assert.deepEqual(order, [1, 2, 3]);
			assert(ctx.data.first);
			assert(ctx.data.second);
			assert(ctx.data.third);
		});

		it("should handle async callbacks", async () => {
			let resolved = false;

			ctx.addBeforeCallback(
				new Middleware(async (_ctx) => {
					await new Promise((resolve) => setTimeout(resolve, 10));
					resolved = true;
				}),
			);

			await ctx.runBeforeCallbacks();
			assert(resolved);
		});
	});

	describe("data and properties", () => {
		it("should handle all data containers", () => {
			// Path parameters
			ctx.pathParams.id = "123";
			ctx.pathParams.name = "test";
			assert.equal(ctx.pathParams.id, "123");

			// Custom data
			ctx.data.user = { id: 1, name: "test" };
			ctx.data.session = { token: "abc123" };
			assert.equal(ctx.data.user.id, 1);

			// Response headers (mutable)
			ctx.responseHeaders.set("new-header", "value");
			assert.equal(ctx.responseHeaders.get("new-header"), "value");

			// Request headers and query params (Object.freeze limitation)
			ctx.requestHeaders.set("new-req-header", "value");
			ctx.queryParams.set("new-param", "value");
			assert.equal(ctx.requestHeaders.get("new-req-header"), "value");
			assert.equal(ctx.queryParams.get("new-param"), "value");
		});
	});

	describe("edge cases", () => {
		it("should handle various edge cases", async () => {
			// Empty headers
			const emptyHeaders = new Headers();
			const emptyCtx = new Context("GET", url, emptyHeaders);
			assert.equal(emptyCtx.requestHeaders.get("content-type"), null);

			// No query parameters
			const simpleUrl = new URL("https://example.com/users");
			const simpleCtx = new Context("GET", simpleUrl, headers);
			assert.equal(simpleCtx.queryParams.get("page"), null);

			// Content-type with charset
			const charsetHeaders = new Headers({
				"content-type": "application/json; charset=utf-8",
			});
			const charsetBody = Buffer.from('{"name":"test"}');
			const charsetCtx = new Context("POST", url, charsetHeaders, charsetBody);
			const charsetParsed = charsetCtx.requestBody();
			assert.equal(charsetParsed.name, "test");

			// Empty body with content-type
			const emptyBodyCtx = new Context("POST", url, headers);
			assert.equal(emptyBodyCtx.requestBody(), null);

			// Empty response body
			await ctx.text("");
			assert.equal(ctx.responseBody, "");
			assert.equal(ctx.responseHeaders.get("content-length"), "0");

			// Unicode content
			await ctx.text("Hello 世界");
			assert.equal(ctx.responseBody, "Hello 世界");
			assert.equal(ctx.responseHeaders.get("content-length"), "12");
		});

		it("should handle constructor validation edge cases", () => {
			// Invalid HTTP methods
			assert.throws(() => new Context("INVALID", url, headers), {
				message: "Invalid HTTP method: INVALID",
			});
			assert.throws(() => new Context("GETT", url, headers), {
				message: "Invalid HTTP method: GETT",
			});
			assert.throws(() => new Context("get", url, headers), {
				message: "Invalid HTTP method: get",
			});

			// Path too long
			const longPath = `/${"a".repeat(2048)}`;
			const longPathUrl = new URL("https://example.com");
			longPathUrl.pathname = longPath;
			assert.throws(() => new Context("GET", longPathUrl, headers), {
				message: "Path too long",
			});

			// Path with too many segments
			const manySegments = `/${Array(101).fill("segment").join("/")}`;
			const manySegmentsUrl = new URL("https://example.com");
			manySegmentsUrl.pathname = manySegments;
			assert.throws(() => new Context("GET", manySegmentsUrl, headers), {
				message: "Path too long",
			});

			// Path with only slashes (this is actually valid in HTTP)
			const slashOnlyUrl = new URL("https://example.com");
			slashOnlyUrl.pathname = "///";
			const slashOnlyCtx = new Context("GET", slashOnlyUrl, headers);
			assert.equal(slashOnlyCtx.path, "///");

			// Test non-string path type (this branch is hard to test with URL API)
			// We'll test this by creating a mock URL object
			const mockUrl = {
				pathname: 123,
				searchParams: new URLSearchParams(),
			};
			assert.throws(() => new Context("GET", mockUrl, headers), {
				message: "Path must be a string",
			});
		});

		it("should handle body parsing edge cases", () => {
			// Empty JSON object
			const emptyJsonBody = Buffer.from("{}");
			const emptyJsonCtx = new Context("POST", url, headers, emptyJsonBody);
			const emptyJsonParsed = emptyJsonCtx.requestBody();
			assert.deepEqual(emptyJsonParsed, {});

			// JSON with null values
			const nullJsonBody = Buffer.from('{"name":null,"age":null}');
			const nullJsonCtx = new Context("POST", url, headers, nullJsonBody);
			const nullJsonParsed = nullJsonCtx.requestBody();
			assert.equal(nullJsonParsed.name, null);
			assert.equal(nullJsonParsed.age, null);

			// JSON with special characters
			const specialJsonBody = Buffer.from(
				'{"name":"José","message":"Hello 世界"}',
			);
			const specialJsonCtx = new Context("POST", url, headers, specialJsonBody);
			const specialJsonParsed = specialJsonCtx.requestBody();
			assert.equal(specialJsonParsed.name, "José");
			assert.equal(specialJsonParsed.message, "Hello 世界");

			// Form data edge cases
			const formHeaders = new Headers({
				"content-type": "application/x-www-form-urlencoded",
			});

			// Empty form data
			const emptyFormBody = Buffer.from("");
			const emptyFormCtx = new Context("POST", url, formHeaders, emptyFormBody);
			const emptyFormParsed = emptyFormCtx.requestBody();
			assert.deepEqual(emptyFormParsed, {});

			// Form data with duplicate keys
			const duplicateFormBody = Buffer.from("name=john&name=jane&age=25");
			const duplicateFormCtx = new Context(
				"POST",
				url,
				formHeaders,
				duplicateFormBody,
			);
			const duplicateFormParsed = duplicateFormCtx.requestBody();
			assert.equal(duplicateFormParsed.name, "jane"); // Last value wins
			assert.equal(duplicateFormParsed.age, "25");

			// Form data with special characters
			const specialFormBody = Buffer.from("name=José&message=Hello%20世界");
			const specialFormCtx = new Context(
				"POST",
				url,
				formHeaders,
				specialFormBody,
			);
			const specialFormParsed = specialFormCtx.requestBody();
			assert.equal(specialFormParsed.name, "José");
			assert.equal(specialFormParsed.message, "Hello 世界");

			// Malformed form data
			const malformedFormBody = Buffer.from("name=john&age=");
			const malformedFormCtx = new Context(
				"POST",
				url,
				formHeaders,
				malformedFormBody,
			);
			const malformedFormParsed = malformedFormCtx.requestBody();
			assert.equal(malformedFormParsed.name, "john");
			assert.equal(malformedFormParsed.age, "");

			// Test falsy body values (empty buffer, etc.)
			const emptyBuffer = Buffer.from("");
			const emptyBufferCtx = new Context("POST", url, headers, emptyBuffer);
			assert.equal(emptyBufferCtx.requestBody(), null); // Empty buffer is falsy

			// Test with falsy but non-null body
			const falsyBody = Buffer.from([]);
			const falsyBodyCtx = new Context("POST", url, headers, falsyBody);
			assert.equal(falsyBodyCtx.requestBody(), null); // Empty buffer is falsy
		});

		it("should handle content-type edge cases", () => {
			// Missing content-type
			const noContentTypeHeaders = new Headers();
			const noContentTypeBody = Buffer.from("raw data");
			const noContentTypeCtx = new Context(
				"POST",
				url,
				noContentTypeHeaders,
				noContentTypeBody,
			);
			const noContentTypeResult = noContentTypeCtx.requestBody();
			assert(Buffer.isBuffer(noContentTypeResult));
			assert.equal(noContentTypeResult.toString(), "raw data");

			// Content-type with extra whitespace
			const whitespaceHeaders = new Headers({
				"content-type": "  application/json  ",
			});
			const whitespaceBody = Buffer.from('{"name":"test"}');
			const whitespaceCtx = new Context(
				"POST",
				url,
				whitespaceHeaders,
				whitespaceBody,
			);
			const whitespaceParsed = whitespaceCtx.requestBody();
			assert.equal(whitespaceParsed.name, "test");

			// Content-type with multiple parameters
			const multiParamHeaders = new Headers({
				"content-type": "application/json; charset=utf-8; boundary=123",
			});
			const multiParamBody = Buffer.from('{"name":"test"}');
			const multiParamCtx = new Context(
				"POST",
				url,
				multiParamHeaders,
				multiParamBody,
			);
			const multiParamParsed = multiParamCtx.requestBody();
			assert.equal(multiParamParsed.name, "test");

			// Case insensitive content-type
			const caseInsensitiveHeaders = new Headers({
				"content-type": "APPLICATION/JSON",
			});
			const caseInsensitiveBody = Buffer.from('{"name":"test"}');
			const caseInsensitiveCtx = new Context(
				"POST",
				url,
				caseInsensitiveHeaders,
				caseInsensitiveBody,
			);
			const caseInsensitiveParsed = caseInsensitiveCtx.requestBody();
			assert.equal(caseInsensitiveParsed.name, "test");
		});

		it("should handle middleware execution edge cases", async () => {
			// Middleware that throws synchronous error
			ctx.addBeforeCallback(
				new Middleware((_ctx) => {
					throw new Error("Synchronous error");
				}),
			);

			await assert.rejects(async () => await ctx.runBeforeCallbacks(), {
				message: "Synchronous error",
			});

			// Reset context
			ctx = new Context("GET", url, headers);

			// Middleware that rejects promise
			ctx.addBeforeCallback(
				new Middleware(async (_ctx) => {
					throw new Error("Async error");
				}),
			);

			await assert.rejects(async () => await ctx.runBeforeCallbacks(), {
				message: "Async error",
			});

			// Reset context
			ctx = new Context("GET", url, headers);

			// Middleware that adds more middleware during execution
			ctx.addBeforeCallback(
				new Middleware((ctx) => {
					ctx.addBeforeCallback(
						new Middleware((ctx) => {
							ctx.data.dynamic = true;
						}),
					);
				}),
			);

			await ctx.runBeforeCallbacks();
			assert(ctx.data.dynamic);

			// Reset context
			ctx = new Context("GET", url, headers);

			// Test responseEnded stopping before callbacks
			ctx.responseEnded = true;
			ctx.addBeforeCallback(
				new Middleware((ctx) => {
					ctx.data.shouldNotExecute = true;
				}),
			);

			await ctx.runBeforeCallbacks();
			assert(!ctx.data.shouldNotExecute);

			// Reset context
			ctx = new Context("GET", url, headers);

			// Test responseEnded stopping after callbacks
			ctx.responseEnded = true;
			ctx.addAfterCallback(
				new Middleware((ctx) => {
					ctx.data.shouldNotExecuteAfter = true;
				}),
			);

			await ctx.runAfterCallbacks();
			assert(!ctx.data.shouldNotExecuteAfter);

			// Reset context
			ctx = new Context("GET", url, headers);

			// Test middleware setting responseEnded during execution
			ctx.addBeforeCallback(
				new Middleware((ctx) => {
					ctx.data.first = true;
				}),
			);
			ctx.addBeforeCallback(
				new Middleware((ctx) => {
					ctx.responseEnded = true;
					ctx.data.second = true;
				}),
			);
			ctx.addBeforeCallback(
				new Middleware((ctx) => {
					ctx.data.third = true; // Should not execute
				}),
			);

			await ctx.runBeforeCallbacks();
			assert(ctx.data.first);
			assert(ctx.data.second);
			assert(!ctx.data.third);
		});

		it("should handle response method edge cases", async () => {
			// JSON with circular reference (should throw)
			const circularObj = { name: "test" };
			circularObj.self = circularObj;

			await assert.rejects(() => ctx.json(circularObj), TypeError);

			// JSON with undefined values (should be omitted)
			const objWithUndefined = { name: "test", value: undefined };
			await ctx.json(objWithUndefined);
			assert.equal(ctx.responseBody, '{"name":"test"}');

			// Empty JSON object
			await ctx.json({});
			assert.equal(ctx.responseBody, "{}");

			// Unicode content in text response
			await ctx.text("Hello 世界 🌍");
			assert.equal(ctx.responseBody, "Hello 世界 🌍");
			assert.equal(ctx.responseHeaders.get("content-length"), "17");

			// Very long text
			const longText = "a".repeat(10000);
			await ctx.text(longText);
			assert.equal(ctx.responseBody, longText);
			assert.equal(ctx.responseHeaders.get("content-length"), "10000");

			// Empty text
			await ctx.text("");
			assert.equal(ctx.responseBody, "");
			assert.equal(ctx.responseHeaders.get("content-length"), "0");

			// Test falsy values in response methods
			await ctx.text(0);
			assert.equal(ctx.responseBody, "");
			assert.equal(ctx.responseHeaders.get("content-length"), "0");

			await ctx.text(false);
			assert.equal(ctx.responseBody, "");
			assert.equal(ctx.responseHeaders.get("content-length"), "0");

			await ctx.html(0);
			assert.equal(ctx.responseBody, "");
			assert.equal(ctx.responseHeaders.get("content-type"), "text/html");

			await ctx.xml(false);
			assert.equal(ctx.responseBody, "");
			assert.equal(ctx.responseHeaders.get("content-type"), "application/xml");

			await ctx.js(0);
			assert.equal(ctx.responseBody, "");
			assert.equal(
				ctx.responseHeaders.get("content-type"),
				"application/javascript",
			);

			await ctx.notFound(0);
			assert.equal(ctx.responseBody, "");
			assert.equal(ctx.responseStatusCode, 404);

			await ctx.error(false);
			assert.equal(ctx.responseBody, "");
			assert.equal(ctx.responseStatusCode, 500);
		});

		it("should handle data property edge cases", () => {
			// Setting non-string values in pathParams
			ctx.pathParams.id = 123;
			ctx.pathParams.active = true;
			ctx.pathParams.nullValue = null;
			assert.equal(ctx.pathParams.id, 123);
			assert.equal(ctx.pathParams.active, true);
			assert.equal(ctx.pathParams.nullValue, null);

			// Setting complex objects in data
			ctx.data.user = { id: 1, name: "test" };
			ctx.data.func = () => "test";
			ctx.data.symbol = Symbol("test");
			assert.equal(ctx.data.user.id, 1);
			assert.equal(typeof ctx.data.func, "function");
			assert.equal(typeof ctx.data.symbol, "symbol");

			// Setting null/undefined in data
			ctx.data.nullValue = null;
			ctx.data.undefinedValue = undefined;
			assert.equal(ctx.data.nullValue, null);
			assert.equal(ctx.data.undefinedValue, undefined);
		});

		it("should handle Object.freeze limitations", () => {
			// Test that Headers are still mutable despite Object.freeze
			ctx.requestHeaders.set("new-header", "value");
			assert.equal(ctx.requestHeaders.get("new-header"), "value");

			// Test that URLSearchParams are still mutable despite Object.freeze
			ctx.queryParams.set("new-param", "value");
			assert.equal(ctx.queryParams.get("new-param"), "value");

			// This reveals a bug in the current implementation
			// Object.freeze() doesn't work as expected on Headers and URLSearchParams
		});

		it("should handle security edge cases", () => {
			// Path traversal attempt
			const traversalUrl = new URL("https://example.com");
			Object.defineProperty(traversalUrl, "pathname", {
				value: "/../../../etc/passwd",
			});
			const traversalCtx = new Context("GET", traversalUrl, headers);
			assert.equal(traversalCtx.path, "/../../../etc/passwd");

			// Malicious header values (using valid header format to test actual behavior)
			const maliciousHeaders = new Headers({
				"content-type": "application/json",
				"x-header": "value with spaces and special chars: <>&\"'",
			});
			const maliciousCtx = new Context("GET", url, maliciousHeaders);
			assert.equal(
				maliciousCtx.requestHeaders.get("x-header"),
				"value with spaces and special chars: <>&\"'",
			);

			// Malicious query parameters
			const maliciousUrl = new URL(
				"https://example.com/users?name=<script>alert('xss')</script>",
			);
			const maliciousQueryCtx = new Context("GET", maliciousUrl, headers);
			assert.equal(
				maliciousQueryCtx.queryParams.get("name"),
				"<script>alert('xss')</script>",
			);
		});

		it("should handle error recovery edge cases", async () => {
			// Test context state after JSON parsing error
			const malformedJsonBody = Buffer.from('{"name":"test"');
			const malformedJsonCtx = new Context(
				"POST",
				url,
				headers,
				malformedJsonBody,
			);

			assert.throws(() => malformedJsonCtx.requestBody(), SyntaxError);

			// Context should still be usable after error
			await malformedJsonCtx.text("Recovery response");
			assert.equal(malformedJsonCtx.responseBody, "Recovery response");
			assert.equal(malformedJsonCtx.responseStatusCode, 200);
		});

		it("should handle method chaining edge cases", async () => {
			// Chaining with null/undefined values
			const nullResult = await ctx.text(null);
			nullResult.responseHeaders.set("x-null", null);
			assert.equal(ctx.responseBody, "");
			assert.equal(ctx.responseHeaders.get("x-null"), "null");

			// Chaining with very long values
			const longValue = "a".repeat(1000);
			const longResult = await ctx.text(longValue);
			longResult.responseHeaders.set("x-long", longValue);
			assert.equal(ctx.responseBody, longValue);
			assert.equal(ctx.responseHeaders.get("x-long"), longValue);

			// Chaining with special characters (without newlines due to Headers API restrictions)
			const specialResult = await ctx.text("Hello World\tTest");
			specialResult.responseHeaders.set("x-special", "Hello World\tTest");
			assert.equal(ctx.responseBody, "Hello World\tTest");
			assert.equal(ctx.responseHeaders.get("x-special"), "Hello World\tTest");
		});
	});

	describe("promise support", () => {
		it("should handle promise data in text() method", async () => {
			const promiseData = Promise.resolve("Hello Promise World");
			await ctx.text(promiseData);

			assert.equal(ctx.responseStatusCode, 200);
			assert.equal(ctx.responseHeaders.get("content-type"), "text/plain");
			assert.equal(ctx.responseBody, "Hello Promise World");
			assert.equal(ctx.responseHeaders.get("content-length"), "19");
		});

		it("should handle promise data in html() method", async () => {
			const promiseData = Promise.resolve("<h1>Promise HTML</h1>");
			await ctx.html(promiseData);

			assert.equal(ctx.responseStatusCode, 200);
			assert.equal(ctx.responseHeaders.get("content-type"), "text/html");
			assert.equal(ctx.responseBody, "<h1>Promise HTML</h1>");
			assert.equal(ctx.responseHeaders.get("content-length"), "21");
		});

		it("should handle promise data in xml() method", async () => {
			const promiseData = Promise.resolve("<root><item>promise</item></root>");
			await ctx.xml(promiseData);

			assert.equal(ctx.responseStatusCode, 200);
			assert.equal(ctx.responseHeaders.get("content-type"), "application/xml");
			assert.equal(ctx.responseBody, "<root><item>promise</item></root>");
			assert.equal(ctx.responseHeaders.get("content-length"), "33");
		});

		it("should handle promise data in json() method", async () => {
			const promiseData = Promise.resolve({
				message: "promise data",
				value: 42,
			});
			await ctx.json(promiseData);

			assert.equal(ctx.responseStatusCode, 200);
			assert.equal(ctx.responseHeaders.get("content-type"), "application/json");
			assert.equal(ctx.responseBody, '{"message":"promise data","value":42}');
			assert.equal(ctx.responseHeaders.get("content-length"), "37");
		});

		it("should handle promise data in js() method", async () => {
			const promiseData = Promise.resolve('console.log("promise script");');
			await ctx.js(promiseData);

			assert.equal(ctx.responseStatusCode, 200);
			assert.equal(
				ctx.responseHeaders.get("content-type"),
				"application/javascript",
			);
			assert.equal(ctx.responseBody, 'console.log("promise script");');
			assert.equal(ctx.responseHeaders.get("content-length"), "30");
		});

		it("should handle promise url in redirect() method", async () => {
			const promiseUrl = Promise.resolve("/promise-redirect");
			await ctx.redirect(promiseUrl);

			assert.equal(ctx.responseStatusCode, 302);
			assert.equal(ctx.responseHeaders.get("location"), "/promise-redirect");
		});

		it("should handle promise url with status in redirect() method", async () => {
			const promiseUrl = Promise.resolve("/permanent-promise");
			await ctx.redirect(promiseUrl, 301);

			assert.equal(ctx.responseStatusCode, 301);
			assert.equal(ctx.responseHeaders.get("location"), "/permanent-promise");
		});

		it("should handle promise message in notFound() method", async () => {
			const promiseMessage = Promise.resolve("Promise resource not found");
			await ctx.notFound(promiseMessage);

			assert.equal(ctx.responseStatusCode, 404);
			assert.equal(ctx.responseHeaders.get("content-type"), "text/plain");
			assert.equal(ctx.responseBody, "Promise resource not found");
			assert.equal(ctx.responseHeaders.get("content-length"), "26");
		});

		it("should handle promise message in error() method", async () => {
			const promiseMessage = Promise.resolve("Promise server error occurred");
			await ctx.error(promiseMessage);

			assert.equal(ctx.responseStatusCode, 500);
			assert.equal(ctx.responseHeaders.get("content-type"), "text/plain");
			assert.equal(ctx.responseBody, "Promise server error occurred");
			assert.equal(ctx.responseHeaders.get("content-length"), "29");
		});

		it("should handle rejected promises properly", async () => {
			const rejectedPromise = Promise.reject(new Error("Promise rejected"));

			// Test that the async methods properly propagate promise rejections
			await assert.rejects(async () => await ctx.text(rejectedPromise), {
				message: "Promise rejected",
			});

			await assert.rejects(async () => await ctx.html(rejectedPromise), {
				message: "Promise rejected",
			});

			await assert.rejects(async () => await ctx.xml(rejectedPromise), {
				message: "Promise rejected",
			});

			await assert.rejects(async () => await ctx.json(rejectedPromise), {
				message: "Promise rejected",
			});

			await assert.rejects(async () => await ctx.js(rejectedPromise), {
				message: "Promise rejected",
			});

			await assert.rejects(async () => await ctx.redirect(rejectedPromise), {
				message: "Promise rejected",
			});

			await assert.rejects(async () => await ctx.notFound(rejectedPromise), {
				message: "Promise rejected",
			});

			await assert.rejects(async () => await ctx.error(rejectedPromise), {
				message: "Promise rejected",
			});
		});

		it("should handle method chaining with promises", async () => {
			const promiseData = Promise.resolve({
				status: "success",
				data: "chained",
			});
			await ctx.json(promiseData);
			ctx.responseHeaders.set("x-promise-test", "chained");

			assert.equal(ctx.responseStatusCode, 200);
			assert.equal(ctx.responseHeaders.get("content-type"), "application/json");
			assert.equal(ctx.responseBody, '{"status":"success","data":"chained"}');
			assert.equal(ctx.responseHeaders.get("x-promise-test"), "chained");
		});

		it("should handle async promise data with computed content", async () => {
			// Simulate an async operation that takes time
			const asyncOperation = () =>
				new Promise((resolve) => {
					setTimeout(() => resolve("Computed after delay"), 10);
				});

			await ctx.text(asyncOperation());

			assert.equal(ctx.responseStatusCode, 200);
			assert.equal(ctx.responseHeaders.get("content-type"), "text/plain");
			assert.equal(ctx.responseBody, "Computed after delay");
		});

		it("should handle falsy promise values correctly", async () => {
			// Test null promise
			await ctx.text(Promise.resolve(null));
			assert.equal(ctx.responseBody, "");
			assert.equal(ctx.responseHeaders.get("content-length"), "0");

			// Reset context
			ctx = new Context("GET", url, headers);

			// Test empty string promise
			await ctx.html(Promise.resolve(""));
			assert.equal(ctx.responseBody, "");
			assert.equal(ctx.responseHeaders.get("content-type"), "text/html");

			// Reset context
			ctx = new Context("GET", url, headers);

			// Test undefined promise
			await ctx.xml(Promise.resolve(undefined));
			assert.equal(ctx.responseBody, "");
			assert.equal(ctx.responseHeaders.get("content-type"), "application/xml");

			// Reset context
			ctx = new Context("GET", url, headers);

			// Test 0 promise
			await ctx.js(Promise.resolve(0));
			assert.equal(ctx.responseBody, "");
			assert.equal(
				ctx.responseHeaders.get("content-type"),
				"application/javascript",
			);

			// Reset context
			ctx = new Context("GET", url, headers);

			// Test false promise
			await ctx.notFound(Promise.resolve(false));
			assert.equal(ctx.responseBody, "");
			assert.equal(ctx.responseStatusCode, 404);
		});

		it("should handle complex JSON promise data", async () => {
			const complexData = Promise.resolve({
				users: [
					{ id: 1, name: "Alice", active: true },
					{ id: 2, name: "Bob", active: false },
				],
				metadata: {
					total: 2,
					timestamp: "2024-01-01T00:00:00Z",
				},
				config: {
					debug: false,
					version: "1.0.0",
				},
			});

			await ctx.json(complexData);

			assert.equal(ctx.responseStatusCode, 200);
			assert.equal(ctx.responseHeaders.get("content-type"), "application/json");

			const parsedBody = JSON.parse(ctx.responseBody);
			assert.equal(parsedBody.users.length, 2);
			assert.equal(parsedBody.users[0].name, "Alice");
			assert.equal(parsedBody.metadata.total, 2);
			assert.equal(parsedBody.config.version, "1.0.0");
		});
	});

	describe("cache and status code coverage", () => {
		it("should cache parsed body results for multiple calls", () => {
			// Test the body parsing cache to cover lines 232-233
			const jsonBody = Buffer.from('{"name":"test","value":42}');
			const jsonCtx = new Context("POST", url, headers, jsonBody);

			// First call should parse the body
			const firstCall = jsonCtx.requestBody();
			assert.equal(firstCall.name, "test");
			assert.equal(firstCall.value, 42);

			// Second call should return cached result (covers lines 232-233)
			const secondCall = jsonCtx.requestBody();
			assert.equal(secondCall.name, "test");
			assert.equal(secondCall.value, 42);

			// Should be the same reference due to caching
			assert.strictEqual(firstCall, secondCall);

			// Test with form data too
			const formHeaders = new Headers({
				"content-type": "application/x-www-form-urlencoded",
			});
			const formBody = Buffer.from("name=test&value=42");
			const formCtx = new Context("POST", url, formHeaders, formBody);

			const firstFormCall = formCtx.requestBody();
			const secondFormCall = formCtx.requestBody();
			assert.strictEqual(firstFormCall, secondFormCall);
		});

		it("should correctly identify 404 responses with isNotFound()", async () => {
			// Test the isNotFound() method to cover lines 693-694
			const ctx = new Context("GET", url, headers);

			// Initially should not be 404
			assert.equal(ctx.isNotFound(), false);

			// Set to 404 and test
			await ctx.notFound("Resource not found");
			assert.equal(ctx.isNotFound(), true);
			assert.equal(ctx.responseStatusCode, 404);

			// Set to different status and test again
			await ctx.text("Found it");
			ctx.responseStatusCode = 200;
			assert.equal(ctx.isNotFound(), false);
			assert.equal(ctx.responseStatusCode, 200);

			// Test with explicit status code setting
			ctx.responseStatusCode = 404;
			assert.equal(ctx.isNotFound(), true);

			// Test with other error status codes
			ctx.responseStatusCode = 500;
			assert.equal(ctx.isNotFound(), false);

			ctx.responseStatusCode = 403;
			assert.equal(ctx.isNotFound(), false);
		});
	});

	describe("toResponse", () => {
		it("should create Response with text content", async () => {
			await ctx.text("Hello World");
			const response = ctx.toResponse();

			assert.equal(response.status, 200);
			assert.equal(response.headers.get("content-type"), "text/plain");
			assert.equal(response.headers.get("content-length"), "11");
		});

		it("should create Response with JSON content", async () => {
			const data = { message: "Hello", count: 42 };
			await ctx.json(data);
			const response = ctx.toResponse();

			assert.equal(response.status, 200);
			assert.equal(response.headers.get("content-type"), "application/json");

			const responseData = await response.json();
			assert.equal(responseData.message, "Hello");
			assert.equal(responseData.count, 42);
		});

		it("should create Response with HTML content", async () => {
			const html = "<h1>Title</h1><p>Content</p>";
			await ctx.html(html);
			const response = ctx.toResponse();

			assert.equal(response.status, 200);
			assert.equal(response.headers.get("content-type"), "text/html");

			const responseText = await response.text();
			assert.equal(responseText, html);
		});

		it("should create Response with XML content", async () => {
			const xml = "<root><item>value</item></root>";
			await ctx.xml(xml);
			const response = ctx.toResponse();

			assert.equal(response.status, 200);
			assert.equal(response.headers.get("content-type"), "application/xml");

			const responseText = await response.text();
			assert.equal(responseText, xml);
		});

		it("should create Response with JavaScript content", async () => {
			const js = 'console.log("Hello");';
			await ctx.js(js);
			const response = ctx.toResponse();

			assert.equal(response.status, 200);
			assert.equal(
				response.headers.get("content-type"),
				"application/javascript",
			);

			const responseText = await response.text();
			assert.equal(responseText, js);
		});

		it("should create Response with custom status codes", async () => {
			await ctx.notFound("Resource not found");
			const notFoundResponse = ctx.toResponse();
			assert.equal(notFoundResponse.status, 404);

			await ctx.error("Server error");
			const errorResponse = ctx.toResponse();
			assert.equal(errorResponse.status, 500);
		});

		it("should create Response with custom headers", async () => {
			await ctx.text("Test");
			ctx.responseHeaders.set("x-custom-header", "custom-value");
			ctx.responseHeaders.set("cache-control", "no-cache");

			const response = ctx.toResponse();
			assert.equal(response.headers.get("x-custom-header"), "custom-value");
			assert.equal(response.headers.get("cache-control"), "no-cache");
		});

		it("should handle empty response body", async () => {
			await ctx.text("");
			const response = ctx.toResponse();

			assert.equal(response.status, 200);
			assert.equal(response.headers.get("content-length"), "0");
		});

		it("should handle null response body", () => {
			// Default state - no response set
			const response = ctx.toResponse();

			assert.equal(response.status, 200); // Default status
			assert.equal(response.body, null);
		});

		it("should preserve all headers from responseHeaders", async () => {
			await ctx.text("Test content");
			ctx.responseHeaders.set("x-test-1", "value1");
			ctx.responseHeaders.set("x-test-2", "value2");
			ctx.responseHeaders.set("x-test-3", "value3");

			const response = ctx.toResponse();
			assert.equal(response.headers.get("x-test-1"), "value1");
			assert.equal(response.headers.get("x-test-2"), "value2");
			assert.equal(response.headers.get("x-test-3"), "value3");
			assert.equal(response.headers.get("content-type"), "text/plain");
		});

		it("should work with Buffer response body", () => {
			const bufferContent = Buffer.from("Binary content", "utf8");
			ctx.responseBody = bufferContent;
			ctx.responseStatusCode = 200;
			ctx.responseHeaders.set("content-type", "application/octet-stream");

			const response = ctx.toResponse();
			assert.equal(response.status, 200);
			assert.equal(
				response.headers.get("content-type"),
				"application/octet-stream",
			);
		});
	});
});
