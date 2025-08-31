/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://ravenjs.dev}
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://anonyfox.com}
 */

import assert from "node:assert";
import { describe, test } from "node:test";

import { Attempt } from "./attempt.js";

describe("Attempt", () => {
	test("creates attempt with URL string", () => {
		const attempt = new Attempt("https://example.com/page", 200, 150);

		assert(attempt.url instanceof URL);
		assert.strictEqual(attempt.url.href, "https://example.com/page");
		assert.strictEqual(attempt.statusCode, 200);
		assert.strictEqual(attempt.responseTime, 150);
		assert.strictEqual(typeof attempt.startTime, "number");
		assert.strictEqual(attempt.endTime, attempt.startTime + 150);
	});

	test("creates attempt with URL object", () => {
		const url = new URL("https://example.com/api");
		const attempt = new Attempt(url, 404, 75, 1000);

		assert.strictEqual(attempt.url, url);
		assert.strictEqual(attempt.statusCode, 404);
		assert.strictEqual(attempt.responseTime, 75);
		assert.strictEqual(attempt.startTime, 1000);
		assert.strictEqual(attempt.endTime, 1075);
	});

	test("isSuccess identifies 2xx status codes", () => {
		assert.strictEqual(
			new Attempt("https://example.com", 200, 100).isSuccess(),
			true,
		);
		assert.strictEqual(
			new Attempt("https://example.com", 201, 100).isSuccess(),
			true,
		);
		assert.strictEqual(
			new Attempt("https://example.com", 299, 100).isSuccess(),
			true,
		);
		assert.strictEqual(
			new Attempt("https://example.com", 300, 100).isSuccess(),
			false,
		);
		assert.strictEqual(
			new Attempt("https://example.com", 404, 100).isSuccess(),
			false,
		);
	});

	test("isRedirect identifies 3xx status codes", () => {
		assert.strictEqual(
			new Attempt("https://example.com", 299, 100).isRedirect(),
			false,
		);
		assert.strictEqual(
			new Attempt("https://example.com", 300, 100).isRedirect(),
			true,
		);
		assert.strictEqual(
			new Attempt("https://example.com", 301, 100).isRedirect(),
			true,
		);
		assert.strictEqual(
			new Attempt("https://example.com", 399, 100).isRedirect(),
			true,
		);
		assert.strictEqual(
			new Attempt("https://example.com", 400, 100).isRedirect(),
			false,
		);
	});

	test("isError identifies 4xx and 5xx status codes", () => {
		assert.strictEqual(
			new Attempt("https://example.com", 399, 100).isError(),
			false,
		);
		assert.strictEqual(
			new Attempt("https://example.com", 400, 100).isError(),
			true,
		);
		assert.strictEqual(
			new Attempt("https://example.com", 404, 100).isError(),
			true,
		);
		assert.strictEqual(
			new Attempt("https://example.com", 499, 100).isError(),
			true,
		);
		assert.strictEqual(
			new Attempt("https://example.com", 500, 100).isError(),
			true,
		);
		assert.strictEqual(
			new Attempt("https://example.com", 599, 100).isError(),
			true,
		);
	});

	test("getStatusText returns appropriate descriptions", () => {
		assert.strictEqual(
			new Attempt("https://example.com", 200, 100).getStatusText(),
			"Success",
		);
		assert.strictEqual(
			new Attempt("https://example.com", 301, 100).getStatusText(),
			"Redirect",
		);
		assert.strictEqual(
			new Attempt("https://example.com", 404, 100).getStatusText(),
			"Client Error",
		);
		assert.strictEqual(
			new Attempt("https://example.com", 500, 100).getStatusText(),
			"Server Error",
		);
	});

	test("fromResponse creates attempt from fetch Response", () => {
		// Mock fetch Response
		const mockResponse = {
			status: 201,
			url: "https://example.com/created",
		};

		const attempt = Attempt.fromResponse(
			"https://example.com/api",
			mockResponse,
			250,
			1500,
		);

		assert.strictEqual(attempt.url.href, "https://example.com/api");
		assert.strictEqual(attempt.statusCode, 201);
		assert.strictEqual(attempt.responseTime, 250);
		assert.strictEqual(attempt.startTime, 1500);
		assert.strictEqual(attempt.endTime, 1750);
		assert.strictEqual(attempt.isSuccess(), true);
	});

	test("toJSON returns complete representation", () => {
		const attempt = new Attempt("https://example.com/page", 302, 180, 2000);
		const json = attempt.toJSON();

		assert.deepStrictEqual(json, {
			url: "https://example.com/page",
			statusCode: 302,
			statusText: "Redirect",
			responseTime: 180,
			startTime: 2000,
			endTime: 2180,
		});
	});

	test("handles edge case status codes", () => {
		// Test boundary conditions
		const attempt100 = new Attempt("https://example.com", 100, 50);
		assert.strictEqual(attempt100.isSuccess(), false);
		assert.strictEqual(attempt100.isRedirect(), false);
		assert.strictEqual(attempt100.isError(), false);
		assert.strictEqual(attempt100.getStatusText(), "Unknown");

		const attempt600 = new Attempt("https://example.com", 600, 50);
		assert.strictEqual(attempt600.isSuccess(), false);
		assert.strictEqual(attempt600.isRedirect(), false);
		assert.strictEqual(attempt600.isError(), true);
		assert.strictEqual(attempt600.getStatusText(), "Server Error");
	});
});
