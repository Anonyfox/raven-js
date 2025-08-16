import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { Current } from "./current.js";
import { Feather } from "./feather.js";

describe("Feather", () => {
	it("should create feathers with all HTTP methods and handle options", () => {
		const handler = () => {};
		const middleware = [() => {}];
		const constraints = { id: "\\d+" };
		const description = "Get user by ID";

		// Test all HTTP methods
		const getFeather = Feather.GET("/users", handler);
		const postFeather = Feather.POST("/users", handler);
		const putFeather = Feather.PUT("/users/1", handler);
		const deleteFeather = Feather.DELETE("/users/1", handler);
		const patchFeather = Feather.PATCH("/users/1", handler);
		const headFeather = Feather.HEAD("/users", handler);
		const optionsFeather = Feather.OPTIONS("/users", handler);

		[
			getFeather,
			postFeather,
			putFeather,
			deleteFeather,
			patchFeather,
			headFeather,
			optionsFeather,
		].forEach((feather) => {
			assert.equal(feather.handler, handler);
			assert.deepEqual(feather.middleware, []);
			assert.deepEqual(feather.constraints, {});
			assert.equal(feather.description, "");
		});

		assert.equal(getFeather.method, "GET");
		assert.equal(postFeather.method, "POST");
		assert.equal(putFeather.method, "PUT");
		assert.equal(deleteFeather.method, "DELETE");
		assert.equal(patchFeather.method, "PATCH");
		assert.equal(headFeather.method, "HEAD");
		assert.equal(optionsFeather.method, "OPTIONS");

		// Test with options
		const featherWithOptions = Feather.GET("/users/:id", handler, {
			middleware,
			constraints,
			description,
		});

		assert.equal(featherWithOptions.method, "GET");
		assert.equal(featherWithOptions.path, "/users/:id");
		assert.equal(featherWithOptions.handler, handler);
		assert.deepEqual(featherWithOptions.middleware, middleware);
		assert.deepEqual(featherWithOptions.constraints, constraints);
		assert.equal(featherWithOptions.description, description);

		// Test partial options
		const featherPartial = Feather.POST("/users", handler, { middleware });
		assert.deepEqual(featherPartial.middleware, middleware);
		assert.deepEqual(featherPartial.constraints, {});
		assert.equal(featherPartial.description, "");

		// Test empty options
		const featherEmpty = Feather.GET("/users", handler, {});
		assert.deepEqual(featherEmpty.middleware, []);
		assert.deepEqual(featherEmpty.constraints, {});
		assert.equal(featherEmpty.description, "");
	});

	it("should handle instance properties and edge cases", () => {
		// Test constructor and defaults
		const feather = new Feather();
		assert(feather instanceof Feather);
		assert.equal(feather.method, "GET");
		assert.equal(feather.path, "");
		assert.equal(typeof feather.handler, "function");
		assert.deepEqual(feather.middleware, []);
		assert.deepEqual(feather.constraints, {});
		assert.equal(feather.description, "");

		// Test default handler
		const mockCurrent = new Current(
			"GET",
			new URL("https://example.com/"),
			new Headers(),
			null,
		);
		const result = feather.handler(mockCurrent);
		assert.equal(result, undefined);

		// Test property modification
		const handler = () => {};
		feather.method = "POST";
		feather.path = "/custom";
		feather.handler = handler;
		feather.middleware = [() => {}];
		feather.constraints = { custom: "value" };
		feather.description = "Custom route";

		assert.equal(feather.method, "POST");
		assert.equal(feather.path, "/custom");
		assert.equal(feather.handler, handler);
		assert.equal(feather.middleware.length, 1);
		assert.deepEqual(feather.constraints, { custom: "value" });
		assert.equal(feather.description, "Custom route");

		// Test edge cases
		const emptyPath = Feather.GET("", handler);
		assert.equal(emptyPath.path, "");
		assert.equal(emptyPath.handler, handler);

		const complexPath = Feather.GET(
			"/users/:id/posts/:postId/comments",
			handler,
		);
		assert.equal(complexPath.path, "/users/:id/posts/:postId/comments");
		assert.equal(complexPath.handler, handler);
	});
});
