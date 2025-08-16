import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { Context } from "./context.js";
import { HTTP_METHODS } from "./http-methods.js";
import { Route } from "./route.js";

describe("Route", () => {
	it("should create routes with all HTTP methods and handle options", () => {
		const handler = () => {};
		const middleware = [() => {}];
		const constraints = { id: "\\d+" };
		const description = "Get user by ID";

		// Test all HTTP methods
		const getRoute = Route.GET("/users", handler);
		const postRoute = Route.POST("/users", handler);
		const putRoute = Route.PUT("/users/1", handler);
		const deleteRoute = Route.DELETE("/users/1", handler);
		const patchRoute = Route.PATCH("/users/1", handler);
		const headRoute = Route.HEAD("/users", handler);
		const optionsRoute = Route.OPTIONS("/users", handler);

		[
			getRoute,
			postRoute,
			putRoute,
			deleteRoute,
			patchRoute,
			headRoute,
			optionsRoute,
		].forEach((route) => {
			assert.equal(route.handler, handler);
			assert.deepEqual(route.middleware, []);
			assert.deepEqual(route.constraints, {});
			assert.equal(route.description, "");
		});

		assert.equal(getRoute.method, HTTP_METHODS.GET);
		assert.equal(postRoute.method, HTTP_METHODS.POST);
		assert.equal(putRoute.method, HTTP_METHODS.PUT);
		assert.equal(deleteRoute.method, HTTP_METHODS.DELETE);
		assert.equal(patchRoute.method, HTTP_METHODS.PATCH);
		assert.equal(headRoute.method, HTTP_METHODS.HEAD);
		assert.equal(optionsRoute.method, HTTP_METHODS.OPTIONS);

		// Test with options
		const routeWithOptions = Route.GET("/users/:id", handler, {
			middleware,
			constraints,
			description,
		});

		assert.equal(routeWithOptions.method, HTTP_METHODS.GET);
		assert.equal(routeWithOptions.path, "/users/:id");
		assert.equal(routeWithOptions.handler, handler);
		assert.deepEqual(routeWithOptions.middleware, middleware);
		assert.deepEqual(routeWithOptions.constraints, constraints);
		assert.equal(routeWithOptions.description, description);

		// Test partial options
		const routePartial = Route.POST("/users", handler, { middleware });
		assert.deepEqual(routePartial.middleware, middleware);
		assert.deepEqual(routePartial.constraints, {});
		assert.equal(routePartial.description, "");

		// Test empty options
		const routeEmpty = Route.GET("/users", handler, {});
		assert.deepEqual(routeEmpty.middleware, []);
		assert.deepEqual(routeEmpty.constraints, {});
		assert.equal(routeEmpty.description, "");
	});

	it("should handle instance properties and edge cases", () => {
		// Test constructor and defaults
		const route = new Route();
		assert(route instanceof Route);
		assert.equal(route.method, HTTP_METHODS.GET);
		assert.equal(route.path, "");
		assert.equal(typeof route.handler, "function");
		assert.deepEqual(route.middleware, []);
		assert.deepEqual(route.constraints, {});
		assert.equal(route.description, "");

		// Test default handler
		const mockCtx = new Context(
			"GET",
			new URL("https://example.com/"),
			new Headers(),
			null,
		);
		const result = route.handler(mockCtx);
		assert.equal(result, undefined);

		// Test property modification
		const handler = () => {};
		route.method = HTTP_METHODS.POST;
		route.path = "/custom";
		route.handler = handler;
		route.middleware = [() => {}];
		route.constraints = { custom: "value" };
		route.description = "Custom route";

		assert.equal(route.method, HTTP_METHODS.POST);
		assert.equal(route.path, "/custom");
		assert.equal(route.handler, handler);
		assert.equal(route.middleware.length, 1);
		assert.deepEqual(route.constraints, { custom: "value" });
		assert.equal(route.description, "Custom route");

		// Test edge cases
		const emptyPath = Route.GET("", handler);
		assert.equal(emptyPath.path, "");
		assert.equal(emptyPath.handler, handler);

		const complexPath = Route.GET("/users/:id/posts/:postId/comments", handler);
		assert.equal(complexPath.path, "/users/:id/posts/:postId/comments");
		assert.equal(complexPath.handler, handler);
	});
});
