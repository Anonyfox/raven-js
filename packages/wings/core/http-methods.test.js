import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import {
	getHttpMethods,
	HTTP_METHODS,
	HTTP_METHODS_LIST,
	isValidHttpMethod,
} from "./http-methods.js";

describe("HTTP Methods", () => {
	it("should export all standard HTTP methods", () => {
		assert.deepEqual(HTTP_METHODS, {
			GET: "GET",
			POST: "POST",
			PUT: "PUT",
			DELETE: "DELETE",
			PATCH: "PATCH",
			HEAD: "HEAD",
			OPTIONS: "OPTIONS",
		});
	});

	it("should provide HTTP_METHODS_LIST as array of values", () => {
		assert.deepEqual(HTTP_METHODS_LIST, [
			"GET",
			"POST",
			"PUT",
			"DELETE",
			"PATCH",
			"HEAD",
			"OPTIONS",
		]);
	});

	it("should validate HTTP methods correctly", () => {
		// Valid methods
		assert.equal(isValidHttpMethod("GET"), true);
		assert.equal(isValidHttpMethod("POST"), true);
		assert.equal(isValidHttpMethod("PUT"), true);
		assert.equal(isValidHttpMethod("DELETE"), true);
		assert.equal(isValidHttpMethod("PATCH"), true);
		assert.equal(isValidHttpMethod("HEAD"), true);
		assert.equal(isValidHttpMethod("OPTIONS"), true);

		// Invalid methods
		assert.equal(isValidHttpMethod("get"), false);
		assert.equal(isValidHttpMethod("POSTS"), false);
		assert.equal(isValidHttpMethod(""), false);
		assert.equal(isValidHttpMethod("TRACE"), false);
		assert.equal(isValidHttpMethod("CONNECT"), false);
		assert.equal(isValidHttpMethod("CUSTOM"), false);
	});

	it("should return copy of HTTP methods list", () => {
		const methods = getHttpMethods();
		assert.deepEqual(methods, HTTP_METHODS_LIST);

		// Should be a copy, not the same reference
		assert.notEqual(methods, HTTP_METHODS_LIST);

		// Modifying the returned array shouldn't affect the original
		methods.push("INVALID");
		assert.equal(HTTP_METHODS_LIST.length, 7);
		assert.equal(methods.length, 8);
	});

	it("should have consistent method count", () => {
		assert.equal(HTTP_METHODS_LIST.length, 7);
		assert.equal(Object.keys(HTTP_METHODS).length, 7);
		assert.equal(getHttpMethods().length, 7);
	});
});
