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
		it("should set all response types", () => {
			// Text response
			ctx.text("Hello World");
			assert.equal(ctx.responseStatusCode, 200);
			assert.equal(ctx.responseHeaders.get("content-type"), "text/plain");
			assert.equal(ctx.responseBody, "Hello World");
			assert.equal(ctx.responseHeaders.get("content-length"), "11");

			// Reset for next test
			ctx = new Context("GET", url, headers);

			// HTML response
			ctx.html("<h1>Hello</h1>");
			assert.equal(ctx.responseHeaders.get("content-type"), "text/html");

			// Reset for next test
			ctx = new Context("GET", url, headers);

			// XML response
			ctx.xml("<root><item>test</item></root>");
			assert.equal(ctx.responseHeaders.get("content-type"), "application/xml");

			// Reset for next test
			ctx = new Context("GET", url, headers);

			// JSON response
			const data = { name: "test", status: "ok" };
			ctx.json(data);
			assert.equal(ctx.responseHeaders.get("content-type"), "application/json");
			assert.equal(ctx.responseBody, JSON.stringify(data));

			// Reset for next test
			ctx = new Context("GET", url, headers);

			// JavaScript response
			ctx.js("console.log('test');");
			assert.equal(
				ctx.responseHeaders.get("content-type"),
				"application/javascript",
			);

			// Reset for next test
			ctx = new Context("GET", url, headers);

			// Redirect responses
			ctx.redirect("/new-location");
			assert.equal(ctx.responseStatusCode, 302);
			assert.equal(ctx.responseHeaders.get("location"), "/new-location");

			ctx.redirect("/permanent", 301);
			assert.equal(ctx.responseStatusCode, 301);
		});

		it("should support method chaining", () => {
			// Test chaining with response methods
			ctx.text("Hello World").responseHeaders.set("custom-header", "value");

			// Verify the response was set correctly
			assert.equal(ctx.responseStatusCode, 200);
			assert.equal(ctx.responseHeaders.get("content-type"), "text/plain");
			assert.equal(ctx.responseBody, "Hello World");
			assert.equal(ctx.responseHeaders.get("custom-header"), "value");

			// Reset for next test
			ctx = new Context("GET", url, headers);

			// Test chaining with JSON response
			ctx
				.json({ success: true, message: "OK" })
				.responseHeaders.set("cache-control", "no-cache");

			assert.equal(ctx.responseStatusCode, 200);
			assert.equal(ctx.responseHeaders.get("content-type"), "application/json");
			assert.equal(ctx.responseBody, '{"success":true,"message":"OK"}');
			assert.equal(ctx.responseHeaders.get("cache-control"), "no-cache");

			// Reset for next test
			ctx = new Context("GET", url, headers);

			// Test chaining with error responses
			ctx
				.notFound("Resource not found")
				.responseHeaders.set("x-error-code", "404");

			assert.equal(ctx.responseStatusCode, 404);
			assert.equal(ctx.responseBody, "Resource not found");
			assert.equal(ctx.responseHeaders.get("x-error-code"), "404");
		});

		it("should handle error responses", () => {
			// 404 Not Found
			ctx.notFound();
			assert.equal(ctx.responseStatusCode, 404);
			assert.equal(ctx.responseHeaders.get("content-type"), "text/plain");
			assert.equal(ctx.responseBody, "Not Found");
			assert.equal(ctx.responseHeaders.get("content-length"), "9");

			// Reset for next test
			ctx = new Context("GET", url, headers);

			// 404 with custom message
			ctx.notFound("Resource not found");
			assert.equal(ctx.responseStatusCode, 404);
			assert.equal(ctx.responseBody, "Resource not found");
			assert.equal(ctx.responseHeaders.get("content-length"), "18");

			// Reset for next test
			ctx = new Context("GET", url, headers);

			// 500 Internal Server Error
			ctx.error();
			assert.equal(ctx.responseStatusCode, 500);
			assert.equal(ctx.responseHeaders.get("content-type"), "text/plain");
			assert.equal(ctx.responseBody, "Internal Server Error");
			assert.equal(ctx.responseHeaders.get("content-length"), "21");

			// Reset for next test
			ctx = new Context("GET", url, headers);

			// 500 with custom message
			ctx.error("Something went wrong");
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
		it("should handle various edge cases", () => {
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
			ctx.text("");
			assert.equal(ctx.responseBody, "");
			assert.equal(ctx.responseHeaders.get("content-length"), "0");

			// Unicode content
			ctx.text("Hello 世界");
			assert.equal(ctx.responseBody, "Hello 世界");
			assert.equal(ctx.responseHeaders.get("content-length"), "12");
		});
	});
});
